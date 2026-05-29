/**
 * @file ttsCacheService.ts
 * @description TTS 音频缓存服务 - 管理 TTS 音频的 IndexedDB 缓存
 * @author Eden System Team
 * @created 2025-11-23
 * @updated 2025-11-23 - 重构为使用通用基础服务
 */

import { logger } from '@/utils/logger'
import { useSettingsStore } from '@/stores/settingsStore'
import { ttsIndexedDBHelper, type TTSCacheRecord } from '@/utils/indexedDB'
import { CharacterApi } from './api/characterApi'

/**
 * TTS 缓存服务
 *
 * 功能：
 * - 使用 IndexedDB 存储 TTS 音频缓存
 * - 支持缓存的增删改查操作
 * - 自动清理超出上限的旧缓存（LRU 策略）
 * - 按角色卡名称组织缓存数据
 * - 所有方法均为异步操作
 */
export class TTSCacheService {
  private static isInitialized = false

  /**
   * 获取当前角色卡名称
   *
   * @returns 角色卡名称，如果无法获取则返回 null
   */
  private static getCurrentCharacterName(): string | null {
    try {
      const characterName = CharacterApi.getCurrentCharacterName()
      if (!characterName) {
        logger.warn('⚠️ [TTS Cache] 无法获取角色卡名称，缓存功能不可用')
        return null
      }
      return characterName
    } catch (error) {
      logger.error('❌ [TTS Cache] 获取角色卡名称失败:', error)
      return null
    }
  }

  /**
   * 初始化服务（确保 IndexedDB 已就绪）
   *
   * @returns Promise，resolve 时服务已就绪
   */
  private static async ensureInitialized(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    // 初始化 IndexedDB
    await ttsIndexedDBHelper.init()

    this.isInitialized = true
  }

  /**
   * 生成缓存键
   *
   * @param text 文本内容
   * @returns 缓存键
   */
  static generateKey(text: string): string {
    // 使用简单的哈希函数生成键
    // 在生产环境中，可以考虑使用更复杂的哈希算法
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return `tts_${hash.toString(36)}`
  }

  /**
   * 从缓存中获取音频
   *
   * @param text 文本内容
   * @returns Promise，resolve 时返回缓存记录（如果不存在则返回 null）
   */
  static async get(text: string): Promise<TTSCacheRecord | null> {
    await this.ensureInitialized()

    const characterName = this.getCurrentCharacterName()
    if (!characterName) {
      return null
    }

    try {
      const key = this.generateKey(text)
      const record = await ttsIndexedDBHelper.getByKey(characterName, key)
      if (record) {
        logger.debug('✅ [TTS Cache] 缓存命中:', text.substring(0, 50))
        return record
      }

      logger.debug('⚠️ [TTS Cache] 缓存未命中:', text.substring(0, 50))
      return null
    } catch (error) {
      logger.error('❌ [TTS Cache] 获取缓存失败:', error)
      return null
    }
  }

  /**
   * 将音频保存到缓存
   *
   * @param text 文本内容
   * @param audioData 音频数据
   * @param format 音频格式
   * @param outputFormat 输出格式类型
   * @returns Promise，resolve 时返回是否保存成功
   */
  static async set(
    text: string,
    audioData: string,
    format: string,
    outputFormat: 'hex' | 'url'
  ): Promise<boolean> {
    await this.ensureInitialized()

    const characterName = this.getCurrentCharacterName()
    if (!characterName) {
      return false
    }

    try {
      const key = this.generateKey(text)

      const record: TTSCacheRecord = {
        characterName,
        key,
        audioData,
        format,
        outputFormat,
        timestamp: Date.now(),
        text: text.substring(0, 100), // 只保存前100个字符用于调试
      }

      // 保存到 IndexedDB
      await ttsIndexedDBHelper.put(record)

      // 获取缓存上限设置
      const settingsStore = useSettingsStore()
      const limit = settingsStore.settings.ttsCacheLimit ?? 100

      // 清理超出上限的旧缓存
      await ttsIndexedDBHelper.cleanupOldCache(characterName, limit)

      logger.debug('✅ [TTS Cache] 音频已缓存:', text.substring(0, 50))
      return true
    } catch (error) {
      logger.error('❌ [TTS Cache] 保存缓存失败:', error)
      return false
    }
  }

  /**
   * 删除单条缓存
   *
   * @param text 文本内容
   * @returns Promise，resolve 时返回是否删除成功
   */
  static async delete(text: string): Promise<boolean> {
    await this.ensureInitialized()

    const characterName = this.getCurrentCharacterName()
    if (!characterName) {
      return false
    }

    try {
      const key = this.generateKey(text)
      await ttsIndexedDBHelper.deleteByKey(characterName, key)
      logger.debug('✅ [TTS Cache] 缓存已删除:', text.substring(0, 50))
      return true
    } catch (error) {
      logger.error('❌ [TTS Cache] 删除缓存失败:', error)
      return false
    }
  }

  /**
   * 获取当前角色卡的所有缓存记录
   *
   * @returns Promise，resolve 时返回所有缓存记录
   */
  static async getAll(): Promise<TTSCacheRecord[]> {
    await this.ensureInitialized()

    const characterName = this.getCurrentCharacterName()
    if (!characterName) {
      return []
    }

    try {
      const results = await ttsIndexedDBHelper.getAllByCharacter(characterName)
      logger.debug(`✅ [TTS Cache] 找到 ${results.length} 条缓存记录`)
      return results
    } catch (error) {
      logger.error('❌ [TTS Cache] 获取所有缓存失败:', error)
      return []
    }
  }

  /**
   * 清空当前角色卡的所有缓存
   *
   * @returns Promise，resolve 时返回是否清空成功
   */
  static async clear(): Promise<boolean> {
    await this.ensureInitialized()

    const characterName = this.getCurrentCharacterName()
    if (!characterName) {
      return false
    }

    try {
      const deleteCount = await ttsIndexedDBHelper.clearByCharacter(characterName)
      logger.info(`✅ [TTS Cache] 缓存已清空，删除了 ${deleteCount} 条记录`)
      return true
    } catch (error) {
      logger.error('❌ [TTS Cache] 清空缓存失败:', error)
      return false
    }
  }

  /**
   * 获取缓存统计信息
   *
   * @returns Promise，resolve 时返回缓存统计信息
   */
  static async getStats(): Promise<{
    count: number
    totalSize: number
    characterName: string | null
    limit: number
  }> {
    await this.ensureInitialized()

    const characterName = this.getCurrentCharacterName()
    const settingsStore = useSettingsStore()
    const limit = settingsStore.settings.ttsCacheLimit ?? 100

    if (!characterName) {
      return {
        count: 0,
        totalSize: 0,
        characterName: null,
        limit,
      }
    }

    try {
      const stats = await ttsIndexedDBHelper.getStatsByCharacter(characterName)
      return {
        count: stats.count,
        totalSize: stats.totalSize,
        characterName,
        limit,
      }
    } catch (error) {
      logger.error('❌ [TTS Cache] 获取缓存统计失败:', error)
      return {
        count: 0,
        totalSize: 0,
        characterName,
        limit,
      }
    }
  }

  /**
   * 检查缓存是否可用
   *
   * @returns 缓存是否可用
   */
  static isCacheAvailable(): boolean {
    return this.getCurrentCharacterName() !== null
  }
}
