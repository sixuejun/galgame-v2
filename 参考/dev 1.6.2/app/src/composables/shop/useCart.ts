/**
 * @file useCart.ts
 * @description 购物车基础操作 Composable - 管理购物车的添加、删除、更新数量等基础操作
 * @author Eden System Team
 */

import { ref, computed } from 'vue'
import type { Item } from '../../types'
import { logger } from '../../utils/logger'

/**
 * 购物车商品项
 */
export interface CartItem extends Item {
  /** 购物车中的数量 */
  cartQuantity: number
}

// 全局购物车状态（单例模式）
const cartItems = ref<Map<string, CartItem>>(new Map())

/**
 * 购物车基础操作 Composable
 *
 * 提供购物车的添加、删除、更新数量等基础功能。
 *
 * @returns 购物车状态和基础操作方法
 *
 * @example
 * ```typescript
 * const { cartItemsList, addToCart, removeFromCart } = useCart()
 * addToCart(item, 2)
 * ```
 */
export function useCart() {
  /**
   * 购物车物品列表
   */
  const cartItemsList = computed(() => {
    return Array.from(cartItems.value.values())
  })

  /**
   * 购物车物品总数
   */
  const cartItemsCount = computed(() => {
    return cartItemsList.value.reduce((sum, item) => sum + item.cartQuantity, 0)
  })

  /**
   * 购物车总价（原价）
   */
  const cartTotalPrice = computed(() => {
    return cartItemsList.value.reduce((sum, item) => sum + item.price * item.cartQuantity, 0)
  })

  /**
   * 购物车是否为空
   */
  const isCartEmpty = computed(() => cartItems.value.size === 0)

  /**
   * 添加物品到购物车
   *
   * @param item - 要添加的物品
   * @param quantity - 添加的数量（默认为 1）
   */
  const addToCart = (item: Item, quantity: number = 1) => {
    const existingItem = cartItems.value.get(item.id)

    if (existingItem) {
      existingItem.cartQuantity += quantity
      cartItems.value.set(item.id, existingItem)
    } else {
      const cartItem: CartItem = {
        ...item,
        cartQuantity: quantity,
      }
      cartItems.value.set(item.id, cartItem)
    }

    logger.debug(`添加到购物车: ${item.name} x${quantity}`)
  }

  /**
   * 从购物车移除物品
   *
   * @param itemId - 要移除的物品 ID
   */
  const removeFromCart = (itemId: string) => {
    const item = cartItems.value.get(itemId)
    if (item) {
      cartItems.value.delete(itemId)
      logger.debug(`从购物车移除: ${item.name}`)
    }
  }

  /**
   * 更新购物车物品数量
   *
   * @param itemId - 物品 ID
   * @param quantity - 新的数量（如果 <= 0 则移除物品）
   */
  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }

    const item = cartItems.value.get(itemId)
    if (item) {
      item.cartQuantity = quantity
      cartItems.value.set(itemId, item)
      logger.debug(`更新数量: ${item.name} -> ${quantity}`)
    }
  }

  /**
   * 清空购物车（内部方法，不显示确认对话框）
   */
  const clearCartItems = () => {
    cartItems.value.clear()
    logger.debug('购物车已清空')
  }

  return {
    // 状态
    cartItems,
    cartItemsList,
    cartItemsCount,
    cartTotalPrice,
    isCartEmpty,

    // 方法
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCartItems,
  }
}
