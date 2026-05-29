import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoadingSpinner from '../LoadingSpinner.vue'

describe('LoadingSpinner', () => {
  describe('渲染测试', () => {
    it('应该渲染加载容器', () => {
      const wrapper = mount(LoadingSpinner)

      expect(wrapper.find('.loading-spinner-container').exists()).toBe(true)
    })

    it('应该渲染加载动画', () => {
      const wrapper = mount(LoadingSpinner)

      expect(wrapper.find('.loading-spinner').exists()).toBe(true)
    })

    it('应该渲染4个旋转环', () => {
      const wrapper = mount(LoadingSpinner)

      const rings = wrapper.findAll('.spinner-ring')
      expect(rings).toHaveLength(4)
    })

    it('应该渲染默认消息', () => {
      const wrapper = mount(LoadingSpinner)

      const message = wrapper.find('.loading-message')
      expect(message.exists()).toBe(true)
      expect(message.text()).toBe('加载中...')
    })

    it('应该渲染自定义消息', () => {
      const wrapper = mount(LoadingSpinner, {
        props: {
          message: '自定义加载消息',
        },
      })

      const message = wrapper.find('.loading-message')
      expect(message.text()).toBe('自定义加载消息')
    })

    it('没有消息时不应该渲染消息元素', () => {
      const wrapper = mount(LoadingSpinner, {
        props: {
          message: '',
        },
      })

      expect(wrapper.find('.loading-message').exists()).toBe(false)
    })
  })

  describe('可访问性测试', () => {
    it('容器应该有正确的 ARIA 属性', () => {
      const wrapper = mount(LoadingSpinner)

      const container = wrapper.find('.loading-spinner-container')
      expect(container.attributes('role')).toBe('status')
      expect(container.attributes('aria-live')).toBe('polite')
      expect(container.attributes('aria-label')).toBe('正在加载')
    })
  })

  describe('Props 测试', () => {
    it('消息变化时应该更新显示', async () => {
      const wrapper = mount(LoadingSpinner, {
        props: {
          message: '初始消息',
        },
      })

      expect(wrapper.find('.loading-message').text()).toBe('初始消息')

      await wrapper.setProps({ message: '更新后的消息' })

      expect(wrapper.find('.loading-message').text()).toBe('更新后的消息')
    })

    it('消息从有到无应该隐藏消息元素', async () => {
      const wrapper = mount(LoadingSpinner, {
        props: {
          message: '有消息',
        },
      })

      expect(wrapper.find('.loading-message').exists()).toBe(true)

      await wrapper.setProps({ message: '' })

      expect(wrapper.find('.loading-message').exists()).toBe(false)
    })

    it('消息从无到有应该显示消息元素', async () => {
      const wrapper = mount(LoadingSpinner, {
        props: {
          message: '',
        },
      })

      expect(wrapper.find('.loading-message').exists()).toBe(false)

      await wrapper.setProps({ message: '新消息' })

      expect(wrapper.find('.loading-message').exists()).toBe(true)
      expect(wrapper.find('.loading-message').text()).toBe('新消息')
    })
  })
})
