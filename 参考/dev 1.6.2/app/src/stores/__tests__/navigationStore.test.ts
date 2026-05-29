import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNavigationStore } from '../navigationStore'

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('useNavigationStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('初始化', () => {
    it('应该初始化为主页', () => {
      const store = useNavigationStore()
      expect(store.currentPage).toBe('home')
    })
  })

  describe('navigateTo', () => {
    it('应该切换到指定页面', () => {
      const store = useNavigationStore()

      store.navigateTo('game')
      expect(store.currentPage).toBe('game')

      store.navigateTo('status')
      expect(store.currentPage).toBe('status')
    })

    it('应该在导航时调用scrollToTop', () => {
      const store = useNavigationStore()

      // 创建模拟的 DOM 结构来验证scrollToTop被调用
      const activePage = document.createElement('div')
      activePage.className = 'page active'
      const pageTitle = document.createElement('h1')
      pageTitle.id = 'page-title'
      pageTitle.scrollIntoView = vi.fn()
      activePage.appendChild(pageTitle)
      document.body.appendChild(activePage)

      store.navigateTo('shop')

      // 验证scrollIntoView被调用,说明scrollToTop被执行了
      expect(pageTitle.scrollIntoView).toHaveBeenCalled()

      // 清理
      document.body.removeChild(activePage)
    })
  })

  describe('scrollToTop', () => {
    it('应该滚动到页面标题', () => {
      const store = useNavigationStore()

      // 创建模拟的 DOM 结构
      const activePage = document.createElement('div')
      activePage.className = 'page active'

      const pageTitle = document.createElement('h1')
      pageTitle.id = 'page-title'
      pageTitle.scrollIntoView = vi.fn()

      activePage.appendChild(pageTitle)
      document.body.appendChild(activePage)

      store.scrollToTop()

      expect(pageTitle.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      })

      // 清理
      document.body.removeChild(activePage)
    })

    it('当找不到页面标题时应该记录警告', async () => {
      const store = useNavigationStore()
      const { logger } = await import('../../utils/logger')

      // 创建没有标题的活动页面
      const activePage = document.createElement('div')
      activePage.className = 'page active'
      document.body.appendChild(activePage)

      store.scrollToTop()

      expect(logger.warn).toHaveBeenCalledWith('未找到当前页面的标题元素 #page-title')

      // 清理
      document.body.removeChild(activePage)
    })

    it('当找不到活动页面时应该记录警告', async () => {
      const store = useNavigationStore()
      const { logger } = await import('../../utils/logger')

      store.scrollToTop()

      expect(logger.warn).toHaveBeenCalledWith('未找到活动页面 .page.active')
    })
  })

  describe('$reset', () => {
    it('应该重置到初始状态', () => {
      const store = useNavigationStore()

      // 修改状态
      store.navigateTo('game')
      expect(store.currentPage).toBe('game')

      // 重置
      store.$reset()

      // 验证状态被重置
      expect(store.currentPage).toBe('home')
    })

    it('应该记录重置日志', async () => {
      const store = useNavigationStore()
      const { logger } = await import('../../utils/logger')

      store.$reset()

      expect(logger.info).toHaveBeenCalledWith('🔄 navigationStore 已重置到初始状态')
    })
  })
})
