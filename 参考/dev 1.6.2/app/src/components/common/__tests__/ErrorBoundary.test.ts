import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import ErrorBoundary from '../ErrorBoundary.vue'

// Mock logger
vi.mock('../../../utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}))

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('正常渲染测试', () => {
    it('没有错误时应该渲染子组件', () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: '<div class="child-component">子组件内容</div>',
        },
      })

      expect(wrapper.find('.child-component').exists()).toBe(true)
      expect(wrapper.find('.child-component').text()).toBe('子组件内容')
      expect(wrapper.find('.error-boundary').exists()).toBe(false)
    })

    it('应该正确渲染多个子组件', () => {
      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: `
            <div class="child-1">子组件1</div>
            <div class="child-2">子组件2</div>
          `,
        },
      })

      expect(wrapper.find('.child-1').exists()).toBe(true)
      expect(wrapper.find('.child-2').exists()).toBe(true)
    })
  })

  describe('错误捕获测试', () => {
    it('捕获错误后应该显示错误界面', async () => {
      const ErrorComponent = defineComponent({
        setup() {
          throw new Error('测试错误')
        },
        render() {
          return h('div', '不应该渲染')
        },
      })

      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: h(ErrorComponent),
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.find('.error-boundary').exists()).toBe(true)
      expect(wrapper.find('.error-title').text()).toBe('出错了')
      expect(wrapper.find('.error-message').text()).toBe('测试错误')
    })

    it('应该渲染错误图标', async () => {
      const ErrorComponent = defineComponent({
        setup() {
          throw new Error('测试错误')
        },
        render() {
          return h('div')
        },
      })

      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: h(ErrorComponent),
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.find('.error-icon').exists()).toBe(true)
      expect(wrapper.find('.error-icon').text()).toBe('⚠️')
    })

    it('应该渲染重试按钮', async () => {
      const ErrorComponent = defineComponent({
        setup() {
          throw new Error('测试错误')
        },
        render() {
          return h('div')
        },
      })

      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: h(ErrorComponent),
        },
      })

      await wrapper.vm.$nextTick()

      const retryBtn = wrapper.find('.error-retry')
      expect(retryBtn.exists()).toBe(true)
      expect(retryBtn.text()).toContain('重试')
    })

    it('当 showGoBack 为 true 时应该渲染返回按钮', async () => {
      const ErrorComponent = defineComponent({
        setup() {
          throw new Error('测试错误')
        },
        render() {
          return h('div')
        },
      })

      const wrapper = mount(ErrorBoundary, {
        props: {
          showGoBack: true,
        },
        slots: {
          default: h(ErrorComponent),
        },
      })

      await wrapper.vm.$nextTick()

      const goBackBtn = wrapper.find('.error-go-back')
      expect(goBackBtn.exists()).toBe(true)
      expect(goBackBtn.text()).toBe('返回')
    })

    it('当 showGoBack 为 false 时不应该渲染返回按钮', async () => {
      const ErrorComponent = defineComponent({
        setup() {
          throw new Error('测试错误')
        },
        render() {
          return h('div')
        },
      })

      const wrapper = mount(ErrorBoundary, {
        props: {
          showGoBack: false,
        },
        slots: {
          default: h(ErrorComponent),
        },
      })

      await wrapper.vm.$nextTick()

      const goBackBtn = wrapper.find('.error-go-back')
      expect(goBackBtn.exists()).toBe(false)
    })
  })

  describe('事件测试', () => {
    it('捕获错误时应该触发 error 事件', async () => {
      const ErrorComponent = defineComponent({
        setup() {
          throw new Error('测试错误')
        },
        render() {
          return h('div')
        },
      })

      const wrapper = mount(ErrorBoundary, {
        slots: {
          default: h(ErrorComponent),
        },
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('error')).toBeTruthy()
      expect(wrapper.emitted('error')?.[0][0]).toBeInstanceOf(Error)
      expect((wrapper.emitted('error')?.[0][0] as Error).message).toBe('测试错误')
    })

    it('点击重试按钮应该调用 onRetry 回调', async () => {
      const ErrorComponent = defineComponent({
        setup() {
          throw new Error('测试错误')
        },
        render() {
          return h('div')
        },
      })

      const onRetry = vi.fn()
      const wrapper = mount(ErrorBoundary, {
        props: {
          onRetry,
        },
        slots: {
          default: h(ErrorComponent),
        },
      })

      await wrapper.vm.$nextTick()

      const retryBtn = wrapper.find('.error-retry')
      await retryBtn.trigger('click')

      expect(onRetry).toHaveBeenCalled()
    })

    it('点击返回按钮应该调用 onGoBack 回调', async () => {
      const ErrorComponent = defineComponent({
        setup() {
          throw new Error('测试错误')
        },
        render() {
          return h('div')
        },
      })

      const onGoBack = vi.fn()
      const wrapper = mount(ErrorBoundary, {
        props: {
          showGoBack: true,
          onGoBack,
        },
        slots: {
          default: h(ErrorComponent),
        },
      })

      await wrapper.vm.$nextTick()

      const goBackBtn = wrapper.find('.error-go-back')
      await goBackBtn.trigger('click')

      expect(onGoBack).toHaveBeenCalled()
    })

    it('达到最大重试次数后应该禁用重试按钮', async () => {
      const ErrorComponent = defineComponent({
        setup() {
          throw new Error('测试错误')
        },
        render() {
          return h('div')
        },
      })

      const onRetry = vi.fn().mockRejectedValue(new Error('重试失败'))
      const wrapper = mount(ErrorBoundary, {
        props: {
          maxRetries: 2,
          onRetry,
        },
        slots: {
          default: h(ErrorComponent),
        },
      })

      await wrapper.vm.$nextTick()

      const retryBtn = wrapper.find('.error-retry')

      // 第一次重试
      await retryBtn.trigger('click')
      await wrapper.vm.$nextTick()
      expect(retryBtn.attributes('disabled')).toBeUndefined()

      // 第二次重试
      await retryBtn.trigger('click')
      await wrapper.vm.$nextTick()
      expect(retryBtn.attributes('disabled')).toBeDefined()

      // 应该显示提示信息
      expect(wrapper.find('.error-hint').exists()).toBe(true)
    })
  })

  describe('日志测试', () => {
    it('捕获错误时应该记录日志', async () => {
      const { logger } = await import('../../../utils/logger')

      const ErrorComponent = defineComponent({
        setup() {
          throw new Error('测试错误')
        },
        render() {
          return h('div')
        },
      })

      mount(ErrorBoundary, {
        slots: {
          default: h(ErrorComponent),
        },
      })

      await new Promise(resolve => setTimeout(resolve, 10))

      expect(logger.error).toHaveBeenCalled()
    })
  })
})
