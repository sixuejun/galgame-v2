import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import ShopPage from '../ShopPage.vue'
import type { Config, ShopData } from '../../../types'

// Mock 子组件
vi.mock('../ShopPage/ShopHeader.vue', () => ({
  default: {
    name: 'ShopHeader',
    template: '<div class="shop-header-mock"></div>',
    props: ['pageTitle', 'currency', 'totalItems', 'cartItemsCount', 'isLoading'],
    emits: ['navigate-to-cart'],
  },
}))

vi.mock('../ShopPage/ShopEmptyState.vue', () => ({
  default: {
    name: 'ShopEmptyState',
    template: '<div class="shop-empty-state-mock">空状态</div>',
  },
}))

vi.mock('../ShopPage/ShopFilters.vue', () => ({
  default: {
    name: 'ShopFilters',
    template: '<div class="shop-filters-mock"></div>',
    props: ['searchQuery', 'filterCategory', 'sortBy', 'categoryOptions', 'sortOptions'],
    emits: ['update:searchQuery', 'update:filterCategory', 'update:sortBy'],
  },
}))

vi.mock('../ShopPage/ShopItemGrid.vue', () => ({
  default: {
    name: 'ShopItemGrid',
    template: '<div class="shop-item-grid-mock"></div>',
    props: ['paginatedItems'],
    emits: ['buy', 'add-to-cart'],
  },
}))

vi.mock('../ShopPage/ShopPagination.vue', () => ({
  default: {
    name: 'ShopPagination',
    template: '<div class="shop-pagination-mock"></div>',
    props: ['currentPage', 'totalPages', 'isFirstPage', 'isLastPage'],
    emits: ['prev-page', 'next-page'],
  },
}))

vi.mock('../../common/SkeletonCard.vue', () => ({
  default: {
    name: 'SkeletonCard',
    template: '<div class="skeleton-card-mock"></div>',
  },
}))

// Mock composables
const mockBuyItem = vi.fn()
const mockAddToCart = vi.fn()
const mockNavigateTo = vi.fn()
const mockSuccess = vi.fn()

vi.mock('../../../composables/shop/useShop', () => ({
  useShop: () => ({
    buyItem: mockBuyItem,
  }),
}))

vi.mock('../../../composables/shop/useShoppingCart', () => ({
  useShoppingCart: () => ({
    addToCart: mockAddToCart,
    cartItemsCount: { value: 3 },
  }),
}))

vi.mock('../../../composables/ui/usePageNavigation', () => ({
  usePageNavigation: () => ({
    navigateTo: mockNavigateTo,
  }),
}))

vi.mock('../../../composables/ui/useToast', () => ({
  useToast: () => ({
    success: mockSuccess,
  }),
}))

vi.mock('../../../composables/ui/usePagination', () => ({
  usePagination: () => ({
    currentPage: { value: 1 },
    totalPages: { value: 3 },
    paginatedItems: { value: [] },
    isFirstPage: { value: true },
    isLastPage: { value: false },
    prevPage: vi.fn(),
    nextPage: vi.fn(),
    resetPage: vi.fn(),
  }),
}))

vi.mock('../../../composables/shop/useShopFilters', () => ({
  useShopFilters: () => ({
    filterCategory: { value: 'all' },
    sortBy: { value: 'default' },
    categoryOptions: { value: [] },
    sortOptions: { value: [] },
    filteredAndSortedItems: { value: [] },
  }),
}))

vi.mock('../../../utils/debounce', () => ({
  debounce: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
}))

describe('ShopPage', () => {
  const mockConfig: Config = {
    version: '1.0.0',
    phase: '测试阶段',
    home: {
      title: '伊甸园系统',
      subtitle: '互动式故事游戏',
    },
    shop: {
      title: 'UNDO商店',
    },
  }

  const mockShop: ShopData = {
    currency: 1000,
    items: {
      item1: {
        id: 'item1',
        name: '生命药水',
        icon: '🧪',
        description: '恢复50点生命值',
        price: 100,
        category: 'consumable',
      },
      item2: {
        id: 'item2',
        name: '魔法药水',
        icon: '💙',
        description: '恢复50点魔法值',
        price: 120,
        category: 'consumable',
      },
      item3: {
        id: 'item3',
        name: '铁剑',
        icon: '⚔️',
        description: '基础武器',
        price: 500,
        category: 'weapon',
      },
    },
  }

  beforeEach(() => {
    // 设置 Pinia
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('渲染测试', () => {
    it('应该渲染商店页面容器', () => {
      const wrapper = mount(ShopPage)

      expect(wrapper.find('.page-shop').exists()).toBe(true)
    })

    it('应该渲染 ShopHeader', () => {
      const wrapper = mount(ShopPage, {
        props: { config: mockConfig, shop: mockShop },
      })

      expect(wrapper.findComponent({ name: 'ShopHeader' }).exists()).toBe(true)
    })

    it('应该渲染 ShopPagination', () => {
      const wrapper = mount(ShopPage, {
        props: { shop: mockShop },
      })

      expect(wrapper.findComponent({ name: 'ShopPagination' }).exists()).toBe(true)
    })
  })

  describe('空状态测试', () => {
    it('没有商品时应该显示空状态', () => {
      const wrapper = mount(ShopPage, {
        props: {
          shop: { currency: 0, items: {} },
        },
      })

      expect(wrapper.findComponent({ name: 'ShopEmptyState' }).exists()).toBe(true)
    })

    it('有商品时不应该显示空状态', () => {
      const wrapper = mount(ShopPage, {
        props: { shop: mockShop },
      })

      expect(wrapper.findComponent({ name: 'ShopEmptyState' }).exists()).toBe(false)
    })
  })

  describe('加载状态测试', () => {
    it('加载时应该显示骨架屏', async () => {
      const wrapper = mount(ShopPage, {
        props: { shop: mockShop },
      })

      // 设置加载状态
      wrapper.vm.isLoading = true
      await nextTick()

      const skeletons = wrapper.findAllComponents({ name: 'SkeletonCard' })
      expect(skeletons.length).toBe(12)
    })

    it('加载时应该有正确的 ARIA 属性', async () => {
      const wrapper = mount(ShopPage, {
        props: { shop: mockShop },
      })

      wrapper.vm.isLoading = true
      await nextTick()

      const loadingSection = wrapper.find('.shop-items-loading')
      expect(loadingSection.attributes('role')).toBe('status')
      expect(loadingSection.attributes('aria-live')).toBe('polite')
      expect(loadingSection.attributes('aria-label')).toBe('正在加载商品')
    })

    it('加载时不应该显示筛选器', async () => {
      const wrapper = mount(ShopPage, {
        props: { shop: mockShop },
      })

      wrapper.vm.isLoading = true
      await nextTick()

      expect(wrapper.findComponent({ name: 'ShopFilters' }).exists()).toBe(false)
    })
  })

  describe('筛选和搜索测试', () => {
    it('有商品且未加载时应该显示筛选器', () => {
      const wrapper = mount(ShopPage, {
        props: { shop: mockShop },
      })

      expect(wrapper.findComponent({ name: 'ShopFilters' }).exists()).toBe(true)
    })
  })

  describe('Props 测试', () => {
    it('应该接受 config prop', () => {
      const wrapper = mount(ShopPage, {
        props: { config: mockConfig },
      })

      expect(wrapper.props('config')).toEqual(mockConfig)
    })

    it('应该接受 shop prop', () => {
      const wrapper = mount(ShopPage, {
        props: { shop: mockShop },
      })

      expect(wrapper.props('shop')).toEqual(mockShop)
    })

    it('没有 config 时应该使用默认标题', () => {
      const wrapper = mount(ShopPage, {
        props: { shop: mockShop },
      })

      expect(wrapper.vm.pageTitle).toBe('UNDO商店')
    })

    it('没有 shop 时应该使用默认值', () => {
      const wrapper = mount(ShopPage)

      expect(wrapper.vm.currency).toBe(0)
      expect(wrapper.vm.items).toEqual({})
    })
  })

  describe('事件处理测试', () => {
    it('应该处理购买事件', () => {
      const wrapper = mount(ShopPage, {
        props: { shop: mockShop },
      })

      wrapper.vm.handleBuy('item1')

      expect(mockBuyItem).toHaveBeenCalledWith('item1')
    })

    it('应该处理添加到购物车事件', () => {
      const wrapper = mount(ShopPage, {
        props: { shop: mockShop },
      })

      wrapper.vm.handleAddToCart('item1')

      expect(mockAddToCart).toHaveBeenCalled()
      expect(mockSuccess).toHaveBeenCalledWith('已将 "生命药水" 添加到购物车')
    })

    it('商品不存在时不应该添加到购物车', () => {
      const wrapper = mount(ShopPage, {
        props: { shop: mockShop },
      })

      wrapper.vm.handleAddToCart('nonexistent')

      expect(mockAddToCart).not.toHaveBeenCalled()
      expect(mockSuccess).not.toHaveBeenCalled()
    })

    it('应该处理导航到购物车', () => {
      const wrapper = mount(ShopPage, {
        props: { shop: mockShop },
      })

      wrapper.vm.navigateToCart()

      expect(mockNavigateTo).toHaveBeenCalledWith('cart')
    })
  })
})
