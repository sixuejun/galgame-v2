<!--
  Modal 组件

  通用模态框组件，用于显示对话框、确认框等。

  功能：
  - 使用 Teleport 传送到 body，避免层叠上下文问题
  - 支持自定义内容（通过 slot 或 content prop）
  - 支持多个操作按钮
  - 自动焦点管理
  - 支持 ESC 键关闭
  - 点击遮罩层关闭
  - HTML 内容自动清理（防止 XSS）
  - 无障碍支持（ARIA 属性）

  Props:
  - isVisible: 是否显示模态框
  - title: 模态框标题
  - content: 模态框内容（可选，支持 HTML）
  - buttons: 操作按钮数组

  Emits:
  - close: 当模态框关闭时触发

  Slots:
  - content: 自定义模态框内容（优先级高于 content prop）

  使用示例：
  <Modal
    :is-visible="showModal"
    title="确认操作"
    content="确定要执行此操作吗？"
    :buttons="[
      { text: '取消', class: 'secondary', action: () => closeModal() },
      { text: '确定', class: 'primary', action: () => confirmAction() }
    ]"
    @close="closeModal"
  />
-->
<template>
  <!-- 使用 Teleport 将模态框传送到 body，避免层叠上下文问题 -->
  <Teleport to="body">
    <div
      v-if="isVisible"
      class="modal-overlay"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="modalTitleId"
      @click="handleOverlayClick"
      @keydown.esc="emit('close')"
    >
      <div ref="modalRef" class="modal" tabindex="-1">
        <h2 :id="modalTitleId" class="modal-title">{{ title }}</h2>
        <div class="modal-content">
          <slot name="content">
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div v-html="sanitizedContent"></div>
          </slot>
        </div>
        <div class="modal-buttons" role="group" aria-label="模态框操作按钮">
          <button
            v-for="(btn, index) in buttons"
            :key="index"
            :ref="el => setFirstButtonRef(el as Element | null, index)"
            :class="['modal-button', btn.class]"
            @click="btn.action"
          >
            {{ btn.text }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { toRef } from 'vue'
import type { ModalButton } from '../../types'
import { useHtmlSanitizer } from '../../composables/ui/useHtmlSanitizer'
import { useModalFocus } from '../../composables/ui/useModal'

/**
 * Props 定义
 * @property {boolean} isVisible - 是否显示模态框
 * @property {string} title - 模态框标题
 * @property {string} [content] - 模态框内容（可选，支持 HTML）
 * @property {ModalButton[]} buttons - 操作按钮数组
 */
const props = defineProps<{
  /** 是否显示模态框 */
  isVisible: boolean
  /** 模态框标题 */
  title: string
  /** 模态框内容（可选，支持 HTML） */
  content?: string
  /** 操作按钮数组 */
  buttons: ModalButton[]
}>()

/**
 * Emits 定义
 * @event close - 当模态框关闭时触发
 */
const emit = defineEmits<{
  close: []
}>()

// 使用 HTML 清理 composable
const { createSanitizedContent } = useHtmlSanitizer()
const sanitizedContent = createSanitizedContent(() => props.content)

// 使用焦点管理 composable
const { modalRef, setFirstButtonRef } = useModalFocus(toRef(props, 'isVisible'))

// 生成唯一的模态框标题 ID
const modalTitleId = `modal-title-${Math.random().toString(36).substr(2, 9)}`

// 处理遮罩层点击
const handleOverlayClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget) {
    emit('close')
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal-backdrop);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  animation: fadeIn var(--transition-base) var(--ease-out);
  padding: var(--spacing-lg);
}

.modal {
  background: white;
  padding: var(--spacing-2xl);
  border-radius: var(--radius-2xl);
  max-width: 500px;
  width: 100%;
  box-shadow:
    var(--shadow-2xl),
    0 0 60px rgba(102, 126, 234, 0.4);
  border: 1px solid rgba(0, 128, 255, 0.3);
  border-top: 5px solid var(--primary-blue);
  animation: modalSlideIn var(--transition-slower) var(--ease-bounce);
  position: relative;
  z-index: var(--z-modal);
}

@keyframes modalSlideIn {
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(-30px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-title {
  color: var(--primary-blue);
  margin: 0 0 var(--spacing-lg) 0;
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  position: relative;
  z-index: 1;
  background: linear-gradient(135deg, var(--primary-blue), var(--secondary-blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.modal-content {
  margin-bottom: var(--spacing-xl);
  line-height: var(--leading-relaxed);
  color: var(--text-dark);
  font-size: var(--text-base);
  position: relative;
  z-index: 1;
}

.modal-buttons {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}

.modal-button {
  padding: 13px 32px;
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  font-weight: var(--font-semibold);
  font-size: var(--text-base);
  transition: all var(--transition-base) var(--ease-out);
  box-shadow: var(--shadow-md);
  min-width: 100px;
  min-height: 44px;
}

.modal-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.modal-button:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

.modal-button.primary {
  background: linear-gradient(135deg, var(--primary-blue), var(--secondary-blue));
  color: white;
  box-shadow:
    var(--shadow-md),
    0 0 20px rgba(0, 128, 255, 0.3);
}

.modal-button.primary:hover {
  background: linear-gradient(135deg, var(--primary-blue-dark), var(--secondary-blue-dark));
  box-shadow:
    var(--shadow-lg),
    0 0 30px rgba(0, 128, 255, 0.5);
}

.modal-button.secondary {
  background: var(--gray-100);
  color: var(--text-dark);
  border: 2px solid var(--gray-300);
}

.modal-button.secondary:hover {
  background: var(--gray-200);
  border-color: var(--gray-400);
}

.modal-button.danger {
  background: linear-gradient(135deg, var(--error), var(--error-dark));
  color: white;
  box-shadow:
    var(--shadow-md),
    0 0 20px rgba(239, 68, 68, 0.3);
}

.modal-button.danger:hover {
  background: linear-gradient(135deg, var(--error-dark), #b91c1c);
  box-shadow:
    var(--shadow-lg),
    0 0 30px rgba(239, 68, 68, 0.5);
}

@media (max-width: 480px) {
  .modal {
    padding: var(--spacing-lg);
    width: 95%;
  }

  .modal-buttons {
    flex-direction: column;
  }

  .modal-button {
    width: 100%;
  }
}
</style>
