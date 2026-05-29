/**
 * @file characterApi.ts
 * @description 角色卡 API 封装 - 封装 JS-Slash-Runner 的角色卡相关 API
 * @author Eden System Team
 * @created 2025-11-10
 */

import { logger } from '../../utils/logger'
import { PermissionError } from '../../utils/errorHandler'

/**
 * 角色卡 API 服务
 *
 * 封装 JS-Slash-Runner 提供的角色卡相关 API
 */
export class CharacterApi {
  /**
   * 检查角色卡 API 是否可用
   * @returns 是否可用
   */
  static isAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && typeof window.getCharData === 'function'
    } catch (error) {
      logger.debug('Character API 可用性检测失败:', error)
      return false
    }
  }

  /**
   * 获取角色卡数据
   *
   * @param name 角色名称或头像ID，'current' 表示当前角色
   * @param allowAvatar 是否允许通过头像ID查找
   * @returns 角色卡数据，如果不存在则返回 null
   * @throws {PermissionError} 当 API 不可用时
   *
   * @example
   * ```typescript
   * // 获取当前角色卡数据
   * const charData = CharacterApi.getCharData('current')
   * console.log('角色名称:', charData?.name)
   * ```
   */
  static getCharData(
    name: 'current' | string = 'current',
    allowAvatar: boolean = false
    // eslint-disable-next-line no-undef
  ): SillyTavern.v1CharData | null {
    if (!this.isAvailable()) {
      throw new PermissionError('Character API 不可用')
    }

    try {
      logger.debug('[Character API] 调用 getCharData:', name, allowAvatar)
      const charData = window.getCharData(name, allowAvatar)

      if (charData) {
        logger.debug('[Character API] 获取到角色卡数据:', charData.name)
      } else {
        logger.debug('[Character API] 未找到角色卡数据')
      }

      return charData
    } catch (error) {
      logger.error('[Character API] 获取角色卡数据失败:', error)
      return null
    }
  }

  /**
   * 获取当前角色卡名称
   *
   * @returns 角色卡名称，如果无法获取则返回 null
   *
   * @example
   * ```typescript
   * const charName = CharacterApi.getCurrentCharacterName()
   * console.log('当前角色:', charName)
   * ```
   */
  static getCurrentCharacterName(): string | null {
    try {
      const charData = this.getCharData('current')
      return charData?.name || null
    } catch (error) {
      logger.error('[Character API] 获取当前角色卡名称失败:', error)
      return null
    }
  }

  /**
   * 获取角色头像路径
   *
   * @param name 角色名称或头像ID，'current' 表示当前角色
   * @param allowAvatar 是否允许通过头像ID查找
   * @returns 角色头像路径，如果不存在则返回 null
   * @throws {PermissionError} 当 API 不可用时
   */
  static getCharAvatarPath(
    name: 'current' | string = 'current',
    allowAvatar: boolean = false
  ): string | null {
    if (!this.isAvailable()) {
      throw new PermissionError('Character API 不可用')
    }

    try {
      logger.debug('[Character API] 调用 getCharAvatarPath:', name, allowAvatar)
      const avatarPath = window.getCharAvatarPath(name, allowAvatar)

      if (avatarPath) {
        logger.debug('[Character API] 获取到头像路径:', avatarPath)
      } else {
        logger.debug('[Character API] 未找到头像路径')
      }

      return avatarPath
    } catch (error) {
      logger.error('[Character API] 获取头像路径失败:', error)
      return null
    }
  }
}
