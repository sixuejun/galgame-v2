/**
 * @file useAchievementProgress.ts
 * @description 成就进度追踪 Composable - 计算和展示成就的完成进度
 * @author Eden System Team
 */

import { computed, type Ref } from 'vue'
import type { Achievement, GameData } from '../../types'
import { getDataByPath } from '../../utils/pathUtils'

/**
 * 单个条件的进度信息
 */
export interface ConditionProgress {
  /** 数据路径（如 "gameData.characters.user.level"） */
  path: string
  /** 条件描述（如 "角色等级"） */
  desc: string
  /** 当前值 */
  current: number
  /** 目标值 */
  target: number
  /** 是否完成 */
  completed: boolean
  /** 完成百分比 (0-100) */
  percentage: number
}

/**
 * 成就进度信息
 */
export interface AchievementProgress {
  /** 成就对象 */
  achievement: Achievement
  /** 是否有进度条件 */
  hasSchedule: boolean
  /** 是否为单条件成就 */
  isSingleCondition: boolean
  /** 所有条件的进度列表 */
  conditions: ConditionProgress[]
  /** 已完成条件数 */
  completedCount: number
  /** 总条件数 */
  totalCount: number
  /** 总体完成百分比 (0-100) */
  overallPercentage: number
  /** 是否所有条件都已完成 */
  isCompleted: boolean
}

/**
 * 成就进度追踪 Composable
 *
 * 提供成就进度的计算和展示功能，支持单条件和多条件成就。
 *
 * 功能：
 * - 计算单条件和多条件成就的进度
 * - 判断成就是否达到解锁条件
 * - 提供详细的进度信息用于UI展示
 * - 自动适配新旧两种条件数据格式
 *
 * @param gameData 游戏数据的响应式引用
 * @param achievement 成就数据的响应式引用
 * @returns 成就进度相关的计算属性和方法
 *
 * @example
 * ```typescript
 * const gameData = ref<GameData>({ ... })
 * const achievement = ref<Achievement>({ ... })
 * const { progress, progressText, progressBarClass } = useAchievementProgress(gameData, achievement)
 *
 * // 使用进度信息
 * console.log(progress.value.overallPercentage) // 75
 * console.log(progressText.value) // "3/4" 或 "750/1000"
 * ```
 */
export function useAchievementProgress(gameData: Ref<GameData>, achievement: Ref<Achievement>) {
  /**
   * 计算单个条件的进度
   *
   * @param path 数据路径（如 "gameData.characters.user.level"）
   * @param conditionData 条件数据（支持旧格式 number 和新格式 { desc, target }）
   * @returns 条件进度信息
   */
  const calculateConditionProgress = (
    path: string,
    conditionData: number | { desc: string; target: number }
  ): ConditionProgress => {
    // 解析条件数据（兼容旧格式：number 和新格式：{ desc, target }）
    let target: number
    let desc: string

    if (typeof conditionData === 'number') {
      // 旧格式：直接是目标值
      target = conditionData
      // 使用路径的最后一部分作为默认描述
      desc = path.split('.').pop() || path
    } else {
      // 新格式：包含 desc 和 target
      target = conditionData.target
      desc = conditionData.desc
    }

    // 从游戏数据中获取当前值
    const rawValue = getDataByPath(gameData.value, path)
    const current = typeof rawValue === 'number' ? rawValue : 0

    // 计算完成状态和百分比
    const completed = current >= target
    const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0

    return {
      path,
      desc,
      current,
      target,
      completed,
      percentage,
    }
  }

  /**
   * 计算成就的总体进度
   *
   * 根据成就的所有条件计算总体进度信息：
   * - 单条件成就：使用该条件的百分比
   * - 多条件成就：使用已完成条件数的百分比
   *
   * @returns 成就的总体进度信息
   */
  const progress = computed<AchievementProgress>(() => {
    const ach = achievement.value
    const schedule = ach.schedule

    // 如果没有进度条件，返回默认值
    if (!schedule || Object.keys(schedule).length === 0) {
      return {
        achievement: ach,
        hasSchedule: false,
        isSingleCondition: false,
        conditions: [],
        completedCount: 0,
        totalCount: 0,
        overallPercentage: 0,
        isCompleted: ach.unlocked,
      }
    }

    // 计算所有条件的进度
    const conditions = Object.entries(schedule).map(([path, target]) =>
      calculateConditionProgress(path, target)
    )

    const completedCount = conditions.filter(c => c.completed).length
    const totalCount = conditions.length
    const isSingleCondition = totalCount === 1

    // 计算总体完成百分比
    let overallPercentage: number
    if (isSingleCondition) {
      // 单条件：使用该条件的百分比
      overallPercentage = conditions[0].percentage
    } else {
      // 多条件：使用已完成条件数的百分比
      overallPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0
    }

    const isCompleted = completedCount === totalCount

    return {
      achievement: ach,
      hasSchedule: true,
      isSingleCondition,
      conditions,
      completedCount,
      totalCount,
      overallPercentage,
      isCompleted,
    }
  })

  /**
   * 获取进度文本（用于简单展示）
   *
   * 格式：
   * - 单条件成就：返回 "当前值/目标值"（如 "100/10000"）
   * - 多条件成就：返回 "已完成数/总条件数"（如 "2/3"）
   *
   * @returns 进度文本字符串，无进度条件时返回空字符串
   */
  const progressText = computed(() => {
    const p = progress.value
    if (!p.hasSchedule) return ''

    if (p.isSingleCondition) {
      const condition = p.conditions[0]
      return `${condition.current}/${condition.target}`
    } else {
      return `${p.completedCount}/${p.totalCount}`
    }
  })

  /**
   * 获取进度条样式类名（基于稀有度）
   *
   * 根据成就的稀有度返回对应的 CSS 类名，用于设置进度条颜色。
   *
   * @returns 进度条样式类名（如 "progress-bar-common", "progress-bar-rare"）
   */
  const progressBarClass = computed(() => {
    const rarity = achievement.value.rarity?.toLowerCase() || 'common'
    return `progress-bar-${rarity}`
  })

  return {
    progress,
    progressText,
    progressBarClass,
  }
}
