<template>
  <!--
    竖屏 (<sm): flex-col，标签独占一行，滑块+数值独占一行 —— "换行"是竖屏专属布局。
    横屏 (sm 及以上): 标签-滑块-数值横向排列。
      - 标签 sm:w-20 (5rem)：紧凑定宽；竖屏 w-full 独占一行。
      - 滑块组 sm:flex-1 min-w-0：随外层剩余空间自适应拉伸，是 SliderRow 里最舒展的部分。
      - 滑块自身 flex-1：再吃掉滑块组内的剩余空间。
      - 数值 w-12 (3rem)：紧贴滑块右侧，三位数 + 单位也不会紧贴滑块。
    自适应机制：标签定宽 → 滑块组 flex-1 吃外层剩余 → 滑块 flex-1 再吃组内剩余。
  -->
  <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 py-2">
    <span
      class="text-xs w-full sm:w-20 shrink-0 whitespace-nowrap"
      style="color: var(--theme-text-soft, rgba(212, 197, 160, 0.7))"
    >
      {{ label }}
    </span>
    <div class="flex flex-1 items-center gap-3 min-w-0">
      <input
        type="range"
        :min="min"
        :max="max"
        :step="step"
        :value="value"
        class="flex-1 slider-vn min-w-0"
        @input="onInput"
      />
      <span
        class="text-xs font-mono w-12 shrink-0 text-right whitespace-nowrap"
        style="color: var(--theme-text-muted, var(--vn-muted))"
      >
        {{ value }}{{ suffix }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string;
    value: number;
    min?: number;
    max?: number;
    step?: number;
    suffix?: string;
  }>(),
  { min: 0, max: 100, step: 1, suffix: '' },
);

const emit = defineEmits<{ update: [value: number] }>();

function onInput(e: Event) {
  emit('update', Number((e.target as HTMLInputElement).value));
}
</script>

<style scoped>
.slider-vn {
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  background: rgba(90, 79, 64, 0.4);
  border-radius: 2px;
  outline: none;
}
.slider-vn::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background: var(--theme-accent, var(--rust));
  border-radius: 2px;
  cursor: pointer;
  border: 1px solid rgba(212, 197, 160, 0.3);
}
.slider-vn::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: var(--theme-accent, var(--rust));
  border-radius: 2px;
  cursor: pointer;
  border: 1px solid rgba(212, 197, 160, 0.3);
}
</style>
