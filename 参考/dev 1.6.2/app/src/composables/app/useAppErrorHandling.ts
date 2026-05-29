/**
 * @file useAppErrorHandling.ts
 * @description 应用错误处理 Composable - 管理全局错误处理和错误提示
 * @author Eden System Team
 */

import { onMounted } from 'vue'
import { setToastCallback } from '../../utils/errorHandler'
import { logger } from '../../utils/logger'

/**
 * 应用错误处理 Composable
 *
 * 提供应用级别的错误处理功能，包括设置全局错误处理回调和错误日志记录。
 * 在组件挂载时自动设置全局 Toast 回调，确保错误能够正确显示给用户。
 *
 * 功能：
 * - 设置全局错误处理的 Toast 回调
 * - 处理应用级错误并记录日志
 * - 支持错误、警告、信息三种提示类型
 *
 * @param options 配置选项
 * @param options.showErrorToast 显示错误提示的函数
 * @param options.showWarningToast 显示警告提示的函数
 * @param options.showInfoToast 显示信息提示的函数
 * @returns 错误处理相关的方法
 *
 * @example
 * ```typescript
 * const { error, warning, info } = useToast()
 * const { handleError } = useAppErrorHandling({
 *   showErrorToast: error,
 *   showWarningToast: warning,
 *   showInfoToast: info
 * })
 *
 * // 处理错误
 * try {
 *   // 某些操作
 * } catch (err) {
 *   handleError(err as Error)
 * }
 * ```
 */
export function useAppErrorHandling(options: {
  showErrorToast: (message: string) => void
  showWarningToast: (message: string) => void
  showInfoToast: (message: string) => void
}) {
  const { showErrorToast, showWarningToast, showInfoToast } = options

  /**
   * 设置全局错误处理的 Toast 回调
   */
  onMounted(() => {
    setToastCallback((message: string, type: 'error' | 'warning' | 'info') => {
      if (type === 'error') {
        showErrorToast(message)
      } else if (type === 'warning') {
        showWarningToast(message)
      } else {
        showInfoToast(message)
      }
    })
  })

  /**
   * 处理应用级错误
   *
   * 记录错误日志并显示错误提示。
   *
   * @param error 错误对象
   * @returns void
   */
  const handleError = (error: Error) => {
    logger.error('应用级错误:', error)
    showErrorToast('应用发生错误，请查看控制台')
  }

  return {
    handleError,
  }
}
