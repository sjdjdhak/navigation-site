/**
 * 安全日志管理器
 * 在生产环境中过滤敏感信息，避免信息泄露
 */

enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

interface LogConfig {
  level: LogLevel
  enableConsole: boolean
  enableRemote: boolean
  filterSensitive: boolean
}

class Logger {
  private config: LogConfig
  private sensitivePatterns: RegExp[] = [
    /ghp_[a-zA-Z0-9]{36}/g, // GitHub classic tokens
    /github_pat_[a-zA-Z0-9_]+/g, // GitHub fine-grained tokens
    /token["\s]*[:=]["\s]*[a-zA-Z0-9_-]+/gi, // Generic token patterns
    /password["\s]*[:=]["\s]*[^\s"]+/gi, // Password patterns
    /api[_-]?key["\s]*[:=]["\s]*[a-zA-Z0-9_-]+/gi, // API key patterns
    /secret["\s]*[:=]["\s]*[a-zA-Z0-9_-]+/gi, // Secret patterns
  ]

  constructor() {
    this.config = {
      level: this.getLogLevel(),
      enableConsole: this.shouldEnableConsole(),
      enableRemote: false,
      filterSensitive: this.shouldFilterSensitive()
    }
  }

  private getLogLevel(): LogLevel {
    const isDev = import.meta.env.DEV
    const debugEnabled = import.meta.env.VITE_DEBUG_LOGGING === 'true'
    
    if (isDev || debugEnabled) {
      return LogLevel.DEBUG
    }
    return LogLevel.WARN
  }

  private shouldEnableConsole(): boolean {
    return import.meta.env.DEV || import.meta.env.VITE_DEBUG_LOGGING === 'true'
  }

  private shouldFilterSensitive(): boolean {
    return import.meta.env.PROD || import.meta.env.VITE_SECURITY_MODE === 'production'
  }

  private filterSensitiveData(message: any): any {
    if (!this.config.filterSensitive) {
      return message
    }

    if (typeof message === 'string') {
      let filtered = message
      this.sensitivePatterns.forEach(pattern => {
        filtered = filtered.replace(pattern, '[REDACTED]')
      })
      return filtered
    }

    if (typeof message === 'object' && message !== null) {
      try {
        const serialized = JSON.stringify(message)
        let filtered = serialized
        this.sensitivePatterns.forEach(pattern => {
          filtered = filtered.replace(pattern, '[REDACTED]')
        })
        return JSON.parse(filtered)
      } catch {
        return '[OBJECT - SERIALIZATION_FAILED]'
      }
    }

    return message
  }

  private formatMessage(level: string, message: any, ...args: any[]): any[] {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level}]`
    
    const filteredMessage = this.filterSensitiveData(message)
    const filteredArgs = args.map(arg => this.filterSensitiveData(arg))
    
    return [prefix, filteredMessage, ...filteredArgs]
  }

  error(message: any, ...args: any[]): void {
    if (this.config.level >= LogLevel.ERROR && this.config.enableConsole) {
      console.error(...this.formatMessage('ERROR', message, ...args))
    }
  }

  warn(message: any, ...args: any[]): void {
    if (this.config.level >= LogLevel.WARN && this.config.enableConsole) {
      console.warn(...this.formatMessage('WARN', message, ...args))
    }
  }

  info(message: any, ...args: any[]): void {
    if (this.config.level >= LogLevel.INFO && this.config.enableConsole) {
      console.info(...this.formatMessage('INFO', message, ...args))
    }
  }

  debug(message: any, ...args: any[]): void {
    if (this.config.level >= LogLevel.DEBUG && this.config.enableConsole) {
      console.debug(...this.formatMessage('DEBUG', message, ...args))
    }
  }

  // 安全的性能日志
  performanceLog(label: string, fn: () => any): any {
    if (!this.config.enableConsole) {
      return fn()
    }

    const start = window.performance.now()
    try {
      const result = fn()
      const end = window.performance.now()
      this.debug(`Performance [${label}]: ${(end - start).toFixed(2)}ms`)
      return result
    } catch (error) {
      const end = window.performance.now()
      this.error(`Performance [${label}] failed after ${(end - start).toFixed(2)}ms:`, error)
      throw error
    }
  }

  // 异步性能日志
  async performanceLogAsync(label: string, fn: () => Promise<any>): Promise<any> {
    if (!this.config.enableConsole) {
      return fn()
    }

    const start = window.performance.now()
    try {
      const result = await fn()
      const end = window.performance.now()
      this.debug(`Performance [${label}]: ${(end - start).toFixed(2)}ms`)
      return result
    } catch (error) {
      const end = window.performance.now()
      this.error(`Performance [${label}] failed after ${(end - start).toFixed(2)}ms:`, error)
      throw error
    }
  }

  // 网络请求日志
  network(method: string, url: string, status?: number, time?: number): void {
    const sanitizedUrl = this.filterSensitiveData(url)
    if (status && time) {
      this.debug(`Network [${method}] ${sanitizedUrl} - ${status} (${time}ms)`)
    } else {
      this.debug(`Network [${method}] ${sanitizedUrl}`)
    }
  }

  // 用户操作日志
  userAction(action: string, details?: any): void {
    const sanitizedDetails = details ? this.filterSensitiveData(details) : undefined
    this.info(`User Action: ${action}`, sanitizedDetails)
  }

  // 安全事件日志
  security(event: string, details?: any): void {
    const sanitizedDetails = details ? this.filterSensitiveData(details) : undefined
    this.warn(`Security Event: ${event}`, sanitizedDetails)
  }

  // 获取配置信息
  getConfig(): LogConfig {
    return { ...this.config }
  }

  // 更新配置
  updateConfig(newConfig: Partial<LogConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}

// 创建全局实例
export const logger = new Logger()

// 便捷导出
export const {
  error,
  warn,
  info,
  debug,
  performanceLog,
  performanceLogAsync,
  network,
  userAction,
  security
} = logger 