import { logger } from './logger'

/**
 * 从 localStorage 加载持久化状态
 * @param key - localStorage 的键名
 * @param defaultValue - 如果没有找到值时返回的默认值
 * @returns 解析后的值或默认值
 */
export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key)
    if (stored) {
      return JSON.parse(stored) as T
    }
  } catch (error) {
    logger.warn(`加载持久化状态失败: ${key}`, error)
  }
  return defaultValue
}

/**
 * 保存状态到 localStorage
 * @param key - localStorage 的键名
 * @param value - 要保存的值（会被 JSON.stringify）
 */
export function saveToLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    logger.warn(`保存持久化状态失败: ${key}`, error)
  }
}

/**
 * 从 localStorage 删除指定的键
 * @param key - localStorage 的键名
 */
export function removeFromLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    logger.warn(`删除持久化状态失败: ${key}`, error)
  }
}

/**
 * 清空所有 localStorage 数据
 */
export function clearLocalStorage(): void {
  try {
    localStorage.clear()
    logger.info('✅ localStorage 已清空')
  } catch (error) {
    logger.error('❌ 清空 localStorage 失败:', error)
  }
}

/**
 * 检查 localStorage 中是否存在指定的键
 * @param key - localStorage 的键名
 * @returns 如果键存在返回 true，否则返回 false
 */
export function hasInLocalStorage(key: string): boolean {
  try {
    return localStorage.getItem(key) !== null
  } catch (error) {
    logger.warn(`检查 localStorage 键失败: ${key}`, error)
    return false
  }
}

/**
 * 获取 localStorage 中所有的键
 * @returns 所有键的数组
 */
export function getAllLocalStorageKeys(): string[] {
  try {
    return Object.keys(localStorage)
  } catch (error) {
    logger.error('❌ 获取 localStorage 键列表失败:', error)
    return []
  }
}
