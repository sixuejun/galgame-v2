import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PageRouter from '../PageRouter.vue'
import type { Config, Story, Choice, Character } from '../../../types'

// Mock environment utils
vi.mock('../../../utils/environment', () => ({
  getScrollStrategy: vi.fn(() => 'fixed'),
  watchFullscreenChange: vi.fn(() => vi.fn()),
}))

// Mock child components
vi.mock('../../pages/HomePage.vue', () => ({
  default: {
    name: 'HomePage',
    props: ['config', 'story', 'choices'],
    template: '<div class="home-page">Home Page</div>',
  },
}))

vi.mock('../../pages/StatusPage.vue', () => ({
  default: {
    name: 'StatusPage',
    props: ['config', 'characters'],
    template: '<div class="status-page">Status Page</div>',
  },
}))

vi.mock('../../pages/ShopPage.vue', () => ({
  default: {
    name: 'ShopPage',
    props: ['config', 'shop'],
    template: '<div class="shop-page">Shop Page</div>',
  },
}))

vi.mock('../../pages/CartPage.vue', () => ({
  default: {
    name: 'CartPage',
    props: ['config', 'shop'],
    template: '<div class="cart-page">Cart Page</div>',
  },
}))

vi.mock('../../pages/StoragePage.vue', () => ({
  default: {
    name: 'StoragePage',
    props: ['config', 'storage'],
    template: '<div class="storage-page">Storage Page</div>',
  },
}))

vi.mock('../../pages/AchievementsPage.vue', () => ({
  default: {
    name: 'AchievementsPage',
    props: ['config', 'achievements'],
    template: '<div class="achievements-page">Achievements Page</div>',
  },
}))

vi.mock('../../pages/ReviewPage.vue', () => ({
  default: {
    name: 'ReviewPage',
    props: ['config', 'summaries'],
    template: '<div class="review-page">Review Page</div>',
  },
}))

vi.mock('../../pages/SettingsPage.vue', () => ({
  default: {
    name: 'SettingsPage',
    props: ['config'],
    template: '<div class="settings-page">Settings Page</div>',
  },
}))

vi.mock('../../pages/LoadGamePage.vue', () => ({
  default: {
    name: 'LoadGamePage',
    template: '<div class="load-game-page">Load Game Page</div>',
  },
}))

describe('PageRouter', () => {
  const createMockConfig = (): Config => ({
    version: '1.0.0',
    phase: 'test',
    home: {
      title: 'Test Game',
      subtitle: 'Test Subtitle',
    },
  })

  const createMockStory = (): Story => ({
    content: 'Test story content',
  })

  const createMockChoices = (): Choice[] => [{ text: 'Choice 1' }, { text: 'Choice 2' }]

  const createMockCharacters = (): Record<string, Character> => ({
    char1: {
      name: 'Character 1',
    },
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('渲染测试', () => {
    it('应该正确渲染组件', () => {
      const wrapper = mount(PageRouter, {
        props: {
          currentPage: 'home',
          config: createMockConfig(),
        },
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.page-router-container').exists()).toBe(true)
    })

    it('应该渲染所有页面区块', () => {
      const wrapper = mount(PageRouter, {
        props: {
          currentPage: 'home',
          config: createMockConfig(),
        },
      })

      const sections = wrapper.findAll('section.page')
      expect(sections).toHaveLength(9) // 9个页面
    })

    it('应该为当前页面添加 active 类', () => {
      const wrapper = mount(PageRouter, {
        props: {
          currentPage: 'home',
          config: createMockConfig(),
        },
      })

      const activePage = wrapper.find('section.page.active')
      expect(activePage.exists()).toBe(true)
      expect(activePage.attributes('aria-label')).toBe('主页')
    })

    it('应该根据 currentPage 切换活动页面', async () => {
      const wrapper = mount(PageRouter, {
        props: {
          currentPage: 'home',
          config: createMockConfig(),
        },
      })

      // 初始状态：主页激活
      let activePage = wrapper.find('section.page.active')
      expect(activePage.attributes('aria-label')).toBe('主页')

      // 切换到状态页
      await wrapper.setProps({ currentPage: 'status' })
      activePage = wrapper.find('section.page.active')
      expect(activePage.attributes('aria-label')).toBe('状态页')

      // 切换到商店页
      await wrapper.setProps({ currentPage: 'shop' })
      activePage = wrapper.find('section.page.active')
      expect(activePage.attributes('aria-label')).toBe('商店页')
    })
  })

  describe('滚动策略测试', () => {
    it('应该应用默认的滚动策略类', () => {
      const wrapper = mount(PageRouter, {
        props: {
          currentPage: 'home',
          config: createMockConfig(),
        },
      })

      const container = wrapper.find('.page-router-container')
      expect(container.classes()).toContain('scroll-fixed')
    })
  })

  describe('事件处理测试', () => {
    it('应该正确传递 choose 事件', async () => {
      const wrapper = mount(PageRouter, {
        props: {
          currentPage: 'home',
          config: createMockConfig(),
          story: createMockStory(),
          choices: createMockChoices(),
        },
      })

      // 触发 HomePage 的 choose 事件
      const homePage = wrapper.findComponent({ name: 'HomePage' })
      await homePage.vm.$emit('choose', 'choice1')

      // 验证事件被正确传递
      expect(wrapper.emitted('choose')).toBeTruthy()
      expect(wrapper.emitted('choose')?.[0]).toEqual(['choice1'])
    })

    it('应该正确传递 loadSave 事件', async () => {
      const wrapper = mount(PageRouter, {
        props: {
          currentPage: 'load',
          config: createMockConfig(),
        },
      })

      // 触发 LoadGamePage 的 load 事件
      const loadGamePage = wrapper.findComponent({ name: 'LoadGamePage' })
      await loadGamePage.vm.$emit('load', 'save_001')

      // 验证事件被正确传递
      expect(wrapper.emitted('loadSave')).toBeTruthy()
      expect(wrapper.emitted('loadSave')?.[0]).toEqual(['save_001'])
    })

    it('应该正确传递 deleteSave 事件', async () => {
      const wrapper = mount(PageRouter, {
        props: {
          currentPage: 'load',
          config: createMockConfig(),
        },
      })

      // 触发 LoadGamePage 的 delete 事件
      const loadGamePage = wrapper.findComponent({ name: 'LoadGamePage' })
      await loadGamePage.vm.$emit('delete', 'save_001')

      // 验证事件被正确传递
      expect(wrapper.emitted('deleteSave')).toBeTruthy()
      expect(wrapper.emitted('deleteSave')?.[0]).toEqual(['save_001'])
    })

    it('应该正确传递 importSave 事件', async () => {
      const wrapper = mount(PageRouter, {
        props: {
          currentPage: 'load',
          config: createMockConfig(),
        },
      })

      const yamlContent = 'gameData:\n  config:\n    title: Test'

      // 触发 LoadGamePage 的 import 事件
      const loadGamePage = wrapper.findComponent({ name: 'LoadGamePage' })
      await loadGamePage.vm.$emit('import', yamlContent)

      // 验证事件被正确传递
      expect(wrapper.emitted('importSave')).toBeTruthy()
      expect(wrapper.emitted('importSave')?.[0]).toEqual([yamlContent])
    })

    it('应该正确传递 clearAllSaves 事件', async () => {
      const wrapper = mount(PageRouter, {
        props: {
          currentPage: 'load',
          config: createMockConfig(),
        },
      })

      // 触发 LoadGamePage 的 clear-all 事件
      const loadGamePage = wrapper.findComponent({ name: 'LoadGamePage' })
      await loadGamePage.vm.$emit('clear-all')

      // 验证事件被正确传递
      expect(wrapper.emitted('clearAllSaves')).toBeTruthy()
      expect(wrapper.emitted('clearAllSaves')).toHaveLength(1)
    })
  })

  describe('Props 传递测试', () => {
    it('应该正确传递 config 到所有页面', () => {
      const config = createMockConfig()
      const wrapper = mount(PageRouter, {
        props: {
          currentPage: 'home',
          config,
        },
      })

      const homePage = wrapper.findComponent({ name: 'HomePage' })
      expect(homePage.props('config')).toEqual(config)
    })

    it('应该正确传递 story 和 choices 到 HomePage', () => {
      const story = createMockStory()
      const choices = createMockChoices()
      const wrapper = mount(PageRouter, {
        props: {
          currentPage: 'home',
          config: createMockConfig(),
          story,
          choices,
        },
      })

      const homePage = wrapper.findComponent({ name: 'HomePage' })
      expect(homePage.props('story')).toEqual(story)
      expect(homePage.props('choices')).toEqual(choices)
    })

    it('应该正确传递 characters 到 StatusPage', () => {
      const characters = createMockCharacters()
      const wrapper = mount(PageRouter, {
        props: {
          currentPage: 'status',
          config: createMockConfig(),
          characters,
        },
      })

      const statusPage = wrapper.findComponent({ name: 'StatusPage' })
      expect(statusPage.props('characters')).toEqual(characters)
    })
  })

  describe('Expose 测试', () => {
    it('应该暴露 reviewPageRef', () => {
      const wrapper = mount(PageRouter, {
        props: {
          currentPage: 'home',
          config: createMockConfig(),
        },
      })

      expect(wrapper.vm.reviewPageRef).toBeDefined()
    })

    it('应该暴露 loadGamePageRef', () => {
      const wrapper = mount(PageRouter, {
        props: {
          currentPage: 'home',
          config: createMockConfig(),
        },
      })

      expect(wrapper.vm.loadGamePageRef).toBeDefined()
    })
  })
})
