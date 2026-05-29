<!--
  CartHeader 组件

  购物车页面头部组件，显示标题和返回按钮。

  功能：
  - 显示页面标题
  - 显示购物车商品数量
  - 返回商店按钮

  Props:
  - cartItemsCount (number): 购物车商品数量
  - cartTitle (string, optional): 购物车页面标题
  - cartIcon (string, optional): 购物车图标

  Emits:
  - back(): 点击返回商店按钮时触发
-->
<template>
  <header class="cart-page-header">
    <div class="header-left">
      <button class="back-button" aria-label="返回商店" @click="handleBack">
        <i class="fas fa-arrow-left" aria-hidden="true"></i>
        <span>返回商店</span>
      </button>
    </div>
    <div class="header-center">
      <h2 id="page-title" class="page-title">
        <i :class="cartIconClass" aria-hidden="true"></i>
        <span>{{ cartTitle || '购物车' }}</span>
        <span
          v-if="cartItemsCount > 0"
          class="cart-badge"
          role="status"
          :aria-label="`购物车中有${cartItemsCount}件商品`"
          >{{ cartItemsCount }}</span
        >
      </h2>
    </div>
    <div class="header-right">
      <!-- 占位，保持布局平衡 -->
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  cartItemsCount: number
  cartTitle?: string // 购物车页面标题
  cartIcon?: string // 购物车图标
}

interface Emits {
  (e: 'back'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

/**
 * 购物车图标类名
 */
const cartIconClass = computed(() => {
  return props.cartIcon ? `fas ${props.cartIcon}` : 'fas fa-shopping-cart'
})

const handleBack = () => {
  emit('back')
}
</script>

<style scoped>
/* 页面头部 */
.cart-page-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: var(--spacing-lg) var(--spacing-xl);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.95));
  border-bottom: 2px solid rgba(0, 128, 255, 0.2);
  box-shadow: 0 2px 12px rgba(0, 128, 255, 0.1);
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-left {
  display: flex;
  justify-content: flex-start;
}

.header-center {
  display: flex;
  justify-content: center;
}

.header-right {
  display: flex;
  justify-content: flex-end;
}

/* 返回按钮 */
.back-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 10px 20px;
  background: linear-gradient(135deg, var(--primary-blue), var(--secondary-blue));
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  transition: all var(--transition-base) ease;
  box-shadow: 0 2px 8px rgba(0, 128, 255, 0.3);
}

.back-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 128, 255, 0.4);
}

.back-button:active {
  transform: translateY(0);
}

.back-button i {
  font-size: var(--text-base);
}

/* 页面标题 */
.page-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-dark);
  margin: 0;
}

.page-title i {
  font-size: var(--text-2xl);
  color: var(--primary-blue);
}

.cart-badge {
  background: var(--accent-pink);
  color: white;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  min-width: 28px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(255, 105, 180, 0.4);
}

/* 响应式设计 - 移动端 (<768px) */
@media (max-width: 768px) {
  /* 页面头部 - 紧凑布局 */
  .cart-page-header {
    padding: var(--spacing-sm) var(--spacing-md);
    grid-template-columns: auto 1fr;
    gap: var(--spacing-sm);
  }

  .header-center {
    justify-content: flex-start;
  }

  .header-right {
    display: none;
  }

  .back-button {
    padding: 8px 12px;
    min-width: 44px;
    min-height: 44px;
  }

  .back-button span {
    display: none;
  }

  .page-title {
    font-size: var(--text-lg);
    gap: var(--spacing-sm);
  }

  .page-title i {
    font-size: var(--text-lg);
  }

  .cart-badge {
    padding: 2px 8px;
    font-size: 11px;
    min-width: 20px;
  }
}

/* 小屏模式优化 (<480px) */
@media (max-width: 480px) {
  .cart-page-header {
    padding: var(--spacing-xs) var(--spacing-sm);
  }

  .back-button {
    padding: 6px 10px;
    min-width: 40px;
    min-height: 40px;
  }

  .page-title {
    font-size: var(--text-base);
    gap: 6px;
  }

  .page-title i {
    font-size: var(--text-base);
  }

  .cart-badge {
    padding: 2px 6px;
    font-size: 10px;
    min-width: 18px;
  }
}
</style>
