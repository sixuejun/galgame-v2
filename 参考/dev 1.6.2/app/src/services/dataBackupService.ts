import type { GameData } from '../types'
import { logger } from '../utils/logger'
import { DataMerger } from './dataUpdate'

/**
 * 数据备份服务 - 提供游戏数据的备份、恢复和清理功能
 *
 * 职责：
 * - 创建游戏数据的临时备份
 * - 从备份恢复游戏数据
 * - 清理备份数据
 * - 支持事务性数据更新操作
 *
 * 使用场景：
 * - 在应用AI返回的数据更新前创建备份
 * - 数据更新失败时从备份恢复
 * - 数据更新成功后清理备份
 *
 * @example
 * ```typescript
 * // 创建备份
 * const backupId = DataBackupService.createBackup(gameData)
 *
 * try {
 *   // 执行数据更新操作
 *   updateGameData(gameData, yamlContent)
 *
 *   // 更新成功，清理备份
 *   DataBackupService.clearBackup(backupId)
 * } catch (error) {
 *   // 更新失败，从备份恢复
 *   DataBackupService.restoreFromBackup(gameData, backupId)
 *   throw error
 * }
 * ```
 */
export class DataBackupService {
  /**
   * 备份存储 - 使用 Map 存储多个备份
   * key: 备份ID, value: 备份的游戏数据
   */
  private static backups: Map<string, GameData> = new Map()

  /**
   * 生成唯一的备份ID
   * @returns 备份ID
   */
  private static generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * 创建游戏数据的备份
   * @param gameData 要备份的游戏数据
   * @returns 备份ID，用于后续恢复或清理
   */
  static createBackup(gameData: GameData): string {
    try {
      const backupId = this.generateBackupId()

      // 深度拷贝游戏数据
      const backup = DataMerger.deepCopy(gameData)

      // 存储备份
      this.backups.set(backupId, backup)

      logger.debug(`[数据备份] 创建备份成功: ${backupId}`)
      return backupId
    } catch (error) {
      logger.error('[数据备份] 创建备份失败:', error)
      throw new Error(`创建数据备份失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 从备份恢复游戏数据
   * @param gameData 要恢复到的游戏数据对象（会被直接修改）
   * @param backupId 备份ID
   * @returns 是否恢复成功
   */
  static restoreFromBackup(gameData: GameData, backupId: string): boolean {
    try {
      const backup = this.backups.get(backupId)

      if (!backup) {
        logger.warn(`[数据备份] 未找到备份: ${backupId}`)
        return false
      }

      // 清空现有数据
      const gameDataRecord = gameData as Record<string, unknown>
      for (const key in gameDataRecord) {
        if (Object.prototype.hasOwnProperty.call(gameDataRecord, key)) {
          delete gameDataRecord[key]
        }
      }

      // 从备份恢复数据
      Object.assign(gameData, backup)

      logger.info(`[数据备份] 从备份恢复成功: ${backupId}`)
      return true
    } catch (error) {
      logger.error(`[数据备份] 从备份恢复失败 (${backupId}):`, error)
      return false
    }
  }

  /**
   * 清理指定的备份
   * @param backupId 备份ID
   * @returns 是否清理成功
   */
  static clearBackup(backupId: string): boolean {
    try {
      const existed = this.backups.has(backupId)

      if (existed) {
        this.backups.delete(backupId)
        logger.debug(`[数据备份] 清理备份成功: ${backupId}`)
        return true
      } else {
        logger.warn(`[数据备份] 备份不存在: ${backupId}`)
        return false
      }
    } catch (error) {
      logger.error(`[数据备份] 清理备份失败 (${backupId}):`, error)
      return false
    }
  }

  /**
   * 清理所有备份
   * 用于释放内存或重置状态
   */
  static clearAllBackups(): void {
    try {
      const count = this.backups.size
      this.backups.clear()
      logger.debug(`[数据备份] 清理所有备份成功，共清理 ${count} 个备份`)
    } catch (error) {
      logger.error('[数据备份] 清理所有备份失败:', error)
    }
  }

  /**
   * 获取当前备份数量
   * @returns 备份数量
   */
  static getBackupCount(): number {
    return this.backups.size
  }

  /**
   * 检查备份是否存在
   * @param backupId 备份ID
   * @returns 是否存在
   */
  static hasBackup(backupId: string): boolean {
    return this.backups.has(backupId)
  }
}
