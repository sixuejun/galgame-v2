/**
 * @file useShop.ts
 * @description 商店业务逻辑 Composable - 处理商店的购买和出售操作
 * @author Eden System Team
 */

import { storeToRefs } from 'pinia'
import { useGameStore } from '../../stores/gameStore'
import { useModal } from '../ui/useModal'
import { useToast } from '../ui/useToast'

/**
 * 商店业务逻辑 Composable
 *
 * 提供商店的购买和出售功能。
 *
 * @returns 商店操作方法
 */
export function useShop() {
  const gameStore = useGameStore()
  const { gameData } = storeToRefs(gameStore)
  const { showModal } = useModal()
  const { success } = useToast()

  /**
   * 购买物品
   * @param itemId - 物品ID
   * @returns void
   * @description 从商店购买物品，扣除货币并添加到库存
   */
  const buyItem = (itemId: string) => {
    const item = gameData.value.shop?.items?.[itemId]
    if (!item) {
      showModal('错误', '找不到该物品。')
      return
    }

    const currentCurrency = gameData.value.shop?.currency || 0
    if (currentCurrency < item.price) {
      showModal('资金不足', '您的资产不足以购买此物品。')
      return
    }

    // 扣除货币
    const newCurrency = currentCurrency - item.price
    if (gameData.value.shop) {
      gameData.value.shop.currency = newCurrency
    }

    // 初始化 storage 和 inventory（如果不存在）
    if (!gameData.value.storage) {
      gameData.value.storage = { inventory: {} }
    }
    if (!gameData.value.storage.inventory) {
      gameData.value.storage.inventory = {}
    }

    // 添加到库存
    const inventory = gameData.value.storage.inventory
    const existingItem = inventory[itemId]
    if (existingItem) {
      existingItem.quantity = (existingItem.quantity || 1) + 1
    } else {
      inventory[itemId] = { ...item, quantity: 1 }
    }

    // 记录用户行为
    gameStore.logUserAction('购买物品', {
      itemId,
      itemName: item.name,
      price: item.price,
      newCurrency,
    })

    // 使用 Toast 显示成功提示
    success(`成功购买【${item.name}】！`)
  }

  return {
    buyItem,
  }
}
