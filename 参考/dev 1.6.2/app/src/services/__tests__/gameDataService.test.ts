import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GameDataService } from '../gameDataService'
import { WorldbookConnectionService, WorldbookDataService } from '../worldbook'
import { DataMerger } from '../dataUpdate'
import { DataBackupService } from '../dataBackupService'
import { logger } from '../../utils/logger'
import * as yaml from 'js-yaml'
import type { GameData } from '../../types'

// Mock dependencies
vi.mock('../worldbook', () => ({
  WorldbookConnectionService: {
    isJSSlashRunnerAvailable: vi.fn(),
    checkCharacterBinding: vi.fn(),
    createAndBindWorldbook: vi.fn(),
  },
  WorldbookDataService: {
    checkWorldbookStatus: vi.fn(),
    checkWorldbookData: vi.fn(),
    loadAutoSave: vi.fn(),
    loadInitData: vi.fn(),
    saveInitDataToWorldbook: vi.fn(),
    saveGameDataToWorldbook: vi.fn(),
  },
  WorldbookStatus: {
    NO_WORLDBOOK: 'NO_WORLDBOOK',
    HAS_INIT_DATA: 'HAS_INIT_DATA',
    HAS_AUTO_SAVE: 'HAS_AUTO_SAVE',
  },
}))

vi.mock('../dataUpdate', () => ({
  DataMerger: {
    applyYamlUpdate: vi.fn(),
  },
}))

vi.mock('../dataBackupService', () => ({
  DataBackupService: {
    createBackup: vi.fn(),
    restoreFromBackup: vi.fn(),
    clearBackup: vi.fn(),
  },
}))

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

vi.mock('../../utils/dataValidation', () => ({
  validateAndLogGameData: vi.fn(),
}))

describe('GameDataService', () => {
  const createMockGameData = (): GameData => ({
    config: {
      version: '1.0.0',
      phase: 'test',
      home: {
        title: 'Test Game',
        subtitle: 'Test Subtitle',
      },
    },
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('checkWorldbookStatus', () => {
    it('应该调用 WorldbookDataService.checkWorldbookStatus', async () => {
      const { WorldbookStatus } = await import('../worldbook')
      const mockStatus = WorldbookStatus.HAS_AUTO_SAVE
      vi.mocked(WorldbookDataService.checkWorldbookStatus).mockResolvedValue(mockStatus)

      const result = await GameDataService.checkWorldbookStatus()

      expect(WorldbookDataService.checkWorldbookStatus).toHaveBeenCalled()
      expect(result).toBe(mockStatus)
    })
  })

  describe('loadGameData', () => {
    it('当 JS-Slash-Runner 不可用时应该加载本地示例数据', async () => {
      vi.mocked(WorldbookConnectionService.isJSSlashRunnerAvailable).mockReturnValue(false)

      // Mock fetch
      const mockGameData = createMockGameData()
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => yaml.dump({ gameData: mockGameData }),
      })

      const result = await GameDataService.loadGameData()

      expect(result.needsInitialization).toBe(false)
      expect(result.error).toBeNull()
      expect(result.gameData).toEqual(mockGameData)
    })

    it('当本地示例数据加载失败时应该返回需要初始化', async () => {
      vi.mocked(WorldbookConnectionService.isJSSlashRunnerAvailable).mockReturnValue(false)

      // Mock fetch failure
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      const result = await GameDataService.loadGameData()

      expect(result.needsInitialization).toBe(true)
      expect(result.error).toBeTruthy()
    })

    it('当未绑定世界书时应该创建并绑定新世界书', async () => {
      vi.mocked(WorldbookConnectionService.isJSSlashRunnerAvailable).mockReturnValue(true)
      vi.mocked(WorldbookConnectionService.checkCharacterBinding).mockResolvedValue({
        hasBound: false,
        worldbookName: null,
        isEdenWorldbook: false,
      })

      const result = await GameDataService.loadGameData()

      expect(WorldbookConnectionService.createAndBindWorldbook).toHaveBeenCalled()
      expect(result.needsInitialization).toBe(true)
      expect(result.error).toBeNull()
    })

    it('当已绑定世界书且有自动存档时应该加载自动存档', async () => {
      const mockGameData = createMockGameData()

      vi.mocked(WorldbookConnectionService.isJSSlashRunnerAvailable).mockReturnValue(true)
      vi.mocked(WorldbookConnectionService.checkCharacterBinding).mockResolvedValue({
        hasBound: true,
        worldbookName: 'test-worldbook',
        isEdenWorldbook: true,
      })
      vi.mocked(WorldbookDataService.checkWorldbookData).mockResolvedValue({
        hasAutoSave: true,
        hasInit: false,
        hasManualSave: false,
      })
      vi.mocked(WorldbookDataService.loadAutoSave).mockResolvedValue(mockGameData)

      const result = await GameDataService.loadGameData()

      expect(WorldbookDataService.loadAutoSave).toHaveBeenCalledWith('test-worldbook')
      expect(result.needsInitialization).toBe(false)
      expect(result.gameData).toEqual(mockGameData)
    })

    it('当没有自动存档但有初始化数据时应该加载初始化数据', async () => {
      const mockGameData = createMockGameData()

      vi.mocked(WorldbookConnectionService.isJSSlashRunnerAvailable).mockReturnValue(true)
      vi.mocked(WorldbookConnectionService.checkCharacterBinding).mockResolvedValue({
        hasBound: true,
        worldbookName: 'test-worldbook',
        isEdenWorldbook: true,
      })
      vi.mocked(WorldbookDataService.checkWorldbookData).mockResolvedValue({
        hasAutoSave: false,
        hasInit: true,
        hasManualSave: false,
      })
      vi.mocked(WorldbookDataService.loadInitData).mockResolvedValue(mockGameData)

      const result = await GameDataService.loadGameData()

      expect(WorldbookDataService.loadInitData).toHaveBeenCalledWith('test-worldbook')
      expect(result.needsInitialization).toBe(false)
      expect(result.gameData).toEqual(mockGameData)
    })

    it('当没有可用数据时应该返回需要初始化', async () => {
      vi.mocked(WorldbookConnectionService.isJSSlashRunnerAvailable).mockReturnValue(true)
      vi.mocked(WorldbookConnectionService.checkCharacterBinding).mockResolvedValue({
        hasBound: true,
        worldbookName: 'test-worldbook',
        isEdenWorldbook: true,
      })
      vi.mocked(WorldbookDataService.checkWorldbookData).mockResolvedValue({
        hasAutoSave: false,
        hasInit: false,
        hasManualSave: false,
      })

      const result = await GameDataService.loadGameData()

      expect(result.needsInitialization).toBe(true)
      expect(result.gameData).toEqual({})
    })

    it('当发生错误时应该返回错误信息', async () => {
      vi.mocked(WorldbookConnectionService.isJSSlashRunnerAvailable).mockImplementation(() => {
        throw new Error('Test error')
      })

      const result = await GameDataService.loadGameData()

      expect(result.needsInitialization).toBe(true)
      expect(result.error).toBeTruthy()
    })
  })

  describe('loadLocalExampleData', () => {
    it('应该成功加载本地示例数据', async () => {
      const mockGameData = createMockGameData()
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => yaml.dump({ gameData: mockGameData }),
      })

      const result = await GameDataService.loadLocalExampleData()

      expect(result).toEqual(mockGameData)
    })

    it('当 fetch 失败时应该返回 null', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      const result = await GameDataService.loadLocalExampleData()

      expect(result).toBeNull()
    })

    it('当 YAML 解析失败时应该返回 null', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => 'invalid yaml: [[[',
      })

      const result = await GameDataService.loadLocalExampleData()

      expect(result).toBeNull()
    })

    it('当缺少 gameData 字段时应该返回 null', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => yaml.dump({ notGameData: {} }),
      })

      const result = await GameDataService.loadLocalExampleData()

      expect(result).toBeNull()
    })
  })

  describe('saveInitializationData', () => {
    it('应该调用 WorldbookDataService.saveInitDataToWorldbook', async () => {
      const mockData = createMockGameData()
      vi.mocked(WorldbookDataService.saveInitDataToWorldbook).mockResolvedValue()

      await GameDataService.saveInitializationData(mockData)

      expect(WorldbookDataService.saveInitDataToWorldbook).toHaveBeenCalledWith(mockData)
      expect(logger.info).toHaveBeenCalledWith('💾 保存初始化数据到世界书...')
      expect(logger.info).toHaveBeenCalledWith('✅ 初始化数据保存成功')
    })
  })

  describe('autoSaveToWorldbook', () => {
    it('应该调用 WorldbookDataService.saveGameDataToWorldbook', async () => {
      const mockData = createMockGameData()
      vi.mocked(WorldbookDataService.saveGameDataToWorldbook).mockResolvedValue()

      await GameDataService.autoSaveToWorldbook(mockData)

      expect(WorldbookDataService.saveGameDataToWorldbook).toHaveBeenCalledWith(mockData)
      expect(logger.info).toHaveBeenCalledWith('💾 自动保存游戏数据到世界书...')
      expect(logger.info).toHaveBeenCalledWith('✅ 自动保存成功')
    })
  })

  describe('updateGameDataFromAI', () => {
    beforeEach(async () => {
      // 导入并mock validateAndLogGameData
      const { validateAndLogGameData } = await import('../../utils/dataValidation')
      vi.mocked(validateAndLogGameData).mockReturnValue({
        valid: true,
        errors: [],
        warnings: [],
      })
    })

    it('应该创建备份、应用更新、验证数据并清理备份', async () => {
      const mockData = createMockGameData()
      const yamlContent = 'story:\n  content: "New story"'
      const mockBackupId = 'backup_123'

      vi.mocked(DataBackupService.createBackup).mockReturnValue(mockBackupId)
      vi.mocked(DataMerger.applyYamlUpdate).mockImplementation(() => {})

      GameDataService.updateGameDataFromAI(mockData, yamlContent)

      // 验证备份流程
      expect(DataBackupService.createBackup).toHaveBeenCalledWith(mockData)
      expect(DataMerger.applyYamlUpdate).toHaveBeenCalledWith(mockData, yamlContent)
      expect(DataBackupService.clearBackup).toHaveBeenCalledWith(mockBackupId)
      expect(logger.info).toHaveBeenCalledWith('🔄 开始更新游戏数据...')
      expect(logger.info).toHaveBeenCalledWith('✅ 游戏数据更新成功')
    })

    it('当数据验证失败时应该从备份恢复', async () => {
      const mockData = createMockGameData()
      const yamlContent = 'invalid'
      const mockBackupId = 'backup_123'

      const { validateAndLogGameData } = await import('../../utils/dataValidation')
      vi.mocked(validateAndLogGameData).mockReturnValue({
        valid: false,
        errors: ['验证错误'],
        warnings: [],
      })

      vi.mocked(DataBackupService.createBackup).mockReturnValue(mockBackupId)
      vi.mocked(DataMerger.applyYamlUpdate).mockImplementation(() => {})

      expect(() => {
        GameDataService.updateGameDataFromAI(mockData, yamlContent)
      }).toThrow('数据更新后验证失败')

      // 验证恢复流程
      expect(DataBackupService.restoreFromBackup).toHaveBeenCalledWith(mockData, mockBackupId)
      expect(DataBackupService.clearBackup).toHaveBeenCalledWith(mockBackupId)
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('[数据更新] 数据验证失败，从备份恢复...')
      )
    })

    it('当更新失败时应该从备份恢复', () => {
      const mockData = createMockGameData()
      const yamlContent = 'invalid'
      const mockBackupId = 'backup_123'

      vi.mocked(DataBackupService.createBackup).mockReturnValue(mockBackupId)
      vi.mocked(DataMerger.applyYamlUpdate).mockImplementation(() => {
        throw new Error('Update failed')
      })

      expect(() => {
        GameDataService.updateGameDataFromAI(mockData, yamlContent)
      }).toThrow()

      // 验证恢复流程
      expect(DataBackupService.restoreFromBackup).toHaveBeenCalledWith(mockData, mockBackupId)
      expect(DataBackupService.clearBackup).toHaveBeenCalledWith(mockBackupId)
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('[数据更新] 更新失败，从备份恢复...')
      )
    })

    it('当备份创建失败时应该抛出错误', () => {
      const mockData = createMockGameData()
      const yamlContent = 'story:\n  content: "New story"'

      vi.mocked(DataBackupService.createBackup).mockImplementation(() => {
        throw new Error('Backup failed')
      })

      expect(() => {
        GameDataService.updateGameDataFromAI(mockData, yamlContent)
      }).toThrow()
    })
  })

  describe('exportGameData', () => {
    it('应该导出游戏数据为 YAML', () => {
      const mockData: GameData = {
        ...createMockGameData(),
        story: { content: 'Story' },
        choices: [{ text: 'Choice 1' }],
      }

      const result = GameDataService.exportGameData(mockData, 10)

      expect(result).toContain('gameData')
      expect(result).toContain('exportInfo')
      expect(result).toContain('伊甸园数据导出')
      expect(result).toContain('userActions: 10')
      expect(result).not.toContain('story')
      expect(result).not.toContain('choices')
    })

    it('应该包含导出时间戳', () => {
      const mockData = createMockGameData()

      const result = GameDataService.exportGameData(mockData, 5)

      expect(result).toContain('timestamp')
    })
  })
})
