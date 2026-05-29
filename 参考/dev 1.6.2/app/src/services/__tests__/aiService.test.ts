import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { AIService } from '../aiService'
import { logger } from '../../utils/logger'
import type { GameData, UserAction } from '../../types'

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('AIService', () => {
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
      content: 'Test story content',
    },
  })

  const mockGenerate = vi.fn()

  beforeEach(() => {
    // 创建新的 Pinia 实例
    setActivePinia(createPinia())
    vi.clearAllMocks()
    // Mock window.generate
    // @ts-expect-error - Mocking global window for testing
    globalThis.window = {
      generate: mockGenerate,
    }
    AIService.clearCache()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('isGenerateAvailable', () => {
    it('当 window.generate 存在时应该返回 true', () => {
      expect(AIService.isGenerateAvailable()).toBe(true)
    })

    it('当 window.generate 不存在时应该返回 false', () => {
      // @ts-expect-error - Mocking global window for testing
      globalThis.window = {}
      expect(AIService.isGenerateAvailable()).toBe(false)
    })

    it('当 window 不存在时应该返回 false', () => {
      // @ts-expect-error - Mocking global window for testing
      globalThis.window = undefined
      expect(AIService.isGenerateAvailable()).toBe(false)
    })
  })

  // 创建包含有效 YAML 的 mock 响应
  const createValidYamlResponse = () => {
    return `
这是一些故事内容...

\`\`\`yaml
gameData:
  story:
    content: "测试故事内容"
  choices:
    - text: "选项1"
    - text: "选项2"
\`\`\`
`
  }

  describe('sendPlayerChoice', () => {
    it('应该成功发送玩家选择到 AI', async () => {
      const mockGameData = createMockGameData()
      const playerChoice = 'Test choice'
      const userActionLog: UserAction[] = []
      const mockResponse = createValidYamlResponse()

      mockGenerate.mockResolvedValue(mockResponse)

      const result = await AIService.sendPlayerChoice(mockGameData, playerChoice, userActionLog)

      expect(mockGenerate).toHaveBeenCalled()
      expect(result.success).toBe(true)
      expect(result.yamlContent).toBeTruthy()
      expect(logger.info).toHaveBeenCalledWith('🚀 发送 AI 请求 (尝试 1/3)')
    })

    it('应该传递正确的参数给 generate', async () => {
      const mockGameData = createMockGameData()
      const playerChoice = 'Test choice'
      const userActionLog: UserAction[] = []

      mockGenerate.mockResolvedValue(createValidYamlResponse())

      await AIService.sendPlayerChoice(mockGameData, playerChoice, userActionLog)

      expect(mockGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          user_input: expect.any(String),
          should_stream: false,
          generation_id: expect.stringContaining('gen_'),
        })
      )
    })

    it('应该在发送内容中包含 gameData 和 userChoice', async () => {
      const mockGameData = createMockGameData()
      const playerChoice = 'Test choice'
      const userActionLog: UserAction[] = []

      mockGenerate.mockResolvedValue(createValidYamlResponse())

      await AIService.sendPlayerChoice(mockGameData, playerChoice, userActionLog)

      const callArgs = mockGenerate.mock.calls[0][0]
      expect(callArgs.user_input).toContain('gameData')
      expect(callArgs.user_input).toContain('userChoice')
      expect(callArgs.user_input).toContain('Test choice')
    })

    it('应该包含用户操作日志', async () => {
      const mockGameData = createMockGameData()
      const playerChoice = 'Test choice'
      const userActionLog: UserAction[] = [
        { type: 'choice', content: 'Previous choice', timestamp: '2024-01-01' },
      ]

      mockGenerate.mockResolvedValue(createValidYamlResponse())

      await AIService.sendPlayerChoice(mockGameData, playerChoice, userActionLog)

      const callArgs = mockGenerate.mock.calls[0][0]
      expect(callArgs.user_input).toContain('userAction')
    })

    it('应该包含摘要记录', async () => {
      const mockGameData: GameData = {
        ...createMockGameData(),
        summaries: [
          { time: '2024-01-01', content: 'Summary 1' },
          { time: '2024-01-02', content: 'Summary 2' },
        ],
      }
      const playerChoice = 'Test choice'
      const userActionLog: UserAction[] = []

      mockGenerate.mockResolvedValue(createValidYamlResponse())

      await AIService.sendPlayerChoice(mockGameData, playerChoice, userActionLog)

      const callArgs = mockGenerate.mock.calls[0][0]
      expect(callArgs.user_input).toContain('summaries')
    })

    it('应该限制摘要数量', async () => {
      const mockGameData: GameData = {
        ...createMockGameData(),
        summaries: [
          { time: '2024-01-01', content: 'Summary 1' },
          { time: '2024-01-02', content: 'Summary 2' },
          { time: '2024-01-03', content: 'Summary 3' },
          { time: '2024-01-04', content: 'Summary 4' },
          { time: '2024-01-05', content: 'Summary 5' },
          { time: '2024-01-06', content: 'Summary 6' },
        ],
      }
      const playerChoice = 'Test choice'
      const userActionLog: UserAction[] = []

      mockGenerate.mockResolvedValue(createValidYamlResponse())

      await AIService.sendPlayerChoice(mockGameData, playerChoice, userActionLog, 3)

      const callArgs = mockGenerate.mock.calls[0][0]
      const content = callArgs.user_input
      // 应该只包含最近的 3 条摘要
      expect(content.match(/Summary/g)?.length).toBeLessThanOrEqual(3)
    })

    it('应该缓存发送的内容', async () => {
      const mockGameData = createMockGameData()
      const playerChoice = 'Test choice'
      const userActionLog: UserAction[] = []

      mockGenerate.mockResolvedValue(createValidYamlResponse())

      await AIService.sendPlayerChoice(mockGameData, playerChoice, userActionLog)

      // 验证缓存已设置（通过重试功能验证）
      expect(mockGenerate).toHaveBeenCalledTimes(1)
    })

    it('当 generate 接口不可用时应该抛出错误', async () => {
      // @ts-expect-error - Mocking global window for testing
      globalThis.window = {}

      const mockGameData = createMockGameData()
      const playerChoice = 'Test choice'
      const userActionLog: UserAction[] = []

      await expect(
        AIService.sendPlayerChoice(mockGameData, playerChoice, userActionLog)
      ).rejects.toThrow()
    })

    it('当 generate 调用失败时应该抛出错误', async () => {
      const mockGameData = createMockGameData()
      const playerChoice = 'Test choice'
      const userActionLog: UserAction[] = []

      mockGenerate.mockRejectedValue(new Error('Generate failed'))

      await expect(
        AIService.sendPlayerChoice(mockGameData, playerChoice, userActionLog)
      ).rejects.toThrow()
    })
  })

  describe('retryLastRequest', () => {
    it('应该重试上一次的请求', async () => {
      const mockGameData = createMockGameData()
      const playerChoice = 'Test choice'
      const userActionLog: UserAction[] = []

      mockGenerate.mockResolvedValue(createValidYamlResponse())
      await AIService.sendPlayerChoice(mockGameData, playerChoice, userActionLog)

      mockGenerate.mockResolvedValue(createValidYamlResponse())
      const result = await AIService.retryLastRequest()

      expect(result.success).toBe(true)
      expect(mockGenerate).toHaveBeenCalledTimes(2)
      expect(logger.info).toHaveBeenCalledWith('🔄 重试上一次的 AI 请求...')
    })

    it('应该使用相同的内容但不同的 generation_id', async () => {
      const mockGameData = createMockGameData()
      const playerChoice = 'Test choice'
      const userActionLog: UserAction[] = []

      mockGenerate.mockResolvedValue(createValidYamlResponse())
      await AIService.sendPlayerChoice(mockGameData, playerChoice, userActionLog)

      const firstCallArgs = mockGenerate.mock.calls[0][0]

      await AIService.retryLastRequest()

      const secondCallArgs = mockGenerate.mock.calls[1][0]

      expect(firstCallArgs.user_input).toBe(secondCallArgs.user_input)
      expect(firstCallArgs.generation_id).not.toBe(secondCallArgs.generation_id)
    })

    it('当没有缓存的请求时应该抛出错误', async () => {
      await expect(AIService.retryLastRequest()).rejects.toThrow('没有可重试的请求')
    })

    it('当 generate 接口不可用时应该抛出错误', async () => {
      const mockGameData = createMockGameData()
      const playerChoice = 'Test choice'
      const userActionLog: UserAction[] = []

      mockGenerate.mockResolvedValue(createValidYamlResponse())
      await AIService.sendPlayerChoice(mockGameData, playerChoice, userActionLog)

      // @ts-expect-error - Mocking global window for testing
      globalThis.window = {}

      await expect(AIService.retryLastRequest()).rejects.toThrow()
    })
  })

  describe('clearCache', () => {
    it('应该清除缓存的请求内容', async () => {
      const mockGameData = createMockGameData()
      const playerChoice = 'Test choice'
      const userActionLog: UserAction[] = []

      mockGenerate.mockResolvedValue(createValidYamlResponse())
      await AIService.sendPlayerChoice(mockGameData, playerChoice, userActionLog)

      AIService.clearCache()

      await expect(AIService.retryLastRequest()).rejects.toThrow('没有可重试的请求')
    })

    it('应该记录调试日志', () => {
      AIService.clearCache()
      expect(logger.debug).toHaveBeenCalledWith('AI 请求缓存已清除')
    })
  })

  describe('增强的YAML解析验证', () => {
    it('应该成功解析包含 $update 操作符的有效 YAML', async () => {
      const mockGameData = createMockGameData()
      const playerChoice = 'Test choice'
      const userActionLog: UserAction[] = []
      const mockResponse = `
这是一些故事内容...

\`\`\`yaml
$update:
  "story.content": "新的故事内容"
  "story.time": "清晨 7:46"
\`\`\`
`
      mockGenerate.mockResolvedValue(mockResponse)

      const result = await AIService.sendPlayerChoice(mockGameData, playerChoice, userActionLog)

      expect(result.success).toBe(true)
      expect(result.yamlContent).toBeTruthy()
      expect(result.error).toBeUndefined()
    })

    it('应该成功解析包含 $delete 操作符的有效 YAML', async () => {
      const mockGameData = createMockGameData()
      const playerChoice = 'Test choice'
      const userActionLog: UserAction[] = []
      const mockResponse = `
\`\`\`yaml
$delete:
  - "old.field"
  - "another.field"
\`\`\`
`
      mockGenerate.mockResolvedValue(mockResponse)

      const result = await AIService.sendPlayerChoice(mockGameData, playerChoice, userActionLog)

      expect(result.success).toBe(true)
      expect(result.yamlContent).toBeTruthy()
    })

    it('应该成功解析包含 gameData 的有效 YAML', async () => {
      const mockGameData = createMockGameData()
      const playerChoice = 'Test choice'
      const userActionLog: UserAction[] = []
      const mockResponse = createValidYamlResponse()

      mockGenerate.mockResolvedValue(mockResponse)

      const result = await AIService.sendPlayerChoice(mockGameData, playerChoice, userActionLog)

      expect(result.success).toBe(true)
      expect(result.yamlContent).toBeTruthy()
    })

    it('应该拒绝格式错误的 YAML', async () => {
      const mockGameData = createMockGameData()
      const playerChoice = 'Test choice'
      const userActionLog: UserAction[] = []
      const mockResponse = `
\`\`\`yaml
invalid: yaml: content:
  - this is
  - not: valid
    - yaml
\`\`\`
`
      mockGenerate.mockResolvedValue(mockResponse)

      await expect(
        AIService.sendPlayerChoice(mockGameData, playerChoice, userActionLog)
      ).rejects.toThrow()

      expect(logger.error).toHaveBeenCalledWith('❌ YAML 内容解析失败:', expect.anything())
    })

    it('应该拒绝解析结果不是对象的 YAML', async () => {
      const mockGameData = createMockGameData()
      const playerChoice = 'Test choice'
      const userActionLog: UserAction[] = []
      const mockResponse = `
\`\`\`yaml
just a string
\`\`\`
`
      mockGenerate.mockResolvedValue(mockResponse)

      await expect(
        AIService.sendPlayerChoice(mockGameData, playerChoice, userActionLog)
      ).rejects.toThrow()

      expect(logger.error).toHaveBeenCalledWith('❌ YAML 解析结果不是有效对象')
    })

    it('应该拒绝缺少有效操作符的 YAML', async () => {
      const mockGameData = createMockGameData()
      const playerChoice = 'Test choice'
      const userActionLog: UserAction[] = []
      const mockResponse = `
\`\`\`yaml
someField: "value"
anotherField: 123
\`\`\`
`
      mockGenerate.mockResolvedValue(mockResponse)

      await expect(
        AIService.sendPlayerChoice(mockGameData, playerChoice, userActionLog)
      ).rejects.toThrow()

      expect(logger.error).toHaveBeenCalledWith(
        '❌ YAML 内容缺少有效的操作符（$update、$delete）或 gameData 字段'
      )
    })

    it('应该拒绝缺少 YAML 代码块的响应', async () => {
      const mockGameData = createMockGameData()
      const playerChoice = 'Test choice'
      const userActionLog: UserAction[] = []
      const mockResponse = '这是一些没有代码块的文本'

      mockGenerate.mockResolvedValue(mockResponse)

      await expect(
        AIService.sendPlayerChoice(mockGameData, playerChoice, userActionLog)
      ).rejects.toThrow()

      expect(logger.error).toHaveBeenCalledWith('❌ 未找到 YAML 代码块')
    })

    it('应该拒绝空的 YAML 代码块', async () => {
      const mockGameData = createMockGameData()
      const playerChoice = 'Test choice'
      const userActionLog: UserAction[] = []
      const mockResponse = `
\`\`\`yaml
\`\`\`
`
      mockGenerate.mockResolvedValue(mockResponse)

      await expect(
        AIService.sendPlayerChoice(mockGameData, playerChoice, userActionLog)
      ).rejects.toThrow()
    })

    it('应该成功解析同时包含多个操作符的 YAML', async () => {
      const mockGameData = createMockGameData()
      const playerChoice = 'Test choice'
      const userActionLog: UserAction[] = []
      const mockResponse = `
\`\`\`yaml
$update:
  "story.content": "新内容"
$delete:
  - "old.field"
gameData:
  config:
    version: "1.0.0"
\`\`\`
`
      mockGenerate.mockResolvedValue(mockResponse)

      const result = await AIService.sendPlayerChoice(mockGameData, playerChoice, userActionLog)

      expect(result.success).toBe(true)
      expect(result.yamlContent).toBeTruthy()
    })

    it('应该拒绝 $update 不是对象的 YAML', async () => {
      const mockGameData = createMockGameData()
      const playerChoice = 'Test choice'
      const userActionLog: UserAction[] = []
      const mockResponse = `
\`\`\`yaml
$update: "not an object"
\`\`\`
`
      mockGenerate.mockResolvedValue(mockResponse)

      await expect(
        AIService.sendPlayerChoice(mockGameData, playerChoice, userActionLog)
      ).rejects.toThrow()
    })

    it('应该拒绝 $delete 不是数组的 YAML', async () => {
      const mockGameData = createMockGameData()
      const playerChoice = 'Test choice'
      const userActionLog: UserAction[] = []
      const mockResponse = `
\`\`\`yaml
$delete: "not an array"
\`\`\`
`
      mockGenerate.mockResolvedValue(mockResponse)

      await expect(
        AIService.sendPlayerChoice(mockGameData, playerChoice, userActionLog)
      ).rejects.toThrow()
    })

    it('应该拒绝 gameData 不是对象的 YAML', async () => {
      const mockGameData = createMockGameData()
      const playerChoice = 'Test choice'
      const userActionLog: UserAction[] = []
      const mockResponse = `
\`\`\`yaml
gameData: "not an object"
\`\`\`
`
      mockGenerate.mockResolvedValue(mockResponse)

      await expect(
        AIService.sendPlayerChoice(mockGameData, playerChoice, userActionLog)
      ).rejects.toThrow()
    })
  })
})
