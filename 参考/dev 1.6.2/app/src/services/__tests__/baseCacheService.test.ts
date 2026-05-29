/**
 * @file baseCacheService.test.ts
 * @description BaseCacheService 单元测试
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { BaseCacheService, type DBConfig, type BaseCacheRecord } from '../baseCacheService'

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

// Test record interface
interface TestCacheRecord extends BaseCacheRecord {
  key: string
  data: string
}

// Test database config
const testConfig: DBConfig = {
  name: 'test-db',
  version: 1,
  storeName: 'test-store',
  keyPath: 'key',
  indexes: [
    {
      name: 'characterName',
      keyPath: 'characterName',
    },
  ],
}

describe('BaseCacheService', () => {
  let service: BaseCacheService<TestCacheRecord>
  let mockDB: any
  let mockObjectStore: any
  let mockTransaction: any
  let mockRequest: any

  beforeEach(() => {
    service = new BaseCacheService<TestCacheRecord>(testConfig, 'Test Cache')

    // Mock IndexedDB
    mockRequest = {
      onsuccess: null as any,
      onerror: null as any,
      onupgradeneeded: null as any,
      result: null as any,
      error: null as any,
    }

    mockObjectStore = {
      put: vi.fn(() => mockRequest),
      get: vi.fn(() => mockRequest),
      delete: vi.fn(() => mockRequest),
      getAll: vi.fn(() => mockRequest),
      clear: vi.fn(() => mockRequest),
      createIndex: vi.fn(),
      index: vi.fn(() => ({
        getAll: vi.fn(() => mockRequest),
        openCursor: vi.fn(() => mockRequest),
      })),
    }

    mockTransaction = {
      objectStore: vi.fn(() => mockObjectStore),
      oncomplete: null as any,
      onerror: null as any,
      error: null as any,
    }

    mockDB = {
      transaction: vi.fn(() => mockTransaction),
      objectStoreNames: {
        contains: vi.fn(() => false),
      },
      createObjectStore: vi.fn(() => mockObjectStore),
      close: vi.fn(),
    }

    // Mock indexedDB.open
    const mockOpenRequest = {
      onsuccess: null as any,
      onerror: null as any,
      onupgradeneeded: null as any,
      result: mockDB,
    }

    globalThis.indexedDB = {
      open: vi.fn(() => mockOpenRequest),
    } as any

    // Trigger success immediately
    setTimeout(() => {
      if (mockOpenRequest.onupgradeneeded) {
        mockOpenRequest.onupgradeneeded({ target: mockOpenRequest } as any)
      }
      if (mockOpenRequest.onsuccess) {
        mockOpenRequest.onsuccess({ target: mockOpenRequest } as any)
      }
    }, 0)
  })

  afterEach(() => {
    service.close()
  })

  describe('初始化', () => {
    it('应该成功初始化数据库', async () => {
      await service['init']()

      expect(globalThis.indexedDB.open).toHaveBeenCalledWith('test-db', 1)
      expect(service['db']).toBe(mockDB)
    })

    it('应该只初始化一次', async () => {
      await service['init']()
      await service['init']()

      expect(globalThis.indexedDB.open).toHaveBeenCalledTimes(1)
    })

    it('应该在浏览器不支持 IndexedDB 时抛出错误', async () => {
      ;(globalThis as any).indexedDB = undefined

      await expect(service['init']()).rejects.toThrow('当前浏览器不支持 IndexedDB')
    })
  })

  describe('put', () => {
    it('应该成功保存记录', async () => {
      const record: TestCacheRecord = {
        key: 'test-key',
        characterName: 'test-character',
        data: 'test-data',
        timestamp: Date.now(),
      }

      const putPromise = service.put(record)

      // Trigger success
      setTimeout(() => {
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess({ target: mockRequest } as any)
        }
      }, 0)

      await putPromise

      expect(mockObjectStore.put).toHaveBeenCalledWith(record)
    })

    it('应该处理保存失败的情况', async () => {
      const record: TestCacheRecord = {
        key: 'test-key',
        characterName: 'test-character',
        data: 'test-data',
        timestamp: Date.now(),
      }

      const putPromise = service.put(record)

      // Trigger error
      setTimeout(() => {
        mockRequest.error = new Error('Put failed')
        if (mockRequest.onerror) {
          mockRequest.onerror({ target: mockRequest } as any)
        }
      }, 0)

      await expect(putPromise).rejects.toThrow()
    })
  })

  describe('get', () => {
    it('应该成功获取记录', async () => {
      const expectedRecord: TestCacheRecord = {
        key: 'test-key',
        characterName: 'test-character',
        data: 'test-data',
        timestamp: Date.now(),
      }

      const getPromise = service.get('test-key')

      // Trigger success
      setTimeout(() => {
        mockRequest.result = expectedRecord
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess({ target: mockRequest } as any)
        }
      }, 0)

      const result = await getPromise

      expect(result).toEqual(expectedRecord)
      expect(mockObjectStore.get).toHaveBeenCalledWith('test-key')
    })

    it('应该在记录不存在时返回 undefined', async () => {
      const getPromise = service.get('non-existent-key')

      // Trigger success with no result
      setTimeout(() => {
        mockRequest.result = undefined
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess({ target: mockRequest } as any)
        }
      }, 0)

      const result = await getPromise

      expect(result).toBeUndefined()
    })
  })

  describe('delete', () => {
    it('应该成功删除记录', async () => {
      const deletePromise = service.delete('test-key')

      // Trigger success
      setTimeout(() => {
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess({ target: mockRequest } as any)
        }
      }, 0)

      await deletePromise

      expect(mockObjectStore.delete).toHaveBeenCalledWith('test-key')
    })
  })

  describe('getAllByCharacter', () => {
    it('应该成功获取指定角色的所有记录', async () => {
      const expectedRecords: TestCacheRecord[] = [
        {
          key: 'key1',
          characterName: 'test-character',
          data: 'data1',
          timestamp: Date.now(),
        },
        {
          key: 'key2',
          characterName: 'test-character',
          data: 'data2',
          timestamp: Date.now(),
        },
      ]

      const getAllPromise = service.getAllByCharacter('test-character')

      // Trigger success
      setTimeout(() => {
        mockRequest.result = expectedRecords
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess({ target: mockRequest } as any)
        }
      }, 0)

      const result = await getAllPromise

      expect(result).toEqual(expectedRecords)
    })
  })

  describe('cleanupOldCache', () => {
    it('应该在记录数未超过限制时不删除任何记录', async () => {
      const records: TestCacheRecord[] = [
        {
          key: 'key1',
          characterName: 'test-character',
          data: 'data1',
          timestamp: Date.now() - 1000,
        },
      ]

      vi.spyOn(service, 'getAllByCharacter').mockResolvedValue(records)

      const deleteCount = await service.cleanupOldCache('test-character', 10)

      expect(deleteCount).toBe(0)
    })

    it('应该删除最旧的记录当超过限制时', async () => {
      const now = Date.now()
      const records: TestCacheRecord[] = [
        {
          key: 'key1',
          characterName: 'test-character',
          data: 'data1',
          timestamp: now - 3000,
        },
        {
          key: 'key2',
          characterName: 'test-character',
          data: 'data2',
          timestamp: now - 2000,
        },
        {
          key: 'key3',
          characterName: 'test-character',
          data: 'data3',
          timestamp: now - 1000,
        },
      ]

      vi.spyOn(service, 'getAllByCharacter').mockResolvedValue(records)

      const cleanupPromise = service.cleanupOldCache('test-character', 2)

      // Trigger transaction complete
      setTimeout(() => {
        if (mockTransaction.oncomplete) {
          mockTransaction.oncomplete({ target: mockTransaction } as any)
        }
      }, 0)

      const deleteCount = await cleanupPromise

      expect(deleteCount).toBe(1)
      expect(mockObjectStore.delete).toHaveBeenCalledWith('key1')
    })
  })

  describe('getStatsByCharacter', () => {
    it('应该返回正确的统计信息', async () => {
      const records: TestCacheRecord[] = [
        {
          key: 'key1',
          characterName: 'test-character',
          data: 'data1',
          timestamp: Date.now(),
        },
        {
          key: 'key2',
          characterName: 'test-character',
          data: 'data2',
          timestamp: Date.now(),
        },
      ]

      vi.spyOn(service, 'getAllByCharacter').mockResolvedValue(records)

      const stats = await service.getStatsByCharacter('test-character')

      expect(stats.count).toBe(2)
      expect(stats.totalSize).toBeGreaterThan(0)
    })

    it('应该处理计算大小失败的情况', async () => {
      const records: TestCacheRecord[] = [
        {
          key: 'key1',
          characterName: 'test-character',
          data: 'data1',
          timestamp: Date.now(),
        },
      ]

      vi.spyOn(service, 'getAllByCharacter').mockResolvedValue(records)

      // Mock Blob constructor to throw error
      const originalBlob = globalThis.Blob
      globalThis.Blob = vi.fn().mockImplementation(() => {
        throw new Error('Blob creation failed')
      }) as any

      const stats = await service.getStatsByCharacter('test-character')

      expect(stats.count).toBe(1)
      expect(stats.totalSize).toBe(0)

      // Restore Blob
      globalThis.Blob = originalBlob
    })
  })

  describe('ensureDB', () => {
    it('应该在数据库初始化失败时抛出错误', async () => {
      // Create a new service instance
      const failService = new BaseCacheService<TestCacheRecord>(testConfig, 'Fail Test')

      // Mock indexedDB.open to fail
      const mockFailRequest = {
        onsuccess: null as any,
        onerror: null as any,
        onupgradeneeded: null as any,
        result: null,
        error: new Error('Open failed'),
      }

      globalThis.indexedDB = {
        open: vi.fn(() => mockFailRequest),
      } as any

      // Trigger error
      setTimeout(() => {
        if (mockFailRequest.onerror) {
          mockFailRequest.onerror({ target: mockFailRequest } as any)
        }
      }, 0)

      // Try to use ensureDB
      await expect(failService['ensureDB']()).rejects.toThrow()
    })
  })

  describe('getAll', () => {
    it('应该获取所有记录', async () => {
      const expectedRecords: TestCacheRecord[] = [
        {
          key: 'key1',
          characterName: 'character1',
          data: 'data1',
          timestamp: Date.now(),
        },
        {
          key: 'key2',
          characterName: 'character2',
          data: 'data2',
          timestamp: Date.now(),
        },
      ]

      const getAllPromise = service.getAll()

      // Trigger success
      setTimeout(() => {
        mockRequest.result = expectedRecords
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess({ target: mockRequest } as any)
        }
      }, 0)

      const results = await getAllPromise

      expect(results).toEqual(expectedRecords)
      expect(mockObjectStore.getAll).toHaveBeenCalled()
    })

    it('应该处理获取所有记录时的错误', async () => {
      const getAllPromise = service.getAll()

      // Trigger error
      setTimeout(() => {
        mockRequest.error = new Error('GetAll failed')
        if (mockRequest.onerror) {
          mockRequest.onerror({ target: mockRequest } as any)
        }
      }, 0)

      await expect(getAllPromise).rejects.toThrow()
    })
  })

  describe('getAllByCharacter - 错误处理', () => {
    it('应该处理获取记录时的错误', async () => {
      const getAllPromise = service.getAllByCharacter('test-character')

      // Trigger error
      setTimeout(() => {
        mockRequest.error = new Error('GetAll failed')
        if (mockRequest.onerror) {
          mockRequest.onerror({ target: mockRequest } as any)
        }
      }, 0)

      await expect(getAllPromise).rejects.toThrow()
    })
  })

  describe('cleanupOldCache - 错误处理', () => {
    it('应该处理清理缓存时的事务错误', async () => {
      const now = Date.now()
      const records: TestCacheRecord[] = [
        {
          key: 'key1',
          characterName: 'test-character',
          data: 'data1',
          timestamp: now - 3000,
        },
        {
          key: 'key2',
          characterName: 'test-character',
          data: 'data2',
          timestamp: now - 2000,
        },
      ]

      vi.spyOn(service, 'getAllByCharacter').mockResolvedValue(records)

      const cleanupPromise = service.cleanupOldCache('test-character', 1)

      // Trigger transaction error
      setTimeout(() => {
        mockTransaction.error = new Error('Transaction failed')
        if (mockTransaction.onerror) {
          mockTransaction.onerror({ target: mockTransaction } as any)
        }
      }, 0)

      await expect(cleanupPromise).rejects.toThrow()
    })
  })

  describe('getRecordKey - 复合键处理', () => {
    it('应该处理数组 keyPath', () => {
      // Create service with composite key
      const compositeConfig: DBConfig = {
        name: 'composite-db',
        version: 1,
        storeName: 'composite-store',
        keyPath: ['characterName', 'key'],
        indexes: [],
      }

      const compositeService = new BaseCacheService<TestCacheRecord>(
        compositeConfig,
        'Composite Test'
      )

      const record: TestCacheRecord = {
        key: 'test-key',
        characterName: 'test-character',
        data: 'test-data',
        timestamp: Date.now(),
      }

      const recordKey = compositeService['getRecordKey'](record)

      expect(Array.isArray(recordKey)).toBe(true)
      expect(recordKey).toEqual(['test-character', 'test-key'])
    })
  })

  describe('close', () => {
    it('应该关闭数据库连接', async () => {
      await service['init']()

      service.close()

      expect(mockDB.close).toHaveBeenCalled()
      expect(service['db']).toBeNull()
    })
  })
})
