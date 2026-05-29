/**
 * 图片简写格式解析工具 - 辅助工具函数
 *
 * 提供便捷的工具函数用于检测和转换图片简写格式
 */

import { parseContentBlocks } from './parser'
import { contentBlockToHTML } from './renderer'

/**
 * 检查内容是否包含图片简写格式
 *
 * @param content - 待检查的内容字符串
 * @returns 是否包含 [img:URL] 或 [img:{description}] 格式
 */
export function hasImageShorthand(content: string): boolean {
  if (!content) {
    return false
  }

  return /\[img:.+?\]/.test(content)
}

/**
 * 解析并转换内容中的所有图片简写格式
 *
 * @param content - 原始内容字符串
 * @returns 转换后的 HTML 字符串（包含图片区块和普通内容）
 *
 * @example
 * ```typescript
 * const content = `
 * 普通文本
 * [img:https://example.com/1.jpg]
 * 图片上的文字
 * `
 * const html = parseAndConvertImageShorthand(content)
 * ```
 */
export function parseAndConvertImageShorthand(content: string): string {
  if (!content) {
    return ''
  }

  const blocks = parseContentBlocks(content)

  // 如果没有任何区块，返回原始内容
  if (blocks.length === 0) {
    return content
  }

  // 将所有内容区块转换为 HTML
  const htmlBlocks = blocks.map(block => contentBlockToHTML(block))

  // 拼接所有 HTML 区块
  return htmlBlocks.join('\n')
}
