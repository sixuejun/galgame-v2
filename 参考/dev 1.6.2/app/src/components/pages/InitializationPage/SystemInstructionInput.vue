<!--
  SystemInstructionInput 组件

  系统指令输入组件，用于自定义初始化指令。

  功能：
  - 显示系统指令输入框
  - 支持 v-model 双向绑定
  - 显示默认指令占位符
  - 输入提示信息

  Props:
  - modelValue (string): 当前输入值
  - placeholder (string): 占位符文本

  Emits:
  - update:modelValue(value: string): 输入值变化时触发
-->
<template>
  <div class="system-instruction-section">
    <h2 class="section-title">
      <i class="fas fa-book"></i>
      系统初始化指令
    </h2>
    <p class="input-hint">
      您可以自定义系统初始化指令，或使用下方预设的默认指令。留空则使用默认指令。
    </p>
    <textarea
      :model-value="modelValue"
      class="system-instruction-textarea"
      :placeholder="placeholder"
      rows="6"
      @input="handleInput"
    ></textarea>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string
  placeholder: string
}

defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const handleInput = (event: Event) => {
  const target = event.target
  if (target && 'value' in target) {
    emit('update:modelValue', String(target.value))
  }
}
</script>

<style scoped>
/* 系统指令区域 */
.system-instruction-section {
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

.system-instruction-textarea {
  width: 100%;
  background: #f8fafc;
  border: 2px solid rgba(0, 128, 255, 0.2);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  color: var(--text-dark);
  font-size: var(--text-sm);
  line-height: 1.6;
  resize: vertical;
  transition: all var(--transition-base);
  font-family: 'Courier New', monospace;
}

.system-instruction-textarea:focus {
  outline: none;
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(0, 128, 255, 0.1);
  background: white;
}

.system-instruction-textarea::placeholder {
  color: var(--text-muted);
}

@media (max-width: 480px) {
  .section-title {
    font-size: var(--text-base);
  }
}
</style>
