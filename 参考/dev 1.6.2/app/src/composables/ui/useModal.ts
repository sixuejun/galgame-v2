/**
 * @file useModal.ts
 * @description 模态框管理 Composable - 提供模态框状态管理和焦点管理功能
 * @author Eden System Team
 */

import { ref, watch, nextTick, onMounted, onUnmounted, type Ref } from 'vue'
import type { ModalButton } from '../../types'

const isVisible = ref(false)
const title = ref('')
const content = ref('')
const buttons = ref<ModalButton[]>([])

/**
 * 模态框管理 Composable
 *
 * 包含模态框状态管理和焦点管理功能。
 *
 * @returns 模态框状态和操作方法
 */
export function useModal() {
  /**
   * 显示模态框
   */
  const showModal = (
    modalTitle: string,
    modalContent: string,
    modalButtons: ModalButton[] | null = null
  ) => {
    title.value = modalTitle
    content.value = modalContent
    buttons.value = modalButtons || [
      {
        text: '确定',
        class: 'primary',
        action: hideModal,
      },
    ]
    isVisible.value = true
  }

  /**
   * 显示确认对话框
   * @param modalTitle 标题
   * @param modalContent 内容
   * @param confirmText 确认按钮文本
   * @param cancelText 取消按钮文本
   * @returns Promise<boolean> 用户是否确认
   */
  const showConfirm = (
    modalTitle: string,
    modalContent: string,
    confirmText: string = '确定',
    cancelText: string = '取消'
  ): Promise<boolean> => {
    return new Promise(resolve => {
      title.value = modalTitle
      content.value = modalContent
      buttons.value = [
        {
          text: cancelText,
          class: 'secondary',
          action: () => {
            hideModal()
            resolve(false)
          },
        },
        {
          text: confirmText,
          class: 'primary',
          action: () => {
            hideModal()
            resolve(true)
          },
        },
      ]
      isVisible.value = true
    })
  }

  /**
   * 隐藏模态框
   */
  const hideModal = () => {
    isVisible.value = false
  }

  return {
    isVisible,
    title,
    content,
    buttons,
    showModal,
    showConfirm,
    hideModal,
  }
}

/**
 * 模态框焦点管理 Composable
 * 处理焦点陷阱和自动聚焦功能
 */
export function useModalFocus(isVisible: Ref<boolean>) {
  const modalRef = ref<HTMLElement | null>(null)
  const firstButtonRef = ref<HTMLButtonElement | null>(null)

  /**
   * 设置第一个按钮的引用
   */
  const setFirstButtonRef = (el: Element | null, index: number) => {
    if (index === 0 && el instanceof HTMLButtonElement) {
      firstButtonRef.value = el
    }
  }

  /**
   * 焦点管理：模态框打开时聚焦到第一个按钮
   */
  watch(isVisible, async newVal => {
    if (newVal) {
      await nextTick()
      if (firstButtonRef.value && typeof firstButtonRef.value.focus === 'function') {
        firstButtonRef.value.focus()
      } else if (modalRef.value) {
        modalRef.value.focus()
      }
    }
  })

  /**
   * 焦点陷阱：防止焦点离开模态框
   */
  const handleFocusTrap = (e: KeyboardEvent) => {
    if (!isVisible.value || !modalRef.value) return

    if (e.key === 'Tab') {
      const focusableElements = modalRef.value.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleFocusTrap)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleFocusTrap)
  })

  return {
    modalRef,
    firstButtonRef,
    setFirstButtonRef,
  }
}
