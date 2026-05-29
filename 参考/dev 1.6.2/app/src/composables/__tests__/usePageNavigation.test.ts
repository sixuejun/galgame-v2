import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePageNavigation } from '../ui/usePageNavigation'
import { useNavigationStore } from '../../stores/navigationStore'

describe('usePageNavigation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('currentPage', () => {
    it('应该返回当前页面', () => {
      const { currentPage } = usePageNavigation()

      expect(currentPage.value).toBe('home')
    })

    it('应该响应 navigationStore 的页面变化', () => {
      const { currentPage } = usePageNavigation()
      const navigationStore = useNavigationStore()

      navigationStore.navigateTo('status')
      expect(currentPage.value).toBe('status')

      navigationStore.navigateTo('shop')
      expect(currentPage.value).toBe('shop')
    })
  })

  describe('navigateTo', () => {
    it('应该导航到指定页面', () => {
      const { navigateTo, currentPage } = usePageNavigation()

      navigateTo('status')
      expect(currentPage.value).toBe('status')
    })

    it('应该支持导航到所有页面', () => {
      const { navigateTo, currentPage } = usePageNavigation()
      const pages = [
        'home',
        'status',
        'shop',
        'cart',
        'storage',
        'achievements',
        'review',
        'settings',
        'load',
      ]

      pages.forEach(page => {
        navigateTo(page)
        expect(currentPage.value).toBe(page)
      })
    })

    it('应该更新 navigationStore 的状态', () => {
      const { navigateTo } = usePageNavigation()
      const navigationStore = useNavigationStore()

      navigateTo('shop')
      expect(navigationStore.currentPage).toBe('shop')
    })
  })

  describe('scrollToTop', () => {
    it('应该调用 scrollToTop 方法而不报错', () => {
      const { scrollToTop } = usePageNavigation()

      // scrollToTop 会尝试查找 DOM 元素，在测试环境中可能找不到
      // 但不应该抛出错误
      expect(() => scrollToTop()).not.toThrow()
    })

    it('应该能够多次调用', () => {
      const { scrollToTop } = usePageNavigation()

      expect(() => {
        scrollToTop()
        scrollToTop()
        scrollToTop()
      }).not.toThrow()
    })
  })

  describe('状态共享', () => {
    it('多次调用 usePageNavigation 应该返回相同的状态', () => {
      const nav1 = usePageNavigation()
      const nav2 = usePageNavigation()

      nav1.navigateTo('status')

      expect(nav2.currentPage.value).toBe('status')
    })

    it('一个实例的操作应该影响另一个实例', () => {
      const nav1 = usePageNavigation()
      const nav2 = usePageNavigation()

      nav1.navigateTo('shop')
      expect(nav2.currentPage.value).toBe('shop')

      nav2.navigateTo('storage')
      expect(nav1.currentPage.value).toBe('storage')
    })
  })

  describe('与 navigationStore 的集成', () => {
    it('应该使用相同的 navigationStore 实例', () => {
      const { navigateTo, currentPage } = usePageNavigation()
      const navigationStore = useNavigationStore()

      navigateTo('achievements')
      expect(currentPage.value).toBe('achievements')
      expect(navigationStore.currentPage).toBe('achievements')
    })

    it('直接修改 navigationStore 应该反映到 currentPage', () => {
      const { currentPage } = usePageNavigation()
      const navigationStore = useNavigationStore()

      navigationStore.navigateTo('review')
      expect(currentPage.value).toBe('review')
    })
  })
})
