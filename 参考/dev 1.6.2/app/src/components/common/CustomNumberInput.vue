<!--
  CustomNumberInput 组件

  自定义数字输入组件，用于输入数字值。

  功能：
  - 数字输入框
  - 增加/减少按钮
  - 最小值/最大值限制
  - 输入验证
  - 禁用状态控制
  - 无障碍支持

  Props:
  - modelValue (number): 当前值
  - min (number, 默认: 0): 最小值
  - max (number, 默认: 100): 最大值
  - step (number, 默认: 1): 步长
  - disabled (boolean, 默认: false): 是否禁用

  Emits:
  - update:modelValue(value: number): 值变化时触发
-->
<template>
  <div class="custom-number-input">
    <button
      class="number-btn decrease"
      :disabled="isMinDisabled"
      :aria-label="`减少${label || '数值'}`"
      @click="decrease"
    >
      <i class="fas fa-minus"></i>
    </button>
    <input
      :value="modelValue"
      type="number"
      :min="min"
      :max="max"
      :step="step"
      :aria-label="label"
      class="number-input"
      @input="handleInput"
      @blur="handleBlur"
    />
    <button
      class="number-btn increase"
      :disabled="isMaxDisabled"
      :aria-label="`增加${label || '数值'}`"
      @click="increase"
    >
      <i class="fas fa-plus"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: number
  min?: number
  max?: number
  step?: number
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 100,
  step: 1,
  label: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

// Props 验证
if (import.meta.env.DEV) {
  if (props.min >= props.max) {
    console.warn(
      `[CustomNumberInput] Props 验证失败: min (${props.min}) 应该小于 max (${props.max})`
    )
  }

  if (props.step <= 0) {
    console.warn(`[CustomNumberInput] Props 验证失败: step (${props.step}) 应该大于 0`)
  }

  if (props.modelValue < props.min || props.modelValue > props.max) {
    console.warn(
      `[CustomNumberInput] Props 验证失败: modelValue (${props.modelValue}) 应该在 [${props.min}, ${props.max}] 范围内`
    )
  }
}

const isMinDisabled = computed(() => props.modelValue <= props.min)
const isMaxDisabled = computed(() => props.modelValue >= props.max)

const decrease = () => {
  if (!isMinDisabled.value) {
    const newValue = Math.max(props.min, props.modelValue - props.step)
    emit('update:modelValue', newValue)
  }
}

const increase = () => {
  if (!isMaxDisabled.value) {
    const newValue = Math.min(props.max, props.modelValue + props.step)
    emit('update:modelValue', newValue)
  }
}

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  let value = parseFloat(target.value)

  if (isNaN(value)) {
    value = props.min
  }

  value = Math.max(props.min, Math.min(props.max, value))
  emit('update:modelValue', value)
}

const handleBlur = (event: Event) => {
  const target = event.target as HTMLInputElement
  let value = parseFloat(target.value)

  if (isNaN(value)) {
    value = props.min
  }

  value = Math.max(props.min, Math.min(props.max, value))
  emit('update:modelValue', value)
  target.value = value.toString()
}
</script>

<style scoped>
.custom-number-input {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  background: white;
  border: 2px solid var(--gray-300);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xs);
  transition: all var(--transition-base);
}

.custom-number-input:focus-within {
  border-color: var(--primary-blue);
  box-shadow: 0 0 0 3px rgba(0, 128, 255, 0.1);
}

.number-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: var(--gray-100);
  color: var(--text-dark);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
  font-size: var(--text-sm);
}

.number-btn:hover:not(:disabled) {
  background: var(--primary-blue);
  color: white;
  transform: scale(1.1);
}

.number-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.number-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.number-input {
  width: 60px;
  height: 32px;
  border: none;
  background: transparent;
  text-align: center;
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-dark);
  outline: none;
}

/* 隐藏浏览器默认的增减按钮 */
.number-input::-webkit-inner-spin-button,
.number-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  appearance: none;
  margin: 0;
}

.number-input[type='number'] {
  -moz-appearance: textfield;
  appearance: textfield;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .number-btn {
    width: 24px;
    height: 24px;
    font-size: var(--text-xs);
  }

  .number-input {
    width: 50px;
    height: 28px;
    font-size: var(--text-sm);
  }
}
</style>
