/**
 * @file useCartCheckout.ts
 * @description 购物车结算逻辑 Composable - 管理购物车的结算流程
 * @author Eden System Team
 */

import { storeToRefs } from 'pinia'
import type { ComputedRef } from 'vue'
import type { CartItem } from './useCart'
import { useGameStore } from '../../stores/gameStore'
import { useModal } from '../ui/useModal'
import { useToast } from '../ui/useToast'
import { logger } from '../../utils/logger'

/**
 * 购物车结算逻辑 Composable
 *
 * 提供购物车的结算功能，包括余额验证、库存更新、优惠券消耗等。
 *
 * @param options - 结算所需的参数
 * @returns 结算相关方法
 *
 * @example
 * ```typescript
 * const { checkout } = useCartCheckout({
 *   isCartEmpty,
 *   cartItemsList,
 *   cartItemsCount,
 *   cartTotalPrice,
 *   finalPrice,
 *   discountAmount,
 *   clearCartItems,
 *   clearCouponSelection,
 *   consumeCoupon
 * })
 * ```
 */
export function useCartCheckout(options: {
  isCartEmpty: ComputedRef<boolean>
  cartItemsList: ComputedRef<CartItem[]>
  cartItemsCount: ComputedRef<number>
  cartTotalPrice: ComputedRef<number>
  finalPrice: ComputedRef<number>
  discountAmount: ComputedRef<number>
  clearCartItems: () => void
  clearCouponSelection: () => void
  consumeCoupon: () => { couponId: string; couponName: string; discountAmount: number } | null
}) {
  const gameStore = useGameStore()
  const { gameData } = storeToRefs(gameStore)
  const { showModal, hideModal } = useModal()
  const { success } = useToast()

  /**
   * 结算购物车
   */
  const checkout = () => {
    if (options.isCartEmpty.value) {
      showModal('购物车为空', '请先添加物品到购物车。')
      return
    }

    const currency = gameData.value.shop?.currency || 0
    const final = options.finalPrice.value

    if (currency < final) {
      showModal(
        '余额不足',
        `您的余额为 ¥${currency.toLocaleString()}，但需要支付 ¥${final.toLocaleString()}。请移除一些物品或充值后再试。`,
        [
          {
            text: '确定',
            class: 'primary',
            action: hideModal,
          },
        ]
      )
      return
    }

    // 直接执行结算，不显示确认对话框
    performCheckout()
  }

  /**
   * 执行结算
   */
  const performCheckout = () => {
    if (!gameData.value.shop) return

    // 初始化 storage 和 inventory（如果不存在）
    if (!gameData.value.storage) {
      gameData.value.storage = { inventory: {} }
    }
    if (!gameData.value.storage.inventory) {
      gameData.value.storage.inventory = {}
    }

    const discount = options.discountAmount.value
    const final = options.finalPrice.value
    const itemCount = options.cartItemsCount.value
    const originalPrice = options.cartTotalPrice.value

    // 保存购物车物品列表（用于记录）
    const purchasedItems = options.cartItemsList.value.map(item => ({
      itemId: item.id,
      itemName: item.name,
      quantity: item.cartQuantity,
      unitPrice: item.price,
      totalPrice: item.price * item.cartQuantity,
    }))

    // 消耗优惠券并保存优惠券信息（用于记录）
    const couponInfo = options.consumeCoupon()

    // 扣除货币（使用优惠后的价格）
    if (gameData.value.shop) {
      gameData.value.shop.currency -= final
    }

    // 获取交易后余额
    const newCurrency = gameData.value.shop?.currency || 0

    // 将购物车物品添加到库存
    options.cartItemsList.value.forEach(cartItem => {
      const inventoryItem = gameData.value.storage!.inventory![cartItem.id]

      if (inventoryItem) {
        // 如果库存中已有该物品，增加数量
        inventoryItem.quantity = (inventoryItem.quantity || 1) + cartItem.cartQuantity
      } else {
        // 如果库存中没有该物品，添加新物品
        gameData.value.storage!.inventory![cartItem.id] = {
          ...cartItem,
          quantity: cartItem.cartQuantity,
        }
      }
    })

    // 记录用户行为（购物车结算）
    gameStore.logUserAction('购物车结算', {
      items: purchasedItems,
      itemCount,
      originalPrice,
      coupon: couponInfo,
      discountAmount: discount,
      finalPrice: final,
      currentBalance: newCurrency,
    })

    // 清空购物车和优惠券选择
    options.clearCartItems()
    options.clearCouponSelection()

    // 显示成功提示（使用 Toast）
    let message = `成功购买 ${itemCount} 件物品`
    if (discount > 0) {
      message += `，节省 ¥${discount.toLocaleString()}`
    }
    message += `，实付 ¥${final.toLocaleString()}`
    success(message)

    logger.debug('结算成功')
  }

  return {
    checkout,
  }
}
