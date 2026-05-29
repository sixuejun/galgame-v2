import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '../settingsStore'
import type { AppSettings } from '../../types'

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('useSettingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('初始状态', () => {
    it('应该初始化为默认设置', () => {
      const store = useSettingsStore()

      expect(store.settings).toEqual({
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
        minimaxApiKey: '',
        minimaxModel: 'speech-2.6-hd',
        minimaxOutputFormat: 'hex',
        minimaxStream: false,
        minimaxRequestId: '',
        minimaxVoiceId: '',
        minimaxSpeed: 1.0,
        ttsCacheLimit: 100,
      })
    })
  })

  describe('loadSettings', () => {
    it('应该从 localStorage 加载设置', () => {
      const savedSettings: AppSettings = {
        maxRetries: 5,
        maxDataRetries: 5,
        retryDelay: 2000,
        debugMode: true,
        autoSave: false,
        imageGenerationService: 'pollinations',
        stChatu8ImageTimeout: 30000,
        theme: 'default',
        showHomeHeader: true,
        showStoryMetadata: true,
        imageCacheLimit: 100,
        enableNavbarAutoHide: false,
        minimaxApiKey: '',
        minimaxModel: 'speech-2.6-hd',
        minimaxOutputFormat: 'hex',
        minimaxStream: false,
        minimaxRequestId: '',
        minimaxVoiceId: '',
        minimaxSpeed: 1.0,
        ttsCacheLimit: 100,
      }
      localStorage.setItem('eden-system-settings', JSON.stringify(savedSettings))

      const store = useSettingsStore()
      store.loadSettings()

      expect(store.settings).toEqual(savedSettings)
    })

    it('应该合并默认设置和保存的设置', () => {
      const partialSettings = {
        maxRetries: 5,
        debugMode: true,
      }
      localStorage.setItem('eden-system-settings', JSON.stringify(partialSettings))

      const store = useSettingsStore()
      store.loadSettings()

      expect(store.settings).toEqual({
        maxRetries: 5,
        maxDataRetries: 3, // 默认值
        retryDelay: 1000, // 默认值
        debugMode: true,
        autoSave: true, // 默认值
        imageGenerationService: 'pollinations', // 默认值
        stChatu8ImageTimeout: 30000, // 默认值
        theme: 'default', // 默认值
        showHomeHeader: true, // 默认值
        showStoryMetadata: true, // 默认值
        imageCacheLimit: 100, // 默认值
        enableNavbarAutoHide: false, // 默认值
        minimaxApiKey: '', // 默认值
        minimaxModel: 'speech-2.6-hd', // 默认值
        minimaxOutputFormat: 'hex', // 默认值
        minimaxStream: false, // 默认值
        minimaxRequestId: '', // 默认值
        minimaxVoiceId: '', // 默认值
        minimaxSpeed: 1.0, // 默认值
        ttsCacheLimit: 100, // 默认值
      })
    })

    it('当 localStorage 为空时应该使用默认设置', () => {
      const store = useSettingsStore()
      store.loadSettings()

      expect(store.settings).toEqual({
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
        minimaxApiKey: '',
        minimaxModel: 'speech-2.6-hd',
        minimaxOutputFormat: 'hex',
        minimaxStream: false,
        minimaxRequestId: '',
        minimaxVoiceId: '',
        minimaxSpeed: 1.0,
        ttsCacheLimit: 100,
      })
    })

    it('当 localStorage 数据无效时应该使用默认设置', () => {
      localStorage.setItem('eden-system-settings', 'invalid json')

      const store = useSettingsStore()
      store.loadSettings()

      expect(store.settings).toEqual({
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
        minimaxApiKey: '',
        minimaxModel: 'speech-2.6-hd',
        minimaxOutputFormat: 'hex',
        minimaxStream: false,
        minimaxRequestId: '',
        minimaxVoiceId: '',
        minimaxSpeed: 1.0,
        ttsCacheLimit: 100,
      })
    })
  })

  describe('saveSettings', () => {
    it('应该保存设置到 localStorage', () => {
      const store = useSettingsStore()
      store.settings = {
        maxRetries: 5,
        maxDataRetries: 5,
        retryDelay: 2000,
        debugMode: true,
        autoSave: false,
        imageGenerationService: 'pollinations',
        stChatu8ImageTimeout: 30000,
        theme: 'high-contrast',
        showHomeHeader: false,
        showStoryMetadata: false,
        imageCacheLimit: 100,
        enableNavbarAutoHide: false,
        minimaxApiKey: '',
        minimaxModel: 'speech-2.6-hd',
        minimaxOutputFormat: 'hex',
        minimaxStream: false,
        minimaxRequestId: '',
        minimaxVoiceId: '',
        minimaxSpeed: 1.0,
        ttsCacheLimit: 100,
      }

      store.saveSettings()

      const saved = localStorage.getItem('eden-system-settings')
      expect(saved).toBeTruthy()
      expect(JSON.parse(saved!)).toEqual(store.settings)
    })

    it('应该处理保存失败的情况', () => {
      const store = useSettingsStore()

      // Mock localStorage.setItem 抛出错误
      const originalSetItem = localStorage.setItem
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded')
      })

      // 不应该抛出错误
      expect(() => store.saveSettings()).not.toThrow()

      // 恢复
      localStorage.setItem = originalSetItem
    })
  })

  describe('resetSettings', () => {
    it('应该重置设置为默认值', () => {
      const store = useSettingsStore()

      // 修改设置
      store.settings = {
        maxRetries: 10,
        maxDataRetries: 10,
        retryDelay: 5000,
        debugMode: true,
        autoSave: false,
        imageGenerationService: 'st-chatu8',
        stChatu8ImageTimeout: 60000,
        theme: 'cool',
        showHomeHeader: false,
        showStoryMetadata: false,
        imageCacheLimit: 200,
        enableNavbarAutoHide: true,
        minimaxApiKey: 'test-key',
        minimaxModel: 'speech-01-hd',
        minimaxOutputFormat: 'url',
        minimaxStream: true,
        minimaxRequestId: 'test-id',
        minimaxVoiceId: 'test-voice',
        minimaxSpeed: 2.0,
        ttsCacheLimit: 200,
      }

      // 重置
      store.resetSettings()

      // 验证设置被重置
      expect(store.settings).toEqual({
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
        minimaxApiKey: '',
        minimaxModel: 'speech-2.6-hd',
        minimaxOutputFormat: 'hex',
        minimaxStream: false,
        minimaxRequestId: '',
        minimaxVoiceId: '',
        minimaxSpeed: 1.0,
        ttsCacheLimit: 100,
      })
    })

    it('应该保存重置后的设置到 localStorage', () => {
      const store = useSettingsStore()

      // 修改设置
      store.settings = {
        maxRetries: 10,
        maxDataRetries: 10,
        retryDelay: 5000,
        debugMode: true,
        autoSave: false,
        imageGenerationService: 'st-chatu8',
        stChatu8ImageTimeout: 60000,
        theme: 'warm',
        showHomeHeader: false,
        showStoryMetadata: false,
        imageCacheLimit: 200,
        enableNavbarAutoHide: true,
        minimaxApiKey: 'test-key',
        minimaxModel: 'speech-01-hd',
        minimaxOutputFormat: 'url',
        minimaxStream: true,
        minimaxRequestId: 'test-id',
        minimaxVoiceId: 'test-voice',
        minimaxSpeed: 2.0,
        ttsCacheLimit: 200,
      }

      // 重置
      store.resetSettings()

      // 验证 localStorage 中的设置也被重置
      const saved = localStorage.getItem('eden-system-settings')
      expect(saved).toBeTruthy()
      expect(JSON.parse(saved!)).toEqual({
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
        minimaxApiKey: '',
        minimaxModel: 'speech-2.6-hd',
        minimaxOutputFormat: 'hex',
        minimaxStream: false,
        minimaxRequestId: '',
        minimaxVoiceId: '',
        minimaxSpeed: 1.0,
        ttsCacheLimit: 100,
      })
    })
  })

  describe('updateSetting', () => {
    it('应该更新单个设置项', () => {
      const store = useSettingsStore()

      store.updateSetting('maxRetries', 5)

      expect(store.settings.maxRetries).toBe(5)
    })

    it('应该保存更新后的设置到 localStorage', () => {
      const store = useSettingsStore()

      store.updateSetting('debugMode', true)

      const saved = localStorage.getItem('eden-system-settings')
      expect(saved).toBeTruthy()
      const parsed = JSON.parse(saved!)
      expect(parsed.debugMode).toBe(true)
    })

    it('应该支持更新不同类型的设置项', () => {
      const store = useSettingsStore()

      store.updateSetting('maxRetries', 10)
      store.updateSetting('retryDelay', 3000)
      store.updateSetting('debugMode', true)
      store.updateSetting('autoSave', false)

      expect(store.settings.maxRetries).toBe(10)
      expect(store.settings.retryDelay).toBe(3000)
      expect(store.settings.debugMode).toBe(true)
      expect(store.settings.autoSave).toBe(false)
    })
  })

  describe('updateSettings', () => {
    it('应该批量更新设置', () => {
      const store = useSettingsStore()

      store.updateSettings({
        maxRetries: 5,
        debugMode: true,
      })

      expect(store.settings.maxRetries).toBe(5)
      expect(store.settings.debugMode).toBe(true)
      // 其他设置保持不变
      expect(store.settings.maxDataRetries).toBe(3)
      expect(store.settings.retryDelay).toBe(1000)
      expect(store.settings.autoSave).toBe(true)
    })

    it('应该保存批量更新后的设置到 localStorage', () => {
      const store = useSettingsStore()

      store.updateSettings({
        maxRetries: 5,
        debugMode: true,
      })

      const saved = localStorage.getItem('eden-system-settings')
      expect(saved).toBeTruthy()
      const parsed = JSON.parse(saved!)
      expect(parsed.maxRetries).toBe(5)
      expect(parsed.debugMode).toBe(true)
    })
  })

  describe('getDefaultSettings', () => {
    it('应该返回默认设置', () => {
      const store = useSettingsStore()

      const defaultSettings = store.getDefaultSettings()

      expect(defaultSettings).toEqual({
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
        minimaxApiKey: '',
        minimaxModel: 'speech-2.6-hd',
        minimaxOutputFormat: 'hex',
        minimaxStream: false,
        minimaxRequestId: '',
        minimaxVoiceId: '',
        minimaxSpeed: 1.0,
        ttsCacheLimit: 100,
      })
    })

    it('应该返回新的对象而不是引用', () => {
      const store = useSettingsStore()

      const defaultSettings1 = store.getDefaultSettings()
      const defaultSettings2 = store.getDefaultSettings()

      expect(defaultSettings1).not.toBe(defaultSettings2)
      expect(defaultSettings1).toEqual(defaultSettings2)
    })
  })
})
