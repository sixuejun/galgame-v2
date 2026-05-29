/**
 * @file useAILoadingOverlay.ts
 * @description AI 加载遮罩管理 Composable - 管理 AI 加载状态和加载消息的显示
 * @author Eden System Team
 */

import { ref, computed, watch, type Ref } from 'vue'
import { useAILoadingState } from '../ai/useAILoadingState'

/**
 * AI 加载遮罩管理 Composable
 *
 * 提供 AI 加载遮罩的状态管理功能，包括加载状态、加载消息和重试信息。
 * 监听 AI 生成状态并同步到加载遮罩显示。
 *
 * 功能：
 * - 管理 AI 加载遮罩的显示状态
 * - 提供动态加载消息
 * - 提供重试状态和重试信息
 * - 自动同步 AI 生成状态
 *
 * @param options 配置选项
 * @param options.isGenerating AI 是否正在生成的响应式引用
 * @returns AI 加载遮罩相关的状态
 *
 * @example
 * ```typescript
 * const isGenerating = ref(false)
 * const {
 *   isLoadingAI,
 *   aiLoadingMessage,
 *   isAnyRetrying,
 *   currentRetryCount,
 *   currentMaxRetries
 * } = useAILoadingOverlay({ isGenerating })
 *
 * // 显示加载遮罩
 * isGenerating.value = true
 * console.log(aiLoadingMessage.value) // "AI 正在思考中，请稍候..."
 * ```
 */
export function useAILoadingOverlay(options: { isGenerating: Ref<boolean> }) {
  const { isGenerating } = options

  const isLoadingAI = ref(false)
  const {
    getLoadingMessage,
    isAnyRetrying,
    currentRetryCount,
    currentMaxRetries,
    currentRetryReason,
  } = useAILoadingState()

  /**
   * 动态加载消息（根据当前场景）
   */
  const aiLoadingMessage = computed(() => getLoadingMessage.value)

  /**
   * 监听 AI 生成状态，同步到加载遮罩
   */
  watch(isGenerating, newValue => {
    isLoadingAI.value = newValue
  })

  return {
    isLoadingAI,
    aiLoadingMessage,
    isAnyRetrying,
    currentRetryCount,
    currentMaxRetries,
    currentRetryReason,
  }
}
