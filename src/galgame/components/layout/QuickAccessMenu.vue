<template>
  <!-- Left top menu -->
  <div ref="leftRef" class="absolute" :style="leftMenuStyle">
    <div class="flex flex-col" :style="quickMenuStackStyle">
      <template v-if="!store.leftMenuExpanded">
        <SkinShell :skin="leftCollapsedSkin" :hovered="leftCollapsedHovered" :active="leftCollapsedActive">
          <button
            class="flex cursor-pointer items-center justify-center border backdrop-blur-sm transition-all duration-200"
            :style="leftCollapsedSkin ? skinnedIconButtonStyle : btnIconStyle"
            @click="store.toggleLeftMenu()"
            @mouseenter="leftCollapsedHovered = true"
            @mouseleave="
              leftCollapsedHovered = false;
              leftCollapsedActive = false;
            "
            @mousedown="leftCollapsedActive = true"
            @mouseup="leftCollapsedActive = false"
          >
            <i class="fa-solid fa-user" :style="leftCollapsedIconStyle" />
          </button>
        </SkinShell>
      </template>
      <template v-else>
        <div class="animate-fade-in-up flex flex-col" :style="leftExpandedStackStyle">
          <CapsuleButton
            icon="fa-user"
            label="角色"
            icon-side="left"
            :skin-key="LEFT_EXPANDED_SKIN_KEY"
            @click="store.setOverlay('character')"
          />
          <CapsuleButton
            icon="fa-gamepad"
            label="玩法"
            icon-side="left"
            :skin-key="LEFT_EXPANDED_SKIN_KEY"
            @click="store.setOverlay('gameplay')"
          />
        </div>
      </template>
    </div>
  </div>

  <!-- Right top menu -->
  <div ref="rightRef" class="absolute" :style="rightMenuStyle">
    <div class="flex flex-col items-end" :style="quickMenuStackStyle">
      <template v-if="!store.rightMenuExpanded">
        <SkinShell :skin="rightCollapsedSkin" :hovered="rightCollapsedHovered" :active="rightCollapsedActive">
          <button
            class="flex cursor-pointer items-center justify-center border backdrop-blur-sm transition-all duration-200"
            :style="rightCollapsedSkin ? skinnedIconButtonStyle : btnIconStyle"
            @click="store.toggleRightMenu()"
            @mouseenter="rightCollapsedHovered = true"
            @mouseleave="
              rightCollapsedHovered = false;
              rightCollapsedActive = false;
            "
            @mousedown="rightCollapsedActive = true"
            @mouseup="rightCollapsedActive = false"
          >
            <i class="fa-solid fa-gear" :style="rightCollapsedIconStyle" />
          </button>
        </SkinShell>
      </template>
      <template v-else>
        <div class="animate-fade-in-up flex flex-col items-end" :style="rightExpandedStackStyle">
          <CapsuleButton
            icon="fa-gear"
            label="设置"
            icon-side="right"
            :skin-key="RIGHT_EXPANDED_SKIN_KEY"
            @click="store.setOverlay('settings')"
          />
          <CapsuleButton
            :icon="isFullscreen ? 'fa-compress' : 'fa-expand'"
            :label="isFullscreen ? '退出全屏' : '全屏'"
            icon-side="right"
            :skin-key="RIGHT_EXPANDED_SKIN_KEY"
            @click="$emit('toggle-fullscreen')"
          />
          <CapsuleButton
            icon="fa-book-open"
            label="历史"
            icon-side="right"
            :skin-key="RIGHT_EXPANDED_SKIN_KEY"
            @click="store.setOverlay('history')"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import CapsuleButton from '../common/CapsuleButton.vue';
import SkinShell from '../common/SkinShell.vue';
import { useVNStore } from '../../store';

const LEFT_EXPANDED_SKIN_KEY = 'quickMenuExpandedLeft';
const RIGHT_EXPANDED_SKIN_KEY = 'quickMenuExpandedRight';

defineProps<{
  isFullscreen: boolean;
}>();

defineEmits<{ 'toggle-fullscreen': [] }>();

const store = useVNStore();
const leftRef = ref<HTMLDivElement | null>(null);
const rightRef = ref<HTMLDivElement | null>(null);
const leftCollapsedHovered = ref(false);
const leftCollapsedActive = ref(false);
const rightCollapsedHovered = ref(false);
const rightCollapsedActive = ref(false);

const leftCollapsedSkin = computed(() => store.getComponentSkinForCurrent('quickMenuCollapsedLeft'));
const rightCollapsedSkin = computed(() => store.getComponentSkinForCurrent('quickMenuCollapsedRight'));

const leftMenuStyle = {
  top: 'var(--theme-quick-menu-left-top, var(--theme-quick-menu-top, 1rem))',
  left: 'var(--theme-quick-menu-left, 1rem)',
  zIndex: '40',
};
const rightMenuStyle = {
  top: 'var(--theme-quick-menu-right-top, var(--theme-quick-menu-top, 1rem))',
  right: 'var(--theme-quick-menu-right, 1rem)',
  zIndex: '40',
};
const quickMenuStackStyle = {
  gap: 'var(--theme-quick-menu-gap, 0.62rem)',
};
const leftExpandedStackStyle = {
  gap: 'var(--theme-quick-menu-gap, 0.62rem)',
};
const rightExpandedStackStyle = {
  gap: 'var(--theme-quick-menu-gap, 0.62rem)',
};

const btnIconStyle = {
  width: 'var(--theme-quick-menu-collapsed-button-size, 2rem)',
  height: 'var(--theme-quick-menu-collapsed-button-size, 2rem)',
  borderColor: 'rgba(90,79,64,0.5)',
  background: 'var(--theme-button-bg, var(--vn-panel-bg))',
  color: 'var(--theme-accent-soft, rgba(139,69,19,0.7))',
  borderRadius: '2px',
  backdropFilter: 'blur(var(--theme-button-content-blur, 0px)) saturate(var(--theme-button-content-saturate, 100%))',
};

const skinnedIconButtonStyle = {
  width: '100%',
  height: '100%',
  padding: '0',
  borderColor: 'transparent',
  background: 'var(--theme-button-bg, transparent)',
  color: 'rgba(139,69,19,0.78)',
  borderRadius: '0px',
  backdropFilter: 'blur(var(--theme-button-content-blur, 0px)) saturate(var(--theme-button-content-saturate, 100%))',
};

const leftCollapsedIconStyle = {
  fontSize: 'var(--theme-quick-menu-left-collapsed-icon-size, var(--theme-quick-menu-icon-size, 0.875rem))',
  transform:
    'translate(var(--theme-quick-menu-left-collapsed-icon-translate-x, var(--theme-quick-menu-collapsed-icon-translate-x, 0px)), var(--theme-quick-menu-left-collapsed-icon-translate-y, var(--theme-quick-menu-collapsed-icon-translate-y, 0px)))',
};

const rightCollapsedIconStyle = {
  fontSize: 'var(--theme-quick-menu-right-collapsed-icon-size, var(--theme-quick-menu-icon-size, 0.875rem))',
  transform:
    'translate(var(--theme-quick-menu-right-collapsed-icon-translate-x, var(--theme-quick-menu-collapsed-icon-translate-x, 0px)), var(--theme-quick-menu-right-collapsed-icon-translate-y, var(--theme-quick-menu-collapsed-icon-translate-y, 0px)))',
};

function handleClickOutside(e: MouseEvent) {
  if (store.leftMenuExpanded && leftRef.value && !leftRef.value.contains(e.target as Node)) store.toggleLeftMenu();
  if (store.rightMenuExpanded && rightRef.value && !rightRef.value.contains(e.target as Node)) store.toggleRightMenu();
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside));
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside));
</script>
