<template>
  <SkinShell :skin="buttonSkin" :hovered="isHovered" :active="isActive">
    <button
      class="group flex cursor-pointer items-center border transition-all duration-200"
      :style="buttonStyle"
      @click="$emit('click')"
      @mouseenter="isHovered = true"
      @mouseleave="
        isHovered = false;
        isActive = false;
      "
      @mousedown="isActive = true"
      @mouseup="isActive = false"
    >
      <span v-if="iconSide === 'left'" style="color: var(--theme-accent-soft, rgba(139, 69, 19, 0.7))">
        <i :class="'fa-solid ' + icon" :style="{ fontSize: iconFontSize, transform: iconTransform }" />
      </span>
      <span
        class="tracking-wider whitespace-nowrap"
        :style="{ fontFamily: 'serif', fontSize: textFontSize, transform: textTransform }"
        >{{ label }}</span
      >
      <span v-if="iconSide === 'right'" style="color: var(--theme-accent-soft, rgba(139, 69, 19, 0.7))">
        <i :class="'fa-solid ' + icon" :style="{ fontSize: iconFontSize, transform: iconTransform }" />
      </span>
    </button>
  </SkinShell>
</template>

<script setup lang="ts">
import SkinShell from './SkinShell.vue';
import { useVNStore } from '../../store';
import type { ComponentKey } from '../../themes';

const props = defineProps<{
  icon: string;
  label: string;
  iconSide: 'left' | 'right';
  skinKey?: ComponentKey;
}>();

defineEmits<{
  click: [];
}>();

const store = useVNStore();
const isHovered = ref(false);
const isActive = ref(false);

const buttonSkin = computed(() => store.getComponentSkinForCurrent(props.skinKey ?? 'button'));

// 根据 skinKey 判断是左侧还是右侧按钮
const isLeftSide = computed(() => props.skinKey?.includes('Left'));
const isRightSide = computed(() => props.skinKey?.includes('Right'));

// 展开态图标样式
const iconFontSize = computed(() => {
  if (isLeftSide.value) return 'var(--theme-quick-menu-left-expanded-icon-size, 0.8rem)';
  if (isRightSide.value) return 'var(--theme-quick-menu-right-expanded-icon-size, 0.8rem)';
  return 'var(--theme-quick-menu-expanded-icon-size, 0.8rem)';
});

const iconTransform = computed(() => {
  if (isLeftSide.value) {
    return 'translate(var(--theme-quick-menu-left-expanded-icon-translate-x, 0px), var(--theme-quick-menu-left-expanded-icon-translate-y, 0px))';
  }
  if (isRightSide.value) {
    return 'translate(var(--theme-quick-menu-right-expanded-icon-translate-x, 0px), var(--theme-quick-menu-right-expanded-icon-translate-y, 0px))';
  }
  return 'none';
});

// 展开态文字样式
const textFontSize = computed(() => {
  if (isLeftSide.value) return 'var(--theme-quick-menu-left-expanded-text-size, 0.75rem)';
  if (isRightSide.value) return 'var(--theme-quick-menu-right-expanded-text-size, 0.75rem)';
  return 'var(--theme-quick-menu-expanded-text-size, 0.75rem)';
});

const textTransform = computed(() => {
  if (isLeftSide.value) {
    return 'translate(var(--theme-quick-menu-left-expanded-text-translate-x, 0px), var(--theme-quick-menu-left-expanded-text-translate-y, 0px))';
  }
  if (isRightSide.value) {
    return 'translate(var(--theme-quick-menu-right-expanded-text-translate-x, 0px), var(--theme-quick-menu-right-expanded-text-translate-y, 0px))';
  }
  return 'none';
});

const buttonStyle = computed(() => {
  const base = {
    width: '100%',
    height: '100%',
    minWidth: 'var(--theme-button-min-width, auto)',
    padding: 'var(--theme-button-padding-y, 0.375rem) var(--theme-button-padding-x, 0.75rem)',
    gap: 'var(--theme-button-gap, 0.5rem)',
    color: 'var(--theme-text-soft, rgba(212,197,160,0.8))',
    justifyContent:
      props.iconSide === 'right'
        ? 'var(--theme-button-justify-right, flex-end)'
        : 'var(--theme-button-justify-left, flex-start)',
    backdropFilter: 'blur(var(--theme-button-content-blur, 0px)) saturate(var(--theme-button-content-saturate, 100%))',
  };

  if (buttonSkin.value) {
    return {
      ...base,
      border: 'none',
      background: 'var(--theme-button-bg, transparent)',
    };
  }

  return {
    ...base,
    borderColor: 'rgba(90,79,64,0.5)',
    background: 'var(--vn-panel-bg)',
    borderRadius: '2px',
  };
});
</script>
