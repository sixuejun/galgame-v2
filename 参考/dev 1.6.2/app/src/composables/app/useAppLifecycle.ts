/**
 * @file useAppLifecycle.ts
 * @description 应用生命周期管理 Composable - 管理应用的初始化和生命周期
 * @author Eden System Team
 */

import { onMounted } from 'vue'
import type { useGameStore } from '../../stores/gameStore'

/**
 * 应用生命周期管理 Composable
 *
 * 提供应用生命周期的管理功能，包括应用初始化、数据加载和成就监听。
 * 在组件挂载时自动执行初始化逻辑。
 *
 * 功能：
 * - 应用挂载时自动加载游戏数据
 * - 启动成就自动解锁监听
 * - 提供数据重新加载功能
 *
 * @param options 配置选项
 * @param options.gameStore 游戏数据 Store
 * @param options.startAchievementWatching 启动成就监听的函数
 * @returns 生命周期相关的方法
 *
 * @example
 * ```typescript
 * const gameStore = useGameStore()
 * const { startWatching } = useAchievementUnlock(...)
 *
 * const { handleRetry } = useAppLifecycle({
 *   gameStore,
 *   startAchievementWatching: startWatching
 * })
 *
 * // 重新加载数据
 * handleRetry()
 * ```
 */
export function useAppLifecycle(options: {
  gameStore: ReturnType<typeof useGameStore>
  startAchievementWatching: () => void
}) {
  const { gameStore, startAchievementWatching } = options

  /**
   * 应用挂载时的初始化逻辑
   */
  onMounted(() => {
    // 加载游戏数据
    gameStore.loadData()
    // 启动成就自动解锁监听
    startAchievementWatching()
  })

  /**
   * 重试加载数据
   *
   * 重新调用 gameStore.loadData() 加载游戏数据。
   *
   * @returns void
   */
  const handleRetry = () => {
    gameStore.loadData()
  }

  return {
    handleRetry,
  }
}
