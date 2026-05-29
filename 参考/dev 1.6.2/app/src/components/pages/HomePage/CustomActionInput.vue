<!--
  CustomActionInput 组件

  自定义动作输入组件，用于输入自定义游戏动作。

  功能：
  - 文本输入框
  - 字符计数（无上限）
  - 输入清理（防止 XSS）
  - 设备自适应快捷键支持：
    * 移动端/触摸设备：回车键换行
    * 桌面端/非触摸设备：Enter 提交，Shift+Enter 换行
  - 禁用状态控制
  - 无障碍支持

  Props:
  - modelValue (string): 当前输入值
  - disabled (boolean, 默认: false): 是否禁用

  Emits:
  - update:modelValue(value: string): 输入值变化时触发
  - submit(): 按下 Enter 键时触发
-->
<template>
  <div class="custom-action-section">
    <div class="custom-action-header">
      <i class="fas fa-pen"></i>
      <span>自定义行动</span>
    </div>
    <div class="textarea-wrapper">
      <textarea
        v-model="customAction"
        class="custom-action-input"
        :placeholder="
          isTouch ? '输入你的自定义行动...' : '输入你的自定义行动... (Enter 提交，Shift+Enter 换行)'
        "
        rows="4"
        aria-label="自定义行动输入"
        @input="handleInput"
        @keydown="handleKeyDown"
      ></textarea>
      <div class="textarea-footer">
        <span class="char-count" role="status" aria-live="polite"> {{ charCount }} 字符 </span>
        <button
          class="submit-custom-action"
          :disabled="!isValidInput"
          aria-label="提交自定义行动"
          @click="handleSubmitCustomAction"
        >
          <i class="fas fa-paper-plane"></i>
          <span>提交</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { validateAndSanitize } from '../../../utils/sanitize'
import { useToast } from '../../../composables/ui/useToast'
import { isTouchDevice } from '../../../utils/environment'

const emit = defineEmits<{
  submit: [text: string]
}>()

const { error: showErrorToast } = useToast()

const customAction = ref('')
const validationError = ref<string | null>(null)

// 检测是否为触摸设备
const isTouch = isTouchDevice()

const charCount = computed(() => customAction.value.length)

const isValidInput = computed(() => {
  const trimmed = customAction.value.trim()
  return trimmed.length > 0
})

const handleInput = () => {
  // 清除之前的验证错误
  validationError.value = null
}

const handleKeyDown = (event: KeyboardEvent) => {
  // 移动端/触摸设备：回车键换行（默认行为）
  // 桌面端/非触摸设备：Enter 提交，Shift+Enter 换行
  if (isTouch) {
    // 触摸设备：允许回车换行（不做任何处理）
    return
  }

  // 非触摸设备：Enter 键提交（不按 Shift）
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault() // 阻止默认的换行行为
    handleSubmitCustomAction()
  }
  // Shift+Enter 允许换行（默认行为）
}

const handleSubmitCustomAction = () => {
  if (!isValidInput.value) {
    return
  }

  // 验证并清理用户输入（使用较大的默认限制以避免意外截断）
  const validation = validateAndSanitize(customAction.value, 50000)

  if (!validation.valid) {
    // 显示验证错误
    validationError.value = validation.error || '输入验证失败'
    showErrorToast(validationError.value)
    return
  }

  // 提交清理后的内容
  emit('submit', validation.sanitized || customAction.value.trim())
  customAction.value = ''
  validationError.value = null
}
</script>

<style scoped>
.custom-action-section {
  margin: 0 var(--spacing-lg) var(--spacing-lg) var(--spacing-lg);
  padding: var(--spacing-lg);
  background: white;
  border-radius: var(--radius-lg);
  border: 2px solid rgba(0, 128, 255, 0.15);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all var(--transition-base) ease;
}

.custom-action-section:hover {
  border-color: rgba(0, 128, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.custom-action-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  color: var(--primary-blue);
  font-weight: var(--font-semibold);
  font-size: var(--text-base);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid rgba(0, 128, 255, 0.1);
}

.custom-action-header i {
  font-size: var(--text-lg);
}

.textarea-wrapper {
  position: relative;
}

.custom-action-input {
  width: 100%;
  padding: var(--spacing-md);
  border: 2px solid rgba(0, 128, 255, 0.15);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  transition: all var(--transition-base) ease;
  background: #f8fafc;
  color: var(--text-dark);
}

.custom-action-input:focus {
  outline: none;
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(0, 128, 255, 0.1);
  background: white;
}

.custom-action-input::placeholder {
  color: var(--text-muted);
}

.textarea-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--spacing-sm);
}

.char-count {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.submit-custom-action {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: linear-gradient(135deg, var(--primary-blue), var(--secondary-blue));
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: all var(--transition-base) ease;
  box-shadow: var(--shadow-sm);
}

.submit-custom-action:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.submit-custom-action:active:not(:disabled) {
  transform: translateY(0);
}

.submit-custom-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--gray-400);
}

.submit-custom-action i {
  font-size: var(--text-base);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .custom-action-section {
    padding: var(--spacing-md);
  }

  .custom-action-input {
    font-size: var(--text-sm);
    min-height: 80px;
  }

  .submit-custom-action {
    padding: var(--spacing-xs) var(--spacing-md);
    font-size: var(--text-xs);
  }
}
</style>
