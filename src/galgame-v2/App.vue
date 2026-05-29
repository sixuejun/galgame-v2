<template>
  <main
    class="gl-app"
    :class="{ 'portrait-mode': uiStore.isPortraitMode }"
    :style="mainStyle"
    @click="handleClick"
  >
    <!-- 舞台区：背景 + 立绘 + 弹幕 -->
    <StageArea />

    <!-- 对话框 -->
    <DialogueBox />

    <!-- 选择框 -->
    <ChoicePanel />

    <!-- 快捷菜单（左右两侧） -->
    <QuickAccessMenu />

    <!-- 成就刘海 -->
    <AchievementNotch />

    <!-- 黑屏转场 -->
    <BlackScreen />

    <!-- 自动播放进度条 -->
    <AutoPlayBar />

    <!-- 覆盖层面板 -->
    <Transition name="overlay">
      <div v-if="uiStore.activeOverlay !== 'none'" class="gl-overlay">
        <HistoryPanel v-if="uiStore.activeOverlay === 'history'" />
        <CharacterPanel v-if="uiStore.activeOverlay === 'character'" />
        <GameplayPanel v-if="uiStore.activeOverlay === 'gameplay'" />
        <SettingsPanel v-if="uiStore.activeOverlay === 'settings'" />
        <AchievementList v-if="uiStore.activeOverlay === 'achievement'" />
        <ShopModule v-if="uiStore.activeOverlay === 'shop'" @close="uiStore.closeOverlay()" />
        <InventoryModule v-if="uiStore.activeOverlay === 'inventory'" @close="uiStore.closeOverlay()" />
        <WorkshopModule v-if="uiStore.activeOverlay === 'workshop'" @close="uiStore.closeOverlay()" />
        <GoldLogModule v-if="uiStore.activeOverlay === 'goldlog'" @close="uiStore.closeOverlay()" />
        <RiddleModule v-if="uiStore.activeOverlay === 'riddle'" @close="uiStore.closeOverlay()" />
        <CommsModule v-if="uiStore.activeOverlay === 'comms'" @close="uiStore.closeOverlay()" />
        <BoardGameModule v-if="uiStore.activeOverlay === 'boardgame'" @close="uiStore.closeOverlay()" />
        <Puzzle2048Module v-if="uiStore.activeOverlay === 'puzzle2048'" @close="uiStore.closeOverlay()" />
      </div>
    </Transition>

    <!-- 卡牌队列 -->
    <ImageDeck />
  </main>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue';
import { pinia } from './stores';
import {
  useNavigationStore,
  useDanmakuStore,
  useSettingsStore,
  useUIStore,
} from './stores';
import { injectStreamingMessageContext } from '@util/streaming';
import type { DialogueUnit } from './types';
import {
  parseMessageBlocks,
  extractDanmakuBlock,
  extractImageTagBlocks,
} from './utils/messageParser';

// 组件导入
import StageArea from './components/StageArea.vue';
import DialogueBox from './components/DialogueBox.vue';
import ChoicePanel from './components/ChoicePanel.vue';
import QuickAccessMenu from './components/QuickAccessMenu.vue';
import AchievementNotch from './components/AchievementNotch.vue';
import HistoryPanel from './components/HistoryPanel.vue';
import CharacterPanel from './components/CharacterPanel.vue';
import GameplayPanel from './components/GameplayPanel.vue';
import SettingsPanel from './components/SettingsPanel.vue';
import BlackScreen from './components/BlackScreen.vue';
import AutoPlayBar from './components/AutoPlayBar.vue';
import AchievementList from './components/AchievementList.vue';
import ImageDeck from './components/deck/ImageDeck.vue';
import ShopModule from './components/module/ShopModule.vue';
import InventoryModule from './components/module/InventoryModule.vue';
import WorkshopModule from './components/module/WorkshopModule.vue';
import GoldLogModule from './components/module/GoldLogModule.vue';
import RiddleModule from './components/module/RiddleModule.vue';
import CommsModule from './components/module/CommsModule.vue';
import BoardGameModule from './components/module/BoardGameModule.vue';
import Puzzle2048Module from './components/module/Puzzle2048Module.vue';

const context = injectStreamingMessageContext();
const navStore = useNavigationStore(pinia);
const danmakuStore = useDanmakuStore(pinia);
const settingsStore = useSettingsStore(pinia);
const uiStore = useUIStore(pinia);

const mainStyle = computed(() => ({
  '--theme-id': settingsStore.settings.themeId,
}));

// === 初始化：加载所有楼层 ===
async function loadAllDialogues() {
  try {
    const lastId = await getLastMessageId();
    if (lastId < 0) return;

    const messages = await getChatMessages(`0-${lastId}`);
    const units: DialogueUnit[] = [];

    for (const msg of messages) {
      if (msg.role !== 'assistant') continue;
      const blocks = await parseMessageBlocks(msg.content, undefined, msg.role);
      const danmakuTexts = extractDanmakuBlock(msg.content);
      const danmaku = danmakuTexts.map(text => ({ text }));
      const imageTags = extractImageTagBlocks(msg.content);

      units.push({
        messageId: msg.message_id,
        message: msg.content,
        blocks,
        parsed: true,
        danmaku,
        imageTags,
      });
    }

    navStore.loadAllDialogues(units);

    // 弹幕
    if (units.length > 0) {
      const lastDanmaku = units[units.length - 1].danmaku;
      danmakuStore.setDanmakuQueue(lastDanmaku);
    }
  } catch (e) {
    console.error('[App] 加载楼层失败:', e);
  }
}

// === 流式更新监听 ===
function handleStreamingUpdate(message: string) {
  if (!message) return;
  navStore.setStreaming(true);

  // 实时提取弹幕
  const dmTexts = extractDanmakuBlock(message);
  if (dmTexts.length > 0) {
    dmTexts.forEach(text => danmakuStore.pushDanmaku({ text }));
  }

  // 实时提取生图标签
  const tags = extractImageTagBlocks(message);
  // TODO: 触发生图请求
}

async function handleNewMessage(messageId: number) {
  navStore.setStreaming(false);
  try {
    const messages = await getChatMessages(String(messageId));
    const msg = messages[0];
    if (!msg || msg.role !== 'assistant') return;

    const blocks = await parseMessageBlocks(msg.content, undefined, msg.role);
    const danmakuTexts = extractDanmakuBlock(msg.content);
    const danmaku = danmakuTexts.map(text => ({ text }));
    const imageTags = extractImageTagBlocks(msg.content);

    navStore.appendNewDialogue({
      messageId: msg.message_id,
      message: msg.content,
      blocks,
      parsed: true,
      danmaku,
      imageTags,
    });

    danmakuStore.setDanmakuQueue(danmaku);
  } catch (e) {
    console.error('[App] 处理新消息失败:', e);
  }
}

// === 键盘事件 ===
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowRight' || e.key === ' ') {
    e.preventDefault();
    navStore.nextBlock();
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    navStore.prevBlock();
  }
}

// === 点击穿透 ===
function handleClick(e: MouseEvent) {
  // 点击对话框区域外可以触发翻页
  const target = e.target as HTMLElement;
  if (target.closest('.gl-overlay')) return;
  // 可扩展：点击空白区域翻页
}

// === 触摸滑动 ===
let touchStartX = 0;
function handleTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX;
}
function handleTouchEnd(e: TouchEvent) {
  const diff = touchStartX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 50) {
    if (diff > 0) navStore.nextBlock();
    else navStore.prevBlock();
  }
}

let unsubStreaming: (() => void) | undefined;
let unsubNewMsg: (() => void) | undefined;
let unsubKeydown: (() => void) | undefined;

onMounted(async () => {
  settingsStore.loadFromVariables();

  // 加载所有楼层
  await loadAllDialogues();

  // 监听流式更新
  unsubStreaming = context.onUpdate(message => {
    handleStreamingUpdate(message);
  });

  // 监听新消息
  unsubNewMsg = eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, async (messageId: number) => {
    await handleNewMessage(messageId);
  });

  // 键盘事件
  window.addEventListener('keydown', handleKeydown);
  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchend', handleTouchEnd, { passive: true });
});

onUnmounted(() => {
  unsubStreaming?.();
  unsubNewMsg?.();
  window.removeEventListener('keydown', handleKeydown);
  document.removeEventListener('touchstart', handleTouchStart);
  document.removeEventListener('touchend', handleTouchEnd);
});
</script>

<style lang="scss">
@import './styles/variables.css';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  overflow: hidden;
  background: var(--theme-bg);
  font-family: var(--theme-font-family, system-ui, sans-serif);
  color: var(--theme-text-main);
  -webkit-font-smoothing: antialiased;
  user-select: none;
}

.gl-app {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: var(--theme-bg);
}

.gl-app.portrait-mode {
  aspect-ratio: 3 / 4;
}

.gl-overlay {
  position: absolute;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.3s ease;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}
</style>
