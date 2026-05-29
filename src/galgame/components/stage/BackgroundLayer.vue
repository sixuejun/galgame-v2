<template>
  <!-- Layer 1: 背景层 - 大气背景 + 背景图 -->
  <div data-ui="stage-background" class="absolute inset-0" :style="{ zIndex: 1 }">
    <!-- 默认大气背景 -->
    <div
      v-if="!currentBackgroundImage"
      class="atmospheric-background absolute inset-0"
      :class="{ 'newspaper-loading': isLoading }"
      :style="{ background: atmosphericGradient }"
    >
      <!-- 左侧光晕 -->
      <div
        class="absolute inset-0"
        :style="{ background: 'linear-gradient(to right, rgba(42,36,32,0.4), transparent, rgba(42,36,32,0.4))' }"
      />

      <!-- 水印文字 - 左上 -->
      <div
        class="watermark watermark-top-left"
        :style="watermarkStyle1"
      >
        EXTRA EDITION
      </div>

      <!-- 水印文字 - 右上 -->
      <div
        class="watermark watermark-top-right"
        :style="watermarkStyle2"
      >
        THE LAST GAZETTE
      </div>

      <!-- 水印文字 - 左下 -->
      <div
        class="watermark watermark-bottom-left"
        :style="watermarkStyle3"
      >
        末日旧闻
      </div>

      <!-- 水印文字 - 右下 -->
      <div
        class="watermark watermark-bottom-right"
        :style="watermarkStyle4"
      >
        第壹百零七期
      </div>
    </div>

    <!-- 加载态 -->
    <Transition name="fade">
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-spinner" aria-label="背景加载中" role="status">
          <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M486.4 106.666667m-106.666667 0a106.666667 106.666667 0 1 0 213.333334 0 106.666667 106.666667 0 1 0-213.333334 0Z"
              fill="#d4c4a4"
            />
            <path d="M93.866667 499.2m-12.8 0a12.8 12.8 0 1 0 25.6 0 12.8 12.8 0 1 0-25.6 0Z" fill="#d4c4a4" />
            <path d="M89.6 695.466667m-25.6 0a25.6 25.6 0 1 0 51.2 0 25.6 25.6 0 1 0-51.2 0Z" fill="#d4c4a4" />
            <path d="M196.266667 849.066667m-38.4 0a38.4 38.4 0 1 0 76.8 0 38.4 38.4 0 1 0-76.8 0Z" fill="#d4c4a4" />
            <path
              d="M503.466667 968.533333m-55.466667 0a55.466667 55.466667 0 1 0 110.933333 0 55.466667 55.466667 0 1 0-110.933333 0Z"
              fill="#d4c4a4"
            />
            <path
              d="M806.4 836.266667m-68.266667 0a68.266667 68.266667 0 1 0 136.533334 0 68.266667 68.266667 0 1 0-136.533334 0Z"
              fill="#d4c4a4"
            />
            <path
              d="M925.866667 529.066667m-81.066667 0a81.066667 81.066667 0 1 0 162.133333 0 81.066667 81.066667 0 1 0-162.133333 0Z"
              fill="#d4c4a4"
            />
            <path
              d="M793.6 226.133333m-93.866667 0a93.866667 93.866667 0 1 0 187.733334 0 93.866667 93.866667 0 1 0-187.733334 0Z"
              fill="#d4c4a4"
            />
          </svg>
        </div>
        <div class="loading-text">背景加载中...</div>
      </div>
    </Transition>

    <!-- 背景图 -->
    <Transition name="fade">
      <div
        v-if="currentBackgroundImage"
        class="background-image absolute inset-0 bg-cover bg-center bg-no-repeat"
        :style="{ backgroundImage: `url(${currentBackgroundImage})` }"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useVNStore } from '../../store';

const props = withDefaults(
  defineProps<{
    /** 当前背景图 URL */
    backgroundImage?: string;
    /** 是否显示加载状态 */
    isLoading?: boolean;
  }>(),
  {
    backgroundImage: '',
    isLoading: false,
  }
);

const store = useVNStore();

/** 当前背景图 */
const currentBackgroundImage = computed(() => {
  if (props.backgroundImage) return props.backgroundImage;

  // 优先级：手动选中的卡 > 消息块自带 > 舞台默认
  if (store.manualOverrideCardId) {
    const card = store.imageCardQueue.find(
      c => c.id === store.manualOverrideCardId && c.type === 'background'
    );
    if (card) return card.imageData;
  }

  return store.currentBlock?.sceneImageUrl || store.getCurrentDisplayBackground();
});

/** 大气背景渐变 */
const atmosphericGradient = computed(() =>
  'var(--theme-bg-gradient, linear-gradient(to bottom, rgba(42,36,32,0.8), rgba(74,64,53,0.6), rgba(42,36,32,0.9)))'
);

/** 水印样式 - 左上 */
const watermarkStyle1 = computed(() => ({
  top: '15%',
  left: '8%',
  fontSize: '3.5rem',
  fontWeight: '900',
  color: 'rgba(212, 197, 160, 0.04)',
  transform: 'rotate(-8deg)',
  whiteSpace: 'nowrap',
  fontFamily: 'serif',
}));

/** 水印样式 - 右上 */
const watermarkStyle2 = computed(() => ({
  top: '35%',
  right: '5%',
  fontSize: '2.2rem',
  fontWeight: '700',
  color: 'rgba(212, 197, 160, 0.03)',
  transform: 'rotate(3deg)',
  whiteSpace: 'nowrap',
  fontFamily: 'serif',
}));

/** 水印样式 - 左下 */
const watermarkStyle3 = computed(() => ({
  bottom: '30%',
  left: '15%',
  fontSize: '2.8rem',
  fontWeight: '900',
  color: 'rgba(212, 197, 160, 0.04)',
  transform: 'rotate(-3deg)',
  whiteSpace: 'nowrap',
  fontFamily: 'serif',
}));

/** 水印样式 - 右下 */
const watermarkStyle4 = computed(() => ({
  top: '55%',
  right: '20%',
  fontSize: '1.6rem',
  color: 'rgba(212, 197, 160, 0.03)',
  transform: 'rotate(5deg)',
  whiteSpace: 'nowrap',
  fontFamily: 'serif',
}));
</script>

<style scoped>
.atmospheric-background {
  filter: saturate(0.95) brightness(0.96);
}

.watermark {
  pointer-events: none;
  user-select: none;
  position: absolute;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  pointer-events: none;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.06), transparent 60%);
}

.loading-spinner {
  width: 70px;
  height: 70px;
  opacity: 0.85;
  animation: spin 1.25s linear infinite;
}

.loading-spinner svg {
  width: 100%;
  height: 100%;
}

.loading-text {
  font-family: serif;
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  color: rgba(212, 197, 160, 0.78);
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.35);
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
