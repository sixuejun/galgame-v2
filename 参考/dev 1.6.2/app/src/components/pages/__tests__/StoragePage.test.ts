// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import StoragePage from '../StoragePage.vue'
import type { Config, StorageData, Item } from '../../../types'

// Mock 子组件
vi.mock('../../common/ErrorBoundary.vue', () => ({
  default: {
    name: 'ErrorBoundary',
    template: '<div class="error-boundary-mock"><slot /></div>',
  },
}))

vi.mock('../../common/SkeletonCard.vue', () => ({
  default: {
    name: 'SkeletonCard',
    template: '<div class="skeleton-card-mock"></div>',
  },
}))

vi.mock('../StoragePage/StorageFilters.vue', () => ({
  default: {
    name: 'StorageFilters',
    template: '<div class="storage-filters-mock"></div>',
  },
}))

vi.mock('../StoragePage/StorageGrid.vue', () => ({
  default: {
    name: 'StorageGrid',
    template: '<div class="storage-grid-mock"></div>',
  },
}))

vi.mock('../StoragePage/StoragePagination.vue', () => ({
  default: {
    name: 'StoragePagination',
    template: '<div class="storage-pagination-mock"></div>',
  },
}))

vi.mock('../StoragePage/StorageEmptyState.vue', () => ({
  default: {
    name: 'StorageEmptyState',
    template: '<div class="storage-empty-state-mock"></div>',
  },
}))

vi.mock('../StoragePage/StorageItemModal.vue', () => ({
  default: {
    name: 'StorageItemModal',
    template: '<div class="storage-item-modal-mock"></div>',
  },
}))

// Mock composables
const mockUseItem = vi.fn()
const mockNavigateTo = vi.fn()

const mockSearchQuery = ref('')
const mockFilterCategory = ref('all')
const mockSortBy = ref('quantity')
const mockCurrentPage = ref(1)
const mockIsLoading = ref(false)
const mockCategoryOptions = ref([
  { value: 'all', label: '全部' },
  { value: 'consumable', label: '消耗品' },
])
const mockSortOptions = ref([
  { value: 'quantity', label: '数量' },
  { value: 'name', label: '名称' },
])
const mockFilteredInventory = ref<Item[]>([])
const mockPaginatedInventory = ref<Item[]>([])
const mockTotalPages = ref(1)
const mockGoToPage = vi.fn()

vi.mock('../../../composables/game/useItemEffects', () => ({
  useItemEffects: () => ({
    useItem: mockUseItem,
  }),
}))

vi.mock('../../../composables/ui/usePageNavigation', () => ({
  usePageNavigation: () => ({
    navigateTo: mockNavigateTo,
  }),
}))

vi.mock('../../../composables/game/useStorageFiltering', () => ({
  useStorageFiltering: () => ({
    searchQuery: mockSearchQuery,
    filterCategory: mockFilterCategory,
    sortBy: mockSortBy,
    currentPage: mockCurrentPage,
    isLoading: mockIsLoading,
    categoryOptions: mockCategoryOptions,
    sortOptions: mockSortOptions,
    filteredInventory: mockFilteredInventory,
    paginatedInventory: mockPaginatedInventory,
    totalPages: mockTotalPages,
    goToPage: mockGoToPage,
  }),
}))

vi.mock('../../../utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('StoragePage', () => {
  let defaultProps: { config?: Config; storage?: StorageData }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    mockIsLoading.value = false
    mockFilteredInventory.value = []
    mockPaginatedInventory.value = []
    mockTotalPages.value = 1
    mockCurrentPage.value = 1

    defaultProps = {
      config: {
        version: '1.0.0',
        phase: 'test',
        home: {
          title: 'Test Game',
          subtitle: 'Test Subtitle',
        },
        storage: {
          title: '物品仓库',
        },
      },
      storage: {
        inventory: {},
      },
    }
  })

  describe('渲染测试', () => {
    it('应该渲染存储页面容器', () => {
      const wrapper = mount(StoragePage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.page-storage').exists()).toBe(true)
    })

    it('应该渲染 ErrorBoundary', () => {
      const wrapper = mount(StoragePage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.error-boundary-mock').exists()).toBe(true)
    })

    it('应该渲染页面标题', () => {
      const wrapper = mount(StoragePage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      const title = wrapper.find('h2')
      expect(title.exists()).toBe(true)
      expect(title.text()).toBe('物品仓库')
    })

    it('没有 config 时应该使用默认标题', () => {
      const wrapper = mount(StoragePage, {
        props: { storage: { inventory: {} } },
        global: {
          plugins: [createPinia()],
        },
      })

      const title = wrapper.find('h2')
      expect(title.text()).toBe('物品存储')
    })
  })

  describe('空状态', () => {
    it('当库存为空且未加载时应该显示空状态', () => {
      mockIsLoading.value = false
      const wrapper = mount(StoragePage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.storage-empty-state-mock').exists()).toBe(true)
      expect(wrapper.find('.storage-filters-mock').exists()).toBe(false)
    })

    it('当库存不为空时不应该显示空状态', () => {
      mockIsLoading.value = false
      const wrapper = mount(StoragePage, {
        props: {
          ...defaultProps,
          storage: {
            inventory: {
              item1: { id: 'item1', name: '物品1', price: 100, quantity: 1 },
            },
          },
        },
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.storage-empty-state-mock').exists()).toBe(false)
    })
  })

  describe('加载状态', () => {
    it('加载时应该显示骨架屏', () => {
      mockIsLoading.value = true
      const wrapper = mount(StoragePage, {
        props: {
          ...defaultProps,
          storage: {
            inventory: {
              item1: { id: 'item1', name: '物品1', price: 100, quantity: 1 },
            },
          },
        },
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.findAll('.skeleton-card-mock').length).toBe(24)
    })

    it('加载完成后不应该显示骨架屏', () => {
      mockIsLoading.value = false
      mockFilteredInventory.value = [{ id: 'item1', name: '物品1', price: 100, quantity: 1 }]
      mockPaginatedInventory.value = [{ id: 'item1', name: '物品1', price: 100, quantity: 1 }]

      const wrapper = mount(StoragePage, {
        props: {
          ...defaultProps,
          storage: {
            inventory: {
              item1: { id: 'item1', name: '物品1', price: 100, quantity: 1 },
            },
          },
        },
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.findAll('.skeleton-card-mock').length).toBe(0)
    })
  })

  describe('筛选和内容', () => {
    beforeEach(() => {
      mockIsLoading.value = false
      mockFilteredInventory.value = [{ id: 'item1', name: '物品1', price: 100, quantity: 1 }]
      mockPaginatedInventory.value = [{ id: 'item1', name: '物品1', price: 100, quantity: 1 }]
    })

    it('有物品时应该显示筛选器', () => {
      const wrapper = mount(StoragePage, {
        props: {
          ...defaultProps,
          storage: {
            inventory: {
              item1: { id: 'item1', name: '物品1', price: 100, quantity: 1 },
            },
          },
        },
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.storage-filters-mock').exists()).toBe(true)
    })

    it('有筛选结果时应该显示物品网格', () => {
      const wrapper = mount(StoragePage, {
        props: {
          ...defaultProps,
          storage: {
            inventory: {
              item1: { id: 'item1', name: '物品1', price: 100, quantity: 1 },
            },
          },
        },
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.storage-grid-mock').exists()).toBe(true)
    })

    it('有筛选结果时应该显示分页', () => {
      const wrapper = mount(StoragePage, {
        props: {
          ...defaultProps,
          storage: {
            inventory: {
              item1: { id: 'item1', name: '物品1', price: 100, quantity: 1 },
            },
          },
        },
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.storage-pagination-mock').exists()).toBe(true)
    })
  })

  describe('无搜索结果', () => {
    it('有物品但筛选结果为空时应该显示无结果提示', () => {
      mockIsLoading.value = false
      mockFilteredInventory.value = []

      const wrapper = mount(StoragePage, {
        props: {
          ...defaultProps,
          storage: {
            inventory: {
              item1: { id: 'item1', name: '物品1', price: 100, quantity: 1 },
            },
          },
        },
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.no-results').exists()).toBe(true)
      expect(wrapper.find('.no-results p').text()).toBe('未找到匹配的物品')
    })
  })

  describe('物品模态框', () => {
    it('初始时模态框应该不可见', () => {
      const wrapper = mount(StoragePage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.vm.itemModalVisible).toBe(false)
      expect(wrapper.vm.selectedItem).toBeNull()
    })

    it('handleItemClick 应该显示模态框并设置选中物品', () => {
      const wrapper = mount(StoragePage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      const item: Item = { id: 'item1', name: '物品1', price: 100, quantity: 1 }
      wrapper.vm.handleItemClick(item)

      expect(wrapper.vm.itemModalVisible).toBe(true)
      expect(wrapper.vm.selectedItem).toStrictEqual(item)
    })

    it('hideItemModal 应该隐藏模态框并清空选中物品', () => {
      const wrapper = mount(StoragePage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      const item: Item = { id: 'item1', name: '物品1', price: 100, quantity: 1 }
      wrapper.vm.handleItemClick(item)
      wrapper.vm.hideItemModal()

      expect(wrapper.vm.itemModalVisible).toBe(false)
      expect(wrapper.vm.selectedItem).toBeNull()
    })

    it('handleUseItem 应该调用 useItem 并隐藏模态框', async () => {
      const wrapper = mount(StoragePage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      const item: Item = { id: 'item1', name: '物品1', price: 100, quantity: 1 }
      wrapper.vm.handleItemClick(item)

      await wrapper.vm.handleUseItem('item1', 2)

      expect(mockUseItem).toHaveBeenCalledWith('item1', 2)
      expect(wrapper.vm.itemModalVisible).toBe(false)
    })
  })

  describe('导航', () => {
    it('navigateToShop 应该导航到商店页面', () => {
      const wrapper = mount(StoragePage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      wrapper.vm.navigateToShop()

      expect(mockNavigateTo).toHaveBeenCalledWith('shop')
    })
  })
})
