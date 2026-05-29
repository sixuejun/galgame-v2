/**
 * @file useHtmlSanitizer.ts
 * @description HTML 清理 Composable - 使用 DOMPurify 清理 HTML 内容,防止 XSS 攻击
 * @author Eden System Team
 */

import { computed } from 'vue'
import { logger } from '@/utils/logger'

/**
 * HTML 清理 Composable
 *
 * 使用 DOMPurify 清理 HTML 内容,防止 XSS 攻击。
 *
 * @returns HTML 清理方法
 */
export function useHtmlSanitizer() {
  /**
   * 清理 HTML 内容
   * @param content 原始 HTML 内容
   * @returns 清理后的安全 HTML 内容
   */
  const sanitize = (content: string): string => {
    if (!content) return ''

    // 检查 DOMPurify 是否已加载
    if (typeof window !== 'undefined' && window.DOMPurify) {
      try {
        return window.DOMPurify.sanitize(content, {
          ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span'],
          ALLOWED_ATTR: ['href', 'title', 'target', 'class'],
          KEEP_CONTENT: true,
        })
      } catch (error) {
        logger.error('❌ DOMPurify 清理失败:', error)
        return `<p style="color: #dc3545; padding: 1rem; background: #fff3cd; border-radius: 0.5rem;">⚠️ 内容清理失败，无法安全显示 HTML 内容。</p>`
      }
    }

    // 如果 DOMPurify 未加载，显示错误提示
    logger.error('❌ DOMPurify 未加载，无法清理 HTML 内容')
    return `<p style="color: #dc3545; padding: 1rem; background: #fff3cd; border-radius: 0.5rem;">⚠️ DOMPurify 未加载，无法安全显示 HTML 内容。请检查网络连接或刷新页面。</p>`
  }

  /**
   * 创建响应式的清理后的 HTML 内容
   * @param contentRef 响应式的原始 HTML 内容
   * @returns 响应式的清理后的 HTML 内容
   */
  const createSanitizedContent = (contentRef: () => string | undefined) => {
    return computed(() => sanitize(contentRef() || ''))
  }

  return {
    sanitize,
    createSanitizedContent,
  }
}
