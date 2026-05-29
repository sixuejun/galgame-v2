/**
 * @file minimaxApi.ts
 * @description MiniMax 文本转语音（T2A）API 服务
 * @author Eden System Team
 * @created 2025-11-23
 */

import { logger } from '@/utils/logger'
import { wrapAsync, ErrorCategory } from '@/utils/errorHandler'
import type { MiniMaxVoiceModel, MiniMaxOutputFormat } from '@/types'

/**
 * MiniMax T2A API 请求参数
 */
export interface MiniMaxT2ARequest {
  /** 模型版本 */
  model: MiniMaxVoiceModel
  /** 需要合成语音的文本 */
  text: string
  /** 是否流式输出 */
  stream?: boolean
  /** 输出格式 */
  output_format?: MiniMaxOutputFormat
  /** 请求 ID（可选） */
  request_id?: string
  /** 音色设置（可选） */
  voice_setting?: {
    voice_id?: string
    speed?: number
    vol?: number
    pitch?: number
    emotion?: string
  }
  /** 音频设置（可选） */
  audio_setting?: {
    sample_rate?: number
    bitrate?: number
    format?: 'mp3' | 'pcm' | 'flac' | 'wav'
    channel?: number
  }
}

/**
 * MiniMax T2A API 响应
 */
export interface MiniMaxT2AResponse {
  data?: {
    audio?: string
    status?: number
    subtitle_file?: string
  }
  trace_id?: string
  extra_info?: {
    audio_length?: number
    audio_sample_rate?: number
    audio_size?: number
    bitrate?: number
    audio_format?: string
    audio_channel?: number
    invisible_character_ratio?: number
    usage_characters?: number
    word_count?: number
  }
  base_resp?: {
    status_code?: number
    status_msg?: string
  }
}

/**
 * MiniMax API 服务
 * 用于调用 MiniMax 的文本转语音（T2A）API
 */
export class MiniMaxApi {
  private static readonly BASE_URL = 'https://api.minimaxi.com'
  private static readonly T2A_ENDPOINT = '/v1/t2a_v2'

  /**
   * 调用文本转语音 API
   *
   * @param apiKey MiniMax API Key
   * @param request 请求参数
   * @returns 语音合成响应
   * @throws {AppError} 当 API 调用失败时
   */
  static async textToSpeech(
    apiKey: string,
    request: MiniMaxT2ARequest
  ): Promise<MiniMaxT2AResponse> {
    if (!apiKey) {
      throw new Error('MiniMax API Key 未配置')
    }

    return await wrapAsync(
      async () => {
        const url = `${this.BASE_URL}${this.T2A_ENDPOINT}`
        const payload: Record<string, unknown> = {
          model: request.model,
          text: request.text,
          stream: request.stream ?? false,
          output_format: request.output_format ?? 'hex',
        }

        // 添加可选参数
        if (request.request_id) {
          payload.request_id = request.request_id
        }

        if (request.voice_setting) {
          payload.voice_setting = request.voice_setting
        }

        if (request.audio_setting) {
          payload.audio_setting = request.audio_setting
        }

        logger.debug('[MiniMax API] 调用 T2A:', { url, payload: { ...payload, text: '[已隐藏]' } })

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        const data = (await response.json().catch(() => ({}))) as MiniMaxT2AResponse

        if (!response.ok) {
          const errorMsg =
            data?.base_resp?.status_msg ||
            (data as unknown as { message?: string })?.message ||
            (data as unknown as { error?: string })?.error ||
            `语音合成接口调用失败: ${response.status} ${response.statusText}`
          throw new Error(errorMsg)
        }

        logger.debug('[MiniMax API] T2A 响应成功', {
          trace_id: data.trace_id,
          status_code: data.base_resp?.status_code,
        })

        return data
      },
      'MiniMax 语音合成失败',
      ErrorCategory.NETWORK
    )
  }

  /**
   * 将 hex 字符串转换为 Blob
   *
   * @param hexString hex 编码的音频数据
   * @param mimeType MIME 类型
   * @returns Blob 对象
   */
  static hexToBlob(hexString: string, mimeType: string = 'audio/mpeg'): Blob {
    const cleanHex = hexString.startsWith('0x') ? hexString.slice(2) : hexString
    const buffer = new Uint8Array(cleanHex.length / 2)
    for (let i = 0; i < cleanHex.length; i += 2) {
      buffer[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16)
    }
    return new Blob([buffer], { type: mimeType })
  }

  /**
   * 根据音频格式猜测 MIME 类型
   *
   * @param format 音频格式
   * @returns MIME 类型
   */
  static guessMimeType(format?: string): string {
    switch ((format || '').toLowerCase()) {
      case 'wav':
        return 'audio/wav'
      case 'flac':
        return 'audio/flac'
      case 'pcm':
        return 'audio/pcm'
      case 'mp3':
      default:
        return 'audio/mpeg'
    }
  }

  /**
   * 播放音频
   *
   * @param audioData 音频数据（hex 字符串或 URL）
   * @param format 音频格式（仅当 audioData 为 hex 时使用）
   * @param outputFormat 输出格式类型
   * @returns Promise，播放完成后 resolve
   */
  static async playAudio(
    audioData: string,
    format?: string,
    outputFormat: MiniMaxOutputFormat = 'hex'
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio()
      let objectUrl: string | null = null

      audio.onended = () => {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl)
        }
        resolve()
      }

      audio.onerror = error => {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl)
        }
        logger.error('❌ 音频播放失败:', error)
        reject(new Error('音频播放失败'))
      }

      try {
        if (outputFormat === 'url') {
          // URL 格式：直接使用 URL
          audio.src = audioData
        } else {
          // hex 格式：转换为 Blob
          const mimeType = this.guessMimeType(format)
          const blob = this.hexToBlob(audioData, mimeType)
          objectUrl = URL.createObjectURL(blob)
          audio.src = objectUrl
        }

        audio.hidden = false
        audio
          .play()
          .then(() => {
            logger.debug('✅ 音频开始播放')
          })
          .catch(error => {
            // 忽略自动播放错误（浏览器策略）
            logger.warn('⚠️ 音频自动播放被阻止:', error)
            if (objectUrl) {
              URL.revokeObjectURL(objectUrl)
            }
            reject(error)
          })
      } catch (error) {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl)
        }
        logger.error('❌ 处理音频数据失败:', error)
        reject(error)
      }
    })
  }
}
