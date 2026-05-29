<!--
  PageRouter 组件

  自定义页面路由组件，管理应用内的页面切换。

  功能：
  - 管理 9 个主要页面的显示和切换
  - 基于 currentPage 状态控制页面显示
  - 支持全屏模式下的滚动策略切换
  - 提供存档管理功能（加载、删除、导入、清空）
  - 无障碍支持（ARIA 属性）
  - 自动监听全屏状态变化

  支持的页面：
  - home: 主页（故事和选择）
  - status: 状态页（角色信息）
  - shop: 商店页
  - cart: 购物车页
  - storage: 仓库页
  - achievements: 成就页
  - review: 回顾页（故事摘要）
  - settings: 设置页
  - load: 读档页

  Props:
  - currentPage: 当前显示的页面 ID
  - config: 游戏配置对象
  - story: 故事数据
  - choices: 选择数据
  - characters: 角色数据
  - shop: 商店数据
  - storage: 仓库数据
  - achievements: 成就数据
  - summaries: 摘要数据

  Emits:
  - choose: 当玩家做出选择时触发
  - load-save: 当加载存档时触发
  - delete-save: 当删除存档时触发
  - import-save: 当导入存档时触发
  - clear-all-saves: 当清空所有存档时触发

  使用示例：
  <PageRouter
    :current-page="currentPage"
    :config="config"
    :story="story"
    :choices="choices"
    :characters="characters"
    :shop="shop"
    :storage="storage"
    :achievements="achievements"
    :summaries="summaries"
    @choose="handleChoice"
    @load-save="handleLoadSave"
  />
-->
<template>
  <main :class="['page-router-container', scrollStrategyClass]">
    <!-- 主页 -->
    <section :class="['page', { active: currentPage === 'home' }]" aria-label="主页">
      <HomePage :config="config" :story="story" :choices="choices" @choose="handleChoice" />
    </section>

    <!-- 状态页 -->
    <section :class="['page', { active: currentPage === 'status' }]" aria-label="状态页">
      <StatusPage :config="config" :characters="characters" />
    </section>

    <!-- 商店页 -->
    <section :class="['page', { active: currentPage === 'shop' }]" aria-label="商店页">
      <ShopPage :config="config" :shop="shop" />
    </section>

    <!-- 购物车页 -->
    <section :class="['page', { active: currentPage === 'cart' }]" aria-label="购物车页">
      <CartPage :config="config" :shop="shop" />
    </section>

    <!-- 存储页 -->
    <section :class="['page', { active: currentPage === 'storage' }]" aria-label="存储页">
      <StoragePage :config="config" :storage="storage" />
    </section>

    <!-- 成就页 -->
    <section :class="['page', { active: currentPage === 'achievements' }]" aria-label="成就页">
      <AchievementsPage :config="config" :achievements="achievements" />
    </section>

    <!-- 回顾页 -->
    <section :class="['page', { active: currentPage === 'review' }]" aria-label="回顾页">
      <ReviewPage ref="reviewPageRef" :config="config" :summaries="summaries" />
    </section>

    <!-- 设置页 -->
    <section :class="['page', { active: currentPage === 'settings' }]" aria-label="设置页">
      <SettingsPage :config="config" />
    </section>

    <!-- 读档页 -->
    <section :class="['page', { active: currentPage === 'load' }]" aria-label="读档页">
      <LoadGamePage
        ref="loadGamePageRef"
        @load="handleLoadSave"
        @delete="handleDeleteSave"
        @import="handleImportSave"
        @clear-all="handleClearAllSaves"
      />
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type {
  Config,
  Story,
  Choice,
  Character,
  ShopData,
  StorageData,
  Achievement,
  Summary,
} from '../../types'
import HomePage from '../pages/HomePage.vue'
import StatusPage from '../pages/StatusPage.vue'
import ShopPage from '../pages/ShopPage.vue'
import CartPage from '../pages/CartPage.vue'
import StoragePage from '../pages/StoragePage.vue'
import AchievementsPage from '../pages/AchievementsPage.vue'
import ReviewPage from '../pages/ReviewPage.vue'
import SettingsPage from '../pages/SettingsPage.vue'
import LoadGamePage from '../pages/LoadGamePage.vue'
import { getScrollStrategy, watchFullscreenChange } from '../../utils/environment'
import { logger } from '../../utils/logger'

/**
 * Props 定义
 * 页面路由组件 - 负责渲染不同的页面
 * 支持智能滚动条管理：根据 iframe 环境和全屏状态动态调整滚动策略
 *
 * @property {string} currentPage - 当前显示的页面 ID
 * @property {Config} [config] - 游戏配置对象
 * @property {Story} [story] - 故事数据
 * @property {Choice[]} [choices] - 选择数据
 * @property {Record<string, Character>} [characters] - 角色数据
 * @property {ShopData} [shop] - 商店数据
 * @property {StorageData} [storage] - 仓库数据
 * @property {Record<string, Achievement>} [achievements] - 成就数据
 * @property {Summary[]} [summaries] - 摘要数据
 */
interface Props {
  /** 当前显示的页面 ID */
  currentPage: string
  /** 游戏配置对象 */
  config?: Config
  /** 故事数据 */
  story?: Story
  /** 选择数据 */
  choices?: Choice[]
  /** 角色数据 */
  characters?: Record<string, Character>
  /** 商店数据 */
  shop?: ShopData
  /** 仓库数据 */
  storage?: StorageData
  /** 成就数据 */
  achievements?: Record<string, Achievement>
  /** 摘要数据 */
  summaries?: Summary[]
}

defineProps<Props>()

/**
 * Emits 定义
 * @event choose - 当玩家做出选择时触发
 * @event loadSave - 当加载存档时触发
 * @event deleteSave - 当删除存档时触发
 * @event importSave - 当导入存档时触发
 * @event clearAllSaves - 当清空所有存档时触发
 */
interface Emits {
  (e: 'choose', choiceId: string): void
  (e: 'loadSave', saveName: string): void
  (e: 'deleteSave', saveName: string): void
  (e: 'importSave', yamlContent: string): void
  (e: 'clearAllSaves'): void
}

const emit = defineEmits<Emits>()

// Refs
const reviewPageRef = ref<InstanceType<typeof ReviewPage> | null>(null)
const loadGamePageRef = ref<InstanceType<typeof LoadGamePage> | null>(null)

// 滚动策略状态
const scrollStrategy = ref<'fixed' | 'adaptive'>(getScrollStrategy())

// 计算滚动策略对应的 CSS 类
const scrollStrategyClass = computed(() => {
  return scrollStrategy.value === 'adaptive' ? 'scroll-adaptive' : 'scroll-fixed'
})

// 监听全屏状态变化
let unwatchFullscreen: (() => void) | null = null

onMounted(() => {
  // 初始化滚动策略
  scrollStrategy.value = getScrollStrategy()

  // 监听全屏状态变化
  unwatchFullscreen = watchFullscreenChange(strategy => {
    scrollStrategy.value = strategy
    logger.debug('[PageRouter] 滚动策略已更新:', strategy)
  })

  logger.debug('[PageRouter] 初始滚动策略:', scrollStrategy.value)
})

onUnmounted(() => {
  // 清理监听器
  if (unwatchFullscreen) {
    unwatchFullscreen()
  }
})

// Handlers
function handleChoice(choiceId: string) {
  emit('choose', choiceId)
}

function handleLoadSave(saveName: string) {
  emit('loadSave', saveName)
}

function handleDeleteSave(saveName: string) {
  emit('deleteSave', saveName)
}

function handleImportSave(yamlContent: string) {
  emit('importSave', yamlContent)
}

function handleClearAllSaves() {
  emit('clearAllSaves')
}

// Expose refs for parent component
defineExpose({
  reviewPageRef,
  loadGamePageRef,
})
</script>

<style scoped>
/* ========================================
   页面路由容器样式
   ======================================== */

/* 基础容器样式 */
.page-router-container {
  position: relative;
  width: 100%;
  padding: var(--spacing-xl);
  padding-top: 0; /* 顶部无需padding，导航栏在顶部 */
  background: white;
}

/* ========================================
   滚动策略 1: 固定高度模式 (scroll-fixed)
   适用场景：
   - 独立运行（非 iframe）
   - iframe 环境 + 全屏模式
   ======================================== */
.page-router-container.scroll-fixed {
  /* 固定高度以触发内置滚动条 */
  height: 100%;
  min-height: 400px;
  flex: 1;
  /* 隐藏容器自身的滚动条，由内部页面控制 */
  overflow: hidden;
}

.page-router-container.scroll-fixed .page {
  /* 使用绝对定位确保固定高度 */
  position: absolute;
  top: 0;
  left: var(--spacing-xl);
  right: var(--spacing-xl);
  bottom: 0;
  /* 启用内置滚动条 */
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: var(--spacing-xl);
}

/* ========================================
   滚动策略 2: 自适应高度模式 (scroll-adaptive)
   适用场景：
   - iframe 环境 + 非全屏模式
   ======================================== */
.page-router-container.scroll-adaptive {
  /* 自适应高度，不设置固定高度 */
  height: auto;
  min-height: auto;
  /* 允许容器自然扩展 */
  overflow: visible;
}

.page-router-container.scroll-adaptive .page {
  /* 使用相对定位，允许自适应高度 */
  position: relative;
  top: auto;
  left: auto;
  right: auto;
  bottom: auto;
  /* 禁用内置滚动条，使用外部 iframe 滚动条 */
  overflow: visible;
  padding-bottom: var(--spacing-xl);
}

/* ========================================
   页面通用样式
   ======================================== */
.page {
  opacity: 0;
  visibility: hidden;
  /* 隐藏时不占据空间 */
  display: none;
  transition:
    opacity 0.3s ease,
    visibility 0.3s ease;
}

.page.active {
  opacity: 1;
  visibility: visible;
  /* 显示时占据空间 */
  display: block;
  z-index: 1;
}

/* ========================================
   响应式设计
   ======================================== */
@media (max-width: 1024px) {
  .page-router-container {
    padding: var(--spacing-lg);
    padding-top: 0;
  }

  .page-router-container.scroll-fixed .page {
    left: var(--spacing-lg);
    right: var(--spacing-lg);
    padding-bottom: var(--spacing-lg);
  }

  .page-router-container.scroll-adaptive .page {
    padding-bottom: var(--spacing-lg);
  }
}

@media (max-width: 768px) {
  .page-router-container {
    padding: var(--spacing-md);
    padding-top: 0;
  }

  .page-router-container.scroll-fixed .page {
    left: var(--spacing-md);
    right: var(--spacing-md);
    padding-bottom: var(--spacing-md);
  }

  .page-router-container.scroll-adaptive .page {
    padding-bottom: var(--spacing-md);
  }
}

@media (max-width: 480px) {
  .page-router-container {
    padding: var(--spacing-sm);
    padding-top: 0;
  }

  .page-router-container.scroll-fixed .page {
    left: var(--spacing-sm);
    right: var(--spacing-sm);
    padding-bottom: var(--spacing-sm);
  }

  .page-router-container.scroll-adaptive .page {
    padding-bottom: var(--spacing-sm);
  }
}
</style>
