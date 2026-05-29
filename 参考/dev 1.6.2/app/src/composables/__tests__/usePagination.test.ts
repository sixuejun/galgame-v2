import { describe, it, expect, beforeEach } from 'vitest'
import { ref, type Ref } from 'vue'
import { usePagination } from '../ui/usePagination'

describe('usePagination', () => {
  describe('基本功能', () => {
    it('应该正确初始化默认值', () => {
      const items = ref([1, 2, 3, 4, 5])
      const { currentPage, itemsPerPage, totalPages } = usePagination(items)

      expect(currentPage.value).toBe(1)
      expect(itemsPerPage.value).toBe(10)
      expect(totalPages.value).toBe(1)
    })

    it('应该接受自定义配置', () => {
      const items = ref([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      const { currentPage, itemsPerPage, totalPages } = usePagination(items, {
        itemsPerPage: 3,
        initialPage: 2,
      })

      expect(currentPage.value).toBe(2)
      expect(itemsPerPage.value).toBe(3)
      expect(totalPages.value).toBe(4)
    })

    it('应该正确计算总页数', () => {
      const items = ref([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      const { totalPages } = usePagination(items, { itemsPerPage: 3 })

      expect(totalPages.value).toBe(4) // 10 items / 3 per page = 4 pages
    })

    it('空列表应该返回0页', () => {
      const items = ref([])
      const { totalPages } = usePagination(items)

      expect(totalPages.value).toBe(0)
    })
  })

  describe('分页项目', () => {
    it('应该返回第一页的项目', () => {
      const items = ref([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      const { paginatedItems } = usePagination(items, { itemsPerPage: 3 })

      expect(paginatedItems.value).toEqual([1, 2, 3])
    })

    it('应该返回中间页的项目', () => {
      const items = ref([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      const { paginatedItems, goToPage } = usePagination(items, { itemsPerPage: 3 })

      goToPage(2)
      expect(paginatedItems.value).toEqual([4, 5, 6])
    })

    it('应该返回最后一页的项目（不足一页）', () => {
      const items = ref([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      const { paginatedItems, goToPage } = usePagination(items, { itemsPerPage: 3 })

      goToPage(4)
      expect(paginatedItems.value).toEqual([10])
    })

    it('空列表应该返回空数组', () => {
      const items = ref([])
      const { paginatedItems } = usePagination(items)

      expect(paginatedItems.value).toEqual([])
    })
  })

  describe('页面导航', () => {
    let items: Ref<number[]>
    let pagination: ReturnType<typeof usePagination<number>>

    beforeEach(() => {
      items = ref<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      pagination = usePagination(items, { itemsPerPage: 3 })
    })

    it('goToPage 应该跳转到指定页', () => {
      const { currentPage, goToPage } = pagination

      goToPage(3)
      expect(currentPage.value).toBe(3)
    })

    it('goToPage 不应该跳转到无效页码（小于1）', () => {
      const { currentPage, goToPage } = pagination

      goToPage(0)
      expect(currentPage.value).toBe(1) // 保持在第一页
    })

    it('goToPage 不应该跳转到无效页码（大于总页数）', () => {
      const { currentPage, goToPage, totalPages } = pagination

      goToPage(999)
      expect(currentPage.value).toBe(1) // 保持在第一页
      expect(totalPages.value).toBe(4)
    })

    it('nextPage 应该跳转到下一页', () => {
      const { currentPage, nextPage } = pagination

      nextPage()
      expect(currentPage.value).toBe(2)

      nextPage()
      expect(currentPage.value).toBe(3)
    })

    it('nextPage 在最后一页时不应该继续跳转', () => {
      const { currentPage, goToPage, nextPage, totalPages } = pagination

      goToPage(totalPages.value)
      const lastPage = currentPage.value

      nextPage()
      expect(currentPage.value).toBe(lastPage) // 保持在最后一页
    })

    it('prevPage 应该跳转到上一页', () => {
      const { currentPage, goToPage, prevPage } = pagination

      goToPage(3)
      prevPage()
      expect(currentPage.value).toBe(2)

      prevPage()
      expect(currentPage.value).toBe(1)
    })

    it('prevPage 在第一页时不应该继续跳转', () => {
      const { currentPage, prevPage } = pagination

      prevPage()
      expect(currentPage.value).toBe(1) // 保持在第一页
    })

    it('resetPage 应该重置到第一页', () => {
      const { currentPage, goToPage, resetPage } = pagination

      goToPage(3)
      expect(currentPage.value).toBe(3)

      resetPage()
      expect(currentPage.value).toBe(1)
    })
  })

  describe('页面状态', () => {
    it('isFirstPage 应该正确判断是否是第一页', () => {
      const items = ref([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      const { isFirstPage, goToPage } = usePagination(items, { itemsPerPage: 3 })

      expect(isFirstPage.value).toBe(true)

      goToPage(2)
      expect(isFirstPage.value).toBe(false)

      goToPage(1)
      expect(isFirstPage.value).toBe(true)
    })

    it('isLastPage 应该正确判断是否是最后一页', () => {
      const items = ref([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      const { isLastPage, goToPage, totalPages } = usePagination(items, { itemsPerPage: 3 })

      expect(isLastPage.value).toBe(false)

      goToPage(totalPages.value)
      expect(isLastPage.value).toBe(true)

      goToPage(1)
      expect(isLastPage.value).toBe(false)
    })
  })

  describe('响应式更新', () => {
    it('当项目列表变化时应该重新计算总页数', () => {
      const items = ref([1, 2, 3, 4, 5])
      const { totalPages } = usePagination(items, { itemsPerPage: 2 })

      expect(totalPages.value).toBe(3)

      items.value = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      expect(totalPages.value).toBe(5)
    })

    it('当项目列表变化时应该重新计算分页项目', () => {
      const items = ref([1, 2, 3, 4, 5])
      const { paginatedItems } = usePagination(items, { itemsPerPage: 2 })

      expect(paginatedItems.value).toEqual([1, 2])

      items.value = [10, 20, 30, 40, 50]
      expect(paginatedItems.value).toEqual([10, 20])
    })

    it('当项目列表减少导致当前页超出范围时，分页项目应该为空', () => {
      const items = ref([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      const { paginatedItems, goToPage } = usePagination(items, { itemsPerPage: 3 })

      goToPage(4)
      expect(paginatedItems.value).toEqual([10])

      items.value = [1, 2, 3]
      expect(paginatedItems.value).toEqual([]) // 第4页已经不存在
    })
  })

  describe('边界情况', () => {
    it('应该处理只有一个项目的列表', () => {
      const items = ref([1])
      const { totalPages, paginatedItems } = usePagination(items, { itemsPerPage: 10 })

      expect(totalPages.value).toBe(1)
      expect(paginatedItems.value).toEqual([1])
    })

    it('应该处理项目数量正好等于每页数量的情况', () => {
      const items = ref([1, 2, 3, 4, 5])
      const { totalPages, paginatedItems } = usePagination(items, { itemsPerPage: 5 })

      expect(totalPages.value).toBe(1)
      expect(paginatedItems.value).toEqual([1, 2, 3, 4, 5])
    })

    it('应该处理复杂对象的分页', () => {
      interface User {
        id: number
        name: string
      }

      const users = ref<User[]>([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
        { id: 4, name: 'David' },
      ])

      const { paginatedItems } = usePagination(users, { itemsPerPage: 2 })

      expect(paginatedItems.value).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ])
    })
  })
})
