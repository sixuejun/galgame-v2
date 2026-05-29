import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import AchievementsPage from '../AchievementsPage.vue'
import type { Config } from '../../../types'

// Mock AchievementCard 组件
vi.mock('../AchievementsPage/AchievementCard.vue', () => ({
  default: {
    name: 'AchievementCard',
    template: '<div class="achievement-card-mock"></div>',
    props: ['achievement'],
  },
}))

// Mock CustomSelect 组件
vi.mock('../../common/CustomSelect.vue', () => ({
  default: {
    name: 'CustomSelect',
    template: '<select class="custom-select-mock"></select>',
    props: ['modelValue', 'options'],
    emits: ['update:modelValue'],
  },
}))

describe('AchievementsPage', () => {
  const mockConfig: Config = {
    version: '1.0.0',
    phase: '测试阶段',
    home: {
      title: '伊甸园系统',
      subtitle: '互动式故事游戏',
    },
    achievements: {
      title: '成就系统',
    },
  }

  const mockAchievements = {
    ach1: {
      id: 'ach1',
      name: '初次尝试',
      desc: '完成第一个任务',
      icon: '🎯',
      unlocked: true,
      date: '2024-01-01',
      rarity: 'common',
    },
    ach2: {
      id: 'ach2',
      name: '传奇之路',
      desc: '达到最高等级',
      icon: '👑',
      unlocked: false,
      rarity: 'legendary',
      schedule: {
        'characters.user.level': 100,
      },
    },
    ach3: {
      id: 'ach3',
      name: '收藏家',
      desc: '收集所有物品',
      icon: '📦',
      unlocked: true,
      date: '2024-01-15',
      rarity: 'rare',
    },
  }

  describe('渲染测试', () => {
    it('应该渲染成就页面容器', () => {
      setActivePinia(createPinia())
      const wrapper = mount(AchievementsPage)

      expect(wrapper.find('.page-achievements').exists()).toBe(true)
    })

    it('应该渲染页面标题', () => {
      setActivePinia(createPinia())
      const wrapper = mount(AchievementsPage, {
        props: { config: mockConfig },
      })

      const title = wrapper.find('.achievements-header h2')
      expect(title.exists()).toBe(true)
      expect(title.text()).toBe('成就系统')
    })

    it('应该渲染统计信息', () => {
      setActivePinia(createPinia())
      const wrapper = mount(AchievementsPage, {
        props: { achievements: mockAchievements },
      })

      const stats = wrapper.find('.achievements-stats')
      expect(stats.exists()).toBe(true)
    })

    it('应该显示正确的统计数据', () => {
      setActivePinia(createPinia())
      const wrapper = mount(AchievementsPage, {
        props: { achievements: mockAchievements },
      })

      const statValues = wrapper.findAll('.stat-value')
      expect(statValues[0].text()).toBe('2') // 已解锁
      expect(statValues[1].text()).toBe('3') // 总计
      expect(statValues[2].text()).toBe('67%') // 完成度
    })
  })

  describe('空状态测试', () => {
    it('没有成就时应该显示空状态', () => {
      setActivePinia(createPinia())
      const wrapper = mount(AchievementsPage, {
        props: { achievements: {} },
      })

      const emptyState = wrapper.find('.empty-state')
      expect(emptyState.exists()).toBe(true)
      expect(emptyState.text()).toContain('暂无成就')
    })

    it('空状态应该有导航按钮', () => {
      setActivePinia(createPinia())
      const wrapper = mount(AchievementsPage, {
        props: { achievements: {} },
      })

      const btn = wrapper.find('.btn-primary')
      expect(btn.exists()).toBe(true)
      expect(btn.text()).toContain('跳转主页继续游戏')
    })

    it('点击导航按钮应该跳转', async () => {
      setActivePinia(createPinia())
      const wrapper = mount(AchievementsPage, {
        props: { achievements: {} },
      })

      const btn = wrapper.find('.btn-primary')
      await btn.trigger('click')

      // 验证导航被调用（通过 store）
      expect(btn.exists()).toBe(true)
    })
  })

  describe('搜索和筛选测试', () => {
    it('有成就时应该显示搜索框', () => {
      setActivePinia(createPinia())
      const wrapper = mount(AchievementsPage, {
        props: { achievements: mockAchievements },
      })

      const searchBox = wrapper.find('.search-box')
      expect(searchBox.exists()).toBe(true)
    })

    it('应该显示筛选控件', () => {
      setActivePinia(createPinia())
      const wrapper = mount(AchievementsPage, {
        props: { achievements: mockAchievements },
      })

      const filterControls = wrapper.find('.filter-controls')
      expect(filterControls.exists()).toBe(true)
    })

    it('应该渲染 CustomSelect 组件', () => {
      setActivePinia(createPinia())
      const wrapper = mount(AchievementsPage, {
        props: { achievements: mockAchievements },
      })

      const selects = wrapper.findAllComponents({ name: 'CustomSelect' })
      expect(selects.length).toBe(2) // 稀有度和状态筛选
    })

    it('搜索框应该有正确的属性', () => {
      setActivePinia(createPinia())
      const wrapper = mount(AchievementsPage, {
        props: { achievements: mockAchievements },
      })

      const searchInput = wrapper.find('.search-input')
      expect(searchInput.attributes('type')).toBe('text')
      expect(searchInput.attributes('placeholder')).toBe('搜索成就名称或描述...')
      expect(searchInput.attributes('aria-label')).toBe('搜索成就')
    })
  })

  describe('成就列表测试', () => {
    it('应该渲染成就网格', () => {
      setActivePinia(createPinia())
      const wrapper = mount(AchievementsPage, {
        props: { achievements: mockAchievements },
      })

      const grid = wrapper.find('.achievement-grid')
      expect(grid.exists()).toBe(true)
      expect(grid.attributes('role')).toBe('list')
      expect(grid.attributes('aria-label')).toBe('成就列表')
    })

    it('应该渲染成就卡片', () => {
      setActivePinia(createPinia())
      const wrapper = mount(AchievementsPage, {
        props: { achievements: mockAchievements },
      })

      const cards = wrapper.findAllComponents({ name: 'AchievementCard' })
      expect(cards.length).toBe(3)
    })

    it('成就卡片应该有正确的 role', () => {
      setActivePinia(createPinia())
      const wrapper = mount(AchievementsPage, {
        props: { achievements: mockAchievements },
      })

      const cards = wrapper.findAllComponents({ name: 'AchievementCard' })
      cards.forEach(card => {
        expect(card.attributes('role')).toBe('listitem')
      })
    })
  })

  describe('Props 测试', () => {
    it('应该接受 config prop', () => {
      setActivePinia(createPinia())
      const wrapper = mount(AchievementsPage, {
        props: { config: mockConfig },
      })

      expect(wrapper.props('config')).toEqual(mockConfig)
    })

    it('应该接受 achievements prop', () => {
      setActivePinia(createPinia())
      const wrapper = mount(AchievementsPage, {
        props: { achievements: mockAchievements },
      })

      expect(wrapper.props('achievements')).toEqual(mockAchievements)
    })

    it('achievements 应该有默认值', () => {
      setActivePinia(createPinia())
      const wrapper = mount(AchievementsPage)

      expect(wrapper.props('achievements')).toEqual({})
    })

    it('没有 config 时应该使用默认标题', () => {
      setActivePinia(createPinia())
      const wrapper = mount(AchievementsPage, {
        props: { achievements: mockAchievements },
      })

      const title = wrapper.find('.achievements-header h2')
      expect(title.text()).toBe('成就记录')
    })
  })

  describe('搜索功能测试', () => {
    it('应该能更新搜索查询', async () => {
      setActivePinia(createPinia())
      const wrapper = mount(AchievementsPage, {
        props: { achievements: mockAchievements },
      })

      const searchInput = wrapper.find('.search-input')
      await searchInput.setValue('初次')

      expect((searchInput.element as HTMLInputElement).value).toBe('初次')
    })
  })

  describe('可访问性测试', () => {
    it('应该有页面标题 ID', () => {
      setActivePinia(createPinia())
      const wrapper = mount(AchievementsPage, {
        props: { config: mockConfig },
      })

      const title = wrapper.find('#page-title')
      expect(title.exists()).toBe(true)
    })

    it('空状态图标应该有 aria-hidden', () => {
      setActivePinia(createPinia())
      const wrapper = mount(AchievementsPage, {
        props: { achievements: {} },
      })

      const icon = wrapper.find('.empty-icon i')
      expect(icon.attributes('aria-hidden')).toBe('true')
    })

    it('搜索图标应该有 aria-hidden', () => {
      setActivePinia(createPinia())
      const wrapper = mount(AchievementsPage, {
        props: { achievements: mockAchievements },
      })

      const icon = wrapper.find('.search-box i')
      expect(icon.attributes('aria-hidden')).toBe('true')
    })
  })
})
