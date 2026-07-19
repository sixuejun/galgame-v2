import { mountStreamingMessages } from '@util/streaming';
import _ from 'lodash';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import type { SecondApiConfig } from './store';
import './styles/theme.css';
import {
  extractContentTag,
  extractDanmakuBlock,
  extractFormattedPlotText,
  sanitizeSecondApiOutput,
  wrapContentTag,
} from './utils/messageParser';
import { initRoleScanner, manualFullScan } from './utils/roleScanner';
import { startVersionChecker } from './utils/versionChecker';
import { createVNLogger } from './utils/vnLogger';

/**
 * 当前脚本构建版本号。
 *
 * 每次发布到 GitHub 之前手动改一下这个常量（或在 build 钩子里自动写入）。
 * 远端的 jsDelivr 上需要有一个 dist/galgame/version.json，其内容形如：
 *   { "version": "2026-07-20-r3" }
 *
 * 脚本启动时会去 fetch 这个 JSON，与本常量对比：
 * - 不一致 → 说明 jsDelivr 已经同步了新代码，window.location.reload() 拉取最新代码
 * - 一致   → 已是最新
 *
 * 这给开发者提供了一个简单可靠的方式去诊断"jsDelivr 是否已经同步我的最新 commit"。
 */
const BUILD_VERSION = '2026-07-20-r3';
const vnLog = createVNLogger('[VN]');

// ============================================================
// 顶层兜底：脚本加载到酒馆后第一帧就把 __vnDebug 挂到 window，
// 避免热重载 / 框架时序导致控制台拿到 "is not defined"。
// 等主初始化 ($(() => {})) 跑完，再覆盖为完整实现。
// ============================================================
const debugStub = (...args: unknown[]) => console.warn('[__vnDebug] 脚本尚未初始化完成，请在 ~1 秒后重试', ...args);

(window as any).__vnDebug = {
  dumpDanmakuPrompts: (...args: unknown[]) => debugStub('dumpDanmakuPrompts', args),
  dumpDanmakuPromptsOnLatestFloor: (...args: unknown[]) => debugStub('dumpDanmakuPromptsOnLatestFloor', args),
  simulateGenerationEnded: (...args: unknown[]) => debugStub('simulateGenerationEnded', args),
  simulateGenerationEndedOnLatestFloor: (...args: unknown[]) => debugStub('simulateGenerationEndedOnLatestFloor', args),
  testSecondApiTask: (...args: unknown[]) => debugStub('testSecondApiTask', args),
  manualGenerateDanmaku: (...args: unknown[]) => debugStub('manualGenerateDanmaku', args),
  manualGenerateImageTags: (...args: unknown[]) => debugStub('manualGenerateImageTags', args),
  manualStripLatestTags: (...args: unknown[]) => debugStub('manualStripLatestTags', args),
};
console.info('[__vnDebug] stub 已挂在 window 上，等主初始化完成后会替换为完整实现');

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
        callSecondApi: (config: SecondApiConfig) => Promise<string[] | string>;
        appendNewMessage: (messageId: number) => Promise<void>;
        updateDialogueUnit: (messageId: number) => Promise<void>;
        // 过场系统
        atLastBlock: boolean;
        transitionActive: boolean;
        transitionPhase: 'idle' | 'streaming' | 'danmaku' | 'image' | 'done';
        enterTransition: (phase?: 'streaming' | 'danmaku' | 'image') => void;
        setTransitionPhase: (phase: 'streaming' | 'danmaku' | 'image' | 'done') => void;
        beginSecondApi: () => void;
        endSecondApi: () => void;
        beginMainApi: () => void;
        endMainApi: () => void;
        requestNextBlockTransition: (origin?: 'navigateBlock' | 'generationEnded') => void;
        applyMainApiWorldbookFilter: () => Promise<() => Promise<void>>;
      } | null;
      /** 角色系统就绪标志 */
      roleSystemReady?: boolean;
    };
    /** 角色系统就绪标志（供外部检查） */
    __roleSystemReady?: boolean;
  }
}

$(() => {
  vnLog.info('init', 'script entry loaded');
  window.__galgameState = {
    activeGenerationMesId: null,
    mainStore: null,
    roleSystemReady: false,
  };

  // 共享 pinia：所有 StreamingMessages 挂载的 App + 顶层调试都用同一份 store 状态。
  // 必须用 `createPinia()` 一次，让 `useVNStore()` 在不同上下文里拿到同一个 store。
  // 否则会出现：
  //   - App 内部的 transitionActive 和顶层 __galgameState.mainStore.transitionActive 不同步
  //   - 顶层 enterTransition 触发过场，但 App 内的过场遮罩不显示
  //   - "过场动画看不见"的根因
  const sharedPinia = createPinia();

  const { unmount } = mountStreamingMessages(() => createApp(App).use(sharedPinia), {
    host: 'iframe',
    // 同层界面：只在第 0 层挂载一个 App 实例。
    // 其他楼层保持酒馆原生文本显示，不挂 streaming iframe / 不创建第二个 App.vue。
    filter: message_id => message_id === 0,
  });

  // ====== 版本检查：远端 jsDelivr 上的版本与本地 BUILD_VERSION 对比 ======
  // 把 store 初始化时把 local 写为 BUILD_VERSION，避免设置面板一开始就显示 'unknown'。
  try {
    const initialStore = (window as any).__galgameState?.mainStore;
    if (initialStore?.setVersionState) {
      initialStore.setVersionState({
        local: BUILD_VERSION,
        remote: null,
        status: 'unknown',
        lastCheckedAt: null,
        lastError: null,
      });
    }
  } catch {
    // store 可能尚未挂载（mountStreamingMessages 是同步的，但保险起见这里包一层 try）
  }

  let _versionCheckerStop: (() => void) | null = null;
  // 等 store 挂载后启动版本检查器。
  // store 挂在 `setMainStore(...)` 调用时设置；通过反复检测兜底。
  const tryStartVersionChecker = (attempts = 0): void => {
    const storeRef = (window as any).__galgameState?.mainStore as
      | {
          setVersionState: (s: any) => void;
          showToast?: (msg: string) => void;
        }
      | null;
    if (storeRef?.setVersionState) {
      _versionCheckerStop = startVersionChecker({
        localVersion: BUILD_VERSION,
        onState: state => storeRef.setVersionState(state),
        onNeedReload: remote => {
          // 远端版本更新 → 提示用户后整页刷新
          console.info(
            '[version-check] 检测到新版本，本地=%s 远端=%s，准备 reload',
            BUILD_VERSION,
            remote.version,
          );
          try {
            storeRef.showToast?.(`检测到新版本 ${remote.version}，正在刷新以加载最新代码…`);
          } catch {}
          // 1.2 秒延迟，让 toast 有机会被玩家看到
          setTimeout(() => {
            try {
              window.location.reload();
            } catch (err) {
              console.error('[version-check] reload 失败：', err);
            }
          }, 1200);
        },
      });
      return;
    }
    if (attempts < 50) {
      setTimeout(() => tryStartVersionChecker(attempts + 1), 100);
    } else {
      console.warn('[version-check] store 长时间未挂载，放弃启动版本检查器');
    }
  };
  tryStartVersionChecker();

  // Initialize role system scanner after streaming and store are ready
  function initRoleSystem(): void {
    try {
      initRoleScanner();
      console.info('[VN] Role system scanner initialized');
      window.__galgameState!.roleSystemReady = true;
      window.__roleSystemReady = true;
    } catch (e) {
      console.warn('[VN] Role system scanner init failed:', e);
    }
  }

  // Defer role system init to ensure store is ready
  setTimeout(() => {
    initRoleSystem();
  }, 100);

  /**
   * 酒馆主 API 流式生成时持续触发 STREAM_TOKEN_RECEIVED；
   * 这里维护 `activeGenerationMesId`（当前正在被流式生成的楼层 id）。
   *
   * `GENERATION_ENDED` 主判定改为"对比 .last_mes 与传入的 message_id"，
   * 不再依赖本字段；本监听器仅为兼容历史代码保留。
   */
  eventOn(tavern_events.STREAM_TOKEN_RECEIVED, () => {
    const mesid = $('#chat').children('.mes.last_mes').attr('mesid');
    if (mesid != null && mesid !== '') window.__galgameState!.activeGenerationMesId = Number(mesid);
  });

  // ====== 主 API 世界书过滤 ======
  // 在主 API 生成前临时禁用"只发第二 API"的条目，生成后恢复。
  //
  // 兜底机制：
  //   GENERATION_ENDED 是酒馆的标准事件，但在某些情况下（生成失败、用户直接关掉标签、
  //   浏览器卡死、酒馆版本差异……）可能不触发。为了避免条目停留在 disabled，
  //   我们注册多个兜底触发点：
  //     1. tavern_events.GENERATION_ENDED（主路径）
  //     2. tavern_events.GENERATION_STOPPED（用户主动停止）
  //     3. tavern_events.MESSAGE_RECEIVED（酒馆收到 AI 回复时必然触发，最稳）
  //     4. CHARACTER_MESSAGE_RENDERED（消息渲染后，兜底再触发一次）
  //     5. 30 秒超时：apply 后启动一个定时器，若仍未恢复则强制恢复
  //   恢复函数本身是幂等的（_restoreMainApiWorldbook 被置为 null 前只能触发一次），
  //   所以多次调用是安全的。

  let _restoreMainApiWorldbook: (() => Promise<void>) | null = null;
  let _restoreFallbackTimer: ReturnType<typeof setTimeout> | null = null;

  function clearFallbackTimer(): void {
    if (_restoreFallbackTimer != null) {
      clearTimeout(_restoreFallbackTimer);
      _restoreFallbackTimer = null;
    }
  }

  /**
   * 触发 restore 函数（如果还存在）。所有兜底事件都走这个函数，
   * 以保证多个事件触发时只执行一次真正的恢复（restore 后 _restoreMainApiWorldbook 置 null）。
   */
  async function tryRestoreWorldbook(triggerLabel: string): Promise<void> {
    if (!_restoreMainApiWorldbook) return;
    clearFallbackTimer();
    const restore = _restoreMainApiWorldbook;
    _restoreMainApiWorldbook = null;
    console.info('[VN] 主 API 世界书过滤已恢复（%s）', triggerLabel);
    try {
      await restore();
    } catch (err) {
      console.error('[VN] 主 API 世界书过滤恢复过程中发生未捕获异常（%s）', triggerLabel, err);
    }
    const mainStore = window.__galgameState?.mainStore;
    if (mainStore) mainStore.endMainApi();
  }

  // GENERATION_STARTED：主 API 开始生成时，禁用只发第二 API 的条目
  eventOn(tavern_events.GENERATION_STARTED, async (type: string) => {
    console.info('[VN] GENERATION_STARTED 收到 type=%s', type);

    // 跳过 quiet / impersonate 等非主 API 生成类型
    if (type === 'quiet' || type === 'impersonate' || type === 'command' || type === 'extension') {
      return;
    }

    // 恢复上一轮的改动（如果还没恢复的话）
    if (_restoreMainApiWorldbook) {
      console.info('[VN] 恢复上一轮遗留的过滤');
      const prev = _restoreMainApiWorldbook;
      _restoreMainApiWorldbook = null;
      try {
        await prev();
      } catch (err) {
        console.error('[VN] 上一轮 restore 异常', err);
      }
      clearFallbackTimer();
    }

    // 应用新的过滤
    const mainStore = window.__galgameState?.mainStore;
    if (!mainStore) return;
    _restoreMainApiWorldbook = await mainStore.applyMainApiWorldbookFilter();
    console.info('[VN] 主 API 世界书过滤已应用，restore 函数已注册');

    // 标记主 API 正在生成
    mainStore.beginMainApi();

    // 兜底定时器：30 秒后如果还没触发恢复，强制恢复。
    // 30 秒足够让一次正常的 LLM 回复完成；若超时说明事件链断了。
    clearFallbackTimer();
    _restoreFallbackTimer = setTimeout(() => {
      void tryRestoreWorldbook('30秒超时兜底');
    }, 30_000);
  });

  // GENERATION_ENDED：主 API 生成结束时，恢复条目
  eventOn(tavern_events.GENERATION_ENDED, async (message_id: number) => {
    await tryRestoreWorldbook(`GENERATION_ENDED 消息 ${message_id}`);
  });

  // GENERATION_STOPPED：主 API 生成被中止时也要恢复条目
  eventOn(tavern_events.GENERATION_STOPPED, async () => {
    await tryRestoreWorldbook('GENERATION_STOPPED');
  });

  // 兜底 1：MESSAGE_RECEIVED —— 酒馆收到 AI 回复时必然触发，比 GENERATION_ENDED 更稳
  eventOn(tavern_events.MESSAGE_RECEIVED, async (message_id: number) => {
    await tryRestoreWorldbook(`MESSAGE_RECEIVED 消息 ${message_id}`);
  });

  // 兜底 2：CHARACTER_MESSAGE_RENDERED —— 消息渲染后再保险一次
  eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, async (message_id: number) => {
    await tryRestoreWorldbook(`CHARACTER_MESSAGE_RENDERED 消息 ${message_id}`);
  });

  /** 同步剧情文本到当前楼层的 MVU 变量（stat_data.剧情文本） */
  async function syncPlotText(message_id: number): Promise<void> {
    try {
      const messages = getChatMessages(message_id);
      const raw = messages[0]?.message ?? '';
      const contentText = extractContentTag(raw);

      if (!contentText) {
        vnLog.info('parser', '剧情文本同步跳过：无 <content> 标签', { message_id });
        return;
      }

      const plainText = extractFormattedPlotText(raw);
      vnLog.info('parser', '剧情文本同步', {
        message_id,
        plainTextLen: plainText.length,
        plainTextSample: plainText.slice(0, 80),
      });

      if (!plainText) return;

      // 关键：必须等待 Mvu 全局对象初始化完毕后再写入，
      // 以避免与 MVU 框架的 <update> 处理产生竞态导致剧情文本被覆盖。
      await waitGlobalInitialized('Mvu');

      // 使用 Mvu.getMvuData / replaceMvuData 而非 getVariables/replaceVariables，
      // 这样在 <update> 处理完成后再写入剧情文本，不会被 MVU 的整体更新覆盖。
      const currentData = Mvu.getMvuData({ type: 'message', message_id }) || {};
      const statData = _.get(currentData, 'stat_data', {}) || {};
      _.set(statData, '剧情文本', plainText);
      await Mvu.replaceMvuData({ ...currentData, stat_data: statData }, { type: 'message', message_id });

      vnLog.info('parser', '剧情文本 MVU variable updated', { message_id, length: plainText.length });
    } catch (err) {
      vnLog.warn('parser', '剧情文本同步失败', { message_id, err });
    }
  }

  // 在 VARIABLE_UPDATE_ENDED 钩子里，把剧情文本写入到 variables 参数中。
  // 由于 MVU 会将所有钩子回调最终修改后的 variables 写入到楼层变量，
  // 这里对 variables.stat_data 的修改能正确生效，不会被覆盖。
  // 同时 VARIABLE_UPDATE_ENDED 的回调参数中没有 message_id，
  // 但 Mvu.update 必定作用在某条具体的 message 上，我们保守地用最后一条消息的 id。
  waitGlobalInitialized('Mvu').then(() => {
    eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, (variables: Mvu.MvuData) => {
      try {
        const lastId = getLastMessageId();
        if (typeof lastId !== 'number') return;
        const messages = getChatMessages(lastId);
        const raw = messages[0]?.message ?? '';
        if (!/<content>/i.test(raw)) return;

        const plainText = extractFormattedPlotText(raw);
        if (!plainText) return;

        // 直接修改 MVU 给的 variables 对象，让 MVU 框架在所有钩子结束后统一写入。
        // 这是 MVU 推荐的修改方式，能避免竞态。
        if (!variables.stat_data || typeof variables.stat_data !== 'object') {
          variables.stat_data = {};
        }
        _.set(variables.stat_data, '剧情文本', plainText);

        vnLog.info('parser', '剧情文本 MVU-after 同步', {
          lastId,
          length: plainText.length,
        });
      } catch (e) {
        vnLog.warn('parser', 'VARIABLE_UPDATE_ENDED 钩子失败', { e });
      }
    });
    vnLog.info('init', '剧情文本 MVU-after 监听已注册');

    // 初始化：检查最后一条消息的剧情文本变量是否为空，如果为空则补同步一次。
    // 这解决了历史楼层（加载时已存在的）剧情文本为空的回填问题。
    try {
      const lastId = getLastMessageId();
      if (typeof lastId !== 'number') return;
      const currentData = Mvu.getMvuData({ type: 'message', message_id: lastId }) || {};
      const statData = _.get(currentData, 'stat_data', {}) || {};
      const currentPlotText = _.get(statData, '剧情文本', '');
      if (typeof currentPlotText !== 'string' || currentPlotText.length === 0) {
        vnLog.info('parser', '剧情文本为空，初始化时补同步', { lastId });
        void syncPlotText(lastId);
      }
    } catch (e) {
      vnLog.warn('parser', '剧情文本初始化补同步失败', { e });
    }
  });

  // 用户消息发送（自定义输入 / 选项点击后实际发的 user 消息）—— 进入虚拟块
  // 等生成 + 弹幕 + 生图 tag 完成后，光标跳到下一真实块。
  eventOn(tavern_events.MESSAGE_SENT, (message_id: number) => {
    vnLog.count('MESSAGE_SENT');
    const state = window.__galgameState;
    if (!state?.mainStore) return;
    vnLog.info('messageSent', 'user message sent', {
      message_id,
      atLastBlock: state.mainStore.atLastBlock,
      transitionActive: state.mainStore.transitionActive,
    });
    // 选项点击（ChoicePanel.onSelectOption）和自定义输入都会触发 MESSAGE_SENT，
    // 这里不区分"选项 vs 自定义"——两者都进入虚拟块；origin 用 'custom' 标识。
    state.mainStore.requestNextBlockTransition('custom');
  });

  /**
   * 主 API 完成生成时酒馆会触发 GENERATION_ENDED(message_id)。
   *
   * **历史判定**：用 STREAM_TOKEN_RECEIVED 期间记录的 `activeGenerationMesId`
   * 与传入的 message_id 比较，希望过滤掉"其它楼相关的" generation_ended。
   *
   * **实际坑** (用户反馈)：该守卫会频繁误判，导致弹幕 + 生图 tag 不会自动写入：
   * - swipe / regenerate / 续写 (continue) 之后酒馆也会以**旧 message_id** 触发
   *   GENERATION_ENDED，但 activeGenerationMesId 已被 STREAM_TOKEN_RECEIVED 重写为新楼 id。
   *   mismatch → 早退 → 弹幕永远不写入；
   * - 选项点击/连续翻页场景下，新楼的 GENERATION_ENDED 先触发，再触发旧楼的尾巴，
   *   都会因为 mismatch 被打回。
   *
   * **新判定**：信任 GENERATION_ENDED(message_id) + 该 message 是否是 .last_mes
   * （酒馆原生聊天最后一条楼）。这是最贴近"主 API 生成完毕"语义的判定：
   * - last_mes 一定是本次生成正在结束的楼；
   * - 不会被 swipe / regenerate 的尾巴信号误过滤；
   * - 若用户主动 swipe / regenerate 旧楼（mid-chat edit），该楼不是 last_mes，
   *   不应触发弹幕生成（避免对历史楼反复写 dm）。
   */
  eventOn(tavern_events.GENERATION_ENDED, async (message_id: number) => {
    vnLog.count('GENERATION_ENDED');
    const state = window.__galgameState;
    if (!state) return;
    vnLog.info('generationEnded', 'generation ended', {
      message_id,
      activeGenerationMesId: state.activeGenerationMesId,
      atLastBlock: state.mainStore?.atLastBlock,
      transitionActive: state.mainStore?.transitionActive,
    });

    // 仅当触发的是"当前聊天最后一条楼"时，进入弹幕 + 生图 tag 流程。
    // 不再依赖 activeGenerationMesId 的弱匹配。
    const lastMesId = Number($('#chat > .mes.last_mes').attr('mesid'));
    if (Number.isFinite(lastMesId) && lastMesId !== message_id) {
      console.info(
        '[VN] GENERATION_ENDED for non-last message (mid-chat edit?), skip; message_id=%d, last_mes=%d',
        message_id,
        lastMesId,
      );
      return;
    }
    state.activeGenerationMesId = null;
    if (!state.mainStore) return;

    // 虚拟块：进入过场门控，等待弹幕 + 生图 tag 完成后解锁
    if (state.mainStore.transitionActive) {
      state.mainStore.setTransitionPhase('danmaku');
    } else {
      state.mainStore.requestNextBlockTransition('generationEnded');
    }

    scheduleDanmakuAndImageForFloor(message_id);
  });

  // ------------------------------------------------------------
  // 多入口兜底：除了 GENERATION_ENDED，还要在以下事件上跑一次：
  // 1) tavern_events.MESSAGE_RECEIVED —— 消息入库即触发，比 GENERATION_ENDED 更稳
  //    （参考用户提供的"综合提醒脚本"也用此事件）。type 我们限制在主 API 完成的几类：
  //    normal / swipe / regenerate / continue / append / appendFinal。
  //    quiet / impersonate / command / extension 类的非主 API 完成不写弹幕。
  // 2) tavern_events.CHARACTER_MESSAGE_RENDERED —— DOM 渲染完了，酒馆肯定已经把
  //    文本入库了。配合 (1) 进一步兜底。
  //
  // 用 idempotent guard 防重复：同一 message_id 多次入口只跑一次。
  // ------------------------------------------------------------
  const completedFloors = new Set<number>();

  function scheduleDanmakuAndImageForFloor(message_id: number) {
    if (!Number.isInteger(message_id) || message_id < 0) return;
    if (completedFloors.has(message_id)) {
      console.info('[VN] 弹幕+生图任务已对 message_id=%d 调度过，跳过重复触发', message_id);
      return;
    }
    const state = window.__galgameState;
    if (!state?.mainStore) {
      console.info('[VN] scheduleDanmakuAndImageForFloor: mainStore 尚未准备好，跳过 message_id=%d', message_id);
      return;
    }
    completedFloors.add(message_id);
    /* 三秒内失败允许重试 */
    setTimeout(() => completedFloors.delete(message_id), 3000);
    /* 异步跑，不 await，否则一个入口会阻塞另一个 */
    void triggerDanmakuAndImageGen(message_id, state.mainStore);
  }

  // 新楼层生成完毕，追加到 dialogues
  eventOn(tavern_events.GENERATION_ENDED, async (message_id: number) => {
    vnLog.count('GENERATION_ENDED_appendNewMessage');
    const state = window.__galgameState;
    if (!state?.mainStore) return;
    vnLog.info('messageRendered', 'append new message (generation ended)', { message_id });
    await state.mainStore.appendNewMessage(message_id);
  });

  // 任意楼层被修改（编辑/swipe/regenerate），更新 dialogues 中对应楼层，并同步剧情文本
  eventOn(tavern_events.MESSAGE_UPDATED, async (message_id: number) => {
    vnLog.count('MESSAGE_UPDATED');
    const state = window.__galgameState;
    if (!state?.mainStore) return;
    vnLog.info('messageUpdated', 'message updated; refreshing dialogue unit', { message_id });
    await state.mainStore.updateDialogueUnit(message_id);
    // 同步该楼层的剧情文本到 MVU 变量
    await syncPlotText(message_id);
  });

  // 用户发送消息后，确保新楼层被追加到 dialogues
  eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, async (message_id: number, _type: string) => {
    vnLog.count('CHARACTER_MESSAGE_RENDERED');
    const state = window.__galgameState;
    if (!state?.mainStore) return;
    vnLog.info('messageRendered', 'append new message (character message rendered)', { message_id, type: _type });
    await state.mainStore.appendNewMessage(message_id);
    // 同步该楼层的剧情文本到 MVU 变量
    await syncPlotText(message_id);

    // ---- 兜底 #2：DOM 渲染完成 → 主 API 内容已经入库到 chat。
    // 如果上游 GENERATION_ENDED 没触发到（例如某些版本酒馆把事件吞掉或时序 race），
    // CHARACTER_MESSAGE_RENDERED 是必然触发的。这里再尝试一次调度，
    // scheduleDanmakuAndImageForFloor 的 idempotent guard 会保证不会重复执行。
    scheduleDanmakuAndImageForFloor(message_id);
  });

  // ---- 兜底 #1：消息入库事件
  // 参考用户提供的"综合提醒脚本"对此事件的稳定性验证。
  // type 字段限制在主 API 完成的几类：normal / swipe / regenerate / continue / append / appendFinal。
  // 其它类型（quiet / impersonate / first_message / command / extension）跳过，避免给
  // impersonate 角色模拟回复、首条消息、命令消息加弹幕等怪异行为。
  const VALID_DANMAKU_TRIGGER_TYPES = new Set(['normal', 'swipe', 'regenerate', 'continue', 'append', 'appendFinal']);

  eventOn(tavern_events.MESSAGE_RECEIVED, async (message_id: number, type: string) => {
    try {
      const accepted = VALID_DANMAKU_TRIGGER_TYPES.has(type);
      console.info(
        '[VN] MESSAGE_RECEIVED 收到 message_id=%d, type=%s, acceptedForDanmaku=%s',
        message_id,
        type,
        String(accepted),
      );
      if (!accepted) return;

      const state = window.__galgameState;
      if (!state?.mainStore) return;

      // 验证消息是 AI 角色消息（role === 'assistant'，非 user、非 system）。
      const msgs = getChatMessages(message_id);
      const msg = Array.isArray(msgs) ? msgs[0] : null;
      if (!msg) {
        console.info('[VN] MESSAGE_RECEIVED: getChatMessages[%d] 未返回消息，跳过', message_id);
        return;
      }
      const isAssistant = msg.role === 'assistant' || (msg.is_user === false && !msg.is_system);
      if (!isAssistant) {
        console.info('[VN] MESSAGE_RECEIVED: 非 AI 消息，跳过弹幕/生图', { message_id, role: msg.role });
        return;
      }

      // 检查消息是否已经有 <dm>。若已有，说明已调度过，不再触发。
      const raw = String(msg.message || msg.mes || '');
      if (/<dm>/i.test(raw)) {
        console.info('[VN] MESSAGE_RECEIVED: 消息中已有 <dm>，跳过', { message_id });
        return;
      }

      scheduleDanmakuAndImageForFloor(message_id);
    } catch (e) {
      console.warn('[VN] MESSAGE_RECEIVED handler 异常：', e);
    }
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
      callSecondApi: (config: SecondApiConfig) => Promise<string[] | string>;
      transitionActive: boolean;
      setTransitionPhase: (phase: 'streaming' | 'danmaku' | 'image' | 'done') => void;
      beginSecondApi: () => void;
      endSecondApi: () => void;
      beginMainApi: () => void;
      endMainApi: () => void;
      /**
       * 重新解析指定楼位的文本 + 图像标签块。
       * 写入 setChatMessages 后调用，可以让界面层的 processImageTagBlocks 等
       * 重新扫一遍最新 message，从而派发生图、刷新舞台。
       */
      updateDialogueUnit?: (messageId: number) => Promise<void>;
      reparseImageTagsFromMessage?: (messageId: number) => Promise<void>;
    } | null,
  ) {
    if (!mainStore) return;

    const messages = getChatMessages(message_id);
    const raw = messages[0]?.message ?? '';
    const contentText = extractContentTag(raw);
    vnLog.info('parser', '剧情文本 调试', {
      message_id,
      messagesLen: messages.length,
      rawLen: raw.length,
      contentTextLen: contentText.length,
      hasContentTag: /<content>/i.test(raw),
    });
    if (!contentText) return;

    // ========== 剧情文本同步（先于弹幕处理）==========
    // 注意：MVU 框架在 VARIABLE_UPDATE_ENDED 时会覆盖 stat_data，
    // 这里先写入剧情文本作为"初值"，VARIABLE_UPDATE_ENDED 钩子会再次写入作为最终值。
    void syncPlotText(message_id);

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

    // 进入过场：标记为弹幕阶段
    if (mainStore.transitionActive) {
      mainStore.setTransitionPhase('danmaku');
    }

    // 检查是否需要生图
    const needImageGen = mainStore.settings.imageGenEnabled && mainStore.settings.apiTaskImageTag === 'second';

    // 如果弹幕和生图都需要第二API，尝试合并调用
    if (mainStore.settings.apiTaskDanmaku === 'second' && needImageGen) {
      try {
        mainStore.beginSecondApi();
        const result = (await mainStore.callSecondApi({
          task: 'danmakuAndImageGen',
          // 与提示词对齐：系统提示里写"严格基于下方 <content> 标签内的正文生成"，
          // 因此 user 段必须带 <content>...</content> 包裹，不能只塞内文。
          contentText: wrapContentTag(contentText),
        })) as string;
        mainStore.endSecondApi();

        if (typeof result !== 'string' || !result.trim()) {
          console.warn('[DanmakuAndImageGen] 第二 API 返回为空，不写入弹幕 / 生图');
          try {
            (window as any).toastr?.warning?.('[danmaku+生图] 第二 API 返回为空');
          } catch {}
          return;
        }

        console.info('[DanmakuAndImageGen] Raw result (pre-sanitize):', result);

        // 预裁剪：只保留 <dm> / <background> / <image> / <cg> 四个合法标签块。
        // LLM 经常惯性输出 <content> 整段、人话说明、Markdown 等，不能原样追加到楼层末尾。
        // 残缺的 Unicode 替换字符 (U+FFFD) 也会被一并清掉。
        // 清洗后为空 → 不写入（避免楼层末尾出现空行）。
        const sanitized = sanitizeSecondApiOutput(result);
        if (!sanitized) {
          console.warn('[DanmakuAndImageGen] 清洗后为空，跳过写入');
          return;
        }
        console.info('[DanmakuAndImageGen] Sanitized result:', sanitized);

        // 清洗后追加：只剩 <dm>/<background>/<image>/<cg> 等合法标签块
        // 后续的"弹幕显示 / 生图派发"由界面层在重解析该楼层时统一处理
        //   - displayDanmakuFromMessage 会扫描 <dm>...</dm>
        //   - updateDialogueUnit → processImageTagBlocks 会扫描 <background>/<image>/<cg>
        const updatedMessage = messages[0].message + '\n' + sanitized;
        await setChatMessages([{ ...messages[0], message: updatedMessage }]);

        // 弹幕立即显示（不等全楼层重渲染，弹得更快）
        mainStore.displayDanmakuFromMessage(updatedMessage);

        // 弹幕整理这一步到这里已经完成（弹幕已显示、楼层已写入）。
        // UI 提示从『整理弹幕』切到『绘制插画』，让用户明确知道进度。
        // 生图什么时候完成由外部 image gen 插件异步驱动 handleImageResponse 推动 transitionReady，
        // 不在这里 await。
        if (mainStore.transitionActive) {
          mainStore.setTransitionPhase('image');
        }

        // 触发该楼层的完整重解析，让界面层的 image tag 处理管线接管生图派发。
        // 关键点：这里**不能 await** —— 让函数立即返回，弹幕阶段立即结束。
        // imageGen 完成由 watcher 等 transitionReady（!imageGenerating && !secondApiInflight）。
        // processImageTagBlocks 内部同步循环 requestImage，会立刻把 imageGenerating.value 置 true，
        // 把 phase='image' 阶段的"等待生图"时间交给 imageResponse handler 自然推进。
        if (typeof mainStore.updateDialogueUnit === 'function') {
          void mainStore.updateDialogueUnit(message_id);
        } else if (typeof mainStore.reparseImageTagsFromMessage === 'function') {
          // 兜底：仅重解析 image tags（不影响显示）
          void mainStore.reparseImageTagsFromMessage(message_id);
        }

        console.info('[DanmakuAndImageGen] 已原样写入消息末尾，弹幕立即显示，生图已派发');
      } catch (e) {
        mainStore.endSecondApi();
        const detail = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
        console.error('[DanmakuAndImageGen] Failed:', e);
        try {
          (window as any).toastr?.error?.(`[danmaku+生图] 第二 API 失败：${detail}`);
        } catch {}
      }
      return;
    }

    // 只处理弹幕（不需要生图或生图使用主API）
    if (mainStore.settings.apiTaskDanmaku === 'second') {
      try {
        mainStore.beginSecondApi();
        const lines = (await mainStore.callSecondApi({
          task: 'danmaku',
          // 与提示词对齐：system 提示里写"严格基于下方 <content> 标签内的正文生成"，
          // 因此 user 段必须带 <content>...</content> 包裹，不能只塞内文。
          contentText: wrapContentTag(contentText),
        })) as string[];
        mainStore.endSecondApi();
        if (lines.length === 0) {
          console.warn('[Danmaku] 第二 API 返回为空，不写入弹幕');
          try {
            (window as any).toastr?.warning?.('[danmaku] 第二 API 返回为空');
          } catch {}
          return;
        }

        // 将弹幕写入 <dm> 标签。lines 已由 callSecondApi 按行切分并返回 string[]，
        // 直接用 | 拼接回 <dm>...</dm> —— 界面层的 extractDanmakuBlock 会再次按 | 切。
        const dmTag = `<dm>${lines.join('|')}</dm>`;
        const updatedMessage = messages[0].message + '\n' + dmTag;
        await setChatMessages([{ ...messages[0], message: updatedMessage }]);
        mainStore.displayDanmakuFromMessage(updatedMessage);

        // 弹幕整理完成。这里没有 imageGen 任务要等，
        // transitionReady 仍会是 true（!imageGenerating && !secondApiInflight），
        // watcher 会把 phase 推到 'done' 并解锁虚拟块 —— 用户看到的提示会从『整理弹幕』
        // 直接跳到『准备就绪』，无需在『弹幕』阶段长时间停留。
        // 这里**不必**主动 setTransitionPhase('image')，因为没有 imageGen 要等，
        // 让 watcher 自然推进即可。
        console.info('[Danmaku] 弹幕已写入消息末尾并立即显示');
      } catch (e) {
        mainStore.endSecondApi();
        const detail = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
        console.error('[Danmaku] Failed:', e);
        try {
          (window as any).toastr?.error?.(`[danmaku] 第二 API 失败：${detail}`);
        } catch {}
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

  /**
   * 手动触发角色系统全量扫描
   * 可供 UI 按钮调用（如 CharacterPanel 中的刷新按钮）
   */
  function triggerFullRoleScan(): void {
    console.info('[VN] Manual full role scan triggered');
    manualFullScan();
  }

  // 导出到全局，供 UI 组件调用
  (window as any).__triggerFullRoleScan = triggerFullRoleScan;

  // ============================================================
  // 调试钩子：控制台手动模拟"刚刚 GENERATION_ENDED 之后"
  // 跑的是 index.ts 内 triggerDanmakuAndImageGen 的同一份逻辑，
  // 包含：剧情文本同步、写 <dm> 到消息楼层、发生图请求、过场门控
  //
  // 用法（在浏览器控制台执行）：
  //   __vnDebug.simulateGenerationEndedOnLatestFloor()
  //   __vnDebug.simulateGenerationEnded(messageId)
  //   __vnDebug.simulateGenerationEndedOnLatestFloor({ skipSyncPlotText: true })
  //
  // 调试 ordered_prompts 拼装（不发请求）：
  //   await __vnDebug.dumpDanmakuPrompts('danmaku')           // 只注弹幕相关世界书
  //   await __vnDebug.dumpDanmakuPrompts('danmakuAndImageGen')// 注弹幕 + 场景标签 + CG
  //   await __vnDebug.dumpDanmakuPrompts()                    // 默认 'danmakuAndImageGen'
  //   await __vnDebug.dumpDanmakuPromptsOnLatestFloor()       // 取最新楼层的剧情文本
  //
  // 保留一个低层 API 用于直接调一次第二 API（不写回消息、不发生图）：
  //   __vnDebug.testSecondApiTask('danmaku', '...')
  // ============================================================
  type DebugTask = 'danmaku' | 'imageTag' | 'danmakuAndImageGen';

  /** 从最后一条消息中抽取 <content>，返回 { messageId, contentText } */
  function getLatestFloorContent(): { messageId: number; contentText: string } | null {
    const lastId = getLastMessageId();
    if (typeof lastId !== 'number') return null;
    const messages = getChatMessages(lastId);
    if (messages.length === 0) return null;
    return { messageId: lastId, contentText: extractContentTag(messages[0]?.message ?? '') };
  }

  /**
   * 复刻 callSecondApi 中 danmaku/danmakuAndImageGen 分支的拼装逻辑，
   * 把 ordered_prompts 完整 dump 到 console。不发请求、不写消息、不发生图。
   *
   * 与 store.ts callSecondApi 保持同步：
   * - 世界书过滤维度由 task 决定（danmakuAndImageGen 注入 'danmaku' | 'imageGen'，CG 与背景共用 imageGen）
   * - 始终不注入聊天历史：caller 已经在末尾 user 段提供了当次剧情；再注入历史会重复且泄漏 <dm> 等内部标签
   * - 末尾追加对应的 PROMPT_*_HINT 作为兜底系统提示
   */
  async function dumpDanmakuPrompts(
    task: 'danmaku' | 'danmakuAndImageGen' = 'danmakuAndImageGen',
    contentText?: string,
  ): Promise<{ role: string; content: string }[] | null> {
    const store = window.__galgameState?.mainStore;
    if (!store) {
      console.warn('[__vnDebug] store 尚未准备就绪，请稍候再试');
      return null;
    }
    const text = (contentText ?? '').trim() || '（占位剧情文本）';

    // 与 store.ts callSecondApi 保持一致：通用条目（universal 或未设置）任何任务都带
    const allowedFeatures: ('danmaku' | 'imageGen')[] =
      task === 'danmakuAndImageGen' ? ['danmaku', 'imageGen'] : ['danmaku'];
    // 当前 settings 决定哪些条目"任务路由命中第二 API" —— 与 store.ts 的 shouldSendToSecondApi 同源。
    // 这里 dump 时再实现一份是因为 store 内部的 shouldSendToSecondApi 未对外导出，调试工具
    // 直接调用 buildSecondApiContext 即可。
    const s = store.settings as {
      apiTaskDanmaku: 'main' | 'second' | 'disabled';
      apiTaskImageTag: 'main' | 'second' | 'disabled';
      danmakuEnabled: boolean;
      imageGenEnabled: boolean;
    };

    const context = await (store as any).buildSecondApiContext({
      // 与 store.ts callSecondApi 保持一致：弹幕 / 场景 / CG 任务不再注入聊天历史
      includeChatHistory: false,
      includeWorldbook: true,
      maxChatHistory: 20,
      // 任务关联条目由 worldbookFilter 决定是否注入，不要再被外层 e.enabled 过滤
      // （任务关联条目由任务路由决定，通用条目由 worldbookFilter 内自行检查 e.enabled）。
      respectEnabled: false,
      worldbookFilter: (e: any) => {
        // 仅注入常亮条目（constant）。selective / vectorized 依赖运行时触发，不带。
        if (e.strategy?.type !== 'constant') return false;
        const feature = e.linkedFeature as 'danmaku' | 'imageGen' | 'universal' | undefined;
        // 任务关联条目：与 store.ts 的 resolveApiTarget 完全等价 —— 由 (功能总开关 + 任务路由) 决定。
        if (feature === 'danmaku' || feature === 'imageGen') {
          if (!allowedFeatures.includes(feature)) return false;
          // 功能总开关关掉 → 不发送（即使路由到第二 API 也不该发）
          if (feature === 'danmaku' && !s.danmakuEnabled) return false;
          if (feature === 'imageGen' && !s.imageGenEnabled) return false;
          // 任务路由必须指向第二 API
          if (feature === 'danmaku' && s.apiTaskDanmaku !== 'second') return false;
          if (feature === 'imageGen' && s.apiTaskImageTag !== 'second') return false;
          return true;
        }
        // 通用条目：按 targetApi 决定是否进入第二 API；同时尊重用户的 enabled 手动开关。
        if (!e.enabled) return false;
        const target = e.targetApi ?? 'main';
        return target === 'second' || target === 'both';
      },
    });

    // 从 store 引用的常量在控制台是不可见的；通过 store 引出 PROMPT_*_HINT 不必要，
    // 直接在 dumpDanmakuPrompts 内部 hardcode 一份与 prompts/danmaku.ts 一致的 hint。
    const systemHint =
      task === 'danmaku'
        ? `[System] 暂停角色扮演，切换为"弹幕生成器"。
严格基于下方 <content> 标签内的正文生成：互不重复，不得复读前文已有的弹幕；语气贴近实时观看者的反应。`
        : `[System] 暂停角色扮演，切换为"弹幕 + 生图 tag 生成器"。
严格基于下方 <content> 标签内的正文生成：
- 弹幕必须反映正文中实际出现的人物互动、场景氛围、剧情节奏
- 生图 tag 必须严格遵循上面世界书里 <background> / <image> 标签的格式与字段（含 title / image###...### 等）
- 仅在正文出现场景切换或 CG 时刻才输出对应的生图 tag；正文未发生场景变化时不要输出生图 tag
- 不得在 <content> 正文之外引入未出现的人物、地点或事件

按上面世界书里的弹幕 / 生图规则输出：
- 场景切换时输出 <background> 标签块，CG 场景时输出 <image> 标签块
- 严禁在结尾外出现自由文本，标签格式严格按世界书示例`;

    const ordered_prompts = [
      ...context,
      { role: 'system' as const, content: systemHint },
      // 与提示词对齐：system 提示里写"严格基于下方 <content> 标签内的正文生成"，
      // 因此 user 段必须带 <content>...</content> 包裹，不能只塞内文。
      { role: 'user' as const, content: text.includes('<content>') ? text : `<content>\n${text}\n</content>` },
    ];

    console.group(`[__vnDebug] dumpDanmakuPrompts(task=${task}) → ${ordered_prompts.length} messages`);
    ordered_prompts.forEach((m, i) => {
      const head = `[${i}] role=${m.role}  length=${m.content.length}`;
      console.info(head);
      console.info(m.content);
    });
    console.info('summary:', {
      task,
      includeWorldbook: true,
      includeChatHistory: false,
      allowedFeatures,
      messageCount: ordered_prompts.length,
      totalChars: ordered_prompts.reduce((s, m) => s + m.content.length, 0),
    });
    console.groupEnd();
    return ordered_prompts;
  }

  async function dumpDanmakuPromptsOnLatestFloor(
    task: 'danmaku' | 'danmakuAndImageGen' = 'danmakuAndImageGen',
  ): Promise<{ role: string; content: string }[] | null> {
    const floor = getLatestFloorContent();
    if (!floor || !floor.contentText) {
      console.warn('[__vnDebug] 最后一条消息没有 <content> 标签');
      return null;
    }
    console.info(`[__vnDebug] 取自最后一条消息 (id=${floor.messageId}) 的 <content> 长度：`, floor.contentText.length);
    return dumpDanmakuPrompts(task, floor.contentText);
  }

  /**
   * 模拟酒馆 GENERATION_ENDED 之后第二 API 流程。
   * 内部直接调用与生产路径一致的 triggerDanmakuAndImageGen。
   */
  async function simulateGenerationEnded(
    messageId: number,
    options: { skipSyncPlotText?: boolean } = {},
  ): Promise<void> {
    const store = window.__galgameState?.mainStore;
    if (!store) {
      console.warn('[__vnDebug] store 尚未准备就绪，请稍候再试');
      return;
    }
    const messages = getChatMessages(messageId);
    if (messages.length === 0) {
      console.warn('[__vnDebug] 消息 id=%d 找不到对应楼层', messageId);
      return;
    }
    const raw = messages[0]?.message ?? '';
    const contentText = extractContentTag(raw);
    console.info(
      '[__vnDebug] simulate GENERATION_ENDED for messageId=%d, contentText.length=%d',
      messageId,
      contentText.length,
    );

    // 复用生产路径（内部已经处理：<dm> 已存在直接显示、配置分支、begin/endSecondApi、写过场门控）
    await triggerDanmakuAndImageGen(messageId, store as any);
    void options;
  }

  async function simulateGenerationEndedOnLatestFloor(options: { skipSyncPlotText?: boolean } = {}): Promise<void> {
    const lastId = getLastMessageId();
    if (typeof lastId !== 'number') {
      console.warn('[__vnDebug] 找不到最后一条消息 id');
      return;
    }
    await simulateGenerationEnded(lastId, options);
  }

  /**
   * 低层 API：只调用第二 API 一次，不写回消息楼层、不发生图、不进入过场。
   * 适合纯 prompt 调优用。
   */
  async function testSecondApiTask(task: DebugTask, contentText: string): Promise<unknown> {
    const store = window.__galgameState?.mainStore;
    if (!store) {
      console.warn('[__vnDebug] store 尚未准备就绪，请稍候再试');
      return null;
    }
    const t0 = performance.now();
    console.info('[__vnDebug] -> 第二 API 调用开始，task=', task, 'contentText.length=', contentText.length);
    try {
      const config: SecondApiConfig =
        task === 'imageTag' ? { task: 'imageTag', sceneDescription: contentText } : { task, contentText };
      const result = await store.callSecondApi(config);
      const dt = Math.round(performance.now() - t0);
      console.info(`[__vnDebug] <- 第二 API 调用完成 (${dt}ms)，返回：`, result);
      return result;
    } catch (e) {
      const dt = Math.round(performance.now() - t0);
      console.error(`[__vnDebug] <- 第二 API 调用失败 (${dt}ms)：`, e);
      return null;
    }
  }

  (window as any).__vnDebug = {
    // 模拟自动路径：包含写 <dm>、发生图、过场门控
    simulateGenerationEnded,
    simulateGenerationEndedOnLatestFloor,
    // 调试用：dump ordered_prompts 不发请求
    dumpDanmakuPrompts,
    dumpDanmakuPromptsOnLatestFloor,
    // 低层：只调一次第二 API
    testSecondApiTask,
    // 手动模式：与设置界面等价 —— 绕过自动管线「弹幕已存在则跳过」等限制
    manualGenerateDanmaku: (options?: { stripExisting?: boolean }) => {
      const store = window.__galgameState?.mainStore as
        | { manualGenerateDanmaku?: (o: { stripExisting?: boolean }) => Promise<void> }
        | null
        | undefined;
      return store?.manualGenerateDanmaku?.(options ?? {}) ?? Promise.resolve();
    },
    manualGenerateImageTags: (options?: { stripExisting?: boolean }) => {
      const store = window.__galgameState?.mainStore as
        | { manualGenerateImageTags?: (o: { stripExisting?: boolean }) => Promise<void> }
        | null
        | undefined;
      return store?.manualGenerateImageTags?.(options ?? {}) ?? Promise.resolve();
    },
    manualStripLatestTags: (kinds: Array<'dm' | 'image' | 'background'>) => {
      const store = window.__galgameState?.mainStore as
        | { manualStripLatestTags?: (k: Array<'dm' | 'image' | 'background'>) => Promise<void> }
        | null
        | undefined;
      return store?.manualStripLatestTags?.(kinds) ?? Promise.resolve();
    },
  };

  $(window).on('pagehide', () => {
    unmount();
    if (_versionCheckerStop) {
      try {
        _versionCheckerStop();
      } catch {}
      _versionCheckerStop = null;
    }
  });
});
