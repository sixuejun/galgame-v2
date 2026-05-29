<!--
  CouponCard 组件

  优惠券卡片组件，显示单个优惠券信息。

  功能：
  - 显示优惠券信息（图标、名称、描述）
  - 选中状态样式
  - 点击选择
  - 无障碍支持

  Props:
  - coupon (Coupon): 优惠券数据对象
  - isSelected (boolean, 默认: false): 是否选中

  Emits:
  - select(): 点击卡片时触发
-->
<template>
  <div :class="['coupon-card', { selected: isSelected }]" @click="handleSelect">
    <div class="coupon-icon">{{ coupon.icon }}</div>
    <div class="coupon-info">
      <h5 class="coupon-name">{{ coupon.name }}</h5>
      <p class="coupon-desc">{{ coupon.description }}</p>
    </div>
    <div v-if="isSelected" class="coupon-selected">
      <i class="fas fa-check-circle"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Item } from '../../../types'

interface Props {
  coupon: Item
  isSelected: boolean
}

interface Emits {
  (e: 'select', couponId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleSelect = () => {
  emit('select', props.coupon.id)
}
</script>

<style scoped>
.coupon-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: white;
  border: 2px solid var(--gray-200);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base) ease;
  position: relative;
}

.coupon-card:hover {
  border-color: var(--accent-pink);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.coupon-card.selected {
  border-color: var(--accent-pink);
  background: linear-gradient(135deg, rgba(255, 105, 180, 0.1), rgba(255, 20, 147, 0.05));
  box-shadow: 0 4px 12px rgba(255, 105, 180, 0.3);
}

.coupon-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  background: linear-gradient(135deg, rgba(255, 105, 180, 0.2), rgba(255, 20, 147, 0.1));
  border-radius: var(--radius-lg);
}

.coupon-info {
  flex: 1;
  min-width: 0;
}

.coupon-name {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-dark);
  margin: 0 0 var(--spacing-xs) 0;
}

.coupon-desc {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin: 0;
  line-height: 1.4;
}

.coupon-selected {
  flex-shrink: 0;
  color: var(--accent-pink);
  font-size: var(--text-xl);
  animation: scaleIn var(--transition-base) ease;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

/* 响应式设计 - 移动端 (<768px) */
@media (max-width: 768px) {
  .coupon-card {
    padding: var(--spacing-sm);
    gap: var(--spacing-sm);
    min-height: 44px;
  }

  .coupon-icon {
    width: 40px;
    height: 40px;
    font-size: 24px;
  }

  .coupon-name {
    font-size: var(--text-sm);
    margin: 0 0 2px 0;
  }

  .coupon-desc {
    font-size: 11px;
    line-height: 1.3;
  }

  .coupon-selected {
    font-size: var(--text-base);
  }
}

/* 小屏模式优化 (<480px) */
@media (max-width: 480px) {
  .coupon-card {
    padding: 6px;
    gap: 6px;
    min-height: 40px;
  }

  .coupon-icon {
    width: 36px;
    height: 36px;
    font-size: 20px;
  }

  .coupon-name {
    font-size: 12px;
    margin: 0 0 1px 0;
  }

  .coupon-desc {
    font-size: 10px;
    line-height: 1.2;
  }

  .coupon-selected {
    font-size: var(--text-sm);
  }
}
</style>
