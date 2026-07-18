<template>
  <Transition name="vn-transition-mask">
    <div
      v-if="isActive"
      class="vn-transition-overlay pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
      style="z-index: 80"
      data-ui="transition-overlay"
    >
      <!-- 黑屏底（仅虚拟块进行中显示；用户主动退出虚拟块后不遮挡真实块文字） -->
      <div
        v-if="isVirtualActive"
        class="vn-transition-backdrop absolute inset-0"
        :style="{ background: 'var(--theme-blacktext-bg, #000000)' }"
        aria-hidden="true"
      />
      <div v-if="isVirtualActive" class="vn-transition-grain pointer-events-none absolute inset-0 opacity-[0.07]" aria-hidden="true" />

      <!-- 居中提示卡片 -->
      <Transition name="vn-transition-card">
        <div
          v-show="showCard"
          class="vn-transition-card relative z-10 max-w-md px-6 py-5 text-center"
          :style="{
            background: 'var(--theme-panel-bg, rgba(20, 18, 16, 0.78))',
            border: '1px solid var(--theme-panel-border, rgba(212, 197, 160, 0.35))',
            borderRadius: 'var(--theme-panel-radius, 6px)',
            boxShadow: 'var(--theme-panel-shadow, 0 8px 32px rgba(0,0,0,0.45))',
            color: 'var(--theme-text-main, rgba(212, 197, 160, 0.92))',
          }"
        >
          <div class="mb-2 text-xs tracking-widest opacity-60" style="letter-spacing: 0.2em">
            {{ phaseLabel }}
          </div>
          <div class="text-lg font-medium leading-relaxed md:text-xl">
            {{ headline }}
          </div>

          <!-- 子步骤行 -->
          <div v-if="subSteps.length > 0" class="mt-4 flex flex-col items-center gap-1.5">
            <div
              v-for="step in subSteps"
              :key="step.key"
              class="flex items-center gap-2 text-xs"
              :style="{
                color: step.state === 'done'
                  ? 'var(--theme-text-soft, rgba(212,197,160,0.55))'
                  : 'var(--theme-text-main, rgba(212, 197, 160, 0.92))',
              }"
            >
              <span
                class="inline-block h-2 w-2 rounded-full"
                :style="{
                  background: step.state === 'pending'
                    ? 'var(--theme-accent, var(--rust, #c66a3d))'
                    : step.state === 'done'
                    ? 'rgba(120, 180, 120, 0.7)'
                    : 'transparent',
                  border: step.state === 'pending' ? 'none' : '1px solid currentColor',
                }"
              />
              <span>{{ step.label }}</span>
            </div>
          </div>

          <!-- 阶段指示小条 -->
          <div class="mt-5 h-[2px] w-full overflow-hidden rounded-full" style="background: rgba(212,197,160,0.12)">
            <div
              class="h-full transition-all duration-500 ease-out"
              :style="{
                width: progressPercent + '%',
                background: 'var(--theme-accent, var(--rust, #c66a3d))',
              }"
            />
          </div>
        </div>
      </Transition>

      <!-- 左箭头：后退（虚拟块期间可点；非虚拟块期间点击也透传到 DialogueBox 的翻页按钮位置） -->
      <div
        class="vn-transition-arrow vn-transition-arrow--left pointer-events-auto absolute top-1/2 -translate-y-1/2 transition-colors"
        :style="{
          left: 'var(--theme-blacktext-arrow-left, 1rem)',
          color: 'var(--theme-blacktext-arrow-color, rgba(255, 255, 255, 0.45))',
        }"
        role="button"
        :aria-label="canPrev ? '后退' : '不可后退'"
        @click.stop="handlePrev"
      >
        <svg class="h-8 w-8 md:h-10 md:w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </div>

      <!-- 右箭头：前进（虚拟块期间始终禁用；只在非虚拟块期间允许『再次进入虚拟块』时点亮） -->
      <div
        class="vn-transition-arrow vn-transition-arrow--right pointer-events-auto absolute top-1/2 -translate-y-1/2 transition-colors"
        :style="{
          right: 'var(--theme-blacktext-arrow-right, 1rem)',
          color: canNext
            ? 'var(--theme-blacktext-arrow-color, rgba(255, 255, 255, 0.45))'
            : 'var(--theme-blacktext-arrow-disabled, rgba(255, 255, 255, 0.15))',
          cursor: canNext ? 'pointer' : 'not-allowed',
        }"
        role="button"
        :aria-label="canNext ? '前进' : '不可前进'"
        @click.stop="handleNext"
      >
        <svg class="h-8 w-8 md:h-10 md:w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>

      <!-- 底部提示：与黑屏文字一致的可翻页提示 -->
      <div
        v-if="showHint"
        class="vn-transition-hint pointer-events-none absolute left-1/2 -translate-x-1/2 text-xs md:text-sm"
        :style="{
          bottom: 'var(--theme-blacktext-hint-bottom, 1.5rem)',
          color: 'var(--theme-blacktext-hint-color, rgba(255, 255, 255, 0.45))',
          letterSpacing: '0.1em',
        }"
      >
        {{ hintText }}
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useVNStore } from '../../store';

const store = useVNStore();

const PHASE_LABELS: Record<string, string> = {
  idle: '',
  streaming: '生成回复',
  danmaku: '整理弹幕',
  image: '绘制插画',
  done: '即将继续',
};

const isActive = computed(() => store.transitionActive || store.virtualBlockExitedByUser);
const phase = computed(() => store.transitionPhase);

/** 是否处于真正的虚拟块（动画进行中） */
const isVirtualActive = computed(() => store.transitionActive);

/** 是否曾因左翻页退出过虚拟块（用于显示『再次右翻可回到虚拟块』的提示） */
const wasVirtualExited = computed(() => store.virtualBlockExitedByUser && !store.transitionActive);

const showCard = ref(false);

watch(isVirtualActive, active => {
  if (active) {
    // 60ms 延迟让遮罩先 fade-in 再显示卡片
    setTimeout(() => {
      showCard.value = true;
    }, 60);
  } else {
    showCard.value = false;
  }
});

watch(wasVirtualExited, exited => {
  // 用户主动退出虚拟块时，隐藏完整的进度卡片，仅保留翻页箭头 + 简化提示
  if (exited) {
    showCard.value = false;
  }
});

const phaseLabel = computed(() => PHASE_LABELS[phase.value] ?? '');

const headline = computed(() => {
  switch (phase.value) {
    case 'streaming':
      return '正在生成回复…';
    case 'danmaku':
      return store.settings.danmakuEnabled ? '正在整理观众弹幕…' : '正在整理剧情…';
    case 'image':
      return store.settings.imageGenEnabled ? '正在绘制场景插画…' : '正在收尾…';
    case 'done':
      return '准备就绪';
    default:
      return '';
  }
});

type SubStep = { key: string; label: string; state: 'pending' | 'done' };

const subSteps = computed<SubStep[]>(() => {
  const steps: SubStep[] = [];

  if (phase.value === 'streaming' || phase.value === 'danmaku' || phase.value === 'image' || phase.value === 'done') {
    steps.push({
      key: 'reply',
      label: '生成回复',
      state: phase.value === 'streaming' ? 'pending' : 'done',
    });
  }

  if (store.settings.danmakuEnabled || phase.value === 'danmaku' || phase.value === 'image' || phase.value === 'done') {
    steps.push({
      key: 'danmaku',
      label: '整理弹幕',
      state: phase.value === 'danmaku'
        ? 'pending'
        : phase.value === 'image' || phase.value === 'done'
        ? 'done'
        : phase.value === 'streaming'
        ? 'pending'
        : 'pending',
    });
  }

  if (store.settings.imageGenEnabled || phase.value === 'image' || phase.value === 'done') {
    steps.push({
      key: 'image',
      label: '绘制插画',
      state: phase.value === 'image' ? 'pending' : phase.value === 'done' ? 'done' : 'pending',
    });
  }

  if (phase.value === 'done') {
    return steps.map(s => ({ ...s, state: 'done' as const }));
  }

  return steps;
});

const progressPercent = computed(() => {
  switch (phase.value) {
    case 'streaming':
      return 25;
    case 'danmaku':
      return store.settings.danmakuEnabled ? 60 : 70;
    case 'image':
      return store.settings.imageGenEnabled ? 90 : 95;
    case 'done':
      return 100;
    default:
      return 0;
  }
});

/**
 * 翻页可用性：
 *  - 虚拟块期间：左翻可点（退出虚拟块）；右翻禁用（必须等生成完成）
 *  - 虚拟块被用户左翻退出后（wasVirtualExited）：
 *      - 左翻：回到上一真实块（普通逻辑），前提是 not isFirstBlock
 *      - 右翻：允许再次进入虚拟块
 *  - 其余情况跟随真实块的 canPrev / canNext
 */
const canPrev = computed(() => {
  if (isVirtualActive.value) return !store.isFirstBlock;
  if (wasVirtualExited.value) return !store.isFirstBlock;
  return !store.isFirstBlock;
});

const canNext = computed(() => {
  if (isVirtualActive.value) return false; // 虚拟块期间右翻禁用
  if (wasVirtualExited.value) return true; // 用户退出虚拟块后右翻可重新进入
  return !store.isLastBlock;
});

const showHint = computed(() => isVirtualActive.value || wasVirtualExited.value);

const hintText = computed(() => {
  if (isVirtualActive.value) {
    // 虚拟块进行中：左翻可退回上一块，右翻禁用
    if (store.isFirstBlock) return '正在等待生成完成…';
    return '左侧后退 · 等待完成自动继续';
  }
  if (wasVirtualExited.value) {
    return '右侧点击继续等待生成';
  }
  return '';
});

function handlePrev() {
  if (!canPrev.value) return;
  store.navigateBlock(-1);
}

function handleNext() {
  if (!canNext.value) return;
  store.navigateBlock(1);
}
</script>

<style scoped>
.vn-transition-mask-enter-active,
.vn-transition-mask-leave-active {
  transition: opacity 0.45s ease;
}

.vn-transition-mask-enter-from,
.vn-transition-mask-leave-to {
  opacity: 0;
}

.vn-transition-grain {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  mix-blend-mode: overlay;
}

.vn-transition-card-enter-active {
  transition:
    opacity 0.45s ease,
    transform 0.45s ease;
}

.vn-transition-card-leave-active {
  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
}

.vn-transition-card-enter-from {
  opacity: 0;
  transform: translateY(0.6em);
}

.vn-transition-card-leave-to {
  opacity: 0;
  transform: translateY(-0.3em);
}

/* 翻页箭头（与黑屏文字一致：默认半透明，hover 时加深） */
.vn-transition-arrow {
  cursor: pointer;
  transition:
    color 0.2s ease,
    transform 0.2s ease;
}

.vn-transition-arrow:hover {
  color: var(--theme-blacktext-arrow-hover-color, rgba(255, 255, 255, 0.75)) !important;
}

.vn-transition-arrow:active {
  transform: translateY(-50%) scale(0.92);
}

@media (min-width: 768px) {
  .vn-transition-arrow--left {
    left: var(--theme-blacktext-arrow-left-md, 2rem) !important;
  }
  .vn-transition-arrow--right {
    right: var(--theme-blacktext-arrow-right-md, 2rem) !important;
  }
  .vn-transition-hint {
    bottom: var(--theme-blacktext-hint-bottom-md, 2.5rem) !important;
  }
}
</style>
