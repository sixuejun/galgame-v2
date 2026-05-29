import type { YamlUpdateOperation } from '../../types'
import { logger } from '../../utils/logger'
import { ParseError, ValidationError } from '../../utils/errorHandler'
import * as yaml from 'js-yaml'

/**
 * YAML 解析器 - 处理 YAML 内容的解析和验证
 *
 * 职责：
 * - 解析 YAML 内容为 JavaScript 对象
 * - 验证 YAML 内容格式
 * - 提供 YAML 操作的工具方法
 *
 * @example
 * const parsed = YamlParser.parse(yamlContent)
 * const isValid = YamlParser.validate(yamlContent)
 */
export class YamlParser {
  /**
   * 解析 YAML 内容
   *
   * @param yamlContent YAML 内容字符串
   * @returns 解析后的对象
   * @throws {ParseError} YAML 解析失败
   * @throws {ValidationError} YAML 解析结果不是有效对象
   *
   * @example
   * ```typescript
   * const parsed = YamlParser.parse(`
   *   $update:
   *     "gameData.story.time": "清晨 7:46"
   * `)
   * ```
   */
  static parse(yamlContent: string): YamlUpdateOperation {
    try {
      const parsed = yaml.load(yamlContent) as YamlUpdateOperation

      if (!parsed || typeof parsed !== 'object') {
        throw new ValidationError('YAML 解析结果不是有效对象', {
          parsedType: typeof parsed,
        })
      }

      return parsed
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }

      throw new ParseError('YAML 内容解析失败', {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  /**
   * 验证 YAML 内容格式
   *
   * @param yamlContent YAML 内容字符串
   * @returns 是否有效
   *
   * @example
   * ```typescript
   * const isValid = YamlParser.validate(yamlContent)
   * if (!isValid) {
   *   console.error('YAML 格式无效')
   * }
   * ```
   */
  static validate(yamlContent: string): boolean {
    try {
      const parsed = yaml.load(yamlContent) as YamlUpdateOperation
      if (!parsed || typeof parsed !== 'object') {
        return false
      }

      // 检查是否包含有效的操作符或 gameData
      const hasUpdate = parsed.$update && typeof parsed.$update === 'object'
      const hasDelete = parsed.$delete && Array.isArray(parsed.$delete)
      const hasGameData = parsed.gameData && typeof parsed.gameData === 'object'

      return !!(hasUpdate || hasDelete || hasGameData)
    } catch (error) {
      logger.error('[YAML验证] YAML 格式无效:', error)
      return false
    }
  }

  /**
   * 检查 YAML 操作类型
   *
   * @param parsed 解析后的 YAML 对象
   * @returns 操作类型信息
   */
  static getOperationType(parsed: YamlUpdateOperation): {
    hasUpdate: boolean
    hasDelete: boolean
    hasGameData: boolean
  } {
    return {
      hasUpdate: !!(parsed.$update && typeof parsed.$update === 'object'),
      hasDelete: !!(parsed.$delete && Array.isArray(parsed.$delete)),
      hasGameData: !!(parsed.gameData && typeof parsed.gameData === 'object'),
    }
  }
}
