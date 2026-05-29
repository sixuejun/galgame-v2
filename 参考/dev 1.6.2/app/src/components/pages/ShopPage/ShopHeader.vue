<!--
  ShopHeader 组件

  商店页面头部组件，显示标题、货币和购物车信息。

  功能：
  - 显示页面标题
  - 显示商品总数
  - 显示当前货币余额（支持两种显示模式）
  - 显示购物车按钮和商品数量徽章
  - 导航到购物车页面

  Props:
  - pageTitle (string): 页面标题
  - currency (number): 当前货币数量
  - currencyType (string, optional): 货币类型（符号如 "¥"、"CNY" 或名称如 "金币"）
  - currencyDisplayMode (string, optional): 显示模式 'symbol' 或 'name'
  - totalItems (number): 商品总数
  - cartItemsCount (number): 购物车商品数量
  - isLoading (boolean): 是否正在加载
  - cartButtonName (string, optional): 购物车按钮名称
  - cartButtonIcon (string, optional): 购物车按钮图标

  货币显示模式：
  - 'symbol' 模式：货币类型 + 数值，如 "¥ 1,000"、"CNY 1,000"
  - 'name' 模式：数值 + 货币类型，如 "1,000 金币"、"1,000 积分"
  - 未设置：仅显示数值，如 "1,000"

  Emits:
  - navigate-to-cart(): 点击购物车按钮时触发
-->
<template>
  <header class="shop-header">
    <div class="header-title-section">
      <h2 id="page-title">{{ pageTitle }}</h2>
      <div v-if="!isLoading && totalItems > 0" class="shop-count" role="status" aria-live="polite">
        <i class="fas fa-box" aria-hidden="true"></i>
        <span>共 {{ totalItems }} 件商品</span>
      </div>
    </div>
    <div class="header-actions">
      <div class="currency-display" role="status" aria-label="当前货币">
        <span>{{ formattedCurrency }}</span>
      </div>
      <button class="cart-button" aria-label="前往购物车" @click="handleNavigateToCart">
        <i :class="cartIconClass" aria-hidden="true"></i>
        <span>{{ cartButtonName || '购物车' }}</span>
        <span v-if="cartItemsCount > 0" class="cart-badge" aria-label="购物车商品数量">{{
          cartItemsCount
        }}</span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CurrencyDisplayMode } from '../../../types'

interface Props {
  pageTitle: string
  currency: number
  currencyType?: string // 货币类型：符号（如 "¥"、"CNY"）或名称（如 "金币"、"积分"）
  currencyDisplayMode?: CurrencyDisplayMode // 显示模式：'symbol' 或 'name'
  totalItems: number
  cartItemsCount: number
  isLoading: boolean
  cartButtonName?: string // 购物车按钮名称
  cartButtonIcon?: string // 购物车按钮图标
}

interface Emits {
  (e: 'navigate-to-cart'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

/**
 * 格式化货币显示
 *
 * 显示规则：
 * 1. 如果没有设置 currencyType：只显示数值，如 "1,000"
 * 2. 如果 currencyDisplayMode = 'symbol'：显示 "货币类型 数值"，如 "¥ 1,000"、"CNY 1,000"
 * 3. 如果 currencyDisplayMode = 'name'：显示 "数值 货币类型"，如 "1,000 金币"、"1,000 积分"
 * 4. 如果没有设置 currencyDisplayMode：默认使用 'symbol' 模式
 */
const formattedCurrency = computed(() => {
  const amount = props.currency.toLocaleString()

  // 如果没有设置货币类型，只显示数值
  if (!props.currencyType) {
    return amount
  }

  // 根据显示模式决定格式
  const displayMode = props.currencyDisplayMode || 'symbol' // 默认为 symbol 模式

  if (displayMode === 'symbol') {
    // 符号模式：货币类型在前
    return `${props.currencyType} ${amount}`
  } else {
    // 名称模式：数值在前
    return `${amount} ${props.currencyType}`
  }
})

/**
 * 购物车图标类名
 */
const cartIconClass = computed(() => {
  return props.cartButtonIcon ? `fas ${props.cartButtonIcon}` : 'fas fa-shopping-cart'
})

const handleNavigateToCart = () => {
  emit('navigate-to-cart')
}
</script>

<style scoped>
.shop-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-xl);
  gap: var(--spacing-lg);
  flex-wrap: wrap;
}

.header-title-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.header-title-section h2 {
  color: var(--primary-blue);
  margin: 0;
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  background: linear-gradient(135deg, var(--primary-blue), var(--secondary-blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.shop-count {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md);
  background: linear-gradient(135deg, rgba(0, 128, 255, 0.1), rgba(0, 191, 255, 0.1));
  border: 2px solid var(--primary-blue);
  border-radius: var(--radius-full);
  color: var(--primary-blue);
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  width: fit-content;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.currency-display {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 193, 7, 0.1));
  border: 2px solid var(--gold);
  border-radius: var(--radius-lg);
  color: var(--gold);
  font-weight: var(--font-bold);
  font-size: var(--text-lg);
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.2);
}

.currency-display i {
  font-size: var(--text-xl);
}

.cart-button {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: linear-gradient(135deg, var(--primary-blue), var(--secondary-blue));
  border: none;
  border-radius: var(--radius-lg);
  color: white;
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: 0 4px 12px rgba(0, 128, 255, 0.3);
}

.cart-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 128, 255, 0.5);
}

.cart-button:active {
  transform: translateY(0);
}

.cart-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: var(--danger);
  border-radius: var(--radius-full);
  color: white;
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

@media (max-width: 768px) {
  .shop-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-title-section h2 {
    font-size: var(--text-2xl);
  }

  .header-actions {
    justify-content: space-between;
  }

  .currency-display {
    font-size: var(--text-base);
  }
}
</style>
