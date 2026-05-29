// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import CartPage from '../CartPage.vue'
import type { Config, ShopData } from '../../../types'

// Mock 子组件
vi.mock('../../common/ErrorBoundary.vue', () => ({
  default: {
    name: 'ErrorBoundary',
    template: '<div class="error-boundary-mock"><slot /></div>',
  },
}))

vi.mock('../CartPage/CartHeader.vue', () => ({
  default: {
    name: 'CartHeader',
    template: '<div class="cart-header-mock"></div>',
  },
}))

vi.mock('../CartPage/CartEmptyState.vue', () => ({
  default: {
    name: 'CartEmptyState',
    template: '<div class="cart-empty-state-mock"></div>',
  },
}))

vi.mock('../CartPage/CartItemList.vue', () => ({
  default: {
    name: 'CartItemList',
    template: '<div class="cart-item-list-mock"></div>',
  },
}))

vi.mock('../CartPage/CouponSelector.vue', () => ({
  default: {
    name: 'CouponSelector',
    template: '<div class="coupon-selector-mock"></div>',
  },
}))

vi.mock('../CartPage/CartSummary.vue', () => ({
  default: {
    name: 'CartSummary',
    template: '<div class="cart-summary-mock"></div>',
  },
}))

// Mock composables
const mockNavigateTo = vi.fn()
const mockUpdateQuantity = vi.fn()
const mockRemoveFromCart = vi.fn()
const mockSelectCoupon = vi.fn()
const mockClearCart = vi.fn()
const mockCheckout = vi.fn()

// 使用 ref 创建响应式变量
const mockCartItemsList = ref<unknown[]>([])
const mockCartItemsCount = ref(0)
const mockCartTotalPrice = ref(0)
const mockIsCartEmpty = ref(true)
const mockAvailableCoupons = ref<unknown[]>([])
const mockSelectedCouponId = ref('')
const mockDiscountAmount = ref(0)
const mockFinalPrice = ref(0)

vi.mock('../../../composables/ui/usePageNavigation', () => ({
  usePageNavigation: () => ({
    navigateTo: mockNavigateTo,
  }),
}))

vi.mock('../../../composables/shop/useShoppingCart', () => ({
  useShoppingCart: () => ({
    cartItemsList: mockCartItemsList,
    cartItemsCount: mockCartItemsCount,
    cartTotalPrice: mockCartTotalPrice,
    isCartEmpty: mockIsCartEmpty,
    availableCoupons: mockAvailableCoupons,
    selectedCouponId: mockSelectedCouponId,
    discountAmount: mockDiscountAmount,
    finalPrice: mockFinalPrice,
    updateQuantity: mockUpdateQuantity,
    removeFromCart: mockRemoveFromCart,
    selectCoupon: mockSelectCoupon,
    clearCart: mockClearCart,
    checkout: mockCheckout,
  }),
}))

vi.mock('../../../utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('CartPage', () => {
  let defaultProps: { config?: Config; shop?: ShopData }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    // 重置 mock 状态
    mockCartItemsList.value = []
    mockCartItemsCount.value = 0
    mockCartTotalPrice.value = 0
    mockIsCartEmpty.value = true
    mockAvailableCoupons.value = []
    mockSelectedCouponId.value = ''
    mockDiscountAmount.value = 0
    mockFinalPrice.value = 0

    defaultProps = {
      config: {
        version: '1.0.0',
        phase: 'test',
        home: {
          title: 'Test Game',
          subtitle: 'Test Subtitle',
        },
        cart: {
          title: '购物车',
          icon: '🛒',
        },
      },
    }
  })

  describe('渲染测试', () => {
    it('应该渲染购物车页面容器', () => {
      const wrapper = mount(CartPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.page-cart').exists()).toBe(true)
    })

    it('应该渲染 ErrorBoundary', () => {
      const wrapper = mount(CartPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.error-boundary-mock').exists()).toBe(true)
    })

    it('应该渲染 CartHeader', () => {
      const wrapper = mount(CartPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.cart-header-mock').exists()).toBe(true)
    })
  })

  describe('空购物车状态', () => {
    it('当购物车为空时应该显示空状态', () => {
      mockIsCartEmpty.value = true
      const wrapper = mount(CartPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.cart-empty-state-mock').exists()).toBe(true)
      expect(wrapper.find('.cart-item-list-mock').exists()).toBe(false)
    })

    it('当购物车不为空时不应该显示空状态', () => {
      mockIsCartEmpty.value = false
      mockCartItemsCount.value = 2
      const wrapper = mount(CartPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.cart-empty-state-mock').exists()).toBe(false)
      expect(wrapper.find('.cart-item-list-mock').exists()).toBe(true)
    })
  })

  describe('购物车内容', () => {
    beforeEach(() => {
      mockIsCartEmpty.value = false
      mockCartItemsCount.value = 2
      mockCartItemsList.value = [
        { id: 'item1', name: '商品1', price: 100, quantity: 1 },
        { id: 'item2', name: '商品2', price: 200, quantity: 2 },
      ]
      mockCartTotalPrice.value = 500
      mockFinalPrice.value = 500
    })

    it('应该渲染商品列表', () => {
      const wrapper = mount(CartPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.cart-item-list-mock').exists()).toBe(true)
    })

    it('应该渲染优惠券选择器', () => {
      const wrapper = mount(CartPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.coupon-selector-mock').exists()).toBe(true)
    })

    it('应该渲染购物车汇总', () => {
      const wrapper = mount(CartPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.find('.cart-summary-mock').exists()).toBe(true)
    })
  })

  describe('数量调整', () => {
    it('decreaseQuantity 应该减少数量', () => {
      const wrapper = mount(CartPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      wrapper.vm.decreaseQuantity('item1', 5)

      expect(mockUpdateQuantity).toHaveBeenCalledWith('item1', 4)
    })

    it('decreaseQuantity 当数量为1时不应该减少', () => {
      const wrapper = mount(CartPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      wrapper.vm.decreaseQuantity('item1', 1)

      expect(mockUpdateQuantity).not.toHaveBeenCalled()
    })

    it('increaseQuantity 应该增加数量', () => {
      const wrapper = mount(CartPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      wrapper.vm.increaseQuantity('item1', 5)

      expect(mockUpdateQuantity).toHaveBeenCalledWith('item1', 6)
    })

    it('increaseQuantity 当数量为99时不应该增加', () => {
      const wrapper = mount(CartPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      wrapper.vm.increaseQuantity('item1', 99)

      expect(mockUpdateQuantity).not.toHaveBeenCalled()
    })
  })

  describe('导航', () => {
    it('handleBack 应该导航到商店页面', () => {
      const wrapper = mount(CartPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      wrapper.vm.handleBack()

      expect(mockNavigateTo).toHaveBeenCalledWith('shop')
    })
  })

  describe('结算', () => {
    it('handleCheckout 应该调用 checkout 并导航到商店', () => {
      const wrapper = mount(CartPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      wrapper.vm.handleCheckout()

      expect(mockCheckout).toHaveBeenCalled()
      expect(mockNavigateTo).toHaveBeenCalledWith('shop')
    })
  })

  describe('Props', () => {
    it('应该使用 config 中的购物车标题', () => {
      const wrapper = mount(CartPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.vm.cartTitle).toBe('购物车')
    })

    it('应该使用 config 中的购物车图标', () => {
      const wrapper = mount(CartPage, {
        props: defaultProps,
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.vm.cartIcon).toBe('🛒')
    })

    it('没有 config 时应该处理 undefined', () => {
      const wrapper = mount(CartPage, {
        props: {},
        global: {
          plugins: [createPinia()],
        },
      })

      expect(wrapper.vm.cartTitle).toBeUndefined()
      expect(wrapper.vm.cartIcon).toBeUndefined()
    })
  })
})
