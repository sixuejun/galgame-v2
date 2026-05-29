// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ReviewPage from '../ReviewPage.vue'
import type { Config, Summary } from '../../../types'
import { loadFromLocalStorage, saveToLocalStorage } from '../../../utils/storage'

// Mock 子组件
vi.mock('../../common/ErrorBoundary.vue', () => ({
  default: {
    name: 'ErrorBoundary',
    template: '<div class="error-boundary-mock"><slot /></div>',
  },
}))

vi.mock('../ReviewPage/ReviewConfigPanel.vue', () => ({
  default: {
    name: 'ReviewConfigPanel',
    template: '<div class="review-config-panel-mock"></div>',
  },
}))

vi.mock('../ReviewPage/ReviewTimeline.vue', () => ({
  default: {
    name: 'ReviewTimeline',
    template: '<div class="review-timeline-mock"></div>',
  },
}))

// Mock utils
vi.mock('../../../utils/storage', () => ({
  loadFromLocalStorage: vi.fn(),
  saveToLocalStorage: vi.fn(),
}))

vi.mock('../../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}))

describe('ReviewPage', () => {
  let defaultProps: { config?: Config; summaries?: Summary[] }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    vi.mocked(loadFromLocalStorage).mockReturnValue({
      displayCount: 5,
      sendCount: 5,
    })

    defaultProps = {
      config: {
        version: '1.0.0',
        phase: 'test',
        home: {
          title: 'Test Game',
          subtitle: 'Test Subtitle',
        },
        review: {
          title: '剧情回顾',
        },
      },
      summaries: [],
    }
  })

  describe('渲染测试', () => {
    it('应该渲染回顾页面容器', () => {
      const wrapper = mount(ReviewPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.review-page').exists()).toBe(true)
    })

    it('应该渲染 ErrorBoundary', () => {
      const wrapper = mount(ReviewPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.error-boundary-mock').exists()).toBe(true)
    })

    it('应该渲染页面标题', () => {
      const wrapper = mount(ReviewPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      const title = wrapper.find('#page-title')
      expect(title.exists()).toBe(true)
      expect(title.text()).toContain('剧情回顾')
    })

    it('没有 config 时应该使用默认标题', () => {
      const wrapper = mount(ReviewPage, {
        props: { summaries: [] },
        global: {
          plugins: [createPinia()],
        },
      })

      const title = wrapper.find('#page-title')
      expect(title.text()).toContain('剧情回顾')
    })

    it('应该渲染配置面板', () => {
      const wrapper = mount(ReviewPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.review-config-panel-mock').exists()).toBe(true)
    })
  })

  describe('空状态', () => {
    it('当没有摘要时应该显示空状态', () => {
      const wrapper = mount(ReviewPage, {
        props: { ...defaultProps, summaries: [] },
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.find('.empty-state p').text()).toBe('暂无回顾记录')
    })

    it('当有摘要时不应该显示空状态', () => {
      const wrapper = mount(ReviewPage, {
        props: {
          ...defaultProps,
          summaries: [{ id: '1', content: 'Summary 1', timestamp: Date.now() }],
        },
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.empty-state').exists()).toBe(false)
    })
  })

  describe('时间线显示', () => {
    it('当有摘要时应该显示时间线', () => {
      const wrapper = mount(ReviewPage, {
        props: {
          ...defaultProps,
          summaries: [{ id: '1', content: 'Summary 1', timestamp: Date.now() }],
        },
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.review-timeline-mock').exists()).toBe(true)
    })

    it('当没有摘要时不应该显示时间线', () => {
      const wrapper = mount(ReviewPage, {
        props: { ...defaultProps, summaries: [] },
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.review-timeline-mock').exists()).toBe(false)
    })
  })

  describe('配置管理', () => {
    it('组件挂载时应该加载配置', () => {
      mount(ReviewPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      expect(loadFromLocalStorage).toHaveBeenCalledWith('eden_review_config', {
        displayCount: 5,
        sendCount: 5,
      })
    })

    it('handleDisplayCountUpdate 应该更新 displayCount 并保存', () => {
      const wrapper = mount(ReviewPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      wrapper.vm.handleDisplayCountUpdate(10)

      expect(wrapper.vm.displayCount).toBe(10)
      expect(wrapper.vm.currentDisplayCount).toBe(10)
      expect(saveToLocalStorage).toHaveBeenCalledWith('eden_review_config', {
        displayCount: 10,
        sendCount: 5,
      })
    })

    it('handleSendCountUpdate 应该更新 sendCount 并保存', () => {
      const wrapper = mount(ReviewPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      wrapper.vm.handleSendCountUpdate(8)

      expect(wrapper.vm.sendCount).toBe(8)
      expect(saveToLocalStorage).toHaveBeenCalledWith('eden_review_config', {
        displayCount: 5,
        sendCount: 8,
      })
    })

    it('resetConfig 应该重置配置到默认值', () => {
      const wrapper = mount(ReviewPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      // 先修改配置
      wrapper.vm.handleDisplayCountUpdate(10)
      wrapper.vm.handleSendCountUpdate(8)

      // 重置
      wrapper.vm.resetConfig()

      expect(wrapper.vm.displayCount).toBe(5)
      expect(wrapper.vm.sendCount).toBe(5)
      expect(wrapper.vm.currentDisplayCount).toBe(5)
    })
  })

  describe('loadMore 功能', () => {
    it('loadMore 应该增加显示数量', () => {
      const summaries: Summary[] = Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
        content: `Summary ${i}`,
        timestamp: Date.now(),
      }))

      const wrapper = mount(ReviewPage, {
        props: { ...defaultProps, summaries },
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.vm.currentDisplayCount).toBe(5)

      wrapper.vm.loadMore()

      expect(wrapper.vm.currentDisplayCount).toBe(10)
    })

    it('loadMore 不应该超过总摘要数量', () => {
      const summaries: Summary[] = Array.from({ length: 8 }, (_, i) => ({
        id: `${i}`,
        content: `Summary ${i}`,
        timestamp: Date.now(),
      }))

      const wrapper = mount(ReviewPage, {
        props: { ...defaultProps, summaries },
        global: {
          plugins: [createPinia()],
        },
      })

      wrapper.vm.loadMore()

      expect(wrapper.vm.currentDisplayCount).toBe(8)
    })

    it('没有摘要时 loadMore 不应该报错', () => {
      const wrapper = mount(ReviewPage, {
        props: { ...defaultProps, summaries: [] },
        global: {
          plugins: [createPinia()],
        },
      })

      expect(() => wrapper.vm.loadMore()).not.toThrow()
    })
  })

  describe('计算属性', () => {
    it('displayedSummaries 应该返回倒序的摘要', () => {
      const summaries: Summary[] = [
        { id: '1', content: 'Summary 1', timestamp: 1000 },
        { id: '2', content: 'Summary 2', timestamp: 2000 },
        { id: '3', content: 'Summary 3', timestamp: 3000 },
      ]

      const wrapper = mount(ReviewPage, {
        props: { ...defaultProps, summaries },
        global: {
          plugins: [createPinia()],
        },
      })

      const displayed = wrapper.vm.displayedSummaries
      expect(displayed[0].id).toBe('3')
      expect(displayed[1].id).toBe('2')
      expect(displayed[2].id).toBe('1')
    })

    it('hasMore 应该正确判断是否有更多摘要', () => {
      const summaries: Summary[] = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        content: `Summary ${i}`,
        timestamp: Date.now(),
      }))

      const wrapper = mount(ReviewPage, {
        props: { ...defaultProps, summaries },
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.vm.hasMore).toBe(true)

      wrapper.vm.currentDisplayCount = 10

      expect(wrapper.vm.hasMore).toBe(false)
    })
  })

  describe('暴露方法', () => {
    it('getSendCount 应该返回当前的 sendCount', () => {
      const wrapper = mount(ReviewPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      wrapper.vm.handleSendCountUpdate(7)

      expect(wrapper.vm.getSendCount()).toBe(7)
    })
  })
})
