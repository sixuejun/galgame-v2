// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { YamlParser } from '../yamlParser'
import { logger } from '../../../utils/logger'
import { ParseError, ValidationError } from '../../../utils/errorHandler'

// Mock logger
vi.mock('../../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('YamlParser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('parse', () => {
    it('应该成功解析有效的 YAML 内容', () => {
      const yamlContent = `
$update:
  "gameData.story.time": "清晨 7:46"
  "gameData.story.content": "故事内容"
`
      const result = YamlParser.parse(yamlContent)

      expect(result).toBeDefined()
      expect(result.$update).toBeDefined()
      expect(result.$update).toHaveProperty('gameData.story.time', '清晨 7:46')
      expect(result.$update).toHaveProperty('gameData.story.content', '故事内容')
    })

    it('应该成功解析包含 $delete 操作的 YAML', () => {
      const yamlContent = `
$delete:
  - "gameData.system.storage.inventory.item1"
  - "gameData.system.storage.inventory.item2"
`
      const result = YamlParser.parse(yamlContent)

      expect(result.$delete).toBeDefined()
      expect(Array.isArray(result.$delete)).toBe(true)
      expect(result.$delete).toHaveLength(2)
      expect(result.$delete).toContain('gameData.system.storage.inventory.item1')
    })

    it('应该成功解析包含 gameData 的 YAML', () => {
      const yamlContent = `
gameData:
  story:
    content: "测试故事"
    time: "清晨"
  choices:
    - text: "选项1"
    - text: "选项2"
`
      const result = YamlParser.parse(yamlContent)

      expect(result.gameData).toBeDefined()
      expect(result.gameData).toHaveProperty('story')
      expect(result.gameData).toHaveProperty('choices')
    })

    it('应该成功解析同时包含 $update 和 $delete 的 YAML', () => {
      const yamlContent = `
$update:
  "story.content": "新内容"
$delete:
  - "old.field"
`
      const result = YamlParser.parse(yamlContent)

      expect(result.$update).toBeDefined()
      expect(result.$delete).toBeDefined()
    })

    it('当 YAML 解析结果不是对象时应该抛出 ValidationError', () => {
      const yamlContent = 'just a string'

      expect(() => YamlParser.parse(yamlContent)).toThrow(ValidationError)
      expect(() => YamlParser.parse(yamlContent)).toThrow('YAML 解析结果不是有效对象')
    })

    it('当 YAML 解析结果为 null 时应该抛出 ValidationError', () => {
      const yamlContent = 'null'

      expect(() => YamlParser.parse(yamlContent)).toThrow(ValidationError)
    })

    it('当 YAML 格式无效时应该抛出 ParseError', () => {
      const yamlContent = `
invalid: yaml: content:
  - this is
  - not: valid
    - yaml
`
      expect(() => YamlParser.parse(yamlContent)).toThrow(ParseError)
      expect(() => YamlParser.parse(yamlContent)).toThrow('YAML 内容解析失败')
    })

    it('应该正确解析包含数组的 YAML', () => {
      const yamlContent = `
$update:
  choices:
    - text: "选项1"
      description: "描述1"
    - text: "选项2"
      description: "描述2"
`
      const result = YamlParser.parse(yamlContent)

      expect(result.$update?.choices).toBeDefined()
      expect(Array.isArray(result.$update?.choices)).toBe(true)
      expect(result.$update?.choices).toHaveLength(2)
    })

    it('应该正确解析包含嵌套对象的 YAML', () => {
      const yamlContent = `
gameData:
  characters:
    nanami:
      name: "七海"
      coreStatus:
        content:
          resonanceDepth:
            current: 10
            max: 100
`
      const result = YamlParser.parse(yamlContent)

      expect(result.gameData?.characters?.nanami?.name).toBe('七海')
      expect(
        result.gameData?.characters?.nanami?.coreStatus?.content?.resonanceDepth?.current
      ).toBe(10)
    })
  })

  describe('validate', () => {
    it('当包含 $update 操作时应该返回 true', () => {
      const yamlContent = `
$update:
  "story.content": "内容"
`
      expect(YamlParser.validate(yamlContent)).toBe(true)
    })

    it('当包含 $delete 操作时应该返回 true', () => {
      const yamlContent = `
$delete:
  - "path.to.delete"
`
      expect(YamlParser.validate(yamlContent)).toBe(true)
    })

    it('当包含 gameData 时应该返回 true', () => {
      const yamlContent = `
gameData:
  story:
    content: "内容"
`
      expect(YamlParser.validate(yamlContent)).toBe(true)
    })

    it('当同时包含多个有效操作时应该返回 true', () => {
      const yamlContent = `
$update:
  "story.content": "内容"
$delete:
  - "old.field"
gameData:
  config:
    version: "1.0.0"
`
      expect(YamlParser.validate(yamlContent)).toBe(true)
    })

    it('当不包含任何有效操作时应该返回 false', () => {
      const yamlContent = `
someOtherField: "value"
anotherField: 123
`
      expect(YamlParser.validate(yamlContent)).toBe(false)
    })

    it('当 YAML 格式无效时应该返回 false', () => {
      const yamlContent = 'invalid: yaml: content:'

      expect(YamlParser.validate(yamlContent)).toBe(false)
      expect(logger.error).toHaveBeenCalledWith('[YAML验证] YAML 格式无效:', expect.anything())
    })

    it('当内容为空字符串时应该返回 false', () => {
      expect(YamlParser.validate('')).toBe(false)
    })

    it('当内容为纯字符串时应该返回 false', () => {
      expect(YamlParser.validate('just a string')).toBe(false)
    })

    it('当 $update 不是对象时应该返回 false', () => {
      const yamlContent = `
$update: "not an object"
`
      expect(YamlParser.validate(yamlContent)).toBe(false)
    })

    it('当 $delete 不是数组时应该返回 false', () => {
      const yamlContent = `
$delete: "not an array"
`
      expect(YamlParser.validate(yamlContent)).toBe(false)
    })

    it('当 gameData 不是对象时应该返回 false', () => {
      const yamlContent = `
gameData: "not an object"
`
      expect(YamlParser.validate(yamlContent)).toBe(false)
    })
  })

  describe('getOperationType', () => {
    it('应该正确识别 $update 操作', () => {
      const parsed = {
        $update: { 'story.content': 'test' },
      }

      const result = YamlParser.getOperationType(parsed)

      expect(result.hasUpdate).toBe(true)
      expect(result.hasDelete).toBe(false)
      expect(result.hasGameData).toBe(false)
    })

    it('应该正确识别 $delete 操作', () => {
      const parsed = {
        $delete: ['path.to.delete'],
      }

      const result = YamlParser.getOperationType(parsed)

      expect(result.hasUpdate).toBe(false)
      expect(result.hasDelete).toBe(true)
      expect(result.hasGameData).toBe(false)
    })

    it('应该正确识别 gameData', () => {
      const parsed = {
        gameData: { story: { content: 'test' } },
      }

      const result = YamlParser.getOperationType(parsed)

      expect(result.hasUpdate).toBe(false)
      expect(result.hasDelete).toBe(false)
      expect(result.hasGameData).toBe(true)
    })

    it('应该正确识别多个操作类型', () => {
      const parsed = {
        $update: { 'story.content': 'test' },
        $delete: ['old.field'],
        gameData: { config: { version: '1.0.0' } },
      }

      const result = YamlParser.getOperationType(parsed)

      expect(result.hasUpdate).toBe(true)
      expect(result.hasDelete).toBe(true)
      expect(result.hasGameData).toBe(true)
    })

    it('当没有任何操作时应该全部返回 false', () => {
      const parsed = {
        someOtherField: 'value',
      }

      const result = YamlParser.getOperationType(parsed)

      expect(result.hasUpdate).toBe(false)
      expect(result.hasDelete).toBe(false)
      expect(result.hasGameData).toBe(false)
    })

    it('当 $update 不是对象时应该返回 false', () => {
      const parsed = {
        $update: 'not an object',
      }

      const result = YamlParser.getOperationType(parsed)

      expect(result.hasUpdate).toBe(false)
    })

    it('当 $delete 不是数组时应该返回 false', () => {
      const parsed = {
        $delete: 'not an array',
      }

      const result = YamlParser.getOperationType(parsed)

      expect(result.hasDelete).toBe(false)
    })

    it('当 gameData 不是对象时应该返回 false', () => {
      const parsed = {
        gameData: 'not an object',
      }

      const result = YamlParser.getOperationType(parsed)

      expect(result.hasGameData).toBe(false)
    })
  })
})
