import { describe, it, expect } from 'vitest'
import { ref, type Ref } from 'vue'
import { useSearch } from '../game/useSearch'

interface Product {
  id: number
  name: string
  description: string
  category: string
}

describe('useSearch', () => {
  const createProducts = (): Product[] => [
    { id: 1, name: 'Apple', description: 'Fresh red apple', category: 'Fruit' },
    { id: 2, name: 'Banana', description: 'Yellow banana', category: 'Fruit' },
    { id: 3, name: 'Carrot', description: 'Orange carrot', category: 'Vegetable' },
    { id: 4, name: 'Durian', description: 'Smelly but delicious', category: 'Fruit' },
    { id: 5, name: 'Eggplant', description: 'Purple eggplant', category: 'Vegetable' },
  ]

  describe('基本功能', () => {
    it('应该正确初始化默认值', () => {
      const items = ref(createProducts())
      const { searchQuery, hasQuery, matchCount } = useSearch(items, {
        searchFields: item => [item.name, item.description],
      })

      expect(searchQuery.value).toBe('')
      expect(hasQuery.value).toBe(false)
      expect(matchCount.value).toBe(5)
    })

    it('应该接受初始查询', () => {
      const items = ref(createProducts())
      const { searchQuery, hasQuery } = useSearch(items, {
        searchFields: item => [item.name],
        initialQuery: 'Apple',
      })

      expect(searchQuery.value).toBe('Apple')
      expect(hasQuery.value).toBe(true)
    })

    it('空查询应该返回所有项目', () => {
      const items = ref(createProducts())
      const { filteredItems } = useSearch(items, {
        searchFields: item => [item.name],
      })

      expect(filteredItems.value).toEqual(items.value)
      expect(filteredItems.value.length).toBe(5)
    })
  })

  describe('搜索功能', () => {
    it('应该按名称搜索', () => {
      const items = ref(createProducts())
      const { searchQuery, filteredItems } = useSearch(items, {
        searchFields: item => [item.name],
      })

      searchQuery.value = 'Apple'
      expect(filteredItems.value).toEqual([
        { id: 1, name: 'Apple', description: 'Fresh red apple', category: 'Fruit' },
      ])
    })

    it('应该按描述搜索', () => {
      const items = ref(createProducts())
      const { searchQuery, filteredItems } = useSearch(items, {
        searchFields: item => [item.description],
      })

      searchQuery.value = 'red'
      expect(filteredItems.value).toEqual([
        { id: 1, name: 'Apple', description: 'Fresh red apple', category: 'Fruit' },
      ])
    })

    it('应该在多个字段中搜索', () => {
      const items = ref(createProducts())
      const { searchQuery, filteredItems } = useSearch(items, {
        searchFields: item => [item.name, item.description],
      })

      searchQuery.value = 'yellow'
      expect(filteredItems.value).toEqual([
        { id: 2, name: 'Banana', description: 'Yellow banana', category: 'Fruit' },
      ])
    })

    it('应该支持部分匹配', () => {
      const items = ref(createProducts())
      const { searchQuery, filteredItems } = useSearch(items, {
        searchFields: item => [item.name],
      })

      searchQuery.value = 'an'
      expect(filteredItems.value).toHaveLength(3) // Banana, Durian, Eggplant
      expect(filteredItems.value.map(item => item.name)).toEqual(['Banana', 'Durian', 'Eggplant'])
    })

    it('默认应该不区分大小写', () => {
      const items = ref(createProducts())
      const { searchQuery, filteredItems } = useSearch(items, {
        searchFields: item => [item.name],
      })

      searchQuery.value = 'APPLE'
      expect(filteredItems.value).toHaveLength(1)
      expect(filteredItems.value[0].name).toBe('Apple')
    })

    it('应该支持区分大小写搜索', () => {
      const items = ref(createProducts())
      const { searchQuery, filteredItems } = useSearch(items, {
        searchFields: item => [item.name],
        caseSensitive: true,
      })

      searchQuery.value = 'APPLE'
      expect(filteredItems.value).toHaveLength(0)

      searchQuery.value = 'Apple'
      expect(filteredItems.value).toHaveLength(1)
    })

    it('应该处理空字符串字段', () => {
      const items = ref<Product[]>([
        { id: 1, name: 'Apple', description: '', category: 'Fruit' },
        { id: 2, name: '', description: 'No name', category: 'Fruit' },
      ])

      const { searchQuery, filteredItems } = useSearch(items, {
        searchFields: item => [item.name, item.description],
      })

      searchQuery.value = 'Apple'
      expect(filteredItems.value).toHaveLength(1)
      expect(filteredItems.value[0].id).toBe(1)
    })

    it('应该处理 undefined 字段', () => {
      interface PartialProduct {
        id: number
        name?: string
        description?: string
      }

      const items = ref<PartialProduct[]>([
        { id: 1, name: 'Apple' },
        { id: 2, description: 'No name' },
      ])

      const { searchQuery, filteredItems } = useSearch(items, {
        searchFields: item => [item.name || '', item.description || ''],
      })

      searchQuery.value = 'Apple'
      expect(filteredItems.value).toHaveLength(1)
      expect(filteredItems.value[0].id).toBe(1)
    })

    it('应该忽略前后空格', () => {
      const items = ref(createProducts())
      const { searchQuery, filteredItems } = useSearch(items, {
        searchFields: item => [item.name],
      })

      searchQuery.value = '  Apple  '
      expect(filteredItems.value).toHaveLength(1)
      expect(filteredItems.value[0].name).toBe('Apple')
    })

    it('只有空格的查询应该返回所有项目', () => {
      const items = ref(createProducts())
      const { searchQuery, filteredItems } = useSearch(items, {
        searchFields: item => [item.name],
      })

      searchQuery.value = '   '
      expect(filteredItems.value).toEqual(items.value)
    })
  })

  describe('搜索状态', () => {
    it('hasQuery 应该正确反映是否有查询', () => {
      const items = ref(createProducts())
      const { searchQuery, hasQuery } = useSearch(items, {
        searchFields: item => [item.name],
      })

      expect(hasQuery.value).toBe(false)

      searchQuery.value = 'Apple'
      expect(hasQuery.value).toBe(true)

      searchQuery.value = ''
      expect(hasQuery.value).toBe(false)

      searchQuery.value = '   '
      expect(hasQuery.value).toBe(false)
    })

    it('matchCount 应该返回匹配的项目数量', () => {
      const items = ref(createProducts())
      const { searchQuery, matchCount } = useSearch(items, {
        searchFields: item => [item.category],
      })

      expect(matchCount.value).toBe(5)

      searchQuery.value = 'Fruit'
      expect(matchCount.value).toBe(3)

      searchQuery.value = 'Vegetable'
      expect(matchCount.value).toBe(2)

      searchQuery.value = 'NotFound'
      expect(matchCount.value).toBe(0)
    })
  })

  describe('方法', () => {
    it('clearSearch 应该清空搜索查询', () => {
      const items = ref(createProducts())
      const { searchQuery, clearSearch, filteredItems } = useSearch(items, {
        searchFields: item => [item.name],
      })

      searchQuery.value = 'Apple'
      expect(filteredItems.value).toHaveLength(1)

      clearSearch()
      expect(searchQuery.value).toBe('')
      expect(filteredItems.value).toEqual(items.value)
    })

    it('setSearchQuery 应该设置搜索查询', () => {
      const items = ref(createProducts())
      const { searchQuery, setSearchQuery, filteredItems } = useSearch(items, {
        searchFields: item => [item.name],
      })

      setSearchQuery('Banana')
      expect(searchQuery.value).toBe('Banana')
      expect(filteredItems.value).toHaveLength(1)
      expect(filteredItems.value[0].name).toBe('Banana')
    })
  })

  describe('响应式更新', () => {
    it('当项目列表变化时应该重新过滤', () => {
      const items: Ref<Product[]> = ref(createProducts())
      const { searchQuery, filteredItems } = useSearch(items, {
        searchFields: item => [item.name],
      })

      searchQuery.value = 'Apple'
      expect(filteredItems.value).toHaveLength(1)

      items.value = [
        { id: 6, name: 'Apple Pie', description: 'Delicious pie', category: 'Dessert' },
        { id: 7, name: 'Apple Juice', description: 'Fresh juice', category: 'Drink' },
      ]

      expect(filteredItems.value).toHaveLength(2)
    })

    it('当搜索查询变化时应该重新过滤', () => {
      const items = ref(createProducts())
      const { searchQuery, filteredItems } = useSearch(items, {
        searchFields: item => [item.category],
      })

      searchQuery.value = 'Fruit'
      expect(filteredItems.value).toHaveLength(3)

      searchQuery.value = 'Vegetable'
      expect(filteredItems.value).toHaveLength(2)
    })
  })

  describe('边界情况', () => {
    it('应该处理空列表', () => {
      const items = ref<Product[]>([])
      const { searchQuery, filteredItems } = useSearch(items, {
        searchFields: item => [item.name],
      })

      searchQuery.value = 'Apple'
      expect(filteredItems.value).toEqual([])
    })

    it('应该处理没有匹配的情况', () => {
      const items = ref(createProducts())
      const { searchQuery, filteredItems, matchCount } = useSearch(items, {
        searchFields: item => [item.name],
      })

      searchQuery.value = 'NotExist'
      expect(filteredItems.value).toEqual([])
      expect(matchCount.value).toBe(0)
    })

    it('应该处理特殊字符', () => {
      const items = ref<Product[]>([
        { id: 1, name: 'C++ Programming', description: 'Learn C++', category: 'Book' },
        { id: 2, name: 'JavaScript (ES6)', description: 'Modern JS', category: 'Book' },
      ])

      const { searchQuery, filteredItems } = useSearch(items, {
        searchFields: item => [item.name],
      })

      searchQuery.value = 'C++'
      expect(filteredItems.value).toHaveLength(1)
      expect(filteredItems.value[0].name).toBe('C++ Programming')

      searchQuery.value = '(ES6)'
      expect(filteredItems.value).toHaveLength(1)
      expect(filteredItems.value[0].name).toBe('JavaScript (ES6)')
    })
  })
})
