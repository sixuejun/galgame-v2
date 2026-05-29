/**
 * 基础类型守卫
 * 提供基本数据类型的运行时检查和类型收窄功能
 */

/**
 * 检查值是否为非空对象
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * 检查值是否为非空数组
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value) && value.length > 0
}

/**
 * 检查值是否为非空字符串
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * 检查值是否为有效数字
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value)
}

/**
 * 检查值是否为非负整数
 */
export function isNonNegativeInteger(value: unknown): value is number {
  return isValidNumber(value) && value >= 0 && Number.isInteger(value)
}
