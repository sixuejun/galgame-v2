<!--
  ShopItem 组件

  商店物品卡片组件，显示单个商品信息。

  功能：
  - 显示商品信息（名称、描述、价格）
  - 购买按钮
  - 添加到购物车按钮
  - 库存显示
  - 无障碍支持

  Props:
  - item (Item): 商品数据对象

  Emits:
  - buy(itemId: string): 点击购买时触发
  - add-to-cart(itemId: string): 点击添加到购物车时触发
-->
<template>
  <article class="shop-item" role="article" :aria-label="`商品：${item.name}`">
    <div class="shop-item-icon" aria-hidden="true">
      <Icon :icon-data="item.icon" :alt="`${item.name}图标`" />
    </div>
    <h3 class="shop-item-name">{{ item.name }}</h3>
    <p class="shop-item-desc">{{ item.description }}</p>
    <div class="shop-item-price">
      <span class="price-tag" role="text" :aria-label="`价格：${item.price}元`"
        >¥{{ item.price.toLocaleString() }}</span
      >
      <div class="item-actions" role="group" aria-label="商品操作">
        <button
          class="add-to-cart-button"
          :aria-label="`将${item.name}添加到购物车`"
          title="添加到购物车"
          @click="$emit('addToCart', item.id)"
        >
          <i class="fas fa-cart-plus" aria-hidden="true"></i>
        </button>
        <button
          class="buy-button"
          :aria-label="`立即购买${item.name}`"
          @click="$emit('buy', item.id)"
        >
          立即购买
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Item } from '../../../types'
import Icon from '../../common/Icon.vue'

defineProps<{
  item: Item
}>()

defineEmits<{
  buy: [itemId: string]
  addToCart: [itemId: string]
}>()
</script>

<style scoped>
.shop-item {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  transition: all var(--transition-base) ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.shop-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-blue), var(--secondary-blue));
  transform: scaleX(0);
  transition: transform var(--transition-base) ease;
}

.shop-item:hover::before {
  transform: scaleX(1);
}

.shop-item:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-xl);
  border-color: var(--primary-blue);
}

.shop-item-icon {
  font-size: 56px;
  text-align: center;
  margin-bottom: var(--spacing-md);
  color: var(--primary-blue);
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60px;
  transition: all var(--transition-base) ease;
}

.shop-item:hover .shop-item-icon {
  transform: scale(1.1) rotate(5deg);
}

.shop-item-icon :deep(.custom-icon) {
  max-width: 100%;
  max-height: 100%;
}

.shop-item-name {
  font-weight: var(--font-semibold);
  margin-bottom: var(--spacing-sm);
  color: var(--text-dark);
  font-size: var(--text-lg);
  text-align: center;
}

.shop-item-desc {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin-bottom: var(--spacing-md);
  line-height: 1.6;
  text-align: center;
  min-height: 3em;
}

.shop-item-price {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--gray-200);
}

.price-tag {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--accent-pink);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
}

.item-actions {
  display: flex;
  gap: var(--spacing-xs);
  width: 100%;
}

.add-to-cart-button {
  padding: 10px;
  background: white;
  color: var(--primary-blue);
  border: 2px solid var(--primary-blue);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base) ease;
  font-size: var(--text-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
}

.add-to-cart-button:hover {
  background: var(--primary-blue);
  color: white;
  transform: scale(1.05);
  box-shadow: var(--shadow-sm);
}

.buy-button {
  flex: 1;
  padding: 10px 20px;
  background: linear-gradient(135deg, var(--primary-blue), var(--secondary-blue));
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base) ease;
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
}

.buy-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition:
    width 0.6s,
    height 0.6s;
}

.buy-button:hover::before {
  width: 300px;
  height: 300px;
}

.buy-button:hover {
  background: linear-gradient(135deg, var(--secondary-blue), var(--primary-blue-light));
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.buy-button:active {
  transform: translateY(0);
}

/* 小屏模式优化 (300px-768px) - 双列布局紧凑型 */
@media (max-width: 768px) {
  .shop-item {
    padding: var(--spacing-md);
  }

  .shop-item-icon {
    font-size: 40px;
    height: 48px;
    margin-bottom: var(--spacing-sm);
  }

  .shop-item-name {
    font-size: var(--text-base);
    margin-bottom: var(--spacing-xs);
  }

  .shop-item-desc {
    font-size: var(--text-xs);
    margin-bottom: var(--spacing-sm);
    min-height: 2.5em;
  }

  .shop-item-price {
    padding-top: var(--spacing-sm);
    gap: var(--spacing-xs);
  }

  .price-tag {
    font-size: var(--text-lg);
  }

  .add-to-cart-button {
    padding: 8px;
    font-size: var(--text-base);
    min-width: 40px;
  }

  .buy-button {
    padding: 8px 12px;
    font-size: var(--text-xs);
  }
}

/* 超小屏模式优化 (300px-500px) - 单列布局 */
@media (max-width: 500px) {
  .shop-item {
    padding: var(--spacing-lg);
  }

  .shop-item-icon {
    font-size: 48px;
    height: 56px;
    margin-bottom: var(--spacing-md);
  }

  .shop-item-name {
    font-size: var(--text-lg);
  }

  .shop-item-desc {
    font-size: var(--text-sm);
    min-height: 3em;
  }

  .price-tag {
    font-size: var(--text-xl);
  }

  .add-to-cart-button {
    padding: 10px;
    font-size: var(--text-lg);
  }

  .buy-button {
    padding: 10px 16px;
    font-size: var(--text-sm);
  }
}
</style>
