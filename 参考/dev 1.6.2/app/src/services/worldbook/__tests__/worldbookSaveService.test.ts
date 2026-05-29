import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { WorldbookSaveService } from '../worldbookSaveService'
import { WorldbookConnectionService } from '../worldbookConnectionService'
import * as yaml from 'js-yaml'
import type { GameData, WorldbookEntry } from '../../../types'

// 在测试环境中，window 是由测试框架提供的全局对象

// Mock logger
vi.mock('../../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

// Mock WorldbookApi
vi.mock('../../api/worldbookApi', () => ({
  WorldbookApi: {
    isAvailable: vi.fn(),
    getWorldbook: vi.fn(),
    updateWorldbookWith: vi.fn(),
  },
}))

// Mock WorldbookConnectionService
vi.mock('../worldbookConnectionService', async () => {
  const actual = await vi.importActual<typeof import('../worldbookConnectionService')>(
    '../worldbookConnectionService'
  )
  return {
    ...actual,
    WorldbookConnectionService: {
      isJSSlashRunnerAvailable: vi.fn(),
      ensureWorldbookExists: vi.fn(),
    },
  }
})

describe('WorldbookSaveService', () => {
  // Import WorldbookApi to access mocked functions
  let WorldbookApi: typeof import('../../api/worldbookApi').WorldbookApi

  beforeEach(async () => {
    // Get the mocked WorldbookApi
    WorldbookApi = (await import('../../api/worldbookApi')).WorldbookApi
    vi.clearAllMocks()

    // Default mock implementations
    vi.mocked(WorldbookApi.isAvailable).mockReturnValue(true)
    vi.mocked(WorldbookConnectionService.isJSSlashRunnerAvailable).mockReturnValue(true)
    vi.mocked(WorldbookConnectionService.ensureWorldbookExists).mockResolvedValue('test-worldbook')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const createMockGameData = (): GameData => ({
    config: {
      version: '1.0.0',
      phase: '测试阶段',
      home: {
        title: '测试游戏',
        subtitle: '测试副标题',
      },
    },
    story: {
      content: '测试故事内容',
      location: '测试地点',
    },
  })

  const createMockWorldbookEntry = (name: string, content: string) => ({
    name,
    content,
    enabled: false,
    strategy: {
      type: 'constant' as const,
      keys: [],
      keys_secondary: { logic: 'AND' as const, keys: [] },
      scan_depth: '0',
    },
    position: {
      type: 'after_char' as const,
      role: 'system' as const,
      depth: 0,
    },
  })

  describe('getNextSaveNumber', () => {
    it('环境不可用时应该返回 1', async () => {
      vi.mocked(WorldbookConnectionService.isJSSlashRunnerAvailable).mockReturnValue(false)

      const result = await WorldbookSaveService.getNextSaveNumber()

      expect(result).toBe(1)
    })

    it('没有存档时应该返回 1', async () => {
      vi.mocked(WorldbookApi.getWorldbook).mockResolvedValue([])

      const result = await WorldbookSaveService.getNextSaveNumber()

      expect(result).toBe(1)
    })

    it('有存档时应该返回最大编号 + 1', async () => {
      const mockWorldbook = [
        createMockWorldbookEntry('存档数据1', 'content'),
        createMockWorldbookEntry('存档数据3', 'content'),
        createMockWorldbookEntry('存档数据2', 'content'),
      ]
      vi.mocked(WorldbookApi.getWorldbook).mockResolvedValue(mockWorldbook)

      const result = await WorldbookSaveService.getNextSaveNumber()

      expect(result).toBe(4)
    })

    it('应该忽略非存档条目', async () => {
      const mockWorldbook = [
        createMockWorldbookEntry('存档数据1', 'content'),
        createMockWorldbookEntry('自动存档数据', 'content'),
        createMockWorldbookEntry('初始化数据', 'content'),
        createMockWorldbookEntry('其他条目', 'content'),
      ]
      vi.mocked(WorldbookApi.getWorldbook).mockResolvedValue(mockWorldbook)

      const result = await WorldbookSaveService.getNextSaveNumber()

      expect(result).toBe(2)
    })

    it('获取失败时应该返回 1', async () => {
      vi.mocked(WorldbookConnectionService.ensureWorldbookExists).mockRejectedValue(
        new Error('Test error')
      )

      const result = await WorldbookSaveService.getNextSaveNumber()

      expect(result).toBe(1)
    })
  })

  describe('manualSave', () => {
    it('环境不可用时应该抛出错误', async () => {
      vi.mocked(WorldbookConnectionService.isJSSlashRunnerAvailable).mockReturnValue(false)

      await expect(WorldbookSaveService.manualSave(createMockGameData())).rejects.toThrow(
        'JS-Slash-Runner 环境不可用'
      )
    })

    it('应该使用指定的存档编号', async () => {
      const mockGameData = createMockGameData()
      vi.mocked(WorldbookApi.getWorldbook).mockResolvedValue([])
      vi.mocked(WorldbookApi.updateWorldbookWith).mockImplementation(
        async (_name: string, updater: (entries: WorldbookEntry[]) => WorldbookEntry[] | void) => {
          updater([])
        }
      )

      const result = await WorldbookSaveService.manualSave(mockGameData, 5)

      expect(result).toBe('存档数据5')
    })

    it('未指定编号时应该自动分配', async () => {
      const mockGameData = createMockGameData()
      const mockWorldbook = [
        createMockWorldbookEntry('存档数据1', 'content'),
        createMockWorldbookEntry('存档数据2', 'content'),
      ]
      vi.mocked(WorldbookApi.getWorldbook).mockResolvedValue(mockWorldbook)
      vi.mocked(WorldbookApi.updateWorldbookWith).mockImplementation(
        async (_name: string, updater: (entries: WorldbookEntry[]) => WorldbookEntry[] | void) => {
          updater(mockWorldbook)
        }
      )

      const result = await WorldbookSaveService.manualSave(mockGameData)

      expect(result).toBe('存档数据3')
    })

    it('应该创建新的存档条目', async () => {
      const mockGameData = createMockGameData()
      vi.mocked(WorldbookApi.getWorldbook).mockResolvedValue([])
      vi.mocked(WorldbookApi.updateWorldbookWith).mockImplementation(
        async (_name: string, updater: (entries: WorldbookEntry[]) => WorldbookEntry[] | void) => {
          updater([])
        }
      )

      await WorldbookSaveService.manualSave(mockGameData, 1)

      expect(WorldbookApi.updateWorldbookWith).toHaveBeenCalled()
      const updateCall = vi.mocked(WorldbookApi.updateWorldbookWith).mock.calls[0]
      const updater = updateCall[1]
      const updatedWorldbook = updater([])

      expect(updatedWorldbook).toHaveLength(1)
      expect(updatedWorldbook![0].name).toBe('存档数据1')
      expect(updatedWorldbook![0].enabled).toBe(false)
    })

    it('应该更新现有的存档条目', async () => {
      const mockGameData = createMockGameData()
      const existingEntry = createMockWorldbookEntry('存档数据1', 'old content')
      vi.mocked(WorldbookApi.getWorldbook).mockResolvedValue([existingEntry])
      vi.mocked(WorldbookApi.updateWorldbookWith).mockImplementation(
        async (_name: string, updater: (entries: WorldbookEntry[]) => WorldbookEntry[] | void) => {
          updater([existingEntry])
        }
      )

      await WorldbookSaveService.manualSave(mockGameData, 1)

      const updateCall = vi.mocked(WorldbookApi.updateWorldbookWith).mock.calls[0]
      const updater = updateCall[1]
      const updatedWorldbook = updater([existingEntry])

      expect(updatedWorldbook).toHaveLength(1)
      expect(updatedWorldbook![0].content).not.toBe('old content')
    })

    it('保存的数据应该包含元信息', async () => {
      const mockGameData = createMockGameData()
      vi.mocked(WorldbookApi.getWorldbook).mockResolvedValue([])
      vi.mocked(WorldbookApi.updateWorldbookWith).mockImplementation(
        async (_name: string, updater: (entries: WorldbookEntry[]) => WorldbookEntry[] | void) => {
          updater([])
        }
      )

      await WorldbookSaveService.manualSave(mockGameData, 1)

      const updateCall = vi.mocked(WorldbookApi.updateWorldbookWith).mock.calls[0]
      const updater = updateCall[1]
      const updatedWorldbook = updater([])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const savedData = yaml.load(updatedWorldbook![0].content) as any

      expect(savedData._saveInfo).toBeDefined()
      expect(savedData._saveInfo.saveTime).toBeDefined()
      expect(savedData._saveInfo.saveNumber).toBe(1)
      expect(savedData._saveInfo.version).toBe('1.0.0')
      expect(savedData._saveInfo.phase).toBe('测试阶段')
    })

    it('保存失败时应该抛出错误', async () => {
      vi.mocked(WorldbookConnectionService.ensureWorldbookExists).mockRejectedValue(
        new Error('Test error')
      )

      await expect(WorldbookSaveService.manualSave(createMockGameData())).rejects.toThrow(
        'Test error'
      )
    })
  })

  describe('getAllSaves', () => {
    it('环境不可用时应该返回空数组', async () => {
      vi.mocked(WorldbookConnectionService.isJSSlashRunnerAvailable).mockReturnValue(false)

      const result = await WorldbookSaveService.getAllSaves()

      expect(result).toEqual([])
    })

    it('应该返回所有存档信息', async () => {
      const mockGameData = createMockGameData()
      const saveData = {
        ...mockGameData,
        _saveInfo: {
          saveTime: '2024-01-01T00:00:00.000Z',
          version: '1.0.0',
          phase: '测试阶段',
        },
      }

      const mockWorldbook = [
        createMockWorldbookEntry('自动存档数据', yaml.dump(saveData)),
        createMockWorldbookEntry('初始化数据', yaml.dump(saveData)),
        createMockWorldbookEntry(
          '存档数据1',
          yaml.dump({ ...saveData, _saveInfo: { ...saveData._saveInfo, saveNumber: 1 } })
        ),
        createMockWorldbookEntry(
          '存档数据2',
          yaml.dump({ ...saveData, _saveInfo: { ...saveData._saveInfo, saveNumber: 2 } })
        ),
      ]
      vi.mocked(WorldbookApi.getWorldbook).mockResolvedValue(mockWorldbook)

      const result = await WorldbookSaveService.getAllSaves()

      expect(result).toHaveLength(4)
      expect(result[0].saveType).toBe('auto')
      expect(result[1].saveType).toBe('init')
      expect(result[2].saveType).toBe('manual')
      expect(result[2].number).toBe(2) // 降序排列
      expect(result[3].saveType).toBe('manual')
      expect(result[3].number).toBe(1)
    })

    it('应该忽略非存档条目', async () => {
      const mockGameData = createMockGameData()
      const mockWorldbook = [
        createMockWorldbookEntry('自动存档数据', yaml.dump(mockGameData)),
        createMockWorldbookEntry('其他条目', yaml.dump(mockGameData)),
      ]
      vi.mocked(WorldbookApi.getWorldbook).mockResolvedValue(mockWorldbook)

      const result = await WorldbookSaveService.getAllSaves()

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('自动存档数据')
    })

    it('解析失败的存档应该被跳过', async () => {
      const mockGameData = createMockGameData()
      const mockWorldbook = [
        createMockWorldbookEntry('自动存档数据', yaml.dump(mockGameData)),
        createMockWorldbookEntry('存档数据1', '{ invalid yaml: [content'),
      ]
      vi.mocked(WorldbookApi.getWorldbook).mockResolvedValue(mockWorldbook)

      const result = await WorldbookSaveService.getAllSaves()

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('自动存档数据')
    })

    it('获取失败时应该返回空数组', async () => {
      vi.mocked(WorldbookConnectionService.ensureWorldbookExists).mockRejectedValue(
        new Error('Test error')
      )

      const result = await WorldbookSaveService.getAllSaves()

      expect(result).toEqual([])
    })
  })

  describe('loadSave', () => {
    it('环境不可用时应该抛出错误', async () => {
      vi.mocked(WorldbookConnectionService.isJSSlashRunnerAvailable).mockReturnValue(false)

      await expect(WorldbookSaveService.loadSave('存档数据1')).rejects.toThrow(
        'JS-Slash-Runner 环境不可用'
      )
    })

    it('未找到存档时应该返回 null', async () => {
      vi.mocked(WorldbookApi.getWorldbook).mockResolvedValue([])

      const result = await WorldbookSaveService.loadSave('存档数据1')

      expect(result).toBeNull()
    })

    it('应该成功加载存档', async () => {
      const mockGameData = createMockGameData()
      const saveData = {
        ...mockGameData,
        _saveInfo: {
          saveTime: '2024-01-01T00:00:00.000Z',
          saveNumber: 1,
        },
      }
      const mockWorldbook = [createMockWorldbookEntry('存档数据1', yaml.dump(saveData))]
      vi.mocked(WorldbookApi.getWorldbook).mockResolvedValue(mockWorldbook)

      const result = await WorldbookSaveService.loadSave('存档数据1')

      expect(result).toBeDefined()
      expect(result?.config?.home?.title).toBe('测试游戏')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result as any)._saveInfo).toBeUndefined() // 元信息应该被移除
    })

    it('加载失败时应该抛出错误', async () => {
      vi.mocked(WorldbookApi.getWorldbook).mockRejectedValue(new Error('Test error'))

      await expect(WorldbookSaveService.loadSave('存档数据1')).rejects.toThrow('Test error')
    })
  })

  describe('deleteSave', () => {
    it('环境不可用时应该抛出错误', async () => {
      vi.mocked(WorldbookConnectionService.isJSSlashRunnerAvailable).mockReturnValue(false)

      await expect(WorldbookSaveService.deleteSave('存档数据1')).rejects.toThrow(
        'JS-Slash-Runner 环境不可用'
      )
    })

    it('未找到存档时应该直接返回', async () => {
      vi.mocked(WorldbookApi.getWorldbook).mockResolvedValue([])

      await WorldbookSaveService.deleteSave('存档数据1')

      expect(WorldbookApi.updateWorldbookWith).not.toHaveBeenCalled()
    })

    it('应该成功删除存档', async () => {
      const mockWorldbook = [
        createMockWorldbookEntry('存档数据1', 'content'),
        createMockWorldbookEntry('存档数据2', 'content'),
      ]
      vi.mocked(WorldbookApi.getWorldbook).mockResolvedValue(mockWorldbook)
      vi.mocked(WorldbookApi.updateWorldbookWith).mockImplementation(
        async (_name: string, updater: (entries: WorldbookEntry[]) => WorldbookEntry[] | void) => {
          updater(mockWorldbook)
        }
      )

      await WorldbookSaveService.deleteSave('存档数据1')

      expect(WorldbookApi.updateWorldbookWith).toHaveBeenCalled()
      const updateCall = vi.mocked(WorldbookApi.updateWorldbookWith).mock.calls[0]
      const updater = updateCall[1]
      const updatedWorldbook = updater(mockWorldbook)

      expect(updatedWorldbook).toHaveLength(1)
      expect(updatedWorldbook![0].name).toBe('存档数据2')
    })

    it('删除失败时应该抛出错误', async () => {
      vi.mocked(WorldbookApi.getWorldbook).mockRejectedValue(new Error('Test error'))

      await expect(WorldbookSaveService.deleteSave('存档数据1')).rejects.toThrow('Test error')
    })
  })

  describe('clearAllSaves', () => {
    it('环境不可用时应该抛出错误', async () => {
      vi.mocked(WorldbookConnectionService.isJSSlashRunnerAvailable).mockReturnValue(false)

      await expect(WorldbookSaveService.clearAllSaves()).rejects.toThrow(
        'JS-Slash-Runner 环境不可用'
      )
    })

    it('应该清空所有游戏相关条目', async () => {
      const mockWorldbook = [
        createMockWorldbookEntry('自动存档数据', 'content'),
        createMockWorldbookEntry('初始化数据', 'content'),
        createMockWorldbookEntry('存档数据1', 'content'),
        createMockWorldbookEntry('存档数据2', 'content'),
        createMockWorldbookEntry('其他世界书条目', 'content'),
      ]
      vi.mocked(WorldbookApi.getWorldbook).mockResolvedValue(mockWorldbook)
      vi.mocked(WorldbookApi.updateWorldbookWith).mockImplementation(
        async (_name: string, updater: (entries: WorldbookEntry[]) => WorldbookEntry[] | void) => {
          updater(mockWorldbook)
        }
      )

      await WorldbookSaveService.clearAllSaves()

      expect(WorldbookApi.updateWorldbookWith).toHaveBeenCalled()
      const updateCall = vi.mocked(WorldbookApi.updateWorldbookWith).mock.calls[0]
      const updater = updateCall[1]
      const updatedWorldbook = updater(mockWorldbook)

      expect(updatedWorldbook).toHaveLength(1)
      expect(updatedWorldbook![0].name).toBe('其他世界书条目')
    })

    it('清空失败时应该抛出错误', async () => {
      vi.mocked(WorldbookApi.getWorldbook).mockRejectedValue(new Error('Test error'))

      await expect(WorldbookSaveService.clearAllSaves()).rejects.toThrow('Test error')
    })
  })
})
