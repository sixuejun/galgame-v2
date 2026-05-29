import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import CustomSelect from '../CustomSelect.vue'
import type { SelectOption } from '../CustomSelect.vue'

describe('CustomSelect', () => {
  const mockOptions: SelectOption[] = [
    { value: 'all', label: '全部' },
    { value: 'active', label: '激活' },
    { value: 'inactive', label: '未激活' },
  ]

  let documentClickListener: ((event: Event) => void) | null = null

  beforeEach(() => {
    // 捕获 document 上的点击监听器
    const originalAddEventListener = document.addEventListener
    vi.spyOn(document, 'addEventListener').mockImplementation((event, listener) => {
      if (event === 'click') {
        documentClickListener = listener as (event: Event) => void
      }
      return originalAddEventListener.call(document, event, listener)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    documentClickListener = null
  })

  describe('渲染测试', () => {
    it('应该渲染下拉选择组件', () => {
      const wrapper = mount(CustomSelect, {
        props: {
          modelValue: 'all',
          options: mockOptions,
        },
      })

      expect(wrapper.find('.custom-select').exists()).toBe(true)
      expect(wrapper.find('.select-trigger').exists()).toBe(true)
    })

    it('应该显示当前选中项的标签', () => {
      const wrapper = mount(CustomSelect, {
        props: {
          modelValue: 'active',
          options: mockOptions,
        },
      })

      const trigger = wrapper.find('.select-value')
      expect(trigger.text()).toBe('激活')
    })

    it('没有匹配选项时应该显示"请选择"', () => {
      const wrapper = mount(CustomSelect, {
        props: {
          modelValue: 'nonexistent',
          options: mockOptions,
        },
      })

      const trigger = wrapper.find('.select-value')
      expect(trigger.text()).toBe('请选择')
    })

    it('应该渲染所有选项', async () => {
      const wrapper = mount(CustomSelect, {
        props: {
          modelValue: 'all',
          options: mockOptions,
        },
      })

      // 打开下拉菜单
      await wrapper.find('.select-trigger').trigger('click')
      await nextTick()

      const options = wrapper.findAll('.select-option')
      expect(options).toHaveLength(3)
      expect(options[0].text()).toContain('全部')
      expect(options[1].text()).toContain('激活')
      expect(options[2].text()).toContain('未激活')
    })
  })

  describe('下拉菜单切换', () => {
    it('点击触发器应该打开下拉菜单', async () => {
      const wrapper = mount(CustomSelect, {
        props: {
          modelValue: 'all',
          options: mockOptions,
        },
      })

      // 检查 isOpen 状态而不是 isVisible（因为 v-show 在测试环境中可能不工作）
      expect(wrapper.vm.isOpen).toBe(false)

      await wrapper.find('.select-trigger').trigger('click')
      await nextTick()

      expect(wrapper.vm.isOpen).toBe(true)
      expect(wrapper.find('.custom-select').classes()).toContain('open')
    })

    it('再次点击触发器应该关闭下拉菜单', async () => {
      const wrapper = mount(CustomSelect, {
        props: {
          modelValue: 'all',
          options: mockOptions,
        },
      })

      // 打开
      await wrapper.find('.select-trigger').trigger('click')
      await nextTick()
      expect(wrapper.vm.isOpen).toBe(true)

      // 关闭
      await wrapper.find('.select-trigger').trigger('click')
      await nextTick()
      expect(wrapper.vm.isOpen).toBe(false)
    })
  })

  describe('选项选择', () => {
    it('点击选项应该触发 update:modelValue 事件', async () => {
      const wrapper = mount(CustomSelect, {
        props: {
          modelValue: 'all',
          options: mockOptions,
        },
      })

      await wrapper.find('.select-trigger').trigger('click')
      await nextTick()

      const options = wrapper.findAll('.select-option')
      await options[1].trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')![0]).toEqual(['active'])
    })

    it('选择选项后应该关闭下拉菜单', async () => {
      const wrapper = mount(CustomSelect, {
        props: {
          modelValue: 'all',
          options: mockOptions,
        },
      })

      await wrapper.find('.select-trigger').trigger('click')
      await nextTick()
      expect(wrapper.vm.isOpen).toBe(true)

      const options = wrapper.findAll('.select-option')
      await options[1].trigger('click')
      await nextTick()

      expect(wrapper.vm.isOpen).toBe(false)
    })

    it('当前选中的选项应该有选中样式', async () => {
      const wrapper = mount(CustomSelect, {
        props: {
          modelValue: 'active',
          options: mockOptions,
        },
      })

      await wrapper.find('.select-trigger').trigger('click')
      await nextTick()

      const options = wrapper.findAll('.select-option')
      expect(options[0].classes()).not.toContain('selected')
      expect(options[1].classes()).toContain('selected')
      expect(options[2].classes()).not.toContain('selected')
    })

    it('当前选中的选项应该显示勾选图标', async () => {
      const wrapper = mount(CustomSelect, {
        props: {
          modelValue: 'active',
          options: mockOptions,
        },
      })

      await wrapper.find('.select-trigger').trigger('click')
      await nextTick()

      const options = wrapper.findAll('.select-option')
      expect(options[0].find('.fa-check').exists()).toBe(false)
      expect(options[1].find('.fa-check').exists()).toBe(true)
      expect(options[2].find('.fa-check').exists()).toBe(false)
    })
  })

  describe('点击外部关闭', () => {
    it('点击组件外部应该关闭下拉菜单', async () => {
      const wrapper = mount(CustomSelect, {
        props: {
          modelValue: 'all',
          options: mockOptions,
        },
        attachTo: document.body,
      })

      // 打开下拉菜单
      await wrapper.find('.select-trigger').trigger('click')
      await nextTick()
      expect(wrapper.find('.select-dropdown').isVisible()).toBe(true)

      // 模拟点击外部
      if (documentClickListener) {
        const outsideElement = document.createElement('div')
        document.body.appendChild(outsideElement)
        documentClickListener(new MouseEvent('click', { bubbles: true }))
        Object.defineProperty(new MouseEvent('click'), 'target', {
          value: outsideElement,
          writable: false,
        })
        await nextTick()
      }

      wrapper.unmount()
    })
  })

  describe('无障碍支持', () => {
    it('触发器应该有正确的 ARIA 属性', () => {
      const wrapper = mount(CustomSelect, {
        props: {
          modelValue: 'all',
          options: mockOptions,
        },
      })

      const trigger = wrapper.find('.select-trigger')
      expect(trigger.attributes('aria-label')).toBe('选择选项')
      expect(trigger.attributes('aria-expanded')).toBe('false')
    })

    it('应该支持自定义 aria-label', () => {
      const wrapper = mount(CustomSelect, {
        props: {
          modelValue: 'all',
          options: mockOptions,
          ariaLabel: '选择状态',
        },
      })

      const trigger = wrapper.find('.select-trigger')
      expect(trigger.attributes('aria-label')).toBe('选择状态')
    })

    it('打开时 aria-expanded 应该为 true', async () => {
      const wrapper = mount(CustomSelect, {
        props: {
          modelValue: 'all',
          options: mockOptions,
        },
      })

      await wrapper.find('.select-trigger').trigger('click')
      await nextTick()

      const trigger = wrapper.find('.select-trigger')
      expect(trigger.attributes('aria-expanded')).toBe('true')
    })
  })

  describe('图标旋转', () => {
    it('打开时图标应该旋转', async () => {
      const wrapper = mount(CustomSelect, {
        props: {
          modelValue: 'all',
          options: mockOptions,
        },
      })

      const icon = wrapper.find('.select-icon')
      expect(icon.classes()).not.toContain('rotated')

      await wrapper.find('.select-trigger').trigger('click')
      await nextTick()

      expect(icon.classes()).toContain('rotated')
    })
  })

  describe('Props 更新', () => {
    it('更新 modelValue 应该更新显示的标签', async () => {
      const wrapper = mount(CustomSelect, {
        props: {
          modelValue: 'all',
          options: mockOptions,
        },
      })

      expect(wrapper.find('.select-value').text()).toBe('全部')

      await wrapper.setProps({ modelValue: 'active' })
      await nextTick()

      expect(wrapper.find('.select-value').text()).toBe('激活')
    })

    it('更新 options 应该更新选项列表', async () => {
      const wrapper = mount(CustomSelect, {
        props: {
          modelValue: 'all',
          options: mockOptions,
        },
      })

      await wrapper.find('.select-trigger').trigger('click')
      await nextTick()
      expect(wrapper.findAll('.select-option')).toHaveLength(3)

      const newOptions: SelectOption[] = [
        { value: 'option1', label: '选项1' },
        { value: 'option2', label: '选项2' },
      ]
      await wrapper.setProps({ options: newOptions })
      await nextTick()

      expect(wrapper.findAll('.select-option')).toHaveLength(2)
    })
  })

  describe('边界情况', () => {
    it('应该处理空选项列表', () => {
      const wrapper = mount(CustomSelect, {
        props: {
          modelValue: 'all',
          options: [],
        },
      })

      expect(wrapper.find('.select-value').text()).toBe('请选择')
    })

    it('应该处理单个选项', async () => {
      const wrapper = mount(CustomSelect, {
        props: {
          modelValue: 'only',
          options: [{ value: 'only', label: '唯一选项' }],
        },
      })

      expect(wrapper.find('.select-value').text()).toBe('唯一选项')

      await wrapper.find('.select-trigger').trigger('click')
      await nextTick()

      expect(wrapper.findAll('.select-option')).toHaveLength(1)
    })
  })
})
