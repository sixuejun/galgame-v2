import { logger } from '../../utils/logger'
import { WorldbookApi } from '../api'

/**
 * 世界书条目名称常量
 */
export const WORLDBOOK_NAME_PREFIX = 'EdenSystem_Data'
export const ENTRY_NAME_SAVE = '自动存档数据'
export const ENTRY_NAME_INIT = '初始化数据'

/**
 * 世界书状态枚举
 */
export enum WorldbookStatus {
  EMPTY = 'empty', // 世界书为空，需要初始化
  HAS_INIT = 'has_init', // 有初始化数据
  HAS_SAVE = 'has_save', // 有存档数据
  HAS_AUTO_SAVE = 'has_auto_save', // 有自动存档数据
}

/**
 * 角色卡绑定状态接口
 */
export interface CharacterBindingStatus {
  hasBound: boolean // 是否已绑定任何世界书
  worldbookName: string | null // 绑定的世界书名称
  isEdenWorldbook: boolean // 是否为伊甸园世界书
}

/**
 * 世界书连接服务 - 负责环境检测和世界书连接
 */
export class WorldbookConnectionService {
  // 当前使用的世界书名称（缓存）
  private static currentWorldbookName: string | null = null

  /**
   * 检测 JS-Slash-Runner 环境是否可用
   * @returns 是否在 JS-Slash-Runner 环境中
   */
  static isJSSlashRunnerAvailable(): boolean {
    return WorldbookApi.isAvailable()
  }

  /**
   * 检查当前角色卡是否绑定了世界书
   * @returns 绑定状态信息
   */
  static async checkCharacterBinding(): Promise<CharacterBindingStatus> {
    if (!this.isJSSlashRunnerAvailable()) {
      return { hasBound: false, worldbookName: null, isEdenWorldbook: false }
    }

    try {
      // 获取角色卡绑定的所有世界书
      const charWorldbooks = WorldbookApi.getCharWorldbookNames('current')

      // 检查是否绑定了主世界书
      if (!charWorldbooks.primary) {
        logger.info('📚 当前角色卡未绑定任何世界书')
        return { hasBound: false, worldbookName: null, isEdenWorldbook: false }
      }

      const worldbookName = charWorldbooks.primary
      const isEdenWorldbook = worldbookName.startsWith(WORLDBOOK_NAME_PREFIX)

      logger.info(`📚 当前角色卡绑定的世界书: ${worldbookName}`)
      logger.info(`📚 是否为伊甸园世界书: ${isEdenWorldbook}`)

      return {
        hasBound: true,
        worldbookName,
        isEdenWorldbook,
      }
    } catch (error) {
      logger.error('❌ 检查角色卡绑定失败:', error)
      return { hasBound: false, worldbookName: null, isEdenWorldbook: false }
    }
  }

  /**
   * 创建新世界书并绑定到当前角色卡
   * @returns 创建的世界书名称
   */
  static async createAndBindWorldbook(): Promise<string> {
    if (!this.isJSSlashRunnerAvailable()) {
      throw new Error('JS-Slash-Runner 环境不可用')
    }

    try {
      // 生成新的世界书名称
      const worldbookName = this.generateWorldbookName()

      logger.info(`📚 创建新世界书: ${worldbookName}`)
      await WorldbookApi.createWorldbook(worldbookName, [])

      // 绑定到当前角色卡
      const charWorldbooks = WorldbookApi.getCharWorldbookNames('current')

      logger.info(`🔗 绑定世界书到当前角色卡: ${worldbookName}`)
      await WorldbookApi.rebindCharWorldbooks('current', {
        primary: worldbookName,
        additional: charWorldbooks.additional,
      })

      // 缓存世界书名称
      this.currentWorldbookName = worldbookName

      logger.info('✅ 世界书创建并绑定成功')
      return worldbookName
    } catch (error) {
      logger.error('❌ 创建并绑定世界书失败:', error)
      throw error
    }
  }

  /**
   * 确保世界书存在
   *
   * 逻辑：
   * 1. 如果当前角色卡已绑定任何世界书，则复用该世界书
   * 2. 如果当前角色卡未绑定任何世界书，则创建新的伊甸园世界书并绑定
   *
   * @returns 世界书名称
   */
  static async ensureWorldbookExists(): Promise<string> {
    // 检查缓存
    if (this.currentWorldbookName) {
      return this.currentWorldbookName
    }

    // 检查角色卡绑定状态
    const bindingStatus = await this.checkCharacterBinding()

    if (bindingStatus.hasBound && bindingStatus.worldbookName) {
      // 角色卡已绑定世界书，直接复用
      this.currentWorldbookName = bindingStatus.worldbookName
      logger.info(`📚 复用已绑定的世界书: ${bindingStatus.worldbookName}`)
      return bindingStatus.worldbookName
    }

    // 角色卡未绑定任何世界书，创建新的伊甸园世界书
    logger.info('📚 角色卡未绑定世界书，创建新的伊甸园世界书')
    return await this.createAndBindWorldbook()
  }

  /**
   * 生成世界书名称
   * @returns 世界书名称
   */
  private static generateWorldbookName(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    return `${WORLDBOOK_NAME_PREFIX}_${timestamp}`
  }

  /**
   * 获取当前世界书名称（从缓存）
   * @returns 世界书名称或 null
   */
  static getCurrentWorldbookName(): string | null {
    return this.currentWorldbookName
  }

  /**
   * 清除缓存的世界书名称
   */
  static clearCache(): void {
    this.currentWorldbookName = null
  }
}
