/**
 * @file useTTS.test.ts
 * @description useTTS Composable 单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTTS } from '../useTTS'
import { useSettingsStore } from '@/stores/settingsStore'
import { MiniMaxApi } from '@/services/api/minimaxApi'
import { TTSCacheService } from '@/services/ttsCacheService'
import type { TTSCacheRecord } from '@/utils/indexedDB'

// Mock dependencies
vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

vi.mock('@/services/api/minimaxApi', () => ({
  MiniMaxApi: {
    textToSpeech: vi.fn(),
    playAudio: vi.fn(),
  },
}))

vi.mock('@/services/ttsCacheService', () => ({
  TTSCacheService: {
    get: vi.fn(),
    set: vi.fn(),
  },
}))

vi.mock('./useToast', () => ({
  useToast: () => ({
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  }),
}))

describe('useTTS', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('初始状态', () => {
    it('应该初始化为未播放状态', () => {
      const { playingText, isLoading } = useTTS()

      expect(playingText.value).toBeNull()
      expect(isLoading.value).toBe(false)
    })
  })

  describe('playText', () => {
    it('应该在没有 API Key 时显示错误提示', async () => {
      const settingsStore = useSettingsStore()
      settingsStore.settings.minimaxApiKey = ''

      const { playText } = useTTS()
      await playText('测试文本')

      expect(MiniMaxApi.textToSpeech).not.toHaveBeenCalled()
    })

    it('应该在播放相同文本时停止播放', async () => {
      const settingsStore = useSettingsStore()
      settingsStore.settings.minimaxApiKey = 'test-api-key'

      const { playText, playingText } = useTTS()
      playingText.value = '测试文本'

      await playText('测试文本')

      expect(playingText.value).toBeNull()
      expect(MiniMaxApi.textToSpeech).not.toHaveBeenCalled()
    })

    it('应该使用缓存的音频', async () => {
      const settingsStore = useSettingsStore()
      settingsStore.settings.minimaxApiKey = 'test-api-key'

      const mockCached: TTSCacheRecord = {
        characterName: 'test-character',
        key: 'test-key',
        audioData: 'cached-audio-data',
        format: 'mp3',
        outputFormat: 'hex',
        timestamp: Date.now(),
      }

      vi.mocked(TTSCacheService.get).mockResolvedValue(mockCached)

      const { playText } = useTTS()
      await playText('测试文本')

      expect(TTSCacheService.get).toHaveBeenCalledWith('测试文本')
      expect(MiniMaxApi.playAudio).toHaveBeenCalledWith('cached-audio-data', 'mp3', 'hex')
      expect(MiniMaxApi.textToSpeech).not.toHaveBeenCalled()
    })

    it('应该调用 API 合成语音并缓存', async () => {
      const settingsStore = useSettingsStore()
      settingsStore.settings.minimaxApiKey = 'test-api-key'
      settingsStore.settings.minimaxModel = 'speech-2.6-hd'
      settingsStore.settings.minimaxOutputFormat = 'hex'
      settingsStore.settings.minimaxSpeed = 1.0

      vi.mocked(TTSCacheService.get).mockResolvedValue(null)
      vi.mocked(MiniMaxApi.textToSpeech).mockResolvedValue({
        data: {
          audio: 'new-audio-data',
        },
        extra_info: {
          audio_format: 'mp3',
        },
      })

      const { playText } = useTTS()
      await playText('测试文本')

      expect(MiniMaxApi.textToSpeech).toHaveBeenCalledWith('test-api-key', {
        model: 'speech-2.6-hd',
        text: '测试文本',
        stream: false,
        output_format: 'hex',
        request_id: undefined,
        voice_setting: {
          voice_id: undefined,
          speed: 1.0,
        },
      })
      expect(TTSCacheService.set).toHaveBeenCalledWith('测试文本', 'new-audio-data', 'mp3', 'hex')
      expect(MiniMaxApi.playAudio).toHaveBeenCalledWith('new-audio-data', 'mp3', 'hex')
    })

    it('应该在 API 返回空音频数据时抛出错误', async () => {
      const settingsStore = useSettingsStore()
      settingsStore.settings.minimaxApiKey = 'test-api-key'

      vi.mocked(TTSCacheService.get).mockResolvedValue(null)
      vi.mocked(MiniMaxApi.textToSpeech).mockResolvedValue({
        data: {},
      })

      const { playText, isLoading } = useTTS()
      await playText('测试文本')

      expect(isLoading.value).toBe(false)
      expect(MiniMaxApi.playAudio).not.toHaveBeenCalled()
    })

    it('应该处理 API 调用失败', async () => {
      const settingsStore = useSettingsStore()
      settingsStore.settings.minimaxApiKey = 'test-api-key'

      vi.mocked(TTSCacheService.get).mockResolvedValue(null)
      vi.mocked(MiniMaxApi.textToSpeech).mockRejectedValue(new Error('API Error'))

      const { playText, isLoading } = useTTS()
      await playText('测试文本')

      expect(isLoading.value).toBe(false)
    })

    it('应该使用默认值当设置未配置时', async () => {
      const settingsStore = useSettingsStore()
      settingsStore.settings.minimaxApiKey = 'test-api-key'
      settingsStore.settings.minimaxModel = undefined
      settingsStore.settings.minimaxOutputFormat = undefined
      settingsStore.settings.minimaxSpeed = undefined

      vi.mocked(TTSCacheService.get).mockResolvedValue(null)
      vi.mocked(MiniMaxApi.textToSpeech).mockResolvedValue({
        data: {
          audio: 'audio-data',
        },
      })

      const { playText } = useTTS()
      await playText('测试文本')

      expect(MiniMaxApi.textToSpeech).toHaveBeenCalledWith('test-api-key', {
        model: 'speech-2.6-hd',
        text: '测试文本',
        stream: false,
        output_format: 'hex',
        request_id: undefined,
        voice_setting: {
          voice_id: undefined,
          speed: 1.0,
        },
      })
    })
  })

  describe('stopPlaying', () => {
    it('应该重置播放状态', () => {
      const { stopPlaying, playingText, isLoading } = useTTS()
      playingText.value = '测试文本'
      isLoading.value = true

      stopPlaying()

      expect(playingText.value).toBeNull()
      expect(isLoading.value).toBe(false)
    })
  })

  describe('isPlaying', () => {
    it('应该正确判断文本是否正在播放', () => {
      const { isPlaying, playingText } = useTTS()

      expect(isPlaying('测试文本')).toBe(false)

      playingText.value = '测试文本'
      expect(isPlaying('测试文本')).toBe(true)
      expect(isPlaying('其他文本')).toBe(false)
    })
  })
})
