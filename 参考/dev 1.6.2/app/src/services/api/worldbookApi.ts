import type { WorldbookEntry, CharWorldbooks } from '../../types/external-apis'
import { logger } from '../../utils/logger'
import { wrapAsync, ErrorCategory, PermissionError, NetworkError } from '../../utils/errorHandler'

/**
 * Worldbook API 服务 - 统一管理所有 Worldbook 相关的外部 API 调用
 *
 * 职责：
 * - 封装所有 Worldbook 相关的 window API
 * - 提供 API 可用性检测
 * - 统一错误处理
 * - 提供类型安全的接口
 *
 * @example
 * ```typescript
 * // 检查 API 是否可用
 * if (WorldbookApi.isAvailable()) {
 *   // 获取世界书列表
 *   const names = WorldbookApi.getWorldbookNames()
 *
 *   // 读取世界书内容
 *   const entries = await WorldbookApi.getWorldbook('my-worldbook')
 * }
 * ```
 */
export class WorldbookApi {
  /**
   * 检查 Worldbook API 是否完全可用
   *
   * @returns 是否可用
   */
  static isAvailable(): boolean {
    try {
      return (
        typeof window !== 'undefined' &&
        typeof window.getWorldbookNames === 'function' &&
        typeof window.getCharWorldbookNames === 'function' &&
        typeof window.getWorldbook === 'function' &&
        typeof window.createWorldbook === 'function' &&
        typeof window.rebindCharWorldbooks === 'function' &&
        typeof window.updateWorldbookWith === 'function'
      )
    } catch (error) {
      logger.debug('Worldbook API 可用性检测失败:', error)
      return false
    }
  }

  /**
   * 获取所有世界书名称列表
   *
   * @returns 世界书名称数组
   * @throws {AppError} 当 API 不可用时
   *
   * @example
   * ```typescript
   * const names = WorldbookApi.getWorldbookNames()
   * console.log('可用的世界书:', names)
   * ```
   */
  static getWorldbookNames(): string[] {
    if (!this.isAvailable()) {
      throw new PermissionError('Worldbook API 不可用')
    }

    try {
      logger.debug('[Worldbook API] 调用 getWorldbookNames')
      const names = window.getWorldbookNames()
      logger.debug('[Worldbook API] 获取到世界书列表:', names)
      return names
    } catch (error) {
      throw new NetworkError('获取世界书列表失败', {
        originalError: error instanceof Error ? error.message : String(error),
      })
    }
  }

  /**
   * 获取角色绑定的世界书信息
   *
   * @param target 目标角色（'current' 表示当前角色）
   * @returns 角色世界书绑定信息
   * @throws {AppError} 当 API 不可用或调用失败时
   *
   * @example
   * ```typescript
   * const bindings = WorldbookApi.getCharWorldbookNames('current')
   * console.log('当前角色绑定的世界书:', bindings)
   * ```
   */
  static getCharWorldbookNames(target: 'current' | string = 'current'): CharWorldbooks {
    if (!this.isAvailable()) {
      throw new PermissionError('Worldbook API 不可用')
    }

    try {
      logger.debug('[Worldbook API] 调用 getCharWorldbookNames:', target)
      const bindings = window.getCharWorldbookNames(target)
      logger.debug('[Worldbook API] 获取到角色世界书绑定:', bindings)
      return bindings
    } catch (error) {
      throw new NetworkError('获取角色世界书绑定失败', {
        originalError: error instanceof Error ? error.message : String(error),
      })
    }
  }

  /**
   * 获取世界书内容
   *
   * @param name 世界书名称
   * @returns 世界书条目数组
   * @throws {AppError} 当 API 不可用或调用失败时
   *
   * @example
   * ```typescript
   * const entries = await WorldbookApi.getWorldbook('my-worldbook')
   * console.log('世界书条目数量:', entries.length)
   * ```
   */
  static async getWorldbook(name: string): Promise<WorldbookEntry[]> {
    if (!this.isAvailable()) {
      throw new PermissionError('Worldbook API 不可用')
    }

    return await wrapAsync(
      async () => {
        logger.debug('[Worldbook API] 调用 getWorldbook:', name)
        const entries = await window.getWorldbook(name)
        logger.debug('[Worldbook API] 获取到世界书条目:', entries.length)
        return entries
      },
      `获取世界书 "${name}" 失败`,
      ErrorCategory.NETWORK
    )
  }

  /**
   * 创建新世界书
   *
   * @param name 世界书名称
   * @param entries 初始条目数组
   * @throws {AppError} 当 API 不可用或调用失败时
   *
   * @example
   * ```typescript
   * await WorldbookApi.createWorldbook('my-worldbook', [
   *   {
   *     name: 'entry1',
   *     content: 'content',
   *     enabled: true,
   *     // ... 其他字段
   *   }
   * ])
   * ```
   */
  static async createWorldbook(name: string, entries: WorldbookEntry[]): Promise<void> {
    if (!this.isAvailable()) {
      throw new PermissionError('Worldbook API 不可用')
    }

    return await wrapAsync(
      async () => {
        logger.debug('[Worldbook API] 调用 createWorldbook:', name, entries.length)
        await window.createWorldbook(name, entries)
        logger.debug('[Worldbook API] 世界书创建成功')
      },
      `创建世界书 "${name}" 失败`,
      ErrorCategory.NETWORK
    )
  }

  /**
   * 重新绑定角色的世界书
   *
   * @param target 目标角色（'current' 表示当前角色）
   * @param worldbooks 世界书绑定信息
   * @throws {AppError} 当 API 不可用或调用失败时
   *
   * @example
   * ```typescript
   * await WorldbookApi.rebindCharWorldbooks('current', {
   *   primary: 'worldbook1',
   *   additional: ['worldbook2']
   * })
   * ```
   */
  static async rebindCharWorldbooks(
    target: 'current' | string,
    worldbooks: CharWorldbooks
  ): Promise<void> {
    if (!this.isAvailable()) {
      throw new PermissionError('Worldbook API 不可用')
    }

    return await wrapAsync(
      async () => {
        logger.debug('[Worldbook API] 调用 rebindCharWorldbooks:', target, worldbooks)
        await window.rebindCharWorldbooks(target, worldbooks)
        logger.debug('[Worldbook API] 世界书绑定成功')
      },
      '重新绑定世界书失败',
      ErrorCategory.NETWORK
    )
  }

  /**
   * 更新世界书内容
   *
   * @param name 世界书名称
   * @param updater 更新函数，接收当前世界书条目数组，返回新的条目数组
   * @throws {AppError} 当 API 不可用或调用失败时
   *
   * @example
   * ```typescript
   * await WorldbookApi.updateWorldbookWith('my-worldbook', (entries) => {
   *   // 修改条目
   *   entries[0].content = 'new content'
   *   return entries
   * })
   * ```
   */
  static async updateWorldbookWith(
    name: string,
    updater: (entries: WorldbookEntry[]) => WorldbookEntry[]
  ): Promise<void> {
    if (!this.isAvailable()) {
      throw new PermissionError('Worldbook API 不可用')
    }

    return await wrapAsync(
      async () => {
        logger.debug('[Worldbook API] 调用 updateWorldbookWith:', name)
        await window.updateWorldbookWith(name, updater)
        logger.debug('[Worldbook API] 世界书更新成功')
      },
      `更新世界书 "${name}" 失败`,
      ErrorCategory.NETWORK
    )
  }
}
