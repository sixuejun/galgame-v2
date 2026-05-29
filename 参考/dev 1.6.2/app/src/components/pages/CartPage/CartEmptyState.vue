<!--
  CartEmptyState 组件

  购物车空状态组件，当购物车为空时显示。

  功能：
  - 显示空状态图标和提示信息
  - 提供前往商店的按钮

  Emits:
  - navigate-to-shop(): 点击前往商店按钮时触发
-->
<template>
  <div class="empty-state">
    <div class="empty-icon">
      <i class="fas fa-shopping-basket"></i>
    </div>
    <h3 class="empty-title">购物车是空的</h3>
    <p class="empty-description">快去商店选购心仪的商品吧！</p>
    <button class="btn-primary go-shop-btn" aria-label="前往商店" @click="handleGoShop">
      <i class="fas fa-store" aria-hidden="true"></i>
      前往商店
    </button>
  </div>
</template>

<script setup lang="ts">
interface Emits {
  (e: 'go-shop'): void
}

const emit = defineEmits<Emits>()

const handleGoShop = () => {
  emit('go-shop')
}
</script>

<style scoped>
/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: var(--spacing-2xl);
  text-align: center;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 80px;
  margin-bottom: var(--spacing-xl);
  opacity: 0.3;
  color: var(--primary-blue);
}

.empty-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  margin: 0 0 var(--spacing-md) 0;
  color: var(--text-dark);
}

.empty-description {
  font-size: var(--text-lg);
  margin: 0 0 var(--spacing-xl) 0;
  color: var(--text-muted);
}

.go-shop-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-xl);
  background: linear-gradient(135deg, var(--primary-blue), var(--secondary-blue));
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  transition: all 0.3s ease;
}

.go-shop-btn:hover {
  background: linear-gradient(135deg, #2563eb, #0ea5e9);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
  transform: translateY(-2px);
}

.go-shop-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.go-shop-btn i {
  font-size: var(--text-lg);
}

/* 响应式设计 - 移动端 (<768px) */
@media (max-width: 768px) {
  /* 空状态优化 */
  .empty-icon {
    font-size: 64px;
  }

  .empty-title {
    font-size: var(--text-xl);
  }

  .empty-description {
    font-size: var(--text-base);
  }

  .go-shop-btn {
    min-height: 44px;
  }
}

/* 小屏模式优化 (<480px) */
@media (max-width: 480px) {
  .empty-icon {
    font-size: 48px;
  }

  .empty-title {
    font-size: var(--text-lg);
  }

  .empty-description {
    font-size: var(--text-sm);
  }
}
</style>
