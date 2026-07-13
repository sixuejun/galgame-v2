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
    <BackgroundLayer :background-image="currentBackgroundImage ?? undefined" />

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
      class="pointer-events-none absolute overflow-hidden"
      :style="danmakuContainerStyle"
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
import type { DanmakuItem } from './store';
import { useVNStore } from './store';
import BackgroundLayer from './components/stage/BackgroundLayer.vue';
import SpriteLayer from './components/stage/SpriteLayer.vue';

const store = useVNStore();

const stageFrameSkin = computed(() => store.getComponentSkinForCurrent('stageFrame'));

const noiseDataUri = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulance type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`;

const danmakuContainerStyle = computed(() => {
  const m = store.settings.danmakuDisplay;
  // 显示范围仅控制垂直方向：顶部/底部偏移，避开 UI 元素
  // 用户可通过 CSS 变量 --theme-danmaku-top-offset / --theme-danmaku-bottom-offset 调整
  return {
    top: 'var(--theme-danmaku-top-offset, 4.5rem)',
    bottom: 'var(--theme-danmaku-bottom-offset, 6rem)',
    left: 'var(--theme-danmaku-horizontal-padding, 0.5rem)',
    right: 'var(--theme-danmaku-horizontal-padding, 0.5rem)',
    zIndex: 'var(--theme-danmaku-z-index, 5)',
  };
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
  // 让弹幕在轨道内垂直居中：先定位到轨道中心，再 translate(-50%)
  // 这样无论字号多大都不会被容器截断
  const trackCenter = item.track * trackHeight + trackHeight / 2;
  // 优先用 store 算好的 duration（保持单一来源真理），
  // 否则 fallback 到本地估算
  const durationSec = item.duration
    ? item.duration / 1000
    : item.width / (0.15 * (0.02025 + store.settings.danmakuSpeed * 0.0405)) / 1000;
  return {
    top: `${trackCenter}%`,
    height: `${trackHeight}%`,
    animationDuration: `${durationSec}s`,
    fontSize: `${store.settings.danmakuFontSize}em`,
    color: store.settings.danmakuColor,
    opacity: store.settings.danmakuOpacity,
    lineHeight: `${trackHeight}%`,
  };
}

const currentBackgroundImage = computed(() => {
  return store.currentBlock?.sceneImageUrl || store.getCurrentDisplayBackground();
});

const currentSpriteImage = computed(() => {
  return store.currentBlock?.spriteImageUrl;
});

const currentCgImage = computed(() => {
  return store.currentBlock?.cgImageUrl || store.getCurrentDisplayCg();
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

/* 弹幕滚动动画 - 注意：transform 必须包含 translateY(-50%)
   否则弹幕会在垂直方向跳动（因为 .danmaku-item 用了 transform 居中） */
@keyframes danmaku-scroll {
  from {
    transform: translateY(-50%) translateX(100vw);
  }
  to {
    transform: translateY(-50%) translateX(calc(-100vw - 100%));
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
  width: max-content;
  /* 垂直居中：top 已定位到轨道中心，再用 translateY(-50%) */
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  white-space: nowrap;
  padding: 0 1em;
  /* 留点上下空间防字号过大时被裁切 */
  margin: 0.25em 0;
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
