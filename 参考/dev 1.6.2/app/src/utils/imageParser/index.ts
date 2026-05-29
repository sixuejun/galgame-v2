/**
 * 图片简写格式解析工具 - 统一导出
 *
 * 将 [img:URL] 或 [img:{description}] 格式的标记转换为带背景图片的 HTML 结构
 * 支持两种图片生成方式：
 * 1. pollinations.ai - 在线服务，将描述转换为 URL
 * 2. st-chatu8 - 外部应用，通过事件 API 生成 base64 图片
 */

// 导出类型定义
export type { ImageBlock, SubBlock, SubBlockType, ContentBlock } from './types'

// 导出解析函数
export { parseContentBlocks, parseSubBlocks } from './parser'

// 导出渲染函数
export { contentBlockToHTML, contentBlockToHTMLWithPlaceholder, subBlockToHTML } from './renderer'

// 导出图片服务集成
export {
  parseAndConvertImageShorthandAsync,
  parseAndConvertImageShorthandAsyncWithCallback,
  type ImageLoadCallback,
} from './imageService'

// 导出辅助工具函数
export { hasImageShorthand, parseAndConvertImageShorthand } from './utils'
