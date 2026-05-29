<!--
  QuantityControl 组件

  数量控制组件，用于调整购物车商品数量。

  功能：
  - 减少数量按钮
  - 数量输入框
  - 增加数量按钮
  - 最小值/最大值限制
  - 输入验证
  - 无障碍支持

  Props:
  - modelValue (number): 当前数量
  - min (number, 默认: 1): 最小数量
  - max (number, 默认: 999): 最大数量

  Emits:
  - update:modelValue(value: number): 数量变化时触发
-->
<template>
  <div class="quantity-controls">
    <button
      class="quantity-btn decrease"
      :disabled="quantity <= 1"
      aria-label="减少数量"
      @click="handleDecrease"
    >
      <i class="fas fa-minus"></i>
    </button>
    <input
      type="number"
      class="quantity-input"
      :value="quantity"
      min="1"
      max="99"
      aria-label="商品数量"
      @input="handleInput"
    />
    <button
      class="quantity-btn increase"
      :disabled="quantity >= 99"
      aria-label="增加数量"
      @click="handleIncrease"
    >
      <i class="fas fa-plus"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  quantity: number
}

interface Emits {
  (e: 'decrease'): void
  (e: 'increase'): void
  (e: 'update-quantity', quantity: number): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const handleDecrease = () => {
  emit('decrease')
}

const handleIncrease = () => {
  emit('increase')
}

const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  const quantity = Math.max(1, Math.min(99, parseInt(target.value) || 1))
  emit('update-quantity', quantity)
}
</script>

<style scoped>
.quantity-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--gray-100);
  border-radius: var(--radius-lg);
  padding: 4px;
}

.quantity-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: white;
  color: var(--primary-blue);
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base) ease;
  font-size: var(--text-sm);
}

.quantity-btn:hover:not(:disabled) {
  background: var(--primary-blue);
  color: white;
  transform: scale(1.1);
}

.quantity-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.quantity-input {
  width: 50px;
  height: 32px;
  border: none;
  background: white;
  text-align: center;
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--text-dark);
  border-radius: var(--radius-md);
  outline: none;
}

.quantity-input::-webkit-inner-spin-button,
.quantity-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  appearance: none;
  margin: 0;
}

.quantity-input[type='number'] {
  -moz-appearance: textfield;
  appearance: textfield;
}

/* 响应式设计 - 平板端 (768px-1024px) */
@media (max-width: 1024px) and (min-width: 769px) {
  .quantity-btn {
    width: 28px;
    height: 28px;
    font-size: 11px;
  }

  .quantity-input {
    width: 45px;
    height: 28px;
    font-size: 12px;
  }
}

/* 响应式设计 - 移动端 (<768px) */
@media (max-width: 768px) {
  .quantity-controls {
    gap: 2px;
    padding: 2px;
  }

  .quantity-btn {
    width: 32px;
    height: 32px;
    font-size: 12px;
    min-width: 32px;
    min-height: 32px;
  }

  .quantity-input {
    width: 40px;
    height: 32px;
    font-size: 12px;
  }
}

/* 小屏模式优化 (<480px) */
@media (max-width: 480px) {
  .quantity-btn {
    width: 28px;
    height: 28px;
    font-size: 10px;
    min-width: 28px;
    min-height: 28px;
  }

  .quantity-input {
    width: 36px;
    height: 28px;
    font-size: 11px;
  }
}
</style>
