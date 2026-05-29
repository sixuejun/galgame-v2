import { logger } from '../../utils/logger'

/**
 * 路径解析器 - 处理基于点路径的对象属性操作
 *
 * 职责：
 * - 根据点路径设置对象的值（支持深度合并）
 * - 根据点路径删除对象的属性
 * - 提供路径操作的工具方法
 *
 * @example
 * PathResolver.setByPath(obj, "gameData.story.time", "清晨 7:46")
 * PathResolver.deleteByPath(obj, "gameData.system.storage.inventory.item_id")
 */
export class PathResolver {
  /**
   * 判断一个值是否为普通对象（Plain Object）
   * 排除数组、null、Date、RegExp 等特殊对象
   *
   * @param value 要检查的值
   * @returns 是否为普通对象
   */
  private static isPlainObject(value: unknown): value is Record<string, unknown> {
    if (value === null || typeof value !== 'object') {
      return false
    }

    // 排除数组
    if (Array.isArray(value)) {
      return false
    }

    // 排除特殊对象（Date, RegExp 等）
    const proto = Object.getPrototypeOf(value)
    return proto === null || proto === Object.prototype
  }

  /**
   * 深度合并两个对象
   * 将 source 对象的属性递归合并到 target 对象中
   * - 如果两者都是普通对象，则递归合并
   * - 否则，source 的值会覆盖 target 的值
   *
   * @param target 目标对象（会被修改）
   * @param source 源对象
   * @returns 合并后的目标对象
   */
  private static deepMerge(
    target: Record<string, unknown>,
    source: Record<string, unknown>
  ): Record<string, unknown> {
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key]
        const targetValue = target[key]

        // 如果源值和目标值都是普通对象，则递归合并
        if (this.isPlainObject(sourceValue) && this.isPlainObject(targetValue)) {
          target[key] = this.deepMerge(targetValue, sourceValue)
        } else {
          // 否则直接覆盖（包括数组、基本类型、null 等）
          target[key] = sourceValue
        }
      }
    }

    return target
  }

  /**
   * 根据点路径设置对象的值
   * 如果路径不存在则会创建中间对象
   * 如果目标位置已存在对象且新值也是对象，则进行深度合并而非替换
   *
   * @param obj 目标对象
   * @param path 属性路径,如 "gameData.story.time"
   * @param value 要设置的值
   *
   * @example
   * PathResolver.setByPath(obj, "gameData.story.time", "清晨 7:46")
   * PathResolver.setByPath(obj, "gameData.characters.nanami.coreStatus.content.resonanceDepth.current", 10)
   *
   * @example 深度合并示例
   * // 原始数据
   * const obj = {
   *   user: {
   *     name: "Alice",
   *     age: 30,
   *     address: { city: "Beijing", country: "China" }
   *   }
   * }
   * // 更新操作
   * PathResolver.setByPath(obj, "user", { age: 31, address: { city: "Shanghai" } })
   * // 结果（深度合并）
   * // {
   * //   user: {
   * //     name: "Alice",        // 保留
   * //     age: 31,              // 更新
   * //     address: {
   * //       city: "Shanghai",   // 更新
   * //       country: "China"    // 保留
   * //     }
   * //   }
   * // }
   */
  static setByPath<T extends Record<string, unknown>>(obj: T, path: string, value: unknown): void {
    const keys = path.split('.')
    let current: Record<string, unknown> = obj

    // 遍历到倒数第二级
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]

      // 如果路径中的节点不是对象或不存在,则创建它
      if (typeof current[key] !== 'object' || current[key] === null) {
        current[key] = {}
      }

      current = current[key] as Record<string, unknown>
    }

    // 设置最后一级的值
    const lastKey = keys[keys.length - 1]
    const existingValue = current[lastKey]

    // 如果目标位置已存在普通对象，且新值也是普通对象，则进行深度合并
    if (this.isPlainObject(existingValue) && this.isPlainObject(value)) {
      current[lastKey] = this.deepMerge(existingValue, value)
      logger.debug(`[路径更新] 成功深度合并路径 "${path}"`)
    } else {
      // 否则直接赋值（包括数组、基本类型、null 等）
      current[lastKey] = value
      logger.debug(`[路径更新] 成功设置路径 "${path}"`)
    }
  }

  /**
   * 根据点路径删除对象的属性
   *
   * @param obj 目标对象
   * @param path 属性路径,如 "gameData.system.storage.inventory.item_id"
   * @returns 是否删除成功
   *
   * @example
   * PathResolver.deleteByPath(obj, "gameData.system.storage.inventory.emergency_battery")
   */
  static deleteByPath<T extends Record<string, unknown>>(obj: T, path: string): boolean {
    const keys = path.split('.')
    let current: Record<string, unknown> = obj

    // 遍历到倒数第二级对象
    for (let i = 0; i < keys.length - 1; i++) {
      if (current[keys[i]] && typeof current[keys[i]] === 'object') {
        current = current[keys[i]] as Record<string, unknown>
      } else {
        logger.warn(`[删除] 路径 "${path}" 中的 "${keys[i]}" 不存在或不是对象`)
        return false
      }
    }

    // 删除最后一级的属性
    const lastKey = keys[keys.length - 1]
    if (Object.prototype.hasOwnProperty.call(current, lastKey)) {
      delete current[lastKey]
      logger.debug(`[删除] 成功删除路径 "${path}"`)
      return true
    } else {
      logger.warn(`[删除] 路径 "${path}" 的最终键 "${lastKey}" 不存在`)
      return false
    }
  }

  /**
   * 清理路径前缀
   * 移除路径开头的 "gameData." 前缀(如果存在)
   *
   * @param path 原始路径
   * @returns 清理后的路径
   *
   * @example
   * PathResolver.cleanPath("gameData.story.time") // "story.time"
   * PathResolver.cleanPath("story.time") // "story.time"
   */
  static cleanPath(path: string): string {
    return path.startsWith('gameData.') ? path.substring('gameData.'.length) : path
  }
}
