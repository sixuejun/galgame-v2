/**
 * 进度条数据
 */
export interface ProgressBar {
  current: number
  max: number
  description: string
  barClass: string
}

/**
 * 状态值数据
 */
export interface StatusValue {
  description: string
  current: number
}

/**
 * 特质数据
 */
export interface Trait {
  name: string
  unlocked: boolean
  description: string
  icon?: string
}

/**
 * 详情数据
 */
export interface DetailItem {
  key: string
  label: string
  value: string
}

/**
 * 数据块类型
 */
export type DataBlockType = 'details' | 'progress_bars' | 'status_values' | 'traits'

/**
 * 数据块内容类型映射
 */
export type DataBlockContent<T extends DataBlockType> = T extends 'details'
  ? Record<string, DetailItem>
  : T extends 'progress_bars'
    ? Record<string, ProgressBar>
    : T extends 'status_values'
      ? Record<string, StatusValue>
      : Record<string, Trait>

/**
 * 数据块(用于数据驱动渲染)
 * 使用泛型约束确保 type 和 content 的类型一致性
 */
export interface DataBlock<T extends DataBlockType = DataBlockType> {
  title: string
  type: T
  content: DataBlockContent<T>
}

/**
 * 模态框按钮
 */
export interface ModalButton {
  text: string
  class: 'primary' | 'secondary' | 'danger'
  action: () => void
}
