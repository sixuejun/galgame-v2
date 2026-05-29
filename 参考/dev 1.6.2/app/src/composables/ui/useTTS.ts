/**
 * @file useTTS.ts
 * @description TTS（文本转语音）功能的 Composable
 * @author Eden System Team
 * @created 2025-11-23
 */

import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
import { MiniMaxApi } from '@/services/api/minimaxApi'
import { TTSCacheService } from '@/services/ttsCacheService'
import { logger } from '@/utils/logger'
import { useToast } from './useToast'

/**
 * TTS 功能 Composable
 *
 * 提供文本转语音功能，包括：
 * - 调用 MiniMax TTS API
 * - 缓存管理
 * - 音频播放
 */
export function useTTS() {
  const settingsStore = useSettingsStore()
  const { error: showErrorToast } = useToast()

  // 当前正在播放的文本
  const playingText = ref<string | null>(null)
  // 是否正在加载
  const isLoading = ref(false)

  /**
   * 播放文本语音
   *
   * @param text 要播放的文本
   */
  const playText = async (text: string): Promise<void> => {
    // 检查是否已配置 API Key
    const apiKey = settingsStore.settings.minimaxApiKey
    if (!apiKey) {
      showErrorToast('请先在设置中配置 MiniMax API Key')
      return
    }

    // 如果正在播放相同的文本，停止播放
    if (playingText.value === text) {
      stopPlaying()
      return
    }

    try {
      isLoading.value = true
      playingText.value = text

      // 1. 检查缓存
      const cached = await TTSCacheService.get(text)
      if (cached) {
        logger.info('✅ [TTS] 使用缓存的音频')
        await MiniMaxApi.playAudio(cached.audioData, cached.format, cached.outputFormat)
        return
      }

      // 2. 调用 TTS API
      logger.info('🔊 [TTS] 调用 API 合成语音')
      const model = settingsStore.settings.minimaxModel ?? 'speech-2.6-hd'
      const outputFormat = settingsStore.settings.minimaxOutputFormat ?? 'hex'
      const stream = settingsStore.settings.minimaxStream ?? false
      const requestId = settingsStore.settings.minimaxRequestId
      const voiceId = settingsStore.settings.minimaxVoiceId
      const speed = settingsStore.settings.minimaxSpeed ?? 1.0

      const response = await MiniMaxApi.textToSpeech(apiKey, {
        model,
        text,
        stream,
        output_format: outputFormat,
        request_id: requestId || undefined,
        voice_setting: {
          voice_id: voiceId || undefined,
          speed,
        },
      })

      // 3. 获取音频数据
      const audioData = response.data?.audio
      if (!audioData) {
        throw new Error('API 返回的音频数据为空')
      }

      // 4. 缓存音频
      const format = response.extra_info?.audio_format || 'mp3'
      await TTSCacheService.set(text, audioData, format, outputFormat)

      // 5. 播放音频
      await MiniMaxApi.playAudio(audioData, format, outputFormat)
    } catch (error) {
      logger.error('❌ [TTS] 播放失败:', error)
      showErrorToast('语音播放失败，请检查网络连接和 API 配置')
    } finally {
      isLoading.value = false
      playingText.value = null
    }
  }

  /**
   * 停止播放
   */
  const stopPlaying = (): void => {
    playingText.value = null
    isLoading.value = false
    // 注意：Audio 对象的停止需要在 MiniMaxApi 中处理
    // 这里只是重置状态
  }

  /**
   * 检查文本是否正在播放
   *
   * @param text 文本
   * @returns 是否正在播放
   */
  const isPlaying = (text: string): boolean => {
    return playingText.value === text
  }

  return {
    playingText,
    isLoading,
    playText,
    stopPlaying,
    isPlaying,
  }
}
