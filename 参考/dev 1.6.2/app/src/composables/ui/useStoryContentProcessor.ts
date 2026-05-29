/**
 * @file useStoryContentProcessor.ts
 * @description 故事内容处理 Composable - 处理 Markdown、图片简写、HTML 清理等
 * @author Eden System Team
 */

import { ref, watch, type Ref } from 'vue'
import { sanitizeHTML } from '../../utils/sanitize'
import { logger } from '../../utils/logger'
import {
  hasImageShorthand,
  parseAndConvertImageShorthandAsyncWithCallback,
  type ImageLoadCallback,
} from '../../utils/imageParser/'
import { useSettingsStore } from '../../stores/settingsStore'

/**
 * 故事内容处理 Composable
 *
 * 提供故事内容的处理功能，包括：
 * - Markdown 解析
 * - 图片简写格式处理
 * - HTML 内容清理
 * - 异步图片加载
 *
 * @param contentRef - 原始内容的响应式引用
 * @returns 处理后的内容和相关状态
 *
 * @example
 * ```typescript
 * const { sanitizedContent, isProcessing } = useStoryContentProcessor(
 *   computed(() => props.story?.content)
 * )
 * ```
 */
export function useStoryContentProcessor(contentRef: Ref<string | undefined>) {
  const settingsStore = useSettingsStore()

  // 使用 ref 存储处理后的内容（支持异步更新）
  const processedContentRef = ref<string>('')
  const isProcessingContent = ref(false)

  /**
   * 图片加载回调函数：动态更新图片背景
   */
  const handleImageLoad: ImageLoadCallback = (blockId: string, imageUrl: string) => {
    logger.debug(`🖼️ 图片加载完成，更新区块 ${blockId}`)

    // 查找对应的 DOM 元素
    const element = document.getElementById(blockId)
    if (element) {
      // 更新背景图片
      element.style.backgroundImage = `url("${imageUrl}")`
      logger.debug(`✅ 成功更新区块 ${blockId} 的背景图片`)
    } else {
      logger.warn(`⚠️ 未找到区块 ${blockId} 的 DOM 元素`)
    }
  }

  /**
   * 处理内容的函数（同步返回，图片异步加载）
   */
  function processContent(content: string): string {
    try {
      let processedContent = content

      // 检查是否包含图片简写格式
      if (hasImageShorthand(content)) {
        // 获取当前的图片生成服务设置
        const imageService = settingsStore.settings.imageGenerationService
        const timeout = settingsStore.settings.stChatu8ImageTimeout

        // 使用新的异步加载模式：立即返回占位符，图片生成完成后通过回调更新
        processedContent = parseAndConvertImageShorthandAsyncWithCallback(
          content,
          imageService,
          handleImageLoad,
          timeout
        )

        logger.debug(`📝 内容已渲染（带占位符），图片正在后台加载...`)
      } else {
        // 如果没有图片简写格式，直接解析 Markdown
        if (typeof window !== 'undefined' && window.marked) {
          try {
            // 使用 marked 解析 Markdown
            processedContent = window.marked.parse(processedContent, {
              breaks: true, // 支持 GFM 换行
              gfm: true, // 启用 GitHub Flavored Markdown
            })
          } catch (markdownError) {
            logger.warn('⚠️ Markdown 解析失败，使用原始内容:', markdownError)
            // 如果 Markdown 解析失败，继续使用原始内容
          }
        } else {
          logger.warn('⚠️ Marked.js 未加载，跳过 Markdown 解析')
        }
      }

      // 清理 HTML 内容
      return sanitizeHTML(processedContent)
    } catch (error) {
      logger.error('❌ 内容处理失败:', error)
      return `<p style="color: #dc3545; padding: 1rem; background: #fff3cd; border-radius: 0.5rem; margin: 1rem 0;">⚠️ 内容处理失败: ${error instanceof Error ? error.message : String(error)}</p>`
    }
  }

  // 监听故事内容变化，同步处理内容（图片异步加载）
  watch(
    contentRef,
    newContent => {
      const content = newContent || '故事内容加载中...'
      isProcessingContent.value = true

      try {
        // 同步处理内容，图片会在后台异步加载
        processedContentRef.value = processContent(content)
      } catch (error) {
        logger.error('❌ 内容处理失败:', error)
        processedContentRef.value = `<p style="color: #dc3545; padding: 1rem; background: #fff3cd; border-radius: 0.5rem; margin: 1rem 0;">⚠️ DOMPurify 未加载，无法安全显示 HTML 内容。请检查网络连接或刷新页面。</p>`
      } finally {
        isProcessingContent.value = false
      }
    },
    { immediate: true }
  )

  return {
    /** 处理后的安全 HTML 内容 */
    sanitizedContent: processedContentRef,
    /** 是否正在处理内容 */
    isProcessing: isProcessingContent,
  }
}
