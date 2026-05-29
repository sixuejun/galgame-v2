import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ChoicesPanel from '../ChoicesPanel.vue'
import CustomActionInput from '../CustomActionInput.vue'

// Mock CustomActionInput
vi.mock('../CustomActionInput.vue', () => ({
  default: {
    name: 'CustomActionInput',
    template: '<div class="custom-action-input-mock"></div>',
    emits: ['submit'],
  },
}))

describe('ChoicesPanel', () => {
  const defaultChoices = [{ text: '选择1' }, { text: '选择2' }, { text: '选择3' }]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('渲染测试', () => {
    it('有选择时应该渲染面板', () => {
      const wrapper = mount(ChoicesPanel, {
        props: {
          choices: defaultChoices,
        },
      })

      expect(wrapper.find('.choices-panel').exists()).toBe(true)
    })

    it('没有选择时不应该渲染面板', () => {
      const wrapper = mount(ChoicesPanel, {
        props: {
          choices: [],
        },
      })

      expect(wrapper.find('.choices-panel').exists()).toBe(false)
    })

    it('应该渲染头部', () => {
      const wrapper = mount(ChoicesPanel, {
        props: {
          choices: defaultChoices,
        },
      })

      const header = wrapper.find('.choices-header')
      expect(header.exists()).toBe(true)
      expect(header.text()).toContain('玩家选择')
    })

    it('应该渲染所有选择按钮', () => {
      const wrapper = mount(ChoicesPanel, {
        props: {
          choices: defaultChoices,
        },
      })

      const buttons = wrapper.findAll('.choice-button')
      expect(buttons).toHaveLength(defaultChoices.length)
    })

    it('应该渲染选择按钮文本', () => {
      const wrapper = mount(ChoicesPanel, {
        props: {
          choices: defaultChoices,
        },
      })

      const buttons = wrapper.findAll('.choice-button')
      expect(buttons[0].text()).toBe('选择1')
      expect(buttons[1].text()).toBe('选择2')
      expect(buttons[2].text()).toBe('选择3')
    })

    it('应该渲染自定义行动输入框', () => {
      const wrapper = mount(ChoicesPanel, {
        props: {
          choices: defaultChoices,
        },
      })

      expect(wrapper.findComponent(CustomActionInput).exists()).toBe(true)
    })

    it('应该渲染切换图标', () => {
      const wrapper = mount(ChoicesPanel, {
        props: {
          choices: defaultChoices,
        },
      })

      const icon = wrapper.find('.choices-toggle')
      expect(icon.exists()).toBe(true)
      expect(icon.classes()).toContain('fa-chevron-down')
    })
  })

  describe('折叠状态测试', () => {
    it('初始状态应该是展开的', () => {
      const wrapper = mount(ChoicesPanel, {
        props: {
          choices: defaultChoices,
        },
      })

      const content = wrapper.find('.choices-content')
      expect(content.classes()).not.toContain('collapsed')
    })

    it('点击头部应该切换折叠状态', async () => {
      const wrapper = mount(ChoicesPanel, {
        props: {
          choices: defaultChoices,
        },
      })

      const header = wrapper.find('.choices-header')
      await header.trigger('click')

      const content = wrapper.find('.choices-content')
      expect(content.classes()).toContain('collapsed')
    })

    it('再次点击头部应该展开', async () => {
      const wrapper = mount(ChoicesPanel, {
        props: {
          choices: defaultChoices,
        },
      })

      const header = wrapper.find('.choices-header')
      await header.trigger('click')
      await header.trigger('click')

      const content = wrapper.find('.choices-content')
      expect(content.classes()).not.toContain('collapsed')
    })

    it('折叠时图标应该旋转', async () => {
      const wrapper = mount(ChoicesPanel, {
        props: {
          choices: defaultChoices,
        },
      })

      const header = wrapper.find('.choices-header')
      await header.trigger('click')

      const icon = wrapper.find('.choices-toggle')
      expect(icon.classes()).toContain('collapsed')
    })

    it('按 Enter 键应该切换折叠状态', async () => {
      const wrapper = mount(ChoicesPanel, {
        props: {
          choices: defaultChoices,
        },
      })

      const header = wrapper.find('.choices-header')
      await header.trigger('keydown.enter')

      const content = wrapper.find('.choices-content')
      expect(content.classes()).toContain('collapsed')
    })

    it('按 Space 键应该切换折叠状态', async () => {
      const wrapper = mount(ChoicesPanel, {
        props: {
          choices: defaultChoices,
        },
      })

      const header = wrapper.find('.choices-header')
      await header.trigger('keydown.space')

      const content = wrapper.find('.choices-content')
      expect(content.classes()).toContain('collapsed')
    })
  })

  describe('事件测试', () => {
    it('点击选择按钮应该触发 choose 事件', async () => {
      const wrapper = mount(ChoicesPanel, {
        props: {
          choices: defaultChoices,
        },
      })

      const buttons = wrapper.findAll('.choice-button')
      await buttons[0].trigger('click')

      expect(wrapper.emitted('choose')).toBeTruthy()
      expect(wrapper.emitted('choose')?.[0]).toEqual(['选择1'])
    })

    it('点击不同选择按钮应该触发不同的 choose 事件', async () => {
      const wrapper = mount(ChoicesPanel, {
        props: {
          choices: defaultChoices,
        },
      })

      const buttons = wrapper.findAll('.choice-button')
      await buttons[0].trigger('click')
      await buttons[1].trigger('click')
      await buttons[2].trigger('click')

      expect(wrapper.emitted('choose')).toHaveLength(3)
      expect(wrapper.emitted('choose')?.[0]).toEqual(['选择1'])
      expect(wrapper.emitted('choose')?.[1]).toEqual(['选择2'])
      expect(wrapper.emitted('choose')?.[2]).toEqual(['选择3'])
    })

    it('自定义行动输入框提交应该触发 choose 事件', async () => {
      const wrapper = mount(ChoicesPanel, {
        props: {
          choices: defaultChoices,
        },
      })

      const customInput = wrapper.findComponent(CustomActionInput)
      await customInput.vm.$emit('submit', '自定义行动')

      expect(wrapper.emitted('choose')).toBeTruthy()
      expect(wrapper.emitted('choose')?.[0]).toEqual(['自定义行动'])
    })
  })

  describe('可访问性测试', () => {
    it('头部应该有正确的 ARIA 属性', () => {
      const wrapper = mount(ChoicesPanel, {
        props: {
          choices: defaultChoices,
        },
      })

      const header = wrapper.find('.choices-header')
      expect(header.attributes('role')).toBe('button')
      expect(header.attributes('tabindex')).toBe('0')
    })

    it('选择列表应该有正确的 role', () => {
      const wrapper = mount(ChoicesPanel, {
        props: {
          choices: defaultChoices,
        },
      })

      const list = wrapper.find('.choice-list')
      expect(list.attributes('role')).toBe('list')
    })

    it('选择按钮应该有正确的 role', () => {
      const wrapper = mount(ChoicesPanel, {
        props: {
          choices: defaultChoices,
        },
      })

      const buttons = wrapper.findAll('.choice-button')
      buttons.forEach(button => {
        expect(button.attributes('role')).toBe('listitem')
      })
    })

    it('切换图标应该有 aria-hidden 属性', () => {
      const wrapper = mount(ChoicesPanel, {
        props: {
          choices: defaultChoices,
        },
      })

      const icon = wrapper.find('.choices-toggle')
      expect(icon.attributes('aria-hidden')).toBe('true')
    })
  })

  describe('响应式测试', () => {
    it('选择列表变化时应该更新渲染', async () => {
      const wrapper = mount(ChoicesPanel, {
        props: {
          choices: defaultChoices,
        },
      })

      await wrapper.setProps({
        choices: [{ text: '新选择' }],
      })

      const buttons = wrapper.findAll('.choice-button')
      expect(buttons).toHaveLength(1)
      expect(buttons[0].text()).toBe('新选择')
    })

    it('选择列表为空时应该隐藏面板', async () => {
      const wrapper = mount(ChoicesPanel, {
        props: {
          choices: defaultChoices,
        },
      })

      await wrapper.setProps({
        choices: [],
      })

      expect(wrapper.find('.choices-panel').exists()).toBe(false)
    })
  })
})
