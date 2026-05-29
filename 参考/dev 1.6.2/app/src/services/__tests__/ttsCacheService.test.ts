/**
 * @file ttsCacheService.test.ts
 * @description TTSCacheService 单元测试
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TTSCacheService } from '../ttsCacheService'

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
      ttsCacheLimit: 100,
    },
  })),
}))

vi.mock('@/utils/indexedDB', () => ({
  ttsIndexedDBHelper: {
    init: vi.fn().mockResolvedValue(undefined),
    getByKey: vi.fn(),
    put: vi.fn().mockResolvedValue(undefined),
    deleteByKey: vi.fn().mockResolvedValue(undefined),
    getAllByCharacter: vi.fn(),
    clearByCharacter: vi.fn(),
    cleanupOldCache: vi.fn().mockResolvedValue(0),
    getStatsByCharacter: vi.fn(),
  },
}))

describe('TTSCacheService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset static state
    ;(TTSCacheService as any).isInitialized = false
  })

  describe('generateKey', () => {
    it('应该为相同文本生成相同的键', () => {
      const key1 = TTSCacheService.generateKey('测试文本')
      const key2 = TTSCacheService.generateKey('测试文本')

      expect(key1).toBe(key2)
      expect(key1).toMatch(/^tts_/)
    })

    it('应该为不同文本生成不同的键', () => {
      const key1 = TTSCacheService.generateKey('文本1')
      const key2 = TTSCacheService.generateKey('文本2')

      expect(key1).not.toBe(key2)
    })
  })

  describe('isCacheAvailable', () => {
    it('应该在有角色卡名称时返回 true', async () => {
      const { CharacterApi } = await import('../api/characterApi')
      vi.mocked(CharacterApi.getCurrentCharacterName).mockReturnValue('test-character')

      expect(TTSCacheService.isCacheAvailable()).toBe(true)
    })

    it('应该在没有角色卡名称时返回 false', async () => {
      const { CharacterApi } = await import('../api/characterApi')
      vi.mocked(CharacterApi.getCurrentCharacterName).mockReturnValue(null)

      expect(TTSCacheService.isCacheAvailable()).toBe(false)
    })
  })

  describe('get', () => {
    it('应该成功获取缓存的音频', async () => {
      const { CharacterApi } = await import('../api/characterApi')
      const { ttsIndexedDBHelper } = await import('@/utils/indexedDB')

      vi.mocked(CharacterApi.getCurrentCharacterName).mockReturnValue('test-character')
      vi.mocked(ttsIndexedDBHelper.getByKey).mockResolvedValue({
        characterName: 'test-character',
        key: 'tts_test',
        audioData: 'audio-data',
        format: 'mp3',
        outputFormat: 'hex',
        timestamp: Date.now(),
      })

      const result = await TTSCacheService.get('测试文本')

      expect(result).toBeDefined()
      expect(result?.audioData).toBe('audio-data')
    })

    it('应该在缓存未命中时返回 null', async () => {
      const { CharacterApi } = await import('../api/characterApi')
      const { ttsIndexedDBHelper } = await import('@/utils/indexedDB')

      vi.mocked(CharacterApi.getCurrentCharacterName).mockReturnValue('test-character')
      vi.mocked(ttsIndexedDBHelper.getByKey).mockResolvedValue(undefined)

      const result = await TTSCacheService.get('测试文本')

      expect(result).toBeNull()
    })

    it('应该在没有角色卡名称时返回 null', async () => {
      const { CharacterApi } = await import('../api/characterApi')

      vi.mocked(CharacterApi.getCurrentCharacterName).mockReturnValue(null)

      const result = await TTSCacheService.get('测试文本')

      expect(result).toBeNull()
    })

    it('应该处理获取失败的情况', async () => {
      const { CharacterApi } = await import('../api/characterApi')
      const { ttsIndexedDBHelper } = await import('@/utils/indexedDB')

      vi.mocked(CharacterApi.getCurrentCharacterName).mockReturnValue('test-character')
      vi.mocked(ttsIndexedDBHelper.getByKey).mockRejectedValue(new Error('Get failed'))

      const result = await TTSCacheService.get('测试文本')

      expect(result).toBeNull()
    })
  })

  describe('set', () => {
    it('应该成功保存音频到缓存', async () => {
      const { CharacterApi } = await import('../api/characterApi')
      const { ttsIndexedDBHelper } = await import('@/utils/indexedDB')

      vi.mocked(CharacterApi.getCurrentCharacterName).mockReturnValue('test-character')

      const result = await TTSCacheService.set('测试文本', 'audio-data', 'mp3', 'hex')

      expect(result).toBe(true)
      expect(ttsIndexedDBHelper.put).toHaveBeenCalled()
      expect(ttsIndexedDBHelper.cleanupOldCache).toHaveBeenCalledWith('test-character', 100)
    })

    it('应该在没有角色卡名称时返回 false', async () => {
      const { CharacterApi } = await import('../api/characterApi')

      vi.mocked(CharacterApi.getCurrentCharacterName).mockReturnValue(null)

      const result = await TTSCacheService.set('测试文本', 'audio-data', 'mp3', 'hex')

      expect(result).toBe(false)
    })

    it('应该处理保存失败的情况', async () => {
      const { CharacterApi } = await import('../api/characterApi')
      const { ttsIndexedDBHelper } = await import('@/utils/indexedDB')

      vi.mocked(CharacterApi.getCurrentCharacterName).mockReturnValue('test-character')
      vi.mocked(ttsIndexedDBHelper.put).mockRejectedValue(new Error('Put failed'))

      const result = await TTSCacheService.set('测试文本', 'audio-data', 'mp3', 'hex')

      expect(result).toBe(false)
    })
  })

  describe('delete', () => {
    it('应该成功删除缓存', async () => {
      const { CharacterApi } = await import('../api/characterApi')
      const { ttsIndexedDBHelper } = await import('@/utils/indexedDB')

      vi.mocked(CharacterApi.getCurrentCharacterName).mockReturnValue('test-character')

      const result = await TTSCacheService.delete('测试文本')

      expect(result).toBe(true)
      expect(ttsIndexedDBHelper.deleteByKey).toHaveBeenCalled()
    })

    it('应该在没有角色卡名称时返回 false', async () => {
      const { CharacterApi } = await import('../api/characterApi')

      vi.mocked(CharacterApi.getCurrentCharacterName).mockReturnValue(null)

      const result = await TTSCacheService.delete('测试文本')

      expect(result).toBe(false)
    })
  })

  describe('getAll', () => {
    it('应该成功获取所有缓存记录', async () => {
      const { CharacterApi } = await import('../api/characterApi')
      const { ttsIndexedDBHelper } = await import('@/utils/indexedDB')

      vi.mocked(CharacterApi.getCurrentCharacterName).mockReturnValue('test-character')
      vi.mocked(ttsIndexedDBHelper.getAllByCharacter).mockResolvedValue([
        {
          characterName: 'test-character',
          key: 'tts_1',
          audioData: 'data1',
          format: 'mp3',
          outputFormat: 'hex',
          timestamp: Date.now(),
        },
      ])

      const result = await TTSCacheService.getAll()

      expect(result).toHaveLength(1)
    })

    it('应该在没有角色卡名称时返回空数组', async () => {
      const { CharacterApi } = await import('../api/characterApi')

      vi.mocked(CharacterApi.getCurrentCharacterName).mockReturnValue(null)

      const result = await TTSCacheService.getAll()

      expect(result).toEqual([])
    })
  })

  describe('clear', () => {
    it('应该成功清空缓存', async () => {
      const { CharacterApi } = await import('../api/characterApi')
      const { ttsIndexedDBHelper } = await import('@/utils/indexedDB')

      vi.mocked(CharacterApi.getCurrentCharacterName).mockReturnValue('test-character')
      vi.mocked(ttsIndexedDBHelper.clearByCharacter).mockResolvedValue(5)

      const result = await TTSCacheService.clear()

      expect(result).toBe(true)
    })

    it('应该在没有角色卡名称时返回 false', async () => {
      const { CharacterApi } = await import('../api/characterApi')

      vi.mocked(CharacterApi.getCurrentCharacterName).mockReturnValue(null)

      const result = await TTSCacheService.clear()

      expect(result).toBe(false)
    })
  })

  describe('getStats', () => {
    it('应该成功获取缓存统计信息', async () => {
      const { CharacterApi } = await import('../api/characterApi')
      const { ttsIndexedDBHelper } = await import('@/utils/indexedDB')

      vi.mocked(CharacterApi.getCurrentCharacterName).mockReturnValue('test-character')
      vi.mocked(ttsIndexedDBHelper.getStatsByCharacter).mockResolvedValue({
        count: 10,
        totalSize: 1024,
      })

      const result = await TTSCacheService.getStats()

      expect(result.count).toBe(10)
      expect(result.totalSize).toBe(1024)
      expect(result.characterName).toBe('test-character')
      expect(result.limit).toBe(100)
    })

    it('应该在没有角色卡名称时返回默认统计信息', async () => {
      const { CharacterApi } = await import('../api/characterApi')

      vi.mocked(CharacterApi.getCurrentCharacterName).mockReturnValue(null)

      const result = await TTSCacheService.getStats()

      expect(result.count).toBe(0)
      expect(result.totalSize).toBe(0)
      expect(result.characterName).toBeNull()
    })
  })
})
