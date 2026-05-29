/**
 * @file useSearch.ts
 * @description 搜索功能 Composable - 提供通用的搜索和过滤功能
 * @author Eden System Team
 */

import { ref, computed, type Ref } from 'vue'

/**
 * 搜索配置选项
 */
export interface UseSearchOptions<T> {
  /**
   * 搜索字段提取函数
   * 从项目中提取需要搜索的字段数组
   * @param item 项目对象
   * @returns 需要搜索的字段数组
   */
  searchFields: (item: T) => string[]
  /**
   * 是否区分大小写
   * @default false
   */
  caseSensitive?: boolean
  /**
   * 初始搜索查询
   * @default ''
   */
  initialQuery?: string
}

/**
 * 搜索返回值
 */
export interface UseSearchReturn<T> {
  /**
   * 搜索查询字符串
   */
  searchQuery: Ref<string>
  /**
   * 过滤后的项目列表
   */
  filteredItems: Ref<T[]>
  /**
   * 清空搜索查询
   */
  clearSearch: () => void
  /**
   * 设置搜索查询
   * @param query 搜索查询字符串
   */
  setSearchQuery: (query: string) => void
  /**
   * 是否有搜索查询
   */
  hasQuery: Ref<boolean>
  /**
   * 匹配的项目数量
   */
  matchCount: Ref<number>
}

/**
 * 通用搜索 Composable
 *
 * 提供搜索功能，支持多字段搜索、大小写敏感等
 *
 * @template T 项目类型
 * @param items 需要搜索的项目列表（响应式引用）
 * @param options 搜索配置选项
 * @returns 搜索相关的状态和方法
 *
 * @example
 * ```ts
 * interface Product {
 *   name: string
 *   description: string
 *   category: string
 * }
 *
 * const products = ref<Product[]>([...])
 * const {
 *   searchQuery,
 *   filteredItems,
 *   clearSearch
 * } = useSearch(products, {
 *   searchFields: (item) => [item.name, item.description]
 * })
 * ```
 */
export function useSearch<T>(items: Ref<T[]>, options: UseSearchOptions<T>): UseSearchReturn<T> {
  const { searchFields, caseSensitive = false, initialQuery = '' } = options

  // State
  const searchQuery = ref(initialQuery)

  // Computed
  const hasQuery = computed(() => searchQuery.value.trim().length > 0)

  const filteredItems = computed(() => {
    if (!hasQuery.value) {
      return items.value
    }

    const query = caseSensitive ? searchQuery.value.trim() : searchQuery.value.toLowerCase().trim()

    return items.value.filter(item => {
      const fields = searchFields(item)
      return fields.some(field => {
        if (!field) return false
        const fieldValue = caseSensitive ? field : field.toLowerCase()
        return fieldValue.includes(query)
      })
    })
  })

  const matchCount = computed(() => filteredItems.value.length)

  // Methods
  const clearSearch = () => {
    searchQuery.value = ''
  }

  const setSearchQuery = (query: string) => {
    searchQuery.value = query
  }

  return {
    searchQuery,
    filteredItems,
    clearSearch,
    setSearchQuery,
    hasQuery,
    matchCount,
  }
}
