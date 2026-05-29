/**
 * @file useFullscreen.ts
 * @description 全屏管理 Composable - 支持原生全屏和模拟全屏两种模式
 * @author Eden System Team
 */

import { ref, onMounted, onUnmounted } from 'vue'
import { isInIframe, canUseFullscreenAPI, getFullscreenElement } from '../../utils/environment'
import { logger } from '../../utils/logger'

/**
 * 全屏管理 Composable
 *
 * 支持原生全屏和模拟全屏两种模式,自动根据环境选择最佳方案。
 *
 * @returns 全屏状态和操作方法
 */
export function useFullscreen() {
  // 状态
  const isFullscreen = ref(false)
  const isInIframeEnv = isInIframe()
  // 即使在 iframe 中,如果浏览器支持全屏 API,也应该尝试使用
  // iframe 需要有 allowfullscreen 属性才能工作
  const canUseNativeFullscreen = canUseFullscreenAPI()

  logger.info('🖥️ 全屏环境检测:', {
    isInIframe: isInIframeEnv,
    canUseNativeFullscreen,
    fullscreenEnabled: document.fullscreenEnabled,
  })

  /**
   * 进入原生全屏模式
   */
  function enterNativeFullscreen(): Promise<void> {
    const elem = document.documentElement as HTMLElement & {
      requestFullscreen?: () => Promise<void>
      webkitRequestFullscreen?: () => Promise<void>
      mozRequestFullScreen?: () => Promise<void>
      msRequestFullscreen?: () => Promise<void>
    }

    if (elem.requestFullscreen) {
      return elem.requestFullscreen()
    } else if (elem.webkitRequestFullscreen) {
      return elem.webkitRequestFullscreen()
    } else if (elem.mozRequestFullScreen) {
      return elem.mozRequestFullScreen()
    } else if (elem.msRequestFullscreen) {
      return elem.msRequestFullscreen()
    }

    return Promise.reject(new Error('浏览器不支持全屏 API'))
  }

  /**
   * 退出原生全屏模式
   */
  function exitNativeFullscreen(): Promise<void> {
    const doc = document as typeof document & {
      exitFullscreen?: () => Promise<void>
      webkitExitFullscreen?: () => Promise<void>
      mozCancelFullScreen?: () => Promise<void>
      msExitFullscreen?: () => Promise<void>
    }

    if (doc.exitFullscreen) {
      return doc.exitFullscreen()
    } else if (doc.webkitExitFullscreen) {
      return doc.webkitExitFullscreen()
    } else if (doc.mozCancelFullScreen) {
      return doc.mozCancelFullScreen()
    } else if (doc.msExitFullscreen) {
      return doc.msExitFullscreen()
    }

    return Promise.reject(new Error('浏览器不支持退出全屏 API'))
  }

  /**
   * 进入模拟全屏模式
   * 在 iframe 环境中使用,通过 CSS 实现全屏效果
   */
  function enterPseudoFullscreen(): void {
    const container = document.getElementById('eden-container')
    if (container) {
      container.classList.add('pseudo-fullscreen')
      logger.info('✅ 已进入模拟全屏模式')

      // 尝试通知父窗口请求全屏(可选)
      if (window.parent !== window) {
        try {
          window.parent.postMessage({ type: 'REQUEST_FULLSCREEN' }, '*')
          logger.debug('📤 已向父窗口发送全屏请求')
        } catch (e) {
          logger.warn('⚠️ 无法向父窗口发送消息:', e)
        }
      }
    } else {
      logger.error('❌ 未找到容器元素 #eden-container')
    }
  }

  /**
   * 退出模拟全屏模式
   */
  function exitPseudoFullscreen(): void {
    const container = document.getElementById('eden-container')
    if (container) {
      container.classList.remove('pseudo-fullscreen')
      logger.info('✅ 已退出模拟全屏模式')

      // 尝试通知父窗口退出全屏(可选)
      if (window.parent !== window) {
        try {
          window.parent.postMessage({ type: 'EXIT_FULLSCREEN' }, '*')
          logger.debug('📤 已向父窗口发送退出全屏请求')
        } catch (e) {
          logger.warn('⚠️ 无法向父窗口发送消息:', e)
        }
      }
    } else {
      logger.error('❌ 未找到容器元素 #eden-container')
    }
  }

  /**
   * 进入全屏模式(自动选择原生或模拟)
   */
  async function enterFullscreenMode(): Promise<void> {
    // 优先尝试原生全屏
    if (canUseNativeFullscreen) {
      try {
        await enterNativeFullscreen()
        logger.info('✅ 已进入原生全屏模式')
        isFullscreen.value = true
        return
      } catch (error) {
        logger.warn('⚠️ 原生全屏失败,降级到模拟全屏:', error)
        // 继续执行下面的模拟全屏逻辑
      }
    }

    // 使用模拟全屏作为降级方案
    try {
      enterPseudoFullscreen()
      isFullscreen.value = true
    } catch (error) {
      logger.error('❌ 进入全屏失败:', error)
      throw error
    }
  }

  /**
   * 退出全屏模式(自动选择原生或模拟)
   */
  async function exitFullscreenMode(): Promise<void> {
    try {
      if (canUseNativeFullscreen && getFullscreenElement()) {
        await exitNativeFullscreen()
        logger.info('✅ 已退出原生全屏模式')
      } else {
        exitPseudoFullscreen()
      }
      isFullscreen.value = false
    } catch (error) {
      logger.error('❌ 退出全屏失败:', error)
      // 如果原生退出失败,尝试退出模拟全屏
      exitPseudoFullscreen()
      isFullscreen.value = false
    }
  }

  /**
   * 切换全屏状态
   */
  async function toggleFullscreen(): Promise<void> {
    if (isFullscreen.value) {
      await exitFullscreenMode()
    } else {
      await enterFullscreenMode()
    }
  }

  /**
   * 处理全屏状态变化事件
   */
  function handleFullscreenChange(): void {
    const isCurrentlyFullscreen = getFullscreenElement() !== null

    // 只有在原生全屏模式下才更新状态
    if (canUseNativeFullscreen) {
      isFullscreen.value = isCurrentlyFullscreen
      logger.debug('🔄 全屏状态变化:', isCurrentlyFullscreen)
    }
  }

  /**
   * 处理键盘事件(ESC 键退出全屏)
   */
  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && isFullscreen.value && !canUseNativeFullscreen) {
      // 在模拟全屏模式下,ESC 键需要手动处理
      exitFullscreenMode()
    }
  }

  // 生命周期钩子
  onMounted(() => {
    // 监听全屏状态变化
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    // 监听键盘事件
    document.addEventListener('keydown', handleKeydown)

    logger.debug('✅ 全屏事件监听器已注册')
  })

  onUnmounted(() => {
    // 清理事件监听器
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
    document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    document.removeEventListener('keydown', handleKeydown)

    logger.debug('✅ 全屏事件监听器已清理')
  })

  return {
    // 状态
    isFullscreen,
    isInIframeEnv,
    canUseNativeFullscreen,

    // 方法
    toggleFullscreen,
    enterFullscreenMode,
    exitFullscreenMode,
  }
}
