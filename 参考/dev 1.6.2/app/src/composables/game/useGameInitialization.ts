/**
 * @file useGameInitialization.ts
 * @description 游戏初始化 Composable - 管理游戏的初始化流程
 * @author Eden System Team
 */

import { logger } from '../../utils/logger'
import { AIService } from '../../services/aiService'
import * as yaml from 'js-yaml'
import type { GameData } from '../../types'
import type { Ref } from 'vue'
import { useAILoadingState } from '../ai/useAILoadingState'

/**
 * 初始化页面组件暴露的方法接口
 *
 * @property setGenerating 设置生成状态
 * @property setError 设置错误消息
 */
export interface InitPageExposed {
  /** 设置生成状态 */
  setGenerating: (value: boolean) => void
  /** 设置错误消息 */
  setError: (message: string) => void
}

/**
 * 游戏初始化配置接口
 *
 * @property initPageRef 初始化页面引用
 * @property isAIAvailable 检查 AI 是否可用
 * @property saveInitializationData 保存初始化数据
 * @property showSuccessToast 显示成功提示
 * @property showErrorToast 显示错误提示
 */
export interface UseGameInitializationOptions {
  /** 初始化页面引用 */
  initPageRef: Ref<InitPageExposed | null>
  /** 检查 AI 是否可用 */
  isAIAvailable: () => boolean
  /** 保存初始化数据 */
  saveInitializationData: (data: GameData) => Promise<void>
  /** 显示成功提示 */
  showSuccessToast: (message: string) => void
  /** 显示错误提示 */
  showErrorToast: (message: string) => void
}

/**
 * 游戏初始化 Composable
 *
 * 提供游戏初始化流程的管理功能，包括调用 AI 生成初始化数据、解析 YAML 数据、保存数据等。
 *
 * 功能：
 * - 提供系统初始化指令模板
 * - 调用 AI 生成初始化数据
 * - 解析 AI 返回的 YAML 数据
 * - 保存初始化数据到世界书
 * - 管理初始化过程中的加载状态和错误处理
 *
 * @param options 初始化配置选项
 * @returns 系统指令和初始化处理方法
 *
 * @example
 * ```typescript
 * const { systemInstruction, handleInitGenerate } = useGameInitialization({
 *   initPageRef,
 *   isAIAvailable,
 *   saveInitializationData,
 *   showSuccessToast,
 *   showErrorToast
 * })
 *
 * // 生成初始化数据
 * await handleInitGenerate(systemInstruction, "用户设定信息")
 * ```
 */
export function useGameInitialization(options: UseGameInitializationOptions) {
  const { initPageRef, isAIAvailable, saveInitializationData, showSuccessToast, showErrorToast } =
    options

  // 使用 AI 加载状态管理
  const { startLoading, stopLoading } = useAILoadingState()

  // 系统初始化指令
  const systemInstruction = `# 系统初始化指令

请严格按照以下要求生成游戏初始化数据：

## 1. 输出格式要求
- 必须使用 YAML 代码块格式输出
- 使用纯 \`gameData\` 对象（严禁使用 \`$update\`、\`$delete\` 等操作符）
- 确保 YAML 语法正确，字段类型与数据结构定义一致

## 2. 必需字段要求

以下字段为初始化时的必需字段，必须全部包含：

- \`gameData.config.version\`: 版本号（字符串，建议使用 "1.0"）
- \`gameData.config.phase\`: 当前游戏阶段（字符串）
- \`gameData.config.home.title\`: 主页标题（字符串）
- \`gameData.story.content\`: 初始剧情内容（字符串，支持 markdown、HTML 和 [img:URL] 语法）
- \`gameData.choices\`: 玩家选项数组（至少包含 1 个选项）
- \`gameData.config.status.tabs.user\`: 用户状态页签配置
- \`gameData.characters.user\`: 用户角色对象（必须包含 name 字段和至少一个数据块）
- \`gameData.summaries\`: 初始摘要数组（至少包含 1 条摘要记录）

## 3. 建议包含的字段

以下字段虽非必需，但建议包含以获得更好的用户体验：


- \`gameData.config.navButtons\`: 导航栏配置
- \`gameData.config.{pages}.title\`: 各页面标题
- \`gameData.story.time\`: 故事时间
- \`gameData.story.location\`: 故事地点
- \`gameData.story.weather\`: 故事天气

## 4. 内容生成要求

- 根据用户提供的设定信息生成个性化的初始化数据
- 确保生成的内容具有完整性和一致性
- 所有数据必须符合前端数据验证规则
- 角色数据应使用数据块系统（DataBlock）组织

## 5. 注意事项

- 所有 UI 界面元素由前端统一渲染
- 可选字段可以省略，但建议提供完整的初始化数据
- 初始化数据应为完整的 \`gameData\` 对象，不使用增量更新操作符`

  /**
   * 处理初始化数据生成
   *
   * 调用 AI 生成初始化数据，解析 YAML 数据并保存到世界书。
   *
   * @param systemInstructionInput 系统指令（如果为空则使用默认指令）
   * @param userInput 用户附加设定信息
   * @returns Promise<void>
   * @throws 如果 AI 不可用、生成失败或数据格式错误
   */
  const handleInitGenerate = async (systemInstructionInput: string, userInput: string) => {
    if (!initPageRef.value) {
      logger.error('❌ 初始化页面引用不存在')
      return
    }

    if (!isAIAvailable()) {
      logger.error('❌ AI 接口不可用')
      initPageRef.value.setError('AI 接口不可用，请确保在 SillyTavern 环境中运行')
      return
    }

    try {
      initPageRef.value.setGenerating(true)
      initPageRef.value.setError('')

      // 设置加载场景为初始化
      startLoading('init')

      logger.info('🚀 开始生成初始化数据...')

      // 构建发送给 AI 的内容
      let promptContent =
        systemInstructionInput && systemInstructionInput.trim() !== ''
          ? systemInstructionInput
          : systemInstruction

      if (userInput && userInput.trim() !== '') {
        promptContent += '\n\n用户附加设定信息：\n' + userInput
      }

      // 调用 generate 接口
      const response = await AIService.sendPlayerChoice({}, promptContent, [])

      if (!response || !response.success) {
        throw new Error(response?.error || '生成失败')
      }

      // 解析 YAML 数据
      if (!response.yamlContent) {
        throw new Error('AI 响应中没有 YAML 数据')
      }

      logger.debug('AI 响应的 YAML 内容:', response.yamlContent)

      // 解析 gameData
      const parsedData = yaml.load(response.yamlContent) as { gameData?: GameData }
      if (!parsedData || !parsedData.gameData) {
        throw new Error('YAML 数据格式错误：缺少 gameData 字段')
      }

      logger.info('✅ 初始化数据解析成功')

      // 在保存数据前先关闭加载状态，因为保存成功后组件会被卸载
      if (initPageRef.value) {
        initPageRef.value.setGenerating(false)
      }
      stopLoading()

      // 保存初始化数据到世界书（这会触发重新加载，导致组件卸载）
      await saveInitializationData(parsedData.gameData)

      showSuccessToast('✨ 初始化成功！欢迎来到伊甸园')
    } catch (error) {
      logger.error('❌ 初始化失败:', error)
      const errorMsg = error instanceof Error ? error.message : '未知错误'

      // 检查 ref 是否仍然存在再调用方法
      if (initPageRef.value) {
        initPageRef.value.setError(`初始化失败: ${errorMsg}`)
        initPageRef.value.setGenerating(false)
      }
      stopLoading()

      showErrorToast(`初始化失败: ${errorMsg}`)
    }
  }

  return {
    systemInstruction,
    handleInitGenerate,
  }
}
