/**
 * @file useShoppingCart.ts
 * @description 购物车管理 Composable - 组合购物车基础操作、优惠券系统和结算逻辑
 * @author Eden System Team
 */

import { useCart } from './useCart'
import { useCartCoupon } from './useCartCoupon'
import { useCartCheckout } from './useCartCheckout'
import { useModal } from '../ui/useModal'

// 重新导出 CartItem 类型
export type { CartItem } from './useCart'

/**
 * 购物车管理 Composable
 *
 * 组合购物车基础操作、优惠券系统和结算逻辑，提供完整的购物车功能。
 *
 * @returns 购物车状态和操作方法
 *
 * @example
 * ```typescript
 * const {
 *   cartItemsList,
 *   addToCart,
 *   selectCoupon,
 *   checkout
 * } = useShoppingCart()
 * ```
 */
export function useShoppingCart() {
  const { showModal, hideModal } = useModal()

  // 购物车基础操作
  const {
    cartItems,
    cartItemsList,
    cartItemsCount,
    cartTotalPrice,
    isCartEmpty,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCartItems,
  } = useCart()

  // 优惠券系统
  const {
    availableCoupons,
    selectedCoupon,
    selectedCouponId,
    discountAmount,
    finalPrice,
    selectCoupon,
    clearCouponSelection,
    consumeCoupon,
  } = useCartCoupon(cartTotalPrice)

  // 结算逻辑
  const { checkout } = useCartCheckout({
    isCartEmpty,
    cartItemsList,
    cartItemsCount,
    cartTotalPrice,
    finalPrice,
    discountAmount,
    clearCartItems,
    clearCouponSelection,
    consumeCoupon,
  })

  /**
   * 清空购物车（带确认对话框）
   */
  const clearCart = () => {
    showModal('确认清空', '确定要清空购物车吗？此操作不可撤销。', [
      {
        text: '确认',
        class: 'danger',
        action: () => {
          clearCartItems()
          clearCouponSelection()
          hideModal()
        },
      },
      {
        text: '取消',
        class: 'secondary',
        action: hideModal,
      },
    ])
  }

  return {
    // 状态
    cartItems,
    cartItemsList,
    cartItemsCount,
    cartTotalPrice,
    isCartEmpty,

    // 优惠券相关
    availableCoupons,
    selectedCoupon,
    selectedCouponId,
    discountAmount,
    finalPrice,

    // 方法
    addToCart,
    removeFromCart,
    updateQuantity,
    selectCoupon,
    clearCart,
    checkout,
  }
}
