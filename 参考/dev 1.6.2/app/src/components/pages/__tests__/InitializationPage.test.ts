// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref, computed } from 'vue'
import InitializationPage from '../InitializationPage.vue'

// Mock 子组件
vi.mock('../../common/LoadingSpinner.vue', () => ({
  default: {
    name: 'LoadingSpinner',
    template: '<div class="loading-spinner-mock"></div>',
    props: ['message', 'isRetrying', 'retryCount', 'maxRetries', 'retryReason'],
  },
}))

vi.mock('../InitializationPage/InitHeader.vue', () => ({
  default: {
    name: 'InitHeader',
    template: '<div class="init-header-mock"></div>',
  },
}))

vi.mock('../InitializationPage/SystemInstructionInput.vue', () => ({
  default: {
    name: 'SystemInstructionInput',
    template:
      '<textarea class="system-instruction-mock" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)"></textarea>',
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue'],
  },
}))

vi.mock('../InitializationPage/UserInputSection.vue', () => ({
  default: {
    name: 'UserInputSection',
    template:
      '<textarea class="user-input-mock" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)"></textarea>',
    props: ['modelValue'],
    emits: ['update:modelValue', 'submit'],
  },
}))

vi.mock('../InitializationPage/GenerateButton.vue', () => ({
  default: {
    name: 'GenerateButton',
    template: '<button class="generate-button-mock" @click="$emit(\'click\')">生成</button>',
    props: ['isGenerating', 'errorMessage'],
    emits: ['click'],
  },
}))

// Mock useAILoadingState
vi.mock('../../composables/useAILoadingState', () => ({
  useAILoadingState: () => ({
    getLoadingMessage: computed(() => '正在生成...'),
    isRetrying: ref(false),
    retryCount: ref(0),
    maxRetries: ref(3),
    retryReason: ref(''),
  }),
}))

describe('InitializationPage', () => {
  const defaultProps = {
    systemInstruction: '默认系统指令',
  }

  beforeEach(() => {
    // 创建新的 Pinia 实例
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('渲染测试', () => {
    it('应该渲染初始化页面容器', () => {
      const wrapper = mount(InitializationPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.initialization-page').exists()).toBe(true)
      expect(wrapper.find('.init-container').exists()).toBe(true)
    })

    it('应该渲染所有子组件', () => {
      const wrapper = mount(InitializationPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.init-header-mock').exists()).toBe(true)
      expect(wrapper.find('.system-instruction-mock').exists()).toBe(true)
      expect(wrapper.find('.user-input-mock').exists()).toBe(true)
      expect(wrapper.find('.generate-button-mock').exists()).toBe(true)
    })

    it('初始状态不应该显示加载遮罩', () => {
      const wrapper = mount(InitializationPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.ai-loading-overlay').exists()).toBe(false)
    })

    it('当正在生成时应该显示加载遮罩', async () => {
      const wrapper = mount(InitializationPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      // 使用暴露的方法设置生成状态
      wrapper.vm.setGenerating(true)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.ai-loading-overlay').exists()).toBe(true)
      expect(wrapper.find('.loading-spinner-mock').exists()).toBe(true)
    })
  })

  describe('Props 测试', () => {
    it('应该接收 systemInstruction prop', () => {
      const wrapper = mount(InitializationPage, {
        props: {
          systemInstruction: '自定义系统指令',
        },
        global: {
          plugins: [createPinia()],
        },
      })

      const systemInstructionInput = wrapper.findComponent({ name: 'SystemInstructionInput' })
      expect(systemInstructionInput.props('placeholder')).toBe('自定义系统指令')
    })
  })

  describe('用户交互测试', () => {
    it('点击生成按钮应该触发 generate 事件', async () => {
      const wrapper = mount(InitializationPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      const generateButton = wrapper.find('.generate-button-mock')
      await generateButton.trigger('click')

      expect(wrapper.emitted('generate')).toBeTruthy()
      expect(wrapper.emitted('generate')).toHaveLength(1)
    })

    it('生成事件应该传递系统指令和用户输入', async () => {
      const wrapper = mount(InitializationPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      // 设置系统指令输入
      const systemInstructionInput = wrapper.find('.system-instruction-mock')
      await systemInstructionInput.setValue('自定义指令')

      // 设置用户输入
      const userInput = wrapper.find('.user-input-mock')
      await userInput.setValue('用户输入内容')

      // 点击生成按钮
      const generateButton = wrapper.find('.generate-button-mock')
      await generateButton.trigger('click')

      const emitted = wrapper.emitted('generate')
      expect(emitted).toBeTruthy()
      expect(emitted![0]).toEqual(['自定义指令', '用户输入内容'])
    })

    it('点击生成按钮应该清空错误消息', async () => {
      const wrapper = mount(InitializationPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      // 设置错误消息
      wrapper.vm.setError('测试错误')
      await wrapper.vm.$nextTick()

      // 点击生成按钮
      const generateButton = wrapper.find('.generate-button-mock')
      await generateButton.trigger('click')

      // 错误消息应该被清空
      const generateButtonComponent = wrapper.findComponent({ name: 'GenerateButton' })
      expect(generateButtonComponent.props('errorMessage')).toBe('')
    })

    it('应该支持双向绑定系统指令输入', async () => {
      const wrapper = mount(InitializationPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      const systemInstructionInput = wrapper.find('.system-instruction-mock')
      await systemInstructionInput.setValue('新的系统指令')

      expect(wrapper.vm.systemInstructionInput).toBe('新的系统指令')
    })

    it('应该支持双向绑定用户输入', async () => {
      const wrapper = mount(InitializationPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      const userInput = wrapper.find('.user-input-mock')
      await userInput.setValue('新的用户输入')

      expect(wrapper.vm.userInput).toBe('新的用户输入')
    })
  })

  describe('暴露方法测试', () => {
    it('setGenerating 应该设置生成状态', async () => {
      const wrapper = mount(InitializationPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.vm.isGenerating).toBe(false)

      wrapper.vm.setGenerating(true)
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.isGenerating).toBe(true)
      expect(wrapper.find('.ai-loading-overlay').exists()).toBe(true)

      wrapper.vm.setGenerating(false)
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.isGenerating).toBe(false)
      expect(wrapper.find('.ai-loading-overlay').exists()).toBe(false)
    })

    it('setError 应该设置错误消息', async () => {
      const wrapper = mount(InitializationPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      wrapper.vm.setError('测试错误消息')
      await wrapper.vm.$nextTick()

      const generateButton = wrapper.findComponent({ name: 'GenerateButton' })
      expect(generateButton.props('errorMessage')).toBe('测试错误消息')
    })

    it('setError 应该能够清空错误消息', async () => {
      const wrapper = mount(InitializationPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      wrapper.vm.setError('错误消息')
      await wrapper.vm.$nextTick()

      wrapper.vm.setError('')
      await wrapper.vm.$nextTick()

      const generateButton = wrapper.findComponent({ name: 'GenerateButton' })
      expect(generateButton.props('errorMessage')).toBe('')
    })
  })

  describe('加载状态测试', () => {
    it('应该传递正确的加载状态到 LoadingSpinner', async () => {
      const wrapper = mount(InitializationPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      wrapper.vm.setGenerating(true)
      await wrapper.vm.$nextTick()

      const loadingSpinner = wrapper.findComponent({ name: 'LoadingSpinner' })
      expect(loadingSpinner.exists()).toBe(true)
      // 默认场景是 'choice'，对应的消息是 "AI 正在思考中，请稍候..."
      expect(loadingSpinner.props('message')).toBe('AI 正在思考中，请稍候...')
      expect(loadingSpinner.props('isRetrying')).toBe(false)
      expect(loadingSpinner.props('retryCount')).toBe(0)
      expect(loadingSpinner.props('maxRetries')).toBe(3)
    })

    it('应该传递正确的生成状态到 GenerateButton', async () => {
      const wrapper = mount(InitializationPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      const generateButton = wrapper.findComponent({ name: 'GenerateButton' })
      expect(generateButton.props('isGenerating')).toBe(false)

      wrapper.vm.setGenerating(true)
      await wrapper.vm.$nextTick()

      expect(generateButton.props('isGenerating')).toBe(true)
    })
  })

  describe('初始状态测试', () => {
    it('初始状态应该正确', () => {
      const wrapper = mount(InitializationPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.vm.systemInstructionInput).toBe('')
      expect(wrapper.vm.userInput).toBe('')
      expect(wrapper.vm.isGenerating).toBe(false)
      expect(wrapper.vm.errorMessage).toBe('')
    })
  })

  describe('边界情况测试', () => {
    it('应该处理空的系统指令', async () => {
      const wrapper = mount(InitializationPage, {
        props: {
          systemInstruction: '',
        },
        global: {
          plugins: [createPinia()],
        },
      })

      const generateButton = wrapper.find('.generate-button-mock')
      await generateButton.trigger('click')

      const emitted = wrapper.emitted('generate')
      expect(emitted).toBeTruthy()
      expect(emitted![0]).toEqual(['', ''])
    })

    it('应该处理空的用户输入', async () => {
      const wrapper = mount(InitializationPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      const generateButton = wrapper.find('.generate-button-mock')
      await generateButton.trigger('click')

      const emitted = wrapper.emitted('generate')
      expect(emitted).toBeTruthy()
      expect(emitted![0][1]).toBe('')
    })

    it('应该处理长文本输入', async () => {
      const wrapper = mount(InitializationPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      const longText = 'a'.repeat(10000)
      const userInput = wrapper.find('.user-input-mock')
      await userInput.setValue(longText)

      expect(wrapper.vm.userInput).toBe(longText)
    })
  })
})
