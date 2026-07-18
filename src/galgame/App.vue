<template>
  <main ref="mainEl" class="relative w-full select-none" data-ui="app-root" :style="mainStyle">
    <StageArea />

    <!-- Image Deck (扇形卡牌队列) -->
    <ImageDeck />

    <div class="pointer-events-none absolute inset-0 flex flex-col" :style="overlayContainerStyle">
      <div class="pointer-events-auto shrink-0">
        <QuickAccessMenu :is-fullscreen="isFullscreen" @toggle-fullscreen="toggleFullscreen" />
      </div>

      <!-- 成就刘海入口 -->
      <div class="pointer-events-auto shrink-0" style="align-self: center">
        <AchievementNotch />
      </div>
      <div class="min-h-0 flex-1" />
      <div class="pointer-events-auto shrink-0" :style="dialogueBoxStyle">
        <DialogueBox
          v-if="store.currentBlock?.type !== 'blacktext'"
          :choices="choices"
          :during-streaming="context.during_streaming"
          :is-portrait-mode="isPortraitMode"
        />
      </div>
    </div>

    <ChoicePanel :choices="choices" :message-id="context.message_id" @choice-submitted="handleChoiceSubmitted" />

    <DialogueBox
      v-if="store.currentBlock?.type === 'blacktext'"
      :choices="choices"
      :during-streaming="context.during_streaming"
      :is-portrait-mode="isPortraitMode"
    />

    <SettingsPanel v-if="store.activeOverlay === 'settings'" :is-portrait-mode="isPortraitMode" />
    <HistoryPanel v-if="store.activeOverlay === 'history'" @go-to-line="handleGoToLine" />
    <CharacterPanel v-if="store.activeOverlay === 'character'" />
    <GameplayPanel v-if="store.activeOverlay === 'gameplay'" />
    <DialogueInputPanel
      v-if="store.activeOverlay === 'input'"
      :visible="store.activeOverlay === 'input'"
      @close="store.setOverlay('none')"
      @submit="handleInputSubmit"
    />

    <!-- Global Toast — always on top -->
    <div
      v-if="toastAnim !== 'hidden' && store.toastMessage"
      data-ui="toast"
      class="absolute left-1/2 -translate-x-1/2"
      style="top: 1.5rem; z-index: 9999"
    >
      <div
        class="toast-clipping max-w-md px-6 py-2 text-center text-sm"
        :style="{
          animation: toastAnim === 'in' ? 'toast-in 0.3s ease-out forwards' : 'toast-out 0.3s ease-in forwards',
          background: 'var(--theme-toast-bg, rgba(42,36,32,0.9))',
          color: 'var(--theme-toast-color, var(--theme-text-main, rgba(212,197,160,0.92)))',
          border: '1px solid var(--theme-toast-border, var(--theme-surface-border, rgba(90,79,64,0.55)))',
          // 位置/大小类变量 fallback：用 rem 而非 em，避免被祖先 font-size 联动缩小
          borderRadius: 'var(--theme-toast-radius, 0.25rem)',
          boxShadow: 'var(--theme-toast-shadow, 0 0.5rem 1.5rem rgba(0,0,0,0.35))',
        }"
      >
        <div class="flex items-center gap-2">
          <span style="color: var(--theme-accent, var(--rust)); font-weight: bold; font-size: 0.75rem">[ 号外 ]</span>
          <span>{{ store.toastMessage }}</span>
        </div>
      </div>
    </div>

    <!-- 生图测试控制台 (已隐藏) -->
    <!-- <ImageGenConsole /> -->

    <!-- 重试生图面板 -->
    <ImageGenRetryPanel />
    <!-- 相册面板 -->
    <ImageAlbumPanel />
    <!-- 过场遮罩：锁住翻页，等弹幕 / 生图完成 -->
    <TransitionOverlay />
  </main>
</template>

<script setup lang="ts">
import { injectStreamingMessageContext } from '@util/streaming';
import ImageAlbumPanel from './components/common/ImageAlbumPanel.vue';
import ImageGenRetryPanel from './components/common/ImageGenRetryPanel.vue';
import DialogueBox from './components/dialogue/DialogueBox.vue';
import AchievementNotch from './components/layout/AchievementNotch.vue';
import DialogueInputPanel from './components/layout/DialogueInputPanel.vue';
import QuickAccessMenu from './components/layout/QuickAccessMenu.vue';
import GameplayPanel from './components/module/GameplayPanel.vue';
import CharacterPanel from './components/panel/CharacterPanel.vue';
import ChoicePanel from './components/panel/ChoicePanel.vue';
import HistoryPanel from './components/panel/HistoryPanel.vue';
import SettingsPanel from './components/panel/SettingsPanel.vue';
import ImageDeck from './components/stage/ImageDeck.vue';
import StageArea from './components/stage/StageArea.vue';
import TransitionOverlay from './components/stage/TransitionOverlay.vue';
import { parseChoices, useVNStore } from './store';
import { extractDanmakuBlock, extractImageTagBlocks } from './utils/messageParser';
import { setScanCompleteCallback } from './utils/roleScanner';
import { logThemeVarDiff, snapshotThemeVars } from './utils/themeDebug';

const context = injectStreamingMessageContext();
const store = useVNStore();
const mainEl = ref<HTMLElement | null>(null);

const themeCssText = computed(() => {
  if (!store.settings.themeEnabled) return '';
  const sourceCss =
    store.settings.themeCustomCssSource === 'import'
      ? store.settings.themeImportedCssContent || store.settings.themeCustomCss
      : store.settings.themeCustomCss || store.settings.themeImportedCssContent;
  return sourceCss.trim();
});

const THEME_KEYS = [
  '--theme-bg',
  '--theme-fg',
  '--theme-muted',
  '--theme-accent',
  '--theme-panel-bg',
  '--theme-dialogue-bg',
  '--theme-choice-bg',
  '--theme-choice-hover',
  '--theme-choice-selected',
  '--theme-toast-bg',
  '--theme-toast-color',
  '--theme-toast-border',
  '--theme-toast-radius',
  '--theme-toast-shadow',
  '--theme-danmaku-color',
];
let lastThemeSnapshot: Record<string, string> | null = null;

// 弹幕 CSS 变量同步
let danmakuStyleEl: HTMLStyleElement | null = null;
// 用户自定义 CSS（包含变量声明和完整规则）
let userCssStyleEl: HTMLStyleElement | null = null;

function syncDanmakuStyle() {
  if (!danmakuStyleEl) return;
  const color = store.settings.danmakuColor || '#ffffff';
  // 字号从设置读取的可能是裸数字（如 1.2），统一补一个 rem 单位，否则 --theme-danmaku-font-size 作为裸数字在 font-size 上无效
  const fontSizeRaw = store.settings.danmakuFontSize ?? 1.2;
  const fontSize = typeof fontSizeRaw === 'number' ? `${fontSizeRaw}rem` : String(fontSizeRaw);
  const opacity = store.settings.danmakuOpacity || 0.9;
  danmakuStyleEl.textContent = `#galgame-shell, [data-ui="app-root"] {
  --theme-danmaku-color: ${color};
  --theme-danmaku-font-size: ${fontSize};
  --theme-danmaku-opacity: ${opacity};
}`;
}

/** 同步用户自定义 CSS 到 <style> 标签（包含变量声明和完整规则） */
function syncUserCss() {
  if (!userCssStyleEl) return;
  const css = themeCssText.value;
  userCssStyleEl.textContent = css;
}

// 竖屏模式判断
const isPortraitMode = computed(() => store.settings.portraitMode);

// 监听竖屏模式开关，切换 HTML class 以触发 CSS 中的 -portrait 变量覆盖
watch(isPortraitMode, isPortrait => {
  document.documentElement.classList.toggle('portrait-mode', isPortrait);
}, { immediate: true });

// 主容器样式：仅用 width + aspect-ratio 决定高度（iframe 内禁止 vh，避免与比例冲突把宽度压成细条）
/** 从用户 CSS 文本中提取 --var(--xxx) 变量声明为 key-value 映射，支持：
 *  - 顶层变量声明：`--var: value;`
 *  - CSS 规则块内的变量：`selector { --var: value; }`
 */
function parseCssVarsToMap(cssText: string): Record<string, string> {
  const result: Record<string, string> = {};
  // 将 CSS 规则块 { ... } 替换为空格，避免在块内容中误匹配 ; }
  let stripped = cssText;

  while (true) {
    const next = stripped.replace(/\{[\s\S]*?\}/g, block => ' '.repeat(block.length));
    if (next === stripped) break;
    stripped = next;
  }
  // 逐条匹配变量声明，正确处理 !important 修饰符
  // 格式: --var-name: value !important;
  //       或 --var-name: value;
  // 注意：值必须真正吃到下一个 `;`，否则像 "0.8rem" 这种会被非贪婪切成 "0"。
  // 用 lookahead (?=...) 锚定结束位置，强制 value 包含到分号前为止的全部内容。
  const re = /--([\w-]+)\s*:\s*([^;]+?)(?=\s*(?:!important)?\s*;)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(stripped)) !== null) {
    const rawVal = m[2];
    // 去掉 value 末尾的 !important（保留 value 里实际有效的部分）
    const val = rawVal.replace(/\s*!important\s*$/i, '').trim();
    if (val) {
      result[`--${m[1]}`] = val;
    }
  }
  return result;
}

const mainStyle = computed(() => {
  const themeCssVars = store.currentTheme.cssVars;
  const userVars = parseCssVarsToMap(themeCssText.value);

  // theme debug snapshot/diff
  const before = lastThemeSnapshot ?? snapshotThemeVars(THEME_KEYS);

  const base = {
    background: 'var(--theme-bg, var(--vn-bg))',
    width: '100%',
    boxSizing: 'border-box' as const,
    color: 'var(--theme-fg, var(--theme-text-main, var(--vn-fg)))',
    ...themeCssVars,
    ...userVars,
  } as Record<string, string>;

  const after = snapshotThemeVars(THEME_KEYS);
  logThemeVarDiff('theme vars updated', THEME_KEYS, before, after);
  lastThemeSnapshot = after;

  return {
    ...base,
    aspectRatio: isPortraitMode.value ? '3 / 4' : '16 / 9',
  };
});

// 覆盖层容器样式：竖屏模式下调整位置
const overlayContainerStyle = computed(() => {
  if (isPortraitMode.value) {
    return { zIndex: 20, minHeight: 0 };
  }
  return { zIndex: 20, minHeight: 0 };
});

// 对话框样式：竖屏模式下通过 .portrait-mode class 自动切换 -portrait 变量
const dialogueBoxStyle = computed(() => ({
  paddingBottom: 'var(--theme-dialogue-bottom, 1.5rem)',
  paddingLeft: 'var(--theme-dialogue-portrait-padding-x, 1rem)',
  paddingRight: 'var(--theme-dialogue-portrait-padding-x, 1rem)',
  transform: 'translate(var(--theme-dialogue-translate-x, 0px), var(--theme-dialogue-translate-y, 0px))',
}));

// 显示扇形卡牌队列由 ImageDeck 组件自身控制（仅依赖开关）

function getFullscreenDoc(): Document | null {
  if (document.fullscreenElement) return document;
  try {
    if (window.parent !== window && window.parent.document?.fullscreenElement) return window.parent.document;
  } catch {
    /* 跨域时 parent 不可访问 */
  }
  return null;
}

const isFullscreen = ref(!!getFullscreenDoc());
let isTransitioning = false;

const choices = computed(() => {
  // [[choice||...]] 只在“当前块就是 choice”时显示，保证选项按块顺序出现
  const block = store.currentBlock;
  if (block?.type === 'choice' && block.options && block.options.length > 0) {
    const blockChoices: { choiceId: string; text: string; isCustomInput: boolean }[] = block.options.map(
      (text, idx) => ({
        choiceId: `c${idx}`,
        text,
        isCustomInput: false,
      }),
    );

    console.info(
      `[App] choices computed: currentBlock=choice, options=${blockChoices.length}, dialogueIndex=${store.currentDialogueIndex}`,
    );

    blockChoices.push({ choiceId: 'custom', text: '', isCustomInput: true });
    return blockChoices;
  }

  // 只有在没有当前结构块时，才回退到旧的 <roleplay_options> 格式
  if (!store.currentBlock) {
    return parseChoices(context.message);
  }

  return [];
});

const toastAnim = ref<'in' | 'out' | 'hidden'>('hidden');

// 监听消息变化，流式同步当前楼层文本（不触发楼层结构变化）
watch(
  () => context.message,
  async newMessage => {
    if (!newMessage) return;

    const idx = store.currentDialogueIndex;
    const unit = store.dialogues[idx];
    if (!unit) return;

    // 更新当前楼层的原始文本
    unit.message = newMessage;

    // 流式过程中：实时提取并显示弹幕/生图标签（边生成边预览）
    // 注意：{{剧情文本}} 的同步由 index.ts 的 GENERATION_ENDED 触发，
    // 此处流式期间不写入酒馆变量，避免被 MvuVariableManager 等其他路径覆盖导致丢字段。
    const danmaku = extractDanmakuBlock(newMessage);
    if (danmaku.length > 0) {
      store.displayDanmakuFromMessage(newMessage);
    }

    // 生图：仅当总开关开启时才做解析/触发，避免误解析造成无意义 log
    if (!store.settings.imageGenEnabled) return;

    const imageTags = extractImageTagBlocks(newMessage);
    if (imageTags.length > 0) {
      await store.processImageTagBlocks(imageTags);
    }
  },
);

watch(
  () => [store.toastVisible, store.toastMessage] as const,
  ([visible]) => {
    if (visible) {
      toastAnim.value = 'in';
      setTimeout(() => {
        toastAnim.value = 'out';
      }, 2500);
      setTimeout(() => {
        toastAnim.value = 'hidden';
      }, 3000);
    } else {
      toastAnim.value = 'hidden';
    }
  },
);

function handleFullscreenChange() {
  isFullscreen.value = !!getFullscreenDoc();
  isTransitioning = false;
}

async function toggleFullscreen() {
  if (isTransitioning) return;
  isTransitioning = true;

  const currentDoc = getFullscreenDoc();
  if (currentDoc) {
    try {
      await currentDoc.exitFullscreen();
    } catch {
      isTransitioning = false;
    }
  } else if (mainEl.value) {
    try {
      await mainEl.value.requestFullscreen();
    } catch {
      isTransitioning = false;
    }
  } else {
    isTransitioning = false;
  }
}

function _submitViaSlash(text: string, label: string) {
  // STScript 转义：双引号、反斜杠、换行都要转义。
  const escaped = text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, '\\n');
  (async () => {
    try {
      const sendResult = await triggerSlash(`/send "${escaped}"`);
      console.info(`[galgame] [${label}] /send 结果:`, sendResult);
      const triggerResult = await triggerSlash('/trigger');
      console.info(`[galgame] [${label}] /trigger 结果:`, triggerResult);
    } catch (e) {
      console.error(`[galgame] [${label}] /send+/trigger failed:`, e);
      try {
        (window as any).toastr?.error?.('提交失败，请看 console');
      } catch {}
    }
  })();
}

function handleChoiceSubmitted(_choiceId: string, text: string) {
  console.info(`[galgame] Choice submitted: ${text}`);
  // 用酒馆 STScript 触发主 API 生成：
  //   - /send "<文本>" 把文本作为 user 消息插入聊天日志（不触发生成）
  //   - /trigger         触发主 API 生成
  //   两步配合等价于"在酒馆输入框输入并按 Enter"。
  //
  // 走 STScript 而不是酒馆助手 generate() 的原因：generate() 会在 iframe 内重启流式
  // 渲染流程，在某些状态（mainStore 还在虚拟块、choiceLocked 未释放、或选择发生在
  // transition overlay 中）会失败 —— 表现为"点击选项后不会创建新的 user 消息"。
  // STScript 直接驱动酒馆原生流，能稳定走 MESSAGE_SENT → GENERATION_ENDED → MESSAGE_RECEIVED
  // → CHARACTER_MESSAGE_RENDERED 这条事件链，由顶层 index.ts 的多入口兜底自动调用
  // 第二 API 生成弹幕 + 生图 tag。
  _submitViaSlash(text, 'choice');
}

function handleInputSubmit(text: string) {
  console.info(`[galgame] Input submitted: ${text}`);
  store.setOverlay('none');
  _submitViaSlash(text, 'input');
}

function handleGoToLine(_index: number) {
  store.setOverlay('none');
}

watch(
  () => context.during_streaming,
  streaming => {
    if (!streaming) console.info(`[galgame] Floor ${context.message_id} streaming complete`);
  },
);

// 监听弹幕设置变化，同步 CSS 变量
watch(
  () => [store.settings.danmakuColor, store.settings.danmakuFontSize, store.settings.danmakuOpacity] as const,
  () => {
    syncDanmakuStyle();
  },
);

// 监听用户自定义 CSS 文本变化，实时同步到 <style> 标签
watch(
  themeCssText,
  () => {
    syncUserCss();
  },
  { immediate: true },
);

onMounted(async () => {
  if (!danmakuStyleEl) {
    danmakuStyleEl = document.createElement('style');
    danmakuStyleEl.setAttribute('data-ui', 'danmaku-css-vars');
    document.head.appendChild(danmakuStyleEl);
    syncDanmakuStyle();
  }
  if (!userCssStyleEl) {
    userCssStyleEl = document.createElement('style');
    userCssStyleEl.setAttribute('data-ui', 'user-custom-css');
    document.head.appendChild(userCssStyleEl);
    syncUserCss();
  }
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  try {
    if (window.parent !== window && window.parent.document) {
      window.parent.document.addEventListener('fullscreenchange', handleFullscreenChange);
    }
  } catch {
    /* 跨域时忽略 */
  }

  (
    window as unknown as {
      __galgameState?: { activeGenerationMesId: number | null; mainStore: ReturnType<typeof useVNStore> | null };
    }
  ).__galgameState = (
    window as unknown as {
      __galgameState?: { activeGenerationMesId: number | null; mainStore: ReturnType<typeof useVNStore> | null };
    }
  ).__galgameState ?? {
    activeGenerationMesId: null,
    mainStore: null,
  };
  (
    (window as unknown as { __galgameState: { mainStore: ReturnType<typeof useVNStore> | null } }).__galgameState as {
      mainStore: ReturnType<typeof useVNStore> | null;
    }
  ).mainStore = store;

  // 同时暴露到顶层 window：index.ts 在 $(() => ...) 内监听 GENERATION_ENDED / MESSAGE_SENT
  // 并通过 window.__galgameState.mainStore 调方法。如果只写 iframe 内 window，顶层拿不到
  // 这个 store。sharedPinia 让 iframe 内 useVNStore 和顶层 useVNStore 是同一份实例，
  // 这里直接同步给顶层。
  try {
    if (window.parent && window.parent !== window) {
      (
        window.parent as unknown as {
          __galgameState?: {
            activeGenerationMesId: number | null;
            mainStore: ReturnType<typeof useVNStore> | null;
          };
        }
      ).__galgameState = (
        window.parent as unknown as {
          __galgameState?: {
            activeGenerationMesId: number | null;
            mainStore: ReturnType<typeof useVNStore> | null;
          };
        }
      ).__galgameState ?? {
        activeGenerationMesId: null,
        mainStore: null,
      };
      (
        (window.parent as unknown as { __galgameState: { mainStore: ReturnType<typeof useVNStore> | null } })
          .__galgameState as {
          mainStore: ReturnType<typeof useVNStore> | null;
        }
      ).mainStore = store;
    }
  } catch {
    /* 跨域时忽略 */
  }

  store.setupImageGenListener();

  // 注册扫描器回调：扫描完成后同步数据到 pinia ref
  setScanCompleteCallback(params => {
    store.syncRolesFromScanner(params);
  });

  // 初始化 dialogues（获取全部楼层）
  const lastId = getLastMessageId();
  const messages = getChatMessages('0-' + lastId);
  if (messages && messages.length > 0) {
    await store.loadAllDialogues();
  }

  // 弹幕初始化（从当前楼层读取）
  if (store.settings.danmakuEnabled) {
    const danmaku = store.currentDanmaku;
    if (danmaku.length > 0) {
      console.info('[App] 界面挂载时发现当前楼层弹幕:', danmaku.length, '条');
      store.displayDanmakuFromMessage(store.dialogues[store.currentDialogueIndex]?.message ?? '');
    }
  }

  console.info(`[galgame] Mounted streaming VN interface for floor ${context.message_id}`);
});

onUnmounted(() => {
  if (danmakuStyleEl?.parentNode) danmakuStyleEl.parentNode.removeChild(danmakuStyleEl);
  danmakuStyleEl = null;
  if (userCssStyleEl?.parentNode) userCssStyleEl.parentNode.removeChild(userCssStyleEl);
  userCssStyleEl = null;
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  try {
    if (window.parent !== window && window.parent.document) {
      window.parent.document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }
  } catch {
    /* 跨域时忽略 */
  }
});
</script>
