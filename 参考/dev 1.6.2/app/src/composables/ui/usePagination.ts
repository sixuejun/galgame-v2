/**
 * @file usePagination.ts
 * @description 分页管理 Composable - 提供分页功能和状态管理
 * @author Eden System Team
 */

import { ref, computed, type Ref } from 'vue'

/**
 * 分页配置选项
 */
export interface UsePaginationOptions {
  /**
   * 每页显示的项目数量
   * @default 10
   */
  itemsPerPage?: number
  /**
   * 初始页码
   * @default 1
   */
  initialPage?: number
}

/**
 * 分页返回值
 */
export interface UsePaginationReturn<T> {
  /**
   * 当前页码（从1开始）
   */
  currentPage: Ref<number>
  /**
   * 每页显示的项目数量
   */
  itemsPerPage: Ref<number>
  /**
   * 总页数
   */
  totalPages: Ref<number>
  /**
   * 当前页的项目列表
   */
  paginatedItems: Ref<T[]>
  /**
   * 跳转到指定页
   * @param page 目标页码
   */
  goToPage: (page: number) => void
  /**
   * 跳转到下一页
   */
  nextPage: () => void
  /**
   * 跳转到上一页
   */
  prevPage: () => void
  /**
   * 重置到第一页
   */
  resetPage: () => void
  /**
   * 是否是第一页
   */
  isFirstPage: Ref<boolean>
  /**
   * 是否是最后一页
   */
  isLastPage: Ref<boolean>
}

/**
 * 通用分页 Composable
 *
 * 提供分页功能，包括页码管理、页面跳转等
 *
 * @template T 项目类型
 * @param items 需要分页的项目列表（响应式引用）
 * @param options 分页配置选项
 * @returns 分页相关的状态和方法
 *
 * @example
 * ```ts
 * const items = ref([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
 * const {
 *   currentPage,
 *   totalPages,
 *   paginatedItems,
 *   goToPage,
 *   nextPage,
 *   prevPage
 * } = usePagination(items, { itemsPerPage: 3 })
 * ```
 */
export function usePagination<T>(
  items: Ref<T[]>,
  options: UsePaginationOptions = {}
): UsePaginationReturn<T> {
  const { itemsPerPage: defaultItemsPerPage = 10, initialPage = 1 } = options

  // State
  const currentPage = ref(initialPage)
  const itemsPerPage = ref(defaultItemsPerPage)

  // Computed
  const totalPages = computed(() => {
    if (items.value.length === 0) return 0
    return Math.ceil(items.value.length / itemsPerPage.value)
  })

  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value
    return items.value.slice(start, end)
  })

  const isFirstPage = computed(() => currentPage.value === 1)
  const isLastPage = computed(() => currentPage.value === totalPages.value)

  // Methods
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  const nextPage = () => {
    goToPage(currentPage.value + 1)
  }

  const prevPage = () => {
    goToPage(currentPage.value - 1)
  }

  const resetPage = () => {
    currentPage.value = 1
  }

  return {
    currentPage,
    itemsPerPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    resetPage,
    isFirstPage,
    isLastPage,
  }
}
