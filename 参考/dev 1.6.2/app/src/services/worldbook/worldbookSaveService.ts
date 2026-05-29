import type { GameData } from '../../types'
import * as yaml from 'js-yaml'
import { logger } from '../../utils/logger'
import { WorldbookApi } from '../api'
import { WorldbookConnectionService } from './worldbookConnectionService'

/**
 * 存档信息接口
 */
export interface SaveInfo {
  name: string // 存档名称
  number?: number // 存档编号（手动存档）
  saveType: 'auto' | 'manual' | 'init' // 存档类型
  saveTime: string // 存档时间
  version?: string // 游戏版本
  phase?: string // 游戏阶段
}

/**
 * 世界书存档服务 - 负责手动存档管理
 */
export class WorldbookSaveService {
  /**
   * 获取下一个可用的存档编号
   * @returns 下一个存档编号
   */
  static async getNextSaveNumber(): Promise<number> {
    if (!WorldbookConnectionService.isJSSlashRunnerAvailable()) {
      return 1
    }

    try {
      const worldbookName = await WorldbookConnectionService.ensureWorldbookExists()
      const worldbook = await WorldbookApi.getWorldbook(worldbookName)

      // 查找所有手动存档条目（格式：存档数据1, 存档数据2, ...）
      const saveEntries = worldbook.filter(entry => /^存档数据\d+$/.test(entry.name))

      if (saveEntries.length === 0) {
        return 1
      }

      // 提取所有编号
      const numbers = saveEntries.map(entry => {
        const match = entry.name.match(/^存档数据(\d+)$/)
        return match ? parseInt(match[1], 10) : 0
      })

      // 返回最大编号 + 1
      return Math.max(...numbers) + 1
    } catch (error) {
      logger.error('❌ 获取下一个存档编号失败:', error)
      return 1
    }
  }

  /**
   * 手动保存游戏
   * @param gameData 游戏数据
   * @param saveNumber 存档编号（可选，不提供则自动分配）
   * @returns 存档名称
   */
  static async manualSave(gameData: GameData, saveNumber?: number): Promise<string> {
    if (!WorldbookConnectionService.isJSSlashRunnerAvailable()) {
      throw new Error('JS-Slash-Runner 环境不可用')
    }

    try {
      // 1. 确保世界书存在
      const worldbookName = await WorldbookConnectionService.ensureWorldbookExists()

      // 2. 获取存档编号
      const actualSaveNumber = saveNumber ?? (await this.getNextSaveNumber())
      const saveName = `存档数据${actualSaveNumber}`

      logger.info(`💾 开始手动保存游戏到: ${saveName}`)

      // 3. 构造存档数据结构（保持 gameData 的嵌套结构）
      const saveData = {
        gameData: gameData,
        _saveInfo: {
          saveTime: new Date().toISOString(),
          saveNumber: actualSaveNumber,
          version: gameData.config?.version || 'unknown',
          phase: gameData.config?.phase || 'unknown',
        },
      }

      // 4. 序列化游戏数据
      const yamlContent = yaml.dump(saveData, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
      })

      // 5. 获取现有世界书
      const worldbook = await WorldbookApi.getWorldbook(worldbookName)

      // 6. 查找或创建存档条目
      let saveEntry = worldbook.find(entry => entry.name === saveName)

      if (saveEntry) {
        // 更新现有存档
        saveEntry.content = yamlContent
        logger.info(`📝 更新存档: ${saveName}`)
      } else {
        // 创建新存档
        saveEntry = {
          name: saveName,
          content: yamlContent,
          enabled: false, // 默认关闭，避免每次请求都附带存档数据
          strategy: {
            type: 'constant',
            keys: [],
            keys_secondary: { logic: 'AND', keys: [] },
            scan_depth: '0',
          },
          position: {
            type: 'after_char',
            role: 'system',
            depth: 0,
          },
        }
        worldbook.push(saveEntry)
        logger.info(`📝 创建新存档: ${saveName}`)
      }

      // 7. 更新世界书
      await WorldbookApi.updateWorldbookWith(worldbookName, () => worldbook)

      logger.info(`✅ 手动保存成功: ${saveName}`)
      return saveName
    } catch (error) {
      logger.error('❌ 手动保存失败:', error)
      throw error
    }
  }

  /**
   * 获取所有存档信息
   * @returns 存档信息列表
   */
  static async getAllSaves(): Promise<SaveInfo[]> {
    if (!WorldbookConnectionService.isJSSlashRunnerAvailable()) {
      logger.warn('⚠️ JS-Slash-Runner 环境不可用')
      return []
    }

    try {
      const worldbookName = await WorldbookConnectionService.ensureWorldbookExists()
      const worldbook = await WorldbookApi.getWorldbook(worldbookName)

      const saves: SaveInfo[] = []

      // 遍历所有条目
      for (const entry of worldbook) {
        let saveType: 'auto' | 'manual' | 'init' | null = null
        let saveNumber: number | undefined

        // 判断存档类型
        if (entry.name === '自动存档数据') {
          saveType = 'auto'
        } else if (entry.name === '初始化数据') {
          saveType = 'init'
        } else if (/^存档数据\d+$/.test(entry.name)) {
          saveType = 'manual'
          const match = entry.name.match(/^存档数据(\d+)$/)
          saveNumber = match ? parseInt(match[1], 10) : undefined
        }

        if (!saveType) continue

        // 解析存档数据获取元信息
        try {
          const saveData = yaml.load(entry.content) as {
            gameData?: GameData
            _saveInfo?: {
              saveTime?: string
              version?: string
              phase?: string
            }
          }

          // 提取 gameData 字段（兼容新旧格式）
          const gameData = saveData.gameData || (saveData as GameData)

          saves.push({
            name: entry.name,
            number: saveNumber,
            saveType,
            saveTime: saveData._saveInfo?.saveTime || 'unknown',
            version: saveData._saveInfo?.version || gameData.config?.version,
            phase: saveData._saveInfo?.phase || gameData.story?.location,
          })
        } catch (error) {
          logger.warn(`⚠️ 解析存档失败: ${entry.name}`, error)
        }
      }

      // 按存档类型和编号排序
      saves.sort((a, b) => {
        // 自动存档排在最前
        if (a.saveType === 'auto') return -1
        if (b.saveType === 'auto') return 1

        // 初始化数据排在第二
        if (a.saveType === 'init') return -1
        if (b.saveType === 'init') return 1

        // 手动存档按编号降序排列（最新的在前）
        return (b.number || 0) - (a.number || 0)
      })

      logger.info(`📚 找到 ${saves.length} 个存档`)
      return saves
    } catch (error) {
      logger.error('❌ 获取存档列表失败:', error)
      return []
    }
  }

  /**
   * 加载指定存档
   * @param saveName 存档名称
   * @returns 游戏数据或 null
   */
  static async loadSave(saveName: string): Promise<GameData | null> {
    if (!WorldbookConnectionService.isJSSlashRunnerAvailable()) {
      throw new Error('JS-Slash-Runner 环境不可用')
    }

    try {
      const worldbookName = await WorldbookConnectionService.ensureWorldbookExists()
      const worldbook = await WorldbookApi.getWorldbook(worldbookName)

      const saveEntry = worldbook.find(entry => entry.name === saveName)

      if (!saveEntry) {
        logger.warn(`⚠️ 未找到存档: ${saveName}`)
        return null
      }

      logger.info(`📚 加载存档: ${saveName}`)
      const saveData = yaml.load(saveEntry.content) as {
        gameData?: GameData
        _saveInfo?: unknown
      }

      // 提取 gameData 字段
      let gameData = saveData.gameData || (saveData as GameData)

      // 移除元信息字段（如果存在）
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((gameData as any)._saveInfo) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
        const { _saveInfo, ...cleanGameData } = gameData as any
        gameData = cleanGameData as GameData
      }

      logger.info(`✅ 存档加载成功: ${saveName}`)
      return gameData
    } catch (error) {
      logger.error(`❌ 加载存档失败: ${saveName}`, error)
      throw error
    }
  }

  /**
   * 删除指定存档
   * @param saveName 存档名称
   */
  static async deleteSave(saveName: string): Promise<void> {
    if (!WorldbookConnectionService.isJSSlashRunnerAvailable()) {
      throw new Error('JS-Slash-Runner 环境不可用')
    }

    try {
      const worldbookName = await WorldbookConnectionService.ensureWorldbookExists()
      const worldbook = await WorldbookApi.getWorldbook(worldbookName)

      const index = worldbook.findIndex(entry => entry.name === saveName)

      if (index === -1) {
        logger.warn(`⚠️ 未找到存档: ${saveName}`)
        return
      }

      logger.info(`🗑️ 删除存档: ${saveName}`)
      worldbook.splice(index, 1)

      await WorldbookApi.updateWorldbookWith(worldbookName, () => worldbook)

      logger.info(`✅ 存档删除成功: ${saveName}`)
    } catch (error) {
      logger.error(`❌ 删除存档失败: ${saveName}`, error)
      throw error
    }
  }

  /**
   * 清空所有存档（清空游戏相关的三种条目：初始化数据、手动存档、自动存档，保留其他世界书条目）
   */
  static async clearAllSaves(): Promise<void> {
    if (!WorldbookConnectionService.isJSSlashRunnerAvailable()) {
      throw new Error('JS-Slash-Runner 环境不可用')
    }

    try {
      const worldbookName = await WorldbookConnectionService.ensureWorldbookExists()
      const worldbook = await WorldbookApi.getWorldbook(worldbookName)

      // 过滤掉游戏相关的三种条目，保留其他世界书条目
      const filteredWorldbook = worldbook.filter(entry => {
        // 清空初始化数据
        if (entry.name === '初始化数据') {
          return false
        }
        // 清空所有手动存档（存档数据1, 存档数据2, ...）
        if (/^存档数据\d+$/.test(entry.name)) {
          return false
        }
        // 清空自动存档数据
        if (entry.name === '自动存档数据') {
          return false
        }
        // 保留其他世界书条目
        return true
      })

      logger.info(`🗑️ 清空游戏相关的所有条目（初始化数据、手动存档、自动存档）`)
      await WorldbookApi.updateWorldbookWith(worldbookName, () => filteredWorldbook)

      logger.info(`✅ 游戏相关的所有条目已清空`)
    } catch (error) {
      logger.error('❌ 清空存档失败:', error)
      throw error
    }
  }
}
