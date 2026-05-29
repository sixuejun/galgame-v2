<template>
  <div
    v-if="characterName"
    class="dialogue-name-shell absolute"
    :style="nameShellStyle"
  >
    <SkinShell :skin="nameSkin">
      <div
        class="dialogue-name-content flex gap-2"
        :style="nameContentStyle"
      >
        <span
          class="dialogue-name-text"
          :style="nameTextStyle"
        >
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
  top: 'var(--theme-dialogue-name-top, 0.5em)',
  left: 'var(--theme-dialogue-name-left, 5em)',
  zIndex: 5,
  maxWidth: 'var(--theme-dialogue-name-max-width, 12em)',
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
  fontSize: 'var(--theme-dialogue-name-font-size, 0.875em)',
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
