/**
 * @file useAchievementUnlock.ts
 * @description 成就自动解锁 Composable - 监听游戏数据变化并自动解锁达标的成就
 * @author Eden System Team
 */

import { watch, type Ref } from 'vue'
import type { Achievement, GameData } from '../../types'
import { useAchievementProgress } from './useAchievementProgress'
import { logger } from '../../utils/logger'

/**
 * 成就自动解锁 Composable
 *
 * 提供单个成就的自动解锁功能，监听游戏数据变化并在条件满足时自动解锁。
 *
 * 功能：
 * - 监听游戏数据变化
 * - 自动检测成就是否达到解锁条件
 * - 自动解锁达标的成就并设置解锁时间
 * - 记录解锁日志
 *
 * @param gameData 游戏数据的响应式引用
 * @param achievement 成就数据的响应式引用
 * @returns 解锁相关的方法
 *
 * @example
 * ```typescript
 * const gameData = ref<GameData>({ ... })
 * const achievement = ref<Achievement>({ ... })
 * const { checkAndUnlock, startWatching } = useAchievementUnlock(gameData, achievement)
 *
 * // 手动检查并解锁
 * checkAndUnlock()
 *
 * // 启动自动监听
 * startWatching()
 * ```
 */
export function useAchievementUnlock(gameData: Ref<GameData>, achievement: Ref<Achievement>) {
  const { progress } = useAchievementProgress(gameData, achievement)

  /**
   * 检查并解锁成就
   *
   * 如果成就未解锁且所有条件都已完成，则自动解锁并设置解锁时间。
   *
   * @returns void
   */
  const checkAndUnlock = () => {
    const ach = achievement.value
    const prog = progress.value

    // 如果已经解锁，跳过
    if (ach.unlocked) {
      return
    }

    // 如果没有进度条件，跳过
    if (!prog.hasSchedule) {
      return
    }

    // 如果所有条件都已完成，解锁成就
    if (prog.isCompleted) {
      ach.unlocked = true
      ach.date = new Date().toISOString()
      logger.info(`🏆 成就已解锁: ${ach.name} (${ach.id})`)
    }
  }

  /**
   * 监听游戏数据变化，自动检查解锁条件
   *
   * 启动深度监听，当游戏数据发生任何变化时自动检查成就是否达到解锁条件。
   * 同时会在启动时立即执行一次检查。
   *
   * @returns void
   */
  const startWatching = () => {
    // 监听游戏数据的深层变化
    watch(
      () => gameData.value,
      () => {
        checkAndUnlock()
      },
      { deep: true }
    )

    // 初始检查一次
    checkAndUnlock()
  }

  return {
    checkAndUnlock,
    startWatching,
  }
}

/**
 * 批量成就自动解锁 Composable
 *
 * 提供批量成就的自动解锁功能，监听游戏数据变化并批量解锁所有达标的成就。
 *
 * 功能：
 * - 监听游戏数据变化
 * - 自动检测所有成就是否达到解锁条件
 * - 批量解锁达标的成就
 * - 统计并记录解锁数量
 *
 * @param gameData 游戏数据的响应式引用
 * @returns 批量解锁相关的方法
 *
 * @example
 * ```typescript
 * const gameData = ref<GameData>({ ... })
 * const { checkAndUnlockAll, startWatching } = useAchievementsAutoUnlock(gameData)
 *
 * // 手动检查并解锁所有成就
 * checkAndUnlockAll()
 *
 * // 启动自动监听
 * startWatching()
 * ```
 */
export function useAchievementsAutoUnlock(gameData: Ref<GameData>) {
  /**
   * 检查并解锁所有达标的成就
   *
   * 遍历所有成就，检查条件并解锁达标的成就。
   *
   * @returns void
   */
  const checkAndUnlockAll = () => {
    const achievements = gameData.value.achievements
    if (!achievements) {
      return
    }

    let unlockedCount = 0

    // 遍历所有成就
    Object.values(achievements).forEach(achievement => {
      // 如果已经解锁，跳过
      if (achievement.unlocked) {
        return
      }

      // 如果没有进度条件，跳过
      if (!achievement.schedule || Object.keys(achievement.schedule).length === 0) {
        return
      }

      // 检查所有条件是否都已完成
      const allConditionsMet = Object.entries(achievement.schedule).every(
        ([path, conditionData]) => {
          // 解析条件数据（兼容旧格式：number 和新格式：{ desc, target }）
          const target = typeof conditionData === 'number' ? conditionData : conditionData.target

          const pathParts = path.split('.')
          let current: unknown = gameData.value

          // 遍历路径获取当前值
          for (const part of pathParts) {
            if (current && typeof current === 'object') {
              current = (current as Record<string, unknown>)[part]
            } else {
              current = undefined
              break
            }
          }

          const currentValue = typeof current === 'number' ? current : 0
          return currentValue >= target
        }
      )

      // 如果所有条件都已完成，解锁成就
      if (allConditionsMet) {
        achievement.unlocked = true
        achievement.date = new Date().toISOString()
        unlockedCount++
        logger.info(`🏆 成就已解锁: ${achievement.name} (${achievement.id})`)
      }
    })

    if (unlockedCount > 0) {
      logger.info(`✨ 本次共解锁 ${unlockedCount} 个成就`)
    }
  }

  /**
   * 监听游戏数据变化，自动检查所有成就的解锁条件
   *
   * 启动深度监听，当游戏数据发生任何变化时自动检查所有成就是否达到解锁条件。
   * 同时会在启动时立即执行一次检查。
   *
   * @returns void
   */
  const startWatching = () => {
    // 监听游戏数据的深层变化
    watch(
      () => gameData.value,
      () => {
        checkAndUnlockAll()
      },
      { deep: true }
    )

    // 初始检查一次
    checkAndUnlockAll()
  }

  return {
    checkAndUnlockAll,
    startWatching,
  }
}
