// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { useItemEffects } from '../game/useItemEffects'
import type { GameData, Item } from '../../types'

// Mock 依赖
const mockGameData = ref<GameData>({} as GameData)
const mockLogUserAction = vi.fn()
const mockSuccess = vi.fn()
const mockInfo = vi.fn()

vi.mock('pinia', () => ({
  storeToRefs: () => ({
    gameData: mockGameData,
  }),
}))

vi.mock('../../stores/gameStore', () => ({
  useGameStore: () => ({
    logUserAction: mockLogUserAction,
  }),
}))

vi.mock('../ui/useToast', () => ({
  useToast: () => ({
    success: mockSuccess,
    info: mockInfo,
  }),
}))

vi.mock('../../utils/pathUtils', () => ({
  getDataByPath: (obj: unknown, path: string) => {
    const parts = path.split('.')
    let current: unknown = obj
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part]
      } else {
        return undefined
      }
    }
    return current
  },
  setDataByPath: (obj: Record<string, unknown>, path: string, value: unknown) => {
    const parts = path.split('.')
    const finalKey = parts.pop()!
    let current: unknown = obj
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part]
      }
    }
    if (current && typeof current === 'object' && finalKey) {
      ;(current as Record<string, unknown>)[finalKey] = value
    }
  },
}))

describe('useItemEffects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGameData.value = {
      config: {
        version: '1.0.0',
        phase: 'test',
        home: { title: 'Test', subtitle: 'Test' },
      },
      characters: {
        user: {
          hp: 50,
          maxHp: 100,
          mp: 30,
          statuses: [],
        },
      },
      storage: {
        inventory: {},
      },
    }
  })

  describe('applyItemEffect', () => {
    it('应该处理没有效果的物品', async () => {
      const { applyItemEffect } = useItemEffects()
      const item: Item = {
        id: 'item1',
        name: '普通物品',
        price: 10,
        quantity: 1,
      }

      await applyItemEffect(item)

      expect(mockInfo).toHaveBeenCalledWith('【普通物品】似乎没有立即可见的效果')
      expect(mockSuccess).not.toHaveBeenCalled()
    })

    it('应该应用 add 操作', async () => {
      const { applyItemEffect } = useItemEffects()
      const item: Item = {
        id: 'potion',
        name: '生命药水',
        price: 50,
        quantity: 1,
        effects: {
          'characters.user.hp': {
            operation: 'add',
            value: 20,
            description: '生命值',
          },
        },
      }

      await applyItemEffect(item)

      expect(mockGameData.value.characters?.user.hp).toBe(70)
      expect(mockSuccess).toHaveBeenCalledWith('使用了 生命药水，增加了 20 生命值')
    })

    it('应该应用 subtract 操作', async () => {
      const { applyItemEffect } = useItemEffects()
      const item: Item = {
        id: 'curse',
        name: '诅咒卷轴',
        price: 10,
        quantity: 1,
        effects: {
          'characters.user.mp': {
            operation: 'subtract',
            value: 10,
            description: '魔法值',
          },
        },
      }

      await applyItemEffect(item)

      expect(mockGameData.value.characters?.user.mp).toBe(20)
      expect(mockSuccess).toHaveBeenCalledWith('使用了 诅咒卷轴，减少了 10 魔法值')
    })

    it('应该应用 set 操作', async () => {
      const { applyItemEffect } = useItemEffects()
      const item: Item = {
        id: 'reset',
        name: '重置药水',
        price: 100,
        quantity: 1,
        effects: {
          'characters.user.hp': {
            operation: 'set',
            value: 100,
            description: '生命值',
          },
        },
      }

      await applyItemEffect(item)

      expect(mockGameData.value.characters?.user.hp).toBe(100)
      expect(mockSuccess).toHaveBeenCalledWith('使用了 重置药水，设置了 100 生命值')
    })

    it('应该应用 add_status 操作', async () => {
      const { applyItemEffect } = useItemEffects()
      const item: Item = {
        id: 'buff',
        name: '力量药水',
        price: 50,
        quantity: 1,
        effects: {
          'characters.user.statuses': {
            operation: 'add_status',
            value: { id: 'strength', name: '力量提升' },
            description: '力量状态',
          },
        },
      }

      await applyItemEffect(item)

      expect(mockGameData.value.characters?.user.statuses).toHaveLength(1)
      expect(mockGameData.value.characters?.user.statuses).toContainEqual({
        id: 'strength',
        name: '力量提升',
      })
    })

    it('应该应用 remove_status 操作', async () => {
      mockGameData.value.characters!.user.statuses = [
        { id: 'poison', name: '中毒' },
        { id: 'strength', name: '力量提升' },
      ]

      const { applyItemEffect } = useItemEffects()
      const item: Item = {
        id: 'antidote',
        name: '解毒剂',
        price: 30,
        quantity: 1,
        effects: {
          'characters.user.statuses': {
            operation: 'remove_status',
            value: 'poison',
            description: '中毒状态',
          },
        },
      }

      await applyItemEffect(item)

      expect(mockGameData.value.characters?.user.statuses).toHaveLength(1)
      expect(mockGameData.value.characters?.user.statuses).toContainEqual({
        id: 'strength',
        name: '力量提升',
      })
    })

    it('应该根据数量倍增效果值', async () => {
      const { applyItemEffect } = useItemEffects()
      const item: Item = {
        id: 'potion',
        name: '生命药水',
        price: 50,
        quantity: 3,
        effects: {
          'characters.user.hp': {
            operation: 'add',
            value: 20,
            description: '生命值',
          },
        },
      }

      await applyItemEffect(item, 3)

      expect(mockGameData.value.characters?.user.hp).toBe(110) // 50 + 20*3
      expect(mockSuccess).toHaveBeenCalledWith('使用了 3 个生命药水，增加了 60 生命值')
    })

    it('应该遵守最大值限制', async () => {
      const { applyItemEffect } = useItemEffects()
      const item: Item = {
        id: 'mega-potion',
        name: '超级药水',
        price: 100,
        quantity: 1,
        effects: {
          'characters.user.hp': {
            operation: 'add',
            value: 100,
            description: '生命值',
            maxPath: 'characters.user.maxHp',
          },
        },
      }

      await applyItemEffect(item)

      expect(mockGameData.value.characters?.user.hp).toBe(100) // 限制在 maxHp
    })

    it('应该处理多个效果', async () => {
      const { applyItemEffect } = useItemEffects()
      const item: Item = {
        id: 'elixir',
        name: '万能药',
        price: 200,
        quantity: 1,
        effects: {
          'characters.user.hp': {
            operation: 'add',
            value: 30,
            description: '生命值',
          },
          'characters.user.mp': {
            operation: 'add',
            value: 20,
            description: '魔法值',
          },
        },
      }

      await applyItemEffect(item)

      expect(mockGameData.value.characters?.user.hp).toBe(80)
      expect(mockGameData.value.characters?.user.mp).toBe(50)
      expect(mockSuccess).toHaveBeenCalledWith('使用了 万能药，增加了 30 生命值，增加了 20 魔法值')
    })
  })

  describe('useItem', () => {
    beforeEach(() => {
      mockGameData.value.storage!.inventory = {
        potion: {
          id: 'potion',
          name: '生命药水',
          price: 50,
          quantity: 5,
          effects: {
            'characters.user.hp': {
              operation: 'add',
              value: 20,
              description: '生命值',
            },
          },
        },
        food: {
          id: 'food',
          name: '面包',
          price: 10,
          quantity: 3,
        },
      }
    })

    it('应该使用有效果的物品', async () => {
      const { useItem } = useItemEffects()

      await useItem('potion', 1)

      expect(mockGameData.value.characters?.user.hp).toBe(70)
      expect(mockGameData.value.storage?.inventory.potion.quantity).toBe(4)
      expect(mockLogUserAction).toHaveBeenCalledWith('使用物品', {
        itemId: 'potion',
        itemName: '生命药水',
        quantity: 1,
        remaining: 4,
        hasEffects: true,
        effects: expect.any(Array),
      })
    })

    it('应该使用无效果的物品', async () => {
      const { useItem } = useItemEffects()

      await useItem('food', 1)

      expect(mockGameData.value.storage?.inventory.food.quantity).toBe(2)
      expect(mockInfo).toHaveBeenCalledWith('使用了 面包，该物品无特殊效果')
      expect(mockLogUserAction).toHaveBeenCalledWith('使用物品', {
        itemId: 'food',
        itemName: '面包',
        quantity: 1,
        remaining: 2,
        hasEffects: false,
        note: '该物品无特殊效果',
      })
    })

    it('应该限制使用数量不超过拥有数量', async () => {
      const { useItem } = useItemEffects()

      await useItem('food', 10) // 尝试使用 10 个，但只有 3 个

      expect(mockGameData.value.storage?.inventory.food).toBeUndefined() // 全部用完
      expect(mockLogUserAction).toHaveBeenCalledWith(
        '使用物品',
        expect.objectContaining({
          quantity: 3, // 实际只使用了 3 个
        })
      )
    })

    it('当物品用完时应该从库存中移除', async () => {
      const { useItem } = useItemEffects()

      await useItem('food', 3)

      expect(mockGameData.value.storage?.inventory.food).toBeUndefined()
    })

    it('应该处理不存在的物品', async () => {
      const { useItem } = useItemEffects()

      await useItem('nonexistent')

      expect(mockLogUserAction).not.toHaveBeenCalled()
    })

    it('应该处理数量为 0 的情况', async () => {
      const { useItem } = useItemEffects()

      await useItem('potion', 0)

      expect(mockGameData.value.storage?.inventory.potion.quantity).toBe(5)
      expect(mockLogUserAction).not.toHaveBeenCalled()
    })

    it('应该正确处理多个数量的物品', async () => {
      const { useItem } = useItemEffects()

      await useItem('potion', 2)

      expect(mockGameData.value.characters?.user.hp).toBe(90) // 50 + 20*2
      expect(mockGameData.value.storage?.inventory.potion.quantity).toBe(3)
    })
  })
})
