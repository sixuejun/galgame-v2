import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { usePlayerChoice } from '../game/usePlayerChoice'
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

// Mock stores
vi.mock('../../stores/gameStore', () => ({
  useGameStore: vi.fn(() => ({
    gameData: ref({}),
    userActionLog: ref([]),
    clearUserActionLog: vi.fn(),
    autoSaveToWorldbook: vi.fn(),
    updateGameDataFromAI: vi.fn(),
  })),
}))

vi.mock('../../stores/settingsStore', () => ({
  useSettingsStore: vi.fn(() => ({
    settings: {
      maxDataRetries: 3,
    },
  })),
}))

vi.mock('../ai/useAICommunication', () => ({
  useAICommunication: vi.fn(() => ({
    isAIAvailable: vi.fn(() => true),
    sendPlayerChoice: vi.fn(),
  })),
}))

vi.mock('../ui/useToast', () => ({
  useToast: vi.fn(() => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  })),
}))

vi.mock('../../services/aiService', () => ({
  AIService: {
    resetDataRetryState: vi.fn(),
    setDataRetryState: vi.fn(),
  },
}))

describe('usePlayerChoice', () => {
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

  const createMockOptions = () => {
    const gameData = ref<GameData>(createMockGameData())
    const userActionLog = ref<UserAction[]>([])
    const reviewPageRef = ref({
      getSendCount: vi.fn().mockReturnValue(5),
    })
    const generationError = ref<string | null>(null)

    return {
      gameData,
      userActionLog,
      reviewPageRef,
      isAIAvailable: vi.fn().mockReturnValue(true),
      sendPlayerChoice: vi.fn(),
      updateGameDataFromAI: vi.fn(),
      clearUserActionLog: vi.fn(),
      autoSaveToWorldbook: vi.fn(),
      showSuccessToast: vi.fn(),
      showErrorToast: vi.fn(),
      showWarningToast: vi.fn(),
      generationError,
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  describe('handleChoice', () => {
    it('应该成功处理玩家选择', async () => {
      const options = createMockOptions()
      const mockResponse = {
        success: true,
        yamlContent: 'test yaml',
        gameData: createMockGameData(),
      }
      options.sendPlayerChoice.mockResolvedValue(mockResponse)

      const { handleChoice } = usePlayerChoice(options)

      await handleChoice('Test choice')

      expect(options.sendPlayerChoice).toHaveBeenCalledWith(
        options.gameData.value,
        'Test choice',
        options.userActionLog.value,
        5
      )
      expect(options.updateGameDataFromAI).toHaveBeenCalledWith('test yaml')
      expect(options.clearUserActionLog).toHaveBeenCalled()
      expect(options.autoSaveToWorldbook).toHaveBeenCalled()
      expect(options.showSuccessToast).toHaveBeenCalledWith('✨ 选择已处理，故事继续发展...')
    })

    it('当 AI 不可用时应该显示警告并保存', async () => {
      const options = createMockOptions()
      options.isAIAvailable.mockReturnValue(false)

      const { handleChoice } = usePlayerChoice(options)

      await handleChoice('Test choice')

      expect(options.sendPlayerChoice).not.toHaveBeenCalled()
      expect(options.showWarningToast).toHaveBeenCalledWith(
        'AI 接口不可用，已记录您的选择: "Test choice"'
      )
      expect(options.autoSaveToWorldbook).toHaveBeenCalled()
    })

    it('应该使用 reviewPageRef 的 getSendCount', async () => {
      const options = createMockOptions()
      options.reviewPageRef.value.getSendCount.mockReturnValue(10)
      const mockResponse = {
        success: true,
        yamlContent: 'test yaml',
      }
      options.sendPlayerChoice.mockResolvedValue(mockResponse)

      const { handleChoice } = usePlayerChoice(options)

      await handleChoice('Test choice')

      expect(options.sendPlayerChoice).toHaveBeenCalledWith(
        options.gameData.value,
        'Test choice',
        options.userActionLog.value,
        10
      )
    })

    it('当 reviewPageRef 没有 getSendCount 时应该使用默认值 5', async () => {
      const options = createMockOptions()
      // @ts-expect-error - 测试边界情况：reviewPageRef 没有 getSendCount
      options.reviewPageRef.value = {}
      const mockResponse = {
        success: true,
        yamlContent: 'test yaml',
      }
      options.sendPlayerChoice.mockResolvedValue(mockResponse)

      const { handleChoice } = usePlayerChoice(options)

      await handleChoice('Test choice')

      expect(options.sendPlayerChoice).toHaveBeenCalledWith(
        options.gameData.value,
        'Test choice',
        options.userActionLog.value,
        5
      )
    })

    it('当 AI 响应失败时应该显示错误', async () => {
      const options = createMockOptions()
      const mockResponse = {
        success: false,
        error: 'AI Error',
      }
      options.sendPlayerChoice.mockResolvedValue(mockResponse)

      const { handleChoice } = usePlayerChoice(options)

      await handleChoice('Test choice')

      expect(options.showErrorToast).toHaveBeenCalledWith('AI 响应失败: AI Error')
      expect(options.updateGameDataFromAI).not.toHaveBeenCalled()
      expect(options.clearUserActionLog).not.toHaveBeenCalled()
    })

    it('当 AI 响应失败且没有错误信息时应该使用 generationError', async () => {
      const options = createMockOptions()
      options.generationError.value = 'Generation Error'
      const mockResponse = {
        success: false,
      }
      options.sendPlayerChoice.mockResolvedValue(mockResponse)

      const { handleChoice } = usePlayerChoice(options)

      await handleChoice('Test choice')

      expect(options.showErrorToast).toHaveBeenCalledWith('AI 响应失败: Generation Error')
    })

    it('当 AI 响应失败且没有任何错误信息时应该使用默认错误', async () => {
      const options = createMockOptions()
      const mockResponse = {
        success: false,
      }
      options.sendPlayerChoice.mockResolvedValue(mockResponse)

      const { handleChoice } = usePlayerChoice(options)

      await handleChoice('Test choice')

      expect(options.showErrorToast).toHaveBeenCalledWith('AI 响应失败: 未知错误')
    })

    it('当更新游戏数据失败时应该显示错误', async () => {
      const options = createMockOptions()
      const mockResponse = {
        success: true,
        yamlContent: 'test yaml',
      }
      options.sendPlayerChoice.mockResolvedValue(mockResponse)
      options.updateGameDataFromAI.mockImplementation(() => {
        throw new Error('Update Error')
      })

      const { handleChoice } = usePlayerChoice(options)

      await handleChoice('Test choice')

      expect(options.showErrorToast).toHaveBeenCalledWith('游戏数据更新失败，请检查控制台日志')
      expect(options.clearUserActionLog).not.toHaveBeenCalled()
      expect(options.autoSaveToWorldbook).not.toHaveBeenCalled()
    })

    it('当 sendPlayerChoice 抛出异常时应该显示错误', async () => {
      const options = createMockOptions()
      options.sendPlayerChoice.mockRejectedValue(new Error('Network Error'))

      const { handleChoice } = usePlayerChoice(options)

      await handleChoice('Test choice')

      expect(options.showErrorToast).toHaveBeenCalledWith('处理选择时出错: Network Error')
      expect(options.updateGameDataFromAI).not.toHaveBeenCalled()
    })

    it('当 sendPlayerChoice 抛出非 Error 异常时应该使用默认错误信息', async () => {
      const options = createMockOptions()
      options.sendPlayerChoice.mockRejectedValue('String error')

      const { handleChoice } = usePlayerChoice(options)

      await handleChoice('Test choice')

      expect(options.showErrorToast).toHaveBeenCalledWith('处理选择时出错: 未知错误')
    })

    it('当响应成功但没有 yamlContent 时应该跳过更新', async () => {
      const options = createMockOptions()
      const mockResponse = {
        success: true,
      }
      options.sendPlayerChoice.mockResolvedValue(mockResponse)

      const { handleChoice } = usePlayerChoice(options)

      await handleChoice('Test choice')

      expect(options.updateGameDataFromAI).not.toHaveBeenCalled()
      expect(options.clearUserActionLog).toHaveBeenCalled()
      expect(options.autoSaveToWorldbook).toHaveBeenCalled()
      expect(options.showSuccessToast).toHaveBeenCalled()
    })

    it('应该在处理过程中保持正确的调用顺序', async () => {
      const options = createMockOptions()
      const callOrder: string[] = []

      options.sendPlayerChoice.mockImplementation(async () => {
        callOrder.push('sendPlayerChoice')
        return { success: true, yamlContent: 'test yaml' }
      })
      options.updateGameDataFromAI.mockImplementation(() => {
        callOrder.push('updateGameDataFromAI')
      })
      options.clearUserActionLog.mockImplementation(() => {
        callOrder.push('clearUserActionLog')
      })
      options.autoSaveToWorldbook.mockImplementation(async () => {
        callOrder.push('autoSaveToWorldbook')
      })
      options.showSuccessToast.mockImplementation(() => {
        callOrder.push('showSuccessToast')
      })

      const { handleChoice } = usePlayerChoice(options)

      await handleChoice('Test choice')

      expect(callOrder).toEqual([
        'sendPlayerChoice',
        'updateGameDataFromAI',
        'clearUserActionLog',
        'autoSaveToWorldbook',
        'showSuccessToast',
      ])
    })
  })

  describe('handleChoice - 新接口 (使用 Pinia stores)', () => {
    it('应该使用新接口成功处理玩家选择', async () => {
      const mockGameStore = {
        gameData: ref(createMockGameData()),
        userActionLog: ref<UserAction[]>([]),
        clearUserActionLog: vi.fn(),
        autoSaveToWorldbook: vi.fn(),
        updateGameDataFromAI: vi.fn(),
      }

      const mockAICommunication = {
        isAIAvailable: vi.fn(() => true),
        sendPlayerChoice: vi.fn().mockResolvedValue({
          success: true,
          yamlContent: 'test yaml',
        }),
      }

      const mockToast = {
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
        info: vi.fn(),
      }

      const { useGameStore } = await import('../../stores/gameStore')
      const { useAICommunication } = await import('../ai/useAICommunication')
      const { useToast } = await import('../ui/useToast')

      // @ts-expect-error - Mock for testing
      vi.mocked(useGameStore).mockReturnValue(mockGameStore)
      // @ts-expect-error - Mock for testing
      vi.mocked(useAICommunication).mockReturnValue(mockAICommunication)
      // @ts-expect-error - Mock for testing
      vi.mocked(useToast).mockReturnValue(mockToast)

      const reviewPageRef = ref({
        getSendCount: vi.fn().mockReturnValue(5),
      })

      const { handleChoice } = usePlayerChoice({ reviewPageRef })

      await handleChoice('Test choice')

      expect(mockAICommunication.sendPlayerChoice).toHaveBeenCalled()
      expect(mockGameStore.updateGameDataFromAI).toHaveBeenCalledWith('test yaml')
      expect(mockGameStore.clearUserActionLog).toHaveBeenCalled()
      expect(mockGameStore.autoSaveToWorldbook).toHaveBeenCalled()
      expect(mockToast.success).toHaveBeenCalledWith('✨ 选择已处理，故事继续发展...')
    })

    it('当 AI 不可用时应该显示警告', async () => {
      const mockGameStore = {
        gameData: ref(createMockGameData()),
        userActionLog: ref<UserAction[]>([]),
        clearUserActionLog: vi.fn(),
        autoSaveToWorldbook: vi.fn(),
        updateGameDataFromAI: vi.fn(),
      }

      const mockAICommunication = {
        isAIAvailable: vi.fn(() => false),
        sendPlayerChoice: vi.fn(),
      }

      const mockToast = {
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
        info: vi.fn(),
      }

      const { useGameStore } = await import('../../stores/gameStore')
      const { useAICommunication } = await import('../ai/useAICommunication')
      const { useToast } = await import('../ui/useToast')

      // @ts-expect-error - Mock for testing
      vi.mocked(useGameStore).mockReturnValue(mockGameStore)
      // @ts-expect-error - Mock for testing
      vi.mocked(useAICommunication).mockReturnValue(mockAICommunication)
      // @ts-expect-error - Mock for testing
      vi.mocked(useToast).mockReturnValue(mockToast)

      const reviewPageRef = ref({
        getSendCount: vi.fn().mockReturnValue(5),
      })

      const { handleChoice } = usePlayerChoice({ reviewPageRef })

      await handleChoice('Test choice')

      expect(mockAICommunication.sendPlayerChoice).not.toHaveBeenCalled()
      expect(mockToast.warning).toHaveBeenCalledWith('AI 接口不可用，已记录您的选择: "Test choice"')
      expect(mockGameStore.autoSaveToWorldbook).toHaveBeenCalled()
    })

    it('当 AI 响应失败时应该显示错误', async () => {
      const mockGameStore = {
        gameData: ref(createMockGameData()),
        userActionLog: ref<UserAction[]>([]),
        clearUserActionLog: vi.fn(),
        autoSaveToWorldbook: vi.fn(),
        updateGameDataFromAI: vi.fn(),
      }

      const mockAICommunication = {
        isAIAvailable: vi.fn(() => true),
        sendPlayerChoice: vi.fn().mockResolvedValue({
          success: false,
          error: 'AI Error',
        }),
      }

      const mockToast = {
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
        info: vi.fn(),
      }

      const { useGameStore } = await import('../../stores/gameStore')
      const { useAICommunication } = await import('../ai/useAICommunication')
      const { useToast } = await import('../ui/useToast')

      // @ts-expect-error - Mock for testing
      vi.mocked(useGameStore).mockReturnValue(mockGameStore)
      // @ts-expect-error - Mock for testing
      vi.mocked(useAICommunication).mockReturnValue(mockAICommunication)
      // @ts-expect-error - Mock for testing
      vi.mocked(useToast).mockReturnValue(mockToast)

      const reviewPageRef = ref({
        getSendCount: vi.fn().mockReturnValue(5),
      })

      const { handleChoice } = usePlayerChoice({ reviewPageRef })

      await handleChoice('Test choice')

      expect(mockToast.error).toHaveBeenCalledWith('AI 响应失败: AI Error')
      expect(mockGameStore.updateGameDataFromAI).not.toHaveBeenCalled()
    })

    it('当更新游戏数据失败时应该显示错误', async () => {
      const mockGameStore = {
        gameData: ref(createMockGameData()),
        userActionLog: ref<UserAction[]>([]),
        clearUserActionLog: vi.fn(),
        autoSaveToWorldbook: vi.fn(),
        updateGameDataFromAI: vi.fn().mockImplementation(() => {
          throw new Error('Update Error')
        }),
      }

      const mockAICommunication = {
        isAIAvailable: vi.fn(() => true),
        sendPlayerChoice: vi.fn().mockResolvedValue({
          success: true,
          yamlContent: 'test yaml',
        }),
      }

      const mockToast = {
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
        info: vi.fn(),
      }

      const { useGameStore } = await import('../../stores/gameStore')
      const { useAICommunication } = await import('../ai/useAICommunication')
      const { useToast } = await import('../ui/useToast')

      // @ts-expect-error - Mock for testing
      vi.mocked(useGameStore).mockReturnValue(mockGameStore)
      // @ts-expect-error - Mock for testing
      vi.mocked(useAICommunication).mockReturnValue(mockAICommunication)
      // @ts-expect-error - Mock for testing
      vi.mocked(useToast).mockReturnValue(mockToast)

      const reviewPageRef = ref({
        getSendCount: vi.fn().mockReturnValue(5),
      })

      const { handleChoice } = usePlayerChoice({ reviewPageRef })

      await handleChoice('Test choice')

      // 当数据处理失败且达到最大重试次数时，显示此错误消息
      expect(mockToast.error).toHaveBeenCalledWith('数据处理失败，请稍后重试或联系管理员')
      expect(mockGameStore.clearUserActionLog).not.toHaveBeenCalled()
    })
  })
})
