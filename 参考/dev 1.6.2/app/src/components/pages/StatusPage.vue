<!--
  StatusPage 组件

  角色状态页面，显示多个角色的详细信息。

  功能：
  - 支持多角色标签页切换
  - 响应式侧边栏（移动端可折叠）
  - 动态渲染不同类型的数据块（文本、列表、键值对、进度条等）
  - 错误边界保护

  Props:
  - config (Config, 可选): 游戏配置对象
  - characters (Record<string, Character>, 默认: {}): 角色数据对象，键为角色ID

  Emits:
  无

  使用示例:
  ```vue
  <StatusPage
    :config="gameConfig"
    :characters="{ user: userData, nanami: nanamiData }"
  />
  ```
-->
<template>
  <ErrorBoundary @error="handleError">
    <div class="page-status">
      <div class="status-header">
        <h2 id="page-title">{{ pageTitle }}</h2>
        <!-- 移动端侧边栏切换按钮 -->
        <button class="sidebar-toggle-mobile-header" aria-label="切换侧边栏" @click="toggleSidebar">
          <i :class="['fas', isSidebarCollapsed ? 'fa-bars' : 'fa-times']"></i>
        </button>
      </div>
      <div class="status-layout" :class="{ 'sidebar-open': !isSidebarCollapsed }">
        <!-- 左侧侧边栏 -->
        <StatusSidebar
          :tabs="tabs"
          :active-tab="activeTab"
          :is-collapsed="isSidebarCollapsed"
          @toggle="toggleSidebar"
          @select-tab="selectTab"
        />

        <!-- 右侧内容区域 -->
        <div class="status-main">
          <div
            v-for="(tab, key) in tabs"
            :key="key"
            :class="['status-content', { active: activeTab === tab.id }]"
          >
            <div v-if="characters[tab.id]">
              <component
                :is="getBlockComponent(block.type)"
                v-for="(block, blockKey) in getCharacterBlocks(tab.id)"
                :key="blockKey"
                :title="block.title"
                v-bind="getBlockProps(block)"
              />
            </div>
            <p v-else class="no-data">暂无数据</p>
          </div>
        </div>
      </div>
    </div>
  </ErrorBoundary>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Config, Character, DataBlock } from '../../types'
import { BREAKPOINTS } from '../../constants'
import ErrorBoundary from '../common/ErrorBoundary.vue'
import StatusSidebar from './StatusPage/StatusSidebar.vue'
import DetailsSection from './StatusPage/DetailsSection.vue'
import ProgressBarsSection from './StatusPage/ProgressBarsSection.vue'
import StatusValuesSection from './StatusPage/StatusValuesSection.vue'
import TraitsSection from './StatusPage/TraitsSection.vue'
import { logger } from '../../utils/logger'

interface Props {
  config?: Config
  characters?: { [key: string]: Character }
}

const props = withDefaults(defineProps<Props>(), {
  characters: () => ({}),
})

// 页面标题 - 使用新数据模型结构
const pageTitle = computed(() => {
  return props.config?.status?.title || '系统状态监控'
})

// 获取状态页面的标签页配置 - 使用新数据模型结构
const tabs = computed(() => {
  return props.config?.status?.tabs || {}
})

const activeTab = ref(Object.values(tabs.value)[0]?.id || '')
// 移动端默认收起,桌面端默认展开
const isSidebarCollapsed = ref(window.innerWidth <= BREAKPOINTS.TABLET)

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

const selectTab = (tabId: string) => {
  activeTab.value = tabId
  // 在移动端选择后自动折叠侧边栏
  if (window.innerWidth <= BREAKPOINTS.TABLET) {
    isSidebarCollapsed.value = true
  }
}

/**
 * 检查值是否为 DataBlock
 */
const isDataBlock = (value: unknown): value is DataBlock => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'title' in value &&
    'content' in value
  )
}

const getCharacterBlocks = (characterId: string) => {
  const character = props.characters[characterId]
  if (!character) return []

  return Object.values(character).filter(isDataBlock)
}

const getBlockComponent = (type: string) => {
  const components: Record<string, unknown> = {
    details: DetailsSection,
    progress_bars: ProgressBarsSection,
    status_values: StatusValuesSection,
    traits: TraitsSection,
  }
  return components[type] || 'div'
}

const getBlockProps = (block: DataBlock) => {
  switch (block.type) {
    case 'details':
      return { details: block.content }
    case 'progress_bars':
      return { progressBars: block.content }
    case 'status_values':
      return { statusValues: block.content }
    case 'traits':
      return { traits: block.content }
    default:
      return {}
  }
}

/**
 * 处理错误
 */
const handleError = (error: Error) => {
  logger.error('状态页面发生错误:', error)
}

// 暴露给测试使用
defineExpose({
  isSidebarCollapsed,
})
</script>

<style scoped>
.page-status {
  animation: fadeInUp var(--transition-slow) cubic-bezier(0.4, 0, 0.2, 1);
}

/* 页面头部 */
.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
}

.page-status h2 {
  color: var(--primary-blue);
  margin-bottom: 0;
  font-size: var(--text-3xl);
  font-weight: var(--font-semibold);
  background: linear-gradient(135deg, var(--primary-blue), var(--secondary-blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 移动端切换按钮 - 默认隐藏 */
.sidebar-toggle-mobile-header {
  display: none;
}

.status-layout {
  display: flex;
  gap: var(--spacing-lg);
}

/* 主内容区域 */
.status-main {
  flex: 1;
  min-width: 0;
}

.status-content {
  display: none;
  animation: fadeInUp var(--transition-base) ease;
}

.status-content.active {
  display: block;
}

.no-data {
  text-align: center;
  color: var(--text-muted);
  padding: var(--spacing-2xl);
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-status h2 {
    font-size: var(--text-2xl);
  }

  /* 显示移动端切换按钮 */
  .sidebar-toggle-mobile-header {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    background: linear-gradient(135deg, var(--primary-blue), var(--secondary-blue));
    border: none;
    border-radius: var(--radius-lg);
    color: white;
    cursor: pointer;
    box-shadow: var(--shadow-md);
    transition: all var(--transition-base) ease;
    font-size: var(--text-lg);
    flex-shrink: 0;
  }

  .sidebar-toggle-mobile-header:hover {
    transform: scale(1.05);
    box-shadow: var(--shadow-lg);
  }

  .sidebar-toggle-mobile-header:active {
    transform: scale(0.95);
  }

  /* 状态布局容器 */
  .status-layout {
    position: relative;
    overflow: hidden;
  }
}
</style>
