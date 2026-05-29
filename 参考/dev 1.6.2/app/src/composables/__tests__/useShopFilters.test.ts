import { describe, it, expect, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useShopFilters, type ShopItem } from '../shop/useShopFilters'

describe('useShopFilters', () => {
  let mockItems: ShopItem[]
  let mockSearchedItems: ShopItem[]

  beforeEach(() => {
    mockItems = [
      {
        id: 'item1',
        name: '苹果',
        description: '新鲜的苹果',
        price: 10,
        category: '水果',
        icon: '🍎',
      },
      {
        id: 'item2',
        name: '香蕉',
        description: '香甜的香蕉',
        price: 5,
        category: '水果',
        icon: '🍌',
      },
      {
        id: 'item3',
        name: '牛奶',
        description: '新鲜牛奶',
        price: 15,
        category: '饮料',
        icon: '🥛',
      },
      {
        id: 'item4',
        name: '面包',
        description: '软面包',
        price: 8,
        category: '食品',
        icon: '🍞',
      },
    ]
    mockSearchedItems = [...mockItems]
  })

  describe('基本功能', () => {
    it('应该正确初始化', () => {
      const items = ref(mockItems)
      const searchedItems = ref(mockSearchedItems)

      const { filterCategory, sortBy, categories } = useShopFilters(items, searchedItems)

      expect(filterCategory.value).toBe('all')
      expect(sortBy.value).toBe('default')
      expect(categories.value).toEqual(['水果', '食品', '饮料'])
    })

    it('应该支持自定义初始值', () => {
      const items = ref(mockItems)
      const searchedItems = ref(mockSearchedItems)

      const { filterCategory, sortBy } = useShopFilters(items, searchedItems, {
        initialCategory: '水果',
        initialSort: 'price-asc',
      })

      expect(filterCategory.value).toBe('水果')
      expect(sortBy.value).toBe('price-asc')
    })
  })

  describe('分类筛选', () => {
    it('应该返回所有分类', () => {
      const items = ref(mockItems)
      const searchedItems = ref(mockSearchedItems)

      const { categories } = useShopFilters(items, searchedItems)

      expect(categories.value).toEqual(['水果', '食品', '饮料'])
    })

    it('应该生成正确的分类选项', () => {
      const items = ref(mockItems)
      const searchedItems = ref(mockSearchedItems)

      const { categoryOptions } = useShopFilters(items, searchedItems)

      expect(categoryOptions.value).toEqual([
        { value: 'all', label: '全部分类' },
        { value: '水果', label: '水果' },
        { value: '食品', label: '食品' },
        { value: '饮料', label: '饮料' },
      ])
    })

    it('当选择"全部分类"时应该返回所有商品', () => {
      const items = ref(mockItems)
      const searchedItems = ref(mockSearchedItems)

      const { filterCategory, filteredAndSortedItems } = useShopFilters(items, searchedItems)

      filterCategory.value = 'all'
      expect(filteredAndSortedItems.value).toHaveLength(4)
    })

    it('应该按分类筛选商品', () => {
      const items = ref(mockItems)
      const searchedItems = ref(mockSearchedItems)

      const { filterCategory, filteredAndSortedItems } = useShopFilters(items, searchedItems)

      filterCategory.value = '水果'
      expect(filteredAndSortedItems.value).toHaveLength(2)
      expect(filteredAndSortedItems.value.every(item => item.category === '水果')).toBe(true)
    })

    it('应该在搜索结果上应用分类筛选', () => {
      const items = ref(mockItems)
      const searchedItems = ref([mockItems[0], mockItems[2]]) // 苹果和牛奶

      const { filterCategory, filteredAndSortedItems } = useShopFilters(items, searchedItems)

      filterCategory.value = '水果'
      expect(filteredAndSortedItems.value).toHaveLength(1)
      expect(filteredAndSortedItems.value[0].name).toBe('苹果')
    })
  })

  describe('排序功能', () => {
    it('默认排序应该保持原顺序', () => {
      const items = ref(mockItems)
      const searchedItems = ref(mockSearchedItems)

      const { sortBy, filteredAndSortedItems } = useShopFilters(items, searchedItems)

      sortBy.value = 'default'
      expect(filteredAndSortedItems.value[0].name).toBe('苹果')
      expect(filteredAndSortedItems.value[1].name).toBe('香蕉')
    })

    it('应该按名称排序', () => {
      const items = ref(mockItems)
      const searchedItems = ref(mockSearchedItems)

      const { sortBy, filteredAndSortedItems } = useShopFilters(items, searchedItems)

      sortBy.value = 'name'
      const names = filteredAndSortedItems.value.map(item => item.name)
      // 中文拼音排序：miànbāo, niúnǎi, píngguǒ, xiāngjiāo
      expect(names).toEqual(['面包', '牛奶', '苹果', '香蕉'])
    })

    it('应该按价格从低到高排序', () => {
      const items = ref(mockItems)
      const searchedItems = ref(mockSearchedItems)

      const { sortBy, filteredAndSortedItems } = useShopFilters(items, searchedItems)

      sortBy.value = 'price-asc'
      const prices = filteredAndSortedItems.value.map(item => item.price)
      expect(prices).toEqual([5, 8, 10, 15])
    })

    it('应该按价格从高到低排序', () => {
      const items = ref(mockItems)
      const searchedItems = ref(mockSearchedItems)

      const { sortBy, filteredAndSortedItems } = useShopFilters(items, searchedItems)

      sortBy.value = 'price-desc'
      const prices = filteredAndSortedItems.value.map(item => item.price)
      expect(prices).toEqual([15, 10, 8, 5])
    })
  })

  describe('组合筛选和排序', () => {
    it('应该先筛选后排序', () => {
      const items = ref(mockItems)
      const searchedItems = ref(mockSearchedItems)

      const { filterCategory, sortBy, filteredAndSortedItems } = useShopFilters(
        items,
        searchedItems
      )

      filterCategory.value = '水果'
      sortBy.value = 'price-desc'

      expect(filteredAndSortedItems.value).toHaveLength(2)
      expect(filteredAndSortedItems.value[0].name).toBe('苹果') // 价格 10
      expect(filteredAndSortedItems.value[1].name).toBe('香蕉') // 价格 5
    })
  })

  describe('重置功能', () => {
    it('应该重置筛选条件', () => {
      const items = ref(mockItems)
      const searchedItems = ref(mockSearchedItems)

      const { filterCategory, sortBy, resetFilters } = useShopFilters(items, searchedItems)

      filterCategory.value = '水果'
      sortBy.value = 'price-asc'

      resetFilters()

      expect(filterCategory.value).toBe('all')
      expect(sortBy.value).toBe('default')
    })
  })

  describe('响应式更新', () => {
    it('当商品列表变化时应该更新分类', () => {
      const items = ref(mockItems)
      const searchedItems = ref(mockSearchedItems)

      const { categories } = useShopFilters(items, searchedItems)

      expect(categories.value).toHaveLength(3)

      // 添加新分类的商品
      items.value.push({
        id: 'item5',
        name: '可乐',
        description: '冰镇可乐',
        price: 3,
        category: '饮品',
        icon: '🥤',
      })

      expect(categories.value).toHaveLength(4)
      expect(categories.value).toContain('饮品')
    })

    it('当搜索结果变化时应该更新筛选结果', () => {
      const items = ref(mockItems)
      const searchedItems = ref(mockSearchedItems)

      const { filteredAndSortedItems } = useShopFilters(items, searchedItems)

      expect(filteredAndSortedItems.value).toHaveLength(4)

      // 更新搜索结果
      searchedItems.value = [mockItems[0], mockItems[1]]

      expect(filteredAndSortedItems.value).toHaveLength(2)
    })
  })

  describe('边界情况', () => {
    it('应该处理空商品列表', () => {
      const items = ref<ShopItem[]>([])
      const searchedItems = ref<ShopItem[]>([])

      const { categories, filteredAndSortedItems } = useShopFilters(items, searchedItems)

      expect(categories.value).toEqual([])
      expect(filteredAndSortedItems.value).toEqual([])
    })

    it('应该处理没有分类的商品', () => {
      const itemsWithoutCategory = [
        {
          id: 'item1',
          name: '商品1',
          description: '描述1',
          price: 10,
          category: '',
          icon: '📦',
        },
      ]
      const items = ref(itemsWithoutCategory)
      const searchedItems = ref(itemsWithoutCategory)

      const { categories } = useShopFilters(items, searchedItems)

      expect(categories.value).toEqual([])
    })
  })
})
