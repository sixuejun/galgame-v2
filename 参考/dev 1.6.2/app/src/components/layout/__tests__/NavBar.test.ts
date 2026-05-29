import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import NavBar from '../NavBar.vue'
import NavButton from '../NavBar/NavButton.vue'
import { DEFAULT_NAV_BUTTONS } from '../../../constants'

// Mock useFullscreen composable
let mockIsFullscreen = false
let mockIsInIframeEnv = false
const mockToggleFullscreen = vi.fn()

vi.mock('../../../composables/ui/useFullscreen', () => ({
  useFullscreen: () => ({
    isFullscreen: { value: mockIsFullscreen },
    toggleFullscreen: mockToggleFullscreen,
    isInIframeEnv: mockIsInIframeEnv,
  }),
}))

describe('NavBar', () => {
  const defaultProps = {
    currentPage: 'home',
    phase: '渗透期',
  }

  const createWrapper = (props = {}) => {
    return mount(NavBar, {
      props: { ...defaultProps, ...props },
      global: {
        plugins: [createPinia()],
      },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockIsFullscreen = false
    mockIsInIframeEnv = false
  })

  describe('渲染测试', () => {
    it('应该渲染导航栏', () => {
      const wrapper = createWrapper()

      expect(wrapper.find('.nav-bar').exists()).toBe(true)
    })

    it('应该渲染所有默认导航按钮', () => {
      const wrapper = createWrapper()

      const navButtons = wrapper.findAllComponents(NavButton)
      expect(navButtons).toHaveLength(Object.keys(DEFAULT_NAV_BUTTONS).length)
    })

    it('应该渲染存档按钮', () => {
      const wrapper = createWrapper()

      const saveBtn = wrapper.find('.save-btn')
      expect(saveBtn.exists()).toBe(true)
      expect(saveBtn.text()).toContain('存档')
    })

    it('应该渲染读档按钮', () => {
      const wrapper = createWrapper()

      const loadBtn = wrapper.find('.load-btn')
      expect(loadBtn.exists()).toBe(true)
      expect(loadBtn.text()).toContain('读档')
    })

    it('应该渲染全屏按钮', () => {
      const wrapper = createWrapper()

      const fullscreenBtn = wrapper.find('.fullscreen-btn')
      expect(fullscreenBtn.exists()).toBe(true)
      // 全屏按钮应该包含文本（全屏或退出）
      expect(fullscreenBtn.text().length).toBeGreaterThan(0)
    })

    it('应该渲染阶段指示器', () => {
      const wrapper = createWrapper()

      const phaseIndicator = wrapper.find('.phase-indicator')
      expect(phaseIndicator.exists()).toBe(true)
      expect(phaseIndicator.text()).toBe('渗透期')
    })
  })

  describe('Props 测试', () => {
    it('应该正确显示当前页面', () => {
      const wrapper = createWrapper({ currentPage: 'shop' })

      const navButtons = wrapper.findAllComponents(NavButton)
      const shopButton = navButtons.find(btn => btn.props('name') === '购物')

      expect(shopButton?.props('isActive')).toBe(true)
    })

    it('应该正确显示阶段', () => {
      const wrapper = createWrapper({ phase: '测试阶段' })

      expect(wrapper.find('.phase-indicator').text()).toBe('测试阶段')
    })

    it('应该使用自定义导航按钮配置', () => {
      const wrapper = createWrapper({
        navButtons: {
          home: {
            name: '自定义主页',
            icon: 'fa-custom',
          },
        },
      })

      const navButtons = wrapper.findAllComponents(NavButton)
      const homeButton = navButtons[0]

      expect(homeButton.props('name')).toBe('自定义主页')
      expect(homeButton.props('icon')).toBe('fa-custom')
    })

    it('应该合并默认配置和自定义配置', () => {
      const wrapper = createWrapper({
        navButtons: {
          home: {
            name: '自定义主页',
          },
        },
      })

      const navButtons = wrapper.findAllComponents(NavButton)
      const homeButton = navButtons[0]

      // 使用自定义 name
      expect(homeButton.props('name')).toBe('自定义主页')
      // 使用默认 icon
      expect(homeButton.props('icon')).toBe('fa-home')
    })
  })

  describe('事件测试', () => {
    it('点击导航按钮应该触发 navigate 事件', async () => {
      const wrapper = createWrapper()

      const navButtons = wrapper.findAllComponents(NavButton)
      await navButtons[0].trigger('click')

      expect(wrapper.emitted('navigate')).toBeTruthy()
      expect(wrapper.emitted('navigate')?.[0]).toEqual(['home'])
    })

    it('点击存档按钮应该触发 save 事件', async () => {
      const wrapper = createWrapper()

      await wrapper.find('.save-btn').trigger('click')

      expect(wrapper.emitted('save')).toBeTruthy()
    })

    it('点击读档按钮应该触发 load 事件', async () => {
      const wrapper = createWrapper()

      await wrapper.find('.load-btn').trigger('click')

      expect(wrapper.emitted('load')).toBeTruthy()
    })

    it('点击全屏按钮应该调用 toggleFullscreen', async () => {
      const wrapper = createWrapper()

      await wrapper.find('.fullscreen-btn').trigger('click')

      expect(mockToggleFullscreen).toHaveBeenCalled()
    })
  })

  describe('全屏状态测试', () => {
    it('全屏按钮应该有图标', () => {
      const wrapper = createWrapper()

      const fullscreenBtn = wrapper.find('.fullscreen-btn')
      const icon = fullscreenBtn.find('i.fas')
      expect(icon.exists()).toBe(true)
      // 应该有 expand 或 compress 图标之一
      const hasIcon = icon.classes().includes('fa-expand') || icon.classes().includes('fa-compress')
      expect(hasIcon).toBe(true)
    })
  })

  describe('可访问性测试', () => {
    it('存档按钮应该有正确的 aria-label', () => {
      const wrapper = createWrapper()

      const saveBtn = wrapper.find('.save-btn')
      expect(saveBtn.attributes('aria-label')).toBe('手动存档')
    })

    it('读档按钮应该有正确的 aria-label', () => {
      const wrapper = createWrapper()

      const loadBtn = wrapper.find('.load-btn')
      expect(loadBtn.attributes('aria-label')).toBe('读取存档')
    })

    it('全屏按钮应该有 aria-label', () => {
      const wrapper = createWrapper()

      const fullscreenBtn = wrapper.find('.fullscreen-btn')
      const ariaLabel = fullscreenBtn.attributes('aria-label')
      expect(ariaLabel).toBeDefined()
      expect(ariaLabel?.length).toBeGreaterThan(0)
    })

    it('阶段指示器应该有正确的 ARIA 属性', () => {
      const wrapper = createWrapper()

      const phaseIndicator = wrapper.find('.phase-indicator')
      expect(phaseIndicator.attributes('role')).toBe('status')
      expect(phaseIndicator.attributes('aria-live')).toBe('polite')
      expect(phaseIndicator.attributes('aria-label')).toBe('当前游戏阶段')
    })
  })

  describe('响应式测试', () => {
    it('阶段变化时应该更新显示', async () => {
      const wrapper = createWrapper()

      await wrapper.setProps({ phase: '新阶段' })

      expect(wrapper.find('.phase-indicator').text()).toBe('新阶段')
    })

    it('当前页面变化时应该更新激活状态', async () => {
      const wrapper = createWrapper()

      await wrapper.setProps({ currentPage: 'shop' })

      const navButtons = wrapper.findAllComponents(NavButton)
      const shopButton = navButtons.find(btn => btn.props('name') === '购物')

      expect(shopButton?.props('isActive')).toBe(true)
    })
  })
})
