/**
 * @file minimaxApi.test.ts
 * @description MiniMaxApi 单元测试
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MiniMaxApi } from '../minimaxApi'
import type { MiniMaxT2ARequest, MiniMaxT2AResponse } from '../minimaxApi'

// Mock dependencies
vi.mock('@/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

vi.mock('@/utils/errorHandler', () => ({
  wrapAsync: vi.fn((fn: () => Promise<any>) => fn()),
  ErrorCategory: {
    NETWORK: 'NETWORK',
  },
}))

describe('MiniMaxApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.fetch = vi.fn()
  })

  describe('textToSpeech', () => {
    it('应该在没有 API Key 时抛出错误', async () => {
      await expect(MiniMaxApi.textToSpeech('', {} as MiniMaxT2ARequest)).rejects.toThrow(
        'MiniMax API Key 未配置'
      )
    })

    it('应该成功调用 TTS API', async () => {
      const mockResponse: MiniMaxT2AResponse = {
        data: {
          audio: '48656c6c6f',
          status: 1,
        },
        trace_id: 'test-trace-id',
        extra_info: {
          audio_format: 'mp3',
        },
      }

      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const request: MiniMaxT2ARequest = {
        model: 'speech-2.6-hd',
        text: '测试文本',
      }

      const result = await MiniMaxApi.textToSpeech('test-api-key', request)

      expect(result).toEqual(mockResponse)
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://api.minimaxi.com/v1/t2a_v2',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: 'Bearer test-api-key',
            'Content-Type': 'application/json',
          },
        })
      )
    })

    it('应该正确处理可选参数', async () => {
      const mockResponse: MiniMaxT2AResponse = {
        data: {
          audio: '48656c6c6f',
        },
      }

      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const request: MiniMaxT2ARequest = {
        model: 'speech-2.6-hd',
        text: '测试文本',
        stream: true,
        output_format: 'url',
        request_id: 'test-request-id',
        voice_setting: {
          voice_id: 'test-voice',
          speed: 1.2,
        },
        audio_setting: {
          sample_rate: 24000,
        },
      }

      await MiniMaxApi.textToSpeech('test-api-key', request)

      const callArgs = vi.mocked(globalThis.fetch).mock.calls[0]
      const body = JSON.parse(callArgs[1]?.body as string)

      expect(body).toMatchObject({
        model: 'speech-2.6-hd',
        text: '测试文本',
        stream: true,
        output_format: 'url',
        request_id: 'test-request-id',
        voice_setting: {
          voice_id: 'test-voice',
          speed: 1.2,
        },
        audio_setting: {
          sample_rate: 24000,
        },
      })
    })

    it('应该处理 API 错误响应', async () => {
      const mockErrorResponse = {
        base_resp: {
          status_code: 400,
          status_msg: 'Invalid request',
        },
      }

      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => mockErrorResponse,
      } as Response)

      const request: MiniMaxT2ARequest = {
        model: 'speech-2.6-hd',
        text: '测试文本',
      }

      await expect(MiniMaxApi.textToSpeech('test-api-key', request)).rejects.toThrow(
        'Invalid request'
      )
    })

    it('应该处理网络错误', async () => {
      vi.mocked(globalThis.fetch).mockRejectedValue(new Error('Network error'))

      const request: MiniMaxT2ARequest = {
        model: 'speech-2.6-hd',
        text: '测试文本',
      }

      await expect(MiniMaxApi.textToSpeech('test-api-key', request)).rejects.toThrow()
    })

    it('应该使用默认值', async () => {
      const mockResponse: MiniMaxT2AResponse = {
        data: {
          audio: '48656c6c6f',
        },
      }

      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const request: MiniMaxT2ARequest = {
        model: 'speech-2.6-hd',
        text: '测试文本',
      }

      await MiniMaxApi.textToSpeech('test-api-key', request)

      const callArgs = vi.mocked(globalThis.fetch).mock.calls[0]
      const body = JSON.parse(callArgs[1]?.body as string)

      expect(body.stream).toBe(false)
      expect(body.output_format).toBe('hex')
    })
  })

  describe('hexToBlob', () => {
    it('应该正确转换 hex 字符串为 Blob', () => {
      const hexString = '48656c6c6f' // "Hello" in hex
      const blob = MiniMaxApi.hexToBlob(hexString)

      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('audio/mpeg')
      expect(blob.size).toBe(5)
    })

    it('应该处理带 0x 前缀的 hex 字符串', () => {
      const hexString = '0x48656c6c6f'
      const blob = MiniMaxApi.hexToBlob(hexString)

      expect(blob.size).toBe(5)
    })

    it('应该支持自定义 MIME 类型', () => {
      const hexString = '48656c6c6f'
      const blob = MiniMaxApi.hexToBlob(hexString, 'audio/wav')

      expect(blob.type).toBe('audio/wav')
    })
  })

  describe('guessMimeType', () => {
    it('应该正确识别 mp3 格式', () => {
      expect(MiniMaxApi.guessMimeType('mp3')).toBe('audio/mpeg')
    })

    it('应该正确识别 wav 格式', () => {
      expect(MiniMaxApi.guessMimeType('wav')).toBe('audio/wav')
    })

    it('应该正确识别 flac 格式', () => {
      expect(MiniMaxApi.guessMimeType('flac')).toBe('audio/flac')
    })

    it('应该正确识别 pcm 格式', () => {
      expect(MiniMaxApi.guessMimeType('pcm')).toBe('audio/pcm')
    })

    it('应该对未知格式返回默认值', () => {
      expect(MiniMaxApi.guessMimeType('unknown')).toBe('audio/mpeg')
      expect(MiniMaxApi.guessMimeType()).toBe('audio/mpeg')
    })

    it('应该不区分大小写', () => {
      expect(MiniMaxApi.guessMimeType('MP3')).toBe('audio/mpeg')
      expect(MiniMaxApi.guessMimeType('WAV')).toBe('audio/wav')
    })
  })

  describe('playAudio', () => {
    let mockAudio: any

    beforeEach(() => {
      mockAudio = {
        src: '',
        hidden: true,
        play: vi.fn().mockResolvedValue(undefined),
        onended: null as any,
        onerror: null as any,
      }

      // Mock Audio constructor
      ;(globalThis as any).Audio = class {
        src = ''
        hidden = true
        play = mockAudio.play
        onended = null as any
        onerror = null as any

        constructor() {
          // Copy properties from mockAudio
          Object.assign(this, mockAudio)
        }
      }

      // Mock URL.createObjectURL and revokeObjectURL
      globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
      globalThis.URL.revokeObjectURL = vi.fn()
    })

    it('应该播放 hex 格式的音频', async () => {
      const hexData = '48656c6c6f'
      let audioInstance: any

        // Intercept Audio constructor to get instance
      ;(globalThis as any).Audio = class {
        src = ''
        hidden = true
        play = mockAudio.play
        onended = null as any
        onerror = null as any

        constructor() {
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          const instance = this
          Object.assign(instance, mockAudio)
          audioInstance = instance
        }
      }

      const playPromise = MiniMaxApi.playAudio(hexData, 'mp3', 'hex')

      // Trigger onended
      setTimeout(() => {
        if (audioInstance?.onended) {
          audioInstance.onended()
        }
      }, 10)

      await playPromise

      expect(globalThis.URL.createObjectURL).toHaveBeenCalled()
      expect(mockAudio.play).toHaveBeenCalled()
      expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    })

    it('应该播放 URL 格式的音频', async () => {
      const audioUrl = 'https://example.com/audio.mp3'
      let audioInstance: any

        // Intercept Audio constructor to get instance
      ;(globalThis as any).Audio = class {
        src = ''
        hidden = true
        play = mockAudio.play
        onended = null as any
        onerror = null as any

        constructor() {
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          const instance = this
          Object.assign(instance, mockAudio)
          audioInstance = instance
        }
      }

      const playPromise = MiniMaxApi.playAudio(audioUrl, undefined, 'url')

      // Trigger onended
      setTimeout(() => {
        if (audioInstance?.onended) {
          audioInstance.onended()
        }
      }, 10)

      await playPromise

      expect(audioInstance.src).toBe(audioUrl)
      expect(globalThis.URL.createObjectURL).not.toHaveBeenCalled()
      expect(mockAudio.play).toHaveBeenCalled()
    })

    it('应该处理播放错误', async () => {
      const hexData = '48656c6c6f'
      let audioInstance: any

        // Intercept Audio constructor to get instance
      ;(globalThis as any).Audio = class {
        src = ''
        hidden = true
        play = mockAudio.play
        onended = null as any
        onerror = null as any

        constructor() {
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          const instance = this
          Object.assign(instance, mockAudio)
          audioInstance = instance
        }
      }

      const playPromise = MiniMaxApi.playAudio(hexData, 'mp3', 'hex')

      // Trigger onerror
      setTimeout(() => {
        if (audioInstance?.onerror) {
          audioInstance.onerror(new Error('Playback error'))
        }
      }, 10)

      await expect(playPromise).rejects.toThrow('音频播放失败')
      expect(globalThis.URL.revokeObjectURL).toHaveBeenCalled()
    })

    it('应该处理自动播放被阻止的情况', async () => {
      mockAudio.play = vi.fn().mockRejectedValue(new Error('Autoplay blocked'))

      const hexData = '48656c6c6f'

      await expect(MiniMaxApi.playAudio(hexData, 'mp3', 'hex')).rejects.toThrow('Autoplay blocked')
      expect(globalThis.URL.revokeObjectURL).toHaveBeenCalled()
    })
  })
})
