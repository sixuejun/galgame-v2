import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DataBackupService } from '../dataBackupService'
import { logger } from '../../utils/logger'
import type { GameData } from '../../types'

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('DataBackupService', () => {
  const createMockGameData = (): GameData => ({
    config: {
      version: '1.0.0',
      phase: 'test',
      home: {
        title: 'Test Game',
        subtitle: 'Test Subtitle',
      },
    },
    story: {
      content: 'Test story content',
      time: 'Morning',
    },
    choices: [{ text: 'Choice 1' }, { text: 'Choice 2' }],
  })

  beforeEach(() => {
    vi.clearAllMocks()
    // 清理所有备份
    DataBackupService.clearAllBackups()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createBackup', () => {
    it('应该成功创建备份并返回备份ID', () => {
      const gameData = createMockGameData()
      const backupId = DataBackupService.createBackup(gameData)

      expect(backupId).toBeTruthy()
      expect(backupId).toMatch(/^backup_\d+_[a-z0-9]+$/)
      expect(DataBackupService.hasBackup(backupId)).toBe(true)
      expect(DataBackupService.getBackupCount()).toBe(1)
    })

    it('应该创建数据的深度拷贝', () => {
      const gameData = createMockGameData()
      const backupId = DataBackupService.createBackup(gameData)

      // 修改原始数据
      if (gameData.story) {
        gameData.story.content = 'Modified content'
      }
      gameData.choices = []

      // 从备份恢复
      const restored = DataBackupService.restoreFromBackup(gameData, backupId)

      expect(restored).toBe(true)
      expect(gameData.story?.content).toBe('Test story content')
      expect(gameData.choices).toHaveLength(2)
    })

    it('应该支持创建多个备份', () => {
      const gameData1 = createMockGameData()
      const gameData2 = { ...createMockGameData(), story: { content: 'Different story' } }

      const backupId1 = DataBackupService.createBackup(gameData1)
      const backupId2 = DataBackupService.createBackup(gameData2)

      expect(backupId1).not.toBe(backupId2)
      expect(DataBackupService.getBackupCount()).toBe(2)
      expect(DataBackupService.hasBackup(backupId1)).toBe(true)
      expect(DataBackupService.hasBackup(backupId2)).toBe(true)
    })

    it('应该记录调试日志', () => {
      const gameData = createMockGameData()
      const backupId = DataBackupService.createBackup(gameData)

      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining(`创建备份成功: ${backupId}`)
      )
    })
  })

  describe('restoreFromBackup', () => {
    it('应该成功从备份恢复数据', () => {
      const gameData = createMockGameData()
      const originalContent = gameData.story?.content
      const backupId = DataBackupService.createBackup(gameData)

      // 修改数据
      if (gameData.story) {
        gameData.story.content = 'Modified content'
        gameData.story.time = 'Evening'
      }

      // 从备份恢复
      const result = DataBackupService.restoreFromBackup(gameData, backupId)

      expect(result).toBe(true)
      expect(gameData.story?.content).toBe(originalContent)
      expect(gameData.story?.time).toBe('Morning')
    })

    it('应该完全替换游戏数据', () => {
      const gameData = createMockGameData()
      const backupId = DataBackupService.createBackup(gameData)

      // 添加新字段
      const gameDataRecord = gameData as Record<string, unknown>
      gameDataRecord.newField = 'new value'

      // 从备份恢复
      DataBackupService.restoreFromBackup(gameData, backupId)

      // 新字段应该被删除
      expect(gameDataRecord.newField).toBeUndefined()
    })

    it('当备份不存在时应该返回 false', () => {
      const gameData = createMockGameData()
      const result = DataBackupService.restoreFromBackup(gameData, 'non_existent_backup')

      expect(result).toBe(false)
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('未找到备份'))
    })

    it('应该记录恢复成功的日志', () => {
      const gameData = createMockGameData()
      const backupId = DataBackupService.createBackup(gameData)

      DataBackupService.restoreFromBackup(gameData, backupId)

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining(`从备份恢复成功: ${backupId}`)
      )
    })
  })

  describe('clearBackup', () => {
    it('应该成功清理指定的备份', () => {
      const gameData = createMockGameData()
      const backupId = DataBackupService.createBackup(gameData)

      expect(DataBackupService.hasBackup(backupId)).toBe(true)

      const result = DataBackupService.clearBackup(backupId)

      expect(result).toBe(true)
      expect(DataBackupService.hasBackup(backupId)).toBe(false)
      expect(DataBackupService.getBackupCount()).toBe(0)
    })

    it('当备份不存在时应该返回 false', () => {
      const result = DataBackupService.clearBackup('non_existent_backup')

      expect(result).toBe(false)
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('备份不存在'))
    })

    it('应该只清理指定的备份', () => {
      const gameData1 = createMockGameData()
      const gameData2 = createMockGameData()

      const backupId1 = DataBackupService.createBackup(gameData1)
      const backupId2 = DataBackupService.createBackup(gameData2)

      DataBackupService.clearBackup(backupId1)

      expect(DataBackupService.hasBackup(backupId1)).toBe(false)
      expect(DataBackupService.hasBackup(backupId2)).toBe(true)
      expect(DataBackupService.getBackupCount()).toBe(1)
    })

    it('应该记录清理成功的日志', () => {
      const gameData = createMockGameData()
      const backupId = DataBackupService.createBackup(gameData)

      DataBackupService.clearBackup(backupId)

      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining(`清理备份成功: ${backupId}`)
      )
    })
  })

  describe('clearAllBackups', () => {
    it('应该清理所有备份', () => {
      const gameData1 = createMockGameData()
      const gameData2 = createMockGameData()
      const gameData3 = createMockGameData()

      DataBackupService.createBackup(gameData1)
      DataBackupService.createBackup(gameData2)
      DataBackupService.createBackup(gameData3)

      expect(DataBackupService.getBackupCount()).toBe(3)

      DataBackupService.clearAllBackups()

      expect(DataBackupService.getBackupCount()).toBe(0)
    })

    it('当没有备份时应该正常执行', () => {
      expect(DataBackupService.getBackupCount()).toBe(0)

      DataBackupService.clearAllBackups()

      expect(DataBackupService.getBackupCount()).toBe(0)
    })

    it('应该记录清理日志', () => {
      const gameData1 = createMockGameData()
      const gameData2 = createMockGameData()

      DataBackupService.createBackup(gameData1)
      DataBackupService.createBackup(gameData2)

      DataBackupService.clearAllBackups()

      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('清理所有备份成功，共清理 2 个备份')
      )
    })
  })

  describe('getBackupCount', () => {
    it('应该返回正确的备份数量', () => {
      expect(DataBackupService.getBackupCount()).toBe(0)

      const gameData1 = createMockGameData()
      DataBackupService.createBackup(gameData1)
      expect(DataBackupService.getBackupCount()).toBe(1)

      const gameData2 = createMockGameData()
      DataBackupService.createBackup(gameData2)
      expect(DataBackupService.getBackupCount()).toBe(2)

      DataBackupService.clearAllBackups()
      expect(DataBackupService.getBackupCount()).toBe(0)
    })
  })

  describe('hasBackup', () => {
    it('应该正确检查备份是否存在', () => {
      const gameData = createMockGameData()
      const backupId = DataBackupService.createBackup(gameData)

      expect(DataBackupService.hasBackup(backupId)).toBe(true)
      expect(DataBackupService.hasBackup('non_existent_backup')).toBe(false)

      DataBackupService.clearBackup(backupId)

      expect(DataBackupService.hasBackup(backupId)).toBe(false)
    })
  })

  describe('完整的备份-恢复-清理流程', () => {
    it('应该支持完整的事务性操作流程', () => {
      const gameData = createMockGameData()
      const originalContent = gameData.story?.content

      // 1. 创建备份
      const backupId = DataBackupService.createBackup(gameData)
      expect(DataBackupService.hasBackup(backupId)).toBe(true)

      // 2. 修改数据（模拟数据更新）
      if (gameData.story) {
        gameData.story.content = 'Updated content'
        expect(gameData.story.content).toBe('Updated content')
      }

      // 3. 假设更新失败，从备份恢复
      const restored = DataBackupService.restoreFromBackup(gameData, backupId)
      expect(restored).toBe(true)
      expect(gameData.story?.content).toBe(originalContent)

      // 4. 清理备份
      const cleared = DataBackupService.clearBackup(backupId)
      expect(cleared).toBe(true)
      expect(DataBackupService.hasBackup(backupId)).toBe(false)
    })

    it('应该支持成功更新后清理备份的流程', () => {
      const gameData = createMockGameData()

      // 1. 创建备份
      const backupId = DataBackupService.createBackup(gameData)

      // 2. 修改数据（模拟数据更新）
      if (gameData.story) {
        gameData.story.content = 'Successfully updated content'
      }

      // 3. 假设更新成功，直接清理备份
      const cleared = DataBackupService.clearBackup(backupId)
      expect(cleared).toBe(true)
      expect(gameData.story?.content).toBe('Successfully updated content')
    })
  })
})
