/**
 * 物品效果
 */
export interface ItemEffect {
  operation: 'add' | 'subtract' | 'set' | 'add_status' | 'remove_status'
  value: number | string | Record<string, unknown>
  description?: string
  maxPath?: string
}

/**
 * 优惠券效果
 */
export interface CouponEffect {
  type: 'percentage' | 'fixed' | 'free_shipping'
  value: number // 百分比折扣（如 20 表示 8折）或固定金额
  minPurchase?: number // 最低消费金额
  maxDiscount?: number // 最大折扣金额
}

/**
 * 物品
 */
export interface Item {
  id: string
  name: string
  icon: string
  description: string
  price: number
  category: string
  quantity?: number
  effects?: {
    [path: string]: ItemEffect
  }
  coupon?: CouponEffect // 优惠券效果
}

/**
 * 货币显示模式
 */
export type CurrencyDisplayMode = 'symbol' | 'name'

/**
 * 商店数据
 */
export interface ShopData {
  currency: number
  currencyType?: string // 货币类型：符号（如 "¥"、"CNY"）或名称（如 "金币"、"积分"）
  currencyDisplayMode?: CurrencyDisplayMode // 显示模式：'symbol' = 货币类型在前，'name' = 数值在前
  items: {
    [itemId: string]: Item
  }
}

/**
 * 存储数据
 */
export interface StorageData {
  inventory: {
    [itemId: string]: Item
  }
}
