import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  AppError,
  NetworkError,
  ValidationError,
  ParseError,
  RuntimeError,
  PermissionError,
  ErrorLevel,
  ErrorCategory,
  handleError,
  setToastCallback,
  withErrorHandler,
  withErrorHandlerSync,
  safeExecute,
  safeExecuteSync,
} from '../errorHandler'
import { logger } from '../logger'

describe('errorHandler', () => {
  // Mock logger
  beforeEach(() => {
    vi.spyOn(logger, 'error').mockImplementation(() => {})
    vi.spyOn(logger, 'warn').mockImplementation(() => {})
    vi.spyOn(logger, 'info').mockImplementation(() => {})
    vi.spyOn(logger, 'debug').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('AppError', () => {
    it('应该创建基本的 AppError', () => {
      const error = new AppError('test error')
      expect(error.message).toBe('test error')
      expect(error.level).toBe(ErrorLevel.ERROR)
      expect(error.category).toBe(ErrorCategory.UNKNOWN)
      expect(error.name).toBe('AppError')
      expect(error.timestamp).toBeInstanceOf(Date)
    })

    it('应该支持自定义级别和类别', () => {
      const error = new AppError('test', ErrorLevel.WARNING, ErrorCategory.NETWORK)
      expect(error.level).toBe(ErrorLevel.WARNING)
      expect(error.category).toBe(ErrorCategory.NETWORK)
    })

    it('应该支持上下文信息', () => {
      const context = { userId: 123, action: 'login' }
      const error = new AppError('test', ErrorLevel.ERROR, ErrorCategory.UNKNOWN, context)
      expect(error.context).toEqual(context)
    })

    it('toLogFormat 应该返回格式化的日志字符串', () => {
      const error = new AppError('test error', ErrorLevel.ERROR, ErrorCategory.NETWORK)
      const logFormat = error.toLogFormat()
      expect(logFormat).toContain('[ERROR]')
      expect(logFormat).toContain('[network]')
      expect(logFormat).toContain('test error')
    })

    it('toLogFormat 应该包含上下文信息', () => {
      const context = { code: 500 }
      const error = new AppError('test', ErrorLevel.ERROR, ErrorCategory.UNKNOWN, context)
      const logFormat = error.toLogFormat()
      expect(logFormat).toContain('上下文')
      expect(logFormat).toContain('"code": 500')
    })

    it('应该保持正确的原型链', () => {
      const error = new AppError('test')
      expect(error instanceof AppError).toBe(true)
      expect(error instanceof Error).toBe(true)
    })
  })

  describe('NetworkError', () => {
    it('应该创建网络错误', () => {
      const error = new NetworkError('connection failed')
      expect(error.name).toBe('NetworkError')
      expect(error.level).toBe(ErrorLevel.ERROR)
      expect(error.category).toBe(ErrorCategory.NETWORK)
      expect(error.message).toBe('connection failed')
    })

    it('应该支持上下文信息', () => {
      const context = { url: 'https://api.example.com', status: 500 }
      const error = new NetworkError('request failed', context)
      expect(error.context).toEqual(context)
    })

    it('应该保持正确的原型链', () => {
      const error = new NetworkError('test')
      expect(error instanceof NetworkError).toBe(true)
      expect(error instanceof AppError).toBe(true)
      expect(error instanceof Error).toBe(true)
    })
  })

  describe('ValidationError', () => {
    it('应该创建验证错误', () => {
      const error = new ValidationError('invalid input')
      expect(error.name).toBe('ValidationError')
      expect(error.level).toBe(ErrorLevel.WARNING)
      expect(error.category).toBe(ErrorCategory.VALIDATION)
    })
  })

  describe('ParseError', () => {
    it('应该创建解析错误', () => {
      const error = new ParseError('JSON parse failed')
      expect(error.name).toBe('ParseError')
      expect(error.level).toBe(ErrorLevel.ERROR)
      expect(error.category).toBe(ErrorCategory.PARSE)
    })
  })

  describe('RuntimeError', () => {
    it('应该创建运行时错误', () => {
      const error = new RuntimeError('null reference')
      expect(error.name).toBe('RuntimeError')
      expect(error.level).toBe(ErrorLevel.ERROR)
      expect(error.category).toBe(ErrorCategory.RUNTIME)
    })
  })

  describe('PermissionError', () => {
    it('应该创建权限错误', () => {
      const error = new PermissionError('access denied')
      expect(error.name).toBe('PermissionError')
      expect(error.level).toBe(ErrorLevel.CRITICAL)
      expect(error.category).toBe(ErrorCategory.PERMISSION)
    })
  })

  describe('handleError', () => {
    it('应该处理 AppError', () => {
      const error = new AppError('test error')
      handleError(error, { showToast: false })
      expect(logger.error).toHaveBeenCalled()
    })

    it('应该处理标准 Error 对象', () => {
      const error = new Error('standard error')
      handleError(error, { showToast: false })
      expect(logger.error).toHaveBeenCalled()
    })

    it('应该处理字符串错误', () => {
      handleError('string error', { showToast: false })
      expect(logger.error).toHaveBeenCalled()
    })

    it('应该处理未知类型错误', () => {
      handleError({ unknown: 'error' }, { showToast: false })
      expect(logger.error).toHaveBeenCalled()
    })

    it('应该根据错误级别调用不同的日志方法', () => {
      handleError(new AppError('critical', ErrorLevel.CRITICAL), { showToast: false })
      expect(logger.error).toHaveBeenCalled()

      vi.clearAllMocks()
      handleError(new AppError('warning', ErrorLevel.WARNING), { showToast: false })
      expect(logger.warn).toHaveBeenCalled()

      vi.clearAllMocks()
      handleError(new AppError('info', ErrorLevel.INFO), { showToast: false })
      expect(logger.info).toHaveBeenCalled()
    })

    it('应该支持 rethrow 配置', () => {
      const error = new AppError('test')
      expect(() => {
        handleError(error, { showToast: false, rethrow: true })
      }).toThrow(AppError)
    })

    it('应该调用 Toast 回调', () => {
      const toastMock = vi.fn()
      setToastCallback(toastMock)

      handleError(new AppError('test', ErrorLevel.ERROR), { showToast: true, logToConsole: false })
      expect(toastMock).toHaveBeenCalledWith('test', 'error')

      vi.clearAllMocks()
      handleError(new AppError('test', ErrorLevel.WARNING), {
        showToast: true,
        logToConsole: false,
      })
      expect(toastMock).toHaveBeenCalledWith('test', 'warning')

      vi.clearAllMocks()
      handleError(new AppError('test', ErrorLevel.INFO), { showToast: true, logToConsole: false })
      expect(toastMock).toHaveBeenCalledWith('test', 'info')

      // 清理
      setToastCallback(() => {})
    })

    it('应该支持禁用日志', () => {
      handleError(new AppError('test'), { logToConsole: false, showToast: false })
      expect(logger.error).not.toHaveBeenCalled()
    })
  })

  describe('withErrorHandler', () => {
    it('应该包装异步函数并处理错误', async () => {
      const fn = async () => {
        throw new Error('async error')
      }
      const wrapped = withErrorHandler(fn, { showToast: false, rethrow: false })

      await expect(wrapped()).rejects.toThrow('async error')
      expect(logger.error).toHaveBeenCalled()
    })

    it('应该正常返回成功的结果', async () => {
      const fn = async (x: number) => x * 2
      const wrapped = withErrorHandler(fn)

      const result = await wrapped(5)
      expect(result).toBe(10)
    })

    it('应该保持函数参数', async () => {
      const fn = async (a: number, b: string) => `${a}-${b}`
      const wrapped = withErrorHandler(fn)

      const result = await wrapped(42, 'test')
      expect(result).toBe('42-test')
    })
  })

  describe('withErrorHandlerSync', () => {
    it('应该包装同步函数并处理错误', () => {
      const fn = () => {
        throw new Error('sync error')
      }
      const wrapped = withErrorHandlerSync(fn, { showToast: false, rethrow: false })

      expect(() => wrapped()).toThrow('sync error')
      expect(logger.error).toHaveBeenCalled()
    })

    it('应该正常返回成功的结果', () => {
      const fn = (x: number) => x * 2
      const wrapped = withErrorHandlerSync(fn)

      const result = wrapped(5)
      expect(result).toBe(10)
    })
  })

  describe('safeExecute', () => {
    it('应该返回成功的结果', async () => {
      const fn = async () => 'success'
      const result = await safeExecute(fn, 'default')
      expect(result).toBe('success')
    })

    it('应该在错误时返回默认值', async () => {
      const fn = async () => {
        throw new Error('failed')
      }
      const result = await safeExecute(fn, 'default', { showToast: false })
      expect(result).toBe('default')
      expect(logger.error).toHaveBeenCalled()
    })

    it('应该不抛出错误', async () => {
      const fn = async () => {
        throw new Error('failed')
      }
      await expect(safeExecute(fn, 'default', { showToast: false })).resolves.toBe('default')
    })
  })

  describe('safeExecuteSync', () => {
    it('应该返回成功的结果', () => {
      const fn = () => 'success'
      const result = safeExecuteSync(fn, 'default')
      expect(result).toBe('success')
    })

    it('应该在错误时返回默认值', () => {
      const fn = () => {
        throw new Error('failed')
      }
      const result = safeExecuteSync(fn, 'default', { showToast: false })
      expect(result).toBe('default')
      expect(logger.error).toHaveBeenCalled()
    })

    it('应该不抛出错误', () => {
      const fn = () => {
        throw new Error('failed')
      }
      expect(() => safeExecuteSync(fn, 'default', { showToast: false })).not.toThrow()
    })
  })
})
