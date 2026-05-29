import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CustomNumberInput from '../CustomNumberInput.vue'

describe('CustomNumberInput', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleWarnSpy: any

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
  })

  describe('渲染测试', () => {
    it('应该渲染数字输入组件', () => {
      const wrapper = mount(CustomNumberInput, {
        props: {
          modelValue: 50,
        },
      })

      expect(wrapper.find('.custom-number-input').exists()).toBe(true)
      expect(wrapper.find('.number-input').exists()).toBe(true)
      expect(wrapper.find('.decrease').exists()).toBe(true)
      expect(wrapper.find('.increase').exists()).toBe(true)
    })

    it('应该显示当前值', () => {
      const wrapper = mount(CustomNumberInput, {
        props: {
          modelValue: 42,
        },
      })

      const input = wrapper.find<HTMLInputElement>('.number-input')
      expect(input.element.value).toBe('42')
    })

    it('应该设置正确的 min、max 和 step 属性', () => {
      const wrapper = mount(CustomNumberInput, {
        props: {
          modelValue: 50,
          min: 10,
          max: 100,
          step: 5,
        },
      })

      const input = wrapper.find<HTMLInputElement>('.number-input')
      expect(input.element.min).toBe('10')
      expect(input.element.max).toBe('100')
      expect(input.element.step).toBe('5')
    })
  })

  describe('增加/减少按钮', () => {
    it('点击增加按钮应该增加值', async () => {
      const wrapper = mount(CustomNumberInput, {
        props: {
          modelValue: 50,
          max: 100,
          step: 10,
        },
      })

      await wrapper.find('.increase').trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')![0]).toEqual([60])
    })

    it('点击减少按钮应该减少值', async () => {
      const wrapper = mount(CustomNumberInput, {
        props: {
          modelValue: 50,
          min: 0,
          step: 10,
        },
      })

      await wrapper.find('.decrease').trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')![0]).toEqual([40])
    })

    it('达到最大值时增加按钮应该被禁用', () => {
      const wrapper = mount(CustomNumberInput, {
        props: {
          modelValue: 100,
          max: 100,
        },
      })

      const increaseBtn = wrapper.find('.increase')
      expect(increaseBtn.attributes('disabled')).toBeDefined()
    })

    it('达到最小值时减少按钮应该被禁用', () => {
      const wrapper = mount(CustomNumberInput, {
        props: {
          modelValue: 0,
          min: 0,
        },
      })

      const decreaseBtn = wrapper.find('.decrease')
      expect(decreaseBtn.attributes('disabled')).toBeDefined()
    })

    it('增加值不应该超过最大值', async () => {
      const wrapper = mount(CustomNumberInput, {
        props: {
          modelValue: 95,
          max: 100,
          step: 10,
        },
      })

      await wrapper.find('.increase').trigger('click')

      expect(wrapper.emitted('update:modelValue')![0]).toEqual([100])
    })

    it('减少值不应该低于最小值', async () => {
      const wrapper = mount(CustomNumberInput, {
        props: {
          modelValue: 5,
          min: 0,
          step: 10,
        },
      })

      await wrapper.find('.decrease').trigger('click')

      expect(wrapper.emitted('update:modelValue')![0]).toEqual([0])
    })

    it('禁用状态下不应该触发事件', async () => {
      const wrapper = mount(CustomNumberInput, {
        props: {
          modelValue: 100,
          max: 100,
        },
      })

      await wrapper.find('.increase').trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    })
  })

  describe('输入验证', () => {
    it('应该处理有效的数字输入', async () => {
      const wrapper = mount(CustomNumberInput, {
        props: {
          modelValue: 50,
          min: 0,
          max: 100,
        },
      })

      const input = wrapper.find('.number-input')
      await input.setValue('75')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')![0]).toEqual([75])
    })

    it('应该将无效输入重置为最小值', async () => {
      const wrapper = mount(CustomNumberInput, {
        props: {
          modelValue: 50,
          min: 0,
          max: 100,
        },
      })

      const input = wrapper.find('.number-input')
      await input.setValue('abc')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')![0]).toEqual([0])
    })

    it('应该限制输入值不超过最大值', async () => {
      const wrapper = mount(CustomNumberInput, {
        props: {
          modelValue: 50,
          min: 0,
          max: 100,
        },
      })

      const input = wrapper.find('.number-input')
      await input.setValue('150')

      expect(wrapper.emitted('update:modelValue')![0]).toEqual([100])
    })

    it('应该限制输入值不低于最小值', async () => {
      const wrapper = mount(CustomNumberInput, {
        props: {
          modelValue: 50,
          min: 10,
          max: 100,
        },
      })

      const input = wrapper.find('.number-input')
      await input.setValue('5')

      expect(wrapper.emitted('update:modelValue')![0]).toEqual([10])
    })
  })

  describe('失焦处理', () => {
    it('失焦时应该验证并更新值', async () => {
      const wrapper = mount(CustomNumberInput, {
        props: {
          modelValue: 50,
          min: 0,
          max: 100,
        },
      })

      const input = wrapper.find('.number-input')
      await input.setValue('75')
      await input.trigger('blur')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    })

    it('失焦时应该修正无效值', async () => {
      const wrapper = mount(CustomNumberInput, {
        props: {
          modelValue: 50,
          min: 0,
          max: 100,
        },
      })

      const input = wrapper.find<HTMLInputElement>('.number-input')
      input.element.value = 'invalid'
      await input.trigger('blur')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')![0]).toEqual([0])
    })
  })

  describe('无障碍支持', () => {
    it('应该有正确的 ARIA 标签', () => {
      const wrapper = mount(CustomNumberInput, {
        props: {
          modelValue: 50,
          label: '数量',
        },
      })

      const input = wrapper.find('.number-input')
      const decreaseBtn = wrapper.find('.decrease')
      const increaseBtn = wrapper.find('.increase')

      expect(input.attributes('aria-label')).toBe('数量')
      expect(decreaseBtn.attributes('aria-label')).toBe('减少数量')
      expect(increaseBtn.attributes('aria-label')).toBe('增加数量')
    })

    it('没有 label 时应该使用默认 ARIA 标签', () => {
      const wrapper = mount(CustomNumberInput, {
        props: {
          modelValue: 50,
        },
      })

      const decreaseBtn = wrapper.find('.decrease')
      const increaseBtn = wrapper.find('.increase')

      expect(decreaseBtn.attributes('aria-label')).toBe('减少数值')
      expect(increaseBtn.attributes('aria-label')).toBe('增加数值')
    })
  })

  describe('Props 验证（开发环境）', () => {
    it('min >= max 时应该警告', () => {
      mount(CustomNumberInput, {
        props: {
          modelValue: 50,
          min: 100,
          max: 50,
        },
      })

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('min (100) 应该小于 max (50)')
      )
    })

    it('step <= 0 时应该警告', () => {
      mount(CustomNumberInput, {
        props: {
          modelValue: 50,
          step: 0,
        },
      })

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('step (0) 应该大于 0'))
    })

    it('modelValue 超出范围时应该警告', () => {
      mount(CustomNumberInput, {
        props: {
          modelValue: 150,
          min: 0,
          max: 100,
        },
      })

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('modelValue (150) 应该在 [0, 100] 范围内')
      )
    })
  })
})
