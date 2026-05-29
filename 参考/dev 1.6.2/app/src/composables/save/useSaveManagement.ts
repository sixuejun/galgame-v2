/**
 * @file useSaveManagement.ts
 * @description 存档管理 Composable - 处理存档的读取、删除和重命名操作
 * @author Eden System Team
 */

import { useGameStore } from '../../stores/gameStore'
import { WorldbookSaveService } from '../../services/worldbook'
import { logger } from '../../utils/logger'
import * as yaml from 'js-yaml'
import type { Ref } from 'vue'

/**
 * 读档页面组件暴露的方法接口
 */
export interface LoadGamePageExposed {
  loadSaves: () => Promise<void>
  setOperating: (value: boolean) => void
}

/**
 * 存档管理配置接口
 */
export interface UseSaveManagementOptions {
  /** 读档页面引用 */
  loadGamePageRef: Ref<LoadGamePageExposed | null>
  /** 显示确认对话框 */
  showConfirm: (
    title: string,
    content: string,
    confirmText: string,
    cancelText: string
  ) => Promise<boolean>
  /** 显示成功提示 */
  showSuccessToast: (message: string) => void
  /** 显示错误提示 */
  showErrorToast: (message: string) => void
  /** 页面导航函数 */
  navigateTo: (pageId: string) => void
}

/**
 * 存档管理 Composable - 组合器模式
 *
 * 职责：
 * - 协调存档相关的各种操作
 * - 提供统一的存档管理接口
 * - 处理 UI 交互和错误提示
 *
 * 设计模式：
 * - 采用组合器模式（Facade Pattern）
 * - 将具体操作委托给专门的服务层
 * - 保持 Composable 的轻量级和可测试性
 *
 * 注意：此 composable 直接使用 gameStore 来管理数据，
 * 遵循单向数据流原则，避免直接修改 ref
 */
export function useSaveManagement(options: UseSaveManagementOptions) {
  const { loadGamePageRef, showConfirm, showSuccessToast, showErrorToast, navigateTo } = options
  const gameStore = useGameStore()

  /**
   * 手动保存游戏
   */
  const handleManualSave = async () => {
    try {
      logger.info('🎮 开始手动存档...')
      const saveName = await WorldbookSaveService.manualSave(gameStore.gameData)
      showSuccessToast(`✅ 存档成功: ${saveName}`)

      // 如果读档页面存在，刷新存档列表
      if (loadGamePageRef.value) {
        logger.info('🔄 刷新读档页面的存档列表')
        await loadGamePageRef.value.loadSaves()
      }
    } catch (error) {
      logger.error('❌ 手动存档失败:', error)
      const errorMsg = error instanceof Error ? error.message : '未知错误'
      showErrorToast(`存档失败: ${errorMsg}`)
    }
  }

  /**
   * 加载存档
   */
  const handleLoadSave = async (saveName: string) => {
    if (!loadGamePageRef.value) {
      logger.error('❌ 读档页面引用不存在')
      return
    }

    try {
      loadGamePageRef.value.setOperating(true)
      logger.info(`📂 开始读取存档: ${saveName}`)

      const loadedData = await WorldbookSaveService.loadSave(saveName)
      if (!loadedData) {
        throw new Error('读取的存档数据为空')
      }

      gameStore.setGameData(loadedData)

      showSuccessToast(`✅ 读档成功: ${saveName}`)
    } catch (error) {
      logger.error('❌ 读档失败:', error)
      const errorMsg = error instanceof Error ? error.message : '未知错误'
      showErrorToast(`读档失败: ${errorMsg}`)
    } finally {
      loadGamePageRef.value.setOperating(false)
    }
  }

  /**
   * 删除存档
   */
  const handleDeleteSave = async (saveName: string) => {
    if (!loadGamePageRef.value) {
      logger.error('❌ 读档页面引用不存在')
      return
    }

    const confirmed = await showConfirm(
      '确认删除',
      `确定要删除存档 "${saveName}" 吗？此操作不可恢复。`,
      '确定',
      '取消'
    )

    if (!confirmed) {
      return
    }

    try {
      loadGamePageRef.value.setOperating(true)
      logger.info(`🗑️ 开始删除存档: ${saveName}`)

      await WorldbookSaveService.deleteSave(saveName)
      logger.info('✅ 存档删除成功')

      await loadGamePageRef.value.loadSaves()
      showSuccessToast(`✅ 存档已删除: ${saveName}`)
    } catch (error) {
      logger.error('❌ 删除存档失败:', error)
      const errorMsg = error instanceof Error ? error.message : '未知错误'
      showErrorToast(`删除存档失败: ${errorMsg}`)
    } finally {
      loadGamePageRef.value.setOperating(false)
    }
  }

  /**
   * 导入存档
   */
  const handleImportSave = async (yamlContent: string) => {
    if (!loadGamePageRef.value) {
      logger.error('❌ 读档页面引用不存在')
      return
    }

    try {
      loadGamePageRef.value.setOperating(true)
      logger.info('📥 开始导入存档...')

      // 解析YAML内容
      const parsedData = yaml.load(yamlContent) as { gameData?: unknown }

      // 验证数据格式
      if (!parsedData || !parsedData.gameData) {
        throw new Error('导入的数据格式错误：缺少 gameData 字段')
      }

      // 更新游戏数据
      gameStore.setGameData(parsedData.gameData)

      await loadGamePageRef.value.loadSaves()
      showSuccessToast('✅ 存档导入成功')
    } catch (error) {
      logger.error('❌ 导入存档失败:', error)
      const errorMsg = error instanceof Error ? error.message : '未知错误'
      showErrorToast(`导入存档失败: ${errorMsg}`)
    } finally {
      loadGamePageRef.value.setOperating(false)
    }
  }

  /**
   * 清空所有存档
   */
  const handleClearAllSaves = async () => {
    if (!loadGamePageRef.value) {
      logger.error('❌ 读档页面引用不存在')
      return
    }

    const confirmed = await showConfirm(
      '确认清空',
      '确定要清空所有存档吗？此操作不可恢复！',
      '确定',
      '取消'
    )

    if (!confirmed) {
      return
    }

    try {
      loadGamePageRef.value.setOperating(true)
      logger.info('🗑️ 开始清空所有存档...')

      await WorldbookSaveService.clearAllSaves()
      logger.info('✅ 所有存档已清空')

      // 在重置游戏数据前先刷新存档列表,因为重置可能导致组件卸载
      await loadGamePageRef.value.loadSaves()
      showSuccessToast('✅ 所有存档已清空')

      // 在跳转前先重置操作状态,避免跳转后 ref 变为 null
      loadGamePageRef.value.setOperating(false)

      // 重置游戏数据(可能会导致组件卸载)
      logger.info('🔄 重置游戏数据')
      gameStore.resetGameData()

      // 清空成功后,跳转到主页(初始化页面)
      logger.info('🔄 跳转到主页')
      navigateTo('home')
    } catch (error) {
      logger.error('❌ 清空存档失败:', error)
      const errorMsg = error instanceof Error ? error.message : '未知错误'
      showErrorToast(`清空存档失败: ${errorMsg}`)
      // 发生错误时才在 finally 外重置状态
      if (loadGamePageRef.value) {
        loadGamePageRef.value.setOperating(false)
      }
    }
  }

  return {
    handleManualSave,
    handleLoadSave,
    handleDeleteSave,
    handleImportSave,
    handleClearAllSaves,
  }
}
