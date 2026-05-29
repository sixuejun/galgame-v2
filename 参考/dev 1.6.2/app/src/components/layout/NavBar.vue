<!--
  NavBar 组件

  应用的主导航栏组件，显示页面导航按钮和操作按钮。

  功能：
  - 显示主要页面导航按钮（主页、商店、状态、成就、设置等）
  - 高亮当前活动页面
  - 提供存档/读档操作按钮
  - 显示当前游戏阶段
  - 支持自定义按钮名称和图标
  - 无障碍支持（ARIA 属性）

  Props:
  - navButtons: 自定义导航按钮配置（可选）
  - currentPage: 当前活动页面 ID
  - phase: 当前游戏阶段文本

  Events:
  - navigate: 导航到指定页面时触发，参数为页面 ID
  - save: 点击存档按钮时触发
  - load: 点击读档按钮时触发

  使用示例：
  <NavBar
    :nav-buttons="customButtons"
    :current-page="currentPage"
    :phase="gamePhase"
    @navigate="handleNavigate"
    @save="handleSave"
    @load="handleLoad"
  />
-->
<template>
  <!-- 悬停触发区域 - 仅在自动隐藏模式下显示 -->
  <div v-if="enableNavbarAutoHide" class="nav-trigger-area" @mouseenter="handleMouseEnter"></div>

  <nav
    :class="['nav-bar', { 'auto-hide': enableNavbarAutoHide, visible: isNavbarVisible }]"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div id="nav-buttons-main" class="nav-group">
      <NavButton
        v-for="(button, key) in mergedNavButtons"
        :key="key"
        :icon="button.icon"
        :name="button.name"
        :is-active="currentPage === button.id"
        @click="$emit('navigate', button.id)"
      />
    </div>
    <div class="nav-group nav-group-right">
      <ActionButtons @save="$emit('save')" @load="$emit('load')" />
      <div class="phase-indicator" role="status" aria-live="polite" aria-label="当前游戏阶段">
        {{ phase }}
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { NavButton as NavButtonType } from '../../types'
import NavButton from './NavBar/NavButton.vue'
import ActionButtons from './NavBar/ActionButtons.vue'
import { DEFAULT_NAV_BUTTONS } from '../../constants'
import { useSettingsStore } from '../../stores/settingsStore'

/**
 * Props 定义
 */
const props = defineProps<{
  /** 自定义导航按钮配置，用于覆盖默认按钮的名称和图标 */
  navButtons?: {
    [key: string]: {
      name?: string
      icon?: string
    }
  }
  /** 当前活动页面 ID */
  currentPage: string
  /** 当前游戏阶段文本 */
  phase: string
}>()

/**
 * Events 定义
 */
defineEmits<{
  /** 导航到指定页面 */
  navigate: [pageId: string]
  /** 触发存档操作 */
  save: []
  /** 触发读档操作 */
  load: []
}>()

const settingsStore = useSettingsStore()

/**
 * 是否启用导航栏自动隐藏
 */
const enableNavbarAutoHide = computed(() => {
  return settingsStore.settings.enableNavbarAutoHide
})

/**
 * 导航栏是否可见（仅在自动隐藏模式下使用）
 */
const isNavbarVisible = ref(false)

/**
 * 鼠标进入导航栏或触发区域
 */
const handleMouseEnter = () => {
  if (enableNavbarAutoHide.value) {
    isNavbarVisible.value = true
  }
}

/**
 * 鼠标离开导航栏
 */
const handleMouseLeave = () => {
  if (enableNavbarAutoHide.value) {
    isNavbarVisible.value = false
  }
}

/**
 * 合并默认配置和外部数据
 * 所有按钮始终显示，外部数据仅用于覆盖 name 和 icon
 */
const mergedNavButtons = computed(() => {
  const result: { [key: string]: NavButtonType } = {}

  // 遍历默认按钮配置
  for (const [key, defaultButton] of Object.entries(DEFAULT_NAV_BUTTONS)) {
    const externalButton = props.navButtons?.[key]

    result[key] = {
      id: defaultButton.id,
      name: externalButton?.name || defaultButton.name,
      icon: externalButton?.icon || defaultButton.icon,
    }
  }

  return result
})
</script>

<style scoped>
/* ========================================
   悬停触发区域
   ======================================== */
.nav-trigger-area {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 20px;
  z-index: calc(var(--z-sticky) + 1);
  background: transparent;
  cursor: pointer;
}

/* ========================================
   导航栏基础样式
   ======================================== */
.nav-bar {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(245, 249, 252, 0.95) 100%);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  padding: var(--spacing-md) var(--spacing-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid rgba(0, 128, 255, 0.3);
  box-shadow: 0 4px 24px rgba(0, 128, 255, 0.15);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  transition:
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s ease;
}

/* ========================================
   自动隐藏模式
   ======================================== */
.nav-bar.auto-hide {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  transform: translateY(-100%);
  opacity: 0;
}

.nav-bar.auto-hide.visible {
  transform: translateY(0);
  opacity: 1;
}

.nav-group {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}

.phase-indicator {
  padding: 8px 18px;
  background: rgba(0, 128, 255, 0.1);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 128, 255, 0.3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  color: var(--primary-blue);
  font-weight: var(--font-bold);
  letter-spacing: 1px;
  text-transform: uppercase;
  box-shadow: 0 2px 12px rgba(0, 128, 255, 0.2);
}

/* ========================================
   响应式布局 - 平板端 (481px - 768px)
   ======================================== */
@media (max-width: 768px) and (min-width: 481px) {
  .nav-bar {
    padding: var(--spacing-sm) var(--spacing-md);
    /* 取消左右分组，改为两行布局 */
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: stretch;
  }

  /* 第一行：导航按钮组 */
  .nav-group {
    justify-content: center;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }

  /* 第二行：功能按钮 + 阶段指示器 */
  .nav-group-right {
    justify-content: center;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }

  .phase-indicator {
    font-size: 10px;
    padding: 8px 14px;
    white-space: nowrap;
  }
}

/* ========================================
   响应式布局 - 移动端 (≤480px)
   ======================================== */
@media (max-width: 480px) {
  .nav-bar {
    padding: var(--spacing-sm) var(--spacing-sm);
    /* 取消左右分组，改为紧凑式多行布局 */
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: stretch;
  }

  /* 导航按钮组 - 使用 Grid 布局充分利用空间 */
  .nav-group {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-xs);
    width: 100%;
  }

  /* 功能按钮组 - 紧凑排列 */
  .nav-group-right {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--spacing-xs);
    width: 100%;
  }

  /* 阶段指示器 - 独占一行，居中显示 */
  .phase-indicator {
    font-size: 9px;
    padding: 8px 12px;
    white-space: nowrap;
    flex: 1 1 100%;
    text-align: center;
  }
}
</style>
