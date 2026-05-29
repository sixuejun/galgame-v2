<template>
  <div class="flex items-center gap-4 py-2">
    <span class="text-xs w-20 shrink-0" style="color: var(--theme-text-soft, rgba(212, 197, 160, 0.7))">{{
      label
    }}</span>
    <input type="range" :min="min" :max="max" :step="step" :value="value" class="flex-1 slider-vn" @input="onInput" />
    <span class="text-xs font-mono w-10 text-right" style="color: var(--theme-text-muted, var(--vn-muted))">
      {{ value }}{{ suffix }}
    </span>
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
