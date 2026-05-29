import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusPage from '../StatusPage.vue'
import type { Config } from '../../../types'

// Mock StatusSidebar 组件
vi.mock('../StatusPage/StatusSidebar.vue', () => ({
  default: {
    name: 'StatusSidebar',
    template: '<div class="status-sidebar-mock"></div>',
    props: ['tabs', 'activeTab', 'isCollapsed'],
    emits: ['toggle', 'selectTab'],
  },
}))

// Mock section 组件
vi.mock('../StatusPage/DetailsSection.vue', () => ({
  default: {
    name: 'DetailsSection',
    template: '<div class="details-section-mock"></div>',
    props: ['title', 'details'],
  },
}))

vi.mock('../StatusPage/ProgressBarsSection.vue', () => ({
  default: {
    name: 'ProgressBarsSection',
    template: '<div class="progress-bars-section-mock"></div>',
    props: ['title', 'progressBars'],
  },
}))

vi.mock('../StatusPage/StatusValuesSection.vue', () => ({
  default: {
    name: 'StatusValuesSection',
    template: '<div class="status-values-section-mock"></div>',
    props: ['title', 'statusValues'],
  },
}))

vi.mock('../StatusPage/TraitsSection.vue', () => ({
  default: {
    name: 'TraitsSection',
    template: '<div class="traits-section-mock"></div>',
    props: ['title', 'traits'],
  },
}))

describe('StatusPage', () => {
  const mockConfig: Config = {
    version: '1.0.0',
    phase: '测试阶段',
    home: {
      title: '伊甸园系统',
      subtitle: '互动式故事游戏',
    },
    status: {
      title: '角色状态',
      tabs: {
        player: { id: 'player', name: '玩家', icon: 'fa-user' },
        companion: { id: 'companion', name: '同伴', icon: 'fa-users' },
      },
    },
  }

  const mockCharacters = {
    player: {
      name: '玩家',
      details: {
        type: 'details' as const,
        title: '基本信息',
        content: {
          name: { key: 'name', label: '姓名', value: '玩家' },
          level: { key: 'level', label: '等级', value: '10' },
        },
      },
      stats: {
        type: 'progress_bars' as const,
        title: '属性',
        content: {
          hp: { current: 80, max: 100, description: 'HP', barClass: 'hp-bar' },
        },
      },
    },
    companion: {
      name: '同伴',
      details: {
        type: 'details' as const,
        title: '同伴信息',
        content: {
          name: { key: 'name', label: '姓名', value: '同伴' },
          level: { key: 'level', label: '等级', value: '8' },
        },
      },
    },
  }

  beforeEach(() => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  describe('渲染测试', () => {
    it('应该渲染状态页面容器', () => {
      const wrapper = mount(StatusPage)

      expect(wrapper.find('.page-status').exists()).toBe(true)
    })

    it('应该渲染页面标题', () => {
      const wrapper = mount(StatusPage, {
        props: { config: mockConfig },
      })

      const title = wrapper.find('.status-header h2')
      expect(title.exists()).toBe(true)
      expect(title.text()).toBe('角色状态')
    })

    it('应该渲染 StatusSidebar', () => {
      const wrapper = mount(StatusPage, {
        props: { config: mockConfig },
      })

      expect(wrapper.find('.status-sidebar-mock').exists()).toBe(true)
    })

    it('应该渲染状态布局', () => {
      const wrapper = mount(StatusPage)

      expect(wrapper.find('.status-layout').exists()).toBe(true)
      expect(wrapper.find('.status-main').exists()).toBe(true)
    })

    it('应该渲染移动端切换按钮', () => {
      const wrapper = mount(StatusPage)

      const toggleBtn = wrapper.find('.sidebar-toggle-mobile-header')
      expect(toggleBtn.exists()).toBe(true)
    })
  })

  describe('Props 测试', () => {
    it('应该接受 config prop', () => {
      const wrapper = mount(StatusPage, {
        props: { config: mockConfig },
      })

      expect(wrapper.props('config')).toEqual(mockConfig)
    })

    it('应该接受 characters prop', () => {
      const wrapper = mount(StatusPage, {
        props: { characters: mockCharacters },
      })

      expect(wrapper.props('characters')).toEqual(mockCharacters)
    })

    it('characters 应该有默认值', () => {
      const wrapper = mount(StatusPage)

      expect(wrapper.props('characters')).toEqual({})
    })
  })

  describe('标签页测试', () => {
    it('应该显示标签页内容', () => {
      const wrapper = mount(StatusPage, {
        props: {
          config: mockConfig,
          characters: mockCharacters,
        },
      })

      const contents = wrapper.findAll('.status-content')
      expect(contents.length).toBeGreaterThan(0)
    })

    it('应该有激活的标签页', () => {
      const wrapper = mount(StatusPage, {
        props: {
          config: mockConfig,
          characters: mockCharacters,
        },
      })

      const activeContent = wrapper.find('.status-content.active')
      expect(activeContent.exists()).toBe(true)
    })

    it('没有数据时应该显示暂无数据', () => {
      const wrapper = mount(StatusPage, {
        props: {
          config: mockConfig,
          characters: {},
        },
      })

      const noData = wrapper.find('.no-data')
      expect(noData.exists()).toBe(true)
      expect(noData.text()).toBe('暂无数据')
    })
  })

  describe('侧边栏交互测试', () => {
    it('应该切换侧边栏状态', async () => {
      const wrapper = mount(StatusPage, {
        props: { config: mockConfig },
      })

      const toggleBtn = wrapper.find('.sidebar-toggle-mobile-header')
      await toggleBtn.trigger('click')

      // 侧边栏状态应该改变
      expect(wrapper.vm.isSidebarCollapsed).toBeDefined()
    })

    it('切换按钮应该显示正确的图标', () => {
      const wrapper = mount(StatusPage)

      const icon = wrapper.find('.sidebar-toggle-mobile-header i')
      expect(icon.exists()).toBe(true)
      expect(icon.classes()).toContain('fas')
    })
  })

  describe('可访问性测试', () => {
    it('应该有页面标题 ID', () => {
      const wrapper = mount(StatusPage, {
        props: { config: mockConfig },
      })

      const title = wrapper.find('#page-title')
      expect(title.exists()).toBe(true)
    })

    it('切换按钮应该有 aria-label', () => {
      const wrapper = mount(StatusPage)

      const toggleBtn = wrapper.find('.sidebar-toggle-mobile-header')
      expect(toggleBtn.attributes('aria-label')).toBe('切换侧边栏')
    })
  })

  describe('响应式测试', () => {
    it('桌面端侧边栏应该默认展开', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      })

      const wrapper = mount(StatusPage)

      expect(wrapper.vm.isSidebarCollapsed).toBe(false)
    })

    it('移动端侧边栏应该默认收起', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      })

      const wrapper = mount(StatusPage)

      expect(wrapper.vm.isSidebarCollapsed).toBe(true)
    })
  })
})
