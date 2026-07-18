<template>
  <div
    v-if="showPortrait"
    class="dialogue-portrait-shell absolute"
    :class="{ 'is-portrait': isPortraitMode }"
    :style="portraitShellStyle"
  >
    <SkinShell :skin="portraitSkin">
      <div class="dialogue-portrait-content h-full w-full overflow-hidden" :style="portraitContentStyle">
        <img
          v-if="avatarUrl"
          :src="avatarUrl"
          :alt="avatarName"
          class="dialogue-portrait-image h-full w-full object-cover"
          :style="imageStyle"
        />
        <!-- 占位符或默认头像 -->
        <div v-else class="dialogue-portrait-placeholder h-full w-full flex items-center justify-center">
          <svg class="w-1/2 h-1/2 opacity-30" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
            />
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
  },
);

/** 是否显示头像 */
const showPortrait = computed(() => props.show && props.avatarUrl);

/** 头像壳样式 */
const portraitShellStyle = computed(() => ({
  // 统一设置所有定位属性，CSS 的 .portrait-mode 会自动切换 top/bottom
  position: 'absolute',
  bottom: 'var(--theme-dialogue-portrait-bottom, calc(16vmin + 3vmin))',
  top: 'var(--theme-dialogue-portrait-top, 0.5rem)',
  left: 'var(--theme-dialogue-portrait-left, 0.75rem)',
  width: 'var(--theme-dialogue-portrait-width, 4rem)',
  height: 'var(--theme-dialogue-portrait-height, 4rem)',
  zIndex: 20,
}));

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

/* 竖屏时隐藏 top，使用 bottom；横屏时隐藏 bottom，使用 top */
.dialogue-portrait-shell.is-portrait {
  top: unset;
}
.dialogue-portrait-shell:not(.is-portrait) {
  bottom: unset;
}

.dialogue-portrait-image {
  image-rendering: auto;
}

.dialogue-portrait-placeholder {
  color: var(--theme-text-muted, rgba(139, 125, 107, 0.8));
  background: rgba(0, 0, 0, 0.1);
}
</style>
