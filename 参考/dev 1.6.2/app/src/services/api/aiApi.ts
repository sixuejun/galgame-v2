import type { GenerateOptions } from '../../types/external-apis'
import { logger } from '../../utils/logger'
import { wrapAsync, ErrorCategory, PermissionError } from '../../utils/errorHandler'

/**
 * AI API 服务 - 统一管理所有 AI 相关的外部 API 调用
 *
 * 职责：
 * - 封装 window.generate API
 * - 提供 API 可用性检测
 * - 统一错误处理
 * - 提供类型安全的接口
 *
 * @example
 * ```typescript
 * // 检查 API 是否可用
 * if (AIApi.isAvailable()) {
 *   // 调用 AI 生成
 *   const response = await AIApi.generate({
 *     user_input: 'Hello',
 *     should_stream: false,
 *   })
 * }
 * ```
 */
export class AIApi {
  /**
   * 检查 generate API 是否可用
   *
   * @returns 是否可用
   */
  static isAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && typeof window.generate === 'function'
    } catch (error) {
      logger.debug('AI API 可用性检测失败:', error)
      return false
    }
  }

  /**
   * 调用 AI 生成接口
   *
   * @param options 生成选项
   * @returns AI 生成的响应文本
   * @throws {AppError} 当 API 不可用或调用失败时
   *
   * @example
   * ```typescript
   * const response = await AIApi.generate({
   *   user_input: 'Hello, AI!',
   *   should_stream: false,
   *   generation_id: 'unique-id-123',
   * })
   * ```
   */
  static async generate(options: GenerateOptions): Promise<string> {
    if (!this.isAvailable()) {
      throw new PermissionError('generate API 不可用')
    }

    return await wrapAsync(
      async () => {
        logger.debug('[AI API] 调用 generate:', options)
        const response = await window.generate(options)
        logger.debug('[AI API] generate 响应成功')
        return response
      },
      'AI 生成失败',
      ErrorCategory.NETWORK
    )
  }

  /**
   * 生成唯一的 generation_id
   *
   * @returns 唯一 ID
   */
  static generateUniqueId(): string {
    return `gen_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }
}
