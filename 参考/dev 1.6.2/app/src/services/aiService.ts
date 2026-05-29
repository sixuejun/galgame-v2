import type { GameData, UserAction, Summary, AIPromptData } from '../types'
import { logger } from '../utils/logger'
import { ValidationError, PermissionError } from '../utils/errorHandler'
import { AIApi } from './api'
import { useSettingsStore } from '../stores/settingsStore'
import * as yaml from 'js-yaml'
import { ref } from 'vue'

/**
 * AI 响应解析结果
 */
export interface ParsedAIResponse {
  /** 是否解析成功 */
  success: boolean
  /** YAML 代码块内容 (包含 $update 和 $delete 操作符) */
  yamlContent: string | null
  /** 错误信息 */
  error?: string
}

/**
 * AI 通信服务 - 负责与 JS-Slash-Runner 的 generate 接口通信
 *
 * 重构说明：
 * - 合并了 AICommunicationManager 的重试逻辑
 * - 合并了 AIResponseParser 的解析逻辑
 * - 简化了调用链：从 8 层减少到 5 层
 */
export class AIService {
  // 缓存最后一次发送的内容,用于重试
  private static lastSentContent: string | null = null
  private static lastGenerationId: string | null = null
  // 使用 Vue 响应式数据，确保 UI 能够实时更新
  // AI 请求重试状态
  private static retryCount = ref(0)
  private static lastRetryReason = ref('')
  // 数据处理重试状态
  private static dataRetryCount = ref(0)
  private static dataRetryReason = ref('')

  /**
   * 检测 generate 接口是否可用
   * @returns 是否可用
   */
  static isGenerateAvailable(): boolean {
    return AIApi.isAvailable()
  }

  /**
   * 发送玩家选择到 AI（带重试和解析）
   * @param gameData 当前游戏数据
   * @param playerChoice 玩家选择的文本
   * @param userActionLog 用户操作日志
   * @param summariesCount 发送给AI的摘要条数（可选，默认5）
   * @returns 解析后的 AI 响应
   */
  static async sendPlayerChoice(
    gameData: GameData,
    playerChoice: string,
    userActionLog: UserAction[],
    summariesCount: number = 5
  ): Promise<ParsedAIResponse> {
    if (!this.isGenerateAvailable()) {
      throw new PermissionError('generate 接口不可用')
    }

    // 构建发送内容
    const content = this.buildPromptContent(gameData, playerChoice, userActionLog, summariesCount)

    // 缓存发送内容
    this.lastSentContent = content

    // 使用重试机制发送请求
    return await this.sendWithRetry(async () => {
      this.lastGenerationId = AIApi.generateUniqueId()

      logger.debug('发送内容:', content)
      const response = await AIApi.generate({
        user_input: content,
        should_stream: false,
        generation_id: this.lastGenerationId,
      })

      logger.debug('AI 响应:', response)
      return response
    })
  }

  /**
   * 重试上一次的请求
   * @returns 解析后的 AI 响应
   */
  static async retryLastRequest(): Promise<ParsedAIResponse> {
    if (!this.lastSentContent) {
      throw new ValidationError('没有可重试的请求')
    }

    if (!this.isGenerateAvailable()) {
      throw new PermissionError('generate 接口不可用')
    }

    return await this.sendWithRetry(async () => {
      logger.info('🔄 重试上一次的 AI 请求...')

      this.lastGenerationId = AIApi.generateUniqueId()

      const response = await AIApi.generate({
        user_input: this.lastSentContent!,
        should_stream: false,
        generation_id: this.lastGenerationId,
      })

      logger.info('✅ 重试成功')
      return response
    })
  }

  /**
   * 发送请求并自动重试（合并自 AICommunicationManager）
   * @param sendFunction 发送函数
   * @returns 解析后的响应
   */
  private static async sendWithRetry(
    sendFunction: () => Promise<string>
  ): Promise<ParsedAIResponse> {
    const settingsStore = useSettingsStore()
    const maxRetries = settingsStore.settings.maxRetries
    const retryDelay = settingsStore.settings.retryDelay

    // 重要：第一次尝试时 retryCount = 0（不是重试）
    // 从第二次尝试开始 retryCount = 1, 2, 3...（这才是重试）
    this.retryCount.value = 0
    let attemptNumber = 1

    while (attemptNumber <= maxRetries) {
      try {
        logger.info(`🚀 发送 AI 请求 (尝试 ${attemptNumber}/${maxRetries})`)

        // 发送请求
        const response = await sendFunction()

        // 解析响应
        const parsed = this.parseResponse(response)

        if (parsed.success) {
          logger.info('✅ AI 通信成功')
          this.retryCount.value = 0
          this.lastRetryReason.value = ''
          return parsed
        }

        // 解析失败,准备重试
        logger.warn(`⚠️ AI 响应格式不正确: ${parsed.error}`)
        this.lastRetryReason.value = parsed.error || 'AI 响应格式不正确'

        if (attemptNumber < maxRetries) {
          // 增加尝试次数和重试计数
          attemptNumber++
          this.retryCount.value = attemptNumber - 1 // retryCount 表示重试次数，第2次尝试是第1次重试
          logger.info(
            `🔄 准备重试... (第 ${this.retryCount.value} 次重试，共 ${maxRetries - 1} 次)`
          )
          await this.delay(retryDelay)
        } else {
          // 达到最大重试次数
          break
        }
      } catch (error) {
        logger.error('❌ AI 请求失败:', error)
        const errorMsg = error instanceof Error ? error.message : '未知错误'
        this.lastRetryReason.value = `AI 请求失败: ${errorMsg}`

        if (attemptNumber < maxRetries) {
          // 增加尝试次数和重试计数
          attemptNumber++
          this.retryCount.value = attemptNumber - 1 // retryCount 表示重试次数，第2次尝试是第1次重试
          logger.info(
            `🔄 准备重试... (第 ${this.retryCount.value} 次重试，共 ${maxRetries - 1} 次)`
          )
          await this.delay(retryDelay)
        } else {
          this.retryCount.value = 0
          this.lastRetryReason.value = ''
          throw error
        }
      }
    }

    // 达到最大重试次数
    this.retryCount.value = 0
    const errorMsg = `达到最大重试次数 (${maxRetries}),AI 通信失败`
    logger.error(`❌ ${errorMsg}`)
    throw new Error(errorMsg)
  }

  /**
   * 解析 AI 响应（合并自 AIResponseParser）
   * @param response AI 返回的原始文本
   * @returns 解析结果
   */
  private static parseResponse(response: string): ParsedAIResponse {
    logger.info('📝 开始解析 AI 响应...')

    try {
      // 1. 提取 YAML 代码块
      const yamlContent = this.extractCodeBlock(response, 'yaml')
      if (!yamlContent) {
        logger.error('❌ 未找到 YAML 代码块')
        return {
          success: false,
          yamlContent: null,
          error: '缺少必需的 YAML 代码块',
        }
      }

      // 2. 验证 YAML 内容可以被成功解析
      try {
        const parsed = yaml.load(yamlContent)

        // 检查解析结果是否为有效对象
        if (!parsed || typeof parsed !== 'object') {
          logger.error('❌ YAML 解析结果不是有效对象')
          return {
            success: false,
            yamlContent: null,
            error: 'YAML 解析结果不是有效对象',
          }
        }

        // 3. 验证 YAML 内容包含有效的操作符或 gameData
        const parsedObj = parsed as Record<string, unknown>
        const hasUpdate = parsedObj.$update && typeof parsedObj.$update === 'object'
        const hasDelete = parsedObj.$delete && Array.isArray(parsedObj.$delete)
        const hasGameData = parsedObj.gameData && typeof parsedObj.gameData === 'object'

        if (!hasUpdate && !hasDelete && !hasGameData) {
          logger.error('❌ YAML 内容缺少有效的操作符（$update、$delete）或 gameData 字段')
          return {
            success: false,
            yamlContent: null,
            error: 'YAML 内容缺少有效的操作符或 gameData 字段',
          }
        }

        logger.info('✅ AI 响应解析成功')
        return {
          success: true,
          yamlContent,
        }
      } catch (yamlError) {
        logger.error('❌ YAML 内容解析失败:', yamlError)
        return {
          success: false,
          yamlContent: null,
          error: `YAML 格式错误: ${yamlError instanceof Error ? yamlError.message : '未知错误'}`,
        }
      }
    } catch (error) {
      logger.error('❌ AI 响应解析失败:', error)
      return {
        success: false,
        yamlContent: null,
        error: error instanceof Error ? error.message : '未知错误',
      }
    }
  }

  /**
   * 提取代码块内容
   * @param text 原始文本
   * @param blockType 代码块类型(如 'yaml')
   * @returns 代码块内容,如果未找到则返回 null
   */
  private static extractCodeBlock(text: string, blockType: string): string | null {
    const regex = new RegExp(`\`\`\`${blockType}\\s*\\n([\\s\\S]*?)\\n\`\`\``, 'i')
    const match = text.match(regex)

    if (match && match[1]) {
      return match[1].trim()
    }

    return null
  }

  /**
   * 延迟函数
   * @param ms 延迟毫秒数
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 重置重试计数器
   */
  static resetRetryCount(): void {
    this.retryCount.value = 0
  }

  /**
   * 获取当前重试次数
   */
  static getRetryCount(): number {
    return this.retryCount.value
  }

  /**
   * 获取最后一次重试的原因
   */
  static getRetryReason(): string {
    return this.lastRetryReason.value
  }

  /**
   * 设置数据处理重试状态
   * @param count 重试次数
   * @param reason 重试原因
   */
  static setDataRetryState(count: number, reason: string): void {
    this.dataRetryCount.value = count
    this.dataRetryReason.value = reason
  }

  /**
   * 获取数据处理重试次数
   */
  static getDataRetryCount(): number {
    return this.dataRetryCount.value
  }

  /**
   * 获取数据处理重试原因
   */
  static getDataRetryReason(): string {
    return this.dataRetryReason.value
  }

  /**
   * 重置数据处理重试状态
   */
  static resetDataRetryState(): void {
    this.dataRetryCount.value = 0
    this.dataRetryReason.value = ''
  }

  /**
   * 构建发送给 AI 的提示词内容
   * @param gameData 游戏数据
   * @param playerChoice 玩家选择
   * @param userActionLog 用户操作日志
   * @param summariesCount 发送给AI的摘要条数
   * @returns 格式化的提示词内容
   */
  private static buildPromptContent(
    gameData: GameData,
    playerChoice: string,
    userActionLog: UserAction[],
    summariesCount: number
  ): string {
    // 1. 准备 gameData（排除 summaries 字段以防重复）
    const gameDataWithoutSummaries = { ...gameData }
    delete gameDataWithoutSummaries.summaries

    // 2. 准备 summaries（取最近 N 条）
    let summariesToSend: Summary[] = []
    if (gameData.summaries && Array.isArray(gameData.summaries) && summariesCount > 0) {
      // 按时间倒序排列，取最近的 N 条
      const sorted = [...gameData.summaries].sort((a, b) => {
        return new Date(b.time).getTime() - new Date(a.time).getTime()
      })
      summariesToSend = sorted.slice(0, summariesCount)
    }

    // 3. 构建新的数据对象
    const dataObject: AIPromptData = {
      gameData: gameDataWithoutSummaries,
      userChoice: playerChoice,
    }

    // 4. 可选字段：userAction（如果有用户操作日志）
    if (userActionLog && userActionLog.length > 0) {
      dataObject.userAction = userActionLog
    }

    // 5. 可选字段：summaries（如果有摘要记录）
    if (summariesToSend.length > 0) {
      dataObject.summaries = summariesToSend
    }

    // 使用 js-yaml 序列化为 YAML
    const yamlContent = yaml.dump(dataObject, {
      indent: 2,
      lineWidth: -1, // 不限制行宽
      noRefs: true, // 不使用引用
      sortKeys: false, // 保持键的顺序
    })

    // 包裹在 YAML 代码块中
    const fullContent = `\`\`\`yaml
${yamlContent}\`\`\``

    return fullContent
  }

  /**
   * 清除缓存的请求内容
   */
  static clearCache(): void {
    this.lastSentContent = null
    this.lastGenerationId = null
    logger.debug('AI 请求缓存已清除')
  }
}
