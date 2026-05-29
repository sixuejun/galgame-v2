/**
 * @file useSaveOperations.ts
 * @description 存档操作 Composable - 处理存档的导入和导出操作
 * @author Eden System Team
 */

import { ref, type Ref } from 'vue'
import * as yaml from 'js-yaml'
import { WorldbookSaveService } from '../../services/worldbook'
import { logger } from '../../utils/logger'

/**
 * 存档操作配置选项
 */
export interface UseSaveOperationsOptions {
  /**
   * 操作完成后的回调
   */
  onOperationComplete?: () => void
}

/**
 * 存档操作返回值
 */
export interface UseSaveOperationsReturn {
  /**
   * 是否正在操作
   */
  isOperating: Ref<boolean>
  /**
   * 错误消息
   */
  errorMessage: Ref<string>
  /**
   * 文件输入引用
   */
  fileInputRef: Ref<HTMLInputElement | null>
  /**
   * 导出存档
   */
  exportSave: (saveName: string) => Promise<void>
  /**
   * 处理导入按钮点击
   */
  handleImportClick: () => void
  /**
   * 处理文件选择
   */
  handleFileSelect: (event: Event, onImport: (yamlContent: string) => void) => Promise<void>
  /**
   * 设置操作状态
   */
  setOperating: (value: boolean) => void
  /**
   * 清除错误消息
   */
  clearError: () => void
}

/**
 * 存档操作管理 Composable
 *
 * 提供存档的导入、导出等操作功能
 *
 * @param options 配置选项
 * @returns 存档操作相关的状态和方法
 *
 * @example
 * ```ts
 * const {
 *   isOperating,
 *   errorMessage,
 *   exportSave,
 *   handleImportClick,
 *   handleFileSelect
 * } = useSaveOperations({
 *   onOperationComplete: () => console.log('操作完成')
 * })
 * ```
 */
export function useSaveOperations(options: UseSaveOperationsOptions = {}): UseSaveOperationsReturn {
  const { onOperationComplete } = options

  // State
  const isOperating = ref(false)
  const errorMessage = ref('')
  const fileInputRef = ref<HTMLInputElement | null>(null)

  // Methods
  /**
   * 导出存档
   */
  const exportSave = async (saveName: string) => {
    try {
      isOperating.value = true
      errorMessage.value = ''
      logger.info(`📤 开始导出存档: ${saveName}`)

      // 从世界书加载存档数据
      const saveData = await WorldbookSaveService.loadSave(saveName)

      if (!saveData) {
        throw new Error('存档数据为空')
      }

      // 构造导出数据
      const exportData = {
        gameData: saveData,
        exportInfo: {
          type: '伊甸园存档导出',
          saveName: saveName,
          timestamp: new Date().toISOString(),
        },
      }

      // 转换为 YAML 格式
      const yamlStr = yaml.dump(exportData, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
      })

      // 创建下载链接
      const blob = new Blob([yamlStr], { type: 'application/x-yaml' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${saveName}-${Date.now()}.yaml`
      link.click()
      URL.revokeObjectURL(url)

      logger.info(`✅ 存档导出成功: ${saveName}`)

      if (onOperationComplete) {
        onOperationComplete()
      }
    } catch (error) {
      logger.error('❌ 导出存档失败:', error)
      errorMessage.value = error instanceof Error ? error.message : '导出失败'
    } finally {
      isOperating.value = false
    }
  }

  /**
   * 处理导入按钮点击
   */
  const handleImportClick = () => {
    if (fileInputRef.value) {
      fileInputRef.value.click()
    }
  }

  /**
   * 处理文件选择
   */
  const handleFileSelect = async (event: Event, onImport: (yamlContent: string) => void) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (!file) {
      return
    }

    try {
      isOperating.value = true
      errorMessage.value = ''
      logger.info('📂 开始读取导入文件:', file.name)

      // 读取文件内容
      const fileContent = await file.text()

      // 验证 YAML 格式
      try {
        const parsedData = yaml.load(fileContent)
        logger.debug('✅ YAML 格式验证通过')

        // 检查是否包含 gameData 字段
        if (!parsedData || typeof parsedData !== 'object' || !('gameData' in parsedData)) {
          throw new Error('YAML 文件格式错误：缺少 gameData 字段')
        }

        // 触发导入回调
        onImport(fileContent)

        if (onOperationComplete) {
          onOperationComplete()
        }
      } catch (yamlError) {
        logger.error('❌ YAML 格式验证失败:', yamlError)
        throw new Error('文件格式错误：请确保是有效的 YAML 格式存档文件')
      }
    } catch (error) {
      logger.error('❌ 导入文件失败:', error)
      errorMessage.value = error instanceof Error ? error.message : '导入失败'
    } finally {
      isOperating.value = false
      // 清空文件输入，允许重复选择同一文件
      if (target) {
        target.value = ''
      }
    }
  }

  /**
   * 设置操作状态
   */
  const setOperating = (value: boolean) => {
    isOperating.value = value
  }

  /**
   * 清除错误消息
   */
  const clearError = () => {
    errorMessage.value = ''
  }

  return {
    isOperating,
    errorMessage,
    fileInputRef,
    exportSave,
    handleImportClick,
    handleFileSelect,
    setOperating,
    clearError,
  }
}
