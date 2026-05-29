import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, type Ref } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { useGameInitialization, type InitPageExposed } from '../game/useGameInitialization'
import { AIService } from '../../services/aiService'

// Mock dependencies
vi.mock('../../services/aiService', () => ({
  AIService: {
    sendPlayerChoice: vi.fn(),
  },
}))

vi.mock('js-yaml', () => ({
  default: {
    load: vi.fn(),
  },
  load: vi.fn(),
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

describe('useGameInitialization', () => {
  let initPageRef: Ref<InitPageExposed | null>
  let isAIAvailable: ReturnType<typeof vi.fn>
  let saveInitializationData: ReturnType<typeof vi.fn>
  let showSuccessToast: ReturnType<typeof vi.fn>
  let showErrorToast: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // 设置 Pinia
    setActivePinia(createPinia())
    vi.clearAllMocks()

    initPageRef = ref<InitPageExposed | null>({
      setGenerating: vi.fn(),
      setError: vi.fn(),
    }) as Ref<InitPageExposed | null>

    isAIAvailable = vi.fn()
    saveInitializationData = vi.fn()
    showSuccessToast = vi.fn()
    showErrorToast = vi.fn()
  })

  describe('systemInstruction', () => {
    it('应该返回系统初始化指令', () => {
      const { systemInstruction } = useGameInitialization({
        initPageRef,
        isAIAvailable,
        saveInitializationData,
        showSuccessToast,
        showErrorToast,
      })

      expect(systemInstruction).toBeDefined()
      expect(systemInstruction).toContain('系统初始化指令')
      expect(systemInstruction).toContain('输出格式要求')
      expect(systemInstruction).toContain('必需字段要求')
      expect(systemInstruction).toContain('gameData')
    })
  })

  describe('handleInitGenerate', () => {
    it('AI 不可用时应该提前返回', async () => {
      isAIAvailable.mockReturnValue(false)

      const { handleInitGenerate } = useGameInitialization({
        initPageRef,
        isAIAvailable,
        saveInitializationData,
        showSuccessToast,
        showErrorToast,
      })

      await handleInitGenerate('', '')

      expect(initPageRef.value?.setError).toHaveBeenCalledWith(
        'AI 接口不可用，请确保在 SillyTavern 环境中运行'
      )
      expect(AIService.sendPlayerChoice).not.toHaveBeenCalled()
    })

    it('initPageRef 为 null 时应该提前返回', async () => {
      initPageRef.value = null

      const { handleInitGenerate } = useGameInitialization({
        initPageRef,
        isAIAvailable,
        saveInitializationData,
        showSuccessToast,
        showErrorToast,
      })

      await handleInitGenerate('', '')

      expect(AIService.sendPlayerChoice).not.toHaveBeenCalled()
    })

    it('应该成功生成初始化数据', async () => {
      isAIAvailable.mockReturnValue(true)

      const mockGameData = {
        player: { name: 'Test Player' },
        story: { content: 'Test Story' },
      }

      const mockResponse = {
        success: true,
        yamlContent: 'gameData:\n  player:\n    name: Test Player',
        error: undefined,
      }

      vi.mocked(AIService.sendPlayerChoice).mockResolvedValue(mockResponse)

      const yaml = await import('js-yaml')
      vi.mocked(yaml.load).mockReturnValue({ gameData: mockGameData })

      const { handleInitGenerate } = useGameInitialization({
        initPageRef,
        isAIAvailable,
        saveInitializationData,
        showSuccessToast,
        showErrorToast,
      })

      await handleInitGenerate('', '')

      expect(initPageRef.value?.setGenerating).toHaveBeenCalledWith(true)
      expect(initPageRef.value?.setGenerating).toHaveBeenCalledWith(false)
      expect(saveInitializationData).toHaveBeenCalledWith(mockGameData)
      expect(showSuccessToast).toHaveBeenCalledWith('✨ 初始化成功！欢迎来到伊甸园')
    })

    it('应该使用自定义系统指令', async () => {
      isAIAvailable.mockReturnValue(true)

      const customInstruction = 'Custom system instruction'
      const mockResponse = {
        success: true,
        yamlContent: 'gameData:\n  player:\n    name: Test',
        error: undefined,
      }

      vi.mocked(AIService.sendPlayerChoice).mockResolvedValue(mockResponse)

      const yaml = await import('js-yaml')
      vi.mocked(yaml.load).mockReturnValue({ gameData: {} })

      const { handleInitGenerate } = useGameInitialization({
        initPageRef,
        isAIAvailable,
        saveInitializationData,
        showSuccessToast,
        showErrorToast,
      })

      await handleInitGenerate(customInstruction, '')

      expect(AIService.sendPlayerChoice).toHaveBeenCalledWith({}, customInstruction, [])
    })

    it('应该附加用户输入', async () => {
      isAIAvailable.mockReturnValue(true)

      const userInput = 'User custom settings'
      const mockResponse = {
        success: true,
        yamlContent: 'gameData:\n  player:\n    name: Test',
        error: undefined,
      }

      vi.mocked(AIService.sendPlayerChoice).mockResolvedValue(mockResponse)

      const yaml = await import('js-yaml')
      vi.mocked(yaml.load).mockReturnValue({ gameData: {} })

      const { handleInitGenerate } = useGameInitialization({
        initPageRef,
        isAIAvailable,
        saveInitializationData,
        showSuccessToast,
        showErrorToast,
      })

      await handleInitGenerate('', userInput)

      const callArgs = vi.mocked(AIService.sendPlayerChoice).mock.calls[0]
      expect(callArgs[1]).toContain('用户附加设定信息')
      expect(callArgs[1]).toContain(userInput)
    })

    it('AI 响应失败时应该显示错误', async () => {
      isAIAvailable.mockReturnValue(true)

      const mockResponse = {
        success: false,
        yamlContent: null,
        error: 'AI generation failed',
      }

      vi.mocked(AIService.sendPlayerChoice).mockResolvedValue(mockResponse)

      const { handleInitGenerate } = useGameInitialization({
        initPageRef,
        isAIAvailable,
        saveInitializationData,
        showSuccessToast,
        showErrorToast,
      })

      await handleInitGenerate('', '')

      expect(initPageRef.value?.setError).toHaveBeenCalledWith(
        expect.stringContaining('AI generation failed')
      )
      expect(showErrorToast).toHaveBeenCalled()
    })

    it('缺少 YAML 内容时应该显示错误', async () => {
      isAIAvailable.mockReturnValue(true)

      const mockResponse = {
        success: true,
        yamlContent: null,
        error: undefined,
      }

      vi.mocked(AIService.sendPlayerChoice).mockResolvedValue(mockResponse)

      const { handleInitGenerate } = useGameInitialization({
        initPageRef,
        isAIAvailable,
        saveInitializationData,
        showSuccessToast,
        showErrorToast,
      })

      await handleInitGenerate('', '')

      expect(initPageRef.value?.setError).toHaveBeenCalledWith(
        expect.stringContaining('没有 YAML 数据')
      )
    })

    it('YAML 格式错误时应该显示错误', async () => {
      isAIAvailable.mockReturnValue(true)

      const mockResponse = {
        success: true,
        yamlContent: 'gameData:\n  player:\n    name: Test',
        error: undefined,
      }

      vi.mocked(AIService.sendPlayerChoice).mockResolvedValue(mockResponse)

      const yaml = await import('js-yaml')
      vi.mocked(yaml.load).mockReturnValue({ invalidField: {} })

      const { handleInitGenerate } = useGameInitialization({
        initPageRef,
        isAIAvailable,
        saveInitializationData,
        showSuccessToast,
        showErrorToast,
      })

      await handleInitGenerate('', '')

      expect(initPageRef.value?.setError).toHaveBeenCalledWith(
        expect.stringContaining('缺少 gameData 字段')
      )
    })

    it('保存数据失败时应该显示错误', async () => {
      isAIAvailable.mockReturnValue(true)

      const mockResponse = {
        success: true,
        yamlContent: 'gameData:\n  player:\n    name: Test',
        error: undefined,
      }

      vi.mocked(AIService.sendPlayerChoice).mockResolvedValue(mockResponse)

      const yaml = await import('js-yaml')
      vi.mocked(yaml.load).mockReturnValue({ gameData: {} })

      saveInitializationData.mockRejectedValue(new Error('Save failed'))

      const { handleInitGenerate } = useGameInitialization({
        initPageRef,
        isAIAvailable,
        saveInitializationData,
        showSuccessToast,
        showErrorToast,
      })

      await handleInitGenerate('', '')

      expect(showErrorToast).toHaveBeenCalledWith(expect.stringContaining('Save failed'))
    })
  })
})
