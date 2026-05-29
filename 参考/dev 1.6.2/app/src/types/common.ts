/**
 * 用户行为日志
 */
export interface UserAction {
  type: string
  timestamp: string
  [key: string]: unknown
}

/**
 * 图片生成服务类型
 */
export type ImageGenerationService = 'pollinations' | 'st-chatu8'

/**
 * 主题类型
 */
export type ThemeType = 'default' | 'eye-comfort' | 'high-contrast' | 'cool' | 'warm'

/**
 * MiniMax 语音模型类型
 */
export type MiniMaxVoiceModel =
  | 'speech-2.6-hd'
  | 'speech-2.6-turbo'
  | 'speech-02-hd'
  | 'speech-02-turbo'
  | 'speech-01-hd'
  | 'speech-01-turbo'

/**
 * MiniMax 输出格式类型
 */
export type MiniMaxOutputFormat = 'hex' | 'url'

/**
 * 应用设置
 */
export interface AppSettings {
  /** AI 请求最大重试次数 */
  maxRetries: number
  /** 数据处理失败最大重试次数 */
  maxDataRetries: number
  /** 重试延迟时间（毫秒） */
  retryDelay: number
  /** 是否启用调试模式 */
  debugMode: boolean
  /** 是否启用自动保存 */
  autoSave: boolean
  /** 图片生成服务选择 */
  imageGenerationService: ImageGenerationService
  /** ST-ChatU8 图片生成超时时间（毫秒） */
  stChatu8ImageTimeout: number
  /** 当前主题 */
  theme: ThemeType
  /** 是否显示主页标题 */
  showHomeHeader: boolean
  /** 是否显示故事元数据（时间、地点、天气） */
  showStoryMetadata: boolean
  /** 图片缓存上限（条数） */
  imageCacheLimit: number
  /** 是否启用导航栏自动隐藏功能 */
  enableNavbarAutoHide: boolean
  /** MiniMax API Key */
  minimaxApiKey?: string
  /** MiniMax 语音模型 */
  minimaxModel?: MiniMaxVoiceModel
  /** MiniMax 输出格式 */
  minimaxOutputFormat?: MiniMaxOutputFormat
  /** MiniMax 是否启用流式输出 */
  minimaxStream?: boolean
  /** MiniMax 自定义请求 ID */
  minimaxRequestId?: string
  /** MiniMax 语音 ID */
  minimaxVoiceId?: string
  /** MiniMax 语音速度 */
  minimaxSpeed?: number
  /** TTS 音频缓存上限（条数） */
  ttsCacheLimit?: number
}
