/**
 * @file stChatu8ImageService.test.ts
 * @description ST-ChatU8 图片生成服务单元测试
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  isStChatu8Available,
  generateImageWithStChatu8,
  base64ToDataUrl,
  ImageGenerationError,
  ImageGenerationErrorType,
} from '../stChatu8ImageService'

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

describe('stChatu8ImageService', () => {
  let mockEventOn: any
  let mockEventEmit: any
  let mockEventRemoveListener: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock window event functions
    mockEventOn = vi.fn()
    mockEventEmit = vi.fn()
    mockEventRemoveListener = vi.fn()

    Object.defineProperty(window, 'eventOn', {
      writable: true,
      configurable: true,
      value: mockEventOn,
    })
    Object.defineProperty(window, 'eventEmit', {
      writable: true,
      configurable: true,
      value: mockEventEmit,
    })
    Object.defineProperty(window, 'eventRemoveListener', {
      writable: true,
      configurable: true,
      value: mockEventRemoveListener,
    })
  })

  afterEach(() => {
    // Clean up
    delete (window as any).eventOn
    delete (window as any).eventEmit
    delete (window as any).eventRemoveListener
  })

  describe('isStChatu8Available', () => {
    it('应该在所有事件 API 可用时返回 true', () => {
      expect(isStChatu8Available()).toBe(true)
    })

    it('应该在 eventOn 不可用时返回 false', () => {
      delete (window as any).eventOn
      expect(isStChatu8Available()).toBe(false)
    })

    it('应该在 eventEmit 不可用时返回 false', () => {
      delete (window as any).eventEmit
      expect(isStChatu8Available()).toBe(false)
    })

    it('应该在 eventRemoveListener 不可用时返回 false', () => {
      delete (window as any).eventRemoveListener
      expect(isStChatu8Available()).toBe(false)
    })
  })

  describe('base64ToDataUrl', () => {
    it('应该将 base64 数据转换为 data URL', () => {
      const base64 =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      const result = base64ToDataUrl(base64)
      expect(result).toBe(`data:image/png;base64,${base64}`)
    })

    it('应该支持自定义 MIME 类型', () => {
      const base64 = 'test-base64-data'
      const result = base64ToDataUrl(base64, 'image/jpeg')
      expect(result).toBe('data:image/jpeg;base64,test-base64-data')
    })

    it('应该在已经是 data URL 时直接返回', () => {
      const dataUrl = 'data:image/png;base64,test-data'
      const result = base64ToDataUrl(dataUrl)
      expect(result).toBe(dataUrl)
    })
  })

  describe('ImageGenerationError', () => {
    it('应该创建错误实例', () => {
      const error = new ImageGenerationError('Test error', ImageGenerationErrorType.TIMEOUT)
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(ImageGenerationError)
      expect(error.message).toBe('Test error')
      expect(error.type).toBe(ImageGenerationErrorType.TIMEOUT)
      expect(error.name).toBe('ImageGenerationError')
    })

    it('应该返回 API 不可用的友好消息', () => {
      const error = new ImageGenerationError('Test', ImageGenerationErrorType.API_UNAVAILABLE)
      expect(error.getUserFriendlyMessage()).toContain('ST-ChatU8 服务不可用')
    })

    it('应该返回超时的友好消息', () => {
      const error = new ImageGenerationError('Test', ImageGenerationErrorType.TIMEOUT)
      expect(error.getUserFriendlyMessage()).toContain('图片生成超时')
    })

    it('应该返回生成失败的友好消息', () => {
      const error = new ImageGenerationError('Test', ImageGenerationErrorType.GENERATION_FAILED)
      expect(error.getUserFriendlyMessage()).toContain('图片生成失败')
    })

    it('应该返回网络错误的友好消息', () => {
      const error = new ImageGenerationError('Test', ImageGenerationErrorType.NETWORK_ERROR)
      expect(error.getUserFriendlyMessage()).toContain('网络错误')
    })

    it('应该返回未知错误的友好消息', () => {
      const error = new ImageGenerationError('Custom error', ImageGenerationErrorType.UNKNOWN)
      expect(error.getUserFriendlyMessage()).toContain('Custom error')
    })
  })

  describe('generateImageWithStChatu8', () => {
    it('应该在 API 不可用时抛出错误', async () => {
      delete (window as any).eventOn

      await expect(generateImageWithStChatu8('test prompt')).rejects.toThrow(ImageGenerationError)
      await expect(generateImageWithStChatu8('test prompt')).rejects.toMatchObject({
        type: ImageGenerationErrorType.API_UNAVAILABLE,
      })
    })

    it('应该成功生成图片', async () => {
      const testImageData = 'data:image/png;base64,test-image-data'

      // Mock event listener to simulate successful response
      mockEventOn.mockImplementation((event: string, callback: any) => {
        if (event === 'generate-image-response') {
          // Simulate async response
          setTimeout(() => {
            callback({
              id: expect.any(String),
              success: true,
              imageData: testImageData,
            })
          }, 10)
        }
      })

      // Capture the request ID
      let capturedRequestId: string | null = null
      mockEventEmit.mockImplementation((event: string, data: any) => {
        if (event === 'generate-image-request') {
          capturedRequestId = data.id
          // Trigger response with matching ID
          const listener = mockEventOn.mock.calls[0][1]
          setTimeout(() => {
            listener({
              id: capturedRequestId,
              success: true,
              imageData: testImageData,
            })
          }, 10)
        }
      })

      const result = await generateImageWithStChatu8('test prompt')

      expect(result).toBe(testImageData)
      expect(mockEventOn).toHaveBeenCalledWith('generate-image-response', expect.any(Function))
      expect(mockEventEmit).toHaveBeenCalledWith('generate-image-request', {
        id: expect.any(String),
        prompt: 'test prompt',
        width: null,
        height: null,
      })
      expect(mockEventRemoveListener).toHaveBeenCalled()
    })

    it('应该在超时时抛出错误', async () => {
      // Don't trigger any response
      mockEventOn.mockImplementation(() => {})

      await expect(generateImageWithStChatu8('test prompt', 100)).rejects.toThrow(
        ImageGenerationError
      )
      await expect(generateImageWithStChatu8('test prompt', 100)).rejects.toMatchObject({
        type: ImageGenerationErrorType.TIMEOUT,
      })
    })

    it('应该在生成失败时抛出错误', async () => {
      let savedListener: any = null
      mockEventOn.mockImplementation((event: string, callback: any) => {
        if (event === 'generate-image-response') {
          savedListener = callback
        }
      })

      mockEventEmit.mockImplementation((event: string, data: any) => {
        if (event === 'generate-image-request' && savedListener) {
          setTimeout(() => {
            savedListener({
              id: data.id,
              success: false,
              error: 'Generation failed',
            })
          }, 10)
        }
      })

      await expect(generateImageWithStChatu8('test prompt')).rejects.toThrow(ImageGenerationError)
      await expect(generateImageWithStChatu8('test prompt')).rejects.toMatchObject({
        type: ImageGenerationErrorType.GENERATION_FAILED,
      })
    })

    it('应该忽略不匹配的响应 ID', async () => {
      mockEventEmit.mockImplementation((event: string, data: any) => {
        if (event === 'generate-image-request') {
          const listener = mockEventOn.mock.calls[0][1]
          // Send response with wrong ID first
          setTimeout(() => {
            listener({
              id: 'wrong-id',
              success: true,
              imageData: 'wrong-data',
            })
          }, 10)
          // Send correct response later
          setTimeout(() => {
            listener({
              id: data.id,
              success: true,
              imageData: 'correct-data',
            })
          }, 20)
        }
      })

      const result = await generateImageWithStChatu8('test prompt')
      expect(result).toBe('correct-data')
    })

    it('应该在发送请求时出错时抛出错误', async () => {
      mockEventEmit.mockImplementation(() => {
        throw new Error('Emit failed')
      })

      await expect(generateImageWithStChatu8('test prompt')).rejects.toThrow(ImageGenerationError)
      await expect(generateImageWithStChatu8('test prompt')).rejects.toMatchObject({
        type: ImageGenerationErrorType.NETWORK_ERROR,
      })
    })

    it('应该在处理响应时出错时抛出错误', async () => {
      let savedListener: any = null
      mockEventOn.mockImplementation((event: string, callback: any) => {
        if (event === 'generate-image-response') {
          savedListener = callback
        }
      })

      mockEventEmit.mockImplementation((event: string) => {
        if (event === 'generate-image-request' && savedListener) {
          setTimeout(() => {
            // Send invalid response that will cause error
            savedListener(null)
          }, 10)
        }
      })

      await expect(generateImageWithStChatu8('test prompt')).rejects.toThrow(ImageGenerationError)
      await expect(generateImageWithStChatu8('test prompt')).rejects.toMatchObject({
        type: ImageGenerationErrorType.UNKNOWN,
      })
    })
  })
})
