<!--
  ShopItemGrid 组件

  商店物品网格组件，以网格形式显示商品列表。

  功能：
  - 网格布局显示商品
  - 使用 v-memo 优化性能
  - 支持购买和添加到购物车

  Props:
  - paginatedItems (Record<string, Item>): 分页后的商品列表

  Emits:
  - buy(itemId: string): 购买商品时触发
  - addToCart(itemId: string): 添加到购物车时触发
-->
<template>
  <section class="shop-items" role="list" aria-label="商品列表">
    <ShopItem
      v-for="(item, key) in paginatedItems"
      :key="key"
      v-memo="[item.name, item.price, item.quantity]"
      :item="item"
      role="listitem"
      @buy="$emit('buy', $event)"
      @add-to-cart="$emit('addToCart', $event)"
    />
  </section>
</template>

<script setup lang="ts">
import type { Item } from '../../../types'
import ShopItem from './ShopItem.vue'

interface Props {
  paginatedItems: Record<string, Item>
}

defineProps<Props>()

defineEmits<{
  buy: [itemId: string]
  addToCart: [itemId: string]
}>()
</script>

<style scoped>
.shop-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

@media (max-width: 1024px) {
  .shop-items {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
}

@media (max-width: 768px) {
  /* 小屏模式下改为双列显示，减少滚动距离 */
  .shop-items {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-md);
  }
}

/* 超小屏模式优化 (300px-500px) - 单列显示 */
@media (max-width: 500px) {
  .shop-items {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }
}
</style>
