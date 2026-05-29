/**
 * @file useAICommunication.ts
 * @description AI 通信 Composable - 管理与 AI 服务的通信和状态
 * @author Eden System Team
 */

import { ref } from 'vue'
import type { GameData, UserAction } from '../../types'
import { AIService, type ParsedAIResponse } from '../../services/aiService'
import { useAILoadingState } from './useAILoadingState'
import { logger } from '../../utils/logger'

/**
 * AI 通信状态（全局单例）
 */
const isGenerating = ref(false)
const lastResponse = ref<ParsedAIResponse | null>(null)
const generationError = ref<string | null>(null)

/**
 * AI 通信 Composable
 *
 * 提供与 AI 服务通信的功能，包括发送玩家选择、重试请求等。
 * 使用单例模式管理全局通信状态，确保同一时间只有一个 AI 请求在进行。
 *
 * 功能：
 * - 发送玩家选择到 AI 并获取响应
 * - 重试上一次失败的请求
 * - 管理 AI 生成状态和错误信息
 * - 自动控制加载动画的显示
 *
 * 重构说明：
 * - 移除了 AICommunicationManager 的依赖
 * - 直接调用 AIService（已包含重试和解析逻辑）
 * - 简化了调用链
 *
 * @returns AI 通信相关的状态和方法
 *
 * @example
 * ```typescript
 * const { sendPlayerChoice, retryLastRequest, isGenerating, lastResponse } = useAICommunication()
 *
 * // 发送玩家选择
 * const response = await sendPlayerChoice(gameData, "我选择向左走", userActionLog, 5)
 * if (response) {
 *   console.log('AI 响应:', response)
 * }
 *
 * // 重试上一次请求
 * const retryResponse = await retryLastRequest()
 * ```
 */
export function useAICommunication() {
  const { startLoading, stopLoading } = useAILoadingState()

  /**
   * 发送玩家选择到 AI
   *
   * 将玩家的选择发送给 AI 服务，并返回解析后的响应。
   * 如果当前正在生成中，则拒绝新的请求。
   *
   * @param gameData 当前游戏数据
   * @param playerChoice 玩家选择的文本
   * @param userActionLog 用户操作日志
   * @param summariesCount 发送给AI的摘要条数（可选，默认5）
   * @returns 解析后的 AI 响应，如果失败或正在生成中则返回 null
   *
   * @throws 不会抛出异常，所有错误都会被捕获并记录到 generationError
   */
  const sendPlayerChoice = async (
    gameData: GameData,
    playerChoice: string,
    userActionLog: UserAction[],
    summariesCount: number = 5
  ): Promise<ParsedAIResponse | null> => {
    if (isGenerating.value) {
      logger.warn('⚠️ AI 正在生成中,请稍候')
      return null
    }

    isGenerating.value = true
    generationError.value = null
    lastResponse.value = null

    // 设置加载场景为 'choice'（玩家选择）
    startLoading('choice')

    try {
      // 直接调用 AIService（已包含重试和解析逻辑）
      const response = await AIService.sendPlayerChoice(
        gameData,
        playerChoice,
        userActionLog,
        summariesCount
      )

      lastResponse.value = response
      logger.info('✅ AI 通信完成')
      return response
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误'
      generationError.value = errorMsg
      logger.error('❌ AI 通信失败:', error)
      return null
    } finally {
      isGenerating.value = false
      stopLoading()
    }
  }

  /**
   * 重试上一次的请求
   *
   * 使用 AIService 的重试功能重新发送上一次失败的请求。
   * 如果当前正在生成中，则拒绝重试请求。
   *
   * @returns 解析后的 AI 响应，如果失败或正在生成中则返回 null
   *
   * @throws 不会抛出异常，所有错误都会被捕获并记录到 generationError
   */
  const retryLastRequest = async (): Promise<ParsedAIResponse | null> => {
    if (isGenerating.value) {
      logger.warn('⚠️ AI 正在生成中,请稍候')
      return null
    }

    isGenerating.value = true
    generationError.value = null

    // 设置加载场景为 'retry'（重试请求）
    startLoading('retry')

    try {
      const response = await AIService.retryLastRequest()

      lastResponse.value = response
      logger.info('✅ 重试成功')
      return response
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误'
      generationError.value = errorMsg
      logger.error('❌ 重试失败:', error)
      return null
    } finally {
      isGenerating.value = false
      stopLoading()
    }
  }

  /**
   * 检查 AI 通信是否可用
   *
   * 检查 AI 服务是否已配置且可用。
   *
   * @returns 是否可用
   */
  const isAIAvailable = (): boolean => {
    return AIService.isGenerateAvailable()
  }

  /**
   * 发送初始化请求
   *
   * 发送游戏初始化请求到 AI，用于生成初始游戏数据。
   *
   * @param systemInstruction 系统指令（包含初始化要求）
   * @param userInput 用户输入（用户的自定义设定）
   * @returns 解析后的 AI 响应，如果失败或正在生成中则返回 null
   *
   * @throws 不会抛出异常，所有错误都会被捕获并记录到 generationError
   */
  const sendInitRequest = async (
    systemInstruction: string,
    userInput: string
  ): Promise<ParsedAIResponse | null> => {
    if (isGenerating.value) {
      logger.warn('⚠️ AI 正在生成中，请稍候')
      return null
    }

    isGenerating.value = true
    generationError.value = null
    lastResponse.value = null

    // 设置加载场景为 'init'（初始化）
    startLoading('init')

    try {
      logger.info('🚀 开始生成初始化数据...')

      // 构建发送给 AI 的内容
      let promptContent = systemInstruction
      if (userInput && userInput.trim() !== '') {
        promptContent += '\n\n用户附加设定信息：\n' + userInput
      }

      // 直接调用 AIService
      const response = await AIService.sendPlayerChoice({}, promptContent, [])

      lastResponse.value = response
      logger.info('✅ 初始化请求完成')
      return response
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误'
      generationError.value = errorMsg
      logger.error('❌ 初始化请求失败:', errorMsg)
      return null
    } finally {
      isGenerating.value = false
      stopLoading()
    }
  }

  /**
   * 清除缓存
   *
   * 清除 AI 服务的缓存、上一次响应和错误信息，并重置重试计数。
   *
   * @returns void
   */
  const clearCache = (): void => {
    AIService.clearCache()
    lastResponse.value = null
    generationError.value = null
    AIService.resetRetryCount()
  }

  return {
    // 状态
    isGenerating,
    lastResponse,
    generationError,

    // 方法
    sendPlayerChoice,
    retryLastRequest,
    sendInitRequest,
    isAIAvailable,
    clearCache,
  }
}
