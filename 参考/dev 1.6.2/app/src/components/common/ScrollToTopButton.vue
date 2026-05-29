<!--
  ScrollToTopButton 组件

  滚动到顶部按钮组件，用于快速返回页面顶部。

  功能：
  - 监听滚动位置
  - 自动显示/隐藏
  - 平滑滚动到顶部
  - 过渡动画
  - 无障碍支持
-->
<template>
  <Transition name="fade-scale">
    <button
      v-if="isVisible"
      class="scroll-to-top-button"
      title="回到顶部"
      aria-label="回到顶部"
      @click="scrollToTop"
    >
      <i class="fas fa-arrow-up" aria-hidden="true"></i>
    </button>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useNavigationStore } from '../../stores/navigationStore'
import { logger } from '../../utils/logger'
import { getScrollStrategy, watchFullscreenChange } from '../../utils/environment'

/**
 * 悬浮回顶按钮组件
 *
 * 功能：
 * - 在 fixed 模式（独立运行或 iframe 全屏）：监听 .page.active 的滚动事件，滚动超过 100px 时显示
 * - 在 adaptive 模式（iframe 非全屏）：始终显示按钮，因为此模式下页面使用外部滚动条
 * - 点击后平滑滚动到当前页面顶部的标题区域
 * - 固定在页面右下角
 * - 具有淡入淡出动画效果
 * - 作为通用组件，可以在各个页面中使用
 */

const navigationStore = useNavigationStore()
const isVisible = ref(false)
const scrollThreshold = 100 // 滚动阈值（px）
const scrollStrategy = ref<'fixed' | 'adaptive'>(getScrollStrategy())
let currentScrollElement: Element | null = null
let unwatchFullscreen: (() => void) | null = null
let pageChangeTimer: ReturnType<typeof setTimeout> | null = null

/**
 * 获取当前活动页面元素
 */
const getActivePage = (): Element | null => {
  return document.querySelector('.page.active')
}

/**
 * 处理滚动事件（仅在 fixed 模式下使用）
 */
const handleScroll = () => {
  const activePage = getActivePage()
  if (activePage) {
    const scrollTop = activePage.scrollTop || 0
    isVisible.value = scrollTop > scrollThreshold
  } else {
    isVisible.value = false
  }
}

/**
 * 滚动到顶部
 *
 * 统一使用 scrollIntoView 定位元素，不依赖滚动条操作
 * 优先定位到页面标题元素 (#page-title)，如果没有则定位到页面容器 (.page.active)
 */
const scrollToTop = () => {
  logger.info('🔝 用户点击回顶按钮')

  const activePage = getActivePage()
  if (!activePage) {
    logger.warn('⚠️ 未找到活动页面元素')
    return
  }

  // 查找页面标题元素
  const pageTitle = activePage.querySelector('#page-title')

  if (pageTitle) {
    // 优先定位到页面标题
    pageTitle.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest',
    })
    logger.debug(`📜 [ScrollToTopButton] ${scrollStrategy.value} 模式：定位到页面标题`)
  } else {
    // 如果没有标题元素，定位到页面容器顶部
    activePage.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest',
    })
    logger.debug(`📜 [ScrollToTopButton] ${scrollStrategy.value} 模式：定位到页面容器顶部`)
  }
}

/**
 * 设置滚动监听
 */
const setupScrollListener = () => {
  // 移除旧的监听器
  if (currentScrollElement) {
    currentScrollElement.removeEventListener('scroll', handleScroll)
    currentScrollElement = null
  }

  // 根据滚动策略设置不同的监听器
  if (scrollStrategy.value === 'adaptive') {
    // adaptive 模式：在 iframe 非全屏模式下
    // 由于 iframe 内部不滚动（overflow: visible），实际滚动的是父页面
    // iframe 内部无法检测父页面的滚动位置（跨域限制）
    // 因此在此模式下始终显示按钮
    isVisible.value = true
    logger.debug('📜 [ScrollToTopButton] adaptive 模式：始终显示按钮（iframe 内部不滚动）')
  } else {
    // fixed 模式：监听 .page.active 滚动
    const activePage = getActivePage()
    if (activePage) {
      activePage.addEventListener('scroll', handleScroll)
      currentScrollElement = activePage
      // 初始检查
      handleScroll()
      logger.debug('📜 [ScrollToTopButton] fixed 模式：监听 .page.active 滚动事件')
    } else {
      isVisible.value = false
    }
  }
}

/**
 * 更新滚动策略
 */
const updateScrollStrategy = (newStrategy: 'fixed' | 'adaptive') => {
  if (scrollStrategy.value !== newStrategy) {
    logger.info(`🔄 [ScrollToTopButton] 滚动策略变更: ${scrollStrategy.value} → ${newStrategy}`)
    scrollStrategy.value = newStrategy
    // 重新设置滚动监听
    setupScrollListener()
  }
}

// 生命周期钩子
onMounted(() => {
  // 初始化滚动策略
  scrollStrategy.value = getScrollStrategy()
  logger.info(`🎯 [ScrollToTopButton] 初始滚动策略: ${scrollStrategy.value}`)

  // 设置滚动监听
  setupScrollListener()

  // 监听全屏状态变化
  unwatchFullscreen = watchFullscreenChange(updateScrollStrategy)
})

onUnmounted(() => {
  // 移除滚动事件监听
  if (currentScrollElement) {
    currentScrollElement.removeEventListener('scroll', handleScroll)
  }

  // 移除全屏状态监听
  if (unwatchFullscreen) {
    unwatchFullscreen()
  }

  // 清理页面切换定时器
  if (pageChangeTimer) {
    clearTimeout(pageChangeTimer)
    pageChangeTimer = null
  }
})

// 监听页面切换，重新设置滚动监听
watch(
  () => navigationStore.currentPage,
  () => {
    // 清理之前的定时器
    if (pageChangeTimer) {
      clearTimeout(pageChangeTimer)
    }

    // 等待 DOM 更新后再设置监听器
    pageChangeTimer = setTimeout(() => {
      setupScrollListener()
      pageChangeTimer = null
    }, 100)
  }
)
</script>

<style scoped>
.scroll-to-top-button {
  position: fixed;
  right: 30px;
  bottom: 30px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-blue), var(--secondary-blue));
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  box-shadow:
    0 4px 16px rgba(0, 128, 255, 0.4),
    0 0 24px rgba(0, 191, 255, 0.2);
  transition: all var(--transition-base) var(--ease-out);
  z-index: var(--z-scroll-top);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.scroll-to-top-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition:
    width 0.6s var(--ease-out),
    height 0.6s var(--ease-out);
}

.scroll-to-top-button:hover::before {
  width: 120px;
  height: 120px;
}

.scroll-to-top-button:hover {
  transform: translateY(-4px) scale(1.05);
  background: linear-gradient(135deg, var(--secondary-blue), var(--primary-blue-light));
  box-shadow:
    0 8px 24px rgba(0, 128, 255, 0.6),
    0 0 40px rgba(0, 191, 255, 0.4);
}

.scroll-to-top-button:active {
  transform: translateY(-2px) scale(1.02);
}

.scroll-to-top-button i {
  position: relative;
  z-index: 1;
  transition: transform var(--transition-base) var(--ease-out);
}

.scroll-to-top-button:hover i {
  transform: translateY(-3px) scale(1.1);
}

/* 淡入淡出动画 */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all var(--transition-base) var(--ease-out);
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}

.fade-scale-enter-to,
.fade-scale-leave-from {
  opacity: 1;
  transform: scale(1) translateY(0);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .scroll-to-top-button {
    width: 48px;
    height: 48px;
    right: 20px;
    bottom: 20px;
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .scroll-to-top-button {
    width: 44px;
    height: 44px;
    right: 16px;
    bottom: 16px;
    font-size: 16px;
  }
}
</style>
