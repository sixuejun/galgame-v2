<template>
  <div class="skin-shell relative h-full" :style="shellContainerStyle">
    <img
      v-if="imageSrc && !imageError"
      :src="currentImage"
      class="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
      style="z-index: 0"
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

const shellContainerStyle = computed(() => {
  const style: Record<string, string> = {
    width: props.skin?.shellSize.width ?? '100%',
    height: props.skin?.shellSize.height ?? '100%',
    ...(props.shellStyle ?? {}),
  };
  if (naturalAspectRatio.value) {
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
  () => props.skin?.shellImage,
  () => {
    imageError.value = false;
    naturalAspectRatio.value = null;
  },
);
</script>
