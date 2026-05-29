<!--
  CartItemList 组件

  购物车商品列表组件，显示所有购物车商品。

  功能：
  - 显示购物车商品列表
  - 显示商品数量统计
  - 支持更新数量和移除商品
  - 使用 v-memo 优化性能

  Props:
  - items (CartItemData[]): 购物车商品列表

  Emits:
  - update-quantity(itemId: string, quantity: number): 更新数量时触发
  - remove(itemId: string): 移除商品时触发
-->
<template>
  <section class="items-column">
    <header class="column-header">
      <i class="fas fa-list"></i>
      <span>已选商品 ({{ itemsCount }})</span>
    </header>
    <div class="items-list">
      <CartItem
        v-for="item in items"
        :key="item.id"
        :item="item"
        :quantity="item.cartQuantity"
        @decrease="$emit('decreaseQuantity', item.id, item.cartQuantity)"
        @increase="$emit('increaseQuantity', item.id, item.cartQuantity)"
        @remove="$emit('removeItem', item.id)"
        @update-quantity="qty => $emit('updateQuantity', item.id, qty)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Item } from '../../../types'
import CartItem from './CartItem.vue'

interface CartItemWithQuantity extends Item {
  cartQuantity: number
}

defineProps<{
  items: CartItemWithQuantity[]
  itemsCount: number
}>()

defineEmits<{
  decreaseQuantity: [itemId: string, currentQuantity: number]
  increaseQuantity: [itemId: string, currentQuantity: number]
  removeItem: [itemId: string]
  updateQuantity: [itemId: string, quantity: number]
}>()
</script>

<style scoped>
.items-column {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  height: 100%;
  overflow: hidden;
}

.column-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: linear-gradient(135deg, rgba(0, 128, 255, 0.1), rgba(0, 191, 255, 0.05));
  border-radius: var(--radius-lg);
  font-weight: var(--font-semibold);
  color: var(--primary-blue);
  font-size: var(--text-base);
  border: 1px solid rgba(0, 128, 255, 0.2);
}

.column-header i {
  font-size: var(--text-lg);
}

.items-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-sm);
}

/* 滚动条样式 */
.items-list::-webkit-scrollbar {
  width: 8px;
}

.items-list::-webkit-scrollbar-track {
  background: var(--gray-100);
  border-radius: var(--radius-full);
}

.items-list::-webkit-scrollbar-thumb {
  background: var(--gray-300);
  border-radius: var(--radius-full);
}

.items-list::-webkit-scrollbar-thumb:hover {
  background: var(--gray-400);
}

/* 平板端布局优化 (769px-1024px) */
@media (max-width: 1024px) and (min-width: 769px) {
  .items-column {
    /* 移除固定高度限制，充分利用可用空间 */
    max-height: none;
    flex: 1;
    min-height: 0;
  }

  .items-list {
    /* 确保列表可以滚动并充分利用空间 */
    flex: 1;
    min-height: 0;
  }
}

/* 小屏模式优化 (300px-700px) */
@media (max-width: 700px) {
  .items-column {
    /* 关键：使用 min-height: 0 允许 flex 子元素收缩 */
    flex: 1 1 auto;
    min-height: 0;
    max-height: none;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .column-header {
    flex-shrink: 0;
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--text-sm);
    border-radius: var(--radius-md);
  }

  .column-header i {
    font-size: var(--text-base);
  }

  .items-list {
    /* 关键：允许列表自适应内容高度，但不超过可用空间 */
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    gap: var(--spacing-sm);
    padding: var(--spacing-xs);
  }

  /* 优化滚动条在小屏下的显示 */
  .items-list::-webkit-scrollbar {
    width: 4px;
  }
}
</style>
