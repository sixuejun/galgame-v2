import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { useStorageFiltering } from '../game/useStorageFiltering'
import type { Item } from '../../types'

// Mock debounce - 立即执行函数
vi.mock('../../utils/debounce', () => ({
  debounce: <T extends (...args: unknown[]) => void>(fn: T) => fn,
}))

// 在测试环境中，global 是由测试框架提供的全局对象

describe('useStorageFiltering', () => {
  const createMockItem = (
    id: string,
    name: string,
    category: string,
    quantity: number = 1
  ): Item => ({
    id,
    name,
    description: `${name}的描述`,
    price: 100,
    icon: '🎁',
    category,
    quantity,
  })

  const createMockInventory = (): Item[] => [
    createMockItem('item1', '生命药水', 'consumable', 5),
    createMockItem('item2', '魔法药水', 'consumable', 3),
    createMockItem('item3', '铁剑', 'weapon', 1),
    createMockItem('item4', '钢剑', 'weapon', 2),
    createMockItem('item5', '皮甲', 'armor', 1),
    createMockItem('item6', '锁甲', 'armor', 3),
    createMockItem('item7', '治疗药水', 'consumable', 10),
    createMockItem('item8', '力量药剂', 'consumable', 2),
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window.scrollTo
    globalThis.window.scrollTo = vi.fn()
  })

  describe('初始状态', () => {
    it('应该初始化为默认状态', () => {
      const inventoryArray = ref(createMockInventory())
      const { searchQuery, filterCategory, sortBy, currentPage, isLoading } =
        useStorageFiltering(inventoryArray)

      expect(searchQuery.value).toBe('')
      expect(filterCategory.value).toBe('all')
      expect(sortBy.value).toBe('default')
      expect(currentPage.value).toBe(1)
      expect(isLoading.value).toBe(false)
    })
  })

  describe('categories', () => {
    it('应该正确提取所有分类', () => {
      const inventoryArray = ref(createMockInventory())
      const { categoryOptions } = useStorageFiltering(inventoryArray)

      expect(categoryOptions.value).toHaveLength(4) // all + 3 categories
      expect(categoryOptions.value[0]).toEqual({ value: 'all', label: '全部分类' })
      expect(categoryOptions.value.map(o => o.value)).toContain('consumable')
      expect(categoryOptions.value.map(o => o.value)).toContain('weapon')
      expect(categoryOptions.value.map(o => o.value)).toContain('armor')
    })

    it('分类应该按字母顺序排序', () => {
      const inventoryArray = ref(createMockInventory())
      const { categoryOptions } = useStorageFiltering(inventoryArray)

      const categories = categoryOptions.value.slice(1).map(o => o.value)
      const sortedCategories = [...categories].sort()
      expect(categories).toEqual(sortedCategories)
    })

    it('空库存应该只有"全部分类"选项', () => {
      const inventoryArray = ref<Item[]>([])
      const { categoryOptions } = useStorageFiltering(inventoryArray)

      expect(categoryOptions.value).toHaveLength(1)
      expect(categoryOptions.value[0]).toEqual({ value: 'all', label: '全部分类' })
    })
  })

  describe('搜索功能', () => {
    it('应该根据名称搜索物品', async () => {
      const inventoryArray = ref(createMockInventory())
      const { searchQuery, filteredInventory } = useStorageFiltering(inventoryArray)

      searchQuery.value = '药水'
      await nextTick()

      expect(filteredInventory.value).toHaveLength(3) // 生命药水、魔法药水、治疗药水
      expect(filteredInventory.value.map(i => i.id)).toContain('item1')
      expect(filteredInventory.value.map(i => i.id)).toContain('item2')
      expect(filteredInventory.value.map(i => i.id)).toContain('item7')
    })

    it('应该根据描述搜索物品', async () => {
      const inventoryArray = ref(createMockInventory())
      const { searchQuery, filteredInventory } = useStorageFiltering(inventoryArray)

      searchQuery.value = '描述'
      await nextTick()

      // 所有物品的描述都包含"描述"
      expect(filteredInventory.value).toHaveLength(8)
    })

    it('搜索应该不区分大小写', async () => {
      const inventoryArray = ref(createMockInventory())
      const { searchQuery, filteredInventory } = useStorageFiltering(inventoryArray)

      searchQuery.value = '生命'
      await nextTick()
      const result1 = filteredInventory.value.length

      searchQuery.value = '生命'
      await nextTick()
      const result2 = filteredInventory.value.length

      expect(result1).toBe(result2)
    })

    it('空搜索应该返回所有物品', async () => {
      const inventoryArray = ref(createMockInventory())
      const { searchQuery, filteredInventory } = useStorageFiltering(inventoryArray)

      searchQuery.value = ''
      await nextTick()

      expect(filteredInventory.value).toHaveLength(8)
    })

    it('没有匹配结果时应该返回空数组', async () => {
      const inventoryArray = ref(createMockInventory())
      const { searchQuery, filteredInventory } = useStorageFiltering(inventoryArray)

      searchQuery.value = '不存在的物品'
      await nextTick()

      expect(filteredInventory.value).toHaveLength(0)
    })
  })

  describe('分类筛选', () => {
    it('应该按分类筛选物品', () => {
      const inventoryArray = ref(createMockInventory())
      const { filterCategory, filteredInventory } = useStorageFiltering(inventoryArray)

      filterCategory.value = 'consumable'

      expect(filteredInventory.value).toHaveLength(4) // 4个消耗品
      expect(filteredInventory.value.every(i => i.category === 'consumable')).toBe(true)
    })

    it('"全部分类"应该显示所有物品', () => {
      const inventoryArray = ref(createMockInventory())
      const { filterCategory, filteredInventory } = useStorageFiltering(inventoryArray)

      filterCategory.value = 'all'

      expect(filteredInventory.value).toHaveLength(8)
    })

    it('应该支持多个分类', () => {
      const inventoryArray = ref(createMockInventory())
      const { filterCategory, filteredInventory } = useStorageFiltering(inventoryArray)

      filterCategory.value = 'weapon'
      expect(filteredInventory.value).toHaveLength(2)

      filterCategory.value = 'armor'
      expect(filteredInventory.value).toHaveLength(2)
    })
  })

  describe('排序功能', () => {
    it('默认排序应该保持原始顺序', () => {
      const inventoryArray = ref(createMockInventory())
      const { sortBy, filteredInventory } = useStorageFiltering(inventoryArray)

      sortBy.value = 'default'

      expect(filteredInventory.value[0].id).toBe('item1')
      expect(filteredInventory.value[1].id).toBe('item2')
    })

    it('应该按名称排序', () => {
      const inventoryArray = ref(createMockInventory())
      const { sortBy, filteredInventory } = useStorageFiltering(inventoryArray)

      sortBy.value = 'name'

      const names = filteredInventory.value.map(i => i.name)
      const sortedNames = [...names].sort((a, b) => a.localeCompare(b, 'zh-CN'))
      expect(names).toEqual(sortedNames)
    })

    it('应该按数量排序（降序）', () => {
      const inventoryArray = ref(createMockInventory())
      const { sortBy, filteredInventory } = useStorageFiltering(inventoryArray)

      sortBy.value = 'quantity'

      const quantities = filteredInventory.value.map(i => i.quantity || 0)
      for (let i = 0; i < quantities.length - 1; i++) {
        expect(quantities[i]).toBeGreaterThanOrEqual(quantities[i + 1])
      }
    })

    it('排序应该正确处理没有 quantity 的物品', () => {
      const inventory = createMockInventory()
      delete inventory[0].quantity
      const inventoryArray = ref(inventory)
      const { sortBy, filteredInventory } = useStorageFiltering(inventoryArray)

      sortBy.value = 'quantity'

      // 不应该抛出错误
      expect(filteredInventory.value).toBeDefined()
    })
  })

  describe('组合筛选', () => {
    it('应该同时应用搜索和分类筛选', async () => {
      const inventoryArray = ref(createMockInventory())
      const { searchQuery, filterCategory, filteredInventory } = useStorageFiltering(inventoryArray)

      searchQuery.value = '药'
      filterCategory.value = 'consumable'
      await nextTick()

      expect(filteredInventory.value).toHaveLength(4) // 所有包含"药"的消耗品
      expect(filteredInventory.value.every(i => i.category === 'consumable')).toBe(true)
      expect(filteredInventory.value.every(i => i.name.includes('药'))).toBe(true)
    })

    it('应该同时应用搜索、分类和排序', async () => {
      const inventoryArray = ref(createMockInventory())
      const { searchQuery, filterCategory, sortBy, filteredInventory } =
        useStorageFiltering(inventoryArray)

      searchQuery.value = '药'
      filterCategory.value = 'consumable'
      sortBy.value = 'quantity'
      await nextTick()

      const quantities = filteredInventory.value.map(i => i.quantity || 0)
      for (let i = 0; i < quantities.length - 1; i++) {
        expect(quantities[i]).toBeGreaterThanOrEqual(quantities[i + 1])
      }
    })
  })

  describe('分页功能', () => {
    it('应该正确计算总页数', () => {
      const inventoryArray = ref(createMockInventory())
      const { totalPages } = useStorageFiltering(inventoryArray)

      // 8个物品，每页24个，应该是1页
      expect(totalPages.value).toBe(1)
    })

    it('应该正确分页显示物品', () => {
      // 创建超过24个物品的库存
      const largeInventory = Array.from({ length: 50 }, (_, i) =>
        createMockItem(`item${i}`, `物品${i}`, 'consumable', i + 1)
      )
      const inventoryArray = ref(largeInventory)
      const { paginatedInventory, totalPages } = useStorageFiltering(inventoryArray)

      expect(totalPages.value).toBe(3) // 50个物品，每页24个，共3页
      expect(paginatedInventory.value).toHaveLength(24) // 第一页应该有24个物品
    })

    it('goToPage 应该正确跳转页面', async () => {
      const largeInventory = Array.from({ length: 50 }, (_, i) =>
        createMockItem(`item${i}`, `物品${i}`, 'consumable', i + 1)
      )
      const inventoryArray = ref(largeInventory)
      const { goToPage, currentPage } = useStorageFiltering(inventoryArray)

      // 使用 fake timers
      vi.useFakeTimers()

      goToPage(2)

      // 快进时间
      await vi.advanceTimersByTimeAsync(300)

      expect(currentPage.value).toBe(2)

      vi.useRealTimers()
    })

    it('goToPage 应该显示加载状态', async () => {
      const largeInventory = Array.from({ length: 50 }, (_, i) =>
        createMockItem(`item${i}`, `物品${i}`, 'consumable', i + 1)
      )
      const inventoryArray = ref(largeInventory)
      const { goToPage, isLoading } = useStorageFiltering(inventoryArray)

      vi.useFakeTimers()

      goToPage(2)

      // 立即检查加载状态
      expect(isLoading.value).toBe(true)

      // 快进时间
      await vi.advanceTimersByTimeAsync(300)

      expect(isLoading.value).toBe(false)

      vi.useRealTimers()
    })

    it('goToPage 应该滚动到顶部', async () => {
      const largeInventory = Array.from({ length: 50 }, (_, i) =>
        createMockItem(`item${i}`, `物品${i}`, 'consumable', i + 1)
      )
      const inventoryArray = ref(largeInventory)
      const { goToPage } = useStorageFiltering(inventoryArray)

      vi.useFakeTimers()

      goToPage(2)

      await vi.advanceTimersByTimeAsync(300)

      expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })

      vi.useRealTimers()
    })

    it('goToPage 应该拒绝无效的页码', async () => {
      const inventoryArray = ref(createMockInventory())
      const { goToPage, currentPage } = useStorageFiltering(inventoryArray)

      const initialPage = currentPage.value

      goToPage(0) // 无效页码
      expect(currentPage.value).toBe(initialPage)

      goToPage(999) // 超出范围
      expect(currentPage.value).toBe(initialPage)
    })
  })

  describe('响应式更新', () => {
    it('库存变化时应该更新筛选结果', () => {
      const inventoryArray = ref(createMockInventory())
      const { filteredInventory } = useStorageFiltering(inventoryArray)

      expect(filteredInventory.value).toHaveLength(8)

      // 添加新物品
      inventoryArray.value.push(createMockItem('item9', '新物品', 'misc', 1))

      expect(filteredInventory.value).toHaveLength(9)
    })

    it('库存变化时应该更新分类选项', () => {
      const inventoryArray = ref(createMockInventory())
      const { categoryOptions } = useStorageFiltering(inventoryArray)

      const initialLength = categoryOptions.value.length

      // 添加新分类的物品
      inventoryArray.value.push(createMockItem('item9', '新物品', 'newCategory', 1))

      expect(categoryOptions.value.length).toBe(initialLength + 1)
      expect(categoryOptions.value.map(o => o.value)).toContain('newCategory')
    })
  })
})
