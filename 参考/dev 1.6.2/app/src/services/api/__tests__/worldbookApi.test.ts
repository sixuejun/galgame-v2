// @ts-nocheck
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { WorldbookApi } from '../worldbookApi'
import { logger } from '../../../utils/logger'
import { PermissionError, NetworkError } from '../../../utils/errorHandler'
import type { WorldbookEntry, CharWorldbooks } from '../../../types/external-apis'

// Mock logger
vi.mock('../../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('WorldbookApi', () => {
  const mockGetWorldbookNames = vi.fn()
  const mockGetCharWorldbookNames = vi.fn()
  const mockGetWorldbook = vi.fn()
  const mockCreateWorldbook = vi.fn()
  const mockRebindCharWorldbooks = vi.fn()
  const mockUpdateWorldbookWith = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock all worldbook APIs
    // @ts-expect-error - Mocking global window for testing
    globalThis.window = {
      getWorldbookNames: mockGetWorldbookNames,
      getCharWorldbookNames: mockGetCharWorldbookNames,
      getWorldbook: mockGetWorldbook,
      createWorldbook: mockCreateWorldbook,
      rebindCharWorldbooks: mockRebindCharWorldbooks,
      updateWorldbookWith: mockUpdateWorldbookWith,
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('isAvailable', () => {
    it('当所有 API 都存在时应该返回 true', () => {
      expect(WorldbookApi.isAvailable()).toBe(true)
    })

    it('当缺少 getWorldbookNames 时应该返回 false', () => {
      // @ts-expect-error - Mocking global window for testing
      globalThis.window = {
        getCharWorldbookNames: mockGetCharWorldbookNames,
        getWorldbook: mockGetWorldbook,
        createWorldbook: mockCreateWorldbook,
        rebindCharWorldbooks: mockRebindCharWorldbooks,
        updateWorldbookWith: mockUpdateWorldbookWith,
      }
      expect(WorldbookApi.isAvailable()).toBe(false)
    })

    it('当缺少 getCharWorldbookNames 时应该返回 false', () => {
      // @ts-expect-error - Mocking global window for testing
      globalThis.window = {
        getWorldbookNames: mockGetWorldbookNames,
        getWorldbook: mockGetWorldbook,
        createWorldbook: mockCreateWorldbook,
        rebindCharWorldbooks: mockRebindCharWorldbooks,
        updateWorldbookWith: mockUpdateWorldbookWith,
      }
      expect(WorldbookApi.isAvailable()).toBe(false)
    })

    it('当 window 不存在时应该返回 false', () => {
      // @ts-expect-error - Mocking global window for testing
      globalThis.window = undefined
      expect(WorldbookApi.isAvailable()).toBe(false)
    })

    it('当检测过程中抛出异常时应该返回 false', () => {
      // @ts-expect-error - Mocking global window for testing
      globalThis.window = {
        get getWorldbookNames() {
          throw new Error('Access denied')
        },
      }
      expect(WorldbookApi.isAvailable()).toBe(false)
      expect(logger.debug).toHaveBeenCalledWith('Worldbook API 可用性检测失败:', expect.any(Error))
    })
  })

  describe('getWorldbookNames', () => {
    it('应该成功获取世界书名称列表', () => {
      const mockNames = ['worldbook1', 'worldbook2', 'worldbook3']
      mockGetWorldbookNames.mockReturnValue(mockNames)

      const result = WorldbookApi.getWorldbookNames()

      expect(mockGetWorldbookNames).toHaveBeenCalled()
      expect(result).toEqual(mockNames)
      expect(logger.debug).toHaveBeenCalledWith('[Worldbook API] 调用 getWorldbookNames')
      expect(logger.debug).toHaveBeenCalledWith('[Worldbook API] 获取到世界书列表:', mockNames)
    })

    it('当 API 不可用时应该抛出 PermissionError', () => {
      // @ts-expect-error - Mocking global window for testing
      globalThis.window = {}

      expect(() => WorldbookApi.getWorldbookNames()).toThrow(PermissionError)
      expect(() => WorldbookApi.getWorldbookNames()).toThrow('Worldbook API 不可用')
    })

    it('当调用失败时应该抛出 NetworkError', () => {
      mockGetWorldbookNames.mockImplementation(() => {
        throw new Error('API call failed')
      })

      expect(() => WorldbookApi.getWorldbookNames()).toThrow(NetworkError)
      expect(() => WorldbookApi.getWorldbookNames()).toThrow('获取世界书列表失败')
    })

    it('应该返回空数组当没有世界书时', () => {
      mockGetWorldbookNames.mockReturnValue([])

      const result = WorldbookApi.getWorldbookNames()

      expect(result).toEqual([])
    })
  })

  describe('getCharWorldbookNames', () => {
    const mockBindings: CharWorldbooks = {
      primary: 'main-worldbook',
      additional: ['extra1', 'extra2'],
    }

    it('应该成功获取当前角色的世界书绑定', () => {
      mockGetCharWorldbookNames.mockReturnValue(mockBindings)

      const result = WorldbookApi.getCharWorldbookNames()

      expect(mockGetCharWorldbookNames).toHaveBeenCalledWith('current')
      expect(result).toEqual(mockBindings)
      expect(logger.debug).toHaveBeenCalledWith(
        '[Worldbook API] 调用 getCharWorldbookNames:',
        'current'
      )
    })

    it('应该支持指定目标角色', () => {
      mockGetCharWorldbookNames.mockReturnValue(mockBindings)

      const result = WorldbookApi.getCharWorldbookNames('character-123')

      expect(mockGetCharWorldbookNames).toHaveBeenCalledWith('character-123')
      expect(result).toEqual(mockBindings)
    })

    it('当 API 不可用时应该抛出 PermissionError', () => {
      // @ts-expect-error - Mocking global window for testing
      globalThis.window = {}

      expect(() => WorldbookApi.getCharWorldbookNames()).toThrow(PermissionError)
    })

    it('当调用失败时应该抛出 NetworkError', () => {
      mockGetCharWorldbookNames.mockImplementation(() => {
        throw new Error('API call failed')
      })

      expect(() => WorldbookApi.getCharWorldbookNames()).toThrow(NetworkError)
      expect(() => WorldbookApi.getCharWorldbookNames()).toThrow('获取角色世界书绑定失败')
    })
  })

  describe('getWorldbook', () => {
    const mockEntries: WorldbookEntry[] = [
      {
        uid: 1,
        key: ['test'],
        keysecondary: [],
        comment: 'Test entry',
        content: 'Test content',
        constant: false,
        vectorized: false,
        selective: true,
        selectiveLogic: 0,
        addMemo: false,
        order: 100,
        position: 0,
        disable: false,
        excludeRecursion: false,
        preventRecursion: false,
        delayUntilRecursion: false,
        probability: 100,
        useProbability: true,
        depth: 4,
        group: '',
        groupOverride: false,
        groupWeight: 100,
        scanDepth: null,
        caseSensitive: null,
        matchWholeWords: null,
        useGroupScoring: null,
        automationId: '',
        role: 0,
        sticky: null,
        cooldown: null,
        delay: null,
      },
    ]

    it('应该成功获取世界书内容', async () => {
      mockGetWorldbook.mockResolvedValue(mockEntries)

      const result = await WorldbookApi.getWorldbook('test-worldbook')

      expect(mockGetWorldbook).toHaveBeenCalledWith('test-worldbook')
      expect(result).toEqual(mockEntries)
      expect(logger.debug).toHaveBeenCalledWith(
        '[Worldbook API] 调用 getWorldbook:',
        'test-worldbook'
      )
      expect(logger.debug).toHaveBeenCalledWith(
        '[Worldbook API] 获取到世界书条目:',
        mockEntries.length
      )
    })

    it('当 API 不可用时应该抛出 PermissionError', async () => {
      // @ts-expect-error - Mocking global window for testing
      globalThis.window = {}

      await expect(WorldbookApi.getWorldbook('test')).rejects.toThrow(PermissionError)
    })

    it('当调用失败时应该抛出错误', async () => {
      mockGetWorldbook.mockRejectedValue(new Error('API call failed'))

      await expect(WorldbookApi.getWorldbook('test')).rejects.toThrow('获取世界书 "test" 失败')
    })

    it('应该返回空数组当世界书为空时', async () => {
      mockGetWorldbook.mockResolvedValue([])

      const result = await WorldbookApi.getWorldbook('empty-worldbook')

      expect(result).toEqual([])
    })
  })

  describe('createWorldbook', () => {
    const mockEntries: WorldbookEntry[] = [
      {
        uid: 1,
        key: ['test'],
        keysecondary: [],
        comment: 'Test entry',
        content: 'Test content',
        constant: false,
        vectorized: false,
        selective: true,
        selectiveLogic: 0,
        addMemo: false,
        order: 100,
        position: 0,
        disable: false,
        excludeRecursion: false,
        preventRecursion: false,
        delayUntilRecursion: false,
        probability: 100,
        useProbability: true,
        depth: 4,
        group: '',
        groupOverride: false,
        groupWeight: 100,
        scanDepth: null,
        caseSensitive: null,
        matchWholeWords: null,
        useGroupScoring: null,
        automationId: '',
        role: 0,
        sticky: null,
        cooldown: null,
        delay: null,
      },
    ]

    it('应该成功创建世界书', async () => {
      mockCreateWorldbook.mockResolvedValue(undefined)

      await WorldbookApi.createWorldbook('new-worldbook', mockEntries)

      expect(mockCreateWorldbook).toHaveBeenCalledWith('new-worldbook', mockEntries)
      expect(logger.debug).toHaveBeenCalledWith(
        '[Worldbook API] 调用 createWorldbook:',
        'new-worldbook',
        mockEntries.length
      )
      expect(logger.debug).toHaveBeenCalledWith('[Worldbook API] 世界书创建成功')
    })

    it('当 API 不可用时应该抛出 PermissionError', async () => {
      // @ts-expect-error - Mocking global window for testing
      globalThis.window = {}

      await expect(WorldbookApi.createWorldbook('test', mockEntries)).rejects.toThrow(
        PermissionError
      )
    })

    it('当调用失败时应该抛出错误', async () => {
      mockCreateWorldbook.mockRejectedValue(new Error('API call failed'))

      await expect(WorldbookApi.createWorldbook('test', mockEntries)).rejects.toThrow(
        '创建世界书 "test" 失败'
      )
    })

    it('应该支持创建空世界书', async () => {
      mockCreateWorldbook.mockResolvedValue(undefined)

      await WorldbookApi.createWorldbook('empty-worldbook', [])

      expect(mockCreateWorldbook).toHaveBeenCalledWith('empty-worldbook', [])
    })
  })

  describe('rebindCharWorldbooks', () => {
    const mockBindings: CharWorldbooks = {
      primary: 'main-worldbook',
      additional: ['extra1', 'extra2'],
    }

    it('应该成功重新绑定当前角色的世界书', async () => {
      mockRebindCharWorldbooks.mockResolvedValue(undefined)

      await WorldbookApi.rebindCharWorldbooks('current', mockBindings)

      expect(mockRebindCharWorldbooks).toHaveBeenCalledWith('current', mockBindings)
      expect(logger.debug).toHaveBeenCalledWith(
        '[Worldbook API] 调用 rebindCharWorldbooks:',
        'current',
        mockBindings
      )
      expect(logger.debug).toHaveBeenCalledWith('[Worldbook API] 世界书绑定成功')
    })

    it('应该支持指定目标角色', async () => {
      mockRebindCharWorldbooks.mockResolvedValue(undefined)

      await WorldbookApi.rebindCharWorldbooks('character-123', mockBindings)

      expect(mockRebindCharWorldbooks).toHaveBeenCalledWith('character-123', mockBindings)
    })

    it('当 API 不可用时应该抛出 PermissionError', async () => {
      // @ts-expect-error - Mocking global window for testing
      globalThis.window = {}

      await expect(WorldbookApi.rebindCharWorldbooks('current', mockBindings)).rejects.toThrow(
        PermissionError
      )
    })

    it('当调用失败时应该抛出错误', async () => {
      mockRebindCharWorldbooks.mockRejectedValue(new Error('API call failed'))

      await expect(WorldbookApi.rebindCharWorldbooks('current', mockBindings)).rejects.toThrow(
        '重新绑定世界书失败'
      )
    })

    it('应该支持只绑定主世界书', async () => {
      const primaryOnly: CharWorldbooks = {
        primary: 'main-worldbook',
        additional: [],
      }
      mockRebindCharWorldbooks.mockResolvedValue(undefined)

      await WorldbookApi.rebindCharWorldbooks('current', primaryOnly)

      expect(mockRebindCharWorldbooks).toHaveBeenCalledWith('current', primaryOnly)
    })
  })

  describe('updateWorldbookWith', () => {
    const mockUpdater = vi.fn((entries: WorldbookEntry[]) => {
      return entries.map(entry => ({ ...entry, content: 'Updated content' }))
    })

    it('应该成功更新世界书', async () => {
      mockUpdateWorldbookWith.mockResolvedValue(undefined)

      await WorldbookApi.updateWorldbookWith('test-worldbook', mockUpdater)

      expect(mockUpdateWorldbookWith).toHaveBeenCalledWith('test-worldbook', mockUpdater)
      expect(logger.debug).toHaveBeenCalledWith(
        '[Worldbook API] 调用 updateWorldbookWith:',
        'test-worldbook'
      )
      expect(logger.debug).toHaveBeenCalledWith('[Worldbook API] 世界书更新成功')
    })

    it('当 API 不可用时应该抛出 PermissionError', async () => {
      // @ts-expect-error - Mocking global window for testing
      globalThis.window = {}

      await expect(WorldbookApi.updateWorldbookWith('test', mockUpdater)).rejects.toThrow(
        PermissionError
      )
    })

    it('当调用失败时应该抛出错误', async () => {
      mockUpdateWorldbookWith.mockRejectedValue(new Error('API call failed'))

      await expect(WorldbookApi.updateWorldbookWith('test', mockUpdater)).rejects.toThrow(
        '更新世界书 "test" 失败'
      )
    })

    it('应该正确传递更新函数', async () => {
      const customUpdater = (entries: WorldbookEntry[]) => entries
      mockUpdateWorldbookWith.mockResolvedValue(undefined)

      await WorldbookApi.updateWorldbookWith('test-worldbook', customUpdater)

      expect(mockUpdateWorldbookWith).toHaveBeenCalledWith('test-worldbook', customUpdater)
    })
  })
})
