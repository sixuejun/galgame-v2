<template>
  <div class="skin-shell relative h-full" :style="shellContainerStyle">
    <img
      v-if="imageSrc && !imageError"
      :src="currentImage"
      class="pointer-events-none absolute inset-0 select-none"
      :style="{ zIndex: 0, width: '100%', height: '100%', objectFit: objectFit }"
      draggable="false"
      @load="handleImageLoad"
      @error="imageError = true"
    />
    <div class="relative h-full w-full" style="z-index: 1" :style="contentInsetStyle">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ComponentSkin } from '../../themes';

const props = defineProps<{
  skin?: ComponentSkin;
  hovered?: boolean;
  active?: boolean;
  shellStyle?: Record<string, string>;
  disableAspectRatio?: boolean;
  /** 图片适配方式：cover 铺满（固定高度时使用）、contain 完整显示（保持比例）。默认 cover。 */
  objectFit?: 'cover' | 'contain';
}>();

const imageError = ref(false);
const naturalAspectRatio = ref<string | null>(null);

const imageSrc = computed(() => props.skin?.shellImage ?? '');

const currentImage = computed(() => {
  if (!props.skin) return '';
  if (props.active && props.skin.states?.active) return props.skin.states.active;
  if (props.hovered && props.skin.states?.hover) return props.skin.states.hover;
  return props.skin.shellImage ?? '';
});

const objectFit = computed(() => {
  if (props.skin?.objectFit) return props.skin.objectFit;
  const fromStyle = props.shellStyle?.objectFit as 'cover' | 'contain' | undefined;
  if (fromStyle) return fromStyle;
  const fromVar = getComputedStyle(document.documentElement)
    .getPropertyValue('--theme-shell-object-fit')
    .trim();
  if (fromVar === 'contain' || fromVar === 'cover') return fromVar;
  return props.objectFit ?? 'cover';
});

const shellContainerStyle = computed(() => {
  const explicitHeight = props.shellStyle?.height;
  const fit = objectFit.value;
  const style: Record<string, string> = {
    width: props.skin?.shellSize.width ?? '100%',
    height: props.skin?.shellSize.height ?? '100%',
    ...(props.shellStyle ?? {}),
  };
  if (fit === 'contain') {
    return style;
  }
  if (naturalAspectRatio.value && !props.disableAspectRatio && !explicitHeight) {
    style.aspectRatio = naturalAspectRatio.value;
  }
  return style;
});

const contentInsetStyle = computed(() => {
  if (!props.skin) return {};
  const { top, right, bottom, left } = props.skin.contentInset;
  return {
    paddingTop: top,
    paddingRight: right,
    paddingBottom: bottom,
    paddingLeft: left,
  };
});

function handleImageLoad(event: Event) {
  const image = event.currentTarget as HTMLImageElement;
  if (image.naturalWidth > 0 && image.naturalHeight > 0) {
    naturalAspectRatio.value = `${image.naturalWidth} / ${image.naturalHeight}`;
  }
}

watch(
  () => [props.skin?.shellImage, props.disableAspectRatio],
  () => {
    imageError.value = false;
    if (props.disableAspectRatio) {
      naturalAspectRatio.value = null;
    }
  },
);
</script>
