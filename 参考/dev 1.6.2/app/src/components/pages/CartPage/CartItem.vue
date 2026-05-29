<!--
  CartItem 组件

  购物车商品项组件，显示单个购物车商品。

  功能：
  - 显示商品信息（名称、描述、价格）
  - 数量控制（增加/减少/输入）
  - 移除商品
  - 小计计算
  - 无障碍支持

  Props:
  - item (CartItemData): 购物车商品数据

  Emits:
  - update-quantity(itemId: string, quantity: number): 更新数量时触发
  - remove(itemId: string): 移除商品时触发
-->
<template>
  <article class="cart-item">
    <div class="item-image">
      <Icon :icon-data="item.icon" :alt="`${item.name}图标`" />
    </div>
    <div class="item-details">
      <h4 class="item-name">{{ item.name }}</h4>
      <p class="item-price">¥{{ item.price.toLocaleString() }}</p>
    </div>
    <div class="item-actions">
      <QuantityControl
        :quantity="quantity"
        @decrease="$emit('decrease')"
        @increase="$emit('increase')"
        @update-quantity="$emit('updateQuantity', $event)"
      />
      <button class="remove-btn" aria-label="移除商品" @click="$emit('remove')">
        <i class="fas fa-trash-alt"></i>
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Item } from '../../../types'
import Icon from '../../common/Icon.vue'
import QuantityControl from './QuantityControl.vue'

interface CartItemProps {
  item: Item & { cartQuantity: number }
  quantity: number
}

defineProps<CartItemProps>()

defineEmits<{
  decrease: []
  increase: []
  remove: []
  updateQuantity: [quantity: number]
}>()
</script>

<style scoped>
.cart-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  transition: all var(--transition-base) ease;
}

.cart-item:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--primary-blue);
}

.item-image {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  color: var(--primary-blue);
  background: linear-gradient(135deg, rgba(0, 128, 255, 0.1), rgba(0, 191, 255, 0.1));
  border-radius: var(--radius-lg);
}

.item-image :deep(.custom-icon) {
  max-width: 100%;
  max-height: 100%;
}

.item-details {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--text-dark);
  margin: 0 0 var(--spacing-xs) 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-price {
  font-size: var(--text-sm);
  color: var(--accent-pink);
  font-weight: var(--font-semibold);
  margin: 0;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.remove-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 107, 107, 0.1);
  color: var(--danger);
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base) ease;
  font-size: var(--text-sm);
}

.remove-btn:hover {
  background: var(--danger);
  color: white;
  transform: scale(1.1);
}

/* 响应式设计 - 平板端 (768px-1024px) - 优化商品名称显示 */
@media (max-width: 1024px) and (min-width: 769px) {
  .cart-item {
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
  }

  .item-image {
    width: 50px;
    height: 50px;
    font-size: 30px;
  }

  .item-details {
    flex: 1;
    min-width: 0;
    /* 确保有足够空间显示商品名称 */
    max-width: calc(100% - 200px);
  }

  .item-name {
    font-size: var(--text-sm);
    /* 确保文字不被遮挡 */
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .item-price {
    font-size: var(--text-xs);
  }

  .item-actions {
    flex-shrink: 0;
  }

  .remove-btn {
    width: 34px;
    height: 34px;
    font-size: 12px;
  }
}

/* 响应式设计 - 移动端 (<768px) - 统一使用水平紧凑布局 */
@media (max-width: 768px) {
  .cart-item {
    /* 保持水平布局，避免垂直布局冲突 */
    flex-direction: row;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .item-image {
    width: 48px;
    height: 48px;
    font-size: 28px;
  }

  .item-details {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .item-name {
    font-size: var(--text-sm);
    margin: 0;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .item-price {
    font-size: var(--text-xs);
    margin: 0;
  }

  .item-actions {
    flex-direction: column;
    gap: 6px;
    align-items: flex-end;
    width: auto;
  }

  .remove-btn {
    width: 32px;
    height: 32px;
    min-width: 32px;
    min-height: 32px;
    font-size: 11px;
  }
}

/* 小屏模式优化 (<480px) - 进一步紧凑 */
@media (max-width: 480px) {
  .cart-item {
    padding: 6px var(--spacing-sm);
    gap: 6px;
  }

  .item-image {
    width: 40px;
    height: 40px;
    font-size: 24px;
  }

  .item-name {
    font-size: 12px;
  }

  .item-price {
    font-size: 11px;
  }

  .item-actions {
    gap: 4px;
  }

  .remove-btn {
    width: 28px;
    height: 28px;
    min-width: 28px;
    min-height: 28px;
    font-size: 10px;
  }
}
</style>
