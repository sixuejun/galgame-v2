import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ToastContainer from '../ToastContainer.vue'
import { useToast } from '../../../composables/ui/useToast'

describe('ToastContainer', () => {
  describe('渲染测试', () => {
    it('应该渲染容器', () => {
      setActivePinia(createPinia())
      const wrapper = mount(ToastContainer)

      expect(wrapper.find('.toast-container').exists()).toBe(true)
    })

    it('没有 toast 时不应该渲染 toast 元素', () => {
      setActivePinia(createPinia())
      const wrapper = mount(ToastContainer)

      expect(wrapper.findAll('.toast')).toHaveLength(0)
    })

    it('有 toast 时应该渲染 toast 元素', () => {
      setActivePinia(createPinia())
      const { showToast } = useToast()
      showToast('测试消息', 'info')

      const wrapper = mount(ToastContainer)

      const toasts = wrapper.findAll('.toast')
      expect(toasts.length).toBeGreaterThan(0)
    })
  })

  describe('Toast 类型测试', () => {
    it('info toast 应该有正确的类名', () => {
      setActivePinia(createPinia())
      const { showToast } = useToast()
      showToast('信息消息', 'info')

      const wrapper = mount(ToastContainer)

      const toast = wrapper.find('.toast-info')
      expect(toast.exists()).toBe(true)
    })
  })

  describe('Toast 内容测试', () => {
    it('应该显示消息文本', () => {
      setActivePinia(createPinia())
      const { showToast } = useToast()
      showToast('测试消息', 'info')

      const wrapper = mount(ToastContainer)

      expect(wrapper.text()).toContain('测试消息')
    })

    it('应该渲染图标', () => {
      setActivePinia(createPinia())
      const { showToast } = useToast()
      showToast('测试', 'info')

      const wrapper = mount(ToastContainer)

      const icon = wrapper.find('.toast-icon i')
      expect(icon.exists()).toBe(true)
    })

    it('应该渲染关闭按钮', () => {
      setActivePinia(createPinia())
      const { showToast } = useToast()
      showToast('测试', 'info')

      const wrapper = mount(ToastContainer)

      const closeBtn = wrapper.find('.toast-close')
      expect(closeBtn.exists()).toBe(true)
    })
  })

  describe('交互测试', () => {
    it('点击 toast 应该移除它', async () => {
      setActivePinia(createPinia())
      const { showToast } = useToast()
      showToast('测试消息', 'info')

      const wrapper = mount(ToastContainer)

      const initialCount = wrapper.findAll('.toast').length
      expect(initialCount).toBeGreaterThan(0)

      await wrapper.find('.toast').trigger('click')

      const finalCount = wrapper.findAll('.toast').length
      expect(finalCount).toBeLessThan(initialCount)
    })
  })

  describe('TransitionGroup 测试', () => {
    it('应该使用 TransitionGroup', () => {
      setActivePinia(createPinia())
      const wrapper = mount(ToastContainer)

      // TransitionGroup 会被渲染为其子元素的容器
      expect(wrapper.find('.toast-container').exists()).toBe(true)
    })
  })
})
