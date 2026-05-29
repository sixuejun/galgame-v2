import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AILoadingOverlay from '../AILoadingOverlay.vue'
import LoadingSpinner from '../../common/LoadingSpinner.vue'

// Mock LoadingSpinner
vi.mock('../../common/LoadingSpinner.vue', () => ({
  default: {
    name: 'LoadingSpinner',
    template: '<div class="loading-spinner-mock">{{ message }}</div>',
    props: ['message'],
  },
}))

describe('AILoadingOverlay', () => {
  describe('渲染测试', () => {
    it('isVisible 为 true 时应该渲染遮罩', () => {
      const wrapper = mount(AILoadingOverlay, {
        props: {
          isVisible: true,
        },
      })

      expect(wrapper.find('.ai-loading-overlay').exists()).toBe(true)
    })

    it('isVisible 为 false 时不应该渲染遮罩', () => {
      const wrapper = mount(AILoadingOverlay, {
        props: {
          isVisible: false,
        },
      })

      expect(wrapper.find('.ai-loading-overlay').exists()).toBe(false)
    })

    it('应该渲染加载内容容器', () => {
      const wrapper = mount(AILoadingOverlay, {
        props: {
          isVisible: true,
        },
      })

      expect(wrapper.find('.ai-loading-content').exists()).toBe(true)
    })

    it('应该渲染 LoadingSpinner 组件', () => {
      const wrapper = mount(AILoadingOverlay, {
        props: {
          isVisible: true,
        },
      })

      expect(wrapper.findComponent(LoadingSpinner).exists()).toBe(true)
    })
  })

  describe('Props 测试', () => {
    it('应该使用默认消息', () => {
      const wrapper = mount(AILoadingOverlay, {
        props: {
          isVisible: true,
        },
      })

      const spinner = wrapper.findComponent(LoadingSpinner)
      expect(spinner.props('message')).toBe('AI 正在思考中，请稍候...')
    })

    it('应该使用自定义消息', () => {
      const wrapper = mount(AILoadingOverlay, {
        props: {
          isVisible: true,
          message: '自定义加载消息',
        },
      })

      const spinner = wrapper.findComponent(LoadingSpinner)
      expect(spinner.props('message')).toBe('自定义加载消息')
    })

    it('isVisible 变化时应该更新显示', async () => {
      const wrapper = mount(AILoadingOverlay, {
        props: {
          isVisible: false,
        },
      })

      expect(wrapper.find('.ai-loading-overlay').exists()).toBe(false)

      await wrapper.setProps({ isVisible: true })

      expect(wrapper.find('.ai-loading-overlay').exists()).toBe(true)
    })

    it('message 变化时应该更新 LoadingSpinner', async () => {
      const wrapper = mount(AILoadingOverlay, {
        props: {
          isVisible: true,
          message: '初始消息',
        },
      })

      let spinner = wrapper.findComponent(LoadingSpinner)
      expect(spinner.props('message')).toBe('初始消息')

      await wrapper.setProps({ message: '更新后的消息' })

      spinner = wrapper.findComponent(LoadingSpinner)
      expect(spinner.props('message')).toBe('更新后的消息')
    })
  })

  describe('样式测试', () => {
    it('遮罩应该有正确的类名', () => {
      const wrapper = mount(AILoadingOverlay, {
        props: {
          isVisible: true,
        },
      })

      const overlay = wrapper.find('.ai-loading-overlay')
      expect(overlay.exists()).toBe(true)
    })

    it('加载内容应该有正确的类名', () => {
      const wrapper = mount(AILoadingOverlay, {
        props: {
          isVisible: true,
        },
      })

      const content = wrapper.find('.ai-loading-content')
      expect(content.exists()).toBe(true)
    })
  })

  describe('响应式测试', () => {
    it('从隐藏到显示应该正确渲染', async () => {
      const wrapper = mount(AILoadingOverlay, {
        props: {
          isVisible: false,
        },
      })

      expect(wrapper.find('.ai-loading-overlay').exists()).toBe(false)

      await wrapper.setProps({ isVisible: true })

      expect(wrapper.find('.ai-loading-overlay').exists()).toBe(true)
      expect(wrapper.findComponent(LoadingSpinner).exists()).toBe(true)
    })

    it('从显示到隐藏应该正确移除', async () => {
      const wrapper = mount(AILoadingOverlay, {
        props: {
          isVisible: true,
        },
      })

      expect(wrapper.find('.ai-loading-overlay').exists()).toBe(true)

      await wrapper.setProps({ isVisible: false })

      expect(wrapper.find('.ai-loading-overlay').exists()).toBe(false)
    })
  })
})
