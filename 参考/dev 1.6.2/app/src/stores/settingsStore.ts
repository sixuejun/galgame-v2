import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { AppSettings } from '../types'
import { logger } from '../utils/logger'

/**
 * 默认设置
 */
const DEFAULT_SETTINGS: AppSettings = {
  maxRetries: 3,
  maxDataRetries: 3,
  retryDelay: 1000,
  debugMode: false,
  autoSave: true,
  imageGenerationService: 'pollinations', // 默认使用 pollinations.ai
  stChatu8ImageTimeout: 30000, // ST-ChatU8 图片生成超时时间（默认 30 秒）
  theme: 'default', // 默认主题
  showHomeHeader: true, // 默认显示主页标题
  showStoryMetadata: true, // 默认显示故事元数据（时间、地点、天气）
  imageCacheLimit: 100, // 图片缓存上限（默认 100 条）
  enableNavbarAutoHide: false, // 默认关闭导航栏自动隐藏
  minimaxApiKey: '', // MiniMax API Key
  minimaxModel: 'speech-2.6-hd', // MiniMax 默认模型
  minimaxOutputFormat: 'hex', // MiniMax 默认输出格式
  minimaxStream: false, // MiniMax 默认不启用流式输出
  minimaxRequestId: '', // MiniMax 自定义请求 ID
  minimaxVoiceId: '', // MiniMax 语音 ID
  minimaxSpeed: 1.0, // MiniMax 语音速度（默认 1.0）
  ttsCacheLimit: 100, // TTS 音频缓存上限（默认 100 条）
}

/**
 * 设置存储键
 */
const SETTINGS_STORAGE_KEY = 'eden-system-settings'

/**
 * 设置 Store
 * 管理应用的全局设置
 */
export const useSettingsStore = defineStore('settings', () => {
  // ========== 状态 ==========
  const settings = ref<AppSettings>({ ...DEFAULT_SETTINGS })

  // ========== Actions ==========

  /**
   * 加载设置
   */
  function loadSettings(): void {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings) as Partial<AppSettings>
        // 合并默认设置和保存的设置，确保新增的设置项有默认值
        settings.value = { ...DEFAULT_SETTINGS, ...parsed }
        logger.info('✅ 设置已加载', settings.value)
      } else {
        logger.info('📝 使用默认设置')
      }
    } catch (error) {
      logger.error('❌ 加载设置失败，使用默认设置:', error)
      settings.value = { ...DEFAULT_SETTINGS }
    }
  }

  /**
   * 保存设置
   */
  function saveSettings(): void {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings.value))
      logger.info('✅ 设置已保存', settings.value)
    } catch (error) {
      logger.error('❌ 保存设置失败:', error)
    }
  }

  /**
   * 重置设置为默认值
   */
  function resetSettings(): void {
    settings.value = { ...DEFAULT_SETTINGS }
    saveSettings()
    logger.info('✅ 设置已重置为默认值')
  }

  /**
   * 更新单个设置项
   */
  function updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    settings.value[key] = value
    saveSettings()
  }

  /**
   * 批量更新设置
   */
  function updateSettings(newSettings: Partial<AppSettings>): void {
    settings.value = { ...settings.value, ...newSettings }
    saveSettings()
  }

  /**
   * 获取默认设置
   */
  function getDefaultSettings(): AppSettings {
    return { ...DEFAULT_SETTINGS }
  }

  // ========== 监听设置变化 ==========
  watch(
    settings,
    () => {
      // 自动保存设置
      saveSettings()
    },
    { deep: true }
  )

  return {
    // 状态
    settings,

    // 方法
    loadSettings,
    saveSettings,
    resetSettings,
    updateSetting,
    updateSettings,
    getDefaultSettings,
  }
})
