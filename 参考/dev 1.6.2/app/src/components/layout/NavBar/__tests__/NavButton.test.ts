import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NavButton from '../NavButton.vue'
import Icon from '../../../common/Icon.vue'

describe('NavButton', () => {
  describe('渲染测试', () => {
    it('应该渲染导航按钮', () => {
      const wrapper = mount(NavButton, {
        props: {
          icon: 'fas fa-home',
          name: '主页',
          isActive: false,
        },
      })

      expect(wrapper.find('.nav-button').exists()).toBe(true)
    })

    it('应该渲染图标组件', () => {
      const wrapper = mount(NavButton, {
        props: {
          icon: 'fas fa-home',
          name: '主页',
          isActive: false,
        },
      })

      const icon = wrapper.findComponent(Icon)
      expect(icon.exists()).toBe(true)
      expect(icon.props('iconData')).toBe('fas fa-home')
    })

    it('应该显示按钮文本', () => {
      const wrapper = mount(NavButton, {
        props: {
          icon: 'fas fa-home',
          name: '主页',
          isActive: false,
        },
      })

      const text = wrapper.find('.nav-button-text')
      expect(text.exists()).toBe(true)
      expect(text.text()).toBe('主页')
    })

    it('应该传递正确的 alt 给图标', () => {
      const wrapper = mount(NavButton, {
        props: {
          icon: 'fas fa-shopping-cart',
          name: '购物车',
          isActive: false,
        },
      })

      const icon = wrapper.findComponent(Icon)
      expect(icon.props('alt')).toBe('购物车按钮')
    })
  })

  describe('激活状态', () => {
    it('未激活时不应该有 active 类', () => {
      const wrapper = mount(NavButton, {
        props: {
          icon: 'fas fa-home',
          name: '主页',
          isActive: false,
        },
      })

      expect(wrapper.find('.nav-button').classes()).not.toContain('active')
    })

    it('激活时应该有 active 类', () => {
      const wrapper = mount(NavButton, {
        props: {
          icon: 'fas fa-home',
          name: '主页',
          isActive: true,
        },
      })

      expect(wrapper.find('.nav-button').classes()).toContain('active')
    })

    it('更新 isActive 应该切换 active 类', async () => {
      const wrapper = mount(NavButton, {
        props: {
          icon: 'fas fa-home',
          name: '主页',
          isActive: false,
        },
      })

      expect(wrapper.find('.nav-button').classes()).not.toContain('active')

      await wrapper.setProps({ isActive: true })

      expect(wrapper.find('.nav-button').classes()).toContain('active')
    })
  })

  describe('点击事件', () => {
    it('点击按钮应该触发 click 事件', async () => {
      const wrapper = mount(NavButton, {
        props: {
          icon: 'fas fa-home',
          name: '主页',
          isActive: false,
        },
      })

      await wrapper.find('.nav-button').trigger('click')

      expect(wrapper.emitted('click')).toBeTruthy()
      expect(wrapper.emitted('click')).toHaveLength(1)
    })

    it('多次点击应该触发多次事件', async () => {
      const wrapper = mount(NavButton, {
        props: {
          icon: 'fas fa-home',
          name: '主页',
          isActive: false,
        },
      })

      await wrapper.find('.nav-button').trigger('click')
      await wrapper.find('.nav-button').trigger('click')
      await wrapper.find('.nav-button').trigger('click')

      expect(wrapper.emitted('click')).toHaveLength(3)
    })

    it('激活状态下点击也应该触发事件', async () => {
      const wrapper = mount(NavButton, {
        props: {
          icon: 'fas fa-home',
          name: '主页',
          isActive: true,
        },
      })

      await wrapper.find('.nav-button').trigger('click')

      expect(wrapper.emitted('click')).toBeTruthy()
    })
  })

  describe('无障碍支持', () => {
    it('应该有正确的 aria-label', () => {
      const wrapper = mount(NavButton, {
        props: {
          icon: 'fas fa-home',
          name: '主页',
          isActive: false,
        },
      })

      const button = wrapper.find('.nav-button')
      expect(button.attributes('aria-label')).toBe('导航到主页')
    })

    it('未激活时不应该有 aria-current', () => {
      const wrapper = mount(NavButton, {
        props: {
          icon: 'fas fa-home',
          name: '主页',
          isActive: false,
        },
      })

      const button = wrapper.find('.nav-button')
      expect(button.attributes('aria-current')).toBeUndefined()
    })

    it('激活时应该有 aria-current="page"', () => {
      const wrapper = mount(NavButton, {
        props: {
          icon: 'fas fa-home',
          name: '主页',
          isActive: true,
        },
      })

      const button = wrapper.find('.nav-button')
      expect(button.attributes('aria-current')).toBe('page')
    })

    it('aria-label 应该根据 name 动态变化', async () => {
      const wrapper = mount(NavButton, {
        props: {
          icon: 'fas fa-home',
          name: '主页',
          isActive: false,
        },
      })

      expect(wrapper.find('.nav-button').attributes('aria-label')).toBe('导航到主页')

      await wrapper.setProps({ name: '设置' })

      expect(wrapper.find('.nav-button').attributes('aria-label')).toBe('导航到设置')
    })
  })

  describe('Props 更新', () => {
    it('更新 icon 应该更新图标', async () => {
      const wrapper = mount(NavButton, {
        props: {
          icon: 'fas fa-home',
          name: '主页',
          isActive: false,
        },
      })

      const icon = wrapper.findComponent(Icon)
      expect(icon.props('iconData')).toBe('fas fa-home')

      await wrapper.setProps({ icon: 'fas fa-cog' })

      expect(icon.props('iconData')).toBe('fas fa-cog')
    })

    it('更新 name 应该更新文本', async () => {
      const wrapper = mount(NavButton, {
        props: {
          icon: 'fas fa-home',
          name: '主页',
          isActive: false,
        },
      })

      expect(wrapper.find('.nav-button-text').text()).toBe('主页')

      await wrapper.setProps({ name: '设置' })

      expect(wrapper.find('.nav-button-text').text()).toBe('设置')
    })
  })

  describe('不同图标类型', () => {
    it('应该支持 Font Awesome 图标', () => {
      const wrapper = mount(NavButton, {
        props: {
          icon: 'fas fa-star',
          name: '收藏',
          isActive: false,
        },
      })

      const icon = wrapper.findComponent(Icon)
      expect(icon.props('iconData')).toBe('fas fa-star')
    })

    it('应该支持图片 URL', () => {
      const wrapper = mount(NavButton, {
        props: {
          icon: 'https://example.com/icon.png',
          name: '自定义',
          isActive: false,
        },
      })

      const icon = wrapper.findComponent(Icon)
      expect(icon.props('iconData')).toBe('https://example.com/icon.png')
    })

    it('应该支持 Emoji', () => {
      const wrapper = mount(NavButton, {
        props: {
          icon: '🏠',
          name: '主页',
          isActive: false,
        },
      })

      const icon = wrapper.findComponent(Icon)
      expect(icon.props('iconData')).toBe('🏠')
    })
  })

  describe('边界情况', () => {
    it('应该处理空字符串 name', () => {
      const wrapper = mount(NavButton, {
        props: {
          icon: 'fas fa-home',
          name: '',
          isActive: false,
        },
      })

      expect(wrapper.find('.nav-button-text').text()).toBe('')
      expect(wrapper.find('.nav-button').attributes('aria-label')).toBe('导航到')
    })

    it('应该处理长文本 name', () => {
      const longName = '这是一个非常非常长的导航按钮名称用于测试文本溢出处理'
      const wrapper = mount(NavButton, {
        props: {
          icon: 'fas fa-home',
          name: longName,
          isActive: false,
        },
      })

      expect(wrapper.find('.nav-button-text').text()).toBe(longName)
    })

    it('应该处理特殊字符 name', () => {
      const wrapper = mount(NavButton, {
        props: {
          icon: 'fas fa-home',
          name: '<script>alert("XSS")</script>',
          isActive: false,
        },
      })

      // Vue 会自动转义特殊字符，但文本内容仍然包含完整字符串
      const text = wrapper.find('.nav-button-text').text()
      expect(text).toBe('<script>alert("XSS")</script>')
    })
  })

  describe('组合场景', () => {
    it('应该正确处理激活状态和点击事件的组合', async () => {
      const wrapper = mount(NavButton, {
        props: {
          icon: 'fas fa-home',
          name: '主页',
          isActive: true,
        },
      })

      expect(wrapper.find('.nav-button').classes()).toContain('active')
      expect(wrapper.find('.nav-button').attributes('aria-current')).toBe('page')

      await wrapper.find('.nav-button').trigger('click')

      expect(wrapper.emitted('click')).toBeTruthy()
    })

    it('应该正确处理 Props 的连续更新', async () => {
      const wrapper = mount(NavButton, {
        props: {
          icon: 'fas fa-home',
          name: '主页',
          isActive: false,
        },
      })

      await wrapper.setProps({ isActive: true })
      expect(wrapper.find('.nav-button').classes()).toContain('active')

      await wrapper.setProps({ name: '设置' })
      expect(wrapper.find('.nav-button-text').text()).toBe('设置')

      await wrapper.setProps({ icon: 'fas fa-cog' })
      expect(wrapper.findComponent(Icon).props('iconData')).toBe('fas fa-cog')

      await wrapper.setProps({ isActive: false })
      expect(wrapper.find('.nav-button').classes()).not.toContain('active')
    })
  })
})
