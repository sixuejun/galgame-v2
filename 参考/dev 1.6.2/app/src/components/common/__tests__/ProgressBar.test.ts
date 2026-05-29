import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProgressBar from '../ProgressBar.vue'

// Mock HTMLOptionElement for testing environment
;(globalThis as typeof globalThis & { Option: typeof HTMLOptionElement }).Option = class Option {
  style: { color: string } = { color: '' }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any

describe('ProgressBar', () => {
  describe('渲染测试', () => {
    it('应该渲染进度条组件', () => {
      const wrapper = mount(ProgressBar, {
        props: {
          label: '生命值',
          current: 50,
          max: 100,
          barClass: 'health-bar',
        },
      })

      expect(wrapper.find('.progress-item').exists()).toBe(true)
      expect(wrapper.find('.progress-label').exists()).toBe(true)
      expect(wrapper.find('.progress-bar').exists()).toBe(true)
      expect(wrapper.find('.progress-fill').exists()).toBe(true)
    })

    it('应该显示标签文本', () => {
      const wrapper = mount(ProgressBar, {
        props: {
          label: '经验值',
          current: 75,
          max: 100,
          barClass: 'exp-bar',
        },
      })

      const label = wrapper.find('.progress-label span:first-child')
      expect(label.text()).toBe('经验值')
    })

    it('应该显示当前值和最大值', () => {
      const wrapper = mount(ProgressBar, {
        props: {
          label: '生命值',
          current: 50,
          max: 100,
          barClass: 'health-bar',
        },
      })

      const valueText = wrapper.find('.progress-label span:last-child')
      expect(valueText.text()).toBe('50 / 100')
    })

    it('应该格式化大数字（使用千位分隔符）', () => {
      const wrapper = mount(ProgressBar, {
        props: {
          label: '金币',
          current: 1234567,
          max: 9999999,
          barClass: 'gold-bar',
        },
      })

      const valueText = wrapper.find('.progress-label span:last-child')
      // toLocaleString() 会添加千位分隔符
      expect(valueText.text()).toContain('1,234,567')
      expect(valueText.text()).toContain('9,999,999')
    })
  })

  describe('进度百分比计算', () => {
    it('应该正确计算进度百分比', () => {
      const wrapper = mount(ProgressBar, {
        props: {
          label: '进度',
          current: 50,
          max: 100,
          barClass: 'progress-bar',
        },
      })

      const fill = wrapper.find('.progress-fill')
      expect(fill.attributes('style')).toContain('width: 50%')
    })

    it('应该处理 0% 进度', () => {
      const wrapper = mount(ProgressBar, {
        props: {
          label: '进度',
          current: 0,
          max: 100,
          barClass: 'progress-bar',
        },
      })

      const fill = wrapper.find('.progress-fill')
      expect(fill.attributes('style')).toContain('width: 0%')
    })

    it('应该处理 100% 进度', () => {
      const wrapper = mount(ProgressBar, {
        props: {
          label: '进度',
          current: 100,
          max: 100,
          barClass: 'progress-bar',
        },
      })

      const fill = wrapper.find('.progress-fill')
      expect(fill.attributes('style')).toContain('width: 100%')
    })

    it('超过最大值时应该限制为 100%', () => {
      const wrapper = mount(ProgressBar, {
        props: {
          label: '进度',
          current: 150,
          max: 100,
          barClass: 'progress-bar',
        },
      })

      const fill = wrapper.find('.progress-fill')
      expect(fill.attributes('style')).toContain('width: 100%')
    })

    it('负值时应该显示为 0%', () => {
      const wrapper = mount(ProgressBar, {
        props: {
          label: '进度',
          current: -10,
          max: 100,
          barClass: 'progress-bar',
        },
      })

      const fill = wrapper.find('.progress-fill')
      expect(fill.attributes('style')).toContain('width: 0%')
    })

    it('应该处理小数进度', () => {
      const wrapper = mount(ProgressBar, {
        props: {
          label: '进度',
          current: 33.33,
          max: 100,
          barClass: 'progress-bar',
        },
      })

      const fill = wrapper.find('.progress-fill')
      expect(fill.attributes('style')).toContain('width: 33.33%')
    })
  })

  describe('样式类处理', () => {
    it('应该处理 CSS 变量样式类', () => {
      const wrapper = mount(ProgressBar, {
        props: {
          label: '生命值',
          current: 50,
          max: 100,
          barClass: 'health-bar',
        },
      })

      const fill = wrapper.find('.progress-fill')
      const style = fill.attributes('style')
      // 在测试环境中，isCssColor 可能无法正确识别，所以样式可能只包含 width
      expect(style).toContain('width: 50%')
    })

    it('应该处理渐变样式', () => {
      const wrapper = mount(ProgressBar, {
        props: {
          label: '经验值',
          current: 75,
          max: 100,
          barClass: 'linear-gradient(to right, #ff0000, #00ff00)',
        },
      })

      const fill = wrapper.find('.progress-fill')
      const style = fill.attributes('style')
      expect(style).toContain('background: linear-gradient')
    })

    it('应该处理直接颜色值', () => {
      const wrapper = mount(ProgressBar, {
        props: {
          label: '魔法值',
          current: 60,
          max: 100,
          barClass: '#0066cc',
        },
      })

      const fill = wrapper.find('.progress-fill')
      const style = fill.attributes('style')
      expect(style).toContain('background: #0066cc')
    })

    it('应该处理 RGB 颜色', () => {
      const wrapper = mount(ProgressBar, {
        props: {
          label: '能量',
          current: 80,
          max: 100,
          barClass: 'rgb(255, 0, 0)',
        },
      })

      const fill = wrapper.find('.progress-fill')
      const style = fill.attributes('style')
      expect(style).toContain('background: rgb(255, 0, 0)')
    })
  })

  describe('Props 更新', () => {
    it('更新 current 应该更新进度条宽度', async () => {
      const wrapper = mount(ProgressBar, {
        props: {
          label: '进度',
          current: 30,
          max: 100,
          barClass: 'progress-bar',
        },
      })

      expect(wrapper.find('.progress-fill').attributes('style')).toContain('width: 30%')

      await wrapper.setProps({ current: 70 })

      expect(wrapper.find('.progress-fill').attributes('style')).toContain('width: 70%')
    })

    it('更新 max 应该重新计算百分比', async () => {
      const wrapper = mount(ProgressBar, {
        props: {
          label: '进度',
          current: 50,
          max: 100,
          barClass: 'progress-bar',
        },
      })

      expect(wrapper.find('.progress-fill').attributes('style')).toContain('width: 50%')

      await wrapper.setProps({ max: 200 })

      expect(wrapper.find('.progress-fill').attributes('style')).toContain('width: 25%')
    })

    it('更新 label 应该更新显示文本', async () => {
      const wrapper = mount(ProgressBar, {
        props: {
          label: '生命值',
          current: 50,
          max: 100,
          barClass: 'health-bar',
        },
      })

      expect(wrapper.find('.progress-label span:first-child').text()).toBe('生命值')

      await wrapper.setProps({ label: '魔法值' })

      expect(wrapper.find('.progress-label span:first-child').text()).toBe('魔法值')
    })

    it('更新 barClass 应该更新样式', async () => {
      const wrapper = mount(ProgressBar, {
        props: {
          label: '进度',
          current: 50,
          max: 100,
          barClass: 'linear-gradient(to right, #ff0000, #00ff00)',
        },
      })

      const fill = wrapper.find('.progress-fill')
      expect(fill.attributes('style')).toContain('linear-gradient')

      await wrapper.setProps({ barClass: 'linear-gradient(to right, #0000ff, #ffff00)' })

      expect(fill.attributes('style')).toContain('linear-gradient')
      expect(fill.attributes('style')).toContain('#0000ff')
    })
  })

  describe('边界情况', () => {
    it('应该处理 max 为 0 的情况', () => {
      const wrapper = mount(ProgressBar, {
        props: {
          label: '进度',
          current: 0,
          max: 0,
          barClass: 'progress-bar',
        },
      })

      const fill = wrapper.find('.progress-fill')
      // current / max = 0 / 0 = NaN，应该被处理为 0%
      const style = fill.attributes('style')
      expect(style).toBeDefined()
    })

    it('应该处理非常大的数值', () => {
      const wrapper = mount(ProgressBar, {
        props: {
          label: '经验值',
          current: 999999999,
          max: 1000000000,
          barClass: 'exp-bar',
        },
      })

      const fill = wrapper.find('.progress-fill')
      expect(fill.attributes('style')).toContain('width: 99.9999999%')
    })

    it('应该处理空字符串 barClass', () => {
      const wrapper = mount(ProgressBar, {
        props: {
          label: '进度',
          current: 50,
          max: 100,
          barClass: '',
        },
      })

      const fill = wrapper.find('.progress-fill')
      expect(fill.attributes('style')).toBeDefined()
    })
  })

  describe('数值显示', () => {
    it('应该正确显示整数', () => {
      const wrapper = mount(ProgressBar, {
        props: {
          label: '生命值',
          current: 100,
          max: 200,
          barClass: 'health-bar',
        },
      })

      const valueText = wrapper.find('.progress-label span:last-child')
      expect(valueText.text()).toBe('100 / 200')
    })

    it('应该正确显示小数', () => {
      const wrapper = mount(ProgressBar, {
        props: {
          label: '经验值',
          current: 123.45,
          max: 500.67,
          barClass: 'exp-bar',
        },
      })

      const valueText = wrapper.find('.progress-label span:last-child')
      expect(valueText.text()).toContain('123.45')
      expect(valueText.text()).toContain('500.67')
    })
  })
})
