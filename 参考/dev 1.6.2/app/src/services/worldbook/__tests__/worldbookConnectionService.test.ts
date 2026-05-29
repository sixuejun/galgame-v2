import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { WorldbookConnectionService, WORLDBOOK_NAME_PREFIX } from '../worldbookConnectionService'

// 在测试环境中，window 是由测试框架提供的全局对象

// Mock logger
vi.mock('../../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('WorldbookConnectionService', () => {
  // Mock window functions
  const mockGetWorldbookNames = vi.fn()
  const mockGetCharWorldbookNames = vi.fn()
  const mockGetWorldbook = vi.fn()
  const mockCreateWorldbook = vi.fn()
  const mockRebindCharWorldbooks = vi.fn()
  const mockUpdateWorldbookWith = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    WorldbookConnectionService.clearCache()

    // Setup window mocks
    globalThis.window = {
      getWorldbookNames: mockGetWorldbookNames,
      getCharWorldbookNames: mockGetCharWorldbookNames,
      getWorldbook: mockGetWorldbook,
      createWorldbook: mockCreateWorldbook,
      rebindCharWorldbooks: mockRebindCharWorldbooks,
      updateWorldbookWith: mockUpdateWorldbookWith,
    } as unknown as Window & typeof globalThis
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('isJSSlashRunnerAvailable', () => {
    it('所有必需函数存在时应该返回 true', () => {
      const result = WorldbookConnectionService.isJSSlashRunnerAvailable()

      expect(result).toBe(true)
    })

    it('缺少 getWorldbookNames 时应该返回 false', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (globalThis.window as any).getWorldbookNames

      const result = WorldbookConnectionService.isJSSlashRunnerAvailable()

      expect(result).toBe(false)
    })

    it('缺少 getCharWorldbookNames 时应该返回 false', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (globalThis.window as any).getCharWorldbookNames

      const result = WorldbookConnectionService.isJSSlashRunnerAvailable()

      expect(result).toBe(false)
    })

    it('缺少 getWorldbook 时应该返回 false', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (globalThis.window as any).getWorldbook

      const result = WorldbookConnectionService.isJSSlashRunnerAvailable()

      expect(result).toBe(false)
    })

    it('缺少 createWorldbook 时应该返回 false', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (globalThis.window as any).createWorldbook

      const result = WorldbookConnectionService.isJSSlashRunnerAvailable()

      expect(result).toBe(false)
    })

    it('缺少 rebindCharWorldbooks 时应该返回 false', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (globalThis.window as any).rebindCharWorldbooks

      const result = WorldbookConnectionService.isJSSlashRunnerAvailable()

      expect(result).toBe(false)
    })

    it('缺少 updateWorldbookWith 时应该返回 false', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (globalThis.window as any).updateWorldbookWith

      const result = WorldbookConnectionService.isJSSlashRunnerAvailable()

      expect(result).toBe(false)
    })

    it('window 未定义时应该返回 false', () => {
      const originalWindow = globalThis.window
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (globalThis as any).window

      const result = WorldbookConnectionService.isJSSlashRunnerAvailable()

      expect(result).toBe(false)

      // Restore window
      globalThis.window = originalWindow
    })
  })

  describe('checkCharacterBinding', () => {
    it('环境不可用时应该返回未绑定状态', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (globalThis.window as any).getCharWorldbookNames

      const result = await WorldbookConnectionService.checkCharacterBinding()

      expect(result).toEqual({
        hasBound: false,
        worldbookName: null,
        isEdenWorldbook: false,
      })
    })

    it('角色卡未绑定世界书时应该返回未绑定状态', async () => {
      mockGetCharWorldbookNames.mockReturnValue({
        primary: null,
        additional: [],
      })

      const result = await WorldbookConnectionService.checkCharacterBinding()

      expect(result).toEqual({
        hasBound: false,
        worldbookName: null,
        isEdenWorldbook: false,
      })
      expect(mockGetCharWorldbookNames).toHaveBeenCalledWith('current')
    })

    it('角色卡绑定了伊甸园世界书时应该返回正确状态', async () => {
      const worldbookName = `${WORLDBOOK_NAME_PREFIX}_test`
      mockGetCharWorldbookNames.mockReturnValue({
        primary: worldbookName,
        additional: [],
      })

      const result = await WorldbookConnectionService.checkCharacterBinding()

      expect(result).toEqual({
        hasBound: true,
        worldbookName,
        isEdenWorldbook: true,
      })
    })

    it('角色卡绑定了非伊甸园世界书时应该返回正确状态', async () => {
      const worldbookName = 'other_worldbook'
      mockGetCharWorldbookNames.mockReturnValue({
        primary: worldbookName,
        additional: [],
      })

      const result = await WorldbookConnectionService.checkCharacterBinding()

      expect(result).toEqual({
        hasBound: true,
        worldbookName,
        isEdenWorldbook: false,
      })
    })

    it('检查失败时应该返回未绑定状态', async () => {
      mockGetCharWorldbookNames.mockImplementation(() => {
        throw new Error('Test error')
      })

      const result = await WorldbookConnectionService.checkCharacterBinding()

      expect(result).toEqual({
        hasBound: false,
        worldbookName: null,
        isEdenWorldbook: false,
      })
    })
  })

  describe('createAndBindWorldbook', () => {
    it('环境不可用时应该抛出错误', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (globalThis.window as any).createWorldbook

      await expect(WorldbookConnectionService.createAndBindWorldbook()).rejects.toThrow(
        'JS-Slash-Runner 环境不可用'
      )
    })

    it('应该创建新世界书并绑定到当前角色卡', async () => {
      mockGetCharWorldbookNames.mockReturnValue({
        primary: null,
        additional: ['other_worldbook'],
      })
      mockCreateWorldbook.mockResolvedValue(undefined)
      mockRebindCharWorldbooks.mockResolvedValue(undefined)

      const result = await WorldbookConnectionService.createAndBindWorldbook()

      // 验证世界书名称格式
      expect(result).toMatch(
        new RegExp(`^${WORLDBOOK_NAME_PREFIX}_\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}$`)
      )

      // 验证创建世界书
      expect(mockCreateWorldbook).toHaveBeenCalledWith(result, [])

      // 验证绑定世界书
      expect(mockRebindCharWorldbooks).toHaveBeenCalledWith('current', {
        primary: result,
        additional: ['other_worldbook'],
      })
    })

    it('应该缓存创建的世界书名称', async () => {
      mockGetCharWorldbookNames.mockReturnValue({
        primary: null,
        additional: [],
      })
      mockCreateWorldbook.mockResolvedValue(undefined)
      mockRebindCharWorldbooks.mockResolvedValue(undefined)

      const result = await WorldbookConnectionService.createAndBindWorldbook()

      expect(WorldbookConnectionService.getCurrentWorldbookName()).toBe(result)
    })

    it('创建失败时应该抛出错误', async () => {
      mockGetCharWorldbookNames.mockReturnValue({
        primary: null,
        additional: [],
      })
      mockCreateWorldbook.mockRejectedValue(new Error('Create failed'))

      // 错误会被 WorldbookApi.createWorldbook 的 wrapAsync 包装
      await expect(WorldbookConnectionService.createAndBindWorldbook()).rejects.toThrow()
    })
  })

  describe('ensureWorldbookExists', () => {
    it('有缓存时应该返回缓存的世界书名称', async () => {
      const cachedName = 'cached_worldbook'
      mockGetCharWorldbookNames.mockReturnValue({
        primary: cachedName,
        additional: [],
      })
      mockCreateWorldbook.mockResolvedValue(undefined)
      mockRebindCharWorldbooks.mockResolvedValue(undefined)

      // 先创建一个世界书以设置缓存
      await WorldbookConnectionService.createAndBindWorldbook()

      // 清除 mock 调用记录
      vi.clearAllMocks()

      // 再次调用应该使用缓存
      await WorldbookConnectionService.ensureWorldbookExists()

      expect(mockGetCharWorldbookNames).not.toHaveBeenCalled()
      expect(mockCreateWorldbook).not.toHaveBeenCalled()
    })

    it('角色卡已绑定世界书时应该复用该世界书', async () => {
      const existingWorldbook = 'existing_worldbook'
      mockGetCharWorldbookNames.mockReturnValue({
        primary: existingWorldbook,
        additional: [],
      })

      const result = await WorldbookConnectionService.ensureWorldbookExists()

      expect(result).toBe(existingWorldbook)
      expect(mockCreateWorldbook).not.toHaveBeenCalled()
      expect(WorldbookConnectionService.getCurrentWorldbookName()).toBe(existingWorldbook)
    })

    it('角色卡未绑定世界书时应该创建新世界书', async () => {
      mockGetCharWorldbookNames.mockReturnValue({
        primary: null,
        additional: [],
      })
      mockCreateWorldbook.mockResolvedValue(undefined)
      mockRebindCharWorldbooks.mockResolvedValue(undefined)

      const result = await WorldbookConnectionService.ensureWorldbookExists()

      expect(result).toMatch(new RegExp(`^${WORLDBOOK_NAME_PREFIX}_`))
      expect(mockCreateWorldbook).toHaveBeenCalled()
      expect(mockRebindCharWorldbooks).toHaveBeenCalled()
    })
  })

  describe('getCurrentWorldbookName', () => {
    it('无缓存时应该返回 null', () => {
      const result = WorldbookConnectionService.getCurrentWorldbookName()

      expect(result).toBeNull()
    })

    it('有缓存时应该返回缓存的名称', async () => {
      mockGetCharWorldbookNames.mockReturnValue({
        primary: null,
        additional: [],
      })
      mockCreateWorldbook.mockResolvedValue(undefined)
      mockRebindCharWorldbooks.mockResolvedValue(undefined)

      const worldbookName = await WorldbookConnectionService.createAndBindWorldbook()
      const result = WorldbookConnectionService.getCurrentWorldbookName()

      expect(result).toBe(worldbookName)
    })
  })

  describe('clearCache', () => {
    it('应该清除缓存的世界书名称', async () => {
      mockGetCharWorldbookNames.mockReturnValue({
        primary: null,
        additional: [],
      })
      mockCreateWorldbook.mockResolvedValue(undefined)
      mockRebindCharWorldbooks.mockResolvedValue(undefined)

      await WorldbookConnectionService.createAndBindWorldbook()
      expect(WorldbookConnectionService.getCurrentWorldbookName()).not.toBeNull()

      WorldbookConnectionService.clearCache()
      expect(WorldbookConnectionService.getCurrentWorldbookName()).toBeNull()
    })
  })
})
