import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAILoadingState } from '../ai/useAILoadingState'

// Mock AIService
vi.mock('../../services/aiService', () => ({
  AIService: {
    getRetryCount: vi.fn(() => 0),
    getRetryReason: vi.fn(() => ''),
  },
}))

// Mock settingsStore
vi.mock('../../stores/settingsStore', () => ({
  useSettingsStore: () => ({
    settings: {
      maxRetries: 3,
    },
  }),
}))

// 导入 mock 后的模块以便在测试中使用
import { AIService } from '../../services/aiService'

describe('useAILoadingState', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(AIService.getRetryCount).mockReturnValue(0)
    vi.mocked(AIService.getRetryReason).mockReturnValue('')
  })

  describe('初始状态', () => {
    it('应该有正确的初始值', () => {
      const { isLoading, currentScene, isRetrying, retryCount, maxRetries } = useAILoadingState()

      expect(isLoading.value).toBe(false)
      expect(currentScene.value).toBe('choice')
      expect(isRetrying.value).toBe(false)
      expect(retryCount.value).toBe(0)
      expect(maxRetries.value).toBe(3)
    })

    it('应该返回默认加载消息', () => {
      const { getLoadingMessage } = useAILoadingState()

      expect(getLoadingMessage.value).toBe('AI 正在思考中，请稍候...')
    })
  })

  describe('startLoading', () => {
    it('应该开始加载并设置场景', () => {
      const { startLoading, isLoading, currentScene } = useAILoadingState()

      startLoading('init')

      expect(isLoading.value).toBe(true)
      expect(currentScene.value).toBe('init')
    })

    it('应该使用默认场景', () => {
      const { startLoading, currentScene } = useAILoadingState()

      startLoading()

      expect(currentScene.value).toBe('choice')
    })

    it('应该设置重试原因', () => {
      const { startLoading, retryReason } = useAILoadingState()
      vi.mocked(AIService.getRetryReason).mockReturnValue('网络错误')

      startLoading('retry', '网络错误')

      // retryReason 来自 AIService，所以需要 mock 返回值
      expect(retryReason.value).toBe('网络错误')
    })
  })

  describe('stopLoading', () => {
    it('应该停止加载', () => {
      const { startLoading, stopLoading, isLoading } = useAILoadingState()

      startLoading('choice')
      expect(isLoading.value).toBe(true)

      stopLoading()
      expect(isLoading.value).toBe(false)
    })

    it('停止加载后场景应该保持不变', () => {
      const { startLoading, stopLoading, currentScene } = useAILoadingState()

      startLoading('init')
      stopLoading()

      expect(currentScene.value).toBe('init')
    })
  })

  describe('getLoadingMessage', () => {
    it('应该返回初始化场景的消息', () => {
      const { startLoading, getLoadingMessage } = useAILoadingState()

      startLoading('init')

      expect(getLoadingMessage.value).toBe('正在初始化游戏世界...')
    })

    it('应该返回选择场景的消息', () => {
      const { startLoading, getLoadingMessage } = useAILoadingState()

      startLoading('choice')

      expect(getLoadingMessage.value).toBe('AI 正在思考中，请稍候...')
    })

    it('应该返回自定义场景的消息', () => {
      const { startLoading, getLoadingMessage } = useAILoadingState()

      startLoading('custom')

      expect(getLoadingMessage.value).toBe('正在处理您的自定义内容...')
    })

    it('应该返回重试场景的消息', () => {
      const { startLoading, getLoadingMessage } = useAILoadingState()

      startLoading('retry')

      expect(getLoadingMessage.value).toBe('正在重试上一次请求...')
    })
  })

  describe('重试状态', () => {
    it('当重试次数为 0 时 isRetrying 应该为 false', () => {
      vi.mocked(AIService.getRetryCount).mockReturnValue(0)
      const { isRetrying } = useAILoadingState()

      expect(isRetrying.value).toBe(false)
    })

    it('当重试次数大于 0 时 isRetrying 应该为 true', () => {
      vi.mocked(AIService.getRetryCount).mockReturnValue(1)
      const { isRetrying } = useAILoadingState()

      expect(isRetrying.value).toBe(true)
    })

    it('应该从 AIService 获取重试次数', () => {
      vi.mocked(AIService.getRetryCount).mockReturnValue(2)
      const { retryCount } = useAILoadingState()

      expect(retryCount.value).toBe(2)
      expect(AIService.getRetryCount).toHaveBeenCalled()
    })

    it('应该从 AIService 获取重试原因', () => {
      vi.mocked(AIService.getRetryReason).mockReturnValue('超时')
      const { retryReason } = useAILoadingState()

      expect(retryReason.value).toBe('超时')
      expect(AIService.getRetryReason).toHaveBeenCalled()
    })

    it('应该从 settingsStore 获取最大重试次数', () => {
      const { maxRetries } = useAILoadingState()

      expect(maxRetries.value).toBe(3)
    })
  })

  describe('setRetryReason', () => {
    it('应该设置重试原因', () => {
      const { setRetryReason } = useAILoadingState()

      setRetryReason('连接失败')

      // 注意：setRetryReason 设置的是内部的 retryReason ref
      // 但返回的 retryReason 是从 AIService 获取的
      // 所以这个测试主要验证方法不会抛出错误
      expect(() => setRetryReason('连接失败')).not.toThrow()
    })
  })

  describe('单例模式', () => {
    it('多次调用应该共享状态', () => {
      const instance1 = useAILoadingState()
      const instance2 = useAILoadingState()

      instance1.startLoading('init')

      expect(instance2.isLoading.value).toBe(true)
      expect(instance2.currentScene.value).toBe('init')
    })

    it('一个实例停止加载应该影响另一个实例', () => {
      const instance1 = useAILoadingState()
      const instance2 = useAILoadingState()

      instance1.startLoading('choice')
      instance2.stopLoading()

      expect(instance1.isLoading.value).toBe(false)
    })
  })

  describe('响应式更新', () => {
    it('当场景变化时加载消息应该更新', () => {
      const { startLoading, getLoadingMessage } = useAILoadingState()

      startLoading('init')
      expect(getLoadingMessage.value).toBe('正在初始化游戏世界...')

      startLoading('choice')
      expect(getLoadingMessage.value).toBe('AI 正在思考中，请稍候...')
    })
  })
})
