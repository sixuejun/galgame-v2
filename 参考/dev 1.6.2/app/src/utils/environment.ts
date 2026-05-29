/**
 * 环境检测工具
 * 用于检测应用运行环境和显示状态
 */

/**
 * 检测是否在 iframe 中运行
 * @returns {boolean} 如果在 iframe 中返回 true,否则返回 false
 */
export function isInIframe(): boolean {
  try {
    return window.self !== window.top
  } catch {
    // 如果跨域访问被阻止,说明在 iframe 中
    return true
  }
}

/**
 * 检测浏览器是否支持 Fullscreen API
 * @returns {boolean} 如果支持返回 true,否则返回 false
 */
export function canUseFullscreenAPI(): boolean {
  const doc = document as typeof document & {
    fullscreenEnabled?: boolean
    webkitFullscreenEnabled?: boolean
    mozFullScreenEnabled?: boolean
    msFullscreenEnabled?: boolean
  }

  return !!(
    doc.fullscreenEnabled ||
    doc.webkitFullscreenEnabled ||
    doc.mozFullScreenEnabled ||
    doc.msFullscreenEnabled
  )
}

/**
 * 获取当前全屏元素
 * @returns {Element | null} 当前全屏的元素,如果没有则返回 null
 */
export function getFullscreenElement(): Element | null {
  const doc = document as typeof document & {
    fullscreenElement?: Element
    webkitFullscreenElement?: Element
    mozFullScreenElement?: Element
    msFullscreenElement?: Element
  }

  return (
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement ||
    null
  )
}

/**
 * 检测当前是否处于全屏状态(使用 Fullscreen API)
 * @returns {boolean} 如果处于全屏状态返回 true,否则返回 false
 */
export function isCurrentlyFullscreen(): boolean {
  return getFullscreenElement() !== null
}

/**
 * 检测是否处于全屏模式(包括原生全屏和窗口全屏)
 * @returns {boolean} 如果处于全屏模式返回 true,否则返回 false
 */
export function isFullscreen(): boolean {
  // 方法 1: 使用 Fullscreen API
  if (document.fullscreenElement) {
    return true
  }

  // 方法 2: 检测窗口尺寸是否接近屏幕尺寸
  // 允许一些误差(如任务栏、浏览器工具栏等)
  const threshold = 100 // 像素误差阈值
  const isFullHeight = Math.abs(window.innerHeight - window.screen.height) < threshold
  const isFullWidth = Math.abs(window.innerWidth - window.screen.width) < threshold

  return isFullHeight && isFullWidth
}

/**
 * 获取环境信息摘要
 * @returns {object} 包含环境信息的对象
 */
export function getEnvironmentInfo() {
  return {
    isInIframe: isInIframe(),
    canUseFullscreenAPI: canUseFullscreenAPI(),
    isCurrentlyFullscreen: isCurrentlyFullscreen(),
    userAgent: navigator.userAgent,
    platform: navigator.platform,
  }
}

/**
 * 获取当前滚动策略
 * @returns 'fixed' | 'adaptive'
 * - 'fixed': 固定高度 + 内置滚动条（iframe 全屏模式 或 独立运行）
 * - 'adaptive': 自适应高度 + 禁用内置滚动条（iframe 非全屏模式）
 */
export function getScrollStrategy(): 'fixed' | 'adaptive' {
  const inIframe = isInIframe()
  const fullscreen = isFullscreen()

  // 场景 1: 独立运行（非 iframe）
  if (!inIframe) {
    return 'fixed' // 使用固定高度 + 内置滚动条
  }

  // 场景 2: iframe 环境 + 全屏模式
  if (inIframe && fullscreen) {
    return 'fixed' // 使用固定高度 + 内置滚动条
  }

  // 场景 3: iframe 环境 + 非全屏模式
  return 'adaptive' // 使用自适应高度 + 禁用内置滚动条
}

/**
 * 监听全屏状态变化
 * @param callback 状态变化时的回调函数
 * @returns 清理函数
 */
export function watchFullscreenChange(
  callback: (strategy: 'fixed' | 'adaptive') => void
): () => void {
  const handler = () => {
    const strategy = getScrollStrategy()
    callback(strategy)
  }

  // 监听 Fullscreen API 事件
  document.addEventListener('fullscreenchange', handler)
  document.addEventListener('webkitfullscreenchange', handler)
  document.addEventListener('mozfullscreenchange', handler)
  document.addEventListener('MSFullscreenChange', handler)

  // 监听窗口尺寸变化（用于检测桌面全屏）
  window.addEventListener('resize', handler)

  // 返回清理函数
  return () => {
    document.removeEventListener('fullscreenchange', handler)
    document.removeEventListener('webkitfullscreenchange', handler)
    document.removeEventListener('mozfullscreenchange', handler)
    document.removeEventListener('MSFullscreenChange', handler)
    window.removeEventListener('resize', handler)
  }
}

/**
 * 检测是否为触摸设备
 * @returns {boolean} 如果是触摸设备返回 true,否则返回 false
 */
export function isTouchDevice(): boolean {
  // 方法 1: 检测 Touch Events API
  if ('ontouchstart' in window) {
    return true
  }

  // 方法 2: 检测 Pointer Events API
  if (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) {
    return true
  }

  // 方法 3: 检测 msMaxTouchPoints (IE10/11)
  const nav = navigator as Navigator & { msMaxTouchPoints?: number }
  if (nav.msMaxTouchPoints && nav.msMaxTouchPoints > 0) {
    return true
  }

  // 方法 4: 使用 matchMedia 检测指针类型
  if (window.matchMedia) {
    const coarsePointer = window.matchMedia('(pointer: coarse)')
    if (coarsePointer && coarsePointer.matches) {
      return true
    }
  }

  return false
}
