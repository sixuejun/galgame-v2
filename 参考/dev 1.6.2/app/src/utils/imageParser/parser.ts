/**
 * 图片简写格式解析工具 - 解析逻辑
 *
 * 负责将 [img:URL] 格式的文本解析为结构化的内容区块
 */

import type { SubBlock, ContentBlock } from './types'

/**
 * 生成唯一的图片区块 ID
 * @returns 唯一的区块 ID（基于时间戳和随机数）
 */
function generateBlockId(): string {
  return `image-block-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * 解析子块内容（支持 [txt:...] 和 [html:...] 显式标记，以及隐式识别）
 *
 * @param lines - 内容行数组
 * @returns 子块数组
 */
export function parseSubBlocks(lines: string[]): SubBlock[] {
  const subBlocks: SubBlock[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // 检查显式 [txt:...] 标记
    if (line.trim() === '[txt:') {
      const textLines: string[] = []
      i++ // 跳过 [txt: 行

      // 收集直到遇到 ] 或文件结束
      while (i < lines.length && lines[i].trim() !== ']') {
        textLines.push(lines[i])
        i++
      }

      if (textLines.length > 0) {
        subBlocks.push({ type: 'text', lines: textLines })
      }
      i++ // 跳过 ] 行
      continue
    }

    // 检查显式 [html:...] 标记
    if (line.trim() === '[html:') {
      const htmlLines: string[] = []
      i++ // 跳过 [html: 行

      // 收集直到遇到 ] 或文件结束
      while (i < lines.length && lines[i].trim() !== ']') {
        htmlLines.push(lines[i])
        i++
      }

      if (htmlLines.length > 0) {
        subBlocks.push({ type: 'html', lines: htmlLines })
      }
      i++ // 跳过 ] 行
      continue
    }

    // 隐式识别：检查是否是 HTML 块（以 < 开头）
    if (line.trim().startsWith('<')) {
      const htmlLines: string[] = [line]
      i++

      // 继续收集 HTML 行，直到遇到非 HTML 行
      while (i < lines.length) {
        const nextLine = lines[i]
        const trimmed = nextLine.trim()

        // 如果是空行，检查下一行是否还是 HTML
        if (trimmed === '') {
          // 向前查看
          if (i + 1 < lines.length && lines[i + 1].trim().startsWith('<')) {
            htmlLines.push(nextLine) // 保留空行
            i++
            continue
          } else {
            break // HTML 块结束
          }
        }

        // 如果是 HTML 行（以 < 开头，或包含 >，或是缩进的延续行）
        // 缩进的延续行：前一行未闭合（不以 > 结尾）且当前行是缩进
        const prevLine = htmlLines[htmlLines.length - 1]
        const prevTrimmed = prevLine.trim()
        const isIndentedContinuation =
          !prevTrimmed.endsWith('>') && nextLine.startsWith(' ') && trimmed !== ''

        if (trimmed.startsWith('<') || trimmed.endsWith('>') || isIndentedContinuation) {
          htmlLines.push(nextLine)
          i++
        } else {
          break // HTML 块结束
        }
      }

      subBlocks.push({ type: 'html', lines: htmlLines })
      continue
    }

    // 普通文本行：收集连续的非 HTML 行
    const textLines: string[] = [line]
    i++

    while (i < lines.length) {
      const nextLine = lines[i]
      const trimmed = nextLine.trim()

      // 遇到显式标记或 HTML 开始标签，停止
      if (trimmed === '[txt:' || trimmed === '[html:' || trimmed.startsWith('<')) {
        break
      }

      textLines.push(nextLine)
      i++
    }

    subBlocks.push({ type: 'text', lines: textLines })
  }

  return subBlocks
}

/**
 * 解析包含 [img:URL] 标记的内容，返回混合内容区块
 *
 * @param content - 原始内容字符串
 * @returns 内容区块数组（包含图片区块和普通文本区块）
 *
 * @example
 * ```typescript
 * const content = `
 * 普通文本1
 * [img:https://example.com/1.jpg]
 * 图片上的文字
 * [img:https://example.com/2.jpg]
 * 图片上的文字2
 * 普通文本2
 * `
 * const blocks = parseContentBlocks(content)
 * // 返回: [
 * //   { type: 'text', textLines: ['普通文本1'] },
 * //   { type: 'image', imageUrl: 'https://example.com/1.jpg', textLines: ['图片上的文字'] },
 * //   { type: 'image', imageUrl: 'https://example.com/2.jpg', textLines: ['图片上的文字2'] },
 * //   { type: 'text', textLines: ['普通文本2'] }
 * // ]
 * ```
 */
export function parseContentBlocks(content: string): ContentBlock[] {
  if (!content) {
    return []
  }

  const blocks: ContentBlock[] = []
  const lines = content.split('\n')

  let currentBlock: ContentBlock | null = null

  for (const line of lines) {
    // 匹配 [img:URL] 格式
    const imgMatch = line.match(/^\[img:(.+?)\]$/)

    if (imgMatch) {
      // 保存之前的区块（如果有）
      if (currentBlock !== null && currentBlock.textLines.length > 0) {
        blocks.push(currentBlock)
      }

      // 开始新的图片区块
      currentBlock = {
        type: 'image',
        imageUrl: imgMatch[1].trim(),
        textLines: [],
        subBlocks: [], // 初始化子块数组
        id: generateBlockId(), // 生成唯一 ID
      }
    } else {
      // 普通文本行
      if (currentBlock === null) {
        // 如果还没有区块，创建一个文本区块
        currentBlock = {
          type: 'text',
          textLines: [line],
        }
      } else if (currentBlock.type === 'image') {
        // 如果当前是图片区块，添加文本行
        currentBlock.textLines.push(line)
      } else {
        // 如果当前是文本区块，继续添加文本行
        currentBlock.textLines.push(line)
      }
    }
  }

  // 保存最后一个区块
  if (currentBlock !== null && currentBlock.textLines.length > 0) {
    blocks.push(currentBlock)
  }

  // 为图片区块解析子块
  for (const block of blocks) {
    if (block.type === 'image' && block.textLines.length > 0) {
      block.subBlocks = parseSubBlocks(block.textLines)
    }
  }

  return blocks
}
