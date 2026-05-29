/**
 * 图片简写格式解析工具 - HTML 渲染
 *
 * 负责将解析后的内容区块转换为 HTML 字符串
 */

import type { SubBlock, ContentBlock } from './types'

/**
 * 将子块转换为 HTML
 *
 * @param subBlock - 子块对象
 * @returns HTML 字符串
 */
export function subBlockToHTML(subBlock: SubBlock): string {
  const { type, lines } = subBlock

  if (type === 'html') {
    // HTML 块：保持原样，不添加 <br>
    return lines.join('\n')
  } else {
    // 文本块：先尝试解析 Markdown，然后处理换行
    // 保留空行以维持段落结构，只 trim 每一行但不过滤空行
    const textContent = lines.map(line => line.trim()).join('\n')

    // 如果 marked.js 可用，解析 Markdown
    if (typeof window !== 'undefined' && window.marked) {
      try {
        return window.marked.parse(textContent, {
          breaks: true, // 支持 GFM 换行
          gfm: true, // 启用 GitHub Flavored Markdown
        })
      } catch (error) {
        console.warn('⚠️ Markdown 解析失败，使用原始内容:', error)
        // 如果解析失败，使用原始内容并添加 <br>
        return textContent.replace(/\n/g, '<br>\n    ')
      }
    }

    // 如果 marked.js 不可用，直接添加 <br>
    return textContent.replace(/\n/g, '<br>\n    ')
  }
}

/**
 * 将内容区块转换为 HTML
 *
 * @param block - 内容区块对象
 * @returns HTML 字符串
 */
export function contentBlockToHTML(block: ContentBlock): string {
  const { type, imageUrl, textLines, subBlocks } = block

  if (type === 'image' && imageUrl) {
    // 图片区块：带背景图片的视觉小说风格
    let contentHTML = ''

    if (subBlocks && subBlocks.length > 0) {
      // 使用子块生成内容
      const subBlocksHTML = subBlocks.map(sb => subBlockToHTML(sb)).join('\n    ')
      contentHTML = subBlocksHTML
    } else {
      // 向后兼容：使用 textLines（全部视为文本，添加 <br>）
      contentHTML = textLines
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('<br>\n    ')
    }

    return `<div style='position:relative;width:100%;min-height:400px;background-image:url("${imageUrl}");background-size:cover;background-position:center;border-radius:12px;overflow:hidden;margin:15px 0;'>
  <!-- 半透明遮罩层，确保文字可读 -->
  <div style='position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7));'></div>

  <!-- 文字内容层 -->
  <div style='position:relative;padding:30px;color:#ffffff;text-shadow:2px 2px 4px rgba(0,0,0,0.8);'>
    ${contentHTML}
  </div>
</div>`
  } else {
    // 普通文本区块：直接返回文本（保留换行）
    return textLines.join('\n')
  }
}

/**
 * 将内容区块转换为带占位符的 HTML（用于异步加载图片）
 *
 * @param block - 内容区块对象
 * @param placeholderImageUrl - 占位符图片 URL（可选，默认使用渐变背景）
 * @returns HTML 字符串
 */
export function contentBlockToHTMLWithPlaceholder(
  block: ContentBlock,
  placeholderImageUrl?: string
): string {
  const { type, textLines, subBlocks, id } = block

  if (type === 'image') {
    // 图片区块：带占位符背景的视觉小说风格
    let contentHTML = ''

    if (subBlocks && subBlocks.length > 0) {
      // 使用子块生成内容
      const subBlocksHTML = subBlocks.map(sb => subBlockToHTML(sb)).join('\n    ')
      contentHTML = subBlocksHTML
    } else {
      // 向后兼容：使用 textLines（全部视为文本，添加 <br>）
      contentHTML = textLines
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('<br>\n    ')
    }

    // 使用占位符背景（渐变或指定的占位符图片）
    const backgroundStyle = placeholderImageUrl
      ? `background-image:url("${placeholderImageUrl}");`
      : 'background:linear-gradient(135deg, rgba(100, 100, 120, 0.3), rgba(80, 80, 100, 0.5));'

    // 添加 ID 属性以便后续更新
    const idAttr = id ? ` id="${id}"` : ''

    return `<div${idAttr} style='position:relative;width:100%;min-height:400px;${backgroundStyle}background-size:cover;background-position:center;border-radius:12px;overflow:hidden;margin:15px 0;transition:background-image 0.5s ease-in-out;'>
  <!-- 半透明遮罩层，确保文字可读 -->
  <div style='position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7));'></div>

  <!-- 文字内容层 -->
  <div style='position:relative;padding:30px;color:#ffffff;text-shadow:2px 2px 4px rgba(0,0,0,0.8);'>
    ${contentHTML}
  </div>
</div>`
  } else {
    // 普通文本区块：直接返回文本（保留换行）
    return textLines.join('\n')
  }
}
