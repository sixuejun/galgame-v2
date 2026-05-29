/**
 * @file imageCacheService.test.ts
 * @description ImageCacheService 单元测试
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ImageCacheService } from '../imageCacheService'

// Mock dependencies
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

vi.mock('../api/characterApi', () => ({
  CharacterApi: {
    getCurrentCharacterName: vi.fn(),
  },
}))

vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: vi.fn(() => ({
    settings: {
      imageCacheLimit: 100,
    },
  })),
}))

vi.mock('@/utils/indexedDB', () => ({
  indexedDBHelper: {
    init: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue(undefined),
    getByKey: vi.fn().mockResolvedValue(null),
    deleteByKey: vi.fn().mockResolvedValue(undefined),
    clearByCharacter: vi.fn().mockResolvedValue(0),
    getStatsByCharacter: vi.fn().mockResolvedValue({ count: 0, totalSize: 0 }),
    cleanupOldCache: vi.fn().mockResolvedValue(0),
  },
}))

describe('ImageCacheService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset static state
    ;(ImageCacheService as any).isInitialized = false
    ;(ImageCacheService as any).migrationPromise = null
    // Clear localStorage
    localStorage.clear()
  })

  describe('isCacheAvailable', () => {
    it('应该在有角色卡名称时返回 true', async () => {
      const { CharacterApi } = await import('../api/characterApi')
      vi.mocked(CharacterApi.getCurrentCharacterName).mockReturnValue('test-character')

      expect(ImageCacheService.isCacheAvailable()).toBe(true)
    })

    it('应该在没有角色卡名称时返回 false', async () => {
      const { CharacterApi } = await import('../api/characterApi')
      vi.mocked(CharacterApi.getCurrentCharacterName).mockReturnValue(null)

      expect(ImageCacheService.isCacheAvailable()).toBe(false)
    })
  })

  describe('getImage', () => {
    it('应该成功获取缓存的图片', async () => {
      const { CharacterApi } = await import('../api/characterApi')
      const { indexedDBHelper } = await import('@/utils/indexedDB')

      vi.mocked(CharacterApi.getCurrentCharacterName).mockReturnValue('test-character')
      vi.mocked(indexedDBHelper.getByKey).mockResolvedValue({
        characterName: 'test-character',
        description: 'test description',
        imageUrl: 'data:image/png;base64,test',
        timestamp: Date.now(),
      })

      const result = await ImageCacheService.getImage('test description')

      expect(result).toBe('data:image/png;base64,test')
      expect(indexedDBHelper.getByKey).toHaveBeenCalledWith('test-character', 'test description')
    })

    it('应该在缓存未命中时返回 null', async () => {
      const { CharacterApi } = await import('../api/characterApi')
      const { indexedDBHelper } = await import('@/utils/indexedDB')

      vi.mocked(CharacterApi.getCurrentCharacterName).mockReturnValue('test-character')
      vi.mocked(indexedDBHelper.getByKey).mockResolvedValue(undefined)

      const result = await ImageCacheService.getImage('test description')

      expect(result).toBeNull()
    })

    it('应该在没有角色卡名称时返回 null', async () => {
      const { CharacterApi } = await import('../api/characterApi')

      vi.mocked(CharacterApi.getCurrentCharacterName).mockReturnValue(null)

      const result = await ImageCacheService.getImage('test description')

      expect(result).toBeNull()
    })

    it('应该在获取失败时返回 null', async () => {
      const { CharacterApi } = await import('../api/characterApi')
      const { indexedDBHelper } = await import('@/utils/indexedDB')

      vi.mocked(CharacterApi.getCurrentCharacterName).mockReturnValue('test-character')
      vi.mocked(indexedDBHelper.getByKey).mockRejectedValue(new Error('Get failed'))

      const result = await ImageCacheService.getImage('test description')

      expect(result).toBeNull()
    })
  })

  describe('setImage', () => {
    it('应该成功保存图片到缓存', async () => {
      const { CharacterApi } = await import('../api/characterApi')
      const { indexedDBHelper } = await import('@/utils/indexedDB')

      vi.mocked(CharacterApi.getCurrentCharacterName).mockReturnValue('test-character')

      const result = await ImageCacheService.setImage(
        'test description',
        'data:image/png;base64,test'
      )

      expect(result).toBe(true)
      expect(indexedDBHelper.put).toHaveBeenCalledWith(
        expect.objectContaining({
          characterName: 'test-character',
          description: 'test description',
          imageUrl: 'data:image/png;base64,test',
        })
      )
      expect(indexedDBHelper.cleanupOldCache).toHaveBeenCalledWith('test-character', 100)
    })

    it('应该在没有角色卡名称时返回 false', async () => {
      const { CharacterApi } = await import('../api/characterApi')

      vi.mocked(CharacterApi.getCurrentCharacterName).mockReturnValue(null)

      const result = await ImageCacheService.setImage(
        'test description',
        'data:image/png;base64,test'
      )

      expect(result).toBe(false)
    })

    it('应该在保存失败时返回 false', async () => {
      const { CharacterApi } = await import('../api/characterApi')
      const { indexedDBHelper } = await import('@/utils/indexedDB')

      vi.mocked(CharacterApi.getCurrentCharacterName).mockReturnValue('test-character')
      vi.mocked(indexedDBHelper.put).mockRejectedValue(new Error('Put failed'))

      const result = await ImageCacheService.setImage(
        'test description',
        'data:image/png;base64,test'
      )

      expect(result).toBe(false)
    })
  })

  describe('deleteImage', () => {
    it('应该成功删除缓存的图片', async () => {
      const { CharacterApi } = await import('../api/characterApi')
      const { indexedDBHelper } = await import('@/utils/indexedDB')

      vi.mocked(CharacterApi.getCurrentCharacterName).mockReturnValue('test-character')

      const result = await ImageCacheService.deleteImage('test description')

      expect(result).toBe(true)
      expect(indexedDBHelper.deleteByKey).toHaveBeenCalledWith('test-character', 'test description')
    })

    it('应该在没有角色卡名称时返回 false', async () => {
      const { CharacterApi } = await import('../api/characterApi')

      vi.mocked(CharacterApi.getCurrentCharacterName).mockReturnValue(null)

      const result = await ImageCacheService.deleteImage('test description')

      expect(result).toBe(false)
    })

    it('应该在删除失败时返回 false', async () => {
      const { CharacterApi } = await import('../api/characterApi')
      const { indexedDBHelper } = await import('@/utils/indexedDB')

      vi.mocked(CharacterApi.getCurrentCharacterName).mockReturnValue('test-character')
      vi.mocked(indexedDBHelper.deleteByKey).mockRejectedValue(new Error('Delete failed'))

      const result = await ImageCacheService.deleteImage('test description')

      expect(result).toBe(false)
    })
  })

  describe('clearCache', () => {
    it('应该成功清空缓存', async () => {
      const { CharacterApi } = await import('../api/characterApi')
      const { indexedDBHelper } = await import('@/utils/indexedDB')

      vi.mocked(CharacterApi.getCurrentCharacterName).mockReturnValue('test-character')
      vi.mocked(indexedDBHelper.clearByCharacter).mockResolvedValue(10)

      const result = await ImageCacheService.clearCache()

      expect(result).toBe(true)
      expect(indexedDBHelper.clearByCharacter).toHaveBeenCalledWith('test-character')
    })

    it('应该在没有角色卡名称时返回 false', async () => {
      const { CharacterApi } = await import('../api/characterApi')

      vi.mocked(CharacterApi.getCurrentCharacterName).mockReturnValue(null)

      const result = await ImageCacheService.clearCache()

      expect(result).toBe(false)
    })

    it('应该在清空失败时返回 false', async () => {
      const { CharacterApi } = await import('../api/characterApi')
      const { indexedDBHelper } = await import('@/utils/indexedDB')

      vi.mocked(CharacterApi.getCurrentCharacterName).mockReturnValue('test-character')
      vi.mocked(indexedDBHelper.clearByCharacter).mockRejectedValue(new Error('Clear failed'))

      const result = await ImageCacheService.clearCache()

      expect(result).toBe(false)
    })
  })

  describe('getCacheStats', () => {
    it('应该成功获取缓存统计信息', async () => {
      const { CharacterApi } = await import('../api/characterApi')
      const { indexedDBHelper } = await import('@/utils/indexedDB')

      vi.mocked(CharacterApi.getCurrentCharacterName).mockReturnValue('test-character')
      vi.mocked(indexedDBHelper.getStatsByCharacter).mockResolvedValue({
        count: 10,
        totalSize: 1024000,
      })

      const result = await ImageCacheService.getCacheStats()

      expect(result).toEqual({
        count: 10,
        totalSize: 1024000,
        characterName: 'test-character',
        limit: 100,
      })
    })

    it('应该在没有角色卡名称时返回默认值', async () => {
      const { CharacterApi } = await import('../api/characterApi')

      vi.mocked(CharacterApi.getCurrentCharacterName).mockReturnValue(null)

      const result = await ImageCacheService.getCacheStats()

      expect(result).toEqual({
        count: 0,
        totalSize: 0,
        characterName: null,
        limit: 100,
      })
    })

    it('应该在获取统计失败时返回默认值', async () => {
      const { CharacterApi } = await import('../api/characterApi')
      const { indexedDBHelper } = await import('@/utils/indexedDB')

      vi.mocked(CharacterApi.getCurrentCharacterName).mockReturnValue('test-character')
      vi.mocked(indexedDBHelper.getStatsByCharacter).mockRejectedValue(new Error('Stats failed'))

      const result = await ImageCacheService.getCacheStats()

      expect(result).toEqual({
        count: 0,
        totalSize: 0,
        characterName: 'test-character',
        limit: 100,
      })
    })
  })
})
