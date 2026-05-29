import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import QuantitySelector from '../QuantitySelector.vue'
import CustomNumberInput from '../CustomNumberInput.vue'

describe('QuantitySelector', () => {
  describe('渲染测试', () => {
    it('应该渲染数量选择器', () => {
      const wrapper = mount(QuantitySelector, {
        props: {
          max: 10,
        },
      })

      expect(wrapper.find('.quantity-selector').exists()).toBe(true)
      expect(wrapper.find('.quantity-label').exists()).toBe(true)
      expect(wrapper.find('.quantity-hint').exists()).toBe(true)
    })

    it('应该渲染 CustomNumberInput 组件', () => {
      const wrapper = mount(QuantitySelector, {
        props: {
          max: 10,
        },
      })

      const numberInput = wrapper.findComponent(CustomNumberInput)
      expect(numberInput.exists()).toBe(true)
    })

    it('应该显示标签文本', () => {
      const wrapper = mount(QuantitySelector, {
        props: {
          max: 10,
        },
      })

      const label = wrapper.find('.quantity-label')
      expect(label.text()).toBe('使用数量：')
    })

    it('应该显示当前拥有数量提示', () => {
      const wrapper = mount(QuantitySelector, {
        props: {
          max: 15,
        },
      })

      const hint = wrapper.find('.quantity-hint')
      expect(hint.text()).toBe('当前拥有：15 个')
    })
  })

  describe('Props 传递', () => {
    it('应该传递正确的 min 值给 CustomNumberInput', () => {
      const wrapper = mount(QuantitySelector, {
        props: {
          max: 10,
        },
      })

      const numberInput = wrapper.findComponent(CustomNumberInput)
      expect(numberInput.props('min')).toBe(1)
    })

    it('应该传递正确的 max 值给 CustomNumberInput', () => {
      const wrapper = mount(QuantitySelector, {
        props: {
          max: 20,
        },
      })

      const numberInput = wrapper.findComponent(CustomNumberInput)
      expect(numberInput.props('max')).toBe(20)
    })

    it('应该传递正确的 label 给 CustomNumberInput', () => {
      const wrapper = mount(QuantitySelector, {
        props: {
          max: 10,
        },
      })

      const numberInput = wrapper.findComponent(CustomNumberInput)
      expect(numberInput.props('label')).toBe('使用数量')
    })

    it('应该传递 modelValue 给 CustomNumberInput', () => {
      const wrapper = mount(QuantitySelector, {
        props: {
          max: 10,
          modelValue: 5,
        },
      })

      const numberInput = wrapper.findComponent(CustomNumberInput)
      expect(numberInput.props('modelValue')).toBe(5)
    })

    it('没有 modelValue 时应该默认为 1', () => {
      const wrapper = mount(QuantitySelector, {
        props: {
          max: 10,
        },
      })

      const numberInput = wrapper.findComponent(CustomNumberInput)
      expect(numberInput.props('modelValue')).toBe(1)
    })
  })

  describe('v-model 双向绑定', () => {
    it('应该触发 update:modelValue 事件', async () => {
      const wrapper = mount(QuantitySelector, {
        props: {
          max: 10,
          modelValue: 1,
        },
      })

      const numberInput = wrapper.findComponent(CustomNumberInput)
      await numberInput.vm.$emit('update:modelValue', 5)

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')![0]).toEqual([5])
    })

    it('应该更新本地数量值', async () => {
      const wrapper = mount(QuantitySelector, {
        props: {
          max: 10,
          modelValue: 1,
        },
      })

      const numberInput = wrapper.findComponent(CustomNumberInput)
      await numberInput.vm.$emit('update:modelValue', 7)

      await nextTick()

      expect(numberInput.props('modelValue')).toBe(7)
    })

    it('应该响应外部 modelValue 变化', async () => {
      const wrapper = mount(QuantitySelector, {
        props: {
          max: 10,
          modelValue: 1,
        },
      })

      await wrapper.setProps({ modelValue: 8 })
      await nextTick()

      const numberInput = wrapper.findComponent(CustomNumberInput)
      expect(numberInput.props('modelValue')).toBe(8)
    })

    it('外部 modelValue 为 undefined 时不应该更新', async () => {
      const wrapper = mount(QuantitySelector, {
        props: {
          max: 10,
          modelValue: 5,
        },
      })

      await wrapper.setProps({ modelValue: undefined })
      await nextTick()

      const numberInput = wrapper.findComponent(CustomNumberInput)
      // 应该保持原值
      expect(numberInput.props('modelValue')).toBe(5)
    })
  })

  describe('数量限制', () => {
    it('应该限制最小值为 1', () => {
      const wrapper = mount(QuantitySelector, {
        props: {
          max: 10,
        },
      })

      const numberInput = wrapper.findComponent(CustomNumberInput)
      expect(numberInput.props('min')).toBe(1)
    })

    it('应该限制最大值为 max', () => {
      const wrapper = mount(QuantitySelector, {
        props: {
          max: 25,
        },
      })

      const numberInput = wrapper.findComponent(CustomNumberInput)
      expect(numberInput.props('max')).toBe(25)
    })

    it('max 更新时应该更新 CustomNumberInput 的 max', async () => {
      const wrapper = mount(QuantitySelector, {
        props: {
          max: 10,
        },
      })

      await wrapper.setProps({ max: 20 })

      const numberInput = wrapper.findComponent(CustomNumberInput)
      expect(numberInput.props('max')).toBe(20)
    })
  })

  describe('边界情况', () => {
    it('应该处理 max 为 1 的情况', () => {
      const wrapper = mount(QuantitySelector, {
        props: {
          max: 1,
        },
      })

      const hint = wrapper.find('.quantity-hint')
      expect(hint.text()).toBe('当前拥有：1 个')

      const numberInput = wrapper.findComponent(CustomNumberInput)
      expect(numberInput.props('max')).toBe(1)
    })

    it('应该处理 max 为 0 的情况', () => {
      const wrapper = mount(QuantitySelector, {
        props: {
          max: 0,
        },
      })

      const hint = wrapper.find('.quantity-hint')
      expect(hint.text()).toBe('当前拥有：0 个')

      const numberInput = wrapper.findComponent(CustomNumberInput)
      expect(numberInput.props('max')).toBe(0)
    })

    it('应该处理大数量', () => {
      const wrapper = mount(QuantitySelector, {
        props: {
          max: 9999,
        },
      })

      const hint = wrapper.find('.quantity-hint')
      expect(hint.text()).toBe('当前拥有：9999 个')
    })

    it('应该处理 modelValue 为 0（会被默认为 1）', () => {
      const wrapper = mount(QuantitySelector, {
        props: {
          max: 10,
          modelValue: 0,
        },
      })

      const numberInput = wrapper.findComponent(CustomNumberInput)
      // 由于 props.modelValue || 1 的逻辑，0 会被视为 falsy 值，使用默认值 1
      expect(numberInput.props('modelValue')).toBe(1)
    })
  })

  describe('无障碍支持', () => {
    it('label 应该关联到 input', () => {
      const wrapper = mount(QuantitySelector, {
        props: {
          max: 10,
        },
      })

      const label = wrapper.find('.quantity-label')
      expect(label.attributes('for')).toBe('quantity-input')

      const numberInput = wrapper.findComponent(CustomNumberInput)
      expect(numberInput.attributes('id')).toBe('quantity-input')
    })
  })

  describe('多次更新', () => {
    it('应该处理连续的数量更新', async () => {
      const wrapper = mount(QuantitySelector, {
        props: {
          max: 10,
          modelValue: 1,
        },
      })

      const numberInput = wrapper.findComponent(CustomNumberInput)

      // 第一次更新
      await numberInput.vm.$emit('update:modelValue', 3)
      expect(wrapper.emitted('update:modelValue')![0]).toEqual([3])

      // 第二次更新
      await numberInput.vm.$emit('update:modelValue', 5)
      expect(wrapper.emitted('update:modelValue')![1]).toEqual([5])

      // 第三次更新
      await numberInput.vm.$emit('update:modelValue', 2)
      expect(wrapper.emitted('update:modelValue')![2]).toEqual([2])
    })

    it('应该处理连续的外部 modelValue 更新', async () => {
      const wrapper = mount(QuantitySelector, {
        props: {
          max: 10,
          modelValue: 1,
        },
      })

      await wrapper.setProps({ modelValue: 3 })
      await nextTick()
      let numberInput = wrapper.findComponent(CustomNumberInput)
      expect(numberInput.props('modelValue')).toBe(3)

      await wrapper.setProps({ modelValue: 7 })
      await nextTick()
      numberInput = wrapper.findComponent(CustomNumberInput)
      expect(numberInput.props('modelValue')).toBe(7)

      await wrapper.setProps({ modelValue: 2 })
      await nextTick()
      numberInput = wrapper.findComponent(CustomNumberInput)
      expect(numberInput.props('modelValue')).toBe(2)
    })
  })
})
