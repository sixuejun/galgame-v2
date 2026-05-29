import { mountStreamingMessages } from '@util/streaming';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import './styles/theme.css';
import { extractContentTag, extractDanmakuBlock, extractPlainTextFromContent } from './utils/messageParser';
import { createVNLogger } from './utils/vnLogger';

const vnLog = createVNLogger('[VN]');

declare global {
  interface Window {
    __galgameState?: {
      activeGenerationMesId: number | null;
      mainStore: {
        triggerDanmakuForMessage: (message_id: number) => Promise<void>;
        displayDanmakuFromMessage: (message: string) => void;
        settings: {
          danmakuEnabled: boolean;
          imageGenEnabled: boolean;
          backgroundGenEnabled: boolean;
          cgGenEnabled: boolean;
          apiTaskDanmaku: 'main' | 'second' | 'disabled';
          apiTaskImageTag: 'main' | 'second' | 'disabled';
          imageGenPriority: 'cg' | 'background';
        };
        requestBackgroundImage: (prompt: string) => void;
        requestCgImage: (prompt: string) => void;
        pushDanmaku: (texts: string[]) => void;
        callSecondApi: (task: string, payload: any) => Promise<string[] | string>;
        appendNewMessage: (messageId: number) => Promise<void>;
        updateDialogueUnit: (messageId: number) => Promise<void>;
      } | null;
    };
  }
}

$(() => {
  vnLog.info('init', 'script entry loaded');
  window.__galgameState = {
    activeGenerationMesId: null,
    mainStore: null,
  };

  const { unmount } = mountStreamingMessages(() => createApp(App).use(createPinia()), {
    host: 'iframe',
    filter: message_id => message_id === 0,
  });

  eventOn(tavern_events.STREAM_TOKEN_RECEIVED, () => {
    vnLog.count('STREAM_TOKEN_RECEIVED');
    const mesid = $('#chat').children('.mes.last_mes').attr('mesid');
    if (mesid != null && mesid !== '') window.__galgameState!.activeGenerationMesId = Number(mesid);
  });

  let generationEndedDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  const GENERATION_ENDED_DEBOUNCE_MS = 300;

  eventOn(tavern_events.GENERATION_ENDED, (message_id: number) => {
    vnLog.count('GENERATION_ENDED');
    vnLog.info('generationEnded', 'generation ended', { message_id, activeGenerationMesId: window.__galgameState?.activeGenerationMesId });
    const state = window.__galgameState;
    if (!state) return;
    if (state.activeGenerationMesId != null) {
      if (message_id !== state.activeGenerationMesId) return;
      state.activeGenerationMesId = null;
      triggerDanmakuAndImageGen(message_id, state.mainStore);
      return;
    }
    const fallbackMesId = Number($('#chat').children('.mes.last_mes').attr('mesid'));
    if (Number.isNaN(fallbackMesId) || fallbackMesId !== message_id) return;
    if (generationEndedDebounceTimer != null) return;
    generationEndedDebounceTimer = setTimeout(() => {
      generationEndedDebounceTimer = null;
    }, GENERATION_ENDED_DEBOUNCE_MS);
    triggerDanmakuAndImageGen(message_id, state.mainStore);
  });

  // 新楼层生成完毕，追加到 dialogues
  eventOn(tavern_events.GENERATION_ENDED, async (message_id: number) => {
    vnLog.count('GENERATION_ENDED_appendNewMessage');
    const state = window.__galgameState;
    if (!state?.mainStore) return;
    vnLog.info('messageRendered', 'append new message (generation ended)', { message_id });
    await state.mainStore.appendNewMessage(message_id);
  });

  // 任意楼层被修改（编辑/swipe/regenerate），更新 dialogues 中对应楼层
  eventOn(tavern_events.MESSAGE_UPDATED, async (message_id: number) => {
    vnLog.count('MESSAGE_UPDATED');
    const state = window.__galgameState;
    if (!state?.mainStore) return;
    vnLog.info('messageUpdated', 'message updated; refreshing dialogue unit', { message_id });
    await state.mainStore.updateDialogueUnit(message_id);
  });

  // 用户发送消息后，确保新楼层被追加到 dialogues
  eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, async (message_id: number, _type: string) => {
    vnLog.count('CHARACTER_MESSAGE_RENDERED');
    const state = window.__galgameState;
    if (!state?.mainStore) return;
    vnLog.info('messageRendered', 'append new message (character message rendered)', { message_id, type: _type });
    await state.mainStore.appendNewMessage(message_id);
  });

  /** 合并弹幕和生图为一次第二API调用 */
  async function triggerDanmakuAndImageGen(
    message_id: number,
    mainStore: {
      settings: {
        danmakuEnabled: boolean;
        imageGenEnabled: boolean;
        backgroundGenEnabled: boolean;
        cgGenEnabled: boolean;
        apiTaskDanmaku: 'main' | 'second' | 'disabled';
        apiTaskImageTag: 'main' | 'second' | 'disabled';
        imageGenPriority: 'cg' | 'background';
      };
      requestBackgroundImage: (p: string) => void;
      requestCgImage: (p: string) => void;
      pushDanmaku: (texts: string[]) => void;
      displayDanmakuFromMessage: (message: string) => void;
      callSecondApi: (task: string, payload: { contentText: string }) => Promise<string[] | string>;
    } | null,
  ) {
    if (!mainStore) return;

    const messages = getChatMessages(message_id);
    const raw = messages[0]?.message ?? '';
    const contentText = extractContentTag(raw);
    if (!contentText) return;

    // 同步剧情文本到酒馆变量，供 {{getvar::剧情文本}} 使用
    const plainText = extractPlainTextFromContent(raw);
    if (plainText) {
      insertOrAssignVariables({ 剧情文本: plainText }, { type: 'chat' });
      vnLog.info('parser', '剧情文本 variable updated', { length: plainText.length });
    }

    // ========== 弹幕处理 ==========
    // 弹幕处理流程：
    // 1. 先检查消息中是否已有 <dm> 标签（第二API已写入的情况）
    // 2. 如果没有，则根据 apiTaskDanmaku 配置决定如何生成弹幕

    // 检查消息中是否已有 <dm> 标签
    const existingDanmaku = extractDanmakuBlock(raw);
    if (existingDanmaku.length > 0) {
      vnLog.info('secondApi', 'found existing <dm> in message; skipping generation', { count: existingDanmaku.length });
      mainStore.displayDanmakuFromMessage(raw);
      // 第二API的弹幕已写入，不需要再次调用
      return;
    }

    // 消息中没有 <dm> 标签，根据配置决定如何处理
    if (!mainStore.settings.danmakuEnabled) {
      // 弹幕功能未开启
      return;
    }

    if (mainStore.settings.apiTaskDanmaku === 'disabled') {
      // 弹幕任务被禁用
      return;
    }

    // 检查是否需要生图
    const needImageGen = mainStore.settings.imageGenEnabled && mainStore.settings.apiTaskImageTag === 'second';

    // 如果弹幕和生图都需要第二API，尝试合并调用
    if (mainStore.settings.apiTaskDanmaku === 'second' && needImageGen) {
      try {
        const result = (await mainStore.callSecondApi('danmakuAndImageGen', {
          contentText,
        })) as string;

        console.info('[DanmakuAndImageGen] Raw result:', result);

        // 解析结果，提取弹幕和生图标签
        // 假设格式为：弹幕行在前，最后一行是生图标签（以特殊标记开头，如 "IMAGE_TAG:"）
        const lines = result
          .split(/\n/)
          .map(s => s.trim())
          .filter(Boolean);
        const danmakuLines: string[] = [];
        let imageTag = '';

        for (const line of lines) {
          if (line.startsWith('IMAGE_TAG:') || line.startsWith('生图标签:')) {
            imageTag = line.replace(/^(IMAGE_TAG:|生图标签:)\s*/, '');
          } else {
            danmakuLines.push(line);
          }
        }

        // 如果没有找到特殊标记，则最后一行作为生图标签，其余作为弹幕
        if (!imageTag && lines.length > 0) {
          imageTag = lines[lines.length - 1];
          danmakuLines.length = 0;
          danmakuLines.push(...lines.slice(0, -1));
        }

        let dmTag = '';
        // 处理弹幕：写入 <dm> 标签到消息楼层，然后显示
        if (danmakuLines.length > 0) {
          dmTag = `<dm>${danmakuLines.join('|')}</dm>`;
          const updatedMessage = messages[0].message + '\n' + dmTag;
          await setChatMessages([{ ...messages[0], message: updatedMessage }]);
          mainStore.displayDanmakuFromMessage(updatedMessage);
          console.info('[弹幕] 第二API弹幕已写入消息楼层并显示:', danmakuLines.length, '条');
        }

        // 处理生图
        if (imageTag) {
          console.info('[ImageGen] Generated tags via second API:', imageTag);

          const imageType = determineImageType(raw, mainStore.settings);
          if (imageType === 'background') {
            mainStore.requestBackgroundImage(imageTag);
          } else if (imageType === 'cg') {
            mainStore.requestCgImage(imageTag);
          } else if (imageType === 'both') {
            const priority = mainStore.settings.imageGenPriority;
            if (priority === 'cg') {
              mainStore.requestCgImage(imageTag);
            } else {
              mainStore.requestBackgroundImage(imageTag);
            }
          }

          // 将第二API内容写入消息末尾
          const marker = `\n<!-- 第二API生成: 弹幕${danmakuLines.length}条, 生图tag: ${imageTag} -->`;
          const finalMessage = messages[0].message + '\n' + dmTag + marker;
          await setChatMessages([{ ...messages[0], message: finalMessage }]);
        }
      } catch (e) {
        console.error('[DanmakuAndImageGen] Failed:', e);
      }
      return;
    }

    // 只处理弹幕（不需要生图或生图使用主API）
    if (mainStore.settings.apiTaskDanmaku === 'second') {
      try {
        const lines = (await mainStore.callSecondApi('danmaku', { contentText })) as string[];
        if (lines.length === 0) return;

        // 将弹幕写入 <dm> 标签
        const dmTag = `<dm>${lines.join('|')}</dm>`;
        const updatedMessage = messages[0].message + '\n' + dmTag;
        await setChatMessages([{ ...messages[0], message: updatedMessage }]);
        mainStore.displayDanmakuFromMessage(updatedMessage);
        console.info('[弹幕] 第二API弹幕已写入消息楼层并显示:', lines.length, '条');
      } catch (e) {
        console.error('[Danmaku] Failed:', e);
      }
    }
  }

  /**
   * 判断图片类型和插入位置
   * 规则：
   * 1. 如果出现 CG场景块（如 [[character||角色名：xxx||CG场景：xxx||台词：xxx]]），优先判定为生成 CG
   * 2. 否则，如果出现场景变化（如 [[character||角色名：xxx||场景：xxx]]），判定为生成背景
   * 3. 若两者都存在，让用户自行设置（目前默认CG优先）
   * @returns 'background' | 'cg' | 'both' | null
   */
  function determineImageType(
    message: string,
    settings: {
      backgroundGenEnabled: boolean;
      cgGenEnabled: boolean;
    },
  ): 'background' | 'cg' | 'both' | null {
    const bgEnabled = settings.backgroundGenEnabled;
    const cgEnabled = settings.cgGenEnabled;

    if (!bgEnabled && !cgEnabled) return null;
    if (bgEnabled && !cgEnabled) return 'background';
    if (!bgEnabled && cgEnabled) return 'cg';

    // 两者都开启时，根据消息内容判断
    if (bgEnabled && cgEnabled) {
      // 检测 CG场景块
      const hasCGScene = /\[\[character\|\|[^\]]*CG场景[:：][^\]]*\]\]/i.test(message);

      // 检测场景变化（但不是CG场景）
      const hasSceneChange = /\[\[character\|\|[^\]]*场景[:：][^\]]*\]\]/i.test(message) && !hasCGScene;

      if (hasCGScene && hasSceneChange) {
        // 两者都存在，默认CG优先（用户可在设置中调整）
        return 'both';
      } else if (hasCGScene) {
        return 'cg';
      } else if (hasSceneChange) {
        return 'background';
      }

      // 都没有明确标识，默认生成背景
      return 'background';
    }

    return null;
  }

  $(window).on('pagehide', () => unmount());
});
