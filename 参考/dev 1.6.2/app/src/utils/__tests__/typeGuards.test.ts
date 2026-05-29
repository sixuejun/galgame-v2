import { describe, it, expect } from 'vitest'
import {
  isObject,
  isArray,
  isNonEmptyString,
  isValidNumber,
  isNonNegativeInteger,
  isConfig,
  isStory,
  isChoice,
  isChoices,
  isCharacter,
  isCharacters,
  isShopData,
  isStorageData,
  isAchievement,
  isGameData,
  assertType,
  safeGet,
  hasGlobal,
  getGlobal,
} from '../typeGuards/index'

describe('typeGuards', () => {
  describe('isObject', () => {
    it('应该识别有效对象', () => {
      expect(isObject({})).toBe(true)
      expect(isObject({ key: 'value' })).toBe(true)
    })

    it('应该拒绝非对象值', () => {
      expect(isObject(null)).toBe(false)
      expect(isObject(undefined)).toBe(false)
      expect(isObject([])).toBe(false)
      expect(isObject('string')).toBe(false)
      expect(isObject(123)).toBe(false)
    })
  })

  describe('isArray', () => {
    it('应该识别非空数组', () => {
      expect(isArray([1, 2, 3])).toBe(true)
      expect(isArray(['a'])).toBe(true)
    })

    it('应该拒绝空数组和非数组值', () => {
      expect(isArray([])).toBe(false)
      expect(isArray({})).toBe(false)
      expect(isArray(null)).toBe(false)
      expect(isArray('string')).toBe(false)
    })
  })

  describe('isNonEmptyString', () => {
    it('应该识别非空字符串', () => {
      expect(isNonEmptyString('hello')).toBe(true)
      expect(isNonEmptyString('  text  ')).toBe(true)
    })

    it('应该拒绝空字符串和非字符串值', () => {
      expect(isNonEmptyString('')).toBe(false)
      expect(isNonEmptyString('   ')).toBe(false)
      expect(isNonEmptyString(123)).toBe(false)
      expect(isNonEmptyString(null)).toBe(false)
    })
  })

  describe('isValidNumber', () => {
    it('应该识别有效数字', () => {
      expect(isValidNumber(0)).toBe(true)
      expect(isValidNumber(123)).toBe(true)
      expect(isValidNumber(-456)).toBe(true)
      expect(isValidNumber(3.14)).toBe(true)
    })

    it('应该拒绝无效数字', () => {
      expect(isValidNumber(NaN)).toBe(false)
      expect(isValidNumber(Infinity)).toBe(false)
      expect(isValidNumber(-Infinity)).toBe(false)
      expect(isValidNumber('123')).toBe(false)
    })
  })

  describe('isNonNegativeInteger', () => {
    it('应该识别非负整数', () => {
      expect(isNonNegativeInteger(0)).toBe(true)
      expect(isNonNegativeInteger(1)).toBe(true)
      expect(isNonNegativeInteger(100)).toBe(true)
    })

    it('应该拒绝负数、小数和非数字', () => {
      expect(isNonNegativeInteger(-1)).toBe(false)
      expect(isNonNegativeInteger(3.14)).toBe(false)
      expect(isNonNegativeInteger(NaN)).toBe(false)
      expect(isNonNegativeInteger('123')).toBe(false)
    })
  })

  describe('isConfig', () => {
    it('应该识别有效的Config对象', () => {
      expect(
        isConfig({
          version: '1.0',
          phase: 'alpha',
          home: { title: 'Test', subtitle: '' },
        })
      ).toBe(true)
    })

    it('应该拒绝无效的Config对象', () => {
      expect(isConfig({})).toBe(false)
      expect(isConfig({ version: '1.0' })).toBe(false)
      expect(isConfig({ version: '1.0', phase: 'alpha', home: { title: '' } })).toBe(false)
      expect(isConfig(null)).toBe(false)
    })
  })

  describe('isStory', () => {
    it('应该识别有效的Story对象', () => {
      expect(isStory({ content: 'Story content' })).toBe(true)
      expect(isStory({ content: 'Story', time: 'morning', location: 'forest' })).toBe(true)
    })

    it('应该拒绝无效的Story对象', () => {
      expect(isStory({})).toBe(false)
      expect(isStory({ content: '' })).toBe(false)
      expect(isStory({ content: 'Story', time: 123 })).toBe(false)
      expect(isStory(null)).toBe(false)
    })
  })

  describe('isChoice', () => {
    it('应该识别有效的Choice对象', () => {
      expect(isChoice({ text: 'Choice text' })).toBe(true)
    })

    it('应该拒绝无效的Choice对象', () => {
      expect(isChoice({})).toBe(false)
      expect(isChoice({ text: '' })).toBe(false)
      expect(isChoice(null)).toBe(false)
    })
  })

  describe('isChoices', () => {
    it('应该识别有效的Choices数组', () => {
      expect(isChoices([{ text: 'Choice 1' }, { text: 'Choice 2' }])).toBe(true)
      expect(isChoices([])).toBe(true) // 空数组是有效的（every返回true）
    })

    it('应该拒绝无效的Choices', () => {
      expect(isChoices([{ text: '' }])).toBe(false) // text为空
      expect(isChoices([{ noText: 'value' }])).toBe(false) // 缺少text字段
      expect(isChoices({})).toBe(false) // 对象不是数组
      expect(isChoices(null)).toBe(false) // null
      expect(isChoices('not an array')).toBe(false) // 字符串
    })
  })

  describe('isCharacter', () => {
    it('应该识别有效的Character对象', () => {
      expect(isCharacter({ name: 'Hero' })).toBe(true)
      expect(isCharacter({ name: 'Hero', level: 5 })).toBe(true)
    })

    it('应该拒绝无效的Character对象', () => {
      expect(isCharacter({})).toBe(false)
      expect(isCharacter({ name: '' })).toBe(false)
      expect(isCharacter({ name: 'Hero', level: -1 })).toBe(false)
      expect(isCharacter({ name: 'Hero', level: 3.5 })).toBe(false)
    })
  })

  describe('isCharacters', () => {
    it('应该识别有效的Characters对象', () => {
      expect(isCharacters({ hero: { name: 'Hero' }, villain: { name: 'Villain' } })).toBe(true)
    })

    it('应该拒绝无效的Characters对象', () => {
      expect(isCharacters({})).toBe(true) // 空对象是有效的
      expect(isCharacters({ hero: { name: '' } })).toBe(false)
      expect(isCharacters(null)).toBe(false)
    })
  })

  describe('isShopData', () => {
    it('应该识别有效的ShopData对象', () => {
      expect(isShopData({})).toBe(true)
      expect(isShopData({ currency: 100 })).toBe(true)
      expect(isShopData({ items: { item1: { name: 'Sword', price: 50 } } })).toBe(true)
    })

    it('应该拒绝无效的ShopData对象', () => {
      expect(isShopData({ currency: -1 })).toBe(false)
      expect(isShopData({ currency: 3.5 })).toBe(false)
      expect(isShopData({ items: { item1: { name: '', price: 50 } } })).toBe(false)
      expect(isShopData({ items: { item1: { name: 'Sword', price: -1 } } })).toBe(false)
    })
  })

  describe('isStorageData', () => {
    it('应该识别有效的StorageData对象', () => {
      expect(isStorageData({})).toBe(true)
      expect(isStorageData({ inventory: {} })).toBe(true)
    })

    it('应该拒绝无效的StorageData对象', () => {
      expect(isStorageData({ inventory: [] })).toBe(false)
      expect(isStorageData(null)).toBe(false)
    })
  })

  describe('isAchievement', () => {
    it('应该识别有效的Achievement对象', () => {
      expect(isAchievement({ id: 'ach1', name: 'First Win', unlocked: true })).toBe(true)
      expect(isAchievement({ id: 'ach2', name: 'Second Win', unlocked: false })).toBe(true)
    })

    it('应该拒绝无效的Achievement对象', () => {
      expect(isAchievement({})).toBe(false)
      expect(isAchievement({ id: '', name: 'Win', unlocked: true })).toBe(false)
      expect(isAchievement({ id: 'ach1', name: 'Win', unlocked: 'true' })).toBe(false)
    })
  })

  describe('isGameData', () => {
    it('应该识别有效的GameData对象', () => {
      expect(isGameData({})).toBe(true)
      expect(
        isGameData({
          config: {
            version: '1.0',
            phase: 'alpha',
            home: { title: 'Game', subtitle: '' },
          },
          story: { content: 'Story' },
        })
      ).toBe(true)
    })

    it('应该拒绝无效的GameData对象', () => {
      expect(
        isGameData({
          config: { version: '1.0', phase: 'alpha', home: { title: '' } },
        })
      ).toBe(false)
      expect(isGameData({ story: { content: '' } })).toBe(false)
      expect(isGameData(null)).toBe(false)
    })
  })

  describe('assertType', () => {
    it('应该通过有效值', () => {
      expect(() => assertType('hello', isNonEmptyString, 'Not a string')).not.toThrow()
    })

    it('应该抛出错误对于无效值', () => {
      expect(() => assertType('', isNonEmptyString, 'Not a string')).toThrow('Not a string')
      expect(() => assertType(123, isNonEmptyString, 'Not a string')).toThrow(TypeError)
    })
  })

  describe('safeGet', () => {
    it('应该返回存在的属性值', () => {
      const obj = { name: 'Test', value: 42 }
      expect(safeGet(obj, 'name', 'default')).toBe('Test')
      expect(safeGet(obj, 'value', 0)).toBe(42)
    })

    it('应该返回默认值对于不存在的属性', () => {
      const obj = { name: 'Test' } as { name: string; value?: number }
      expect(safeGet(obj, 'value', 100)).toBe(100)
    })
  })

  describe('hasGlobal', () => {
    it('应该检测全局变量是否存在', () => {
      expect(hasGlobal('window')).toBe(true)
      expect(hasGlobal('document')).toBe(true)
      expect(hasGlobal('nonExistentGlobal12345')).toBe(false)
    })
  })

  describe('getGlobal', () => {
    it('应该获取存在的全局变量', () => {
      const result = getGlobal('window', null)
      expect(result).toBe(window)
    })

    it('应该返回默认值对于不存在的全局变量', () => {
      const result = getGlobal('nonExistentGlobal12345', 'default')
      expect(result).toBe('default')
    })
  })
})
