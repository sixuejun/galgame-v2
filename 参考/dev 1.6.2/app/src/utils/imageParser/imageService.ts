/**
 * 图片简写格式解析工具 - 图片服务集成
 *
 * 负责与外部图片生成服务（pollinations.ai, st-chatu8）集成
 */

import type { ImageGenerationService } from '@/types/common'
import {
  generateImageWithStChatu8,
  base64ToDataUrl,
  ImageGenerationError,
} from '@/services/stChatu8ImageService'
import { ImageCacheService } from '@/services/imageCacheService'
import { parseContentBlocks } from './parser'
import { contentBlockToHTML, contentBlockToHTMLWithPlaceholder } from './renderer'
import { useToast } from '@/composables/ui/useToast'
import { logger } from '@/utils/logger'

/**
 * 将图片描述转换为 pollinations.ai URL
 *
 * @param description - 图片英文描述
 * @returns pollinations.ai 图片 URL
 */
function descriptionToPollinationsUrl(description: string): string {
  // 对描述进行 URL 编码
  const encodedDescription = encodeURIComponent(description.trim())
  return `https://image.pollinations.ai/prompt/${encodedDescription}`
}

/**
 * 处理图片 URL（根据服务类型生成实际的图片 URL）
 *
 * 集成缓存机制：
 * 1. 对于描述文本，先检查缓存
 * 2. 缓存命中则直接返回
 * 3. 缓存未命中则调用生成服务
 * 4. 生成成功后保存到缓存（仅对 st-chatu8 服务）
 *
 * @param imageUrl - 原始图片 URL 或描述
 * @param service - 图片生成服务类型
 * @param timeout - ST-ChatU8 超时时间（毫秒），仅在使用 st-chatu8 服务时有效
 * @returns Promise，resolve 时返回实际的图片 URL（可能是 http URL 或 data URL）
 */
async function processImageUrl(
  imageUrl: string,
  service: ImageGenerationService,
  timeout?: number
): Promise<string> {
  // 如果已经是完整的 URL（http/https/data），直接返回
  if (imageUrl.match(/^(https?:\/\/|data:)/i)) {
    return imageUrl
  }

  // 否则视为描述，根据服务类型处理
  if (service === 'pollinations') {
    // pollinations.ai：将描述转换为 URL
    // 注意：pollinations.ai 的 URL 是确定性的，不需要缓存
    return descriptionToPollinationsUrl(imageUrl)
  } else if (service === 'st-chatu8') {
    // st-chatu8：调用事件 API 生成图片
    // 1. 先检查缓存
    const cachedImage = await ImageCacheService.getImage(imageUrl)
    if (cachedImage) {
      logger.info(`✅ [ImageService] 使用缓存图片: ${imageUrl.substring(0, 50)}...`)
      return cachedImage
    }

    // 2. 缓存未命中，调用生成服务
    try {
      logger.info(`🎨 [ImageService] 生成新图片: ${imageUrl.substring(0, 50)}...`)
      const base64Data = await generateImageWithStChatu8(imageUrl, timeout)
      const dataUrl = base64ToDataUrl(base64Data)

      // 3. 保存到缓存（异步，不等待完成）
      ImageCacheService.setImage(imageUrl, dataUrl).catch(error => {
        logger.error('❌ [ImageService] 保存缓存失败:', error)
        // 保存失败不影响图片返回
      })

      return dataUrl
    } catch (error) {
      console.error('❌ ST-ChatU8 图片生成失败:', error)
      // 失败时返回占位符或错误提示
      throw error
    }
  }

  // 默认返回原始 URL
  return imageUrl
}

/**
 * 异步解析并转换内容中的所有图片简写格式
 *
 * @param content - 原始内容字符串
 * @param service - 图片生成服务类型（默认为 'pollinations'）
 * @param timeout - ST-ChatU8 超时时间（毫秒），仅在使用 st-chatu8 服务时有效
 * @returns Promise，resolve 时返回转换后的 HTML 字符串
 *
 * @example
 * ```typescript
 * const content = `
 * 普通文本
 * [img:a beautiful sunset over the ocean]
 * 图片上的文字
 * `
 * const html = await parseAndConvertImageShorthandAsync(content, 'pollinations')
 * ```
 */
export async function parseAndConvertImageShorthandAsync(
  content: string,
  service: ImageGenerationService = 'pollinations',
  timeout?: number
): Promise<string> {
  if (!content) {
    return ''
  }

  const blocks = parseContentBlocks(content)

  // 如果没有任何区块，返回原始内容
  if (blocks.length === 0) {
    return content
  }

  // 处理所有图片区块的 URL（异步）
  const processedBlocks = await Promise.all(
    blocks.map(async block => {
      if (block.type === 'image' && block.imageUrl) {
        try {
          const processedUrl = await processImageUrl(block.imageUrl, service, timeout)
          return {
            ...block,
            imageUrl: processedUrl,
          }
        } catch (error) {
          console.error(`❌ 处理图片 URL 失败: ${block.imageUrl}`, error)
          // 失败时返回错误提示
          let errorMessage = '⚠️ 图片生成失败'
          if (error instanceof ImageGenerationError) {
            errorMessage = error.getUserFriendlyMessage()
          } else if (error instanceof Error) {
            errorMessage = `⚠️ 图片生成失败: ${error.message}`
          }

          return {
            ...block,
            imageUrl: '',
            textLines: [errorMessage, ...block.textLines],
          }
        }
      }
      return block
    })
  )

  // 将所有内容区块转换为 HTML
  const htmlBlocks = processedBlocks.map(block => contentBlockToHTML(block))

  // 拼接所有 HTML 区块
  return htmlBlocks.join('\n')
}

/**
 * 图片加载回调函数类型
 * @param blockId - 图片区块的唯一 ID
 * @param imageUrl - 生成的图片 URL（data URL 或 http URL）
 */
export type ImageLoadCallback = (blockId: string, imageUrl: string) => void

/**
 * 异步解析并转换内容中的所有图片简写格式（带回调）
 * 立即返回带占位符的 HTML，图片生成完成后通过回调函数更新
 *
 * @param content - 原始内容字符串
 * @param service - 图片生成服务类型（默认为 'pollinations'）
 * @param onImageLoad - 图片加载完成的回调函数
 * @param timeout - ST-ChatU8 超时时间（毫秒），仅在使用 st-chatu8 服务时有效
 * @returns 立即返回带占位符的 HTML 字符串
 *
 * @example
 * ```typescript
 * const content = `
 * 普通文本
 * [img:a beautiful sunset over the ocean]
 * 图片上的文字
 * `
 * const html = parseAndConvertImageShorthandAsyncWithCallback(
 *   content,
 *   'st-chatu8',
 *   (blockId, imageUrl) => {
 *     // 更新 DOM 中对应 ID 的元素背景
 *     const element = document.getElementById(blockId)
 *     if (element) {
 *       element.style.backgroundImage = `url("${imageUrl}")`
 *     }
 *   }
 * )
 * ```
 */
export function parseAndConvertImageShorthandAsyncWithCallback(
  content: string,
  service: ImageGenerationService = 'pollinations',
  onImageLoad?: ImageLoadCallback,
  timeout?: number
): string {
  if (!content) {
    return ''
  }

  const blocks = parseContentBlocks(content)

  // 如果没有任何区块，返回原始内容
  if (blocks.length === 0) {
    return content
  }

  // 获取 Toast 通知实例
  const { error: showErrorToast } = useToast()

  // 立即生成带占位符的 HTML
  const htmlBlocks = blocks.map(block => {
    if (block.type === 'image' && block.imageUrl) {
      // 异步处理图片 URL
      processImageUrl(block.imageUrl, service, timeout)
        .then(processedUrl => {
          // 图片生成成功，调用回调函数
          if (onImageLoad && block.id) {
            onImageLoad(block.id, processedUrl)
          }
        })
        .catch(error => {
          console.error(`❌ 处理图片 URL 失败: ${block.imageUrl}`, error)

          // 生成用户友好的错误提示
          let errorMessage = '⚠️ 图片生成失败'
          if (error instanceof ImageGenerationError) {
            errorMessage = error.getUserFriendlyMessage()
          } else if (error instanceof Error) {
            errorMessage = `⚠️ 图片生成失败: ${error.message}`
          }

          // 显示 Toast 错误提示
          showErrorToast(errorMessage)
        })

      // 立即返回带占位符的 HTML
      return contentBlockToHTMLWithPlaceholder(block)
    }
    return contentBlockToHTML(block)
  })

  // 拼接所有 HTML 区块
  return htmlBlocks.join('\n')
}
