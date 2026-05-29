import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logger } from '../logger'

describe('logger', () => {
  // 保存原始的 console 方法
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
  }

  // Mock console 方法和 localStorage
  beforeEach(() => {
    console.log = vi.fn()
    console.info = vi.fn()
    console.warn = vi.fn()
    console.error = vi.fn()

    // 默认开启调试模式，让测试能够正常运行
    localStorage.setItem('eden-system-settings', JSON.stringify({ debugMode: true }))
  })

  // 恢复原始的 console 方法和清理 localStorage
  afterEach(() => {
    console.log = originalConsole.log
    console.info = originalConsole.info
    console.warn = originalConsole.warn
    console.error = originalConsole.error
    localStorage.clear()
  })

  describe('debug', () => {
    it('应该调用 console.log 输出调试日志', () => {
      logger.debug('test debug message')
      expect(console.log).toHaveBeenCalled()
    })

    it('应该包含时间戳和日志级别', () => {
      logger.debug('test message')
      const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
      expect(calls[0][0]).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[DEBUG\]/)
    })

    it('应该支持多个参数', () => {
      logger.debug('message', 123, { key: 'value' })
      expect(console.log).toHaveBeenCalledWith(expect.stringMatching(/\[DEBUG\]/), 'message', 123, {
        key: 'value',
      })
    })

    it('应该支持对象参数', () => {
      const obj = { name: 'test', value: 42 }
      logger.debug('object:', obj)
      expect(console.log).toHaveBeenCalledWith(expect.stringMatching(/\[DEBUG\]/), 'object:', obj)
    })
  })

  describe('info', () => {
    it('应该调用 console.info 输出信息日志', () => {
      logger.info('test info message')
      expect(console.info).toHaveBeenCalled()
    })

    it('应该包含时间戳和日志级别', () => {
      logger.info('test message')
      const calls = (console.info as ReturnType<typeof vi.fn>).mock.calls
      expect(calls[0][0]).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[INFO\]/)
    })

    it('应该支持多个参数', () => {
      logger.info('message', 456, ['array'])
      expect(console.info).toHaveBeenCalledWith(expect.stringMatching(/\[INFO\]/), 'message', 456, [
        'array',
      ])
    })

    it('应该支持空参数', () => {
      logger.info()
      expect(console.info).toHaveBeenCalledWith(expect.stringMatching(/\[INFO\]/))
    })
  })

  describe('warn', () => {
    it('应该调用 console.warn 输出警告日志', () => {
      logger.warn('test warning message')
      expect(console.warn).toHaveBeenCalled()
    })

    it('应该包含时间戳和日志级别', () => {
      logger.warn('test message')
      const calls = (console.warn as ReturnType<typeof vi.fn>).mock.calls
      expect(calls[0][0]).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[WARN\]/)
    })

    it('应该支持 Error 对象', () => {
      const error = new Error('test error')
      logger.warn('warning:', error)
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringMatching(/\[WARN\]/),
        'warning:',
        error
      )
    })

    it('应该支持字符串和数字混合', () => {
      logger.warn('count:', 10, 'items')
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringMatching(/\[WARN\]/),
        'count:',
        10,
        'items'
      )
    })
  })

  describe('error', () => {
    it('应该调用 console.error 输出错误日志', () => {
      logger.error('test error message')
      expect(console.error).toHaveBeenCalled()
    })

    it('应该包含时间戳和日志级别', () => {
      logger.error('test message')
      const calls = (console.error as ReturnType<typeof vi.fn>).mock.calls
      expect(calls[0][0]).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[ERROR\]/)
    })

    it('应该支持 Error 对象', () => {
      const error = new Error('critical error')
      logger.error('error occurred:', error)
      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(/\[ERROR\]/),
        'error occurred:',
        error
      )
    })

    it('应该支持堆栈跟踪', () => {
      const error = new Error('stack trace test')
      logger.error(error)
      expect(console.error).toHaveBeenCalledWith(expect.stringMatching(/\[ERROR\]/), error)
    })

    it('应该支持多种类型的参数', () => {
      logger.error('error:', 'message', 500, { code: 'ERR_500' })
      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(/\[ERROR\]/),
        'error:',
        'message',
        500,
        { code: 'ERR_500' }
      )
    })
  })

  describe('时间戳格式', () => {
    it('所有日志级别应该使用相同的时间戳格式', () => {
      logger.debug('debug')
      logger.info('info')
      logger.warn('warn')
      logger.error('error')

      const debugCall = (console.log as ReturnType<typeof vi.fn>).mock.calls[0][0]
      const infoCall = (console.info as ReturnType<typeof vi.fn>).mock.calls[0][0]
      const warnCall = (console.warn as ReturnType<typeof vi.fn>).mock.calls[0][0]
      const errorCall = (console.error as ReturnType<typeof vi.fn>).mock.calls[0][0]

      const timestampRegex = /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/
      expect(debugCall).toMatch(timestampRegex)
      expect(infoCall).toMatch(timestampRegex)
      expect(warnCall).toMatch(timestampRegex)
      expect(errorCall).toMatch(timestampRegex)
    })

    it('时间戳应该是有效的 ISO 8601 格式', () => {
      logger.info('test')
      const call = (console.info as ReturnType<typeof vi.fn>).mock.calls[0][0]
      const timestampMatch = call.match(/\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\]/)
      expect(timestampMatch).toBeTruthy()

      if (timestampMatch) {
        const timestamp = timestampMatch[1]
        const date = new Date(timestamp)
        expect(date.toISOString()).toBe(timestamp)
      }
    })
  })

  describe('边界情况', () => {
    it('应该处理 undefined 参数', () => {
      logger.info(undefined)
      expect(console.info).toHaveBeenCalledWith(expect.stringMatching(/\[INFO\]/), undefined)
    })

    it('应该处理 null 参数', () => {
      logger.info(null)
      expect(console.info).toHaveBeenCalledWith(expect.stringMatching(/\[INFO\]/), null)
    })

    it('应该处理空字符串', () => {
      logger.info('')
      expect(console.info).toHaveBeenCalledWith(expect.stringMatching(/\[INFO\]/), '')
    })

    it('应该处理数字 0', () => {
      logger.info(0)
      expect(console.info).toHaveBeenCalledWith(expect.stringMatching(/\[INFO\]/), 0)
    })

    it('应该处理布尔值', () => {
      logger.info(true, false)
      expect(console.info).toHaveBeenCalledWith(expect.stringMatching(/\[INFO\]/), true, false)
    })

    it('应该处理循环引用对象', () => {
      const obj: Record<string, unknown> = { name: 'test' }
      obj.self = obj
      logger.info(obj)
      expect(console.info).toHaveBeenCalledWith(expect.stringMatching(/\[INFO\]/), obj)
    })

    it('应该处理非常长的字符串', () => {
      const longString = 'a'.repeat(10000)
      logger.info(longString)
      expect(console.info).toHaveBeenCalledWith(expect.stringMatching(/\[INFO\]/), longString)
    })

    it('应该处理特殊字符', () => {
      logger.info('特殊字符: \n\t\r\\')
      expect(console.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[INFO\]/),
        '特殊字符: \n\t\r\\'
      )
    })
  })

  describe('调试模式控制', () => {
    it('调试模式关闭时，debug 日志不应该输出', () => {
      localStorage.setItem('eden-system-settings', JSON.stringify({ debugMode: false }))
      logger.debug('test debug message')
      expect(console.log).not.toHaveBeenCalled()
    })

    it('调试模式关闭时，info 日志不应该输出', () => {
      localStorage.setItem('eden-system-settings', JSON.stringify({ debugMode: false }))
      logger.info('test info message')
      expect(console.info).not.toHaveBeenCalled()
    })

    it('调试模式关闭时，warn 日志应该输出', () => {
      localStorage.setItem('eden-system-settings', JSON.stringify({ debugMode: false }))
      logger.warn('test warn message')
      expect(console.warn).toHaveBeenCalled()
    })

    it('调试模式关闭时，error 日志应该输出', () => {
      localStorage.setItem('eden-system-settings', JSON.stringify({ debugMode: false }))
      logger.error('test error message')
      expect(console.error).toHaveBeenCalled()
    })

    it('调试模式开启时，所有级别的日志都应该输出（包括生产环境）', () => {
      localStorage.setItem('eden-system-settings', JSON.stringify({ debugMode: true }))
      logger.debug('debug')
      logger.info('info')
      logger.warn('warn')
      logger.error('error')

      expect(console.log).toHaveBeenCalled()
      expect(console.info).toHaveBeenCalled()
      expect(console.warn).toHaveBeenCalled()
      expect(console.error).toHaveBeenCalled()
    })

    it('localStorage 中没有设置时，应该默认关闭调试模式', () => {
      localStorage.clear()
      logger.debug('test debug message')
      logger.info('test info message')

      expect(console.log).not.toHaveBeenCalled()
      expect(console.info).not.toHaveBeenCalled()
    })

    it('localStorage 数据格式错误时，应该默认关闭调试模式', () => {
      localStorage.setItem('eden-system-settings', 'invalid json')
      logger.debug('test debug message')
      logger.info('test info message')

      expect(console.log).not.toHaveBeenCalled()
      expect(console.info).not.toHaveBeenCalled()
    })
  })
})
