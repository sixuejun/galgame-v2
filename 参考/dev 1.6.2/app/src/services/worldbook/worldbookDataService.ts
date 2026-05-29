import type { GameData } from '../../types'
import * as yaml from 'js-yaml'
import { logger } from '../../utils/logger'
import { WorldbookApi } from '../api'
import {
  WorldbookConnectionService,
  ENTRY_NAME_SAVE,
  ENTRY_NAME_INIT,
  WorldbookStatus,
} from './worldbookConnectionService'

/**
 * 世界书数据状态接口
 */
export interface WorldbookDataStatus {
  hasAutoSave: boolean // 是否有自动存档数据
  hasInit: boolean // 是否有初始化数据
  hasManualSave: boolean // 是否有手动存档数据
}

/**
 * 世界书数据服务 - 负责数据的加载和保存
 */
export class WorldbookDataService {
  /**
   * 检查世界书中的数据状态
   * @param worldbookName 世界书名称
   * @returns 数据状态
   */
  static async checkWorldbookData(worldbookName: string): Promise<WorldbookDataStatus> {
    if (!WorldbookConnectionService.isJSSlashRunnerAvailable()) {
      return { hasAutoSave: false, hasInit: false, hasManualSave: false }
    }

    try {
      const worldbook = await WorldbookApi.getWorldbook(worldbookName)

      const hasAutoSave = worldbook.some(entry => entry.name === ENTRY_NAME_SAVE)
      const hasInit = worldbook.some(entry => entry.name === ENTRY_NAME_INIT)
      const hasManualSave = worldbook.some(entry => /^存档数据\d+$/.test(entry.name))

      logger.debug('📊 世界书数据状态:', {
        hasAutoSave,
        hasInit,
        hasManualSave,
      })

      return { hasAutoSave, hasInit, hasManualSave }
    } catch (error) {
      logger.error('❌ 检查世界书数据失败:', error)
      return { hasAutoSave: false, hasInit: false, hasManualSave: false }
    }
  }

  /**
   * 从世界书加载自动存档数据
   * @param worldbookName 世界书名称
   * @returns 游戏数据或 null
   */
  static async loadAutoSave(worldbookName: string): Promise<GameData | null> {
    if (!WorldbookConnectionService.isJSSlashRunnerAvailable()) {
      logger.warn('⚠️ JS-Slash-Runner 环境不可用')
      return null
    }

    try {
      const worldbook = await WorldbookApi.getWorldbook(worldbookName)
      const saveEntry = worldbook.find(entry => entry.name === ENTRY_NAME_SAVE)

      if (!saveEntry) {
        logger.info('📚 未找到自动存档数据')
        return null
      }

      logger.info('📚 找到自动存档数据，开始解析...')
      const saveData = yaml.load(saveEntry.content) as {
        gameData?: GameData
        _saveInfo?: unknown
      }

      // 提取 gameData 字段
      const gameData = saveData.gameData || (saveData as GameData)

      logger.info('✅ 自动存档数据加载成功')
      return gameData
    } catch (error) {
      logger.error('❌ 加载自动存档数据失败:', error)
      return null
    }
  }

  /**
   * 从世界书加载初始化数据
   * @param worldbookName 世界书名称
   * @returns 游戏数据或 null
   */
  static async loadInitData(worldbookName: string): Promise<GameData | null> {
    if (!WorldbookConnectionService.isJSSlashRunnerAvailable()) {
      logger.warn('⚠️ JS-Slash-Runner 环境不可用')
      return null
    }

    try {
      const worldbook = await WorldbookApi.getWorldbook(worldbookName)
      const initEntry = worldbook.find(entry => entry.name === ENTRY_NAME_INIT)

      if (!initEntry) {
        logger.info('📚 未找到初始化数据')
        return null
      }

      logger.info('📚 找到初始化数据，开始解析...')
      const saveData = yaml.load(initEntry.content) as {
        gameData?: GameData
        _saveInfo?: unknown
      }

      // 提取 gameData 字段
      const gameData = saveData.gameData || (saveData as GameData)

      logger.info('✅ 初始化数据加载成功')
      return gameData
    } catch (error) {
      logger.error('❌ 加载初始化数据失败:', error)
      return null
    }
  }

  /**
   * 检查世界书状态
   * @returns 世界书状态
   */
  static async checkWorldbookStatus(): Promise<WorldbookStatus> {
    // 1. 检查 JS-Slash-Runner 环境是否可用
    if (!WorldbookConnectionService.isJSSlashRunnerAvailable()) {
      logger.info('⚠️ JS-Slash-Runner 环境不可用')
      return WorldbookStatus.EMPTY
    }

    try {
      // 2. 确保世界书存在
      const worldbookName = await WorldbookConnectionService.ensureWorldbookExists()

      // 3. 检查世界书中的数据状态
      const dataStatus = await this.checkWorldbookData(worldbookName)

      // 4. 根据数据状态返回世界书状态
      if (dataStatus.hasAutoSave) {
        logger.info('📚 世界书状态: 有自动存档数据')
        return WorldbookStatus.HAS_AUTO_SAVE
      }

      if (dataStatus.hasManualSave) {
        logger.info('📚 世界书状态: 有手动存档数据')
        return WorldbookStatus.HAS_SAVE
      }

      if (dataStatus.hasInit) {
        logger.info('📚 世界书状态: 有初始化数据')
        return WorldbookStatus.HAS_INIT
      }

      logger.info('📚 世界书状态: 空')
      return WorldbookStatus.EMPTY
    } catch (error) {
      logger.error('❌ 检查世界书状态失败:', error)
      return WorldbookStatus.EMPTY
    }
  }

  /**
   * 从世界书加载游戏数据
   * 优先级：自动存档 > 初始化数据
   * @returns 游戏数据或 null
   */
  static async loadGameDataFromWorldbook(): Promise<GameData | null> {
    if (!WorldbookConnectionService.isJSSlashRunnerAvailable()) {
      logger.info('⚠️ JS-Slash-Runner 环境不可用,跳过世界书数据加载')
      return null
    }

    try {
      // 1. 确保世界书存在
      const worldbookName = await WorldbookConnectionService.ensureWorldbookExists()
      logger.info(`📚 使用世界书: ${worldbookName}`)

      // 2. 检查数据状态
      const dataStatus = await this.checkWorldbookData(worldbookName)

      // 3. 优先加载自动存档数据
      if (dataStatus.hasAutoSave) {
        logger.info('📚 加载自动存档数据...')
        const autoSaveData = await this.loadAutoSave(worldbookName)
        if (autoSaveData) {
          return autoSaveData
        }
      }

      // 4. 如果没有自动存档，加载初始化数据
      if (dataStatus.hasInit) {
        logger.info('📚 加载初始化数据...')
        const initData = await this.loadInitData(worldbookName)
        if (initData) {
          return initData
        }
      }

      // 5. 如果都没有，返回 null
      logger.info('📚 世界书中没有可用的游戏数据')
      return null
    } catch (error) {
      logger.error('❌ 从世界书加载游戏数据失败:', error)
      return null
    }
  }

  /**
   * 保存游戏数据到世界书（自动存档）
   * @param gameData 游戏数据
   */
  static async saveGameDataToWorldbook(gameData: GameData): Promise<void> {
    if (!WorldbookConnectionService.isJSSlashRunnerAvailable()) {
      logger.warn('⚠️ JS-Slash-Runner 环境不可用,跳过世界书数据保存')
      return
    }

    try {
      // 1. 确保世界书存在
      const worldbookName = await WorldbookConnectionService.ensureWorldbookExists()

      // 2. 构造存档数据结构（保持 gameData 的嵌套结构）
      const saveData = {
        gameData: gameData,
        _saveInfo: {
          saveTime: new Date().toISOString(),
          version: gameData.config?.version || 'unknown',
          phase: gameData.config?.phase || 'unknown',
        },
      }

      // 3. 序列化游戏数据
      const yamlContent = yaml.dump(saveData, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
      })

      // 4. 获取现有世界书
      const worldbook = await WorldbookApi.getWorldbook(worldbookName)

      // 5. 查找或创建自动存档条目
      let saveEntry = worldbook.find(entry => entry.name === ENTRY_NAME_SAVE)

      if (saveEntry) {
        // 更新现有条目
        saveEntry.content = yamlContent
        logger.info('📝 更新自动存档数据')
      } else {
        // 创建新条目
        saveEntry = {
          name: ENTRY_NAME_SAVE,
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
        logger.info('📝 创建自动存档数据')
      }

      // 6. 更新世界书
      await WorldbookApi.updateWorldbookWith(worldbookName, () => worldbook)

      logger.info('✅ 游戏数据保存到世界书成功')
    } catch (error) {
      logger.error('❌ 保存游戏数据到世界书失败:', error)
      throw error
    }
  }

  /**
   * 保存初始化数据到世界书
   * @param gameData 游戏数据
   */
  static async saveInitDataToWorldbook(gameData: GameData): Promise<void> {
    if (!WorldbookConnectionService.isJSSlashRunnerAvailable()) {
      logger.warn('⚠️ JS-Slash-Runner 环境不可用,跳过初始化数据保存')
      return
    }

    try {
      // 1. 确保世界书存在
      const worldbookName = await WorldbookConnectionService.ensureWorldbookExists()

      // 2. 构造存档数据结构（保持 gameData 的嵌套结构）
      const saveData = {
        gameData: gameData,
        _saveInfo: {
          saveTime: new Date().toISOString(),
          version: gameData.config?.version || 'unknown',
          phase: gameData.config?.phase || 'unknown',
        },
      }

      // 3. 序列化游戏数据
      const yamlContent = yaml.dump(saveData, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
      })

      // 4. 获取现有世界书
      const worldbook = await WorldbookApi.getWorldbook(worldbookName)

      // 5. 查找或创建初始化数据条目
      let initEntry = worldbook.find(entry => entry.name === ENTRY_NAME_INIT)

      if (initEntry) {
        // 更新现有条目
        initEntry.content = yamlContent
        logger.info('📝 更新初始化数据')
      } else {
        // 创建新条目
        initEntry = {
          name: ENTRY_NAME_INIT,
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
        worldbook.push(initEntry)
        logger.info('📝 创建初始化数据')
      }

      // 6. 更新世界书
      await WorldbookApi.updateWorldbookWith(worldbookName, () => worldbook)

      logger.info('✅ 初始化数据保存到世界书成功')
    } catch (error) {
      logger.error('❌ 保存初始化数据到世界书失败:', error)
      throw error
    }
  }
}
