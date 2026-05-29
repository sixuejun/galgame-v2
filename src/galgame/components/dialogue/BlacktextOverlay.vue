<template>
  <Transition name="blacktext-mask">
    <div
      v-if="isVisible"
      class="vn-blacktext-overlay absolute inset-0 flex cursor-pointer items-center justify-center overflow-hidden p-6 md:p-10"
      style="z-index: 60"
      @click="handleClick"
    >
      <!-- 纯黑底 -->
      <div
        class="vn-blacktext-backdrop absolute inset-0"
        :style="{ background: 'var(--theme-blacktext-bg, #000000)' }"
        aria-hidden="true"
      />

      <!-- 轻微颗粒感 -->
      <div class="vn-blacktext-grain pointer-events-none absolute inset-0 opacity-[0.07]" aria-hidden="true" />

      <!-- 文字区域 -->
      <div class="relative z-10 max-w-3xl text-center">
        <Transition name="blacktext-line">
          <p
            v-show="textVisible"
            class="vn-blacktext-text text-lg leading-relaxed tracking-widest md:text-2xl md:leading-relaxed"
          >
            {{ displayedText }}
            <span v-if="isTyping" class="vn-blacktext-caret ml-0.5 inline-block align-middle" />
          </p>
        </Transition>
      </div>

      <!-- 左箭头：后退 -->
      <div
        v-if="!isFirstBlock"
        class="vn-blacktext-arrow absolute top-1/2 left-4 -translate-y-1/2 transition-colors md:left-8"
      >
        <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </div>

      <!-- 右箭头：前进（仅非最后一块时显示） -->
      <div
        v-if="!isLastBlock"
        class="vn-blacktext-arrow absolute top-1/2 right-4 -translate-y-1/2 transition-colors md:right-8"
      >
        <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>

      <!-- 底部指示：左半后退，右半继续 -->
      <div v-if="!isTyping" class="vn-blacktext-hint absolute bottom-6 left-1/2 -translate-x-1/2 text-xs md:bottom-10">
        左侧后退 · 右侧继续
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useVNStore } from '../../store';

const props = withDefaults(
  defineProps<{
    /** 是否显示 */
    isVisible?: boolean;
    /** 当前显示的文本 */
    displayedText?: string;
    /** 是否正在打字中 */
    isTyping?: boolean;
    /** 是否是第一个块 */
    isFirstBlock?: boolean;
    /** 是否是最后一个块 */
    isLastBlock?: boolean;
    /** 文字是否可见（用于淡入动画） */
    textVisible?: boolean;
  }>(),
  {
    isVisible: false,
    displayedText: '',
    isTyping: false,
    isFirstBlock: true,
    isLastBlock: false,
    textVisible: false,
  }
);

const emit = defineEmits<{
  /** 点击事件 */
  click: [event: MouseEvent];
  /** 后退 */
  prev: [];
  /** 前进 */
  next: [];
}>();

const store = useVNStore();

function handleClick(event: MouseEvent) {
  emit('click', event);

  if (props.isTyping) {
    // 打字中，点击会由父组件处理跳过
    return;
  }

  const target = event.currentTarget as HTMLElement | null;
  if (!target) return;

  const rect = target.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const isLeftHalf = clickX < rect.width / 2;

  if (isLeftHalf) {
    if (!props.isFirstBlock) {
      emit('prev');
    }
    return;
  }

  if (!props.isLastBlock) {
    emit('next');
  }
}
</script>

<style scoped>
/* 全屏黑遮罩：淡入淡出转场 */
.blacktext-mask-enter-active,
.blacktext-mask-leave-active {
  transition: opacity 0.5s ease;
}

.blacktext-mask-enter-from,
.blacktext-mask-leave-to {
  opacity: 0;
}

/* 黑屏文字箭头 */
.vn-blacktext-arrow {
  color: var(--theme-blacktext-arrow-color, rgba(255, 255, 255, 0.3));
  transition: color 0.2s ease;
}

.vn-blacktext-overlay:hover .vn-blacktext-arrow:hover {
  color: var(--theme-blacktext-arrow-hover-color, rgba(255, 255, 255, 0.6));
}

/* 文字行：略晚于遮罩出现 */
.blacktext-line-enter-active {
  transition:
    opacity 0.45s ease 0.12s,
    transform 0.45s ease 0.12s;
}

.blacktext-line-enter-from {
  opacity: 0;
  transform: translateY(0.4em);
}

.vn-blacktext-text {
  color: var(--theme-blacktext-color, rgba(250, 248, 240, 0.95));
  font-family: 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', 'SimSun', serif;
  text-shadow: 0 0 1.5em rgba(0, 0, 0, 0.5);
}

.vn-blacktext-hint {
  color: var(--theme-blacktext-hint-color, rgba(255, 255, 255, 0.4));
}

.vn-blacktext-caret {
  width: 0.1em;
  height: 1.1em;
  background: rgba(250, 248, 240, 0.85);
  animation: cursor-blink 1s infinite;
}

.vn-blacktext-grain {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  mix-blend-mode: overlay;
}

@keyframes cursor-blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}
</style>
