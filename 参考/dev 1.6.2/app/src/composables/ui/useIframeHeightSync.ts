/**
 * @file useIframeHeightSync.ts
 * @description iframe 高度同步 Composable - 自动同步 iframe 高度到父窗口
 * @author Eden System Team
 */

import { ref, onMounted, onUnmounted } from 'vue'
import { isInIframe, getScrollStrategy } from '../../utils/environment'
import { logger } from '../../utils/logger'
import { debounce } from '../../utils/debounce'

/**
 * iframe 高度同步 Composable
 *
 * 功能：
 * - 在 iframe 非全屏模式（adaptive 模式）下，监听应用容器的高度变化
 * - 自动更新父窗口中的 iframe 高度（无需父窗口配合）
 * - 使用 ResizeObserver 实时监听 DOM 高度变化
 * - 使用防抖优化性能，避免频繁更新
 * - 支持手动触发高度同步
 *
 * 实现方式：
 * 1. 优先尝试直接访问 window.frameElement（同源情况下）
 * 2. 如果跨域限制，降级到 postMessage 通知父窗口（需要父窗口监听）
 *
 * 使用场景：
 * - 页面内容动态变化（剧情更新、选择变化等）
 * - 页面切换（主页、状态页、商店页等）
 * - 窗口大小变化
 *
 * @example
 * ```typescript
 * const { syncHeight } = useIframeHeightSync()
 *
 * // 手动触发高度同步
 * syncHeight()
 * ```
 */
export function useIframeHeightSync() {
  // 状态
  const isActive = ref(false)
  const currentHeight = ref(0)
  const lastSentHeight = ref(0)

  // ResizeObserver 实例
  let resizeObserver: ResizeObserver | null = null

  // 防抖延迟（毫秒）
  const DEBOUNCE_DELAY = 150

  // 高度变化阈值（像素）- 只有高度变化超过此值才发送消息
  const HEIGHT_CHANGE_THRESHOLD = 10

  /**
   * 计算应用容器的实际高度
   * @returns 容器的 scrollHeight（包含所有内容的高度）
   */
  const calculateHeight = (): number => {
    // 优先使用 #app 元素
    const appElement = document.getElementById('app')
    if (appElement) {
      // 使用 scrollHeight 获取包含所有内容的高度
      const height = appElement.scrollHeight
      logger.debug(`📏 [IframeHeightSync] 计算高度 (#app): ${height}px`)
      return height
    }

    // 降级到 body
    const bodyHeight = document.body.scrollHeight
    logger.debug(`📏 [IframeHeightSync] 计算高度 (body): ${bodyHeight}px`)
    return bodyHeight
  }

  /**
   * 直接更新父窗口中的 iframe 高度
   * @param height 要设置的高度值
   */
  const updateParentIframeHeight = (height: number) => {
    if (!isInIframe()) {
      logger.debug('📏 [IframeHeightSync] 非 iframe 环境，跳过更新')
      return
    }

    // 检查高度变化是否超过阈值
    const heightDiff = Math.abs(height - lastSentHeight.value)
    if (heightDiff < HEIGHT_CHANGE_THRESHOLD && lastSentHeight.value !== 0) {
      logger.debug(
        `📏 [IframeHeightSync] 高度变化 ${heightDiff}px 小于阈值 ${HEIGHT_CHANGE_THRESHOLD}px，跳过更新`
      )
      return
    }

    try {
      // 方法 1：尝试直接访问父窗口的 iframe 元素（同源情况下）
      try {
        // 通过 window.frameElement 获取当前 iframe 元素
        const iframe = window.frameElement as HTMLIFrameElement | null

        if (iframe && iframe.tagName === 'IFRAME') {
          iframe.style.height = `${height}px`
          lastSentHeight.value = height

          logger.info(
            `✅ [IframeHeightSync] 已直接更新 iframe 高度: ${height}px (变化: ${heightDiff}px)`
          )
          return
        }
      } catch {
        // 跨域限制，无法访问 frameElement
        logger.debug('📏 [IframeHeightSync] 跨域限制，无法直接访问 iframe 元素')
      }

      // 方法 2：通过 postMessage 通知父窗口（降级方案）
      const message = {
        type: 'IFRAME_HEIGHT_UPDATE',
        height: height,
        timestamp: Date.now(),
      }

      window.parent.postMessage(message, '*')
      lastSentHeight.value = height

      logger.info(`📤 [IframeHeightSync] 已发送高度更新消息: ${height}px (变化: ${heightDiff}px)`)
    } catch (error) {
      logger.warn('⚠️ [IframeHeightSync] 更新高度失败:', error)
    }
  }

  /**
   * 同步高度（防抖版本）
   */
  const debouncedSyncHeight = debounce(() => {
    const height = calculateHeight()
    currentHeight.value = height
    updateParentIframeHeight(height)
  }, DEBOUNCE_DELAY)

  /**
   * 立即同步高度（不防抖）
   * 用于关键时刻需要立即更新的场景
   */
  const syncHeightImmediate = () => {
    const height = calculateHeight()
    currentHeight.value = height
    updateParentIframeHeight(height)
  }

  /**
   * 同步高度（默认使用防抖）
   * @param immediate 是否立即执行（不防抖）
   */
  const syncHeight = (immediate = false) => {
    if (!isActive.value) {
      logger.debug('📏 [IframeHeightSync] 未激活，跳过同步')
      return
    }

    if (immediate) {
      syncHeightImmediate()
    } else {
      debouncedSyncHeight()
    }
  }

  /**
   * 设置 ResizeObserver 监听容器高度变化
   */
  const setupResizeObserver = () => {
    // 清理旧的观察器
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }

    const appElement = document.getElementById('app')
    if (!appElement) {
      logger.warn('⚠️ [IframeHeightSync] 未找到 #app 元素')
      return
    }

    // 创建 ResizeObserver
    resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        // 使用 contentRect 获取内容区域的尺寸
        const height = entry.target.scrollHeight
        logger.debug(`🔍 [IframeHeightSync] ResizeObserver 检测到高度变化: ${height}px`)

        // 触发防抖同步
        syncHeight()
      }
    })

    // 开始观察
    resizeObserver.observe(appElement)
    logger.info('👀 [IframeHeightSync] ResizeObserver 已启动，监听 #app 元素')
  }

  /**
   * 激活高度同步
   */
  const activate = () => {
    if (isActive.value) {
      logger.debug('📏 [IframeHeightSync] 已经激活，跳过')
      return
    }

    const strategy = getScrollStrategy()

    // 只在 adaptive 模式下激活
    if (strategy !== 'adaptive') {
      logger.debug(`📏 [IframeHeightSync] 当前策略为 ${strategy}，不激活高度同步`)
      return
    }

    if (!isInIframe()) {
      logger.debug('📏 [IframeHeightSync] 非 iframe 环境，不激活高度同步')
      return
    }

    isActive.value = true
    setupResizeObserver()

    // 立即同步一次初始高度
    syncHeightImmediate()

    logger.info('✅ [IframeHeightSync] 高度同步已激活')
  }

  /**
   * 停用高度同步
   */
  const deactivate = () => {
    if (!isActive.value) {
      return
    }

    isActive.value = false

    // 清理 ResizeObserver
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }

    logger.info('🛑 [IframeHeightSync] 高度同步已停用')
  }

  /**
   * 监听滚动策略变化
   */
  const handleStrategyChange = () => {
    const strategy = getScrollStrategy()

    if (strategy === 'adaptive' && isInIframe()) {
      activate()
    } else {
      deactivate()
    }
  }

  // 生命周期钩子
  onMounted(() => {
    logger.debug('🎯 [IframeHeightSync] 组件已挂载')

    // 初始化
    handleStrategyChange()

    // 监听窗口大小变化（可能导致滚动策略变化）
    window.addEventListener('resize', handleStrategyChange)

    // 监听全屏状态变化
    document.addEventListener('fullscreenchange', handleStrategyChange)
    document.addEventListener('webkitfullscreenchange', handleStrategyChange)
    document.addEventListener('mozfullscreenchange', handleStrategyChange)
    document.addEventListener('MSFullscreenChange', handleStrategyChange)
  })

  onUnmounted(() => {
    logger.debug('👋 [IframeHeightSync] 组件即将卸载')

    // 清理
    deactivate()

    // 移除事件监听
    window.removeEventListener('resize', handleStrategyChange)
    document.removeEventListener('fullscreenchange', handleStrategyChange)
    document.removeEventListener('webkitfullscreenchange', handleStrategyChange)
    document.removeEventListener('mozfullscreenchange', handleStrategyChange)
    document.removeEventListener('MSFullscreenChange', handleStrategyChange)
  })

  return {
    /** 是否已激活高度同步 */
    isActive,
    /** 当前高度 */
    currentHeight,
    /** 手动触发高度同步 */
    syncHeight,
    /** 立即同步高度（不防抖） */
    syncHeightImmediate,
  }
}
