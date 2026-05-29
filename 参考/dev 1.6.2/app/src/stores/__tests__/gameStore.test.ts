import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '../gameStore'
import type { GameData } from '../../types'
import { WorldbookStatus } from '../../services/worldbook/worldbookConnectionService'

// Mock GameDataService
vi.mock('../../services/gameDataService', () => ({
  GameDataService: {
    checkWorldbookStatus: vi.fn(),
    loadGameData: vi.fn(),
    saveInitializationData: vi.fn(),
    autoSaveToWorldbook: vi.fn(),
    updateGameDataFromAI: vi.fn(),
    exportGameData: vi.fn(),
  },
}))

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

// Mock worldbook services
vi.mock('../../services/worldbook/worldbookConnectionService', () => ({
  WorldbookStatus: {
    EMPTY: 'empty',
    HAS_INIT: 'has_init',
    HAS_SAVE: 'has_save',
    HAS_AUTO_SAVE: 'has_auto_save',
  },
}))

describe('useGameStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('初始状态', () => {
    it('应该初始化为正确的默认值', () => {
      const store = useGameStore()

      expect(store.gameData).toEqual({})
      expect(store.userActionLog).toEqual([])
      expect(store.isLoading).toBe(true)
      expect(store.loadError).toBeNull()
      expect(store.needsInitialization).toBe(false)
    })
  })

  describe('计算属性', () => {
    it('应该正确返回 config', () => {
      const store = useGameStore()
      const config = {
        version: '1.0',
        phase: 'test',
        home: { title: 'Test', subtitle: 'Test' },
      }
      store.gameData = { config }

      expect(store.config).toEqual(config)
    })

    it('应该正确返回 story', () => {
      const store = useGameStore()
      const story = { content: 'Test story' }
      store.gameData = { story }

      expect(store.story).toEqual(story)
    })

    it('应该正确返回 choices 数组', () => {
      const store = useGameStore()
      const choices = [{ text: 'Choice 1' }, { text: 'Choice 2' }]
      store.gameData = { choices }

      expect(store.choices).toEqual(choices)
    })

    it('应该正确返回 characters', () => {
      const store = useGameStore()
      const characters = { char1: { name: 'Character 1' } }
      store.gameData = { characters }

      expect(store.characters).toEqual(characters)
    })

    it('应该正确返回 shop', () => {
      const store = useGameStore()
      const shop = { currency: 100, items: {} }
      store.gameData = { shop }

      expect(store.shop).toEqual(shop)
    })

    it('应该正确返回 storage', () => {
      const store = useGameStore()
      const storage = { inventory: {} }
      store.gameData = { storage }

      expect(store.storage).toEqual(storage)
    })

    it('应该正确返回 achievements', () => {
      const store = useGameStore()
      const achievements = {
        ach1: { id: 'ach1', name: 'Achievement 1', desc: 'Test', icon: '🏆', unlocked: false },
      }
      store.gameData = { achievements }

      expect(store.achievements).toEqual(achievements)
    })

    it('应该正确返回 summaries', () => {
      const store = useGameStore()
      const summaries = [{ time: '2024-01-01T00:00:00Z', content: 'Summary 1' }]
      store.gameData = { summaries }

      expect(store.summaries).toEqual(summaries)
    })
  })

  describe('checkWorldbookStatus', () => {
    it('应该调用 GameDataService.checkWorldbookStatus', async () => {
      const store = useGameStore()
      const { GameDataService } = await import('../../services/gameDataService')
      vi.mocked(GameDataService.checkWorldbookStatus).mockResolvedValue(
        WorldbookStatus.HAS_AUTO_SAVE
      )

      const result = await store.checkWorldbookStatus()

      expect(GameDataService.checkWorldbookStatus).toHaveBeenCalled()
      expect(result).toBe(WorldbookStatus.HAS_AUTO_SAVE)
    })
  })

  describe('loadData', () => {
    it('应该成功加载游戏数据', async () => {
      const store = useGameStore()
      const { GameDataService } = await import('../../services/gameDataService')
      const mockGameData: GameData = {
        config: {
          version: '1.0',
          phase: 'test',
          home: { title: 'Test', subtitle: 'Test' },
        },
      }
      vi.mocked(GameDataService.loadGameData).mockResolvedValue({
        gameData: mockGameData,
        needsInitialization: false,
        error: null,
      })

      await store.loadData()

      expect(store.gameData).toEqual(mockGameData)
      expect(store.needsInitialization).toBe(false)
      expect(store.loadError).toBeNull()
      expect(store.isLoading).toBe(false)
    })

    it('应该处理加载错误', async () => {
      const store = useGameStore()
      const { GameDataService } = await import('../../services/gameDataService')
      const error = new Error('Load failed')
      vi.mocked(GameDataService.loadGameData).mockRejectedValue(error)

      await store.loadData()

      expect(store.loadError).toBe('Load failed')
      expect(store.needsInitialization).toBe(true)
      expect(store.isLoading).toBe(false)
    })
  })

  describe('saveInitializationData', () => {
    it('应该成功保存初始化数据', async () => {
      const store = useGameStore()
      const { GameDataService } = await import('../../services/gameDataService')
      const mockGameData: GameData = {
        config: {
          version: '1.0',
          phase: 'test',
          home: { title: 'Test', subtitle: 'Test' },
        },
      }
      vi.mocked(GameDataService.saveInitializationData).mockResolvedValue(undefined)

      await store.saveInitializationData(mockGameData)

      expect(GameDataService.saveInitializationData).toHaveBeenCalledWith(mockGameData)
      expect(store.gameData).toEqual(mockGameData)
      expect(store.needsInitialization).toBe(false)
    })

    it('应该处理保存错误', async () => {
      const store = useGameStore()
      const { GameDataService } = await import('../../services/gameDataService')
      const error = new Error('Save failed')
      vi.mocked(GameDataService.saveInitializationData).mockRejectedValue(error)

      await expect(store.saveInitializationData({})).rejects.toThrow('Save failed')
    })
  })

  describe('logUserAction', () => {
    it('应该记录用户行为', () => {
      const store = useGameStore()
      store.logUserAction('choice', { content: 'Test choice' })

      expect(store.userActionLog).toHaveLength(1)
      expect(store.userActionLog[0]).toMatchObject({
        type: 'choice',
        content: 'Test choice',
      })
      expect(store.userActionLog[0].timestamp).toBeDefined()
    })

    it('应该支持不传 details 参数', () => {
      const store = useGameStore()
      store.logUserAction('test')

      expect(store.userActionLog).toHaveLength(1)
      expect(store.userActionLog[0].type).toBe('test')
    })
  })

  describe('clearUserActionLog', () => {
    it('应该清空用户行为日志', () => {
      const store = useGameStore()
      store.logUserAction('test')
      expect(store.userActionLog).toHaveLength(1)

      store.clearUserActionLog()

      expect(store.userActionLog).toHaveLength(0)
    })
  })

  describe('autoSaveToWorldbook', () => {
    it('应该调用 GameDataService.autoSaveToWorldbook', async () => {
      const store = useGameStore()
      const { GameDataService } = await import('../../services/gameDataService')
      vi.mocked(GameDataService.autoSaveToWorldbook).mockResolvedValue(undefined)

      await store.autoSaveToWorldbook()

      expect(GameDataService.autoSaveToWorldbook).toHaveBeenCalledWith(store.gameData)
    })

    it('应该更新 lastSaveTimestamp', async () => {
      const store = useGameStore()
      const { GameDataService } = await import('../../services/gameDataService')
      vi.mocked(GameDataService.autoSaveToWorldbook).mockResolvedValue(undefined)

      const beforeTimestamp = store.lastSaveTimestamp
      await store.autoSaveToWorldbook()

      expect(store.lastSaveTimestamp).toBeGreaterThan(beforeTimestamp)
    })

    it('应该处理保存错误', async () => {
      const store = useGameStore()
      const { GameDataService } = await import('../../services/gameDataService')
      const { logger } = await import('../../utils/logger')
      const error = new Error('Save failed')
      vi.mocked(GameDataService.autoSaveToWorldbook).mockRejectedValue(error)

      await store.autoSaveToWorldbook()

      expect(logger.error).toHaveBeenCalledWith('❌ 自动保存失败:', error)
    })

    it('保存失败时不应该更新 lastSaveTimestamp', async () => {
      const store = useGameStore()
      const { GameDataService } = await import('../../services/gameDataService')
      const error = new Error('Save failed')
      vi.mocked(GameDataService.autoSaveToWorldbook).mockRejectedValue(error)

      const beforeTimestamp = store.lastSaveTimestamp
      await store.autoSaveToWorldbook()

      expect(store.lastSaveTimestamp).toBe(beforeTimestamp)
    })
  })

  describe('updateGameDataFromAI', () => {
    it('应该调用 GameDataService.updateGameDataFromAI', async () => {
      const store = useGameStore()
      const { GameDataService } = await import('../../services/gameDataService')
      const yamlContent = 'test: data'

      store.updateGameDataFromAI(yamlContent)

      expect(GameDataService.updateGameDataFromAI).toHaveBeenCalledWith(store.gameData, yamlContent)
    })

    it('应该处理更新错误', async () => {
      const store = useGameStore()
      const { GameDataService } = await import('../../services/gameDataService')
      const error = new Error('Update failed')
      vi.mocked(GameDataService.updateGameDataFromAI).mockImplementation(() => {
        throw error
      })

      expect(() => store.updateGameDataFromAI('test')).toThrow('Update failed')
    })
  })

  describe('exportGameData', () => {
    it('应该调用 GameDataService.exportGameData', async () => {
      const store = useGameStore()
      const { GameDataService } = await import('../../services/gameDataService')
      vi.mocked(GameDataService.exportGameData).mockReturnValue('exported data')

      const result = store.exportGameData()

      expect(GameDataService.exportGameData).toHaveBeenCalledWith(store.gameData, 0)
      expect(result).toBe('exported data')
    })
  })

  describe('setGameData', () => {
    it('应该设置游戏数据', () => {
      const store = useGameStore()
      const mockGameData: GameData = {
        config: {
          version: '1.0',
          phase: 'test',
          home: { title: 'Test', subtitle: 'Test' },
        },
      }

      store.setGameData(mockGameData)

      expect(store.gameData).toEqual(mockGameData)
    })
  })

  describe('resetGameData', () => {
    it('应该重置游戏数据', () => {
      const store = useGameStore()
      store.gameData = {
        config: {
          version: '1.0',
          phase: 'test',
          home: { title: 'Test', subtitle: 'Test' },
        },
      }
      store.logUserAction('test')

      store.resetGameData()

      expect(store.gameData).toEqual({})
      expect(store.userActionLog).toEqual([])
      expect(store.needsInitialization).toBe(true)
    })
  })

  describe('$reset', () => {
    it('应该重置所有状态到初始值', () => {
      const store = useGameStore()
      store.gameData = {
        config: {
          version: '1.0',
          phase: 'test',
          home: { title: 'Test', subtitle: 'Test' },
        },
      }
      store.logUserAction('test')
      store.isLoading = false
      store.loadError = 'error'
      store.needsInitialization = true

      store.$reset()

      expect(store.gameData).toEqual({})
      expect(store.userActionLog).toEqual([])
      expect(store.isLoading).toBe(true)
      expect(store.loadError).toBeNull()
      expect(store.needsInitialization).toBe(false)
    })
  })
})
