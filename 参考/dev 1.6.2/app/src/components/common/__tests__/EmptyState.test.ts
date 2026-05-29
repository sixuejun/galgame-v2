import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EmptyState from '../EmptyState.vue'

describe('EmptyState', () => {
  describe('基本渲染', () => {
    it('应该渲染图标、标题和描述', () => {
      const wrapper = mount(EmptyState, {
        props: {
          icon: 'fas fa-inbox',
          title: '暂无数据',
          description: '开始使用后会显示内容',
        },
      })

      // 检查图标
      const icon = wrapper.find('.empty-icon i')
      expect(icon.exists()).toBe(true)
      expect(icon.classes()).toContain('fas')
      expect(icon.classes()).toContain('fa-inbox')

      // 检查标题
      const title = wrapper.find('h3')
      expect(title.exists()).toBe(true)
      expect(title.text()).toBe('暂无数据')

      // 检查描述
      const description = wrapper.find('p')
      expect(description.exists()).toBe(true)
      expect(description.text()).toBe('开始使用后会显示内容')
    })

    it('应该有正确的 ARIA 属性', () => {
      const wrapper = mount(EmptyState, {
        props: {
          icon: 'fas fa-inbox',
          title: '暂无数据',
          description: '开始使用后会显示内容',
        },
      })

      const section = wrapper.find('section')
      expect(section.attributes('role')).toBe('status')
    })

    it('应该在没有按钮文本时不渲染按钮', () => {
      const wrapper = mount(EmptyState, {
        props: {
          icon: 'fas fa-inbox',
          title: '暂无数据',
          description: '开始使用后会显示内容',
        },
      })

      const button = wrapper.find('button')
      expect(button.exists()).toBe(false)
    })
  })

  describe('按钮功能', () => {
    it('应该在提供 buttonText 时渲染按钮', () => {
      const wrapper = mount(EmptyState, {
        props: {
          icon: 'fas fa-inbox',
          title: '暂无数据',
          description: '开始使用后会显示内容',
          buttonText: '开始使用',
        },
      })

      const button = wrapper.find('button')
      expect(button.exists()).toBe(true)
      expect(button.text()).toBe('开始使用')
    })

    it('应该在按钮中渲染图标', () => {
      const wrapper = mount(EmptyState, {
        props: {
          icon: 'fas fa-inbox',
          title: '暂无数据',
          description: '开始使用后会显示内容',
          buttonText: '开始使用',
          buttonIcon: 'fas fa-plus',
        },
      })

      const buttonIcon = wrapper.find('button i')
      expect(buttonIcon.exists()).toBe(true)
      expect(buttonIcon.classes()).toContain('fas')
      expect(buttonIcon.classes()).toContain('fa-plus')
    })

    it('应该在点击按钮时触发 button-click 事件', async () => {
      const wrapper = mount(EmptyState, {
        props: {
          icon: 'fas fa-inbox',
          title: '暂无数据',
          description: '开始使用后会显示内容',
          buttonText: '开始使用',
        },
      })

      const button = wrapper.find('button')
      await button.trigger('click')

      expect(wrapper.emitted('button-click')).toBeTruthy()
      expect(wrapper.emitted('button-click')).toHaveLength(1)
    })

    it('应该使用自定义的 buttonAriaLabel', () => {
      const wrapper = mount(EmptyState, {
        props: {
          icon: 'fas fa-inbox',
          title: '暂无数据',
          description: '开始使用后会显示内容',
          buttonText: '开始',
          buttonAriaLabel: '开始使用应用',
        },
      })

      const button = wrapper.find('button')
      expect(button.attributes('aria-label')).toBe('开始使用应用')
    })

    it('应该在没有 buttonAriaLabel 时使用 buttonText 作为 aria-label', () => {
      const wrapper = mount(EmptyState, {
        props: {
          icon: 'fas fa-inbox',
          title: '暂无数据',
          description: '开始使用后会显示内容',
          buttonText: '开始使用',
        },
      })

      const button = wrapper.find('button')
      expect(button.attributes('aria-label')).toBe('开始使用')
    })
  })

  describe('主题样式', () => {
    it('应该使用默认主题', () => {
      const wrapper = mount(EmptyState, {
        props: {
          icon: 'fas fa-inbox',
          title: '暂无数据',
          description: '开始使用后会显示内容',
        },
      })

      const section = wrapper.find('section')
      expect(section.classes()).toContain('theme-default')
    })

    it('应该应用金色主题', () => {
      const wrapper = mount(EmptyState, {
        props: {
          icon: 'fas fa-trophy',
          title: '暂无成就',
          description: '完成任务后会显示成就',
          theme: 'gold',
        },
      })

      const section = wrapper.find('section')
      expect(section.classes()).toContain('theme-gold')
    })

    it('应该应用紫色主题', () => {
      const wrapper = mount(EmptyState, {
        props: {
          icon: 'fas fa-box',
          title: '仓库为空',
          description: '购买物品后会显示在这里',
          theme: 'purple',
        },
      })

      const section = wrapper.find('section')
      expect(section.classes()).toContain('theme-purple')
    })

    it('应该应用粉色主题', () => {
      const wrapper = mount(EmptyState, {
        props: {
          icon: 'fas fa-shopping-cart',
          title: '购物车为空',
          description: '添加商品到购物车',
          theme: 'pink',
        },
      })

      const section = wrapper.find('section')
      expect(section.classes()).toContain('theme-pink')
    })

    it('应该应用蓝色主题', () => {
      const wrapper = mount(EmptyState, {
        props: {
          icon: 'fas fa-inbox',
          title: '暂无数据',
          description: '开始使用后会显示内容',
          theme: 'blue',
        },
      })

      const section = wrapper.find('section')
      expect(section.classes()).toContain('theme-blue')
    })
  })

  describe('边界情况', () => {
    it('应该处理空的 buttonIcon', () => {
      const wrapper = mount(EmptyState, {
        props: {
          icon: 'fas fa-inbox',
          title: '暂无数据',
          description: '开始使用后会显示内容',
          buttonText: '开始使用',
          buttonIcon: '',
        },
      })

      const button = wrapper.find('button')
      expect(button.exists()).toBe(true)
      const buttonIcon = wrapper.find('button i')
      expect(buttonIcon.exists()).toBe(false)
    })

    it('应该处理多次点击按钮', async () => {
      const wrapper = mount(EmptyState, {
        props: {
          icon: 'fas fa-inbox',
          title: '暂无数据',
          description: '开始使用后会显示内容',
          buttonText: '开始使用',
        },
      })

      const button = wrapper.find('button')
      await button.trigger('click')
      await button.trigger('click')
      await button.trigger('click')

      expect(wrapper.emitted('button-click')).toHaveLength(3)
    })

    it('应该正确处理长文本内容', () => {
      const longTitle = '这是一个非常非常非常长的标题文本用于测试组件的文本处理能力'
      const longDescription =
        '这是一个非常非常非常长的描述文本用于测试组件的文本处理能力和响应式布局'

      const wrapper = mount(EmptyState, {
        props: {
          icon: 'fas fa-inbox',
          title: longTitle,
          description: longDescription,
        },
      })

      expect(wrapper.find('h3').text()).toBe(longTitle)
      expect(wrapper.find('p').text()).toBe(longDescription)
    })
  })

  describe('组件结构', () => {
    it('应该有正确的 CSS 类', () => {
      const wrapper = mount(EmptyState, {
        props: {
          icon: 'fas fa-inbox',
          title: '暂无数据',
          description: '开始使用后会显示内容',
        },
      })

      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.find('.empty-icon').exists()).toBe(true)
    })

    it('应该按正确的顺序渲染元素', () => {
      const wrapper = mount(EmptyState, {
        props: {
          icon: 'fas fa-inbox',
          title: '暂无数据',
          description: '开始使用后会显示内容',
          buttonText: '开始使用',
        },
      })

      const section = wrapper.find('section')
      const children = section.element.children

      // 检查子元素顺序：图标 -> 标题 -> 描述 -> 按钮
      expect(children[0].classList.contains('empty-icon')).toBe(true)
      expect(children[1].tagName).toBe('H3')
      expect(children[2].tagName).toBe('P')
      expect(children[3].tagName).toBe('BUTTON')
    })
  })
})
