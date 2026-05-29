/**
 * 统一错误处理工具
 *
 * 职责范围：
 * - 处理应用层（UI/组件层）和服务层（Services/API 层）的错误
 * - 提供用户友好的错误提示（Toast 通知）
 * - 统一的错误日志记录
 * - 错误分类和级别管理
 * - 错误上报（未来扩展）
 *
 * 使用场景：
 * - Vue 组件中的错误处理
 * - Composables 中的业务逻辑错误
 * - Services 层的错误处理
 * - API 调用失败的错误封装
 * - 数据解析和验证错误
 * - 用户交互相关的错误
 *
 * 典型用法：
 * ```typescript
 * import { handleError, AppError, ErrorLevel, ErrorCategory } from '@/utils/errorHandler'
 *
 * // 在组件中处理错误
 * try {
 *   await someOperation()
 * } catch (error) {
 *   handleError(error, { showToast: true, logToConsole: true })
 * }
 *
 * // 抛出自定义错误
 * throw new AppError('操作失败', ErrorLevel.ERROR, ErrorCategory.RUNTIME)
 *
 * // 在 Service 中使用错误包装
 * return await wrapAsync(
 *   async () => {
 *     const response = await fetch('/api/data')
 *     return response.json()
 *   },
 *   '获取数据失败',
 *   ErrorCategory.NETWORK
 * )
 * ```
 */

import { logger } from './logger'

/**
 * 错误级别枚举
 */
export enum ErrorLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * 错误类别枚举
 */
export enum ErrorCategory {
  NETWORK = 'network', // 网络错误
  VALIDATION = 'validation', // 数据验证错误
  PARSE = 'parse', // 解析错误
  RUNTIME = 'runtime', // 运行时错误
  PERMISSION = 'permission', // 权限错误
  NOT_FOUND = 'not_found', // 未找到
  TIMEOUT = 'timeout', // 超时
  UNKNOWN = 'unknown', // 未知错误
}

/**
 * 应用错误基类
 */
export class AppError extends Error {
  public readonly level: ErrorLevel
  public readonly category: ErrorCategory
  public readonly timestamp: Date
  public readonly context?: Record<string, unknown>
  public readonly originalError?: Error

  constructor(
    message: string,
    level: ErrorLevel = ErrorLevel.ERROR,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    context?: Record<string, unknown>,
    originalError?: Error
  ) {
    super(message)
    this.name = 'AppError'
    this.level = level
    this.category = category
    this.timestamp = new Date()
    this.context = context
    this.originalError = originalError

    // 保持正确的原型链
    Object.setPrototypeOf(this, AppError.prototype)
  }

  /**
   * 转换为日志友好的格式
   */
  toLogFormat(): string {
    const contextStr = this.context ? `\n上下文: ${JSON.stringify(this.context, null, 2)}` : ''
    const originalErrorStr = this.originalError ? `\n原始错误: ${this.originalError.message}` : ''
    return `[${this.level.toUpperCase()}] [${this.category}] ${this.message}${contextStr}${originalErrorStr}`
  }

  /**
   * 获取用户友好的错误消息
   */
  getUserMessage(): string {
    switch (this.category) {
      case ErrorCategory.NETWORK:
        return '网络连接失败，请检查网络设置'
      case ErrorCategory.PARSE:
        return '数据格式错误，请联系管理员'
      case ErrorCategory.VALIDATION:
        return this.message || '数据验证失败'
      case ErrorCategory.NOT_FOUND:
        return this.message || '未找到请求的资源'
      case ErrorCategory.PERMISSION:
        return '权限不足，无法执行此操作'
      case ErrorCategory.TIMEOUT:
        return '操作超时，请稍后重试'
      default:
        return this.message || '操作失败，请稍后重试'
    }
  }
}

/**
 * 网络错误
 */
export class NetworkError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, ErrorLevel.ERROR, ErrorCategory.NETWORK, context)
    this.name = 'NetworkError'
    Object.setPrototypeOf(this, NetworkError.prototype)
  }
}

/**
 * 数据验证错误
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, ErrorLevel.WARNING, ErrorCategory.VALIDATION, context)
    this.name = 'ValidationError'
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

/**
 * 解析错误
 */
export class ParseError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, ErrorLevel.ERROR, ErrorCategory.PARSE, context)
    this.name = 'ParseError'
    Object.setPrototypeOf(this, ParseError.prototype)
  }
}

/**
 * 运行时错误
 */
export class RuntimeError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, ErrorLevel.ERROR, ErrorCategory.RUNTIME, context)
    this.name = 'RuntimeError'
    Object.setPrototypeOf(this, RuntimeError.prototype)
  }
}

/**
 * 权限错误
 */
export class PermissionError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, ErrorLevel.CRITICAL, ErrorCategory.PERMISSION, context)
    this.name = 'PermissionError'
    Object.setPrototypeOf(this, PermissionError.prototype)
  }
}

/**
 * 错误处理器配置
 */
export interface ErrorHandlerConfig {
  showToast?: boolean // 是否显示 Toast 提示
  logToConsole?: boolean // 是否记录到控制台
  reportToServer?: boolean // 是否上报到服务器（未来扩展）
  rethrow?: boolean // 是否重新抛出错误
}

/**
 * 默认错误处理器配置
 */
const defaultConfig: ErrorHandlerConfig = {
  showToast: true,
  logToConsole: true,
  reportToServer: false,
  rethrow: false,
}

/**
 * Toast 通知回调（由外部注入）
 */
let toastCallback: ((message: string, type: 'error' | 'warning' | 'info') => void) | null = null

/**
 * 设置 Toast 通知回调
 */
export function setToastCallback(
  callback: (message: string, type: 'error' | 'warning' | 'info') => void
): void {
  toastCallback = callback
}

/**
 * 显示 Toast 通知
 */
function showToast(message: string, level: ErrorLevel): void {
  if (!toastCallback) return

  const type =
    level === ErrorLevel.ERROR || level === ErrorLevel.CRITICAL
      ? 'error'
      : level === ErrorLevel.WARNING
        ? 'warning'
        : 'info'

  toastCallback(message, type)
}

/**
 * 统一错误处理函数
 */
export function handleError(error: unknown, config: ErrorHandlerConfig = {}): void {
  const finalConfig = { ...defaultConfig, ...config }

  // 转换为 AppError
  const appError = normalizeError(error)

  // 记录到控制台
  if (finalConfig.logToConsole) {
    logError(appError)
  }

  // 显示 Toast 提示
  if (finalConfig.showToast) {
    showToast(appError.message, appError.level)
  }

  // 上报到服务器（未来扩展）
  if (finalConfig.reportToServer) {
    // TODO: 实现错误上报逻辑
  }

  // 重新抛出错误
  if (finalConfig.rethrow) {
    throw appError
  }
}

/**
 * 将未知错误转换为 AppError
 */
function normalizeError(error: unknown): AppError {
  // 已经是 AppError
  if (error instanceof AppError) {
    return error
  }

  // 标准 Error 对象
  if (error instanceof Error) {
    return new AppError(error.message, ErrorLevel.ERROR, ErrorCategory.RUNTIME, {
      originalError: error.name,
      stack: error.stack,
    })
  }

  // 字符串错误
  if (typeof error === 'string') {
    return new AppError(error, ErrorLevel.ERROR, ErrorCategory.UNKNOWN)
  }

  // 其他类型
  return new AppError('发生未知错误', ErrorLevel.ERROR, ErrorCategory.UNKNOWN, {
    originalError: error,
  })
}

/**
 * 记录错误到控制台
 */
function logError(error: AppError): void {
  const logMessage = error.toLogFormat()

  switch (error.level) {
    case ErrorLevel.CRITICAL:
    case ErrorLevel.ERROR:
      logger.error(logMessage)
      break
    case ErrorLevel.WARNING:
      logger.warn(logMessage)
      break
    case ErrorLevel.INFO:
      logger.info(logMessage)
      break
    default:
      logger.debug(logMessage)
  }
}

/**
 * 异步函数错误包装器
 */
export function withErrorHandler<T extends (...args: never[]) => Promise<unknown>>(
  fn: T,
  config?: ErrorHandlerConfig
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return (await fn(...args)) as ReturnType<T>
    } catch (error) {
      handleError(error, config)
      throw error
    }
  }) as T
}

/**
 * 同步函数错误包装器
 */
export function withErrorHandlerSync<T extends (...args: never[]) => unknown>(
  fn: T,
  config?: ErrorHandlerConfig
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    try {
      return fn(...args) as ReturnType<T>
    } catch (error) {
      handleError(error, config)
      throw error
    }
  }) as T
}

/**
 * 安全执行异步函数（捕获错误但不抛出）
 */
export async function safeExecute<T>(
  fn: () => Promise<T>,
  defaultValue: T,
  config?: ErrorHandlerConfig
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    handleError(error, { ...config, rethrow: false })
    return defaultValue
  }
}

/**
 * 安全执行同步函数（捕获错误但不抛出）
 */
export function safeExecuteSync<T>(fn: () => T, defaultValue: T, config?: ErrorHandlerConfig): T {
  try {
    return fn()
  } catch (error) {
    handleError(error, { ...config, rethrow: false })
    return defaultValue
  }
}

/**
 * 异步函数错误包装（简化版）
 * 用于 Service 层的错误处理
 */
export async function wrapAsync<T>(
  fn: () => Promise<T>,
  errorMessage: string,
  errorCategory: ErrorCategory = ErrorCategory.UNKNOWN,
  context?: Record<string, unknown>
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    const appError = new AppError(
      errorMessage,
      ErrorLevel.ERROR,
      errorCategory,
      context,
      error instanceof Error ? error : undefined
    )
    logger.error(appError.toLogFormat())
    throw appError
  }
}
