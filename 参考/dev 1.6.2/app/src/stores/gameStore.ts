import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { GameDataService } from '../services/gameDataService'
import { logger } from '../utils/logger'
import { useSettingsStore } from './settingsStore'
import type {
  GameData,
  Config,
  Story,
  Choice,
  Character,
  ShopData,
  StorageData,
  Achievement,
  Summary,
  UserAction,
} from '../types'

/**
 * 游戏数据 Store
 * 管理游戏的核心数据状态
 */
export const useGameStore = defineStore('game', () => {
  // ========== 状态 ==========
  const gameData = ref<GameData>({})
  const userActionLog = ref<UserAction[]>([])
  const isLoading = ref(true)
  const loadError = ref<string | null>(null)
  const needsInitialization = ref(false)
  // 最后一次存档的时间戳，用于触发读档页面刷新
  const lastSaveTimestamp = ref<number>(0)

  // ========== 计算属性 ==========
  const config = computed(() => gameData.value.config as Config | undefined)
  const story = computed(() => gameData.value.story as Story | undefined)
  const choices = computed(() => gameData.value.choices as Choice[] | undefined)
  const characters = computed(
    () => gameData.value.characters as Record<string, Character> | undefined
  )
  const shop = computed(() => gameData.value.shop as ShopData | undefined)
  const storage = computed(() => gameData.value.storage as StorageData | undefined)
  const achievements = computed(
    () => gameData.value.achievements as Record<string, Achievement> | undefined
  )
  const summaries = computed(() => gameData.value.summaries as Summary[] | undefined)

  // ========== Actions ==========

  /**
   * 检查世界书状态
   */
  async function checkWorldbookStatus() {
    return await GameDataService.checkWorldbookStatus()
  }

  /**
   * 加载游戏数据
   */
  async function loadData() {
    try {
      isLoading.value = true
      loadError.value = null

      const result = await GameDataService.loadGameData()

      gameData.value = result.gameData
      needsInitialization.value = result.needsInitialization
      loadError.value = result.error
    } catch (error) {
      logger.error('❌ 加载游戏数据失败:', error)
      loadError.value = error instanceof Error ? error.message : '加载失败'
      needsInitialization.value = true
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 保存初始化数据
   */
  async function saveInitializationData(data: GameData) {
    try {
      await GameDataService.saveInitializationData(data)
      gameData.value = data
      needsInitialization.value = false
    } catch (error) {
      logger.error('❌ 保存初始化数据失败:', error)
      throw error
    }
  }

  /**
   * 记录用户行为
   */
  function logUserAction(type: string, details: Record<string, unknown> = {}) {
    const action: UserAction = {
      type,
      ...details,
      timestamp: new Date().toISOString(),
    }
    userActionLog.value.push(action)
    logger.debug('用户行为已记录:', action)
  }

  /**
   * 清空用户行为日志
   */
  function clearUserActionLog() {
    userActionLog.value = []
  }

  /**
   * 自动保存游戏数据到世界书
   * 只有在自动保存开关开启时才执行保存
   */
  async function autoSaveToWorldbook() {
    const settingsStore = useSettingsStore()

    // 检查自动保存开关
    if (!settingsStore.settings.autoSave) {
      logger.debug('⏭️ 自动保存已关闭，跳过保存')
      return
    }

    try {
      logger.debug('💾 开始自动保存...')
      await GameDataService.autoSaveToWorldbook(gameData.value)
      // 更新存档时间戳，触发读档页面刷新
      lastSaveTimestamp.value = Date.now()
      logger.debug('🔄 已更新存档时间戳，触发读档页面刷新')
    } catch (error) {
      logger.error('❌ 自动保存失败:', error)
    }
  }

  /**
   * 从AI响应更新游戏数据
   */
  function updateGameDataFromAI(yamlContent: string) {
    try {
      GameDataService.updateGameDataFromAI(gameData.value, yamlContent)
    } catch (error) {
      logger.error('❌ 更新游戏数据失败:', error)
      throw error
    }
  }

  /**
   * 导出游戏数据
   */
  function exportGameData(): string {
    return GameDataService.exportGameData(gameData.value, userActionLog.value.length)
  }

  /**
   * 设置游戏数据
   * 用于从存档加载或导入数据
   */
  function setGameData(data: GameData) {
    gameData.value = data
    logger.info('✅ 游戏数据已更新')
  }

  /**
   * 重置游戏数据
   */
  function resetGameData() {
    gameData.value = {}
    userActionLog.value = []
    needsInitialization.value = true
  }

  /**
   * 重置 Store 到初始状态
   * Pinia 的 $reset 方法
   */
  function $reset() {
    gameData.value = {}
    userActionLog.value = []
    isLoading.value = true
    loadError.value = null
    needsInitialization.value = false
    logger.info('🔄 gameStore 已重置到初始状态')
  }

  return {
    // 状态
    gameData,
    userActionLog,
    isLoading,
    loadError,
    needsInitialization,
    lastSaveTimestamp,

    // 计算属性
    config,
    story,
    choices,
    characters,
    shop,
    storage,
    achievements,
    summaries,

    // Actions
    loadData,
    checkWorldbookStatus,
    saveInitializationData,
    setGameData,
    logUserAction,
    clearUserActionLog,
    updateGameDataFromAI,
    autoSaveToWorldbook,
    exportGameData,
    resetGameData,
    $reset,
  }
})
