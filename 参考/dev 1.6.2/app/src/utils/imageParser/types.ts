/**
 * 图片简写格式解析工具 - 类型定义
 *
 * 定义了图片区块、内容区块、子块等核心数据结构
 */

/**
 * 图片区块接口
 */
export interface ImageBlock {
  /** 图片 URL 或描述 */
  imageUrl: string
  /** 文本内容（多行） */
  textLines: string[]
}

/**
 * 内容子块类型（图片区块内的内容）
 */
export type SubBlockType = 'text' | 'html'

/**
 * 内容子块接口（图片区块内的文本或 HTML）
 */
export interface SubBlock {
  /** 子块类型：text 需要添加 <br>，html 保持原样 */
  type: SubBlockType
  /** 内容行 */
  lines: string[]
}

/**
 * 内容区块接口（可以是图片区块或普通文本区块）
 */
export interface ContentBlock {
  /** 区块类型 */
  type: 'image' | 'text'
  /** 图片 URL（仅当 type='image' 时） */
  imageUrl?: string
  /** 文本内容（多行） - 用于向后兼容 */
  textLines: string[]
  /** 子块内容（支持混合文本和 HTML） */
  subBlocks?: SubBlock[]
  /** 唯一标识符（用于异步更新图片背景） */
  id?: string
}
