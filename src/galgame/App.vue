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

    <SettingsPanel v-if="store.activeOverlay === 'settings'" />
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
          color: 'var(--theme-toast-color, var(--theme-text-main, var(--vn-fg)))',
          border: '1px solid var(--theme-toast-border, rgba(90,79,64,0.55))',
          borderRadius: 'var(--theme-toast-radius, 4px)',
          boxShadow: 'var(--theme-toast-shadow, 0 8px 24px rgba(0,0,0,0.35))',
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
  </main>
</template>

<script setup lang="ts">
import { injectStreamingMessageContext } from '@util/streaming';
import AchievementNotch from './components/layout/AchievementNotch.vue';
import CharacterPanel from './components/panel/CharacterPanel.vue';
import ChoicePanel from './components/panel/ChoicePanel.vue';
import DialogueBox from './components/dialogue/DialogueBox.vue';
import DialogueInputPanel from './components/layout/DialogueInputPanel.vue';
import GameplayPanel from './components/module/GameplayPanel.vue';
import HistoryPanel from './components/panel/HistoryPanel.vue';
import ImageDeck from './components/stage/ImageDeck.vue';
import ImageGenRetryPanel from './components/common/ImageGenRetryPanel.vue';
import ImageAlbumPanel from './components/common/ImageAlbumPanel.vue';
import QuickAccessMenu from './components/layout/QuickAccessMenu.vue';
import SettingsPanel from './components/panel/SettingsPanel.vue';
import StageArea from './components/stage/StageArea.vue';
import { parseChoices, useVNStore } from './store';
import { setScanCompleteCallback } from './utils/roleScanner';
import { extractDanmakuBlock, extractImageTagBlocks } from './utils/messageParser';
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

function syncDanmakuStyle() {
  if (!danmakuStyleEl) return;
  const color = store.settings.danmakuColor || '#ffffff';
  const fontSize = store.settings.danmakuFontSize || 1.2;
  const opacity = store.settings.danmakuOpacity || 0.9;
  danmakuStyleEl.textContent = `#galgame-shell, [data-ui="app-root"] {
  --theme-danmaku-color: ${color};
  --theme-danmaku-font-size: ${fontSize};
  --theme-danmaku-opacity: ${opacity};
}`;
}

// 竖屏模式判断
const isPortraitMode = computed(() => store.settings.portraitMode);

// 主容器样式：仅用 width + aspect-ratio 决定高度（iframe 内禁止 vh，避免与比例冲突把宽度压成细条）
/** 从用户 CSS 文本中提取 --var(--xxx) 变量声明为 key-value 映射 */
function parseCssVarsToMap(cssText: string): Record<string, string> {
  const result: Record<string, string> = {};
  const re = /--([\w-]+)\s*:\s*([^;{]+?)(?:\s*!important)?\s*;/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cssText)) !== null) {
    const key = `--${m[1]}`;
    result[key] = m[2].trim();
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

  if (isPortraitMode.value) {
    return {
      ...base,
      aspectRatio: '3 / 4',
    };
  }
  return {
    ...base,
    aspectRatio: '16 / 9',
  };
});

// 覆盖层容器样式：竖屏模式下调整位置
const overlayContainerStyle = computed(() => {
  if (isPortraitMode.value) {
    return { zIndex: 20, minHeight: 0 };
  }
  return { zIndex: 20, minHeight: 0 };
});

// 对话框样式：竖屏模式下调整位置到底部中央
const dialogueBoxStyle = computed(() => {
  const style: Record<string, string> = {
    paddingBottom: isPortraitMode.value
      ? 'var(--theme-dialogue-bottom-portrait, 0.8vmin)'
      : 'var(--theme-dialogue-bottom, 1.5rem)',
    transform: 'translate(var(--theme-dialogue-translate-x, 0px), var(--theme-dialogue-translate-y, 0px))',
  };
  if (isPortraitMode.value) {
    style.paddingLeft = 'var(--theme-dialogue-portrait-padding-x, 1rem)';
    style.paddingRight = 'var(--theme-dialogue-portrait-padding-x, 1rem)';
  }
  return style;
});

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
    const blockChoices: { choiceId: string; text: string; isCustomInput: boolean }[] = block.options.map((text, idx) => ({
      choiceId: `c${idx}`,
      text,
      isCustomInput: false,
    }));

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

function handleChoiceSubmitted(_choiceId: string, text: string) {
  console.info(`[galgame] Choice submitted: ${text}`);
  createChatMessages([{ role: 'user', message: text }]).then(() => {
    triggerSlash('/trigger');
  });
}

function handleInputSubmit(text: string) {
  console.info(`[galgame] Input submitted: ${text}`);
  store.setOverlay('none');
  createChatMessages([{ role: 'user', message: text }]).then(() => {
    triggerSlash('/trigger');
  });
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

onMounted(async () => {
  if (!danmakuStyleEl) {
    danmakuStyleEl = document.createElement('style');
    danmakuStyleEl.setAttribute('data-ui', 'danmaku-css-vars');
    document.head.appendChild(danmakuStyleEl);
    syncDanmakuStyle();
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
