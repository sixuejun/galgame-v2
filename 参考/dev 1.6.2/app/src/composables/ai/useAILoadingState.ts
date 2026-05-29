/**
 * @file useAILoadingState.ts
 * @description AI 加载状态管理 Composable - 管理 AI 加载动画和重试状态
 * @author Eden System Team
 */

import { ref, computed } from 'vue'
import { AIService } from '../../services/aiService'
import { useSettingsStore } from '../../stores/settingsStore'

/**
 * AI 加载场景类型
 *
 * - `init`: 初始化场景
 * - `choice`: 玩家选择场景
 * - `custom`: 自定义内容场景
 * - `retry`: 重试场景
 */
export type AILoadingScene = 'init' | 'choice' | 'custom' | 'retry'

/**
 * 全局状态（单例模式）
 */
const isLoading = ref(false)
const currentScene = ref<AILoadingScene>('choice')
const retryReason = ref<string>('')

/**
 * AI 加载状态管理 Composable
 *
 * 提供 AI 加载动画的状态管理功能，包括加载状态、场景切换、重试信息等。
 * 使用单例模式确保全局状态一致，支持 AI 请求重试和数据处理重试两种重试类型。
 *
 * 功能：
 * - 管理 AI 加载动画的显示状态
 * - 管理加载场景（初始化、玩家选择、自定义内容、重试）
 * - 管理 AI 请求重试和数据处理重试的状态
 * - 提供综合重试状态用于 UI 显示
 * - 根据场景生成加载消息
 *
 * 重构说明：
 * - 移除了 AICommunicationManager 的依赖
 * - 直接使用 AIService 获取重试信息
 *
 * @returns AI 加载状态相关的状态和方法
 *
 * @example
 * ```typescript
 * const {
 *   isLoading,
 *   startLoading,
 *   stopLoading,
 *   isAnyRetrying,
 *   currentRetryCount,
 *   currentMaxRetries
 * } = useAILoadingState()
 *
 * // 开始加载
 * startLoading('choice')
 *
 * // 停止加载
 * stopLoading()
 *
 * // 检查是否正在重试
 * if (isAnyRetrying.value) {
 *   console.log(`重试中: ${currentRetryCount.value}/${currentMaxRetries.value}`)
 * }
 * ```
 */
export function useAILoadingState() {
  const settingsStore = useSettingsStore()

  /**
   * 是否正在进行 AI 请求重试
   */
  const isRetrying = computed(() => {
    return AIService.getRetryCount() > 0
  })

  /**
   * 当前 AI 请求重试次数
   */
  const retryCount = computed(() => {
    return AIService.getRetryCount()
  })

  /**
   * 最大 AI 请求重试次数
   */
  const maxRetries = computed(() => {
    return settingsStore.settings.maxRetries
  })

  /**
   * AI 请求重试原因（从 AIService 获取）
   */
  const retryReasonFromService = computed(() => {
    return AIService.getRetryReason()
  })

  /**
   * 是否正在进行数据处理重试
   */
  const isDataRetrying = computed(() => {
    return AIService.getDataRetryCount() > 0
  })

  /**
   * 当前数据处理重试次数
   */
  const dataRetryCount = computed(() => {
    return AIService.getDataRetryCount()
  })

  /**
   * 数据处理重试原因
   */
  const dataRetryReason = computed(() => {
    return AIService.getDataRetryReason()
  })

  /**
   * 最大数据处理重试次数
   */
  const maxDataRetries = computed(() => {
    return settingsStore.settings.maxDataRetries
  })

  /**
   * 综合重试状态（AI 请求重试或数据处理重试）
   */
  const isAnyRetrying = computed(() => {
    return isRetrying.value || isDataRetrying.value
  })

  /**
   * 综合重试次数（优先显示数据处理重试）
   */
  const currentRetryCount = computed(() => {
    return isDataRetrying.value ? dataRetryCount.value : retryCount.value
  })

  /**
   * 综合重试原因（优先显示数据处理重试）
   */
  const currentRetryReason = computed(() => {
    return isDataRetrying.value ? dataRetryReason.value : retryReasonFromService.value
  })

  /**
   * 综合最大重试次数（优先显示数据处理重试）
   */
  const currentMaxRetries = computed(() => {
    return isDataRetrying.value ? maxDataRetries.value : maxRetries.value
  })

  /**
   * 根据场景获取加载消息
   *
   * 根据当前加载场景返回对应的加载提示消息。
   * 注意：重试信息由 LoadingSpinner 组件单独显示，这里只返回场景消息。
   *
   * @returns 加载消息字符串
   */
  const getLoadingMessage = computed(() => {
    // 根据场景返回不同的消息
    switch (currentScene.value) {
      case 'init':
        return '正在初始化游戏世界...'
      case 'choice':
        return 'AI 正在思考中，请稍候...'
      case 'custom':
        return '正在处理您的自定义内容...'
      case 'retry':
        return '正在重试上一次请求...'
      default:
        return 'AI 正在思考中，请稍候...'
    }
  })

  /**
   * 开始加载
   *
   * 设置加载状态为 true 并切换到指定场景。
   *
   * @param scene 加载场景（默认为 'choice'）
   * @param reason 重试原因（可选）
   * @returns void
   */
  const startLoading = (scene: AILoadingScene = 'choice', reason?: string) => {
    isLoading.value = true
    currentScene.value = scene
    if (reason) {
      retryReason.value = reason
    }
  }

  /**
   * 停止加载
   *
   * 设置加载状态为 false。
   * 注意：不清空 retryReason，因为它在整个请求过程中都需要保持。
   *
   * @returns void
   */
  const stopLoading = () => {
    isLoading.value = false
    // 不清空 retryReason，让它在下次 startLoading 时被覆盖
  }

  /**
   * 设置重试原因
   *
   * 手动设置重试原因（通常由 AIService 自动设置）。
   *
   * @param reason 重试原因
   * @returns void
   */
  const setRetryReason = (reason: string) => {
    retryReason.value = reason
  }

  return {
    // 状态
    isLoading,
    currentScene,

    // AI 请求重试状态
    retryReason: retryReasonFromService, // 使用从 AIService 获取的重试原因
    isRetrying,
    retryCount,
    maxRetries,

    // 数据处理重试状态
    isDataRetrying,
    dataRetryCount,
    dataRetryReason,
    maxDataRetries,

    // 综合重试状态（用于 UI 显示）
    isAnyRetrying,
    currentRetryCount,
    currentRetryReason,
    currentMaxRetries,

    // 计算属性
    getLoadingMessage,

    // 方法
    startLoading,
    stopLoading,
    setRetryReason,
  }
}
