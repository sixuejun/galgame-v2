import type { GameData, Summary } from './gameData'
import type { UserAction } from './common'

/**
 * YAML 更新操作类型
 */
export interface YamlUpdateOperation {
  /** 更新操作：键值对，键为路径，值为要设置的值 */
  $update?: Record<string, unknown>
  /** 删除操作：要删除的路径数组 */
  $delete?: string[]
  /** 游戏数据：用于初始化或完全替换（隐式操作） */
  gameData?: Partial<GameData>
}

/**
 * AI 提示数据类型
 */
export interface AIPromptData {
  /** 游戏数据（不包含 summaries） */
  gameData: Omit<GameData, 'summaries'>
  /** 用户选择 */
  userChoice: string
  /** 用户操作日志（可选） */
  userAction?: UserAction[]
  /** 摘要记录（可选） */
  summaries?: Summary[]
}
