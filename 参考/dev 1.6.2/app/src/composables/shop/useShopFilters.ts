/**
 * @file useShopFilters.ts
 * @description 商店筛选 Composable - 提供商品的搜索、分类筛选和排序功能
 * @author Eden System Team
 */

import { ref, computed, type Ref } from 'vue'
import type { Item } from '../../types'
import type { SelectOption } from '../../components/common/CustomSelect.vue'

/**
 * 商品项（带 id）
 */
export interface ShopItem extends Item {
  id: string
}

/**
 * 排序选项类型
 */
export type SortOption = 'default' | 'name' | 'price-asc' | 'price-desc'

/**
 * 商店筛选配置选项
 */
export interface UseShopFiltersOptions {
  /**
   * 初始分类筛选
   * @default 'all'
   */
  initialCategory?: string
  /**
   * 初始排序方式
   * @default 'default'
   */
  initialSort?: SortOption
}

/**
 * 商店筛选返回值
 */
export interface UseShopFiltersReturn {
  /**
   * 当前选中的分类
   */
  filterCategory: Ref<string>
  /**
   * 当前排序方式
   */
  sortBy: Ref<SortOption>
  /**
   * 所有可用分类列表
   */
  categories: Ref<string[]>
  /**
   * 分类下拉选项
   */
  categoryOptions: Ref<SelectOption[]>
  /**
   * 排序下拉选项
   */
  sortOptions: SelectOption[]
  /**
   * 筛选和排序后的商品列表
   */
  filteredAndSortedItems: Ref<ShopItem[]>
  /**
   * 重置筛选条件
   */
  resetFilters: () => void
}

/**
 * 商店筛选和排序 Composable
 *
 * 提供商品筛选（按分类）和排序功能
 *
 * @param items 商品列表（响应式引用）
 * @param searchedItems 搜索后的商品列表（响应式引用）
 * @param options 配置选项
 * @returns 筛选和排序相关的状态和方法
 *
 * @example
 * ```ts
 * const items = ref<ShopItem[]>([...])
 * const { filteredItems: searchedItems } = useSearch(items, {...})
 * const {
 *   filterCategory,
 *   sortBy,
 *   categoryOptions,
 *   sortOptions,
 *   filteredAndSortedItems
 * } = useShopFilters(items, searchedItems)
 * ```
 */
export function useShopFilters(
  items: Ref<ShopItem[]>,
  searchedItems: Ref<ShopItem[]>,
  options: UseShopFiltersOptions = {}
): UseShopFiltersReturn {
  const { initialCategory = 'all', initialSort = 'default' } = options

  // State
  const filterCategory = ref(initialCategory)
  const sortBy = ref<SortOption>(initialSort)

  // 获取所有分类
  const categories = computed(() => {
    const cats = new Set<string>()
    items.value.forEach(item => {
      if (item.category) {
        cats.add(item.category)
      }
    })
    return Array.from(cats).sort()
  })

  // 分类下拉选项
  const categoryOptions = computed<SelectOption[]>(() => [
    { value: 'all', label: '全部分类' },
    ...categories.value.map(cat => ({ value: cat, label: cat })),
  ])

  // 排序下拉选项（静态）
  const sortOptions: SelectOption[] = [
    { value: 'default', label: '默认排序' },
    { value: 'name', label: '按名称' },
    { value: 'price-asc', label: '价格从低到高' },
    { value: 'price-desc', label: '价格从高到低' },
  ]

  // 按分类筛选
  const categoryFilteredItems = computed(() => {
    if (filterCategory.value === 'all') {
      return searchedItems.value
    }
    return searchedItems.value.filter(item => item.category === filterCategory.value)
  })

  // 排序
  const sortedItems = computed(() => {
    const itemsToSort = categoryFilteredItems.value

    if (sortBy.value === 'name') {
      return [...itemsToSort].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
    } else if (sortBy.value === 'price-asc') {
      return [...itemsToSort].sort((a, b) => a.price - b.price)
    } else if (sortBy.value === 'price-desc') {
      return [...itemsToSort].sort((a, b) => b.price - a.price)
    }

    return itemsToSort
  })

  // 最终的筛选和排序后的商品列表
  const filteredAndSortedItems = computed(() => sortedItems.value)

  // 重置筛选条件
  const resetFilters = () => {
    filterCategory.value = 'all'
    sortBy.value = 'default'
  }

  return {
    filterCategory,
    sortBy,
    categories,
    categoryOptions,
    sortOptions,
    filteredAndSortedItems,
    resetFilters,
  }
}
