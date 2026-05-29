import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { WorldbookDataService } from '../worldbookDataService'
import {
  WorldbookConnectionService,
  ENTRY_NAME_SAVE,
  ENTRY_NAME_INIT,
  WorldbookStatus,
} from '../worldbookConnectionService'
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

describe('WorldbookDataService', () => {
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

  describe('checkWorldbookData', () => {
    it('环境不可用时应该返回空状态', async () => {
      vi.mocked(WorldbookConnectionService.isJSSlashRunnerAvailable).mockReturnValue(false)

      const result = await WorldbookDataService.checkWorldbookData('test-worldbook')

      expect(result).toEqual({
        hasAutoSave: false,
        hasInit: false,
        hasManualSave: false,
      })
    })

    it('应该正确检测自动存档数据', async () => {
      const mockWorldbook = [createMockWorldbookEntry(ENTRY_NAME_SAVE, 'test content')]
      vi.mocked(WorldbookApi.getWorldbook).mockResolvedValue(mockWorldbook)

      const result = await WorldbookDataService.checkWorldbookData('test-worldbook')

      expect(result).toEqual({
        hasAutoSave: true,
        hasInit: false,
        hasManualSave: false,
      })
    })

    it('应该正确检测初始化数据', async () => {
      const mockWorldbook = [createMockWorldbookEntry(ENTRY_NAME_INIT, 'test content')]
      vi.mocked(WorldbookApi.getWorldbook).mockResolvedValue(mockWorldbook)

      const result = await WorldbookDataService.checkWorldbookData('test-worldbook')

      expect(result).toEqual({
        hasAutoSave: false,
        hasInit: true,
        hasManualSave: false,
      })
    })

    it('应该正确检测手动存档数据', async () => {
      const mockWorldbook = [
        createMockWorldbookEntry('存档数据1', 'test content'),
        createMockWorldbookEntry('存档数据2', 'test content'),
      ]
      vi.mocked(WorldbookApi.getWorldbook).mockResolvedValue(mockWorldbook)

      const result = await WorldbookDataService.checkWorldbookData('test-worldbook')

      expect(result).toEqual({
        hasAutoSave: false,
        hasInit: false,
        hasManualSave: true,
      })
    })

    it('应该正确检测所有类型的数据', async () => {
      const mockWorldbook = [
        createMockWorldbookEntry(ENTRY_NAME_SAVE, 'test content'),
        createMockWorldbookEntry(ENTRY_NAME_INIT, 'test content'),
        createMockWorldbookEntry('存档数据1', 'test content'),
      ]
      vi.mocked(WorldbookApi.getWorldbook).mockResolvedValue(mockWorldbook)

      const result = await WorldbookDataService.checkWorldbookData('test-worldbook')

      expect(result).toEqual({
        hasAutoSave: true,
        hasInit: true,
        hasManualSave: true,
      })
    })

    it('检查失败时应该返回空状态', async () => {
      vi.mocked(WorldbookApi.getWorldbook).mockRejectedValue(new Error('Test error'))

      const result = await WorldbookDataService.checkWorldbookData('test-worldbook')

      expect(result).toEqual({
        hasAutoSave: false,
        hasInit: false,
        hasManualSave: false,
      })
    })
  })

  describe('loadAutoSave', () => {
    it('环境不可用时应该返回 null', async () => {
      vi.mocked(WorldbookConnectionService.isJSSlashRunnerAvailable).mockReturnValue(false)

      const result = await WorldbookDataService.loadAutoSave('test-worldbook')

      expect(result).toBeNull()
    })

    it('未找到自动存档时应该返回 null', async () => {
      vi.mocked(WorldbookApi.getWorldbook).mockResolvedValue([])

      const result = await WorldbookDataService.loadAutoSave('test-worldbook')

      expect(result).toBeNull()
    })

    it('应该成功加载自动存档数据', async () => {
      const mockGameData = createMockGameData()
      const yamlContent = yaml.dump(mockGameData)
      const mockWorldbook = [createMockWorldbookEntry(ENTRY_NAME_SAVE, yamlContent)]
      vi.mocked(WorldbookApi.getWorldbook).mockResolvedValue(mockWorldbook)

      const result = await WorldbookDataService.loadAutoSave('test-worldbook')

      expect(result).toEqual(mockGameData)
    })

    it('加载失败时应该返回 null', async () => {
      vi.mocked(WorldbookApi.getWorldbook).mockRejectedValue(new Error('Test error'))

      const result = await WorldbookDataService.loadAutoSave('test-worldbook')

      expect(result).toBeNull()
    })
  })

  describe('loadInitData', () => {
    it('环境不可用时应该返回 null', async () => {
      vi.mocked(WorldbookConnectionService.isJSSlashRunnerAvailable).mockReturnValue(false)

      const result = await WorldbookDataService.loadInitData('test-worldbook')

      expect(result).toBeNull()
    })

    it('未找到初始化数据时应该返回 null', async () => {
      vi.mocked(WorldbookApi.getWorldbook).mockResolvedValue([])

      const result = await WorldbookDataService.loadInitData('test-worldbook')

      expect(result).toBeNull()
    })

    it('应该成功加载初始化数据', async () => {
      const mockGameData = createMockGameData()
      const yamlContent = yaml.dump(mockGameData)
      const mockWorldbook = [createMockWorldbookEntry(ENTRY_NAME_INIT, yamlContent)]
      vi.mocked(WorldbookApi.getWorldbook).mockResolvedValue(mockWorldbook)

      const result = await WorldbookDataService.loadInitData('test-worldbook')

      expect(result).toEqual(mockGameData)
    })

    it('加载失败时应该返回 null', async () => {
      vi.mocked(WorldbookApi.getWorldbook).mockRejectedValue(new Error('Test error'))

      const result = await WorldbookDataService.loadInitData('test-worldbook')

      expect(result).toBeNull()
    })
  })

  describe('checkWorldbookStatus', () => {
    it('环境不可用时应该返回 EMPTY', async () => {
      vi.mocked(WorldbookConnectionService.isJSSlashRunnerAvailable).mockReturnValue(false)

      const result = await WorldbookDataService.checkWorldbookStatus()

      expect(result).toBe(WorldbookStatus.EMPTY)
    })

    it('有自动存档时应该返回 HAS_AUTO_SAVE', async () => {
      const mockWorldbook = [createMockWorldbookEntry(ENTRY_NAME_SAVE, 'test content')]
      vi.mocked(WorldbookApi.getWorldbook).mockResolvedValue(mockWorldbook)

      const result = await WorldbookDataService.checkWorldbookStatus()

      expect(result).toBe(WorldbookStatus.HAS_AUTO_SAVE)
    })

    it('有手动存档时应该返回 HAS_SAVE', async () => {
      const mockWorldbook = [createMockWorldbookEntry('存档数据1', 'test content')]
      vi.mocked(WorldbookApi.getWorldbook).mockResolvedValue(mockWorldbook)

      const result = await WorldbookDataService.checkWorldbookStatus()

      expect(result).toBe(WorldbookStatus.HAS_SAVE)
    })

    it('有初始化数据时应该返回 HAS_INIT', async () => {
      const mockWorldbook = [createMockWorldbookEntry(ENTRY_NAME_INIT, 'test content')]
      vi.mocked(WorldbookApi.getWorldbook).mockResolvedValue(mockWorldbook)

      const result = await WorldbookDataService.checkWorldbookStatus()

      expect(result).toBe(WorldbookStatus.HAS_INIT)
    })

    it('世界书为空时应该返回 EMPTY', async () => {
      vi.mocked(WorldbookApi.getWorldbook).mockResolvedValue([])

      const result = await WorldbookDataService.checkWorldbookStatus()

      expect(result).toBe(WorldbookStatus.EMPTY)
    })

    it('检查失败时应该返回 EMPTY', async () => {
      vi.mocked(WorldbookConnectionService.ensureWorldbookExists).mockRejectedValue(
        new Error('Test error')
      )

      const result = await WorldbookDataService.checkWorldbookStatus()

      expect(result).toBe(WorldbookStatus.EMPTY)
    })
  })

  describe('loadGameDataFromWorldbook', () => {
    it('环境不可用时应该返回 null', async () => {
      vi.mocked(WorldbookConnectionService.isJSSlashRunnerAvailable).mockReturnValue(false)

      const result = await WorldbookDataService.loadGameDataFromWorldbook()

      expect(result).toBeNull()
    })

    it('优先加载自动存档数据', async () => {
      const autoSaveData = createMockGameData()
      autoSaveData.config!.home!.title = '自动存档'
      const initData = createMockGameData()
      initData.config!.home!.title = '初始化数据'

      const mockWorldbook = [
        createMockWorldbookEntry(ENTRY_NAME_SAVE, yaml.dump(autoSaveData)),
        createMockWorldbookEntry(ENTRY_NAME_INIT, yaml.dump(initData)),
      ]
      vi.mocked(WorldbookApi.getWorldbook).mockResolvedValue(mockWorldbook)

      const result = await WorldbookDataService.loadGameDataFromWorldbook()

      expect(result?.config?.home?.title).toBe('自动存档')
    })

    it('没有自动存档时应该加载初始化数据', async () => {
      const initData = createMockGameData()
      initData.config!.home!.title = '初始化数据'

      const mockWorldbook = [createMockWorldbookEntry(ENTRY_NAME_INIT, yaml.dump(initData))]
      vi.mocked(WorldbookApi.getWorldbook).mockResolvedValue(mockWorldbook)

      const result = await WorldbookDataService.loadGameDataFromWorldbook()

      expect(result?.config?.home?.title).toBe('初始化数据')
    })

    it('没有任何数据时应该返回 null', async () => {
      vi.mocked(WorldbookApi.getWorldbook).mockResolvedValue([])

      const result = await WorldbookDataService.loadGameDataFromWorldbook()

      expect(result).toBeNull()
    })

    it('加载失败时应该返回 null', async () => {
      vi.mocked(WorldbookConnectionService.ensureWorldbookExists).mockRejectedValue(
        new Error('Test error')
      )

      const result = await WorldbookDataService.loadGameDataFromWorldbook()

      expect(result).toBeNull()
    })
  })

  describe('saveGameDataToWorldbook', () => {
    it('环境不可用时应该直接返回', async () => {
      vi.mocked(WorldbookConnectionService.isJSSlashRunnerAvailable).mockReturnValue(false)

      await WorldbookDataService.saveGameDataToWorldbook(createMockGameData())

      expect(WorldbookApi.getWorldbook).not.toHaveBeenCalled()
    })

    it('应该创建新的自动存档条目', async () => {
      const mockGameData = createMockGameData()
      vi.mocked(WorldbookApi.getWorldbook).mockResolvedValue([])
      vi.mocked(WorldbookApi.updateWorldbookWith).mockImplementation(
        async (_name: string, updater: (entries: WorldbookEntry[]) => WorldbookEntry[] | void) => {
          updater([])
        }
      )

      await WorldbookDataService.saveGameDataToWorldbook(mockGameData)

      expect(WorldbookApi.updateWorldbookWith).toHaveBeenCalled()
      const updateCall = vi.mocked(WorldbookApi.updateWorldbookWith).mock.calls[0]
      const updater = updateCall[1]
      const updatedWorldbook = updater([])

      expect(updatedWorldbook).toHaveLength(1)
      expect(updatedWorldbook![0].name).toBe(ENTRY_NAME_SAVE)
      expect(updatedWorldbook![0].enabled).toBe(false)
    })

    it('应该更新现有的自动存档条目', async () => {
      const mockGameData = createMockGameData()
      const existingEntry = createMockWorldbookEntry(ENTRY_NAME_SAVE, 'old content')
      vi.mocked(WorldbookApi.getWorldbook).mockResolvedValue([existingEntry])
      vi.mocked(WorldbookApi.updateWorldbookWith).mockImplementation(
        async (_name: string, updater: (entries: WorldbookEntry[]) => WorldbookEntry[] | void) => {
          updater([existingEntry])
        }
      )

      await WorldbookDataService.saveGameDataToWorldbook(mockGameData)

      expect(WorldbookApi.updateWorldbookWith).toHaveBeenCalled()
      const updateCall = vi.mocked(WorldbookApi.updateWorldbookWith).mock.calls[0]
      const updater = updateCall[1]
      const updatedWorldbook = updater([existingEntry])

      expect(updatedWorldbook).toHaveLength(1)
      expect(updatedWorldbook![0].name).toBe(ENTRY_NAME_SAVE)
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

      await WorldbookDataService.saveGameDataToWorldbook(mockGameData)

      const updateCall = vi.mocked(WorldbookApi.updateWorldbookWith).mock.calls[0]
      const updater = updateCall[1]
      const updatedWorldbook = updater([])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const savedData = yaml.load(updatedWorldbook![0].content) as any

      expect(savedData._saveInfo).toBeDefined()
      expect(savedData._saveInfo.saveTime).toBeDefined()
      expect(savedData._saveInfo.version).toBe('1.0.0')
      expect(savedData._saveInfo.phase).toBe('测试阶段')
    })

    it('保存失败时应该抛出错误', async () => {
      vi.mocked(WorldbookConnectionService.ensureWorldbookExists).mockRejectedValue(
        new Error('Test error')
      )

      await expect(
        WorldbookDataService.saveGameDataToWorldbook(createMockGameData())
      ).rejects.toThrow('Test error')
    })
  })

  describe('saveInitDataToWorldbook', () => {
    it('环境不可用时应该直接返回', async () => {
      vi.mocked(WorldbookConnectionService.isJSSlashRunnerAvailable).mockReturnValue(false)

      await WorldbookDataService.saveInitDataToWorldbook(createMockGameData())

      expect(WorldbookApi.getWorldbook).not.toHaveBeenCalled()
    })

    it('应该创建新的初始化数据条目', async () => {
      const mockGameData = createMockGameData()
      vi.mocked(WorldbookApi.getWorldbook).mockResolvedValue([])
      vi.mocked(WorldbookApi.updateWorldbookWith).mockImplementation(
        async (_name: string, updater: (entries: WorldbookEntry[]) => WorldbookEntry[] | void) => {
          updater([])
        }
      )

      await WorldbookDataService.saveInitDataToWorldbook(mockGameData)

      expect(WorldbookApi.updateWorldbookWith).toHaveBeenCalled()
      const updateCall = vi.mocked(WorldbookApi.updateWorldbookWith).mock.calls[0]
      const updater = updateCall[1]
      const updatedWorldbook = updater([])

      expect(updatedWorldbook).toHaveLength(1)
      expect(updatedWorldbook![0].name).toBe(ENTRY_NAME_INIT)
      expect(updatedWorldbook![0].enabled).toBe(false)
    })

    it('应该更新现有的初始化数据条目', async () => {
      const mockGameData = createMockGameData()
      const existingEntry = createMockWorldbookEntry(ENTRY_NAME_INIT, 'old content')
      vi.mocked(WorldbookApi.getWorldbook).mockResolvedValue([existingEntry])
      vi.mocked(WorldbookApi.updateWorldbookWith).mockImplementation(
        async (_name: string, updater: (entries: WorldbookEntry[]) => WorldbookEntry[] | void) => {
          updater([existingEntry])
        }
      )

      await WorldbookDataService.saveInitDataToWorldbook(mockGameData)

      expect(WorldbookApi.updateWorldbookWith).toHaveBeenCalled()
      const updateCall = vi.mocked(WorldbookApi.updateWorldbookWith).mock.calls[0]
      const updater = updateCall[1]
      const updatedWorldbook = updater([existingEntry])

      expect(updatedWorldbook).toHaveLength(1)
      expect(updatedWorldbook![0].name).toBe(ENTRY_NAME_INIT)
      expect(updatedWorldbook![0].content).not.toBe('old content')
    })

    it('保存失败时应该抛出错误', async () => {
      vi.mocked(WorldbookConnectionService.ensureWorldbookExists).mockRejectedValue(
        new Error('Test error')
      )

      await expect(
        WorldbookDataService.saveInitDataToWorldbook(createMockGameData())
      ).rejects.toThrow('Test error')
    })
  })
})
