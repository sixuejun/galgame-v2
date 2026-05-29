/**
 * @file TTSSettings.test.ts
 * @description TTSSettings 组件单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import TTSSettings from '../TTSSettings.vue'
import { useSettingsStore } from '@/stores/settingsStore'
import type { MiniMaxVoiceModel, MiniMaxOutputFormat } from '@/types'

describe('TTSSettings', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('渲染测试', () => {
    it('应该渲染 TTS 设置区域', () => {
      const wrapper = mount(TTSSettings)

      expect(wrapper.find('.settings-subsection').exists()).toBe(true)
      expect(wrapper.find('.subsection-title').text()).toContain('MiniMax 语音合成')
    })

    it('应该渲染 API Key 输入框', () => {
      const wrapper = mount(TTSSettings)

      const apiKeyInput = wrapper.find('#minimax-api-key')
      expect(apiKeyInput.exists()).toBe(true)
      expect(apiKeyInput.attributes('type')).toBe('password')
      expect(apiKeyInput.attributes('placeholder')).toBe('sk-xxxx')
    })

    it('应该渲染模型选择器', () => {
      const wrapper = mount(TTSSettings)

      const modelSelect = wrapper.find('#minimax-model')
      expect(modelSelect.exists()).toBe(true)
    })

    it('应该渲染输出格式选择器', () => {
      const wrapper = mount(TTSSettings)

      const formatSelect = wrapper.find('#minimax-output-format')
      expect(formatSelect.exists()).toBe(true)
    })

    it('应该渲染 Stream 开关', () => {
      const wrapper = mount(TTSSettings)

      const streamToggle = wrapper.find('#minimax-stream')
      expect(streamToggle.exists()).toBe(true)
      expect(streamToggle.attributes('type')).toBe('checkbox')
    })

    it('应该渲染请求 ID 输入框', () => {
      const wrapper = mount(TTSSettings)

      const requestIdInput = wrapper.find('#minimax-request-id')
      expect(requestIdInput.exists()).toBe(true)
      expect(requestIdInput.attributes('type')).toBe('text')
    })

    it('应该渲染语音 ID 输入框', () => {
      const wrapper = mount(TTSSettings)

      const voiceIdInput = wrapper.find('#minimax-voice-id')
      expect(voiceIdInput.exists()).toBe(true)
      expect(voiceIdInput.attributes('type')).toBe('text')
    })

    it('应该渲染语音速度输入框', () => {
      const wrapper = mount(TTSSettings)

      const speedInput = wrapper.find('#minimax-speed')
      expect(speedInput.exists()).toBe(true)
    })

    it('应该渲染缓存上限输入框', () => {
      const wrapper = mount(TTSSettings)

      const cacheLimitInput = wrapper.find('#tts-cache-limit')
      expect(cacheLimitInput.exists()).toBe(true)
    })
  })

  describe('默认值测试', () => {
    it('应该显示默认的 API Key（空字符串）', () => {
      const wrapper = mount(TTSSettings)

      const apiKeyInput = wrapper.find<HTMLInputElement>('#minimax-api-key')
      expect(apiKeyInput.element.value).toBe('')
    })

    it('应该显示默认的模型（speech-2.6-hd）', () => {
      mount(TTSSettings)
      const store = useSettingsStore()

      expect(store.settings.minimaxModel).toBe('speech-2.6-hd')
    })

    it('应该显示默认的输出格式（hex）', () => {
      mount(TTSSettings)
      const store = useSettingsStore()

      expect(store.settings.minimaxOutputFormat).toBe('hex')
    })

    it('应该显示默认的 Stream 状态（false）', () => {
      const wrapper = mount(TTSSettings)

      const streamToggle = wrapper.find<HTMLInputElement>('#minimax-stream')
      expect(streamToggle.element.checked).toBe(false)
    })

    it('应该显示默认的语音速度（1.0）', () => {
      mount(TTSSettings)
      const store = useSettingsStore()

      expect(store.settings.minimaxSpeed).toBe(1.0)
    })

    it('应该显示默认的缓存上限（100）', () => {
      mount(TTSSettings)
      const store = useSettingsStore()

      expect(store.settings.ttsCacheLimit).toBe(100)
    })
  })

  describe('用户交互测试', () => {
    it('应该更新 API Key', async () => {
      const wrapper = mount(TTSSettings)
      const store = useSettingsStore()

      const apiKeyInput = wrapper.find<HTMLInputElement>('#minimax-api-key')
      await apiKeyInput.setValue('sk-test-key-123')

      expect(store.settings.minimaxApiKey).toBe('sk-test-key-123')
    })

    it('应该更新模型选择', async () => {
      const wrapper = mount(TTSSettings)
      const store = useSettingsStore()

      // 调用 handleModelChange 方法
      await wrapper.vm.handleModelChange('speech-01-hd' as MiniMaxVoiceModel)

      expect(store.settings.minimaxModel).toBe('speech-01-hd')
    })

    it('应该更新输出格式', async () => {
      const wrapper = mount(TTSSettings)
      const store = useSettingsStore()

      // 调用 handleOutputFormatChange 方法
      await wrapper.vm.handleOutputFormatChange('url' as MiniMaxOutputFormat)

      expect(store.settings.minimaxOutputFormat).toBe('url')
    })

    it('应该切换 Stream 开关', async () => {
      const wrapper = mount(TTSSettings)
      const store = useSettingsStore()

      const streamToggle = wrapper.find<HTMLInputElement>('#minimax-stream')
      await streamToggle.setValue(true)

      expect(store.settings.minimaxStream).toBe(true)

      await streamToggle.setValue(false)
      expect(store.settings.minimaxStream).toBe(false)
    })

    it('应该更新请求 ID', async () => {
      const wrapper = mount(TTSSettings)
      const store = useSettingsStore()

      const requestIdInput = wrapper.find<HTMLInputElement>('#minimax-request-id')
      await requestIdInput.setValue('test-request-id')

      expect(store.settings.minimaxRequestId).toBe('test-request-id')
    })

    it('应该更新语音 ID', async () => {
      const wrapper = mount(TTSSettings)
      const store = useSettingsStore()

      const voiceIdInput = wrapper.find<HTMLInputElement>('#minimax-voice-id')
      await voiceIdInput.setValue('test-voice-id')

      expect(store.settings.minimaxVoiceId).toBe('test-voice-id')
    })

    it('应该更新语音速度', async () => {
      const wrapper = mount(TTSSettings)
      const store = useSettingsStore()

      // 调用 handleSpeedChange 方法
      await wrapper.vm.handleSpeedChange(1.5)

      expect(store.settings.minimaxSpeed).toBe(1.5)
    })

    it('应该更新缓存上限', async () => {
      const wrapper = mount(TTSSettings)
      const store = useSettingsStore()

      // 调用 handleCacheLimitChange 方法
      await wrapper.vm.handleCacheLimitChange(200)

      expect(store.settings.ttsCacheLimit).toBe(200)
    })
  })

  describe('数据验证测试', () => {
    it('应该处理无效的语音速度值', async () => {
      const wrapper = mount(TTSSettings)
      const store = useSettingsStore()

      // 设置一个 NaN 值
      await wrapper.vm.handleSpeedChange(NaN)

      // 应该回退到默认值 1.0
      expect(store.settings.minimaxSpeed).toBe(1.0)
    })

    it('应该处理无效的缓存上限值', async () => {
      const wrapper = mount(TTSSettings)
      const store = useSettingsStore()

      // 设置一个 NaN 值
      await wrapper.vm.handleCacheLimitChange(NaN)

      // 应该回退到默认值 100
      expect(store.settings.ttsCacheLimit).toBe(100)
    })
  })

  describe('提示信息测试', () => {
    it('应该显示正确的模型提示', () => {
      const wrapper = mount(TTSSettings)

      const hint = wrapper.vm.getModelHint('speech-2.6-hd')
      expect(hint).toBe('高保真，延迟略高')
    })

    it('应该显示正确的输出格式提示', () => {
      const wrapper = mount(TTSSettings)

      const hint = wrapper.vm.getOutputHint('hex')
      expect(hint).toBe('返回 hex 字符串，便于立即生成 Blob 播放')
    })

    it('应该处理未知模型的提示', () => {
      const wrapper = mount(TTSSettings)

      const hint = wrapper.vm.getModelHint('unknown-model' as MiniMaxVoiceModel)
      expect(hint).toBe('')
    })

    it('应该处理未知输出格式的提示', () => {
      const wrapper = mount(TTSSettings)

      const hint = wrapper.vm.getOutputHint('unknown-format' as MiniMaxOutputFormat)
      expect(hint).toBe('')
    })
  })

  describe('设置持久化测试', () => {
    it('应该从 localStorage 加载已保存的设置', () => {
      const savedSettings = {
        minimaxApiKey: 'sk-saved-key',
        minimaxModel: 'speech-01-turbo' as MiniMaxVoiceModel,
        minimaxOutputFormat: 'url' as MiniMaxOutputFormat,
        minimaxStream: true,
        minimaxRequestId: 'saved-request-id',
        minimaxVoiceId: 'saved-voice-id',
        minimaxSpeed: 1.8,
        ttsCacheLimit: 150,
      }

      localStorage.setItem(
        'eden-system-settings',
        JSON.stringify({
          ...savedSettings,
          maxRetries: 3,
          maxDataRetries: 3,
          retryDelay: 1000,
          debugMode: false,
          autoSave: true,
          imageGenerationService: 'pollinations',
          stChatu8ImageTimeout: 30000,
          theme: 'default',
          showHomeHeader: true,
          showStoryMetadata: true,
          imageCacheLimit: 100,
          enableNavbarAutoHide: false,
        })
      )

      const store = useSettingsStore()
      store.loadSettings()

      const wrapper = mount(TTSSettings)

      expect(store.settings.minimaxApiKey).toBe('sk-saved-key')
      expect(store.settings.minimaxModel).toBe('speech-01-turbo')
      expect(store.settings.minimaxOutputFormat).toBe('url')
      expect(store.settings.minimaxStream).toBe(true)
      expect(store.settings.minimaxRequestId).toBe('saved-request-id')
      expect(store.settings.minimaxVoiceId).toBe('saved-voice-id')
      expect(store.settings.minimaxSpeed).toBe(1.8)
      expect(store.settings.ttsCacheLimit).toBe(150)

      wrapper.unmount()
    })

    it('应该在更新设置时保存到 localStorage', async () => {
      const wrapper = mount(TTSSettings)

      await wrapper.vm.handleModelChange('speech-02-hd' as MiniMaxVoiceModel)

      const saved = localStorage.getItem('eden-system-settings')
      expect(saved).toBeTruthy()
      const parsed = JSON.parse(saved!)
      expect(parsed.minimaxModel).toBe('speech-02-hd')
    })
  })
})
