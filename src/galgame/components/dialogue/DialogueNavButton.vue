<template>
  <button
    class="dialogue-nav-btn"
    :class="{ 'dialogue-nav-btn--disabled': disabled, 'dialogue-nav-btn--prev': direction === 'prev' }"
    :disabled="disabled"
    :style="buttonStyle"
    @click.stop="$emit('click')"
    v-html="svgContent"
  />
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    svgContent: string;
    disabled?: boolean;
    direction?: 'prev' | 'next';
  }>(),
  {
    disabled: false,
    direction: 'next',
  },
);

defineEmits<{
  click: [];
}>();

const buttonStyle = computed(() => ({
  color: props.disabled
    ? `var(--theme-dialogue-nav-color, #6e4736)`
    : `var(--theme-dialogue-nav-hover-color, var(--theme-dialogue-nav-color, #6e4736))`,
  opacity: props.disabled ? `var(--theme-dialogue-nav-disabled-opacity, 0.2)` : '1',
}));
</script>

<style scoped>
.dialogue-nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition:
    opacity 0.2s ease,
    color 0.2s ease;
}

.dialogue-nav-btn :deep(svg) {
  width: var(--theme-dialogue-nav-btn-size, 2rem);
  height: var(--theme-dialogue-nav-btn-size, 2rem);
  fill: currentColor;
}

/* 左侧按钮左右翻转，使其指向左 */
.dialogue-nav-btn--prev :deep(svg) {
  transform: scaleX(-1);
}

.dialogue-nav-btn--disabled {
  cursor: not-allowed;
}
</style>
