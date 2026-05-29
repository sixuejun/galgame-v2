<template>
  <div
    v-if="showPortrait"
    class="dialogue-portrait-shell absolute"
    :style="portraitShellStyle"
  >
    <SkinShell :skin="portraitSkin">
      <div
        class="dialogue-portrait-content h-full w-full overflow-hidden"
        :style="portraitContentStyle"
      >
        <img
          v-if="avatarUrl"
          :src="avatarUrl"
          :alt="avatarName"
          class="dialogue-portrait-image h-full w-full object-cover"
          :style="imageStyle"
        />
        <!-- 占位符或默认头像 -->
        <div
          v-else
          class="dialogue-portrait-placeholder h-full w-full flex items-center justify-center"
        >
          <svg
            class="w-1/2 h-1/2 opacity-30"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
      </div>
    </SkinShell>
  </div>
</template>

<script setup lang="ts">
import SkinShell from '../common/SkinShell.vue';

const props = withDefaults(
  defineProps<{
    /** 头像 URL */
    avatarUrl?: string;
    /** 头像名称（用于 alt 文本） */
    avatarName?: string;
    /** 竖屏模式 */
    isPortraitMode?: boolean;
    /** 头像皮肤配置 */
    portraitSkin?: {
      shellImage: string | null;
      shellSize: { width: string; height: string };
      contentInset: { top: string; right: string; bottom: string; left: string };
    };
    /** 是否显示头像 */
    show?: boolean;
  }>(),
  {
    avatarName: '',
    isPortraitMode: false,
    show: true,
  }
);

/** 是否显示头像 */
const showPortrait = computed(() => props.show && props.avatarUrl);

/** 头像壳样式 */
const portraitShellStyle = computed(() => {
  if (props.isPortraitMode) {
    return {
      bottom: 'var(--theme-dialogue-portrait-bottom-portrait, calc(16vmin + 3vmin))',
      left: 'var(--theme-dialogue-portrait-left-portrait, 1.5vmin)',
      width: 'var(--theme-dialogue-portrait-width, 4em)',
      height: 'var(--theme-dialogue-portrait-height, 4em)',
      zIndex: 20,
    };
  }
  return {
    top: 'var(--theme-dialogue-portrait-top, 0.5em)',
    left: 'var(--theme-dialogue-portrait-left, 0.5em)',
    width: 'var(--theme-dialogue-portrait-width, 4em)',
    height: 'var(--theme-dialogue-portrait-height, 4em)',
    zIndex: 20,
  };
});

/** 头像内容区背景 */
const portraitContentStyle = computed(() => ({
  background: 'rgba(74,64,53,0.22)',
}));

/** 头像图片样式 */
const imageStyle = computed(() => ({
  filter: 'sepia(0.2) contrast(0.95)',
}));
</script>

<style scoped>
.dialogue-portrait-shell {
  display: var(--theme-dialogue-portrait-display, flex);
}

.dialogue-portrait-image {
  image-rendering: auto;
}

.dialogue-portrait-placeholder {
  color: var(--theme-text-muted, rgba(139, 125, 107, 0.8));
  background: rgba(0, 0, 0, 0.1);
}
</style>
