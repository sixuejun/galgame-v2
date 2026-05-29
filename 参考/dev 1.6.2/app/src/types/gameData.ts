import type { Config } from './config'
import type { ShopData, StorageData } from './shop'
import type { DataBlock } from './ui'

/**
 * 故事数据
 */
export interface Story {
  time?: string
  location?: string
  weather?: string
  content?: string
}

/**
 * 玩家选择
 */
export interface Choice {
  text: string
}

/**
 * 角色数据
 *
 * 数据块（如 basicInfo、psychologicalState 等）直接作为 Character 对象的属性，
 * 而不是嵌套在 blocks 字段下。
 *
 * @example
 * ```typescript
 * const character: Character = {
 *   name: "玩家",
 *   level: 1,
 *   basicInfo: {
 *     title: "基本信息",
 *     type: "details",
 *     content: { ... }
 *   },
 *   psychologicalState: {
 *     title: "心理状态",
 *     type: "progress_bars",
 *     content: { ... }
 *   }
 * }
 * ```
 */
export interface Character {
  name: string
  level?: number
  [key: string]: string | number | DataBlock | undefined
}

/**
 * 成就进度条件项
 * 包含条件描述和目标值
 */
export interface AchievementCondition {
  desc: string // 条件描述
  target: number // 目标值
}

/**
 * 成就进度条件
 * 键为数据路径（如 "shop.currency"），值为条件对象或目标值（兼容旧格式）
 */
export interface AchievementSchedule {
  [dataPath: string]: AchievementCondition | number
}

/**
 * 成就数据
 */
export interface Achievement {
  id: string
  name: string
  desc: string
  icon: string
  unlocked: boolean
  date?: string | null
  rarity?: string
  schedule?: AchievementSchedule // 进度条件：数据路径 -> 目标值
}

/**
 * 摘要记录
 */
export interface Summary {
  time: string // ISO 8601 格式时间戳
  content: string // 摘要内容
}

/**
 * 游戏数据(根对象)
 */
export interface GameData {
  config?: Config
  story?: Story
  choices?: Choice[]
  characters?: {
    [characterId: string]: Character
  }
  shop?: ShopData
  storage?: StorageData
  achievements?: {
    [achievementId: string]: Achievement
  }
  summaries?: Summary[] // 摘要记录数组
}
