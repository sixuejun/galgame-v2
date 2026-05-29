/**
 * @file useItemEffects.ts
 * @description 物品效果处理 Composable - 处理物品使用效果的应用
 * @author Eden System Team
 */

import { storeToRefs } from 'pinia'
import { useGameStore } from '../../stores/gameStore'
import { useToast } from '../ui/useToast'
import { getDataByPath, setDataByPath } from '../../utils/pathUtils'
import type { Item } from '../../types'

/**
 * 物品效果处理 Composable
 *
 * 提供物品效果的应用功能，支持多种操作类型（add、subtract、set、add_status、remove_status）。
 *
 * @returns 物品效果处理方法
 *
 * @example
 * ```typescript
 * const { applyItemEffect } = useItemEffects()
 *
 * // 使用物品
 * await applyItemEffect(item, 1)
 * ```
 */
export function useItemEffects() {
  const gameStore = useGameStore()
  const { gameData } = storeToRefs(gameStore)
  const { success, info } = useToast()

  /**
   * 获取操作动词
   * @param operation - 操作类型（add, subtract, set, add_status, remove_status）
   * @returns 中文动词描述
   */
  const getActionVerb = (operation: string): string => {
    const verbMap: Record<string, string> = {
      add: '增加',
      subtract: '减少',
      set: '设置',
      add_status: '获得',
      remove_status: '移除',
    }
    return verbMap[operation] || '改变'
  }

  /**
   * 应用物品效果
   * @param item - 物品对象
   * @param quantity - 使用数量，默认为1
   * @returns Promise<void>
   * @description 根据物品的effects配置修改游戏数据，支持add、subtract、set等操作
   */
  const applyItemEffect = async (item: Item, quantity: number = 1) => {
    if (
      !item.effects ||
      typeof item.effects !== 'object' ||
      Object.keys(item.effects).length === 0
    ) {
      info(`【${item.name}】似乎没有立即可见的效果`)
      return
    }

    let effectDescriptions: string[] = []
    let effectsApplied = false

    for (const path in item.effects) {
      const effect = item.effects[path]
      const pathParts = path.split('.')
      const finalKey = pathParts.pop()!
      const parentPath = pathParts.join('.')
      const parentObj = getDataByPath(gameData.value, parentPath) as Record<string, unknown>

      if (parentObj && typeof parentObj === 'object' && finalKey) {
        let currentValue = parentObj[finalKey] as number | unknown[]
        let newValue: number | unknown[]
        let actualEffectValue = effect.value

        // 如果是数值类型的效果，乘以数量
        if (
          typeof effect.value === 'number' &&
          (effect.operation === 'add' || effect.operation === 'subtract')
        ) {
          actualEffectValue = effect.value * quantity
        }

        switch (effect.operation) {
          case 'add':
            newValue = ((currentValue as number) || 0) + (actualEffectValue as number)
            break
          case 'subtract':
            newValue = ((currentValue as number) || 0) - (actualEffectValue as number)
            break
          case 'set':
            newValue = actualEffectValue as number
            break
          case 'add_status':
            newValue = Array.isArray(currentValue)
              ? [...currentValue, actualEffectValue]
              : [actualEffectValue]
            break
          case 'remove_status':
            newValue = Array.isArray(currentValue)
              ? currentValue.filter((s: unknown) => {
                  if (typeof s === 'object' && s !== null && 'id' in s) {
                    return (s as { id: unknown }).id !== actualEffectValue
                  }
                  return true
                })
              : []
            break
          default:
            continue
        }

        // 检查最大值限制
        if (effect.maxPath && typeof newValue === 'number') {
          const maxVal = getDataByPath(gameData.value, effect.maxPath) as number
          if (typeof maxVal === 'number') {
            newValue = Math.min(maxVal, newValue)
          }
        }

        parentObj[finalKey] = newValue
        setDataByPath(gameData.value as Record<string, unknown>, path, newValue)
        effectsApplied = true

        // 构建效果描述：{动作}了 {数值} {描述}
        if (effect.description) {
          const actionVerb = getActionVerb(effect.operation)
          if (typeof actualEffectValue === 'number') {
            effectDescriptions.push(`${actionVerb}了 ${actualEffectValue} ${effect.description}`)
          } else {
            effectDescriptions.push(`${actionVerb}了 ${effect.description}`)
          }
        }
      }
    }

    if (effectsApplied) {
      // 新格式：使用了 {数量} 个 {物品名称}，{效果描述}
      const quantityText = quantity > 1 ? `${quantity} 个` : ''
      const message =
        effectDescriptions.length > 0
          ? `使用了 ${quantityText}${item.name}，${effectDescriptions.join('，')}`
          : `使用了 ${quantityText}${item.name}`
      success(message)
    }
  }

  /**
   * 使用物品
   */
  const useItem = async (itemId: string, quantity: number = 1) => {
    const item = gameData.value.storage?.inventory?.[itemId]
    if (!item) return

    // 确保使用数量不超过拥有数量
    const actualQuantity = Math.min(quantity, item.quantity || 1)
    if (actualQuantity <= 0) return

    const hasEffects =
      item.effects && typeof item.effects === 'object' && Object.keys(item.effects).length > 0

    // 收集效果信息（用于记录）
    let effectDetails: Array<{
      path: string
      operation: string
      value: number | string | Record<string, unknown>
      description?: string
    }> = []
    if (hasEffects && item.effects) {
      for (const path in item.effects) {
        const effect = item.effects[path]
        let actualEffectValue = effect.value
        // 如果是数值类型的效果，乘以数量
        if (
          typeof effect.value === 'number' &&
          (effect.operation === 'add' || effect.operation === 'subtract')
        ) {
          actualEffectValue = effect.value * actualQuantity
        }
        effectDetails.push({
          path,
          operation: effect.operation,
          value: actualEffectValue,
          description: effect.description,
        })
      }
    }

    // 应用效果
    if (hasEffects) {
      await applyItemEffect(item, actualQuantity)
    }

    // 减少数量
    item.quantity = (item.quantity || 1) - actualQuantity

    if (item.quantity <= 0) {
      delete gameData.value.storage!.inventory[itemId]
    }

    // 记录用户行为（包含效果详情）
    if (hasEffects) {
      // 有效果：记录具体效果
      gameStore.logUserAction('使用物品', {
        itemId,
        itemName: item.name,
        quantity: actualQuantity,
        remaining: item.quantity,
        hasEffects: true,
        effects: effectDetails,
      })
    } else {
      // 无效果：特别标注
      gameStore.logUserAction('使用物品', {
        itemId,
        itemName: item.name,
        quantity: actualQuantity,
        remaining: item.quantity,
        hasEffects: false,
        note: '该物品无特殊效果',
      })
      const quantityText = actualQuantity > 1 ? `${actualQuantity} 个` : ''
      info(`使用了 ${quantityText}${item.name}，该物品无特殊效果`)
    }
  }

  return {
    applyItemEffect,
    useItem,
  }
}
