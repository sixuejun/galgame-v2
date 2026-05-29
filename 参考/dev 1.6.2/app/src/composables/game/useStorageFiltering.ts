/**
 * @file useStorageFiltering.ts
 * @description 存储页面筛选 Composable - 提供物品筛选、排序和分页功能
 * @author Eden System Team
 */

import { ref, computed, watch, type Ref } from 'vue'
import type { Item } from '../../types'
import type { SelectOption } from '../../components/common/CustomSelect.vue'
import { debounce } from '../../utils/debounce'

/**
 * 存储页面筛选和分页逻辑的 Composable
 *
 * 提供物品的搜索、分类筛选、排序和分页功能。
 *
 * @param inventoryArray 物品数组的响应式引用
 * @returns 筛选和分页相关的状态和方法
 */
export function useStorageFiltering(inventoryArray: Ref<Item[]>) {
  // 搜索和筛选状态
  const searchQuery = ref('')
  const searchQueryDebounced = ref('')
  const filterCategory = ref('all')
  const sortBy = ref('default')

  // 分页相关
  const ITEMS_PER_PAGE = 24 // 每页显示24个物品
  const currentPage = ref(1)
  const isLoading = ref(false)

  // 获取所有分类
  const categories = computed(() => {
    const cats = new Set<string>()
    inventoryArray.value.forEach(item => {
      if (item.category) {
        cats.add(item.category)
      }
    })
    return Array.from(cats).sort()
  })

  // 下拉菜单选项
  const categoryOptions = computed<SelectOption[]>(() => [
    { value: 'all', label: '全部分类' },
    ...categories.value.map(cat => ({ value: cat, label: cat })),
  ])

  const sortOptions: SelectOption[] = [
    { value: 'default', label: '默认排序' },
    { value: 'name', label: '按名称' },
    { value: 'quantity', label: '按数量' },
  ]

  // 按搜索关键词筛选的物品列表
  const searchedInventory = computed(() => {
    if (!searchQueryDebounced.value.trim()) {
      return inventoryArray.value
    }

    const query = searchQueryDebounced.value.toLowerCase()
    return inventoryArray.value.filter(
      item =>
        item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
    )
  })

  // 按分类筛选的物品列表
  const categoryFilteredInventory = computed(() => {
    if (filterCategory.value === 'all') {
      return searchedInventory.value
    }

    return searchedInventory.value.filter(item => item.category === filterCategory.value)
  })

  // 排序后的物品列表
  const sortedInventory = computed(() => {
    const items = categoryFilteredInventory.value

    if (sortBy.value === 'name') {
      return [...items].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
    } else if (sortBy.value === 'quantity') {
      return [...items].sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
    }

    return items
  })

  // 最终的筛选和排序后的物品列表
  const filteredInventory = computed(() => sortedInventory.value)

  // 分页计算
  const totalItems = computed(() => filteredInventory.value.length)
  const totalPages = computed(() => Math.ceil(totalItems.value / ITEMS_PER_PAGE))

  // 分页后的物品列表
  const paginatedInventory = computed(() => {
    const start = (currentPage.value - 1) * ITEMS_PER_PAGE
    const end = start + ITEMS_PER_PAGE
    return filteredInventory.value.slice(start, end)
  })

  // 跳转到指定页
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      // 显示加载状态
      isLoading.value = true

      // 模拟加载延迟以展示骨架屏效果
      setTimeout(() => {
        currentPage.value = page
        isLoading.value = false
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 300)
    }
  }

  // 防抖更新搜索查询
  const updateSearchQueryDebounced = debounce((value: string) => {
    searchQueryDebounced.value = value
  }, 300)

  // 监听搜索查询变化，使用防抖更新
  watch(searchQuery, newValue => {
    updateSearchQueryDebounced(newValue)
  })

  return {
    // 状态
    searchQuery,
    filterCategory,
    sortBy,
    currentPage,
    isLoading,

    // 选项
    categoryOptions,
    sortOptions,

    // 计算属性
    filteredInventory,
    paginatedInventory,
    totalPages,

    // 方法
    goToPage,
  }
}
