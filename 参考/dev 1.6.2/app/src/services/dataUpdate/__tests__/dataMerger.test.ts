// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DataMerger } from '../dataMerger'
import { logger } from '../../../utils/logger'
import type { GameData } from '../../../types'

// Mock logger
vi.mock('../../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

// Mock dataValidation
vi.mock('../../../utils/dataValidation', () => ({
  validateAndLogGameData: vi.fn(() => ({ valid: true })),
}))

describe('DataMerger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('deepCopy', () => {
    it('应该深度拷贝对象', () => {
      const original = {
        name: 'test',
        nested: {
          value: 123,
          array: [1, 2, 3],
        },
      }

      const copy = DataMerger.deepCopy(original)

      expect(copy).toEqual(original)
      expect(copy).not.toBe(original)
      expect(copy.nested).not.toBe(original.nested)
      expect(copy.nested.array).not.toBe(original.nested.array)
    })

    it('应该拷贝数组', () => {
      const original = [1, 2, { value: 3 }]

      const copy = DataMerger.deepCopy(original)

      expect(copy).toEqual(original)
      expect(copy).not.toBe(original)
      expect(copy[2]).not.toBe(original[2])
    })

    it('应该正确处理 null', () => {
      const result = DataMerger.deepCopy(null)

      expect(result).toBe(null)
    })

    it('应该正确处理基本类型', () => {
      expect(DataMerger.deepCopy(123)).toBe(123)
      expect(DataMerger.deepCopy('string')).toBe('string')
      expect(DataMerger.deepCopy(true)).toBe(true)
      expect(DataMerger.deepCopy(undefined)).toBe(undefined)
    })

    it('应该深度拷贝嵌套数组', () => {
      const original = {
        items: [
          { id: 1, tags: ['a', 'b'] },
          { id: 2, tags: ['c', 'd'] },
        ],
      }

      const copy = DataMerger.deepCopy(original)

      expect(copy).toEqual(original)
      expect(copy.items).not.toBe(original.items)
      expect(copy.items[0]).not.toBe(original.items[0])
      expect(copy.items[0].tags).not.toBe(original.items[0].tags)
    })
  })

  describe('applyYamlUpdate', () => {
    const createMockGameData = (): GameData => ({
      config: {
        version: '1.0.0',
        phase: 'test',
        home: {
          title: 'Test Game',
          subtitle: 'Test Subtitle',
        },
      },
      story: {
        content: 'Original story',
      },
    })

    it('应该成功应用 $update 操作', () => {
      const gameData = createMockGameData()
      const yamlContent = `
$update:
  "story.content": "Updated story"
  "story.time": "清晨 7:46"
`

      DataMerger.applyYamlUpdate(gameData, yamlContent)

      expect(gameData.story.content).toBe('Updated story')
      expect(gameData.story.time).toBe('清晨 7:46')
      expect(logger.info).toHaveBeenCalledWith('📝 开始应用 YAML 更新...')
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('✅ YAML 更新完成'))
    })

    it('应该成功应用 $delete 操作', () => {
      const gameData = createMockGameData()
      gameData.story.time = '清晨'
      const yamlContent = `
$delete:
  - "story.time"
`

      DataMerger.applyYamlUpdate(gameData, yamlContent)

      expect(gameData.story.time).toBeUndefined()
      expect(gameData.story.content).toBe('Original story') // 其他字段保留
    })

    it('应该同时应用 $update 和 $delete 操作', () => {
      const gameData = createMockGameData()
      gameData.story.oldField = 'to be deleted'
      const yamlContent = `
$update:
  "story.content": "New content"
$delete:
  - "story.oldField"
`

      DataMerger.applyYamlUpdate(gameData, yamlContent)

      expect(gameData.story.content).toBe('New content')
      expect((gameData.story as Record<string, unknown>).oldField).toBeUndefined()
    })

    it('应该处理初始化场景（直接包含 gameData）', () => {
      const gameData = createMockGameData()
      const yamlContent = `
gameData:
  config:
    version: "2.0.0"
    phase: "new"
    home:
      title: "New Game"
      subtitle: "New Subtitle"
  story:
    content: "New story"
`

      DataMerger.applyYamlUpdate(gameData, yamlContent)

      expect(gameData.config.version).toBe('2.0.0')
      expect(gameData.config.phase).toBe('new')
      expect(gameData.story.content).toBe('New story')
    })

    it('应该支持点路径格式更新', () => {
      const gameData = createMockGameData()
      const yamlContent = `
$update:
  "gameData.story.content": "Updated via dot path"
`

      DataMerger.applyYamlUpdate(gameData, yamlContent)

      expect(gameData.story.content).toBe('Updated via dot path')
    })

    it('应该支持非点路径格式更新', () => {
      const gameData = createMockGameData()
      const yamlContent = `
$update:
  choices:
    - text: "选项1"
    - text: "选项2"
`

      DataMerger.applyYamlUpdate(gameData, yamlContent)

      expect(gameData.choices).toBeDefined()
      expect(gameData.choices).toHaveLength(2)
    })

    it('应该追加 summaries 而不是覆盖', () => {
      const gameData = createMockGameData()
      gameData.summaries = [{ content: '旧摘要' }]
      const yamlContent = `
$update:
  summaries:
    - content: "新摘要1"
    - content: "新摘要2"
`

      DataMerger.applyYamlUpdate(gameData, yamlContent)

      expect(gameData.summaries).toHaveLength(3)
      expect(gameData.summaries[0].content).toBe('旧摘要')
      expect(gameData.summaries[1].content).toBe('新摘要1')
      expect(gameData.summaries[2].content).toBe('新摘要2')
    })

    it('应该在 summaries 不存在时创建它', () => {
      const gameData = createMockGameData()
      const yamlContent = `
$update:
  summaries:
    - content: "新摘要"
`

      DataMerger.applyYamlUpdate(gameData, yamlContent)

      expect(gameData.summaries).toBeDefined()
      expect(gameData.summaries).toHaveLength(1)
      expect(gameData.summaries[0].content).toBe('新摘要')
    })

    it('应该处理包含 gameData 包装层的 $update', () => {
      const gameData = createMockGameData()
      const yamlContent = `
$update:
  gameData:
    story:
      content: "Updated content"
`

      DataMerger.applyYamlUpdate(gameData, yamlContent)

      expect(gameData.story.content).toBe('Updated content')
    })

    it('应该正确处理删除不存在的路径', () => {
      const gameData = createMockGameData()
      const yamlContent = `
$delete:
  - "nonexistent.path"
`

      // 不应该抛出错误
      expect(() => DataMerger.applyYamlUpdate(gameData, yamlContent)).not.toThrow()
    })

    it('当 YAML 解析失败时应该抛出错误', () => {
      const gameData = createMockGameData()
      const invalidYaml = 'invalid: yaml: content:'

      expect(() => DataMerger.applyYamlUpdate(gameData, invalidYaml)).toThrow()
      expect(logger.error).toHaveBeenCalledWith('❌ 应用 YAML 更新失败:', expect.anything())
    })

    it('应该支持更新嵌套对象', () => {
      const gameData = createMockGameData()
      const yamlContent = `
$update:
  "config.home.title": "New Title"
`

      DataMerger.applyYamlUpdate(gameData, yamlContent)

      expect(gameData.config.home.title).toBe('New Title')
      expect(gameData.config.home.subtitle).toBe('Test Subtitle') // 保留其他字段
    })

    it('应该支持创建新的嵌套路径', () => {
      const gameData = createMockGameData()
      const yamlContent = `
$update:
  "characters.nanami.name": "七海"
`

      DataMerger.applyYamlUpdate(gameData, yamlContent)

      expect(gameData.characters).toBeDefined()
      expect(gameData.characters?.nanami?.name).toBe('七海')
    })

    it('应该支持删除嵌套路径', () => {
      const gameData = createMockGameData()
      gameData.config.home.subtitle = 'To be deleted'
      const yamlContent = `
$delete:
  - "config.home.subtitle"
`

      DataMerger.applyYamlUpdate(gameData, yamlContent)

      expect(gameData.config.home.subtitle).toBeUndefined()
      expect(gameData.config.home.title).toBe('Test Game') // 保留其他字段
    })

    it('应该支持使用 gameData. 前缀的删除路径', () => {
      const gameData = createMockGameData()
      gameData.story.time = '清晨'
      const yamlContent = `
$delete:
  - "gameData.story.time"
`

      DataMerger.applyYamlUpdate(gameData, yamlContent)

      expect(gameData.story.time).toBeUndefined()
    })
  })
})
