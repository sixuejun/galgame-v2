<template>
  <div data-ui="stage-area" class="absolute inset-0" style="overflow: hidden; min-height: 0">
    <!-- Stage frame overlay (image skin border) -->
    <img
      v-if="stageFrameSkin?.shellImage"
      :src="stageFrameSkin.shellImage"
      class="pointer-events-none absolute inset-0 h-full w-full object-contain select-none"
      style="z-index: 10"
      draggable="false"
    />

    <!-- Layer 1: 背景层 - 使用 BackgroundLayer 子组件 -->
    <BackgroundLayer :background-image="currentBackgroundImage" />

    <!-- Layer 2: 立绘层 - 使用 SpriteLayer 子组件（含 Live2D 接入点） -->
    <SpriteLayer
      :sprite-image="currentSpriteImage"
      :player-avatar-url="store.userCharacter.avatarUrl"
      :player-name="store.userCharacter.name"
      :show-player-sprite="showPlayerSpriteOverlay"
    />

    <!-- Layer 3: 效果层（暗角、噪点等） -->
    <div class="pointer-events-none absolute inset-0" style="z-index: 3">
      <!-- 暗角效果 -->
      <div
        class="absolute inset-0"
        :style="{
          background:
            'var(--theme-stage-vignette, radial-gradient(ellipse at center, transparent 40%, rgba(42,36,32,0.7) 100%))',
        }"
      />
      <!-- 噪点效果 -->
      <div class="absolute inset-0" style="opacity: 0.04" :style="{ backgroundImage: noiseDataUri }" />
    </div>

    <!-- Layer 4: CG层（生成的图片和CG都在这一层，展示时隐藏背景和立绘） -->
    <Transition name="fade">
      <div
        v-if="currentCgImage"
        class="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style="z-index: 4"
        :style="{ backgroundImage: `url(${currentCgImage})` }"
      />
    </Transition>

    <!-- Layer 5: 弹幕层 -->
    <div
      v-if="store.settings.danmakuEnabled"
      class="pointer-events-none absolute inset-x-0 overflow-hidden"
      :style="{ height: danmakuHeight, top: danmakuTopOffset, zIndex: 5 }"
    >
      <div class="danmaku-container">
        <div
          v-for="item in store.danmakuItems"
          :key="item.id"
          class="danmaku-item danmaku-scroll"
          :style="getDanmakuStyle(item)"
        >
          {{ item.text }}
        </div>
      </div>
    </div>

    <!-- Layer 6: UI层（对话框等UI元素在这里，由父组件渲染） -->
  </div>
</template>

<script setup lang="ts">
import type { DanmakuItem } from '../../store';
import { useVNStore } from '../../store';
import BackgroundLayer from './BackgroundLayer.vue';
import SpriteLayer from './SpriteLayer.vue';

const store = useVNStore();

const stageFrameSkin = computed(() => store.getComponentSkinForCurrent('stageFrame'));

const noiseDataUri = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulance type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`;

const danmakuHeight = computed(() => {
  const m = store.settings.danmakuDisplay;
  return m === 'full' ? '100%' : m === 'half' ? '50%' : '33%';
});

const danmakuTrackCount = computed(() => {
  const m = store.settings.danmakuDisplay;
  switch (m) {
    case 'full':
      return 17;
    case 'half':
      return 8;
    case 'third':
      return 6;
    default:
      return 6;
  }
});

function getDanmakuStyle(item: DanmakuItem) {
  const trackHeight = 100 / danmakuTrackCount.value;
  const top = item.track * trackHeight;
  const speedMultiplier = 0.02025 + store.settings.danmakuSpeed * 0.0405;
  const duration = item.width / (0.15 * speedMultiplier) / 1000;
  return {
    top: `${top}%`,
    height: `${trackHeight}%`,
    display: 'flex',
    alignItems: 'center',
    animationDuration: `${duration}s`,
    fontSize: `${store.settings.danmakuFontSize}em`,
    color: store.settings.danmakuColor,
    opacity: store.settings.danmakuOpacity,
  };
}

const danmakuTopOffset = computed(() => {
  return `${store.settings.danmakuTopOffset ?? 10}rem`;
});

const currentBackgroundImage = computed(() => {
  // 修复3：绑定图（stageBackgroundImage）优先级高于世界书资源图
  const bindingBg = store.getCurrentDisplayBackground();
  if (bindingBg) return bindingBg;
  return store.currentBlock?.sceneImageUrl ?? null;
});

const currentSpriteImage = computed(() => {
  return store.currentBlock?.spriteImageUrl;
});

const currentCgImage = computed(() => {
  // 修复3：绑定图优先级高于世界书资源图
  const bindingCg = store.getCurrentDisplayCg();
  if (bindingCg) return bindingCg;
  return store.currentBlock?.cgImageUrl ?? null;
});

const showPlayerSpriteOverlay = computed(() => {
  if (!store.userCharacter.avatarUrl) return false;
  if (store.userCharacter.avatarDisplayMode !== 'sprite') return false;
  const block = store.currentBlock;
  if (!block || block.type !== 'character') return false;
  return /^(<user>|user)$/i.test((block.character || '').trim());
});
</script>

<style scoped>
[data-ui='stage-area'] .fade-enter-active,
[data-ui='stage-area'] .fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 弹幕滚动动画 */
@keyframes danmaku-scroll {
  from {
    transform: translateX(100vw);
  }
  to {
    transform: translateX(calc(-100vw - 100%));
  }
}

.danmaku-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.danmaku-item {
  position: absolute;
  left: 0;
  white-space: nowrap;
  padding: 0 1em;
  text-shadow:
    1px 1px 2px rgba(0, 0, 0, 0.8),
    -1px -1px 2px rgba(0, 0, 0, 0.8),
    1px -1px 2px rgba(0, 0, 0, 0.8),
    -1px 1px 2px rgba(0, 0, 0, 0.8);
  will-change: transform;
}

.danmaku-scroll {
  animation: danmaku-scroll linear forwards;
}
</style>
