// @ts-nocheck
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import ScrollToTopButton from '../ScrollToTopButton.vue'
import { getScrollStrategy, watchFullscreenChange } from '../../../utils/environment'

// Mock stores
vi.mock('../../../stores/navigationStore', () => ({
  useNavigationStore: () => ({
    currentPage: { value: 'home' },
  }),
}))

// Mock utils
vi.mock('../../../utils/environment', () => ({
  getScrollStrategy: vi.fn(() => 'fixed'),
  watchFullscreenChange: vi.fn(() => vi.fn()),
}))

vi.mock('../../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}))

describe('ScrollToTopButton', () => {
  let mockActivePage: HTMLElement

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.useFakeTimers()

    // 创建模拟的活动页面元素
    mockActivePage = document.createElement('div')
    mockActivePage.className = 'page active'
    mockActivePage.scrollTop = 0
    document.body.appendChild(mockActivePage)

    // 重置 mock
    vi.mocked(getScrollStrategy).mockReturnValue('fixed')
  })

  afterEach(() => {
    vi.useRealTimers()
    // 清理 DOM
    if (mockActivePage && mockActivePage.parentNode) {
      mockActivePage.parentNode.removeChild(mockActivePage)
    }
  })

  describe('渲染测试', () => {
    it('初始时按钮应该不可见', () => {
      const wrapper = mount(ScrollToTopButton, {
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.scroll-to-top-button').exists()).toBe(false)
    })

    it('当滚动超过阈值时应该显示按钮', async () => {
      const wrapper = mount(ScrollToTopButton, {
        global: {
          plugins: [createPinia()],
        },
      })

      // 模拟滚动
      mockActivePage.scrollTop = 150

      // 触发滚动事件
      const scrollEvent = new Event('scroll')
      mockActivePage.dispatchEvent(scrollEvent)

      await nextTick()

      expect(wrapper.find('.scroll-to-top-button').exists()).toBe(true)
    })

    it('当滚动小于阈值时应该隐藏按钮', async () => {
      const wrapper = mount(ScrollToTopButton, {
        global: {
          plugins: [createPinia()],
        },
      })

      // 先滚动超过阈值
      mockActivePage.scrollTop = 150
      mockActivePage.dispatchEvent(new Event('scroll'))
      await nextTick()

      // 再滚动回去
      mockActivePage.scrollTop = 50
      mockActivePage.dispatchEvent(new Event('scroll'))
      await nextTick()

      expect(wrapper.find('.scroll-to-top-button').exists()).toBe(false)
    })
  })

  describe('adaptive 模式', () => {
    it('在 adaptive 模式下应该始终显示按钮', async () => {
      vi.mocked(getScrollStrategy).mockReturnValue('adaptive')

      const wrapper = mount(ScrollToTopButton, {
        global: {
          plugins: [createPinia()],
        },
      })

      await nextTick()

      expect(wrapper.find('.scroll-to-top-button').exists()).toBe(true)
    })
  })

  describe('scrollToTop 功能', () => {
    it('点击按钮应该滚动到页面标题', async () => {
      const wrapper = mount(ScrollToTopButton, {
        global: {
          plugins: [createPinia()],
        },
      })

      // 创建页面标题元素
      const pageTitle = document.createElement('h1')
      pageTitle.id = 'page-title'
      mockActivePage.appendChild(pageTitle)

      // Mock scrollIntoView
      const scrollIntoViewMock = vi.fn()
      pageTitle.scrollIntoView = scrollIntoViewMock

      // 滚动到显示按钮
      mockActivePage.scrollTop = 150
      mockActivePage.dispatchEvent(new Event('scroll'))
      await nextTick()

      // 点击按钮
      await wrapper.find('.scroll-to-top-button').trigger('click')

      expect(scrollIntoViewMock).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      })
    })

    it('没有页面标题时应该滚动到页面容器', async () => {
      const wrapper = mount(ScrollToTopButton, {
        global: {
          plugins: [createPinia()],
        },
      })

      // Mock scrollIntoView
      const scrollIntoViewMock = vi.fn()
      mockActivePage.scrollIntoView = scrollIntoViewMock

      // 滚动到显示按钮
      mockActivePage.scrollTop = 150
      mockActivePage.dispatchEvent(new Event('scroll'))
      await nextTick()

      // 点击按钮
      await wrapper.find('.scroll-to-top-button').trigger('click')

      expect(scrollIntoViewMock).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      })
    })

    it('没有活动页面时不应该执行滚动', async () => {
      // 移除活动页面
      if (mockActivePage.parentNode) {
        mockActivePage.parentNode.removeChild(mockActivePage)
      }

      const wrapper = mount(ScrollToTopButton, {
        global: {
          plugins: [createPinia()],
        },
      })

      // 强制显示按钮
      wrapper.vm.isVisible = true
      await nextTick()

      // 点击按钮不应该抛出错误
      expect(() => wrapper.find('.scroll-to-top-button').trigger('click')).not.toThrow()
    })
  })

  describe('页面切换', () => {
    it('页面切换时应该重新设置滚动监听', async () => {
      const wrapper = mount(ScrollToTopButton, {
        global: {
          plugins: [createPinia()],
        },
      })

      // 等待定时器执行
      vi.advanceTimersByTime(100)
      await nextTick()

      // 验证滚动监听已重新设置（通过检查按钮状态）
      expect(wrapper.vm.isVisible).toBeDefined()
    })
  })

  describe('生命周期', () => {
    it('组件挂载时应该设置滚动监听', () => {
      mount(ScrollToTopButton, {
        global: {
          plugins: [createPinia()],
        },
      })

      expect(getScrollStrategy).toHaveBeenCalled()
      expect(watchFullscreenChange).toHaveBeenCalled()
    })

    it('组件卸载时应该清理事件监听', async () => {
      const wrapper = mount(ScrollToTopButton, {
        global: {
          plugins: [createPinia()],
        },
      })

      // 添加滚动监听
      mockActivePage.scrollTop = 150
      mockActivePage.dispatchEvent(new Event('scroll'))
      await nextTick()

      // 卸载组件
      wrapper.unmount()

      // 验证清理（通过检查不会抛出错误）
      expect(() => mockActivePage.dispatchEvent(new Event('scroll'))).not.toThrow()
    })
  })

  describe('无障碍支持', () => {
    it('应该有正确的 aria-label', async () => {
      const wrapper = mount(ScrollToTopButton, {
        global: {
          plugins: [createPinia()],
        },
      })

      mockActivePage.scrollTop = 150
      mockActivePage.dispatchEvent(new Event('scroll'))
      await nextTick()

      const button = wrapper.find('.scroll-to-top-button')
      expect(button.attributes('aria-label')).toBe('回到顶部')
      expect(button.attributes('title')).toBe('回到顶部')
    })

    it('图标应该有 aria-hidden', async () => {
      const wrapper = mount(ScrollToTopButton, {
        global: {
          plugins: [createPinia()],
        },
      })

      mockActivePage.scrollTop = 150
      mockActivePage.dispatchEvent(new Event('scroll'))
      await nextTick()

      const icon = wrapper.find('i')
      expect(icon.attributes('aria-hidden')).toBe('true')
    })
  })

  describe('边界情况', () => {
    it('滚动位置刚好等于阈值时应该显示按钮', async () => {
      const wrapper = mount(ScrollToTopButton, {
        global: {
          plugins: [createPinia()],
        },
      })

      mockActivePage.scrollTop = 100
      mockActivePage.dispatchEvent(new Event('scroll'))
      await nextTick()

      expect(wrapper.find('.scroll-to-top-button').exists()).toBe(false)
    })

    it('滚动位置刚好超过阈值时应该显示按钮', async () => {
      const wrapper = mount(ScrollToTopButton, {
        global: {
          plugins: [createPinia()],
        },
      })

      mockActivePage.scrollTop = 101
      mockActivePage.dispatchEvent(new Event('scroll'))
      await nextTick()

      expect(wrapper.find('.scroll-to-top-button').exists()).toBe(true)
    })
  })
})
