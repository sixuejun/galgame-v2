import type { GameData, YamlUpdateOperation } from '../../types'
import { logger } from '../../utils/logger'
import { validateAndLogGameData } from '../../utils/dataValidation'
import { PathResolver } from './pathResolver'
import { YamlParser } from './yamlParser'

/**
 * 数据合并器 - 处理游戏数据的更新、删除和合并操作
 *
 * 职责：
 * - 应用 YAML 更新操作到游戏数据
 * - 处理 $update、$delete 操作符
 * - 处理初始化场景
 * - 验证最终的游戏数据
 *
 * @example
 * DataMerger.applyYamlUpdate(gameData, yamlContent)
 */
export class DataMerger {
  /**
   * 深度拷贝对象
   * 用于避免修改原始对象
   *
   * @param obj 要拷贝的对象
   * @returns 拷贝后的对象
   */
  static deepCopy<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepCopy(item)) as T
    }

    const copy: Record<string, unknown> = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        copy[key] = this.deepCopy((obj as Record<string, unknown>)[key])
      }
    }

    return copy as T
  }

  /**
   * 应用 YAML 更新操作到游戏数据
   * 支持 $update 和 $delete 操作符
   *
   * @param gameData 游戏数据对象(会被直接修改)
   * @param yamlContent YAML 内容字符串
   *
   * @example
   * ```yaml
   * $update:
   *   "gameData.story.time": "清晨 7:46"
   *   "gameData.story.content": "故事内容..."
   *   "gameData.choices":
   *     - text: "选项1"
   *     - text: "选项2"
   *
   * $delete:
   *   - "gameData.system.storage.inventory.used_item"
   * ```
   */
  static applyYamlUpdate(gameData: GameData, yamlContent: string): void {
    try {
      logger.info('📝 开始应用 YAML 更新...')

      // 1. 解析 YAML 内容
      const parsed = YamlParser.parse(yamlContent)

      let updateCount = 0
      let deleteCount = 0

      // 2. 处理 $update 操作
      if (parsed.$update && typeof parsed.$update === 'object') {
        updateCount = this.applyUpdateOperation(gameData, parsed.$update)
      }

      // 3. 处理 $delete 操作
      if (parsed.$delete && Array.isArray(parsed.$delete)) {
        deleteCount = this.applyDeleteOperation(gameData, parsed.$delete)
      }

      // 4. 处理初始化场景(直接包含 gameData 对象,无操作符)
      const operationType = YamlParser.getOperationType(parsed)
      if (!operationType.hasUpdate && !operationType.hasDelete && operationType.hasGameData) {
        this.applyInitializationOperation(gameData, parsed)
      }

      // 6. 验证最终的游戏数据
      logger.debug('[YAML更新] 验证最终游戏数据...')
      validateAndLogGameData(gameData, false)

      logger.info(`✅ YAML 更新完成: ${updateCount} 个更新, ${deleteCount} 个删除`)
    } catch (error) {
      logger.error('❌ 应用 YAML 更新失败:', error)
      throw error
    }
  }

  /**
   * 应用 $update 操作
   *
   * @param gameData 游戏数据对象
   * @param updates 更新操作对象
   * @returns 更新操作的数量
   */
  private static applyUpdateOperation(
    gameData: GameData,
    updates: Record<string, unknown>
  ): number {
    logger.debug('[YAML更新] 开始处理 $update 操作...')

    let updateCount = 0

    // 特殊处理：如果 $update 中包含 gameData 键，则展开其内容并与其他键合并
    if (updates.gameData && typeof updates.gameData === 'object') {
      logger.debug('[YAML更新] 检测到 gameData 包装层，展开处理...')

      // 提取 gameData 的内容
      const gameDataContent = updates.gameData as Record<string, unknown>

      // 创建新的 updates 对象，排除 gameData 键
      const otherUpdates: Record<string, unknown> = {}
      for (const key in updates) {
        if (key !== 'gameData' && updates.hasOwnProperty(key)) {
          otherUpdates[key] = updates[key]
        }
      }

      // 合并 gameData 内容和其他更新
      const mergedUpdates = { ...gameDataContent, ...otherUpdates }

      logger.debug('[YAML更新] gameData 内容已展开并合并')

      // 递归调用，处理合并后的内容
      return this.applyUpdateOperation(gameData, mergedUpdates)
    }

    for (const path in updates) {
      if (updates.hasOwnProperty(path)) {
        const value = updates[path]

        try {
          // 判断是否为点路径格式
          const isDotPath = path.includes('.')

          if (isDotPath) {
            // 点路径格式: "gameData.story.time" 或 "story.time"
            // 移除路径开头的 "gameData." 前缀(如果存在)
            const cleanPath = PathResolver.cleanPath(path)

            // 特殊处理：summaries 字段仅追加，不覆盖
            if (cleanPath === 'summaries' && Array.isArray(value)) {
              if (!gameData.summaries) {
                gameData.summaries = []
              }
              // 追加新的摘要记录
              gameData.summaries.push(...value)
              logger.debug(`[YAML更新] 追加 ${value.length} 条摘要记录`)
              updateCount++
            } else {
              PathResolver.setByPath(gameData as Record<string, unknown>, cleanPath, value)
              updateCount++
            }
          } else {
            // 非点路径格式: "choices", "characters", "summaries" 等
            // 直接作为 gameData 的顶层属性处理
            const gameDataRecord = gameData as Record<string, unknown>

            // 特殊处理：summaries 字段仅追加，不覆盖
            if (path === 'summaries' && Array.isArray(value)) {
              if (!gameData.summaries) {
                gameData.summaries = []
              }
              // 追加新的摘要记录
              gameData.summaries.push(...value)
              logger.debug(`[YAML更新] 追加 ${value.length} 条摘要记录`)
              updateCount++
            } else {
              // 使用 PathResolver.setByPath 进行深度合并
              PathResolver.setByPath(gameDataRecord, path, value)
              logger.debug(`[YAML更新] 成功设置顶层属性 "${path}"`)
              updateCount++
            }
          }
        } catch (error) {
          logger.error(`[YAML更新] 设置路径 "${path}" 失败:`, error)
        }
      }
    }

    logger.info(`[YAML更新] ✅ 完成 ${updateCount} 个更新操作`)
    return updateCount
  }

  /**
   * 应用 $delete 操作
   *
   * @param gameData 游戏数据对象
   * @param deletePaths 要删除的路径数组
   * @returns 删除操作的数量
   */
  private static applyDeleteOperation(gameData: GameData, deletePaths: string[]): number {
    logger.debug('[YAML更新] 开始处理 $delete 操作...')

    let deleteCount = 0

    for (const path of deletePaths) {
      try {
        // 移除路径开头的 "gameData." 前缀(如果存在)
        const cleanPath = PathResolver.cleanPath(path)

        const success = PathResolver.deleteByPath(gameData as Record<string, unknown>, cleanPath)
        if (success) {
          deleteCount++
        }
      } catch (error) {
        logger.error(`[YAML更新] 删除路径 "${path}" 失败:`, error)
      }
    }

    logger.info(`[YAML更新] ✅ 完成 ${deleteCount} 个删除操作`)
    return deleteCount
  }

  /**
   * 应用初始化操作
   *
   * @param gameData 游戏数据对象
   * @param parsed 解析后的 YAML 对象
   */
  private static applyInitializationOperation(
    gameData: GameData,
    parsed: YamlUpdateOperation
  ): void {
    logger.info('[YAML更新] 检测到初始化场景,直接使用 gameData 对象')

    // 验证 gameData
    const validation = validateAndLogGameData(parsed.gameData!, false)
    if (!validation.valid) {
      logger.warn('[YAML更新] ⚠️ 数据验证失败，但仍将应用更新')
    }

    // 清空现有数据
    const gameDataRecord = gameData as Record<string, unknown>
    for (const key in gameDataRecord) {
      if (Object.prototype.hasOwnProperty.call(gameDataRecord, key)) {
        delete gameDataRecord[key]
      }
    }

    // 复制新数据
    Object.assign(gameData, parsed.gameData)
    logger.info('[YAML更新] ✅ 已初始化游戏数据')
  }
}
