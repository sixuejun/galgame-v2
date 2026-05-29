import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useShoppingCart } from '../shop/useShoppingCart'
import { useGameStore } from '../../stores/gameStore'
import type { GameData, Item } from '../../types'

// 创建 mock 函数
const mockShowModal = vi.fn()
const mockHideModal = vi.fn()
const mockSuccess = vi.fn()
const mockShowConfirm = vi.fn()

// Mock useModal
vi.mock('../ui/useModal', () => ({
  useModal: () => ({
    showModal: mockShowModal,
    showConfirm: mockShowConfirm,
    hideModal: mockHideModal,
  }),
}))

// Mock useToast
vi.mock('../ui/useToast', () => ({
  useToast: () => ({
    success: mockSuccess,
  }),
}))

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('useShoppingCart', () => {
  const createMockItem = (id: string, name: string, price: number): Item => ({
    id,
    name,
    description: `测试物品 ${name}`,
    price,
    icon: '🎁',
    category: 'consumable',
  })

  const createMockGameData = (): GameData => ({
    shop: {
      currency: 1000,
      items: {
        item1: createMockItem('item1', '生命药水', 100),
        item2: createMockItem('item2', '魔法药水', 150),
        item3: createMockItem('item3', '铁剑', 500),
      },
    },
    storage: {
      inventory: {
        coupon1: {
          id: 'coupon1',
          name: '九折优惠券',
          description: '享受九折优惠',
          price: 0,
          icon: '🎫',
          category: 'coupon',
          quantity: 2,
          coupon: {
            type: 'percentage',
            value: 10, // 10% 折扣
            minPurchase: 100,
          },
        },
        coupon2: {
          id: 'coupon2',
          name: '满500减100',
          description: '满500减100',
          price: 0,
          icon: '🎫',
          category: 'coupon',
          quantity: 1,
          coupon: {
            type: 'fixed',
            value: 100,
            minPurchase: 500,
          },
        },
        coupon3: {
          id: 'coupon3',
          name: '八折优惠券（限额50）',
          description: '八折优惠，最多减50',
          price: 0,
          icon: '🎫',
          category: 'coupon',
          quantity: 1,
          coupon: {
            type: 'percentage',
            value: 20, // 20% 折扣
            minPurchase: 100,
            maxDiscount: 50,
          },
        },
      },
    },
  })

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    // 清空购物车状态（因为 cartItems 和 selectedCouponId 是模块级别的变量）
    const { cartItems, selectedCouponId } = useShoppingCart()
    cartItems.value.clear()
    selectedCouponId.value = null
  })

  describe('初始状态', () => {
    it('购物车应该为空', () => {
      const { cartItemsList, cartItemsCount, cartTotalPrice, isCartEmpty } = useShoppingCart()

      expect(cartItemsList.value).toEqual([])
      expect(cartItemsCount.value).toBe(0)
      expect(cartTotalPrice.value).toBe(0)
      expect(isCartEmpty.value).toBe(true)
    })

    it('应该没有选中的优惠券', () => {
      const { selectedCouponId, selectedCoupon, discountAmount, finalPrice } = useShoppingCart()

      expect(selectedCouponId.value).toBeNull()
      expect(selectedCoupon.value).toBeNull()
      expect(discountAmount.value).toBe(0)
      expect(finalPrice.value).toBe(0)
    })
  })

  describe('addToCart', () => {
    it('应该成功添加物品到购物车', () => {
      const { addToCart, cartItemsList, cartItemsCount, cartTotalPrice } = useShoppingCart()
      const item = createMockItem('item1', '生命药水', 100)

      addToCart(item, 2)

      expect(cartItemsList.value).toHaveLength(1)
      expect(cartItemsList.value[0]).toMatchObject({
        id: 'item1',
        name: '生命药水',
        price: 100,
        cartQuantity: 2,
      })
      expect(cartItemsCount.value).toBe(2)
      expect(cartTotalPrice.value).toBe(200)
    })

    it('应该正确处理重复添加同一物品', () => {
      const { addToCart, cartItemsList, cartItemsCount } = useShoppingCart()
      const item = createMockItem('item1', '生命药水', 100)

      addToCart(item, 1)
      addToCart(item, 2)

      expect(cartItemsList.value).toHaveLength(1)
      expect(cartItemsList.value[0].cartQuantity).toBe(3)
      expect(cartItemsCount.value).toBe(3)
    })

    it('应该支持添加多个不同物品', () => {
      const { addToCart, cartItemsList, cartItemsCount, cartTotalPrice } = useShoppingCart()
      const item1 = createMockItem('item1', '生命药水', 100)
      const item2 = createMockItem('item2', '魔法药水', 150)

      addToCart(item1, 2)
      addToCart(item2, 1)

      expect(cartItemsList.value).toHaveLength(2)
      expect(cartItemsCount.value).toBe(3)
      expect(cartTotalPrice.value).toBe(350)
    })

    it('默认数量应该为 1', () => {
      const { addToCart, cartItemsList } = useShoppingCart()
      const item = createMockItem('item1', '生命药水', 100)

      addToCart(item)

      expect(cartItemsList.value[0].cartQuantity).toBe(1)
    })
  })

  describe('removeFromCart', () => {
    it('应该成功从购物车移除物品', () => {
      const { addToCart, removeFromCart, cartItemsList, isCartEmpty } = useShoppingCart()
      const item = createMockItem('item1', '生命药水', 100)

      addToCart(item, 2)
      removeFromCart('item1')

      expect(cartItemsList.value).toHaveLength(0)
      expect(isCartEmpty.value).toBe(true)
    })

    it('移除不存在的物品不应该报错', () => {
      const { removeFromCart, cartItemsList } = useShoppingCart()

      expect(() => removeFromCart('nonexistent')).not.toThrow()
      expect(cartItemsList.value).toHaveLength(0)
    })

    it('应该只移除指定的物品', () => {
      const { addToCart, removeFromCart, cartItemsList } = useShoppingCart()
      const item1 = createMockItem('item1', '生命药水', 100)
      const item2 = createMockItem('item2', '魔法药水', 150)

      addToCart(item1, 1)
      addToCart(item2, 1)
      removeFromCart('item1')

      expect(cartItemsList.value).toHaveLength(1)
      expect(cartItemsList.value[0].id).toBe('item2')
    })
  })

  describe('updateQuantity', () => {
    it('应该成功更新物品数量', () => {
      const { addToCart, updateQuantity, cartItemsList } = useShoppingCart()
      const item = createMockItem('item1', '生命药水', 100)

      addToCart(item, 2)
      updateQuantity('item1', 5)

      expect(cartItemsList.value[0].cartQuantity).toBe(5)
    })

    it('数量为 0 时应该移除物品', () => {
      const { addToCart, updateQuantity, cartItemsList } = useShoppingCart()
      const item = createMockItem('item1', '生命药水', 100)

      addToCart(item, 2)
      updateQuantity('item1', 0)

      expect(cartItemsList.value).toHaveLength(0)
    })

    it('数量为负数时应该移除物品', () => {
      const { addToCart, updateQuantity, cartItemsList } = useShoppingCart()
      const item = createMockItem('item1', '生命药水', 100)

      addToCart(item, 2)
      updateQuantity('item1', -1)

      expect(cartItemsList.value).toHaveLength(0)
    })

    it('更新不存在的物品不应该报错', () => {
      const { updateQuantity, cartItemsList } = useShoppingCart()

      expect(() => updateQuantity('nonexistent', 5)).not.toThrow()
      expect(cartItemsList.value).toHaveLength(0)
    })
  })

  describe('优惠券功能', () => {
    it('应该正确列出可用的优惠券', () => {
      const gameStore = useGameStore()
      gameStore.setGameData(createMockGameData())

      const { addToCart, availableCoupons } = useShoppingCart()
      const item = createMockItem('item1', '生命药水', 100)

      addToCart(item, 2) // 总价 200

      // 应该有 2 个可用优惠券（九折和八折，满500减100不满足条件）
      expect(availableCoupons.value).toHaveLength(2)
      expect(availableCoupons.value.map(c => c.id)).toContain('coupon1')
      expect(availableCoupons.value.map(c => c.id)).toContain('coupon3')
    })

    it('应该根据最低消费筛选优惠券', () => {
      const gameStore = useGameStore()
      gameStore.setGameData(createMockGameData())

      const { addToCart, availableCoupons } = useShoppingCart()
      const item = createMockItem('item3', '铁剑', 500)

      addToCart(item, 1) // 总价 500

      // 应该有 3 个可用优惠券（都满足条件）
      expect(availableCoupons.value).toHaveLength(3)
    })

    it('应该正确选择优惠券', () => {
      const gameStore = useGameStore()
      gameStore.setGameData(createMockGameData())

      const { selectCoupon, selectedCouponId, selectedCoupon } = useShoppingCart()

      selectCoupon('coupon1')

      expect(selectedCouponId.value).toBe('coupon1')
      expect(selectedCoupon.value?.id).toBe('coupon1')
    })

    it('应该支持取消选择优惠券', () => {
      const gameStore = useGameStore()
      gameStore.setGameData(createMockGameData())

      const { selectCoupon, selectedCouponId } = useShoppingCart()

      selectCoupon('coupon1')
      selectCoupon(null)

      expect(selectedCouponId.value).toBeNull()
    })

    it('应该正确计算百分比折扣', () => {
      const gameStore = useGameStore()
      gameStore.setGameData(createMockGameData())

      const { addToCart, selectCoupon, discountAmount, finalPrice } = useShoppingCart()
      const item = createMockItem('item1', '生命药水', 100)

      addToCart(item, 2) // 总价 200
      selectCoupon('coupon1') // 10% 折扣

      expect(discountAmount.value).toBe(20) // 200 * 10% = 20
      expect(finalPrice.value).toBe(180) // 200 - 20 = 180
    })

    it('应该正确计算固定金额折扣', () => {
      const gameStore = useGameStore()
      gameStore.setGameData(createMockGameData())

      const { addToCart, selectCoupon, discountAmount, finalPrice } = useShoppingCart()
      const item = createMockItem('item3', '铁剑', 500)

      addToCart(item, 1) // 总价 500
      selectCoupon('coupon2') // 满500减100

      expect(discountAmount.value).toBe(100)
      expect(finalPrice.value).toBe(400)
    })

    it('应该正确处理有最大折扣限制的优惠券', () => {
      const gameStore = useGameStore()
      gameStore.setGameData(createMockGameData())

      const { addToCart, selectCoupon, discountAmount, finalPrice } = useShoppingCart()
      const item = createMockItem('item3', '铁剑', 500)

      addToCart(item, 1) // 总价 500
      selectCoupon('coupon3') // 20% 折扣，最多减50

      // 500 * 20% = 100，但最多减50
      expect(discountAmount.value).toBe(50)
      expect(finalPrice.value).toBe(450)
    })

    it('固定金额折扣不应该超过总价', () => {
      const gameStore = useGameStore()
      gameStore.setGameData(createMockGameData())

      const { addToCart, selectCoupon, discountAmount, finalPrice } = useShoppingCart()
      const item = createMockItem('item1', '生命药水', 100)

      addToCart(item, 1) // 总价 100
      selectCoupon('coupon2') // 满500减100（但总价只有100）

      // 折扣不应该超过总价
      expect(discountAmount.value).toBe(100)
      expect(finalPrice.value).toBe(0)
    })

    it('没有选择优惠券时折扣应该为 0', () => {
      const { addToCart, discountAmount, finalPrice } = useShoppingCart()
      const item = createMockItem('item1', '生命药水', 100)

      addToCart(item, 2)

      expect(discountAmount.value).toBe(0)
      expect(finalPrice.value).toBe(200)
    })
  })

  describe('clearCart', () => {
    it('应该显示确认对话框', () => {
      const { clearCart } = useShoppingCart()

      clearCart()

      expect(mockShowModal).toHaveBeenCalledWith(
        '确认清空',
        '确定要清空购物车吗？此操作不可撤销。',
        expect.any(Array)
      )
    })

    it('确认后应该清空购物车', () => {
      const { addToCart, clearCart, cartItemsList, selectedCouponId } = useShoppingCart()
      const item = createMockItem('item1', '生命药水', 100)

      addToCart(item, 2)

      // 模拟点击确认按钮
      clearCart()
      const confirmButton = mockShowModal.mock.calls[0][2][0]
      confirmButton.action()

      expect(cartItemsList.value).toHaveLength(0)
      expect(selectedCouponId.value).toBeNull()
      expect(mockHideModal).toHaveBeenCalled()
    })

    it('取消后不应该清空购物车', () => {
      const { addToCart, clearCart, cartItemsList } = useShoppingCart()
      const item = createMockItem('item1', '生命药水', 100)

      addToCart(item, 2)

      // 模拟点击取消按钮
      clearCart()
      const cancelButton = mockShowModal.mock.calls[0][2][1]
      cancelButton.action()

      expect(cartItemsList.value).toHaveLength(1)
      expect(mockHideModal).toHaveBeenCalled()
    })
  })

  describe('checkout', () => {
    it('购物车为空时应该显示错误', () => {
      const { checkout } = useShoppingCart()

      checkout()

      expect(mockShowModal).toHaveBeenCalledWith('购物车为空', '请先添加物品到购物车。')
    })

    it('余额不足时应该显示错误', () => {
      const gameStore = useGameStore()
      const gameData = createMockGameData()
      gameData.shop!.currency = 50
      gameStore.setGameData(gameData)

      const { addToCart, checkout } = useShoppingCart()
      const item = createMockItem('item1', '生命药水', 100)

      addToCart(item, 1)
      checkout()

      expect(mockShowModal).toHaveBeenCalledWith(
        '余额不足',
        expect.stringContaining('您的余额为 ¥50，但需要支付 ¥100'),
        expect.any(Array)
      )
    })

    it('应该成功结算购物车', () => {
      const gameStore = useGameStore()
      gameStore.setGameData(createMockGameData())

      const { addToCart, checkout, cartItemsList } = useShoppingCart()
      const item = createMockItem('item1', '生命药水', 100)

      addToCart(item, 2)
      checkout()

      // 验证货币扣除
      expect(gameStore.gameData.shop?.currency).toBe(800) // 1000 - 200

      // 验证物品添加到库存
      expect(gameStore.gameData.storage?.inventory?.item1).toMatchObject({
        id: 'item1',
        quantity: 2,
      })

      // 验证购物车清空
      expect(cartItemsList.value).toHaveLength(0)

      // 验证显示成功提示
      expect(mockSuccess).toHaveBeenCalledWith(expect.stringContaining('成功购买 2 件物品'))
    })

    it('应该正确处理使用优惠券的结算', () => {
      const gameStore = useGameStore()
      gameStore.setGameData(createMockGameData())

      const { addToCart, selectCoupon, checkout, selectedCouponId } = useShoppingCart()
      const item = createMockItem('item1', '生命药水', 100)

      addToCart(item, 2) // 总价 200
      selectCoupon('coupon1') // 10% 折扣
      checkout()

      // 验证货币扣除（应用折扣后）
      expect(gameStore.gameData.shop?.currency).toBe(820) // 1000 - 180

      // 验证优惠券数量减少
      expect(gameStore.gameData.storage?.inventory?.coupon1?.quantity).toBe(1)

      // 验证优惠券选择被清空
      expect(selectedCouponId.value).toBeNull()

      // 验证显示成功提示（包含节省金额）
      expect(mockSuccess).toHaveBeenCalledWith(expect.stringContaining('节省 ¥20'))
    })

    it('优惠券用完后应该从库存中删除', () => {
      const gameStore = useGameStore()
      const gameData = createMockGameData()
      gameData.storage!.inventory!.coupon1!.quantity = 1 // 只有1张
      gameStore.setGameData(gameData)

      const { addToCart, selectCoupon, checkout } = useShoppingCart()
      const item = createMockItem('item1', '生命药水', 100)

      addToCart(item, 2)
      selectCoupon('coupon1')
      checkout()

      // 验证优惠券被删除
      expect(gameStore.gameData.storage?.inventory?.coupon1).toBeUndefined()
    })

    it('应该正确处理库存中已有物品的情况', () => {
      const gameStore = useGameStore()
      const gameData = createMockGameData()
      gameData.storage!.inventory!.item1 = {
        ...createMockItem('item1', '生命药水', 100),
        quantity: 3,
      }
      gameStore.setGameData(gameData)

      const { addToCart, checkout } = useShoppingCart()
      const item = createMockItem('item1', '生命药水', 100)

      addToCart(item, 2)
      checkout()

      // 验证数量累加
      expect(gameStore.gameData.storage?.inventory?.item1?.quantity).toBe(5) // 3 + 2
    })

    it('应该正确处理库存中物品没有 quantity 的情况', () => {
      const gameStore = useGameStore()
      const gameData = createMockGameData()
      gameData.storage!.inventory!.item1 = createMockItem('item1', '生命药水', 100)
      gameStore.setGameData(gameData)

      const { addToCart, checkout } = useShoppingCart()
      const item = createMockItem('item1', '生命药水', 100)

      addToCart(item, 2)
      checkout()

      // 验证数量正确累加（1 + 2 = 3）
      expect(gameStore.gameData.storage?.inventory?.item1?.quantity).toBe(3)
    })

    it('应该记录用户行为', () => {
      const gameStore = useGameStore()
      gameStore.setGameData(createMockGameData())
      const logUserActionSpy = vi.spyOn(gameStore, 'logUserAction')

      const { addToCart, checkout } = useShoppingCart()
      const item = createMockItem('item1', '生命药水', 100)

      addToCart(item, 2)
      checkout()

      expect(logUserActionSpy).toHaveBeenCalledWith('购物车结算', {
        items: expect.arrayContaining([
          expect.objectContaining({
            itemId: 'item1',
            itemName: '生命药水',
            quantity: 2,
            unitPrice: 100,
            totalPrice: 200,
          }),
        ]),
        itemCount: 2,
        originalPrice: 200,
        coupon: null,
        discountAmount: 0,
        finalPrice: 200,
        currentBalance: 800,
      })
    })

    it('使用优惠券时应该记录优惠券信息', () => {
      const gameStore = useGameStore()
      gameStore.setGameData(createMockGameData())
      const logUserActionSpy = vi.spyOn(gameStore, 'logUserAction')

      const { addToCart, selectCoupon, checkout } = useShoppingCart()
      const item = createMockItem('item1', '生命药水', 100)

      addToCart(item, 2)
      selectCoupon('coupon1')
      checkout()

      expect(logUserActionSpy).toHaveBeenCalledWith('购物车结算', {
        items: expect.any(Array),
        itemCount: 2,
        originalPrice: 200,
        coupon: {
          couponId: 'coupon1',
          couponName: '九折优惠券',
          discountAmount: 20,
        },
        discountAmount: 20,
        finalPrice: 180,
        currentBalance: 820,
      })
    })

    it('当 shop 为 undefined 时应该提前返回', () => {
      const gameStore = useGameStore()
      gameStore.setGameData({})

      const { addToCart, checkout } = useShoppingCart()
      const item = createMockItem('item1', '生命药水', 100)

      addToCart(item, 1)

      // 不应该抛出错误
      expect(() => checkout()).not.toThrow()
    })

    it('当 storage 为 undefined 时应该提前返回', () => {
      const gameStore = useGameStore()
      const gameData = createMockGameData()
      gameData.storage = undefined
      gameStore.setGameData(gameData)

      const { addToCart, checkout } = useShoppingCart()
      const item = createMockItem('item1', '生命药水', 100)

      addToCart(item, 1)

      // 不应该抛出错误
      expect(() => checkout()).not.toThrow()
    })

    it('应该正确处理多个物品的结算', () => {
      const gameStore = useGameStore()
      gameStore.setGameData(createMockGameData())

      const { addToCart, checkout } = useShoppingCart()
      const item1 = createMockItem('item1', '生命药水', 100)
      const item2 = createMockItem('item2', '魔法药水', 150)

      addToCart(item1, 2)
      addToCart(item2, 1)
      checkout()

      // 验证货币扣除
      expect(gameStore.gameData.shop?.currency).toBe(650) // 1000 - 350

      // 验证所有物品都添加到库存
      expect(gameStore.gameData.storage?.inventory?.item1?.quantity).toBe(2)
      expect(gameStore.gameData.storage?.inventory?.item2?.quantity).toBe(1)

      // 验证显示成功提示
      expect(mockSuccess).toHaveBeenCalledWith(expect.stringContaining('成功购买 3 件物品'))
    })
  })
})
