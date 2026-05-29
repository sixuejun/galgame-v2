<!--
  CartSummary 组件

  购物车摘要组件，显示购物车总计和优惠券。

  功能：
  - 显示商品总价
  - 优惠券选择和应用
  - 显示折扣金额
  - 显示最终总价
  - 结算按钮
  - 可折叠/展开
  - 无障碍支持

  Props:
  - subtotal (number): 商品小计
  - discount (number): 折扣金额
  - total (number): 最终总价
  - currency (number): 当前货币
  - coupons (Coupon[]): 可用优惠券列表
  - selectedCouponId (string | null): 已选优惠券 ID

  Emits:
  - select-coupon(couponId: string | null): 选择优惠券时触发
  - checkout(): 点击结算时触发
-->
<template>
  <div class="checkout-section">
    <header class="section-header" @click="toggleExpanded">
      <div class="header-left">
        <i class="fas fa-calculator"></i>
        <span v-if="isExpanded">价格汇总</span>
        <span v-else class="collapsed-summary">
          💰 实付: <strong>¥{{ finalPrice.toLocaleString() }}</strong>
        </span>
      </div>
      <i :class="['fas', 'toggle-icon', isExpanded ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
    </header>

    <transition name="expand">
      <div v-show="isExpanded" class="price-summary">
        <div class="summary-row">
          <span class="label">商品总数：</span>
          <span class="value">{{ itemsCount }} 件</span>
        </div>
        <div class="summary-row">
          <span class="label">商品总价：</span>
          <span class="value">¥{{ totalPrice.toLocaleString() }}</span>
        </div>
        <div v-if="discountAmount > 0" class="summary-row discount">
          <span class="label">优惠金额：</span>
          <span class="value">-¥{{ discountAmount.toLocaleString() }}</span>
        </div>
        <div class="summary-row total">
          <span class="label">实付金额：</span>
          <span class="value final-price">¥{{ finalPrice.toLocaleString() }}</span>
        </div>
      </div>
    </transition>

    <!-- 操作按钮 - 始终显示，不受折叠影响 -->
    <div class="action-buttons">
      <button class="btn-secondary" @click.stop="$emit('clear')">
        <i class="fas fa-broom"></i>
        <span>清空购物车</span>
      </button>
      <button class="btn-primary" @click.stop="$emit('checkout')">
        <i class="fas fa-credit-card"></i>
        <span>立即结算</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  itemsCount: number
  totalPrice: number
  discountAmount: number
  finalPrice: number
}>()

defineEmits<{
  clear: []
  checkout: []
}>()

// 默认展开
const isExpanded = ref(true)

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<style scoped>
.checkout-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: linear-gradient(135deg, rgba(0, 128, 255, 0.1), rgba(0, 191, 255, 0.05));
  border-radius: var(--radius-lg);
  font-weight: var(--font-semibold);
  color: var(--primary-blue);
  font-size: var(--text-base);
  border: 1px solid rgba(0, 128, 255, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
}

.section-header:hover {
  background: linear-gradient(135deg, rgba(0, 128, 255, 0.15), rgba(0, 191, 255, 0.08));
  border-color: rgba(0, 128, 255, 0.3);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex: 1;
}

.header-left i {
  font-size: var(--text-lg);
}

.collapsed-summary {
  font-size: var(--text-base);
  color: var(--text-dark);
}

.collapsed-summary strong {
  color: var(--primary-blue);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
}

.toggle-icon {
  font-size: 14px;
  transition: transform 0.3s ease;
}

.price-summary {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--gray-200);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--text-base);
}

.summary-row .label {
  color: var(--text-muted);
  font-weight: var(--font-medium);
}

.summary-row .value {
  color: var(--text-dark);
  font-weight: var(--font-semibold);
}

.summary-row.discount .value {
  color: var(--danger);
}

.summary-row.total {
  padding-top: var(--spacing-md);
  border-top: 2px solid var(--gray-200);
  font-size: var(--text-lg);
}

.summary-row.total .label {
  color: var(--text-dark);
  font-weight: var(--font-bold);
}

.final-price {
  color: var(--accent-pink);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
}

.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.btn-secondary,
.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: all var(--transition-base) ease;
}

.btn-secondary {
  background: var(--gray-100);
  color: var(--text-dark);
  border: 1px solid var(--gray-300);
}

.btn-secondary:hover {
  background: var(--gray-200);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-blue), var(--secondary-blue));
  color: white;
  box-shadow: 0 4px 12px rgba(0, 128, 255, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 128, 255, 0.4);
}

.btn-secondary:active,
.btn-primary:active {
  transform: translateY(0);
}

/* 展开/折叠动画 */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 500px;
  opacity: 1;
}

@media (max-width: 768px) {
  .checkout-section {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
    z-index: 100;
    padding: var(--spacing-sm) var(--spacing-md);
    border-top: 2px solid var(--gray-200);
  }

  .section-header {
    display: none;
  }

  .price-summary {
    padding: var(--spacing-sm);
    gap: 6px;
  }

  .summary-row:not(.total) {
    display: none;
  }

  .summary-row.total {
    padding-top: 0;
    border-top: none;
  }

  .final-price {
    font-size: var(--text-xl);
  }

  .btn-secondary,
  .btn-primary {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--text-sm);
    min-height: 44px;
  }
}

@media (max-width: 480px) {
  .checkout-section {
    padding: 6px var(--spacing-sm);
  }

  .price-summary {
    padding: 4px var(--spacing-sm);
    gap: 4px;
  }

  .summary-row.total {
    font-size: var(--text-sm);
  }

  .final-price {
    font-size: var(--text-lg);
  }

  .action-buttons {
    gap: 6px;
  }

  .btn-secondary,
  .btn-primary {
    padding: 6px var(--spacing-sm);
    font-size: 12px;
    min-height: 40px;
  }
}

@media (max-width: 360px) {
  .btn-secondary span,
  .btn-primary span {
    display: none;
  }

  .btn-secondary,
  .btn-primary {
    justify-content: center;
    padding: var(--spacing-xs);
  }
}
</style>
