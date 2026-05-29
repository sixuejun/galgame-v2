// @ts-nocheck
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AIApi } from '../aiApi'
import { logger } from '../../../utils/logger'
import { PermissionError } from '../../../utils/errorHandler'
import type { GenerateOptions } from '../../../types/external-apis'

// Mock logger
vi.mock('../../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('AIApi', () => {
  const mockGenerate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window.generate
    // @ts-expect-error - Mocking global window for testing
    globalThis.window = {
      generate: mockGenerate,
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('isAvailable', () => {
    it('当 window.generate 存在时应该返回 true', () => {
      expect(AIApi.isAvailable()).toBe(true)
    })

    it('当 window.generate 不存在时应该返回 false', () => {
      // @ts-expect-error - Mocking global window for testing
      globalThis.window = {}
      expect(AIApi.isAvailable()).toBe(false)
    })

    it('当 window 不存在时应该返回 false', () => {
      // @ts-expect-error - Mocking global window for testing
      globalThis.window = undefined
      expect(AIApi.isAvailable()).toBe(false)
    })

    it('当 window.generate 不是函数时应该返回 false', () => {
      // @ts-expect-error - Mocking global window for testing
      globalThis.window = {
        generate: 'not a function',
      }
      expect(AIApi.isAvailable()).toBe(false)
    })

    it('当检测过程中抛出异常时应该返回 false', () => {
      // @ts-expect-error - Mocking global window for testing
      globalThis.window = {
        get generate() {
          throw new Error('Access denied')
        },
      }
      expect(AIApi.isAvailable()).toBe(false)
      expect(logger.debug).toHaveBeenCalledWith('AI API 可用性检测失败:', expect.any(Error))
    })
  })

  describe('generate', () => {
    const mockOptions: GenerateOptions = {
      user_input: 'Test input',
      should_stream: false,
    }

    it('应该成功调用 generate API', async () => {
      const mockResponse = 'AI generated response'
      mockGenerate.mockResolvedValue(mockResponse)

      const result = await AIApi.generate(mockOptions)

      expect(mockGenerate).toHaveBeenCalledWith(mockOptions)
      expect(result).toBe(mockResponse)
      expect(logger.debug).toHaveBeenCalledWith('[AI API] 调用 generate:', mockOptions)
      expect(logger.debug).toHaveBeenCalledWith('[AI API] generate 响应成功')
    })

    it('当 API 不可用时应该抛出 PermissionError', async () => {
      // @ts-expect-error - Mocking global window for testing
      globalThis.window = {}

      await expect(AIApi.generate(mockOptions)).rejects.toThrow(PermissionError)
      await expect(AIApi.generate(mockOptions)).rejects.toThrow('generate API 不可用')
    })

    it('当 generate 调用失败时应该抛出错误', async () => {
      const mockError = new Error('Network error')
      mockGenerate.mockRejectedValue(mockError)

      await expect(AIApi.generate(mockOptions)).rejects.toThrow('AI 生成失败')
    })

    it('应该正确传递 generation_id', async () => {
      const optionsWithId: GenerateOptions = {
        ...mockOptions,
        generation_id: 'test-id-123',
      }
      mockGenerate.mockResolvedValue('response')

      await AIApi.generate(optionsWithId)

      expect(mockGenerate).toHaveBeenCalledWith(optionsWithId)
    })

    it('应该正确传递 should_stream 参数', async () => {
      const streamOptions: GenerateOptions = {
        user_input: 'Test',
        should_stream: true,
      }
      mockGenerate.mockResolvedValue('response')

      await AIApi.generate(streamOptions)

      expect(mockGenerate).toHaveBeenCalledWith(streamOptions)
    })
  })

  describe('generateUniqueId', () => {
    it('应该生成唯一的 ID', () => {
      const id1 = AIApi.generateUniqueId()
      const id2 = AIApi.generateUniqueId()

      expect(id1).toMatch(/^gen_\d+_[a-z0-9]+$/)
      expect(id2).toMatch(/^gen_\d+_[a-z0-9]+$/)
      expect(id1).not.toBe(id2)
    })

    it('生成的 ID 应该包含时间戳', () => {
      const beforeTimestamp = Date.now()
      const id = AIApi.generateUniqueId()
      const afterTimestamp = Date.now()

      const timestampMatch = id.match(/^gen_(\d+)_/)
      expect(timestampMatch).toBeTruthy()

      const timestamp = parseInt(timestampMatch![1])
      expect(timestamp).toBeGreaterThanOrEqual(beforeTimestamp)
      expect(timestamp).toBeLessThanOrEqual(afterTimestamp)
    })

    it('生成的 ID 应该包含随机字符串', () => {
      const id = AIApi.generateUniqueId()
      const randomPart = id.split('_')[2]

      expect(randomPart).toBeTruthy()
      expect(randomPart.length).toBeGreaterThan(0)
      expect(randomPart).toMatch(/^[a-z0-9]+$/)
    })
  })
})
