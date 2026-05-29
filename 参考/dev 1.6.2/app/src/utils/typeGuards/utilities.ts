/**
 * 类型守卫工具函数
 * 提供类型断言、安全访问等辅助功能
 */

/**
 * 断言值为指定类型，否则抛出错误
 */
export function assertType<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  errorMessage: string
): asserts value is T {
  if (!guard(value)) {
    throw new TypeError(errorMessage)
  }
}

/**
 * 安全地获取对象属性
 */
export function safeGet<T extends object, K extends keyof T>(
  obj: T,
  key: K,
  defaultValue: T[K]
): T[K] {
  const value = obj[key]
  return value !== undefined ? value : defaultValue
}

/**
 * 检查 Window 对象是否包含指定的全局变量
 */
export function hasGlobal(key: string): boolean {
  return typeof window !== 'undefined' && key in window
}

/**
 * 安全地获取全局变量
 */
export function getGlobal<T>(key: string, defaultValue: T): T {
  if (hasGlobal(key)) {
    return (window as unknown as Record<string, unknown>)[key] as T
  }
  return defaultValue
}
