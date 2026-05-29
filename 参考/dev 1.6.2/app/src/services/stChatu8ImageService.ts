/**
 * @file stChatu8ImageService.ts
 * @description ST-ChatU8 图片生成服务适配器 - 通过事件系统调用外部应用生成图片
 * @author Eden System Team
 * @created 2025-11-09
 */

import type { StChatu8ImageRequest, StChatu8ImageResponse } from '@/types/external-apis'
import { logger } from '@/utils/logger'

/**
 * ST-ChatU8 事件类型常量
 */
const EventType = {
  /** 图片生成请求事件 */
  GENERATE_IMAGE_REQUEST: 'generate-image-request',
  /** 图片生成响应事件 */
  GENERATE_IMAGE_RESPONSE: 'generate-image-response',
} as const

/**
 * 生成唯一的请求 ID
 * @returns 唯一的请求 ID（基于时间戳和随机数）
 */
function generateRequestId(): string {
  return `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * 检查 ST-ChatU8 事件 API 是否可用
 * @returns 如果事件 API 可用返回 true，否则返回 false
 */
export function isStChatu8Available(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.eventOn === 'function' &&
    typeof window.eventEmit === 'function' &&
    typeof window.eventRemoveListener === 'function'
  )
}

/**
 * 图片生成错误类型
 */
export enum ImageGenerationErrorType {
  /** API 不可用 */
  API_UNAVAILABLE = 'API_UNAVAILABLE',
  /** 超时 */
  TIMEOUT = 'TIMEOUT',
  /** 生成失败 */
  GENERATION_FAILED = 'GENERATION_FAILED',
  /** 网络错误 */
  NETWORK_ERROR = 'NETWORK_ERROR',
  /** 未知错误 */
  UNKNOWN = 'UNKNOWN',
}

/**
 * 图片生成错误类
 */
export class ImageGenerationError extends Error {
  constructor(
    message: string,
    public type: ImageGenerationErrorType,
    public originalError?: unknown
  ) {
    super(message)
    this.name = 'ImageGenerationError'
  }

  /**
   * 获取用户友好的错误消息
   */
  getUserFriendlyMessage(): string {
    switch (this.type) {
      case ImageGenerationErrorType.API_UNAVAILABLE:
        return '⚠️ ST-ChatU8 服务不可用，请确保已安装并启用 st-chatu8 扩展'
      case ImageGenerationErrorType.TIMEOUT:
        return '⏱️ 图片生成超时，请检查网络连接或稍后重试'
      case ImageGenerationErrorType.GENERATION_FAILED:
        return '❌ 图片生成失败，请检查提示词或稍后重试'
      case ImageGenerationErrorType.NETWORK_ERROR:
        return '🌐 网络错误，请检查网络连接'
      default:
        return `⚠️ 图片生成失败: ${this.message}`
    }
  }
}

/**
 * 通过 ST-ChatU8 事件系统生成图片
 * @param prompt 图片描述提示词（英文）
 * @param timeout 超时时间（毫秒），默认 30 秒
 * @returns Promise，resolve 时返回 base64 图片数据，reject 时返回 ImageGenerationError
 * @throws ImageGenerationError 如果 ST-ChatU8 API 不可用、超时或生成失败
 */
export async function generateImageWithStChatu8(
  prompt: string,
  timeout: number = 30000
): Promise<string> {
  // 检查 API 是否可用
  if (!isStChatu8Available()) {
    throw new ImageGenerationError(
      'ST-ChatU8 事件 API 不可用',
      ImageGenerationErrorType.API_UNAVAILABLE
    )
  }

  // 生成唯一请求 ID
  const requestId = generateRequestId()

  return new Promise<string>((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let responseListener: ((data: unknown) => void) | null = null

    // 清理函数
    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      if (responseListener && window.eventRemoveListener) {
        window.eventRemoveListener(EventType.GENERATE_IMAGE_RESPONSE, responseListener)
        responseListener = null
      }
    }

    // 设置超时
    timeoutId = setTimeout(() => {
      cleanup()
      reject(
        new ImageGenerationError(
          `图片生成超时（等待时间: ${timeout / 1000}秒）`,
          ImageGenerationErrorType.TIMEOUT
        )
      )
    }, timeout)

    // 注册响应监听器
    responseListener = (data: unknown) => {
      try {
        logger.debug('📥 [ST-ChatU8] 收到图片生成响应:', data)
        const response = data as StChatu8ImageResponse

        // 检查是否是当前请求的响应
        if (response.id !== requestId) {
          logger.debug(
            `⏭️ [ST-ChatU8] 响应 ID 不匹配，跳过 (期望: ${requestId}, 实际: ${response.id})`
          )
          return
        }

        // 清理资源
        cleanup()

        // 处理响应
        if (response.success && response.imageData) {
          logger.info('✅ [ST-ChatU8] 图片生成成功')
          resolve(response.imageData)
        } else {
          logger.error('❌ [ST-ChatU8] 图片生成失败:', response.error)
          reject(
            new ImageGenerationError(
              response.error || '图片生成失败，未返回错误信息',
              ImageGenerationErrorType.GENERATION_FAILED
            )
          )
        }
      } catch (error) {
        logger.error('❌ [ST-ChatU8] 处理响应时出错:', error)
        cleanup()
        reject(
          new ImageGenerationError(
            `处理响应时出错: ${error instanceof Error ? error.message : String(error)}`,
            ImageGenerationErrorType.UNKNOWN,
            error
          )
        )
      }
    }

    // 注册监听器
    if (window.eventOn) {
      window.eventOn(EventType.GENERATE_IMAGE_RESPONSE, responseListener)
    }

    // 发送请求
    try {
      const request: StChatu8ImageRequest = {
        id: requestId,
        prompt,
        width: null,
        height: null,
      }

      if (window.eventEmit) {
        window.eventEmit(EventType.GENERATE_IMAGE_REQUEST, request)
        logger.debug('📤 [ST-ChatU8] 发送图片生成请求:', request)
      }
    } catch (error) {
      cleanup()
      reject(
        new ImageGenerationError(
          `发送请求时出错: ${error instanceof Error ? error.message : String(error)}`,
          ImageGenerationErrorType.NETWORK_ERROR,
          error
        )
      )
    }
  })
}

/**
 * 将 base64 图片数据转换为 data URL
 * @param base64Data base64 编码的图片数据
 * @param mimeType MIME 类型，默认为 'image/png'
 * @returns data URL 格式的图片数据
 */
export function base64ToDataUrl(base64Data: string, mimeType: string = 'image/png'): string {
  // 如果已经是 data URL 格式，直接返回
  if (base64Data.startsWith('data:')) {
    return base64Data
  }

  // 转换为 data URL
  return `data:${mimeType};base64,${base64Data}`
}
