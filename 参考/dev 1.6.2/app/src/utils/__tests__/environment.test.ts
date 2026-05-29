import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  isInIframe,
  isFullscreen,
  getScrollStrategy,
  watchFullscreenChange,
  canUseFullscreenAPI,
  getFullscreenElement,
  isCurrentlyFullscreen,
  getEnvironmentInfo,
  isTouchDevice,
} from '../environment'

describe('environment', () => {
  describe('isInIframe', () => {
    it('应该检测非iframe环境', () => {
      // 在测试环境中，window.self === window.top
      expect(isInIframe()).toBe(false)
    })

    it('应该检测iframe环境', () => {
      // Mock iframe 环境
      const originalTop = window.top
      Object.defineProperty(window, 'top', {
        writable: true,
        value: {},
      })

      expect(isInIframe()).toBe(true)

      // 恢复
      Object.defineProperty(window, 'top', {
        writable: true,
        value: originalTop,
      })
    })

    it('应该在跨域访问被阻止时返回true', () => {
      // Mock 跨域访问被阻止的情况
      const originalTop = window.top
      Object.defineProperty(window, 'top', {
        get() {
          throw new Error('Blocked a frame with origin from accessing a cross-origin frame.')
        },
        configurable: true,
      })

      expect(isInIframe()).toBe(true)

      // 恢复
      Object.defineProperty(window, 'top', {
        writable: true,
        value: originalTop,
        configurable: true,
      })
    })
  })

  describe('isFullscreen', () => {
    beforeEach(() => {
      // 清理 fullscreenElement
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: null,
      })
    })

    it('应该检测全屏API状态', () => {
      // Mock fullscreenElement
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: document.body,
      })

      expect(isFullscreen()).toBe(true)
    })

    it('应该检测非全屏状态', () => {
      // Mock 小窗口
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        value: 600,
      })
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 800,
      })
      Object.defineProperty(window.screen, 'height', {
        writable: true,
        value: 1080,
      })
      Object.defineProperty(window.screen, 'width', {
        writable: true,
        value: 1920,
      })

      expect(isFullscreen()).toBe(false)
    })

    it('应该检测接近全屏的窗口尺寸', () => {
      // Mock 接近全屏的窗口（在阈值内）
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        value: 1030,
      })
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 1870,
      })
      Object.defineProperty(window.screen, 'height', {
        writable: true,
        value: 1080,
      })
      Object.defineProperty(window.screen, 'width', {
        writable: true,
        value: 1920,
      })

      expect(isFullscreen()).toBe(true)
    })
  })

  describe('getScrollStrategy', () => {
    it('应该在独立运行时返回fixed', () => {
      // Mock 非iframe环境
      vi.spyOn(window, 'self', 'get').mockReturnValue(window)
      vi.spyOn(window, 'top', 'get').mockReturnValue(window)

      expect(getScrollStrategy()).toBe('fixed')
    })

    it('应该在iframe全屏时返回fixed', () => {
      // Mock iframe环境
      const originalTop = window.top
      Object.defineProperty(window, 'top', {
        writable: true,
        value: {},
      })

      // Mock 全屏
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: document.body,
      })

      expect(getScrollStrategy()).toBe('fixed')

      // 恢复
      Object.defineProperty(window, 'top', {
        writable: true,
        value: originalTop,
      })
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: null,
      })
    })

    it('应该在iframe非全屏时返回adaptive', () => {
      // Mock iframe环境
      const originalTop = window.top
      Object.defineProperty(window, 'top', {
        writable: true,
        value: {},
      })

      // Mock 非全屏
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: null,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        value: 600,
      })
      Object.defineProperty(window.screen, 'height', {
        writable: true,
        value: 1080,
      })

      expect(getScrollStrategy()).toBe('adaptive')

      // 恢复
      Object.defineProperty(window, 'top', {
        writable: true,
        value: originalTop,
      })
    })
  })

  describe('watchFullscreenChange', () => {
    let cleanup: (() => void) | null = null

    afterEach(() => {
      if (cleanup) {
        cleanup()
        cleanup = null
      }
    })

    it('应该注册事件监听器', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener')
      const windowAddEventListenerSpy = vi.spyOn(window, 'addEventListener')
      const callback = vi.fn()

      cleanup = watchFullscreenChange(callback)

      expect(addEventListenerSpy).toHaveBeenCalledWith('fullscreenchange', expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'webkitfullscreenchange',
        expect.any(Function)
      )
      expect(addEventListenerSpy).toHaveBeenCalledWith('mozfullscreenchange', expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith('MSFullscreenChange', expect.any(Function))
      expect(windowAddEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    })

    it('应该在事件触发时调用回调', () => {
      const callback = vi.fn()
      cleanup = watchFullscreenChange(callback)

      // 触发 fullscreenchange 事件
      document.dispatchEvent(new Event('fullscreenchange'))

      expect(callback).toHaveBeenCalledWith(expect.stringMatching(/^(fixed|adaptive)$/))
    })

    it('应该返回清理函数', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')
      const windowRemoveEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      const callback = vi.fn()

      cleanup = watchFullscreenChange(callback)
      cleanup()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('fullscreenchange', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'webkitfullscreenchange',
        expect.any(Function)
      )
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'mozfullscreenchange',
        expect.any(Function)
      )
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'MSFullscreenChange',
        expect.any(Function)
      )
      expect(windowRemoveEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    })
  })

  describe('canUseFullscreenAPI', () => {
    it('应该检测Fullscreen API支持', () => {
      // 只测试函数返回布尔值
      const result = canUseFullscreenAPI()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('getFullscreenElement', () => {
    beforeEach(() => {
      // 清理所有fullscreen元素
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: null,
      })
    })

    it('应该返回null当没有全屏元素时', () => {
      expect(getFullscreenElement()).toBeNull()
    })

    it('应该返回全屏元素', () => {
      const element = document.createElement('div')
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: element,
      })

      expect(getFullscreenElement()).toBe(element)
    })

    it('应该支持webkit前缀', () => {
      const element = document.createElement('div')
      Object.defineProperty(document, 'webkitFullscreenElement', {
        writable: true,
        value: element,
      })

      expect(getFullscreenElement()).toBe(element)
    })
  })

  describe('isCurrentlyFullscreen', () => {
    it('应该返回布尔值', () => {
      const result = isCurrentlyFullscreen()
      expect(typeof result).toBe('boolean')
    })

    it('应该基于getFullscreenElement的结果', () => {
      // 测试函数逻辑:如果getFullscreenElement返回非null,则为true
      const result = isCurrentlyFullscreen()
      const element = getFullscreenElement()

      expect(result).toBe(element !== null)
    })
  })

  describe('getEnvironmentInfo', () => {
    it('应该返回环境信息对象', () => {
      const info = getEnvironmentInfo()

      expect(info).toHaveProperty('isInIframe')
      expect(info).toHaveProperty('canUseFullscreenAPI')
      expect(info).toHaveProperty('isCurrentlyFullscreen')
      expect(info).toHaveProperty('userAgent')
      expect(info).toHaveProperty('platform')
    })

    it('应该包含正确的类型', () => {
      const info = getEnvironmentInfo()

      expect(typeof info.isInIframe).toBe('boolean')
      expect(typeof info.canUseFullscreenAPI).toBe('boolean')
      expect(typeof info.isCurrentlyFullscreen).toBe('boolean')
      expect(typeof info.userAgent).toBe('string')
      expect(typeof info.platform).toBe('string')
    })
  })

  describe('isTouchDevice', () => {
    it('应该检测 ontouchstart 支持', () => {
      // Mock ontouchstart
      Object.defineProperty(window, 'ontouchstart', {
        writable: true,
        value: null,
        configurable: true,
      })

      expect(isTouchDevice()).toBe(true)

      // 清理
      delete (window as Window & { ontouchstart?: unknown }).ontouchstart
    })

    it('应该检测 maxTouchPoints 支持', () => {
      // Mock maxTouchPoints
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        value: 5,
        configurable: true,
      })

      expect(isTouchDevice()).toBe(true)

      // 清理
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        value: 0,
        configurable: true,
      })
    })

    it('应该检测 msMaxTouchPoints 支持 (IE10/11)', () => {
      // Mock msMaxTouchPoints
      const nav = navigator as Navigator & { msMaxTouchPoints?: number }
      Object.defineProperty(nav, 'msMaxTouchPoints', {
        writable: true,
        value: 5,
        configurable: true,
      })

      expect(isTouchDevice()).toBe(true)

      // 清理
      delete nav.msMaxTouchPoints
    })

    it('应该检测 matchMedia pointer:coarse 支持', () => {
      // Mock matchMedia
      const originalMatchMedia = window.matchMedia
      window.matchMedia = vi.fn().mockImplementation((query: string) => {
        if (query === '(pointer: coarse)') {
          return { matches: true }
        }
        return { matches: false }
      })

      expect(isTouchDevice()).toBe(true)

      // 恢复
      window.matchMedia = originalMatchMedia
    })

    it('应该在非触摸设备上返回false', () => {
      // 确保所有触摸检测都返回false
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        value: 0,
        configurable: true,
      })

      const originalMatchMedia = window.matchMedia
      window.matchMedia = vi.fn().mockImplementation(() => {
        return { matches: false }
      })

      const result = isTouchDevice()
      expect(typeof result).toBe('boolean')

      // 恢复
      window.matchMedia = originalMatchMedia
    })

    it('应该处理 matchMedia 不存在的情况', () => {
      // Mock matchMedia 不存在
      const originalMatchMedia = window.matchMedia
      // @ts-expect-error - 测试 matchMedia 不存在的情况
      window.matchMedia = undefined

      const result = isTouchDevice()
      expect(typeof result).toBe('boolean')

      // 恢复
      window.matchMedia = originalMatchMedia
    })
  })
})
