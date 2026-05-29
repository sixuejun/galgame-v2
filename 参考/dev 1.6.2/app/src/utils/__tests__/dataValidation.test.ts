import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { validateGameData, validateAndLogGameData } from '../dataValidation'
import { logger } from '../logger'

describe('dataValidation', () => {
  beforeEach(() => {
    vi.spyOn(logger, 'info').mockImplementation(() => {})
    vi.spyOn(logger, 'warn').mockImplementation(() => {})
    vi.spyOn(logger, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('validateGameData', () => {
    it('应该验证通过有效的游戏数据', () => {
      const validData = {
        config: {
          version: '1.0.0',
          phase: 'test',
          home: {
            title: 'Test Game',
          },
        },
        story: {
          content: 'This is a story',
        },
        choices: [{ text: 'Choice 1' }, { text: 'Choice 2' }],
        characters: {
          player: { name: 'Player' },
        },
        shop: {
          currency: 100,
          items: {
            item1: { name: 'Item 1', price: 10 },
          },
        },
        storage: {
          inventory: {},
        },
      }

      const result = validateGameData(validData)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该拒绝非对象类型', () => {
      const result = validateGameData('not an object')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('游戏数据必须是一个对象')
    })

    it('应该拒绝 null', () => {
      const result = validateGameData(null)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('游戏数据必须是一个对象')
    })

    it('应该拒绝数组', () => {
      const result = validateGameData([])
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('游戏数据必须是一个对象')
    })

    it('应该验证空对象（只有警告）', () => {
      const result = validateGameData({})
      expect(result.valid).toBe(true)
      expect(result.warnings).toContain('缺少 config 配置字段')
    })

    describe('config 验证', () => {
      it('应该拒绝非对象的 config', () => {
        const result = validateGameData({ config: 'invalid' })
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('config 字段必须是对象')
      })

      it('应该警告缺少 title（config.home.title）', () => {
        const result = validateGameData({
          config: { version: '1.0.0', phase: 'test' },
        })
        expect(result.warnings).toContain('config.home.title 字段缺失或为空')
      })

      it('应该接受新结构的 title（config.home.title）', () => {
        const result = validateGameData({
          config: {
            version: '1.0.0',
            phase: 'test',
            home: { title: 'Test' },
          },
        })
        expect(result.warnings).not.toContain('config.home.title 字段缺失或为空')
      })

      it('应该警告缺少 version', () => {
        const result = validateGameData({
          config: { phase: 'test', home: { title: 'Test' } },
        })
        expect(result.warnings).toContain('config.version 字段缺失或为空')
      })

      it('应该警告缺少 phase', () => {
        const result = validateGameData({
          config: { version: '1.0.0', home: { title: 'Test' } },
        })
        expect(result.warnings).toContain('config.phase 字段缺失或为空')
      })

      it('应该警告空字符串的 title', () => {
        const result = validateGameData({
          config: { version: '1.0.0', phase: 'test', home: { title: '' } },
        })
        expect(result.warnings).toContain('config.home.title 字段缺失或为空')
      })
    })

    describe('story 验证', () => {
      it('应该拒绝非对象的 story', () => {
        const result = validateGameData({ story: 'invalid' })
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('story 字段必须是对象')
      })

      it('应该拒绝缺少 content 的 story', () => {
        const result = validateGameData({ story: {} })
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('story.content 字段缺失')
      })

      it('应该拒绝非字符串的 content', () => {
        const result = validateGameData({ story: { content: 123 } })
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('story.content 必须是字符串')
      })

      it('应该警告过长的 content', () => {
        const longContent = 'a'.repeat(50001)
        const result = validateGameData({ story: { content: longContent } })
        expect(result.warnings).toContain('story.content 内容过长（超过50000字符）')
      })

      it('应该拒绝非字符串的 time', () => {
        const result = validateGameData({
          story: { content: 'test', time: 123 },
        })
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('story.time 必须是字符串')
      })

      it('应该拒绝非字符串的 location', () => {
        const result = validateGameData({
          story: { content: 'test', location: 123 },
        })
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('story.location 必须是字符串')
      })

      it('应该拒绝非字符串的 weather', () => {
        const result = validateGameData({
          story: { content: 'test', weather: 123 },
        })
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('story.weather 必须是字符串')
      })
    })

    describe('choices 验证', () => {
      it('应该验证通过数组形式的 choices', () => {
        const result = validateGameData({
          choices: [{ text: 'Choice 1' }, { text: 'Choice 2' }],
        })
        expect(result.valid).toBe(true)
      })

      it('应该警告空数组', () => {
        const result = validateGameData({ choices: [] })
        expect(result.warnings).toContain('choices 数组为空')
      })

      it('应该拒绝数组中的非对象元素', () => {
        const result = validateGameData({ choices: ['invalid'] })
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('choices[0] 必须是对象')
      })

      it('应该拒绝缺少 text 的选项', () => {
        const result = validateGameData({ choices: [{}] })
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('choices[0] 缺少 text 字段或为空')
      })

      it('应该拒绝空字符串的 text', () => {
        const result = validateGameData({ choices: [{ text: '' }] })
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('choices[0] 缺少 text 字段或为空')
      })

      it('应该拒绝非数组的 choices', () => {
        const result = validateGameData({ choices: 'invalid' })
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('choices 必须是数组')
      })

      it('应该拒绝对象形式的 choices', () => {
        const result = validateGameData({ choices: { choice1: { text: 'Choice 1' } } })
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('choices 必须是数组')
      })
    })

    describe('characters 验证', () => {
      it('应该验证通过有效的 characters', () => {
        const result = validateGameData({
          characters: {
            player: { name: 'Player' },
          },
        })
        expect(result.valid).toBe(true)
      })

      it('应该拒绝非对象的 characters', () => {
        const result = validateGameData({ characters: 'invalid' })
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('characters 字段必须是对象')
      })

      it('应该警告空对象', () => {
        const result = validateGameData({ characters: {} })
        expect(result.warnings).toContain('characters 对象为空')
      })

      it('应该拒绝非对象的角色数据', () => {
        const result = validateGameData({
          characters: { player: 'invalid' },
        })
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('characters.player 必须是对象')
      })
    })

    describe('shop 验证', () => {
      it('应该验证通过有效的 shop', () => {
        const result = validateGameData({
          shop: {
            currency: 100,
            items: {
              item1: { name: 'Item 1', price: 10 },
            },
          },
        })
        expect(result.valid).toBe(true)
      })

      it('应该拒绝非对象的 shop', () => {
        const result = validateGameData({ shop: 'invalid' })
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('shop 字段必须是对象')
      })

      it('应该拒绝非数字的 currency', () => {
        const result = validateGameData({ shop: { currency: 'invalid' } })
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('shop.currency 必须是有效数字')
      })

      it('应该拒绝负数的 currency', () => {
        const result = validateGameData({ shop: { currency: -10 } })
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('shop.currency 不能为负数')
      })

      it('应该警告小数的 currency', () => {
        const result = validateGameData({ shop: { currency: 10.5 } })
        expect(result.warnings).toContain('shop.currency 应该是整数')
      })

      it('应该拒绝非对象的 items', () => {
        const result = validateGameData({ shop: { items: 'invalid' } })
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('shop.items 必须是对象')
      })

      it('应该拒绝非对象的物品', () => {
        const result = validateGameData({
          shop: { items: { item1: 'invalid' } },
        })
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('shop.items.item1 必须是对象')
      })

      it('应该拒绝缺少 name 的物品', () => {
        const result = validateGameData({
          shop: { items: { item1: { price: 10 } } },
        })
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('shop.items.item1 缺少 name 字段或为空')
      })

      it('应该拒绝缺少 price 的物品', () => {
        const result = validateGameData({
          shop: { items: { item1: { name: 'Item 1' } } },
        })
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('shop.items.item1 缺少 price 字段')
      })

      it('应该拒绝负数的 price', () => {
        const result = validateGameData({
          shop: { items: { item1: { name: 'Item 1', price: -10 } } },
        })
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('shop.items.item1.price 必须是非负整数')
      })

      it('应该拒绝小数的 price', () => {
        const result = validateGameData({
          shop: { items: { item1: { name: 'Item 1', price: 10.5 } } },
        })
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('shop.items.item1.price 必须是非负整数')
      })
    })

    describe('storage 验证', () => {
      it('应该验证通过有效的 storage', () => {
        const result = validateGameData({
          storage: {
            inventory: {},
          },
        })
        expect(result.valid).toBe(true)
      })

      it('应该拒绝非对象的 storage', () => {
        const result = validateGameData({ storage: 'invalid' })
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('storage 字段必须是对象')
      })

      it('应该拒绝非对象的 inventory', () => {
        const result = validateGameData({
          storage: { inventory: 'invalid' },
        })
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('storage.inventory 必须是对象')
      })
    })

    describe('achievements 验证', () => {
      it('应该验证通过对象形式的 achievements', () => {
        const result = validateGameData({
          achievements: {
            achievement1: { id: 'a1', name: 'Achievement 1', unlocked: true },
          },
        })
        expect(result.valid).toBe(true)
      })

      it('应该拒绝非对象的 achievements', () => {
        const result = validateGameData({ achievements: 'invalid' })
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('achievements 字段必须是对象')
      })
    })

    describe('summaries 验证', () => {
      it('应该验证通过有效的 summaries', () => {
        const result = validateGameData({
          summaries: [
            { time: '2024-01-01', content: 'Summary 1' },
            { time: '2024-01-02', content: 'Summary 2' },
          ],
        })
        expect(result.valid).toBe(true)
      })

      it('应该拒绝非数组的 summaries', () => {
        const result = validateGameData({ summaries: 'invalid' })
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('summaries 字段必须是数组')
      })

      it('应该警告缺少 time 的 summary', () => {
        const result = validateGameData({
          summaries: [{ content: 'Summary 1' }],
        })
        expect(result.warnings).toContain('summaries[0] 缺少 time 字段')
      })

      it('应该警告缺少 content 的 summary', () => {
        const result = validateGameData({
          summaries: [{ time: '2024-01-01' }],
        })
        expect(result.warnings).toContain('summaries[0] 缺少 content 字段')
      })
    })

    describe('综合测试', () => {
      it('应该收集多个错误', () => {
        const result = validateGameData({
          config: 'invalid',
          story: 'invalid',
          choices: 'invalid',
        })
        expect(result.valid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(1)
      })

      it('应该收集多个警告', () => {
        const result = validateGameData({
          config: {},
          choices: [],
          characters: {},
        })
        expect(result.warnings.length).toBeGreaterThan(1)
      })

      it('应该同时有错误和警告', () => {
        const result = validateGameData({
          config: {},
          story: {},
        })
        expect(result.valid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
        expect(result.warnings.length).toBeGreaterThan(0)
      })
    })
  })

  describe('validateAndLogGameData', () => {
    it('应该记录验证成功', () => {
      const validData = {
        config: { version: '1.0.0', phase: 'test', home: { title: 'Test' } },
        story: { content: 'Story' },
      }
      validateAndLogGameData(validData)
      expect(logger.info).toHaveBeenCalledWith('✅ 游戏数据验证通过')
    })

    it('应该记录验证失败', () => {
      validateAndLogGameData({ story: {} })
      expect(logger.error).toHaveBeenCalledWith('❌ 游戏数据验证失败:')
    })

    it('应该记录所有错误', () => {
      validateAndLogGameData({ story: {} })
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('story.content 字段缺失'))
    })

    it('应该记录警告', () => {
      validateAndLogGameData({ config: {} })
      expect(logger.warn).toHaveBeenCalledWith('⚠️ 游戏数据验证警告:')
    })

    it('应该记录所有警告', () => {
      validateAndLogGameData({ config: {} })
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('config.home.title 字段缺失或为空')
      )
    })

    it('默认不应该抛出错误', () => {
      expect(() => validateAndLogGameData({ story: {} })).not.toThrow()
    })

    it('当 throwOnError 为 true 时应该抛出错误', () => {
      expect(() => validateAndLogGameData({ story: {} }, true)).toThrow('数据验证失败')
    })

    it('验证通过时不应该抛出错误', () => {
      const validData = {
        story: { content: 'Story' },
      }
      expect(() => validateAndLogGameData(validData, true)).not.toThrow()
    })

    it('应该返回验证结果', () => {
      const result = validateAndLogGameData({ story: { content: 'Story' } })
      expect(result).toHaveProperty('valid')
      expect(result).toHaveProperty('errors')
      expect(result).toHaveProperty('warnings')
    })
  })
})
