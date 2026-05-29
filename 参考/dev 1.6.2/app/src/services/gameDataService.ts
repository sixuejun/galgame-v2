import { WorldbookConnectionService, WorldbookDataService } from './worldbook'
import { DataMerger } from './dataUpdate'
import { DataBackupService } from './dataBackupService'
import { logger } from '../utils/logger'
import { wrapAsync, ErrorCategory, NetworkError, ParseError, AppError } from '../utils/errorHandler'
import { validateAndLogGameData } from '../utils/dataValidation'
import * as yaml from 'js-yaml'
import type { GameData } from '../types'

/**
 * 游戏数据服务 - 负责游戏数据的加载、保存和处理
 */
export class GameDataService {
  /**
   * 检查世界书状态
   */
  static async checkWorldbookStatus() {
    return await WorldbookDataService.checkWorldbookStatus()
  }

  /**
   * 处理本地示例数据加载
   */
  private static async handleLocalExampleData(): Promise<{
    gameData: GameData
    needsInitialization: boolean
    error: string | null
  }> {
    logger.info('⚠️ JS-Slash-Runner 环境不可用，将尝试加载本地示例数据')
    const exampleData = await this.loadLocalExampleData()

    if (exampleData) {
      logger.info('✅ 本地示例数据加载成功')
      return {
        gameData: exampleData,
        needsInitialization: false,
        error: null,
      }
    }

    logger.error('❌ 本地示例数据加载失败')
    return {
      gameData: {},
      needsInitialization: true,
      error: '本地示例数据加载失败',
    }
  }

  /**
   * 处理未绑定世界书的情况
   */
  private static async handleUnboundWorldbook(): Promise<{
    gameData: GameData
    needsInitialization: boolean
    error: string | null
  }> {
    logger.info('📚 未绑定任何世界书，创建新伊甸园世界书并绑定...')
    await WorldbookConnectionService.createAndBindWorldbook()
    return {
      gameData: {},
      needsInitialization: true,
      error: null,
    }
  }

  /**
   * 从世界书加载数据
   */
  private static async loadFromWorldbook(
    worldbookName: string,
    dataStatus: { hasAutoSave: boolean; hasInit: boolean }
  ): Promise<GameData | null> {
    let loadedData: GameData | null = null

    if (dataStatus.hasAutoSave) {
      logger.info('🎯 尝试加载自动存档数据...')
      loadedData = await WorldbookDataService.loadAutoSave(worldbookName)
    }

    if (!loadedData && dataStatus.hasInit) {
      logger.info('🎯 尝试加载初始化数据...')
      loadedData = await WorldbookDataService.loadInitData(worldbookName)
    }

    return loadedData
  }

  /**
   * 加载游戏数据
   * @returns 包含游戏数据和初始化状态的对象
   */
  static async loadGameData(): Promise<{
    gameData: GameData
    needsInitialization: boolean
    error: string | null
  }> {
    try {
      logger.info('🎮 开始加载游戏数据...')

      // 1. 检查 JS-Slash-Runner 环境是否可用
      if (!WorldbookConnectionService.isJSSlashRunnerAvailable()) {
        return await this.handleLocalExampleData()
      }

      // 2. 检查当前角色卡是否绑定了世界书
      const bindingStatus = await WorldbookConnectionService.checkCharacterBinding()
      if (!bindingStatus.hasBound) {
        return await this.handleUnboundWorldbook()
      }

      // 3. 已绑定世界书，检查世界书中的数据状态
      const worldbookName = bindingStatus.worldbookName!
      logger.info(
        `📚 使用世界书: ${worldbookName} (${bindingStatus.isEdenWorldbook ? '伊甸园世界书' : '角色自带世界书'})`
      )

      const dataStatus = await WorldbookDataService.checkWorldbookData(worldbookName)
      logger.info(`📊 世界书数据状态:`, dataStatus)

      // 4. 根据数据状态加载游戏数据
      const loadedData = await this.loadFromWorldbook(worldbookName, dataStatus)

      if (loadedData) {
        logger.info('✅ 游戏数据加载成功')
        return {
          gameData: loadedData,
          needsInitialization: false,
          error: null,
        }
      }

      logger.warn('⚠️ 未能加载游戏数据，需要初始化')
      return {
        gameData: {},
        needsInitialization: true,
        error: null,
      }
    } catch (error) {
      logger.error('❌ 加载游戏数据失败:', error)
      const errorMsg =
        error instanceof AppError
          ? error.getUserMessage()
          : error instanceof Error
            ? error.message
            : '操作失败，请稍后重试'
      return {
        gameData: {},
        needsInitialization: true,
        error: errorMsg,
      }
    }
  }

  /**
   * 加载本地示例数据
   */
  static async loadLocalExampleData(): Promise<GameData | null> {
    return await wrapAsync(
      async () => {
        // 尝试加载 data.yaml 文件
        // 使用相对路径以支持 Live Server 等静态服务器
        const dataFilePath = import.meta.env.VITE_DATA_FILE_PATH || './data.yaml'
        const response = await fetch(dataFilePath)
        if (!response.ok) {
          throw new NetworkError(`无法加载示例数据: ${response.status} ${response.statusText}`)
        }
        const yamlText = await response.text()

        try {
          const parsed = yaml.load(yamlText) as { gameData?: GameData }

          if (!parsed || !parsed.gameData) {
            throw new ParseError('示例数据格式错误：缺少 gameData 字段')
          }

          logger.info('✅ 本地示例数据解析成功')
          return parsed.gameData
        } catch (error) {
          throw new ParseError('示例数据解析失败', {
            originalError: error instanceof Error ? error.message : String(error),
          })
        }
      },
      '加载本地示例数据失败',
      ErrorCategory.NETWORK
    ).catch(error => {
      logger.error('❌ 加载本地示例数据失败:', error)
      return null
    })
  }

  /**
   * 保存初始化数据
   */
  static async saveInitializationData(data: GameData): Promise<void> {
    await wrapAsync(
      async () => {
        logger.info('💾 保存初始化数据到世界书...')
        await WorldbookDataService.saveInitDataToWorldbook(data)
        logger.info('✅ 初始化数据保存成功')
      },
      '保存初始化数据失败',
      ErrorCategory.UNKNOWN
    )
  }

  /**
   * 自动保存游戏数据到世界书
   */
  static async autoSaveToWorldbook(gameData: GameData): Promise<void> {
    await wrapAsync(
      async () => {
        logger.info('💾 自动保存游戏数据到世界书...')
        await WorldbookDataService.saveGameDataToWorldbook(gameData)
        logger.info('✅ 自动保存成功')
      },
      '自动保存游戏数据失败',
      ErrorCategory.UNKNOWN
    )
  }

  /**
   * 从AI响应更新游戏数据（带备份和恢复机制）
   *
   * 流程：
   * 1. 创建数据备份
   * 2. 应用数据更新
   * 3. 验证更新后的数据
   * 4. 如果验证失败，从备份恢复并抛出错误
   * 5. 如果验证成功，清理备份
   *
   * @param gameData 游戏数据对象（会被直接修改）
   * @param yamlContent YAML 内容字符串
   * @throws {ParseError} 数据更新或验证失败
   */
  static updateGameDataFromAI(gameData: GameData, yamlContent: string): void {
    let backupId: string | null = null

    try {
      logger.info('🔄 开始更新游戏数据...')

      // 1. 创建数据备份
      backupId = DataBackupService.createBackup(gameData)
      logger.debug(`[数据更新] 备份已创建: ${backupId}`)

      // 2. 应用数据更新
      DataMerger.applyYamlUpdate(gameData, yamlContent)

      // 3. 验证更新后的数据
      logger.debug('[数据更新] 验证更新后的数据...')
      const validation = validateAndLogGameData(gameData, false)

      if (!validation.valid) {
        // 验证失败，从备份恢复
        logger.error('[数据更新] 数据验证失败，从备份恢复...')
        DataBackupService.restoreFromBackup(gameData, backupId)
        DataBackupService.clearBackup(backupId)

        throw new ParseError('数据更新后验证失败', {
          errors: validation.errors,
          warnings: validation.warnings,
        })
      }

      // 4. 验证成功，清理备份
      DataBackupService.clearBackup(backupId)
      logger.info('✅ 游戏数据更新成功')
    } catch (error) {
      // 如果是验证失败的错误，直接抛出
      if (error instanceof ParseError && error.message.includes('验证失败')) {
        throw error
      }

      // 其他错误，尝试从备份恢复
      if (backupId) {
        logger.error('[数据更新] 更新失败，从备份恢复...')
        DataBackupService.restoreFromBackup(gameData, backupId)
        DataBackupService.clearBackup(backupId)
      }

      const parseError = new ParseError('更新游戏数据失败', {
        originalError: error instanceof Error ? error.message : String(error),
      })
      logger.error(parseError.toLogFormat())
      throw parseError
    }
  }

  /**
   * 导出游戏数据
   */
  static exportGameData(gameData: GameData, userActionsCount: number): string {
    try {
      const exportData = {
        gameData: { ...gameData },
        exportInfo: {
          type: '伊甸园数据导出',
          timestamp: new Date().toISOString(),
          userActions: userActionsCount,
        },
      }
      delete exportData.gameData.story
      delete exportData.gameData.choices
      return yaml.dump(exportData)
    } catch (error) {
      const parseError = new ParseError('导出游戏数据失败', {
        originalError: error instanceof Error ? error.message : String(error),
      })
      logger.error(parseError.toLogFormat())
      throw parseError
    }
  }
}
