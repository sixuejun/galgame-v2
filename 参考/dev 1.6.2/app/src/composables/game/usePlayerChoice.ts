/**
 * @file usePlayerChoice.ts
 * @description 玩家选择处理 Composable - 处理玩家选择并与 AI 交互
 * @author Eden System Team
 */

import { logger } from '../../utils/logger'
import type { GameData, UserAction } from '../../types'
import type { Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from '../../stores/gameStore'
import { useAICommunication } from '../ai/useAICommunication'
import { useToast } from '../ui/useToast'
import { useSettingsStore } from '../../stores/settingsStore'
import { AIService, type ParsedAIResponse } from '../../services/aiService'

/**
 * 回顾页面组件暴露的方法接口
 */
export interface ReviewPageExposed {
  getSendCount: () => number
}

/**
 * 新的玩家选择处理配置接口（推荐使用）
 * 重构后只需要传递 reviewPageRef，其他依赖通过内部调用 composables 获取
 */
export interface UsePlayerChoiceOptions {
  /** 回顾页面引用（用于获取发送给AI的摘要条数） */
  reviewPageRef: Ref<ReviewPageExposed | null>
}

/**
 * 旧的玩家选择处理配置接口（向后兼容，已废弃）
 * @deprecated 请使用新的 UsePlayerChoiceOptions 接口
 */
export interface UsePlayerChoiceLegacyOptions {
  /** 游戏数据 */
  gameData: Ref<GameData>
  /** 用户操作日志 */
  userActionLog: Ref<UserAction[]>
  /** 回顾页面引用 */
  reviewPageRef: Ref<ReviewPageExposed | null>
  /** 检查 AI 是否可用 */
  isAIAvailable: () => boolean
  /** 发送玩家选择到 AI */
  sendPlayerChoice: (
    gameData: GameData,
    choice: string,
    userActionLog: UserAction[],
    summariesCount: number
  ) => Promise<ParsedAIResponse | null>
  /** 从 AI 响应更新游戏数据 */
  updateGameDataFromAI: (yamlContent: string) => void
  /** 清除用户操作日志 */
  clearUserActionLog: () => void
  /** 自动保存到世界书 */
  autoSaveToWorldbook: () => Promise<void>
  /** 显示成功提示 */
  showSuccessToast: (message: string) => void
  /** 显示错误提示 */
  showErrorToast: (message: string) => void
  /** 显示警告提示 */
  showWarningToast: (message: string) => void
  /** 生成错误 */
  generationError: Ref<string | null>
}

/**
 * 类型守卫：检查是否使用旧接口
 */
function isLegacyOptions(
  options: UsePlayerChoiceOptions | UsePlayerChoiceLegacyOptions
): options is UsePlayerChoiceLegacyOptions {
  return 'gameData' in options
}

/**
 * 玩家选择处理 Composable
 * 管理玩家选择的处理流程
 *
 * 重构说明：
 * - 从 12 个参数减少到 1 个参数
 * - 内部调用 useGameData、useAICommunication、useToast 获取所需依赖
 * - 提高了代码的可维护性和可测试性
 * - 支持向后兼容旧接口（用于测试）
 */
export function usePlayerChoice(options: UsePlayerChoiceOptions | UsePlayerChoiceLegacyOptions) {
  // 向后兼容：如果使用旧接口，直接使用传入的参数
  if (isLegacyOptions(options)) {
    const {
      gameData,
      userActionLog,
      reviewPageRef,
      isAIAvailable,
      sendPlayerChoice,
      updateGameDataFromAI,
      clearUserActionLog,
      autoSaveToWorldbook,
      showSuccessToast,
      showErrorToast,
      showWarningToast,
      generationError,
    } = options

    const handleChoice = async (text: string) => {
      logger.debug('玩家选择:', text)

      if (!isAIAvailable()) {
        logger.warn('⚠️ AI 接口不可用,仅记录选择')
        showWarningToast(`AI 接口不可用，已记录您的选择: "${text}"`)
        await autoSaveToWorldbook()
        return
      }

      try {
        const summariesCount = reviewPageRef.value?.getSendCount?.() || 5
        const response = await sendPlayerChoice(
          gameData.value,
          text,
          userActionLog.value,
          summariesCount
        )

        if (response && response.success) {
          logger.info('✅ AI 响应成功')

          if (response.yamlContent) {
            try {
              updateGameDataFromAI(response.yamlContent)
              logger.info('✅ 游戏数据已更新')
            } catch (updateError) {
              logger.error('❌ 更新游戏数据失败:', updateError)
              showErrorToast('游戏数据更新失败，请检查控制台日志')
              return
            }
          }

          clearUserActionLog()
          await autoSaveToWorldbook()
          showSuccessToast('✨ 选择已处理，故事继续发展...')
        } else {
          const errorMsg = response?.error || generationError.value || '未知错误'
          logger.error('❌ AI 响应失败:', errorMsg)
          showErrorToast(`AI 响应失败: ${errorMsg}`)
        }
      } catch (error) {
        logger.error('❌ 处理玩家选择时出错:', error)
        const errorMsg = error instanceof Error ? error.message : '未知错误'
        showErrorToast(`处理选择时出错: ${errorMsg}`)
      }
    }

    return { handleChoice }
  }

  // 新接口：内部调用其他 composables 获取依赖
  const { reviewPageRef } = options

  const gameStore = useGameStore()
  const { gameData, userActionLog } = storeToRefs(gameStore)

  const { sendPlayerChoice, isAIAvailable, generationError } = useAICommunication()

  const { success: showSuccessToast, error: showErrorToast, warning: showWarningToast } = useToast()

  const settingsStore = useSettingsStore()

  /**
   * 处理 AI 不可用的情况
   */
  const handleAIUnavailable = async (text: string) => {
    logger.warn('⚠️ AI 接口不可用,仅记录选择')
    showWarningToast(`AI 接口不可用，已记录您的选择: "${text}"`)
    await gameStore.autoSaveToWorldbook()
  }

  /**
   * 尝试更新游戏数据
   * @returns true 表示更新成功，false 表示需要重试
   */
  const tryUpdateGameData = (
    yamlContent: string,
    retryCount: number,
    maxRetries: number
  ): boolean => {
    try {
      gameStore.updateGameDataFromAI(yamlContent)
      logger.info('✅ 游戏数据已更新')
      return true
    } catch (updateError) {
      logger.error(`❌ 更新游戏数据失败 (尝试 ${retryCount + 1}/${maxRetries}):`, updateError)
      return false
    }
  }

  /**
   * 处理数据更新失败
   */
  const handleDataUpdateFailure = async (
    retryCount: number,
    maxRetries: number
  ): Promise<boolean> => {
    if (retryCount < maxRetries) {
      logger.info('🔄 数据处理失败，重新请求 AI 生成数据...')
      // 更新数据处理重试状态（显示在加载动画中）
      AIService.setDataRetryState(retryCount, '数据处理失败，正在重新请求 AI')
      await new Promise(resolve => setTimeout(resolve, 1000))
      return true // 继续重试
    } else {
      logger.error('❌ 数据处理失败次数过多，放弃重试')
      // 重置数据处理重试状态
      AIService.resetDataRetryState()
      showErrorToast('数据处理失败，请稍后重试或联系管理员')
      return false // 停止重试
    }
  }

  /**
   * 处理 AI 响应失败
   */
  const handleAIResponseFailure = (response: ParsedAIResponse | null) => {
    const errorMsg = response?.error || generationError.value || '未知错误'
    logger.error('❌ AI 响应失败:', errorMsg)
    showErrorToast(`AI 响应失败: ${errorMsg}`)
  }

  /**
   * 处理 AI 请求异常
   */
  const handleAIRequestError = (error: unknown) => {
    logger.error('❌ AI 请求失败:', error)
    const errorMsg = error instanceof Error ? error.message : '未知错误'
    showErrorToast(`AI 请求失败: ${errorMsg}`)
  }

  /**
   * 完成选择处理后的清理工作
   */
  const finalizeChoice = async () => {
    gameStore.clearUserActionLog()
    await gameStore.autoSaveToWorldbook()
    showSuccessToast('✨ 选择已处理，故事继续发展...')
  }

  /**
   * 处理玩家选择（带数据处理重试机制）
   */
  const handleChoice = async (text: string) => {
    logger.debug('玩家选择:', text)

    // 检查 AI 是否可用
    if (!isAIAvailable()) {
      await handleAIUnavailable(text)
      return
    }

    const MAX_DATA_RETRY = settingsStore.settings.maxDataRetries
    let dataRetryCount = 0
    let dataUpdateSuccess = false

    // 初始化数据处理重试状态
    AIService.resetDataRetryState()

    try {
      const summariesCount = reviewPageRef.value?.getSendCount?.() || 5

      // 数据处理重试循环
      while (dataRetryCount < MAX_DATA_RETRY) {
        try {
          const response = await sendPlayerChoice(
            gameData.value,
            text,
            userActionLog.value,
            summariesCount
          )

          if (!response || !response.success) {
            handleAIResponseFailure(response)
            // 重置数据处理重试状态
            AIService.resetDataRetryState()
            return
          }

          logger.info('✅ AI 响应成功')

          if (response.yamlContent) {
            const updateSuccess = tryUpdateGameData(
              response.yamlContent,
              dataRetryCount,
              MAX_DATA_RETRY
            )

            if (updateSuccess) {
              dataUpdateSuccess = true
              // 数据处理成功，重置重试状态
              AIService.resetDataRetryState()
              break
            }

            dataRetryCount++
            const shouldContinue = await handleDataUpdateFailure(dataRetryCount, MAX_DATA_RETRY)
            if (!shouldContinue) {
              return
            }
          }
        } catch (innerError) {
          handleAIRequestError(innerError)
          // 重置数据处理重试状态
          AIService.resetDataRetryState()
          return
        }
      }

      if (dataUpdateSuccess) {
        await finalizeChoice()
      }
    } catch (error) {
      logger.error('❌ 处理玩家选择时出错:', error)
      const errorMsg = error instanceof Error ? error.message : '未知错误'
      // 重置数据处理重试状态
      AIService.resetDataRetryState()
      showErrorToast(`处理选择时出错: ${errorMsg}`)
    }
  }

  return {
    handleChoice,
  }
}
