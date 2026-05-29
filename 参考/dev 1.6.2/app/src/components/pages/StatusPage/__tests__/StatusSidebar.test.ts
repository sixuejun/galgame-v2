import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusSidebar from '../StatusSidebar.vue'
import Icon from '../../../common/Icon.vue'

describe('StatusSidebar', () => {
  const defaultTabs = {
    user: {
      id: 'user',
      name: '玩家',
      icon: 'fa-user',
    },
    npc1: {
      id: 'npc1',
      name: 'NPC1',
      icon: 'fa-robot',
    },
    npc2: {
      id: 'npc2',
      name: 'NPC2',
    },
  }

  const defaultProps = {
    tabs: defaultTabs,
    activeTab: 'user',
    isCollapsed: false,
  }

  beforeEach(() => {
    // 清理
  })

  describe('渲染测试', () => {
    it('应该渲染侧边栏', () => {
      const wrapper = mount(StatusSidebar, {
        props: defaultProps,
      })

      expect(wrapper.find('.status-sidebar').exists()).toBe(true)
    })

    it('应该渲染切换按钮', () => {
      const wrapper = mount(StatusSidebar, {
        props: defaultProps,
      })

      const toggleBtn = wrapper.find('.sidebar-toggle-desktop')
      expect(toggleBtn.exists()).toBe(true)
      expect(toggleBtn.attributes('aria-label')).toBe('切换侧边栏')
    })

    it('应该渲染所有标签页', () => {
      const wrapper = mount(StatusSidebar, {
        props: defaultProps,
      })

      const items = wrapper.findAll('.sidebar-item')
      expect(items).toHaveLength(Object.keys(defaultTabs).length)
    })

    it('应该渲染标签页名称', () => {
      const wrapper = mount(StatusSidebar, {
        props: defaultProps,
      })

      const items = wrapper.findAll('.sidebar-item')
      expect(items[0].find('.sidebar-item-name').text()).toBe('玩家')
      expect(items[1].find('.sidebar-item-name').text()).toBe('NPC1')
      expect(items[2].find('.sidebar-item-name').text()).toBe('NPC2')
    })

    it('应该渲染标签页图标', () => {
      const wrapper = mount(StatusSidebar, {
        props: defaultProps,
      })

      const iconComponents = wrapper.findAllComponents(Icon)
      expect(iconComponents).toHaveLength(3)
      expect(iconComponents[0].props('iconData')).toBe('fa-user')
      expect(iconComponents[1].props('iconData')).toBe('fa-robot')
      // 第三个使用默认图标
      expect(iconComponents[2].props('iconData')).toBe('fa-user-circle')
    })
  })

  describe('折叠状态测试', () => {
    it('折叠时应该添加 collapsed 类', () => {
      const wrapper = mount(StatusSidebar, {
        props: {
          ...defaultProps,
          isCollapsed: true,
        },
      })

      expect(wrapper.find('.status-sidebar').classes()).toContain('collapsed')
    })

    it('展开时不应该有 collapsed 类', () => {
      const wrapper = mount(StatusSidebar, {
        props: {
          ...defaultProps,
          isCollapsed: false,
        },
      })

      expect(wrapper.find('.status-sidebar').classes()).not.toContain('collapsed')
    })

    it('折叠时应该隐藏标签页内容', () => {
      const wrapper = mount(StatusSidebar, {
        props: {
          ...defaultProps,
          isCollapsed: true,
        },
      })

      const content = wrapper.findAll('.sidebar-item-content')
      expect(content).toHaveLength(0)
    })

    it('展开时应该显示标签页内容', () => {
      const wrapper = mount(StatusSidebar, {
        props: {
          ...defaultProps,
          isCollapsed: false,
        },
      })

      const content = wrapper.findAll('.sidebar-item-content')
      expect(content.length).toBeGreaterThan(0)
    })

    it('折叠时切换按钮应该显示右箭头', () => {
      const wrapper = mount(StatusSidebar, {
        props: {
          ...defaultProps,
          isCollapsed: true,
        },
      })

      const icon = wrapper.find('.sidebar-toggle-desktop i')
      expect(icon.classes()).toContain('fa-chevron-right')
    })

    it('展开时切换按钮应该显示左箭头', () => {
      const wrapper = mount(StatusSidebar, {
        props: {
          ...defaultProps,
          isCollapsed: false,
        },
      })

      const icon = wrapper.find('.sidebar-toggle-desktop i')
      expect(icon.classes()).toContain('fa-chevron-left')
    })
  })

  describe('激活状态测试', () => {
    it('应该正确显示激活的标签页', () => {
      const wrapper = mount(StatusSidebar, {
        props: {
          ...defaultProps,
          activeTab: 'npc1',
        },
      })

      const items = wrapper.findAll('.sidebar-item')
      expect(items[0].classes()).not.toContain('active')
      expect(items[1].classes()).toContain('active')
      expect(items[2].classes()).not.toContain('active')
    })

    it('激活状态变化时应该更新', async () => {
      const wrapper = mount(StatusSidebar, {
        props: defaultProps,
      })

      await wrapper.setProps({ activeTab: 'npc2' })

      const items = wrapper.findAll('.sidebar-item')
      expect(items[0].classes()).not.toContain('active')
      expect(items[1].classes()).not.toContain('active')
      expect(items[2].classes()).toContain('active')
    })
  })

  describe('事件测试', () => {
    it('点击切换按钮应该触发 toggle 事件', async () => {
      const wrapper = mount(StatusSidebar, {
        props: defaultProps,
      })

      await wrapper.find('.sidebar-toggle-desktop').trigger('click')

      expect(wrapper.emitted('toggle')).toBeTruthy()
    })

    it('点击标签页应该触发 selectTab 事件', async () => {
      const wrapper = mount(StatusSidebar, {
        props: defaultProps,
      })

      const items = wrapper.findAll('.sidebar-item')
      await items[1].trigger('click')

      expect(wrapper.emitted('selectTab')).toBeTruthy()
      expect(wrapper.emitted('selectTab')?.[0]).toEqual(['npc1'])
    })

    it('点击不同标签页应该触发不同的 selectTab 事件', async () => {
      const wrapper = mount(StatusSidebar, {
        props: defaultProps,
      })

      const items = wrapper.findAll('.sidebar-item')
      await items[0].trigger('click')
      await items[2].trigger('click')

      expect(wrapper.emitted('selectTab')).toHaveLength(2)
      expect(wrapper.emitted('selectTab')?.[0]).toEqual(['user'])
      expect(wrapper.emitted('selectTab')?.[1]).toEqual(['npc2'])
    })
  })

  describe('图标处理测试', () => {
    it('应该正确处理 fa- 前缀的图标', () => {
      const wrapper = mount(StatusSidebar, {
        props: {
          ...defaultProps,
          tabs: {
            test: {
              id: 'test',
              name: '测试',
              icon: 'fa-star',
            },
          },
        },
      })

      const iconComponent = wrapper.findComponent(Icon)
      expect(iconComponent.exists()).toBe(true)
      expect(iconComponent.props('iconData')).toBe('fa-star')
      expect(iconComponent.props('alt')).toBe('测试图标')
    })

    it('应该正确处理完整类名的图标', () => {
      const wrapper = mount(StatusSidebar, {
        props: {
          ...defaultProps,
          tabs: {
            test: {
              id: 'test',
              name: '测试',
              icon: 'fas fa-heart',
            },
          },
        },
      })

      const iconComponent = wrapper.findComponent(Icon)
      expect(iconComponent.exists()).toBe(true)
      expect(iconComponent.props('iconData')).toBe('fas fa-heart')
    })

    it('没有图标时应该使用默认图标', () => {
      const wrapper = mount(StatusSidebar, {
        props: {
          ...defaultProps,
          tabs: {
            test: {
              id: 'test',
              name: '测试',
            },
          },
        },
      })

      const iconComponent = wrapper.findComponent(Icon)
      expect(iconComponent.exists()).toBe(true)
      expect(iconComponent.props('iconData')).toBe('fa-user-circle')
    })

    it('应该正确处理 URL 图标', () => {
      const wrapper = mount(StatusSidebar, {
        props: {
          ...defaultProps,
          tabs: {
            test: {
              id: 'test',
              name: '测试',
              icon: 'https://example.com/icon.png',
            },
          },
        },
      })

      const iconComponent = wrapper.findComponent(Icon)
      expect(iconComponent.exists()).toBe(true)
      expect(iconComponent.props('iconData')).toBe('https://example.com/icon.png')
      expect(iconComponent.props('alt')).toBe('测试图标')
    })
  })

  describe('响应式测试', () => {
    it('标签页变化时应该更新渲染', async () => {
      const wrapper = mount(StatusSidebar, {
        props: defaultProps,
      })

      await wrapper.setProps({
        tabs: {
          newTab: {
            id: 'newTab',
            name: '新标签',
            icon: 'fa-plus',
          },
        },
      })

      const items = wrapper.findAll('.sidebar-item')
      expect(items).toHaveLength(1)
      expect(items[0].find('.sidebar-item-name').text()).toBe('新标签')
    })
  })
})
