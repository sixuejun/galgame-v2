// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PathResolver } from '../pathResolver'
import { logger } from '../../../utils/logger'

// Mock logger
vi.mock('../../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('PathResolver', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('setByPath', () => {
    it('应该成功设置简单路径的值', () => {
      const obj = { story: { content: 'old' } }

      PathResolver.setByPath(obj, 'story.content', 'new')

      expect(obj.story.content).toBe('new')
      expect(logger.debug).toHaveBeenCalledWith('[路径更新] 成功设置路径 "story.content"')
    })

    it('应该创建不存在的中间路径', () => {
      const obj: Record<string, unknown> = {}

      PathResolver.setByPath(obj, 'story.time', '清晨 7:46')

      expect(obj.story).toBeDefined()
      expect((obj.story as Record<string, unknown>).time).toBe('清晨 7:46')
    })

    it('应该支持深层嵌套路径', () => {
      const obj: Record<string, unknown> = {}

      PathResolver.setByPath(obj, 'characters.nanami.coreStatus.content.resonanceDepth.current', 10)

      expect(obj.characters).toBeDefined()
      const characters = obj.characters as Record<string, unknown>
      const nanami = characters.nanami as Record<string, unknown>
      const coreStatus = nanami.coreStatus as Record<string, unknown>
      const content = coreStatus.content as Record<string, unknown>
      const resonanceDepth = content.resonanceDepth as Record<string, unknown>
      expect(resonanceDepth.current).toBe(10)
    })

    it('应该深度合并对象而不是替换', () => {
      const obj = {
        user: {
          name: 'Alice',
          age: 30,
          address: { city: 'Beijing', country: 'China' },
        },
      }

      PathResolver.setByPath(obj, 'user', { age: 31, address: { city: 'Shanghai' } })

      expect(obj.user.name).toBe('Alice') // 保留
      expect(obj.user.age).toBe(31) // 更新
      expect(obj.user.address.city).toBe('Shanghai') // 更新
      expect(obj.user.address.country).toBe('China') // 保留
      expect(logger.debug).toHaveBeenCalledWith('[路径更新] 成功深度合并路径 "user"')
    })

    it('应该替换数组而不是合并', () => {
      const obj = {
        choices: [{ text: '选项1' }, { text: '选项2' }],
      }

      PathResolver.setByPath(obj, 'choices', [{ text: '新选项' }])

      expect(obj.choices).toHaveLength(1)
      expect(obj.choices[0].text).toBe('新选项')
    })

    it('应该替换基本类型值', () => {
      const obj = { count: 10 }

      PathResolver.setByPath(obj, 'count', 20)

      expect(obj.count).toBe(20)
    })

    it('应该支持设置 null 值', () => {
      const obj = { value: 'old' }

      PathResolver.setByPath(obj, 'value', null)

      expect(obj.value).toBe(null)
    })

    it('应该覆盖非对象的中间节点', () => {
      const obj = { path: 'string value' }

      PathResolver.setByPath(obj, 'path.to.value', 'new')

      expect(typeof obj.path).toBe('object')
      expect((obj.path as Record<string, unknown>).to).toBeDefined()
    })

    it('应该支持单层路径', () => {
      const obj: Record<string, unknown> = {}

      PathResolver.setByPath(obj, 'simpleKey', 'value')

      expect(obj.simpleKey).toBe('value')
    })

    it('应该正确处理包含特殊字符的值', () => {
      const obj: Record<string, unknown> = {}

      PathResolver.setByPath(obj, 'story.content', '包含\n换行\t制表符的内容')

      expect((obj.story as Record<string, unknown>).content).toBe('包含\n换行\t制表符的内容')
    })

    it('应该深度合并嵌套对象', () => {
      const obj = {
        config: {
          settings: {
            theme: 'dark',
            language: 'zh',
          },
          features: {
            autoSave: true,
          },
        },
      }

      PathResolver.setByPath(obj, 'config', {
        settings: { theme: 'light' },
        newField: 'value',
      })

      expect(obj.config.settings.theme).toBe('light')
      expect(obj.config.settings.language).toBe('zh') // 保留
      expect(obj.config.features.autoSave).toBe(true) // 保留
      expect((obj.config as Record<string, unknown>).newField).toBe('value')
    })
  })

  describe('deleteByPath', () => {
    it('应该成功删除存在的路径', () => {
      const obj = {
        story: {
          content: 'test',
          time: '清晨',
        },
      }

      const result = PathResolver.deleteByPath(obj, 'story.time')

      expect(result).toBe(true)
      expect(obj.story.time).toBeUndefined()
      expect(obj.story.content).toBe('test') // 其他属性保留
      expect(logger.debug).toHaveBeenCalledWith('[删除] 成功删除路径 "story.time"')
    })

    it('当路径不存在时应该返回 false', () => {
      const obj = { story: { content: 'test' } }

      const result = PathResolver.deleteByPath(obj, 'story.nonexistent')

      expect(result).toBe(false)
      expect(logger.warn).toHaveBeenCalledWith(
        '[删除] 路径 "story.nonexistent" 的最终键 "nonexistent" 不存在'
      )
    })

    it('当中间路径不存在时应该返回 false', () => {
      const obj = { story: { content: 'test' } }

      const result = PathResolver.deleteByPath(obj, 'nonexistent.path.value')

      expect(result).toBe(false)
      expect(logger.warn).toHaveBeenCalledWith(
        '[删除] 路径 "nonexistent.path.value" 中的 "nonexistent" 不存在或不是对象'
      )
    })

    it('当中间节点不是对象时应该返回 false', () => {
      const obj = { story: 'string value' }

      const result = PathResolver.deleteByPath(obj, 'story.content')

      expect(result).toBe(false)
      expect(logger.warn).toHaveBeenCalled()
    })

    it('应该支持删除深层嵌套的属性', () => {
      const obj = {
        characters: {
          nanami: {
            coreStatus: {
              content: {
                resonanceDepth: {
                  current: 10,
                  max: 100,
                },
              },
            },
          },
        },
      }

      const result = PathResolver.deleteByPath(
        obj,
        'characters.nanami.coreStatus.content.resonanceDepth.current'
      )

      expect(result).toBe(true)
      expect(obj.characters.nanami.coreStatus.content.resonanceDepth.current).toBeUndefined()
      expect(obj.characters.nanami.coreStatus.content.resonanceDepth.max).toBe(100) // 保留
    })

    it('应该支持删除单层路径', () => {
      const obj = { simpleKey: 'value', otherKey: 'other' }

      const result = PathResolver.deleteByPath(obj, 'simpleKey')

      expect(result).toBe(true)
      expect(obj.simpleKey).toBeUndefined()
      expect(obj.otherKey).toBe('other')
    })

    it('应该正确处理删除后的空对象', () => {
      const obj = {
        story: {
          onlyField: 'value',
        },
      }

      PathResolver.deleteByPath(obj, 'story.onlyField')

      expect(obj.story).toBeDefined()
      expect(Object.keys(obj.story)).toHaveLength(0)
    })
  })

  describe('cleanPath', () => {
    it('应该移除 gameData. 前缀', () => {
      const result = PathResolver.cleanPath('gameData.story.time')

      expect(result).toBe('story.time')
    })

    it('当没有 gameData. 前缀时应该返回原路径', () => {
      const result = PathResolver.cleanPath('story.time')

      expect(result).toBe('story.time')
    })

    it('应该只移除开头的 gameData. 前缀', () => {
      const result = PathResolver.cleanPath('gameData.nested.gameData.value')

      expect(result).toBe('nested.gameData.value')
    })

    it('应该处理单个 gameData 路径', () => {
      const result = PathResolver.cleanPath('gameData')

      expect(result).toBe('gameData')
    })

    it('应该处理空字符串', () => {
      const result = PathResolver.cleanPath('')

      expect(result).toBe('')
    })

    it('应该处理只有 gameData. 的路径', () => {
      const result = PathResolver.cleanPath('gameData.')

      expect(result).toBe('')
    })

    it('应该正确处理复杂路径', () => {
      const result = PathResolver.cleanPath(
        'gameData.characters.nanami.coreStatus.content.resonanceDepth.current'
      )

      expect(result).toBe('characters.nanami.coreStatus.content.resonanceDepth.current')
    })
  })
})
