import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  loadFromLocalStorage,
  saveToLocalStorage,
  removeFromLocalStorage,
  clearLocalStorage,
  hasInLocalStorage,
  getAllLocalStorageKeys,
} from '../storage'
import { logger } from '../logger'

describe('storage', () => {
  // Mock logger
  beforeEach(() => {
    vi.spyOn(logger, 'warn').mockImplementation(() => {})
    vi.spyOn(logger, 'info').mockImplementation(() => {})
    vi.spyOn(logger, 'error').mockImplementation(() => {})
    // 清空 localStorage
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  describe('loadFromLocalStorage', () => {
    it('应该加载存储的字符串值', () => {
      localStorage.setItem('test-key', JSON.stringify('test-value'))
      const result = loadFromLocalStorage('test-key', 'default')
      expect(result).toBe('test-value')
    })

    it('应该加载存储的数字值', () => {
      localStorage.setItem('test-key', JSON.stringify(42))
      const result = loadFromLocalStorage('test-key', 0)
      expect(result).toBe(42)
    })

    it('应该加载存储的对象值', () => {
      const obj = { name: 'test', value: 123 }
      localStorage.setItem('test-key', JSON.stringify(obj))
      const result = loadFromLocalStorage('test-key', {})
      expect(result).toEqual(obj)
    })

    it('应该加载存储的数组值', () => {
      const arr = [1, 2, 3, 4, 5]
      localStorage.setItem('test-key', JSON.stringify(arr))
      const result = loadFromLocalStorage('test-key', [])
      expect(result).toEqual(arr)
    })

    it('应该加载存储的布尔值', () => {
      localStorage.setItem('test-key', JSON.stringify(true))
      const result = loadFromLocalStorage('test-key', false)
      expect(result).toBe(true)
    })

    it('当键不存在时应该返回默认值', () => {
      const result = loadFromLocalStorage('non-existent', 'default')
      expect(result).toBe('default')
    })

    it('当值为 null 时应该返回默认值', () => {
      localStorage.setItem('test-key', 'null')
      const result = loadFromLocalStorage('test-key', 'default')
      expect(result).toBe(null)
    })

    it('当 JSON 解析失败时应该返回默认值并记录警告', () => {
      localStorage.setItem('test-key', 'invalid-json')
      const result = loadFromLocalStorage('test-key', 'default')
      expect(result).toBe('default')
      expect(logger.warn).toHaveBeenCalled()
    })

    it('应该处理复杂的嵌套对象', () => {
      const complex = {
        user: { name: 'test', age: 30 },
        items: [{ id: 1 }, { id: 2 }],
        settings: { theme: 'dark', lang: 'zh' },
      }
      localStorage.setItem('test-key', JSON.stringify(complex))
      const result = loadFromLocalStorage('test-key', {})
      expect(result).toEqual(complex)
    })

    it('应该处理空字符串', () => {
      localStorage.setItem('test-key', JSON.stringify(''))
      const result = loadFromLocalStorage('test-key', 'default')
      expect(result).toBe('')
    })

    it('应该处理数字 0', () => {
      localStorage.setItem('test-key', JSON.stringify(0))
      const result = loadFromLocalStorage('test-key', 100)
      expect(result).toBe(0)
    })
  })

  describe('saveToLocalStorage', () => {
    it('应该保存字符串值', () => {
      saveToLocalStorage('test-key', 'test-value')
      expect(localStorage.getItem('test-key')).toBe(JSON.stringify('test-value'))
    })

    it('应该保存数字值', () => {
      saveToLocalStorage('test-key', 42)
      expect(localStorage.getItem('test-key')).toBe(JSON.stringify(42))
    })

    it('应该保存对象值', () => {
      const obj = { name: 'test', value: 123 }
      saveToLocalStorage('test-key', obj)
      expect(localStorage.getItem('test-key')).toBe(JSON.stringify(obj))
    })

    it('应该保存数组值', () => {
      const arr = [1, 2, 3]
      saveToLocalStorage('test-key', arr)
      expect(localStorage.getItem('test-key')).toBe(JSON.stringify(arr))
    })

    it('应该保存布尔值', () => {
      saveToLocalStorage('test-key', true)
      expect(localStorage.getItem('test-key')).toBe(JSON.stringify(true))
    })

    it('应该保存 null 值', () => {
      saveToLocalStorage('test-key', null)
      expect(localStorage.getItem('test-key')).toBe(JSON.stringify(null))
    })

    it('应该覆盖已存在的值', () => {
      saveToLocalStorage('test-key', 'old-value')
      saveToLocalStorage('test-key', 'new-value')
      expect(localStorage.getItem('test-key')).toBe(JSON.stringify('new-value'))
    })

    it('应该处理复杂的嵌套对象', () => {
      const complex = {
        user: { name: 'test', age: 30 },
        items: [{ id: 1 }, { id: 2 }],
      }
      saveToLocalStorage('test-key', complex)
      expect(localStorage.getItem('test-key')).toBe(JSON.stringify(complex))
    })

    it('当 localStorage.setItem 抛出错误时应该记录警告', () => {
      const error = new Error('QuotaExceededError')
      const setItemSpy = vi.spyOn(localStorage, 'setItem')
      setItemSpy.mockImplementationOnce(() => {
        throw error
      })
      saveToLocalStorage('test-key', 'test-value')
      expect(logger.warn).toHaveBeenCalledWith('保存持久化状态失败: test-key', error)
      setItemSpy.mockRestore()
    })
  })

  describe('removeFromLocalStorage', () => {
    it('应该删除存在的键', () => {
      localStorage.setItem('test-key', 'test-value')
      removeFromLocalStorage('test-key')
      expect(localStorage.getItem('test-key')).toBeNull()
    })

    it('应该处理删除不存在的键', () => {
      removeFromLocalStorage('non-existent')
      expect(localStorage.getItem('non-existent')).toBeNull()
    })

    it('应该只删除指定的键', () => {
      localStorage.setItem('key1', 'value1')
      localStorage.setItem('key2', 'value2')
      removeFromLocalStorage('key1')
      expect(localStorage.getItem('key1')).toBeNull()
      expect(localStorage.getItem('key2')).toBe('value2')
    })

    it('当 localStorage.removeItem 抛出错误时应该记录警告', () => {
      const error = new Error('Storage access denied')
      const removeItemSpy = vi.spyOn(localStorage, 'removeItem')
      removeItemSpy.mockImplementationOnce(() => {
        throw error
      })
      removeFromLocalStorage('test-key')
      expect(logger.warn).toHaveBeenCalledWith('删除持久化状态失败: test-key', error)
      removeItemSpy.mockRestore()
    })
  })

  describe('clearLocalStorage', () => {
    it('应该清空所有 localStorage 数据', () => {
      localStorage.setItem('key1', 'value1')
      localStorage.setItem('key2', 'value2')
      localStorage.setItem('key3', 'value3')
      clearLocalStorage()
      expect(localStorage.length).toBe(0)
      expect(logger.info).toHaveBeenCalled()
    })

    it('应该处理空的 localStorage', () => {
      clearLocalStorage()
      expect(localStorage.length).toBe(0)
      expect(logger.info).toHaveBeenCalled()
    })

    it('当 localStorage.clear 抛出错误时应该记录错误', () => {
      const error = new Error('Storage access denied')
      const clearSpy = vi.spyOn(localStorage, 'clear')
      clearSpy.mockImplementationOnce(() => {
        throw error
      })
      clearLocalStorage()
      expect(logger.error).toHaveBeenCalledWith('❌ 清空 localStorage 失败:', error)
      clearSpy.mockRestore()
    })
  })

  describe('hasInLocalStorage', () => {
    it('当键存在时应该返回 true', () => {
      localStorage.setItem('test-key', 'test-value')
      expect(hasInLocalStorage('test-key')).toBe(true)
    })

    it('当键不存在时应该返回 false', () => {
      expect(hasInLocalStorage('non-existent')).toBe(false)
    })

    it('当值为空字符串时应该返回 true', () => {
      localStorage.setItem('test-key', '')
      expect(hasInLocalStorage('test-key')).toBe(true)
    })

    it('当值为 null 字符串时应该返回 true', () => {
      localStorage.setItem('test-key', 'null')
      expect(hasInLocalStorage('test-key')).toBe(true)
    })

    it('当 localStorage.getItem 抛出错误时应该返回 false 并记录警告', () => {
      const error = new Error('Storage access denied')
      const getItemSpy = vi.spyOn(localStorage, 'getItem')
      getItemSpy.mockImplementationOnce(() => {
        throw error
      })
      const result = hasInLocalStorage('test-key')
      expect(result).toBe(false)
      expect(logger.warn).toHaveBeenCalledWith('检查 localStorage 键失败: test-key', error)
      getItemSpy.mockRestore()
    })
  })

  describe('getAllLocalStorageKeys', () => {
    it('应该返回所有键的数组', () => {
      localStorage.setItem('key1', 'value1')
      localStorage.setItem('key2', 'value2')
      localStorage.setItem('key3', 'value3')
      const keys = getAllLocalStorageKeys()
      expect(keys).toHaveLength(3)
      expect(keys).toContain('key1')
      expect(keys).toContain('key2')
      expect(keys).toContain('key3')
    })

    it('当 localStorage 为空时应该返回空数组', () => {
      const keys = getAllLocalStorageKeys()
      expect(keys).toEqual([])
    })

    it('应该返回正确数量的键', () => {
      localStorage.setItem('key1', 'value1')
      localStorage.setItem('key2', 'value2')
      const keys = getAllLocalStorageKeys()
      expect(keys.length).toBe(2)
    })

    it('当访问 localStorage 抛出错误时应该返回空数组并记录错误', () => {
      const error = new Error('Storage access denied')
      // Mock Object.keys to throw error when called with localStorage
      const originalKeys = Object.keys
      const mockKeys = vi.fn(obj => {
        if (obj === localStorage) {
          throw error
        }
        return originalKeys(obj)
      })
      Object.keys = mockKeys as typeof Object.keys

      const keys = getAllLocalStorageKeys()
      expect(keys).toEqual([])
      expect(logger.error).toHaveBeenCalledWith('❌ 获取 localStorage 键列表失败:', error)

      // Restore Object.keys
      Object.keys = originalKeys
    })
  })

  describe('集成测试', () => {
    it('应该支持完整的保存-加载-删除流程', () => {
      const data = { name: 'test', value: 123 }
      saveToLocalStorage('test-key', data)
      expect(hasInLocalStorage('test-key')).toBe(true)
      const loaded = loadFromLocalStorage('test-key', {})
      expect(loaded).toEqual(data)
      removeFromLocalStorage('test-key')
      expect(hasInLocalStorage('test-key')).toBe(false)
    })

    it('应该支持多个键的管理', () => {
      saveToLocalStorage('key1', 'value1')
      saveToLocalStorage('key2', 'value2')
      saveToLocalStorage('key3', 'value3')
      expect(getAllLocalStorageKeys()).toHaveLength(3)
      removeFromLocalStorage('key2')
      expect(getAllLocalStorageKeys()).toHaveLength(2)
      clearLocalStorage()
      expect(getAllLocalStorageKeys()).toHaveLength(0)
    })

    it('应该处理类型转换', () => {
      saveToLocalStorage('number', 42)
      saveToLocalStorage('string', 'test')
      saveToLocalStorage('boolean', true)
      saveToLocalStorage('object', { key: 'value' })
      saveToLocalStorage('array', [1, 2, 3])

      expect(loadFromLocalStorage('number', 0)).toBe(42)
      expect(loadFromLocalStorage('string', '')).toBe('test')
      expect(loadFromLocalStorage('boolean', false)).toBe(true)
      expect(loadFromLocalStorage('object', {})).toEqual({ key: 'value' })
      expect(loadFromLocalStorage('array', [])).toEqual([1, 2, 3])
    })
  })
})
