<!--
  QuantitySelector 组件

  数量选择器组件，用于选择物品使用数量。

  功能：
  - 支持 v-model 双向绑定
  - 基于 CustomNumberInput 组件
  - 显示当前拥有的最大数量
  - 自动限制输入范围（1 到 max）
  - 响应外部 modelValue 变化

  Props:
  - max: 最大可选数量（当前拥有数量）
  - modelValue: 当前选中的数量（可选，默认为 1）

  Emits:
  - update:modelValue: 当数量变化时触发

  使用示例：
  <QuantitySelector
    v-model="quantity"
    :max="currentStock"
  />
-->
<template>
  <div class="quantity-selector">
    <label for="quantity-input" class="quantity-label"> 使用数量： </label>
    <CustomNumberInput
      id="quantity-input"
      v-model="localQuantity"
      :min="1"
      :max="max"
      label="使用数量"
      @update:model-value="handleUpdate"
    />
    <div class="quantity-hint">当前拥有：{{ max }} 个</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import CustomNumberInput from './CustomNumberInput.vue'

/**
 * Props 定义
 * @property {number} max - 最大可选数量（当前拥有数量）
 * @property {number} [modelValue] - 当前选中的数量（可选，默认为 1）
 */
const props = defineProps<{
  /** 最大可选数量（当前拥有数量） */
  max: number
  /** 当前选中的数量 */
  modelValue?: number
}>()

/**
 * Emits 定义
 * @event update:modelValue - 当数量变化时触发
 */
const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const localQuantity = ref(props.modelValue || 1)

const handleUpdate = (value: number) => {
  localQuantity.value = value
  emit('update:modelValue', value)
}

watch(
  () => props.modelValue,
  newValue => {
    if (newValue !== undefined) {
      localQuantity.value = newValue
    }
  }
)
</script>

<style scoped>
.quantity-selector {
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.quantity-label {
  font-weight: 600;
  color: var(--text-dark);
}

.quantity-hint {
  font-size: var(--text-sm);
  color: var(--text-muted);
}
</style>
