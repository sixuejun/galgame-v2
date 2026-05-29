<!--
  UserInputSection 组件

  用户附加输入组件，用于输入自定义设定信息。

  功能：
  - 显示用户输入文本框
  - 支持 v-model 双向绑定
  - 字符计数（无上限）
  - 输入清理（防止 XSS）
  - 设备自适应快捷键支持：
    * 移动端/触摸设备：回车键换行
    * 桌面端/非触摸设备：Enter 提交，Shift+Enter 换行

  Props:
  - modelValue (string): 当前输入值

  Emits:
  - update:modelValue(value: string): 输入值变化时触发
  - submit(): 按下 Enter 键时触发
-->
<template>
  <div class="user-input-section">
    <h2 class="section-title">
      <i class="fas fa-pen"></i>
      附加设定信息（可选）
    </h2>
    <p class="input-hint">
      您可以在此输入角色背景、世界观设定、特殊规则等信息，AI 将结合这些信息生成初始化数据。{{
        isTouch ? '' : '(Enter 提交，Shift+Enter 换行)'
      }}
    </p>
    <textarea
      :model-value="modelValue"
      class="user-input-textarea"
      placeholder="例如：&#10;- 角色名称：张三&#10;- 背景设定：现代都市，科技发达&#10;- 特殊规则：游戏难度为困难模式&#10;&#10;留空则使用默认设定..."
      rows="8"
      @input="handleInput"
      @keydown="handleKeyDown"
    ></textarea>
    <div class="char-count">{{ modelValue.length }} 字符</div>
  </div>
</template>

<script setup lang="ts">
import { sanitizeUserInput } from '../../../utils/sanitize'
import { isTouchDevice } from '../../../utils/environment'

interface Props {
  modelValue: string
}

defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  submit: []
}>()

// 检测是否为触摸设备
const isTouch = isTouchDevice()

const handleInput = (event: Event) => {
  const target = event.target
  if (!target || !('value' in target)) return
  const input = String(target.value)

  // 使用统一的清理函数移除潜在的危险字符
  const cleaned = sanitizeUserInput(input)

  emit('update:modelValue', cleaned)
}

const handleKeyDown = (event: Event) => {
  const keyEvent = event as KeyboardEvent

  // 移动端/触摸设备：回车键换行（默认行为）
  // 桌面端/非触摸设备：Enter 提交，Shift+Enter 换行
  if (isTouch) {
    // 触摸设备：允许回车换行（不做任何处理）
    return
  }

  // 非触摸设备：Enter 键提交（不按 Shift）
  if (keyEvent.key === 'Enter' && !keyEvent.shiftKey) {
    keyEvent.preventDefault() // 阻止默认的换行行为
    emit('submit')
  }
  // Shift+Enter 允许换行（默认行为）
}
</script>

<style scoped>
/* 用户输入区域 */
.user-input-section {
  margin-bottom: var(--spacing-xl);
}

/* 区域标题 */
.section-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--primary-blue);
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.section-title i {
  font-size: var(--text-xl);
}

.input-hint {
  color: var(--text-muted);
  font-size: var(--text-sm);
  margin-bottom: var(--spacing-md);
  line-height: 1.6;
}

.user-input-textarea {
  width: 100%;
  background: #f8fafc;
  border: 2px solid rgba(0, 128, 255, 0.2);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  color: var(--text-dark);
  font-size: var(--text-base);
  line-height: 1.6;
  resize: vertical;
  transition: all var(--transition-base);
  font-family: inherit;
}

.user-input-textarea:focus {
  outline: none;
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(0, 128, 255, 0.1);
  background: white;
}

.user-input-textarea::placeholder {
  color: var(--text-muted);
}

.char-count {
  text-align: right;
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin-top: var(--spacing-xs);
}

@media (max-width: 480px) {
  .section-title {
    font-size: var(--text-base);
  }

  .user-input-textarea {
    font-size: var(--text-sm);
  }
}
</style>
