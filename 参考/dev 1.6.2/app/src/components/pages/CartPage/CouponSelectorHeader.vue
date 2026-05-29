<!--
  CouponSelectorHeader 组件

  优惠券选择器头部组件，显示标题和操作按钮。

  功能：
  - 显示优惠券数量
  - 显示已选优惠券提示
  - 折叠/展开切换
  - 取消选择按钮
  - 无障碍支持

  Props:
  - couponCount (number): 优惠券数量
  - hasSelectedCoupon (boolean): 是否有已选优惠券
  - isExpanded (boolean): 是否展开

  Emits:
  - toggle(): 点击头部时触发
  - cancel(): 点击取消按钮时触发
-->
<template>
  <header class="section-header">
    <div class="header-left" @click="handleToggle">
      <div class="header-content">
        <i class="fas fa-ticket-alt"></i>
        <span>可用优惠券 ({{ couponCount }})</span>
      </div>
    </div>
    <div class="header-right">
      <button
        v-if="hasSelectedCoupon"
        class="cancel-coupon-btn"
        aria-label="取消使用优惠券"
        @click.stop="handleCancel"
      >
        <i class="fas fa-times"></i>
        <span class="cancel-text">取消</span>
      </button>
      <i
        :class="['fas', 'toggle-icon', isExpanded ? 'fa-chevron-up' : 'fa-chevron-down']"
        @click="handleToggle"
      ></i>
    </div>
  </header>
</template>

<script setup lang="ts">
interface Props {
  couponCount: number
  hasSelectedCoupon: boolean
  isExpanded: boolean
}

interface Emits {
  (e: 'toggle'): void
  (e: 'cancel'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const handleToggle = () => {
  emit('toggle')
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<style scoped>
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: linear-gradient(135deg, rgba(255, 105, 180, 0.1), rgba(255, 20, 147, 0.05));
  border-radius: var(--radius-lg);
  font-weight: var(--font-semibold);
  color: var(--accent-pink);
  font-size: var(--text-base);
  border: 1px solid rgba(255, 105, 180, 0.2);
  transition: all var(--transition-base) ease;
  user-select: none;
}

.section-header:hover {
  background: linear-gradient(135deg, rgba(255, 105, 180, 0.15), rgba(255, 20, 147, 0.08));
  border-color: rgba(255, 105, 180, 0.3);
}

.header-left {
  flex: 1;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.header-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.header-content i {
  font-size: var(--text-lg);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.cancel-coupon-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(239, 68, 68, 0.1);
  color: var(--error-red);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 32px;
}

.cancel-coupon-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  transform: translateY(-1px);
}

.cancel-coupon-btn:active {
  transform: translateY(0);
}

.cancel-coupon-btn i {
  font-size: 12px;
}

.cancel-text {
  font-size: var(--text-sm);
}

.toggle-icon {
  font-size: var(--text-sm);
  transition: transform var(--transition-base) ease;
  cursor: pointer;
}

/* 响应式设计 - 移动端 (<768px) */
@media (max-width: 768px) {
  .section-header {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--text-sm);
    border-radius: var(--radius-md);
    min-height: 44px;
  }

  .header-content i {
    font-size: var(--text-base);
  }

  .header-right {
    gap: 6px;
  }

  .cancel-coupon-btn {
    padding: 6px 10px;
    font-size: 12px;
    min-height: 44px;
    min-width: 44px;
  }

  .cancel-coupon-btn i {
    font-size: 11px;
  }

  .cancel-text {
    font-size: 12px;
  }

  .toggle-icon {
    font-size: 12px;
    padding: 8px;
    min-width: 32px;
    min-height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

/* 小屏模式优化 (<480px) */
@media (max-width: 480px) {
  .section-header {
    padding: 6px var(--spacing-sm);
    font-size: 12px;
    min-height: 40px;
  }

  .header-content i {
    font-size: var(--text-sm);
  }

  .header-right {
    gap: 4px;
  }

  .cancel-coupon-btn {
    padding: 4px 8px;
    font-size: 11px;
    min-height: 40px;
    min-width: 40px;
  }

  .cancel-coupon-btn i {
    font-size: 10px;
  }

  .cancel-text {
    font-size: 11px;
  }

  .toggle-icon {
    font-size: 10px;
    padding: 6px;
    min-width: 28px;
    min-height: 28px;
  }
}
</style>
