import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAICommunication } from '../ai/useAICommunication'
import { AIService } from '../../services/aiService'
import type { GameData, UserAction } from '../../types'

// Mock AIService
vi.mock('../../services/aiService', () => ({
  AIService: {
    sendPlayerChoice: vi.fn(),
    retryLastRequest: vi.fn(),
    isGenerateAvailable: vi.fn(),
    clearCache: vi.fn(),
    resetRetryCount: vi.fn(),
    getRetryCount: vi.fn(() => 0),
  },
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

describe('useAICommunication', () => {
  const createMockGameData = (): GameData => ({
    config: {
      version: '1.0.0',
      phase: 'test',
      home: {
        title: 'Test Game',
        subtitle: 'Test Subtitle',
      },
    },
  })

  const createMockParsedResponse = () => ({
    success: true,
    yamlContent: 'test yaml',
    gameData: createMockGameData(),
    rawResponse: 'test response',
  })

  beforeEach(() => {
    // 创建新的 Pinia 实例
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('状态', () => {
    it('应该暴露 isGenerating 状态', () => {
      const { isGenerating } = useAICommunication()
      expect(isGenerating.value).toBe(false)
    })

    it('应该暴露 lastResponse 状态', () => {
      const { lastResponse } = useAICommunication()
      expect(lastResponse.value).toBeNull()
    })

    it('应该暴露 generationError 状态', () => {
      const { generationError } = useAICommunication()
      expect(generationError.value).toBeNull()
    })
  })

  describe('sendPlayerChoice', () => {
    it('应该成功发送玩家选择', async () => {
      const mockResponse = createMockParsedResponse()
      vi.mocked(AIService.sendPlayerChoice).mockResolvedValue(mockResponse)

      const { sendPlayerChoice, isGenerating, lastResponse } = useAICommunication()
      const gameData = createMockGameData()
      const userActionLog: UserAction[] = []

      const result = await sendPlayerChoice(gameData, 'Test choice', userActionLog)

      expect(result).toStrictEqual(mockResponse)
      expect(lastResponse.value).toStrictEqual(mockResponse)
      expect(isGenerating.value).toBe(false)
    })

    it('应该在生成中时拒绝新请求', async () => {
      const mockResponse = createMockParsedResponse()
      vi.mocked(AIService.sendPlayerChoice).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockResponse), 100))
      )

      const { sendPlayerChoice } = useAICommunication()
      const gameData = createMockGameData()
      const userActionLog: UserAction[] = []

      // 第一个请求
      const promise1 = sendPlayerChoice(gameData, 'Choice 1', userActionLog)
      // 第二个请求应该被拒绝
      const result2 = await sendPlayerChoice(gameData, 'Choice 2', userActionLog)

      expect(result2).toBeNull()
      await promise1
    })

    it('应该处理错误', async () => {
      const error = new Error('AI Error')
      vi.mocked(AIService.sendPlayerChoice).mockRejectedValue(error)

      const { sendPlayerChoice, generationError } = useAICommunication()
      const gameData = createMockGameData()
      const userActionLog: UserAction[] = []

      const result = await sendPlayerChoice(gameData, 'Test choice', userActionLog)

      expect(result).toBeNull()
      expect(generationError.value).toBe('AI Error')
    })

    it('应该传递 summariesCount 参数', async () => {
      const mockResponse = createMockParsedResponse()
      vi.mocked(AIService.sendPlayerChoice).mockResolvedValue(mockResponse)

      const { sendPlayerChoice } = useAICommunication()
      const gameData = createMockGameData()
      const userActionLog: UserAction[] = []

      await sendPlayerChoice(gameData, 'Test choice', userActionLog, 10)

      expect(AIService.sendPlayerChoice).toHaveBeenCalled()
    })
  })

  describe('retryLastRequest', () => {
    it('应该成功重试请求', async () => {
      const mockResponse = createMockParsedResponse()
      vi.mocked(AIService.retryLastRequest).mockResolvedValue(mockResponse)

      const { retryLastRequest, lastResponse } = useAICommunication()

      const result = await retryLastRequest()

      expect(result).toStrictEqual(mockResponse)
      expect(lastResponse.value).toStrictEqual(mockResponse)
    })

    it('应该在生成中时拒绝重试', async () => {
      const mockResponse = createMockParsedResponse()
      vi.mocked(AIService.sendPlayerChoice).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockResponse), 100))
      )

      const { sendPlayerChoice, retryLastRequest } = useAICommunication()
      const gameData = createMockGameData()
      const userActionLog: UserAction[] = []

      // 开始一个请求
      const promise = sendPlayerChoice(gameData, 'Test choice', userActionLog)
      // 尝试重试应该被拒绝
      const retryResult = await retryLastRequest()

      expect(retryResult).toBeNull()
      await promise
    })

    it('应该处理重试错误', async () => {
      const error = new Error('Retry Error')
      vi.mocked(AIService.retryLastRequest).mockRejectedValue(error)

      const { retryLastRequest, generationError } = useAICommunication()

      const result = await retryLastRequest()

      expect(result).toBeNull()
      expect(generationError.value).toBe('Retry Error')
    })
  })

  describe('sendInitRequest', () => {
    it('应该成功发送初始化请求', async () => {
      const mockResponse = createMockParsedResponse()
      vi.mocked(AIService.sendPlayerChoice).mockResolvedValue(mockResponse)

      const { sendInitRequest, lastResponse } = useAICommunication()

      const result = await sendInitRequest('System instruction', 'User input')

      expect(result).toStrictEqual(mockResponse)
      expect(lastResponse.value).toStrictEqual(mockResponse)
    })

    it('应该在生成中时拒绝初始化请求', async () => {
      const mockResponse = createMockParsedResponse()
      vi.mocked(AIService.sendPlayerChoice).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockResponse), 100))
      )

      const { sendPlayerChoice, sendInitRequest } = useAICommunication()
      const gameData = createMockGameData()
      const userActionLog: UserAction[] = []

      // 开始一个请求
      const promise = sendPlayerChoice(gameData, 'Test choice', userActionLog)
      // 尝试初始化应该被拒绝
      const initResult = await sendInitRequest('System', 'User')

      expect(initResult).toBeNull()
      await promise
    })

    it('应该处理初始化错误', async () => {
      const error = new Error('Init Error')
      vi.mocked(AIService.sendPlayerChoice).mockRejectedValue(error)

      const { sendInitRequest, generationError } = useAICommunication()

      const result = await sendInitRequest('System instruction', 'User input')

      expect(result).toBeNull()
      expect(generationError.value).toBe('Init Error')
    })

    it('应该处理空用户输入', async () => {
      const mockResponse = createMockParsedResponse()
      vi.mocked(AIService.sendPlayerChoice).mockResolvedValue(mockResponse)

      const { sendInitRequest } = useAICommunication()

      const result = await sendInitRequest('System instruction', '')

      expect(result).toStrictEqual(mockResponse)
    })
  })

  describe('isAIAvailable', () => {
    it('当 AI 可用时应该返回 true', () => {
      vi.mocked(AIService.isGenerateAvailable).mockReturnValue(true)

      const { isAIAvailable } = useAICommunication()

      expect(isAIAvailable()).toBe(true)
    })

    it('当 AI 不可用时应该返回 false', () => {
      vi.mocked(AIService.isGenerateAvailable).mockReturnValue(false)

      const { isAIAvailable } = useAICommunication()

      expect(isAIAvailable()).toBe(false)
    })
  })

  describe('clearCache', () => {
    it('应该清除所有缓存和状态', async () => {
      const mockResponse = createMockParsedResponse()
      vi.mocked(AIService.sendPlayerChoice).mockResolvedValue(mockResponse)

      const { sendPlayerChoice, clearCache, lastResponse, generationError } = useAICommunication()
      const gameData = createMockGameData()
      const userActionLog: UserAction[] = []

      // 先发送一个请求
      await sendPlayerChoice(gameData, 'Test choice', userActionLog)
      expect(lastResponse.value).not.toBeNull()

      // 清除缓存
      clearCache()

      expect(lastResponse.value).toBeNull()
      expect(generationError.value).toBeNull()
      expect(AIService.clearCache).toHaveBeenCalled()
      expect(AIService.resetRetryCount).toHaveBeenCalled()
    })
  })
})
