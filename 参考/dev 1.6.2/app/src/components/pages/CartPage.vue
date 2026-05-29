<!--
  CartPage 组件

  购物车页面，显示购物车商品和结算功能。

  功能：
  - 显示购物车商品列表
  - 支持修改商品数量
  - 支持移除商品
  - 优惠券选择和应用
  - 价格计算（原价、折扣、最终价格）
  - 结算功能
  - 清空购物车
  - 空购物车状态提示

  Props:
  无（使用 useShoppingCart composable 管理状态）

  Emits:
  无

  使用示例:
  ```vue
  <CartPage />
  ```
-->
<template>
  <ErrorBoundary @error="handleError">
    <article class="page-cart">
      <!-- 页面头部 -->
      <CartHeader
        :cart-items-count="cartItemsCount"
        :cart-title="cartTitle"
        :cart-icon="cartIcon"
        @back="handleBack"
      />

      <!-- 主要内容区域 -->
      <main class="cart-main">
        <!-- 空购物车状态 -->
        <CartEmptyState v-if="isCartEmpty" @go-shop="handleBack" />

        <!-- 有商品时的两列布局 -->
        <div v-else class="cart-content-grid">
          <!-- 左列：商品列表 -->
          <CartItemList
            :items="cartItemsList"
            :items-count="cartItemsCount"
            @decrease-quantity="decreaseQuantity"
            @increase-quantity="increaseQuantity"
            @remove-item="removeFromCart"
            @update-quantity="updateQuantity"
          />

          <!-- 右列：优惠券与结算 -->
          <section class="checkout-column">
            <!-- 优惠券选择 -->
            <CouponSelector
              :coupons="availableCoupons"
              :selected-coupon-id="selectedCouponId"
              @select-coupon="selectCoupon"
            />

            <!-- 价格汇总与结算 -->
            <CartSummary
              :items-count="cartItemsCount"
              :total-price="cartTotalPrice"
              :discount-amount="discountAmount"
              :final-price="finalPrice"
              @clear="clearCart"
              @checkout="handleCheckout"
            />
          </section>
        </div>
      </main>
    </article>
  </ErrorBoundary>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Config, ShopData } from '../../types'
import ErrorBoundary from '../common/ErrorBoundary.vue'
import CartHeader from './CartPage/CartHeader.vue'
import CartEmptyState from './CartPage/CartEmptyState.vue'
import CartItemList from './CartPage/CartItemList.vue'
import CouponSelector from './CartPage/CouponSelector.vue'
import CartSummary from './CartPage/CartSummary.vue'
import { useShoppingCart } from '../../composables/shop/useShoppingCart'
import { usePageNavigation } from '../../composables/ui/usePageNavigation'
import { logger } from '../../utils/logger'

interface Props {
  config?: Config
  shop?: ShopData
}

const props = defineProps<Props>()

// 购物车配置
const cartTitle = computed(() => props.config?.cart?.title)
const cartIcon = computed(() => props.config?.cart?.icon)

// 页面导航
const { navigateTo } = usePageNavigation()

// 购物车状态和方法
const {
  cartItemsList,
  cartItemsCount,
  cartTotalPrice,
  isCartEmpty,
  availableCoupons,
  selectedCouponId,
  discountAmount,
  finalPrice,
  updateQuantity,
  removeFromCart,
  selectCoupon,
  clearCart,
  checkout,
} = useShoppingCart()

/**
 * 返回商店页面
 */
const handleBack = () => {
  navigateTo('shop')
}

/**
 * 减少商品数量
 */
const decreaseQuantity = (itemId: string, currentQuantity: number) => {
  if (currentQuantity > 1) {
    updateQuantity(itemId, currentQuantity - 1)
  }
}

/**
 * 增加商品数量
 */
const increaseQuantity = (itemId: string, currentQuantity: number) => {
  if (currentQuantity < 99) {
    updateQuantity(itemId, currentQuantity + 1)
  }
}

/**
 * 结算购物车
 */
const handleCheckout = () => {
  checkout()
  // 结算成功后返回商店页面
  navigateTo('shop')
}

/**
 * 处理错误
 */
const handleError = (error: Error) => {
  logger.error('购物车页面发生错误:', error)
}

// 暴露方法供测试使用
defineExpose({
  decreaseQuantity,
  increaseQuantity,
  handleBack,
  handleCheckout,
})
</script>

<style scoped>
/* 页面容器 */
.page-cart {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.95), rgba(255, 255, 255, 0.98));
  overflow: hidden;
}

/* 主要内容区域 */
.cart-main {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 两列网格布局 */
.cart-content-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg) var(--spacing-xl);
  min-height: 0;
  overflow: hidden;
}

/* 右列：优惠券与结算 */
.checkout-column {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  overflow-y: auto;
}

/* 响应式设计 - 平板端 (768px-1024px) - 双列布局 */
@media (max-width: 1024px) and (min-width: 769px) {
  .cart-content-grid {
    /* 优化列宽比例，给商品列表更多空间 */
    grid-template-columns: 1.5fr 1fr;
    overflow-y: auto;
    padding: var(--spacing-md) var(--spacing-lg);
    gap: var(--spacing-lg);
    /* 充分利用可用高度 */
    height: 100%;
  }

  .checkout-column {
    overflow-y: visible;
    /* 确保结算列也能充分利用空间 */
    height: 100%;
  }
}

/* 响应式设计 - 移动端 (<768px) */
@media (max-width: 768px) {
  /* 主内容区域 - 改为 flex 垂直布局 */
  .cart-content-grid {
    display: flex;
    flex-direction: column;
    padding: var(--spacing-sm);
    gap: var(--spacing-sm);
    /* 为 sticky footer 预留空间 - 减少到 110px */
    padding-bottom: 110px;
    overflow-y: auto;
  }

  /* 结算区域将在 CartSummary 组件中设置为 sticky footer */
  .checkout-column {
    overflow-y: visible;
    gap: 0;
    /* 移除默认间距，让优惠券区域紧贴价格汇总区域 */
  }
}

/* 小屏模式优化 (<480px) */
@media (max-width: 480px) {
  .cart-content-grid {
    padding: 6px;
    padding-bottom: 100px;
  }
}
</style>
