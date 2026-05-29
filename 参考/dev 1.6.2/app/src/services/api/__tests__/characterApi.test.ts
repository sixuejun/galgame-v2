// @ts-nocheck
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CharacterApi } from '../characterApi'
import { logger } from '../../../utils/logger'
import { PermissionError } from '../../../utils/errorHandler'

// Mock logger
vi.mock('../../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('CharacterApi', () => {
  const mockCharData = {
    name: 'Test Character',
    avatar: 'test-avatar.png',
    description: 'A test character',
  }

  const mockGetCharData = vi.fn()
  const mockGetCharAvatarPath = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window.getCharData and window.getCharAvatarPath
    // @ts-expect-error - Mocking global window for testing
    globalThis.window = {
      getCharData: mockGetCharData,
      getCharAvatarPath: mockGetCharAvatarPath,
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('isAvailable', () => {
    it('当 window.getCharData 存在时应该返回 true', () => {
      expect(CharacterApi.isAvailable()).toBe(true)
    })

    it('当 window.getCharData 不存在时应该返回 false', () => {
      // @ts-expect-error - Mocking global window for testing
      globalThis.window = {}
      expect(CharacterApi.isAvailable()).toBe(false)
    })

    it('当 window 不存在时应该返回 false', () => {
      // @ts-expect-error - Mocking global window for testing
      globalThis.window = undefined
      expect(CharacterApi.isAvailable()).toBe(false)
    })

    it('当 window.getCharData 不是函数时应该返回 false', () => {
      // @ts-expect-error - Mocking global window for testing
      globalThis.window = {
        getCharData: 'not a function',
      }
      expect(CharacterApi.isAvailable()).toBe(false)
    })

    it('当检测过程中抛出异常时应该返回 false', () => {
      // @ts-expect-error - Mocking global window for testing
      globalThis.window = {
        get getCharData() {
          throw new Error('Access denied')
        },
      }
      expect(CharacterApi.isAvailable()).toBe(false)
      expect(logger.debug).toHaveBeenCalledWith('Character API 可用性检测失败:', expect.any(Error))
    })
  })

  describe('getCharData', () => {
    it('应该成功获取当前角色卡数据', () => {
      mockGetCharData.mockReturnValue(mockCharData)

      const result = CharacterApi.getCharData('current')

      expect(result).toEqual(mockCharData)
      expect(mockGetCharData).toHaveBeenCalledWith('current', false)
      expect(logger.debug).toHaveBeenCalledWith(
        '[Character API] 调用 getCharData:',
        'current',
        false
      )
      expect(logger.debug).toHaveBeenCalledWith(
        '[Character API] 获取到角色卡数据:',
        'Test Character'
      )
    })

    it('应该支持通过角色名称获取数据', () => {
      mockGetCharData.mockReturnValue(mockCharData)

      const result = CharacterApi.getCharData('Test Character', false)

      expect(result).toEqual(mockCharData)
      expect(mockGetCharData).toHaveBeenCalledWith('Test Character', false)
    })

    it('应该支持通过头像ID获取数据', () => {
      mockGetCharData.mockReturnValue(mockCharData)

      const result = CharacterApi.getCharData('avatar-123', true)

      expect(result).toEqual(mockCharData)
      expect(mockGetCharData).toHaveBeenCalledWith('avatar-123', true)
    })

    it('当角色卡不存在时应该返回 null', () => {
      mockGetCharData.mockReturnValue(null)

      const result = CharacterApi.getCharData('non-existent')

      expect(result).toBeNull()
      expect(logger.debug).toHaveBeenCalledWith('[Character API] 未找到角色卡数据')
    })

    it('当 API 不可用时应该抛出 PermissionError', () => {
      // @ts-expect-error - Mocking global window for testing
      globalThis.window = {}

      expect(() => CharacterApi.getCharData('current')).toThrow(PermissionError)
      expect(() => CharacterApi.getCharData('current')).toThrow('Character API 不可用')
    })

    it('当调用失败时应该返回 null', () => {
      mockGetCharData.mockImplementation(() => {
        throw new Error('API Error')
      })

      const result = CharacterApi.getCharData('current')

      expect(result).toBeNull()
      expect(logger.error).toHaveBeenCalledWith(
        '[Character API] 获取角色卡数据失败:',
        expect.any(Error)
      )
    })
  })

  describe('getCurrentCharacterName', () => {
    it('应该成功获取当前角色卡名称', () => {
      mockGetCharData.mockReturnValue(mockCharData)

      const result = CharacterApi.getCurrentCharacterName()

      expect(result).toBe('Test Character')
      // getCurrentCharacterName 内部调用 getCharData('current')，而 getCharData 默认传递 false 作为第二个参数
      expect(mockGetCharData).toHaveBeenCalledWith('current', false)
    })

    it('当角色卡不存在时应该返回 null', () => {
      mockGetCharData.mockReturnValue(null)

      const result = CharacterApi.getCurrentCharacterName()

      expect(result).toBeNull()
    })

    it('当角色卡数据没有 name 字段时应该返回 null', () => {
      mockGetCharData.mockReturnValue({ avatar: 'test.png' })

      const result = CharacterApi.getCurrentCharacterName()

      expect(result).toBeNull()
    })

    it('当获取失败时应该返回 null', () => {
      mockGetCharData.mockImplementation(() => {
        throw new Error('API Error')
      })

      const result = CharacterApi.getCurrentCharacterName()

      expect(result).toBeNull()
      // getCurrentCharacterName 内部调用 getCharData，错误日志来自 getCharData
      expect(logger.error).toHaveBeenCalledWith(
        '[Character API] 获取角色卡数据失败:',
        expect.any(Error)
      )
    })
  })

  describe('getCharAvatarPath', () => {
    it('应该成功获取当前角色头像路径', () => {
      mockGetCharAvatarPath.mockReturnValue('/path/to/avatar.png')

      const result = CharacterApi.getCharAvatarPath('current')

      expect(result).toBe('/path/to/avatar.png')
      expect(mockGetCharAvatarPath).toHaveBeenCalledWith('current', false)
      expect(logger.debug).toHaveBeenCalledWith(
        '[Character API] 调用 getCharAvatarPath:',
        'current',
        false
      )
      expect(logger.debug).toHaveBeenCalledWith(
        '[Character API] 获取到头像路径:',
        '/path/to/avatar.png'
      )
    })

    it('应该支持通过角色名称获取头像路径', () => {
      mockGetCharAvatarPath.mockReturnValue('/path/to/avatar.png')

      const result = CharacterApi.getCharAvatarPath('Test Character', false)

      expect(result).toBe('/path/to/avatar.png')
      expect(mockGetCharAvatarPath).toHaveBeenCalledWith('Test Character', false)
    })

    it('应该支持通过头像ID获取路径', () => {
      mockGetCharAvatarPath.mockReturnValue('/path/to/avatar.png')

      const result = CharacterApi.getCharAvatarPath('avatar-123', true)

      expect(result).toBe('/path/to/avatar.png')
      expect(mockGetCharAvatarPath).toHaveBeenCalledWith('avatar-123', true)
    })

    it('当头像路径不存在时应该返回 null', () => {
      mockGetCharAvatarPath.mockReturnValue(null)

      const result = CharacterApi.getCharAvatarPath('non-existent')

      expect(result).toBeNull()
      expect(logger.debug).toHaveBeenCalledWith('[Character API] 未找到头像路径')
    })

    it('当 API 不可用时应该抛出 PermissionError', () => {
      // @ts-expect-error - Mocking global window for testing
      globalThis.window = {}

      expect(() => CharacterApi.getCharAvatarPath('current')).toThrow(PermissionError)
      expect(() => CharacterApi.getCharAvatarPath('current')).toThrow('Character API 不可用')
    })

    it('当调用失败时应该返回 null', () => {
      mockGetCharAvatarPath.mockImplementation(() => {
        throw new Error('API Error')
      })

      const result = CharacterApi.getCharAvatarPath('current')

      expect(result).toBeNull()
      expect(logger.error).toHaveBeenCalledWith(
        '[Character API] 获取头像路径失败:',
        expect.any(Error)
      )
    })
  })
})
