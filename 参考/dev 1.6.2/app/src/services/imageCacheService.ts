/**
 * @file imageCacheService.ts
 * @description 图片缓存服务 - 管理图片生成结果的 IndexedDB 缓存
 * @author Eden System Team
 * @created 2025-11-10
 * @updated 2025-11-10 - 从 localStorage 迁移到 IndexedDB
 */

import { logger } from '@/utils/logger'
import { CharacterApi } from './api/characterApi'
import { useSettingsStore } from '@/stores/settingsStore'
import { indexedDBHelper, type ImageCacheRecord } from '@/utils/indexedDB'

/**
 * localStorage 键名前缀（用于数据迁移）
 */
const LEGACY_CACHE_KEY_PREFIX = 'imgdata'

/**
 * 旧版 localStorage 缓存数据结构（用于数据迁移）
 */
interface LegacyImageCacheItem {
  imageUrl: string
  timestamp: number
}

interface LegacyImageCacheData {
  [description: string]: LegacyImageCacheItem
}

/**
 * 图片缓存服务
 *
 * 功能：
 * - 按角色卡名称分类存储图片缓存
 * - 支持缓存的增删改查操作
 * - 使用 IndexedDB 存储，容量更大
 * - 自动从 localStorage 迁移旧数据
 * - 所有方法均为异步操作
 */
export class ImageCacheService {
  private static isInitialized = false
  private static migrationPromise: Promise<void> | null = null
  /**
   * 获取当前角色卡名称
   *
   * @returns 角色卡名称，如果无法获取则返回 null
   */
  private static getCurrentCharacterName(): string | null {
    try {
      const characterName = CharacterApi.getCurrentCharacterName()
      if (!characterName) {
        logger.warn('⚠️ [ImageCache] 无法获取角色卡名称，缓存功能不可用')
        return null
      }
      return characterName
    } catch (error) {
      logger.error('❌ [ImageCache] 获取角色卡名称失败:', error)
      return null
    }
  }

  /**
   * 初始化服务（确保 IndexedDB 已就绪并完成数据迁移）
   *
   * @returns Promise，resolve 时服务已就绪
   */
  private static async ensureInitialized(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    // 初始化 IndexedDB
    await indexedDBHelper.init()

    // 执行数据迁移（如果需要）
    if (!this.migrationPromise) {
      this.migrationPromise = this.migrateFromLocalStorage()
    }
    await this.migrationPromise

    this.isInitialized = true
  }

  /**
   * 从 localStorage 迁移数据到 IndexedDB
   * 迁移完成后会清理 localStorage 中的旧数据
   *
   * @returns Promise，resolve 时迁移完成
   */
  private static async migrateFromLocalStorage(): Promise<void> {
    const characterName = this.getCurrentCharacterName()
    if (!characterName) {
      return
    }

    const legacyKey = `${LEGACY_CACHE_KEY_PREFIX}.${characterName}`

    try {
      // 检查是否存在旧数据
      const legacyDataStr = localStorage.getItem(legacyKey)
      if (!legacyDataStr) {
        logger.debug('⚠️ [ImageCache] 没有找到需要迁移的 localStorage 数据')
        return
      }

      // 解析旧数据
      const legacyData = JSON.parse(legacyDataStr) as LegacyImageCacheData
      const entries = Object.entries(legacyData)

      if (entries.length === 0) {
        logger.debug('⚠️ [ImageCache] localStorage 数据为空，无需迁移')
        localStorage.removeItem(legacyKey)
        return
      }

      logger.info(`🔄 [ImageCache] 开始迁移 ${entries.length} 条缓存数据...`)

      // 迁移每条记录到 IndexedDB
      let successCount = 0
      for (const [description, item] of entries) {
        try {
          const record: ImageCacheRecord = {
            characterName,
            description,
            imageUrl: item.imageUrl,
            timestamp: item.timestamp,
          }
          await indexedDBHelper.put(record)
          successCount++
        } catch (error) {
          logger.error(`❌ [ImageCache] 迁移记录失败: ${description.substring(0, 50)}`, error)
        }
      }

      logger.info(`✅ [ImageCache] 数据迁移完成: ${successCount}/${entries.length} 条记录`)

      // 清理 localStorage 中的旧数据
      localStorage.removeItem(legacyKey)
      logger.info('✅ [ImageCache] 已清理 localStorage 中的旧数据')
    } catch (error) {
      logger.error('❌ [ImageCache] 数据迁移失败:', error)
      // 迁移失败不影响后续使用，只是旧数据无法访问
    }
  }

  /**
   * 从缓存中获取图片
   *
   * @param description 图片描述文本
   * @returns Promise，resolve 时返回图片 data URL（如果不存在则返回 null）
   */
  static async getImage(description: string): Promise<string | null> {
    await this.ensureInitialized()

    const characterName = this.getCurrentCharacterName()
    if (!characterName) {
      return null
    }

    try {
      const record = await indexedDBHelper.getByKey(characterName, description)
      if (record) {
        logger.debug(`✅ [ImageCache] 缓存命中: ${description.substring(0, 50)}...`)
        return record.imageUrl
      }

      logger.debug(`⚠️ [ImageCache] 缓存未命中: ${description.substring(0, 50)}...`)
      return null
    } catch (error) {
      logger.error('❌ [ImageCache] 获取缓存失败:', error)
      return null
    }
  }

  /**
   * 将图片保存到缓存
   *
   * @param description 图片描述文本
   * @param imageUrl 图片 data URL
   * @returns Promise，resolve 时返回是否保存成功
   */
  static async setImage(description: string, imageUrl: string): Promise<boolean> {
    await this.ensureInitialized()

    const characterName = this.getCurrentCharacterName()
    if (!characterName) {
      return false
    }

    try {
      // 创建缓存记录
      const record: ImageCacheRecord = {
        characterName,
        description,
        imageUrl,
        timestamp: Date.now(),
      }

      // 保存到 IndexedDB
      await indexedDBHelper.put(record)

      // 获取缓存上限设置
      const settingsStore = useSettingsStore()
      const limit = settingsStore.settings.imageCacheLimit

      // 清理超出上限的旧缓存
      await indexedDBHelper.cleanupOldCache(characterName, limit)

      logger.info(`✅ [ImageCache] 图片已缓存: ${description.substring(0, 50)}...`)
      return true
    } catch (error) {
      logger.error('❌ [ImageCache] 保存缓存失败:', error)
      return false
    }
  }

  /**
   * 从缓存中删除图片
   *
   * @param description 图片描述文本
   * @returns Promise，resolve 时返回是否删除成功
   */
  static async deleteImage(description: string): Promise<boolean> {
    await this.ensureInitialized()

    const characterName = this.getCurrentCharacterName()
    if (!characterName) {
      return false
    }

    try {
      await indexedDBHelper.deleteByKey(characterName, description)
      logger.info(`✅ [ImageCache] 缓存已删除: ${description.substring(0, 50)}...`)
      return true
    } catch (error) {
      logger.error('❌ [ImageCache] 删除缓存失败:', error)
      return false
    }
  }

  /**
   * 清空当前角色卡的所有缓存
   *
   * @returns Promise，resolve 时返回是否清空成功
   */
  static async clearCache(): Promise<boolean> {
    await this.ensureInitialized()

    const characterName = this.getCurrentCharacterName()
    if (!characterName) {
      return false
    }

    try {
      const deleteCount = await indexedDBHelper.clearByCharacter(characterName)
      logger.info(`✅ [ImageCache] 缓存已清空，删除了 ${deleteCount} 条记录`)
      return true
    } catch (error) {
      logger.error('❌ [ImageCache] 清空缓存失败:', error)
      return false
    }
  }

  /**
   * 获取缓存统计信息
   *
   * @returns Promise，resolve 时返回缓存统计信息
   */
  static async getCacheStats(): Promise<{
    count: number
    totalSize: number
    characterName: string | null
    limit: number
  }> {
    await this.ensureInitialized()

    const characterName = this.getCurrentCharacterName()
    const settingsStore = useSettingsStore()
    const limit = settingsStore.settings.imageCacheLimit

    if (!characterName) {
      return {
        count: 0,
        totalSize: 0,
        characterName: null,
        limit,
      }
    }

    try {
      const stats = await indexedDBHelper.getStatsByCharacter(characterName)
      return {
        count: stats.count,
        totalSize: stats.totalSize,
        characterName,
        limit,
      }
    } catch (error) {
      logger.error('❌ [ImageCache] 获取缓存统计失败:', error)
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
