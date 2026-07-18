<template>
  <div v-if="characterName" class="dialogue-name-shell absolute" :style="nameShellStyle">
    <SkinShell :skin="nameSkin">
      <div class="dialogue-name-content flex gap-2" :style="nameContentStyle">
        <span class="dialogue-name-text" :style="nameTextStyle">
          {{ characterName }}
        </span>
      </div>
    </SkinShell>
  </div>
</template>

<script setup lang="ts">
import SkinShell from '../common/SkinShell.vue';

const props = defineProps<{
  /** 角色名称 */
  characterName?: string;
  /** 名字框皮肤配置 */
  nameSkin?: {
    shellImage: string | null;
    shellSize: { width: string; height: string };
    contentInset: { top: string; right: string; bottom: string; left: string };
  };
}>();

/** 名字壳样式 */
const nameShellStyle = computed(() => ({
  // 用 rem 作 fallback：避免祖先 font-size 较小时位置/大小也被缩小
  top: 'var(--theme-dialogue-name-top, 0.5rem)',
  left: 'var(--theme-dialogue-name-left, 2.5rem)',
  zIndex: 5,
  maxWidth: 'var(--theme-dialogue-name-max-width, 12rem)',
}));

/** 名字内容区样式 */
const nameContentStyle = computed(() => ({
  alignItems: 'var(--theme-dialogue-name-align-items, flex-start)',
  paddingLeft: 'var(--theme-dialogue-name-padding-left, 0px)',
  paddingTop: 'var(--theme-dialogue-name-padding-top, 0px)',
}));

/** 名字文字样式 */
const nameTextStyle = computed(() => ({
  color: 'var(--theme-dialogue-name-color, #6e4736)',
  // 关键：fallback 用 rem 而非 em，避免被祖先 font-size 联动缩小甚至消失
  fontSize: 'var(--theme-dialogue-name-font-size, 1rem)',
  fontWeight: 'bold',
  letterSpacing: '0.1em',
}));
</script>

<style scoped>
.dialogue-name-shell {
  display: block;
}

.dialogue-name-content {
  width: 100%;
  height: 100%;
}

.dialogue-name-text {
  display: inline-block;
}
</style>
