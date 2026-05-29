/**
 * @file useToast.ts
 * @description Toast 通知管理 Composable - 提供全局 Toast 通知功能
 * @author Eden System Team
 */

import { ref } from 'vue'
import { TOAST_DURATION } from '../../constants'

/**
 * Toast 通知项
 */
export interface Toast {
  /** Toast ID */
  id: number
  /** 通知消息 */
  message: string
  /** 通知类型 */
  type: 'success' | 'error' | 'info' | 'warning'
  /** 显示时长(毫秒) */
  duration: number
}

const toasts = ref<Toast[]>([])
let toastIdCounter = 0

/**
 * Toast 通知管理 Composable
 *
 * 提供全局 Toast 通知功能。
 *
 * @returns Toast 状态和操作方法
 */
export function useToast() {
  /**
   * 显示 Toast 通知
   */
  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    duration: number = TOAST_DURATION.NORMAL
  ) => {
    const id = ++toastIdCounter
    const toast: Toast = {
      id,
      message,
      type,
      duration,
    }

    toasts.value.push(toast)

    // 自动移除
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }

  /**
   * 移除 Toast 通知
   */
  const removeToast = (id: number) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  /**
   * 成功通知
   */
  const success = (message: string, duration?: number) => {
    return showToast(message, 'success', duration)
  }

  /**
   * 错误通知
   */
  const error = (message: string, duration?: number) => {
    return showToast(message, 'error', duration)
  }

  /**
   * 信息通知
   */
  const info = (message: string, duration?: number) => {
    return showToast(message, 'info', duration)
  }

  /**
   * 警告通知
   */
  const warning = (message: string, duration?: number) => {
    return showToast(message, 'warning', duration)
  }

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    info,
    warning,
  }
}
