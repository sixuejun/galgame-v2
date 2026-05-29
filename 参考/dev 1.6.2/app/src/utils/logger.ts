/**
 * 日志级别
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * 日志工具类
 * 支持调试模式开关控制日志输出
 */
class Logger {
  /**
   * 获取调试模式状态
   * 从 localStorage 直接读取，避免循环依赖
   */
  private getDebugMode(): boolean {
    try {
      // 从 localStorage 直接读取设置，避免循环依赖
      const settingsJson = localStorage.getItem('eden-system-settings')
      if (settingsJson) {
        const settings = JSON.parse(settingsJson)
        return settings.debugMode ?? false
      }
      return false
    } catch {
      // 如果无法获取设置（例如在初始化阶段），默认返回 false
      return false
    }
  }

  /**
   * 内部日志方法
   */
  private log(level: LogLevel, ...args: unknown[]) {
    // 获取调试模式状态
    const debugMode = this.getDebugMode()

    // 日志输出规则：
    // 1. error 级别：总是输出
    // 2. warn 级别：总是输出
    // 3. info 和 debug 级别：
    //    - 调试模式开启：输出（无论开发还是生产环境）
    //    - 调试模式关闭：不输出
    if (level === 'error' || level === 'warn') {
      // error 和 warn 总是输出
    } else if (level === 'info' || level === 'debug') {
      // info 和 debug 需要检查调试模式
      // 注意：调试模式开启时，即使在生产环境也输出日志
      if (!debugMode) {
        return // 调试模式关闭时不输出
      }
    }

    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`

    switch (level) {
      case 'debug':
        console.log(prefix, ...args)
        break
      case 'info':
        console.info(prefix, ...args)
        break
      case 'warn':
        console.warn(prefix, ...args)
        break
      case 'error':
        console.error(prefix, ...args)
        break
    }
  }

  /**
   * 调试日志（仅在调试模式开启时输出）
   */
  debug(...args: unknown[]) {
    this.log('debug', ...args)
  }

  /**
   * 信息日志（仅在调试模式开启时输出）
   */
  info(...args: unknown[]) {
    this.log('info', ...args)
  }

  /**
   * 警告日志（总是输出）
   */
  warn(...args: unknown[]) {
    this.log('warn', ...args)
  }

  /**
   * 错误日志（总是输出）
   */
  error(...args: unknown[]) {
    this.log('error', ...args)
  }
}

/**
 * 导出单例 logger 实例
 */
export const logger = new Logger()
