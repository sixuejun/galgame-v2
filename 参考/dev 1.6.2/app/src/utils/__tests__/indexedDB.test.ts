/**
 * @file indexedDB.test.ts
 * @description IndexedDB 工具类单元测试
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { IndexedDBHelper, DB_CONFIG, type ImageCacheRecord } from '../indexedDB'

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

describe('IndexedDBHelper', () => {
  let helper: IndexedDBHelper
  let mockDB: any
  let mockObjectStore: any
  let mockTransaction: any
  let mockRequest: any

  beforeEach(() => {
    helper = new IndexedDBHelper()

    // Mock IndexedDB API
    const mockIndex = {
      getAll: vi.fn(),
      openCursor: vi.fn(),
    }

    mockObjectStore = {
      put: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
      createIndex: vi.fn(),
      index: vi.fn(() => mockIndex),
    }

    mockTransaction = {
      objectStore: vi.fn(() => mockObjectStore),
      oncomplete: null,
      onerror: null,
    }

    mockDB = {
      transaction: vi.fn(() => mockTransaction),
      createObjectStore: vi.fn(() => mockObjectStore),
      objectStoreNames: {
        contains: vi.fn(() => false),
      },
      close: vi.fn(),
    }

    mockRequest = {
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      result: mockDB,
    }

    // Mock window.indexedDB
    const mockIndexedDB = {
      open: vi.fn(() => mockRequest),
    }

    Object.defineProperty(globalThis, 'indexedDB', {
      writable: true,
      value: mockIndexedDB,
    })

    Object.defineProperty(globalThis, 'IDBKeyRange', {
      writable: true,
      value: {
        only: vi.fn(value => value),
      },
    })
  })

  afterEach(() => {
    helper.close()
  })

  describe('init', () => {
    it('应该成功初始化数据库', async () => {
      const initPromise = helper.init()

      // 触发 onsuccess
      if (mockRequest.onsuccess) {
        mockRequest.onsuccess({ target: mockRequest } as any)
      }

      await expect(initPromise).resolves.toBeUndefined()
    })

    it('应该在浏览器不支持 IndexedDB 时抛出错误', async () => {
      // 移除 indexedDB
      Object.defineProperty(globalThis.window, 'indexedDB', {
        writable: true,
        value: undefined,
      })

      const newHelper = new IndexedDBHelper()
      await expect(newHelper.init()).rejects.toThrow('当前浏览器不支持 IndexedDB')
    })

    it('应该在数据库打开失败时抛出错误', async () => {
      const initPromise = helper.init()

      // 触发 onerror
      const mockError = new Error('Database open failed')
      mockRequest.error = mockError
      if (mockRequest.onerror) {
        mockRequest.onerror({ target: mockRequest } as any)
      }

      await expect(initPromise).rejects.toBe(mockError)
    })

    it('应该创建对象存储和索引', async () => {
      const initPromise = helper.init()

      // 触发 onupgradeneeded
      if (mockRequest.onupgradeneeded) {
        mockRequest.onupgradeneeded({ target: mockRequest } as any)
      }

      expect(mockDB.createObjectStore).toHaveBeenCalledWith(DB_CONFIG.imageStoreName, {
        keyPath: ['characterName', 'description'],
      })
      expect(mockObjectStore.createIndex).toHaveBeenCalledWith('characterName', 'characterName', {
        unique: false,
      })
      expect(mockObjectStore.createIndex).toHaveBeenCalledWith('timestamp', 'timestamp', {
        unique: false,
      })

      // 触发 onsuccess
      if (mockRequest.onsuccess) {
        mockRequest.onsuccess({ target: mockRequest } as any)
      }

      await initPromise
    })

    it('应该只初始化一次', async () => {
      const initPromise1 = helper.init()
      const initPromise2 = helper.init()

      // 触发 onsuccess
      if (mockRequest.onsuccess) {
        mockRequest.onsuccess({ target: mockRequest } as any)
      }

      await Promise.all([initPromise1, initPromise2])

      expect(globalThis.indexedDB.open).toHaveBeenCalledTimes(1)
    })
  })

  describe('put', () => {
    beforeEach(async () => {
      const initPromise = helper.init()
      if (mockRequest.onsuccess) {
        mockRequest.onsuccess({ target: mockRequest } as any)
      }
      await initPromise
    })

    it('应该成功保存记录', async () => {
      const record: ImageCacheRecord = {
        characterName: 'test-char',
        description: 'test description',
        imageUrl: 'data:image/png;base64,test',
        timestamp: Date.now(),
      }

      const putRequest: any = { onsuccess: null, onerror: null }
      mockObjectStore.put.mockImplementation(() => {
        // 异步触发 onsuccess
        Promise.resolve().then(() => {
          if (putRequest.onsuccess) {
            putRequest.onsuccess({} as any)
          }
        })
        return putRequest
      })

      await expect(helper.put(record)).resolves.toBeUndefined()
      expect(mockObjectStore.put).toHaveBeenCalledWith(record)
    })

    it('应该在保存失败时抛出错误', async () => {
      const record: ImageCacheRecord = {
        characterName: 'test-char',
        description: 'test description',
        imageUrl: 'data:image/png;base64,test',
        timestamp: Date.now(),
      }

      const putRequest: any = { onsuccess: null, onerror: null, error: new Error('Put failed') }
      mockObjectStore.put.mockImplementation(() => {
        // 异步触发 onerror
        Promise.resolve().then(() => {
          if (putRequest.onerror) {
            putRequest.onerror({ target: putRequest } as any)
          }
        })
        return putRequest
      })

      await expect(helper.put(record)).rejects.toThrow('Put failed')
    })
  })

  describe('get', () => {
    beforeEach(async () => {
      const initPromise = helper.init()
      if (mockRequest.onsuccess) {
        mockRequest.onsuccess({ target: mockRequest } as any)
      }
      await initPromise
    })

    it('应该成功获取记录', async () => {
      const record: ImageCacheRecord = {
        characterName: 'test-char',
        description: 'test description',
        imageUrl: 'data:image/png;base64,test',
        timestamp: Date.now(),
      }

      const getRequest: any = { onsuccess: null, onerror: null, result: record }
      mockObjectStore.get.mockImplementation(() => {
        Promise.resolve().then(() => {
          if (getRequest.onsuccess) {
            getRequest.onsuccess({ target: getRequest } as any)
          }
        })
        return getRequest
      })

      await expect(helper.getByKey('test-char', 'test description')).resolves.toEqual(record)
      expect(mockObjectStore.get).toHaveBeenCalledWith(['test-char', 'test description'])
    })

    it('应该在记录不存在时返回 undefined', async () => {
      const getRequest: any = { onsuccess: null, onerror: null, result: undefined }
      mockObjectStore.get.mockImplementation(() => {
        Promise.resolve().then(() => {
          if (getRequest.onsuccess) {
            getRequest.onsuccess({ target: getRequest } as any)
          }
        })
        return getRequest
      })

      await expect(helper.getByKey('test-char', 'test description')).resolves.toBeUndefined()
    })

    it('应该在获取失败时抛出错误', async () => {
      const getRequest: any = { onsuccess: null, onerror: null, error: new Error('Get failed') }
      mockObjectStore.get.mockImplementation(() => {
        Promise.resolve().then(() => {
          if (getRequest.onerror) {
            getRequest.onerror({ target: getRequest } as any)
          }
        })
        return getRequest
      })

      await expect(helper.getByKey('test-char', 'test description')).rejects.toThrow('Get failed')
    })
  })

  describe('delete', () => {
    beforeEach(async () => {
      const initPromise = helper.init()
      if (mockRequest.onsuccess) {
        mockRequest.onsuccess({ target: mockRequest } as any)
      }
      await initPromise
    })

    it('应该成功删除记录', async () => {
      const deleteRequest: any = { onsuccess: null, onerror: null }
      mockObjectStore.delete.mockImplementation(() => {
        Promise.resolve().then(() => {
          if (deleteRequest.onsuccess) {
            deleteRequest.onsuccess({} as any)
          }
        })
        return deleteRequest
      })

      await expect(helper.deleteByKey('test-char', 'test description')).resolves.toBeUndefined()
      expect(mockObjectStore.delete).toHaveBeenCalledWith(['test-char', 'test description'])
    })

    it('应该在删除失败时抛出错误', async () => {
      const deleteRequest: any = {
        onsuccess: null,
        onerror: null,
        error: new Error('Delete failed'),
      }
      mockObjectStore.delete.mockImplementation(() => {
        Promise.resolve().then(() => {
          if (deleteRequest.onerror) {
            deleteRequest.onerror({ target: deleteRequest } as any)
          }
        })
        return deleteRequest
      })

      await expect(helper.deleteByKey('test-char', 'test description')).rejects.toThrow(
        'Delete failed'
      )
    })
  })

  describe('close', () => {
    it('应该关闭数据库连接', async () => {
      const initPromise = helper.init()
      if (mockRequest.onsuccess) {
        mockRequest.onsuccess({ target: mockRequest } as any)
      }
      await initPromise

      helper.close()

      expect(mockDB.close).toHaveBeenCalled()
    })

    it('应该在未初始化时不抛出错误', () => {
      expect(() => helper.close()).not.toThrow()
    })
  })
})
