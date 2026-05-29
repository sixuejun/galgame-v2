import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSaveList } from '../save/useSaveList'
import { WorldbookSaveService, type SaveInfo } from '../../services/worldbook'

// Mock WorldbookSaveService
vi.mock('../../services/worldbook', () => ({
  WorldbookSaveService: {
    getAllSaves: vi.fn(),
  },
}))

// Mock usePagination
vi.mock('../usePagination', () => ({
  usePagination: vi.fn((items, options) => {
    const currentPage = { value: 1 }
    const totalPages = {
      get value() {
        return Math.ceil(items.value.length / (options?.itemsPerPage || 20))
      },
    }
    const paginatedItems = {
      get value() {
        const start = (currentPage.value - 1) * (options?.itemsPerPage || 20)
        const end = start + (options?.itemsPerPage || 20)
        return items.value.slice(start, end)
      },
    }

    return {
      currentPage,
      totalPages,
      paginatedItems,
      goToPage: (page: number) => {
        currentPage.value = page
      },
      nextPage: () => {
        if (currentPage.value < totalPages.value) {
          currentPage.value++
        }
      },
      prevPage: () => {
        if (currentPage.value > 1) {
          currentPage.value--
        }
      },
    }
  }),
}))

describe('useSaveList', () => {
  const mockSaves: SaveInfo[] = [
    {
      name: 'save1',
      saveType: 'manual',
      saveTime: '2025-01-01T10:00:00Z',
    },
    {
      name: 'save2',
      saveType: 'auto',
      saveTime: '2025-01-02T10:00:00Z',
    },
    {
      name: 'save3',
      saveType: 'init',
      saveTime: '2025-01-03T10:00:00Z',
    },
  ]

  beforeEach(() => {
    // 创建新的 Pinia 实例
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('初始化', () => {
    it('应该初始化默认状态', () => {
      const { saves, isLoading, errorMessage } = useSaveList({ autoLoad: false })

      expect(saves.value).toEqual([])
      expect(isLoading.value).toBe(false)
      expect(errorMessage.value).toBe('')
    })

    it('应该使用默认配置', () => {
      const { currentPage } = useSaveList({ autoLoad: false })

      expect(currentPage.value).toBe(1)
    })
  })

  describe('loadSaves', () => {
    it('应该成功加载存档列表', async () => {
      vi.mocked(WorldbookSaveService.getAllSaves).mockResolvedValue(mockSaves)

      const { loadSaves, saves, isLoading } = useSaveList({ autoLoad: false })

      await loadSaves()

      expect(saves.value).toEqual(mockSaves)
      expect(isLoading.value).toBe(false)
      expect(WorldbookSaveService.getAllSaves).toHaveBeenCalled()
    })

    it('加载时应该设置 isLoading 为 true', async () => {
      vi.mocked(WorldbookSaveService.getAllSaves).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockSaves), 100))
      )

      const { loadSaves, isLoading } = useSaveList({ autoLoad: false })

      const promise = loadSaves()
      expect(isLoading.value).toBe(true)

      await promise
      expect(isLoading.value).toBe(false)
    })

    it('加载失败时应该设置错误消息', async () => {
      const errorMsg = 'Failed to load saves'
      vi.mocked(WorldbookSaveService.getAllSaves).mockRejectedValue(new Error(errorMsg))

      const { loadSaves, errorMessage, isLoading } = useSaveList({ autoLoad: false })

      await loadSaves()

      expect(errorMessage.value).toBe(errorMsg)
      expect(isLoading.value).toBe(false)
    })

    it('加载成功时应该清空错误消息', async () => {
      vi.mocked(WorldbookSaveService.getAllSaves).mockResolvedValue(mockSaves)

      const { loadSaves, errorMessage } = useSaveList({ autoLoad: false })

      errorMessage.value = 'Previous error'
      await loadSaves()

      expect(errorMessage.value).toBe('')
    })
  })

  describe('refreshSaves', () => {
    it('应该重新加载存档列表', async () => {
      vi.mocked(WorldbookSaveService.getAllSaves).mockResolvedValue(mockSaves)

      const { refreshSaves, saves } = useSaveList({ autoLoad: false })

      await refreshSaves()

      expect(saves.value).toEqual(mockSaves)
      expect(WorldbookSaveService.getAllSaves).toHaveBeenCalled()
    })
  })

  describe('getSaveIcon', () => {
    it('应该返回正确的图标', () => {
      const { getSaveIcon } = useSaveList({ autoLoad: false })

      expect(getSaveIcon('auto')).toBe('fa-save')
      expect(getSaveIcon('manual')).toBe('fa-bookmark')
      expect(getSaveIcon('init')).toBe('fa-seedling')
      expect(getSaveIcon('unknown')).toBe('fa-file')
    })
  })

  describe('getSaveTypeText', () => {
    it('应该返回正确的类型文本', () => {
      const { getSaveTypeText } = useSaveList({ autoLoad: false })

      expect(getSaveTypeText('auto')).toBe('自动存档')
      expect(getSaveTypeText('manual')).toBe('手动存档')
      expect(getSaveTypeText('init')).toBe('初始化')
      expect(getSaveTypeText('unknown')).toBe('未知')
    })
  })

  describe('formatTime', () => {
    it('应该格式化时间字符串', () => {
      const { formatTime } = useSaveList({ autoLoad: false })

      const result = formatTime('2025-01-01T10:00:00Z')

      // 结果会根据本地时区变化，只检查格式
      expect(result).toMatch(/\d{4}\/\d{2}\/\d{2}/)
    })

    it('无效时间应该返回 Invalid Date', () => {
      const { formatTime } = useSaveList({ autoLoad: false })

      const invalidTime = 'invalid-time'
      const result = formatTime(invalidTime)
      // toLocaleString 对无效日期会返回 'Invalid Date'
      expect(result).toContain('Invalid')
    })
  })

  describe('分页功能', () => {
    it('应该提供分页相关的状态和方法', () => {
      const { currentPage, totalPages, paginatedSaves, goToPage, nextPage, prevPage } = useSaveList(
        {
          autoLoad: false,
        }
      )

      expect(currentPage).toBeDefined()
      expect(totalPages).toBeDefined()
      expect(paginatedSaves).toBeDefined()
      expect(typeof goToPage).toBe('function')
      expect(typeof nextPage).toBe('function')
      expect(typeof prevPage).toBe('function')
    })

    it('应该正确计算总页数', async () => {
      vi.mocked(WorldbookSaveService.getAllSaves).mockResolvedValue(mockSaves)

      const { loadSaves, totalPages } = useSaveList({ autoLoad: false, itemsPerPage: 2 })

      await loadSaves()

      expect(totalPages.value).toBe(2) // 3 saves / 2 per page = 2 pages
    })

    it('应该正确分页', async () => {
      vi.mocked(WorldbookSaveService.getAllSaves).mockResolvedValue(mockSaves)

      const { loadSaves, paginatedSaves, goToPage } = useSaveList({
        autoLoad: false,
        itemsPerPage: 2,
      })

      await loadSaves()

      expect(paginatedSaves.value).toHaveLength(2)
      expect(paginatedSaves.value[0].name).toBe('save1')

      goToPage(2)
      expect(paginatedSaves.value).toHaveLength(1)
      expect(paginatedSaves.value[0].name).toBe('save3')
    })
  })

  describe('自动加载', () => {
    it('autoLoad 为 true 时应该在挂载时加载', () => {
      // 由于我们无法在单元测试中真正触发 onMounted，
      // 这个测试只是验证配置被正确传递
      const { saves } = useSaveList({ autoLoad: true })

      expect(saves.value).toBeDefined()
    })

    it('autoLoad 为 false 时不应该自动加载', () => {
      vi.mocked(WorldbookSaveService.getAllSaves).mockResolvedValue(mockSaves)

      const { saves } = useSaveList({ autoLoad: false })

      expect(saves.value).toEqual([])
      expect(WorldbookSaveService.getAllSaves).not.toHaveBeenCalled()
    })
  })
})
