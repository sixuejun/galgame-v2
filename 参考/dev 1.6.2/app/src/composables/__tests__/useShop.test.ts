import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useShop } from '../shop/useShop'
import { useGameStore } from '../../stores/gameStore'
import type { GameData } from '../../types'

// 创建 mock 函数
const mockShowModal = vi.fn()
const mockSuccess = vi.fn()

// Mock useModal
vi.mock('../ui/useModal', () => ({
  useModal: () => ({
    showModal: mockShowModal,
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

describe('useShop', () => {
  const createMockGameData = (): GameData => ({
    shop: {
      currency: 100,
      items: {
        item1: {
          id: 'item1',
          name: '测试物品1',
          description: '测试描述1',
          price: 50,
          icon: '🎁',
          category: 'test',
        },
        item2: {
          id: 'item2',
          name: '测试物品2',
          description: '测试描述2',
          price: 150,
          icon: '🎁',
          category: 'test',
        },
      },
    },
    storage: {
      inventory: {},
    },
  })

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('buyItem', () => {
    it('应该成功购买物品', () => {
      const gameStore = useGameStore()
      gameStore.setGameData(createMockGameData())

      const { buyItem } = useShop()

      buyItem('item1')

      // 验证货币扣除
      expect(gameStore.gameData.shop?.currency).toBe(50)

      // 验证物品添加到库存
      expect(gameStore.gameData.storage?.inventory?.item1).toMatchObject({
        id: 'item1',
        name: '测试物品1',
        quantity: 1,
      })

      // 验证显示成功提示
      expect(mockSuccess).toHaveBeenCalledWith('成功购买【测试物品1】！')

      // 验证不显示错误模态框
      expect(mockShowModal).not.toHaveBeenCalled()
    })

    it('当物品不存在时应该显示错误', () => {
      const gameStore = useGameStore()
      gameStore.setGameData(createMockGameData())

      const { buyItem } = useShop()

      buyItem('nonexistent')

      // 验证显示错误模态框
      expect(mockShowModal).toHaveBeenCalledWith('错误', '找不到该物品。')

      // 验证货币未扣除
      expect(gameStore.gameData.shop?.currency).toBe(100)
    })

    it('当货币不足时应该显示错误', () => {
      const gameStore = useGameStore()
      gameStore.setGameData(createMockGameData())

      const { buyItem } = useShop()

      buyItem('item2') // 价格 150，但只有 100 货币

      // 验证显示错误模态框
      expect(mockShowModal).toHaveBeenCalledWith('资金不足', '您的资产不足以购买此物品。')

      // 验证货币未扣除
      expect(gameStore.gameData.shop?.currency).toBe(100)

      // 验证物品未添加到库存
      expect(gameStore.gameData.storage?.inventory?.item2).toBeUndefined()
    })

    it('应该正确处理重复购买物品', () => {
      const gameStore = useGameStore()
      gameStore.setGameData(createMockGameData())

      const { buyItem } = useShop()

      // 第一次购买
      buyItem('item1')
      expect(gameStore.gameData.shop?.currency).toBe(50)
      expect(gameStore.gameData.storage?.inventory?.item1?.quantity).toBe(1)

      // 第二次购买
      buyItem('item1')
      expect(gameStore.gameData.shop?.currency).toBe(0)
      expect(gameStore.gameData.storage?.inventory?.item1?.quantity).toBe(2)
    })

    it('当 shop 为 undefined 时应该处理错误', () => {
      const gameStore = useGameStore()
      gameStore.setGameData({})

      const { buyItem } = useShop()

      buyItem('item1')

      // 验证显示错误模态框
      expect(mockShowModal).toHaveBeenCalledWith('错误', '找不到该物品。')
    })

    it('当 storage.inventory 为 undefined 时应该跳过添加到库存', () => {
      const gameStore = useGameStore()
      const gameData = createMockGameData()
      gameData.storage = undefined
      gameStore.setGameData(gameData)

      const { buyItem } = useShop()

      buyItem('item1')

      // 验证货币扣除
      expect(gameStore.gameData.shop?.currency).toBe(50)

      // 验证显示成功提示（即使没有添加到库存）
      expect(mockSuccess).toHaveBeenCalledWith('成功购买【测试物品1】！')
    })

    it('应该记录用户行为', () => {
      const gameStore = useGameStore()
      gameStore.setGameData(createMockGameData())
      const logUserActionSpy = vi.spyOn(gameStore, 'logUserAction')

      const { buyItem } = useShop()

      buyItem('item1')

      // 验证记录用户行为
      expect(logUserActionSpy).toHaveBeenCalledWith('购买物品', {
        itemId: 'item1',
        itemName: '测试物品1',
        price: 50,
        newCurrency: 50,
      })
    })

    it('当物品没有 quantity 时应该正确初始化', () => {
      const gameStore = useGameStore()
      const gameData = createMockGameData()
      // 预先添加一个没有 quantity 的物品
      gameData.storage!.inventory!.item1 = {
        id: 'item1',
        name: '测试物品1',
        description: '测试描述1',
        price: 50,
        icon: '🎁',
        category: 'test',
      }
      gameStore.setGameData(gameData)

      const { buyItem } = useShop()

      buyItem('item1')

      // 验证 quantity 正确增加（从 undefined 变为 2）
      expect(gameStore.gameData.storage?.inventory?.item1?.quantity).toBe(2)
    })

    it('应该正确处理货币为 0 的情况', () => {
      const gameStore = useGameStore()
      const gameData = createMockGameData()
      gameData.shop!.currency = 0
      gameStore.setGameData(gameData)

      const { buyItem } = useShop()

      buyItem('item1')

      // 验证显示错误模态框
      expect(mockShowModal).toHaveBeenCalledWith('资金不足', '您的资产不足以购买此物品。')
    })

    it('应该正确处理物品价格为 0 的情况', () => {
      const gameStore = useGameStore()
      const gameData = createMockGameData()
      gameData.shop!.items!.freeItem = {
        id: 'freeItem',
        name: '免费物品',
        description: '免费描述',
        price: 0,
        icon: '🎁',
        category: 'test',
      }
      gameStore.setGameData(gameData)

      const { buyItem } = useShop()

      buyItem('freeItem')

      // 验证货币未扣除
      expect(gameStore.gameData.shop?.currency).toBe(100)

      // 验证物品添加到库存
      expect(gameStore.gameData.storage?.inventory?.freeItem).toBeDefined()

      // 验证显示成功提示
      expect(mockSuccess).toHaveBeenCalledWith('成功购买【免费物品】！')
    })
  })
})
