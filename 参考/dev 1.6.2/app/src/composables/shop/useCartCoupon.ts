/**
 * @file useCartCoupon.ts
 * @description 购物车优惠券系统 Composable - 管理优惠券的选择和折扣计算
 * @author Eden System Team
 */

import { ref, computed, type ComputedRef } from 'vue'
import { storeToRefs } from 'pinia'
import type { Item } from '../../types'
import { useGameStore } from '../../stores/gameStore'
import { logger } from '../../utils/logger'

// 全局选中的优惠券 ID（单例模式）
const selectedCouponId = ref<string | null>(null)

/**
 * 购物车优惠券系统 Composable
 *
 * 提供优惠券的选择、折扣计算等功能。
 *
 * @param cartTotalPrice - 购物车总价的计算属性
 * @returns 优惠券状态和操作方法
 *
 * @example
 * ```typescript
 * const { cartTotalPrice } = useCart()
 * const { availableCoupons, selectCoupon, discountAmount } = useCartCoupon(cartTotalPrice)
 * ```
 */
export function useCartCoupon(cartTotalPrice: ComputedRef<number>) {
  const gameStore = useGameStore()
  const { gameData } = storeToRefs(gameStore)

  /**
   * 可用的优惠券列表
   */
  const availableCoupons = computed(() => {
    const inventory = gameData.value.storage?.inventory || {}
    const coupons: Item[] = []

    Object.values(inventory).forEach(item => {
      if (item.category === 'coupon' && item.coupon && (item.quantity || 0) > 0) {
        // 检查是否满足最低消费
        const minPurchase = item.coupon.minPurchase || 0
        if (cartTotalPrice.value >= minPurchase) {
          coupons.push(item)
        }
      }
    })

    return coupons
  })

  /**
   * 当前选中的优惠券
   */
  const selectedCoupon = computed(() => {
    if (!selectedCouponId.value) return null
    const inventory = gameData.value.storage?.inventory || {}
    return inventory[selectedCouponId.value] || null
  })

  /**
   * 优惠金额
   */
  const discountAmount = computed(() => {
    if (!selectedCoupon.value || !selectedCoupon.value.coupon) return 0

    const coupon = selectedCoupon.value.coupon
    const totalPrice = cartTotalPrice.value

    if (coupon.type === 'percentage') {
      // 百分比折扣
      const discount = Math.floor(totalPrice * (coupon.value / 100))
      // 如果有最大折扣限制
      if (coupon.maxDiscount) {
        return Math.min(discount, coupon.maxDiscount)
      }
      return discount
    } else if (coupon.type === 'fixed') {
      // 固定金额折扣
      return Math.min(coupon.value, totalPrice)
    }

    return 0
  })

  /**
   * 最终价格（应用优惠后）
   */
  const finalPrice = computed(() => {
    return Math.max(0, cartTotalPrice.value - discountAmount.value)
  })

  /**
   * 选择优惠券
   *
   * @param couponId - 优惠券 ID（null 表示取消选择）
   */
  const selectCoupon = (couponId: string | null) => {
    selectedCouponId.value = couponId
    logger.debug('选择优惠券:', couponId)
  }

  /**
   * 清空优惠券选择（内部方法）
   */
  const clearCouponSelection = () => {
    selectedCouponId.value = null
  }

  /**
   * 消耗优惠券（减少数量或删除）
   */
  const consumeCoupon = () => {
    if (!selectedCouponId.value || !gameData.value.storage?.inventory) return null

    const coupon = gameData.value.storage.inventory[selectedCouponId.value]
    if (!coupon || !coupon.quantity) return null

    // 保存优惠券信息（用于记录）
    const couponInfo = {
      couponId: selectedCouponId.value,
      couponName: coupon.name,
      discountAmount: discountAmount.value,
    }

    // 减少优惠券数量
    coupon.quantity -= 1

    // 如果数量为 0，删除该优惠券
    if (coupon.quantity <= 0) {
      delete gameData.value.storage.inventory[selectedCouponId.value]
    }

    logger.debug(`消耗优惠券: ${coupon.name}`)

    return couponInfo
  }

  return {
    // 状态
    availableCoupons,
    selectedCoupon,
    selectedCouponId,
    discountAmount,
    finalPrice,

    // 方法
    selectCoupon,
    clearCouponSelection,
    consumeCoupon,
  }
}
