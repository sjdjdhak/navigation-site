import type { Category, CategoryConfig, Website } from '@/types'
import { githubApi } from '@/admin/services/github-api'

// 数据源接口
export interface DataSource {
  getCategories(): Promise<CategoryConfig>
  getCategoryData(categoryId: string): Promise<Website[]>
  isAvailable(): boolean
}

// 静态文件数据源（当前方式）
export class StaticDataSource implements DataSource {
  async getCategories(): Promise<CategoryConfig> {
    try {
      const categoriesData = await import('@data/categories.json')
      const rawData = categoriesData.default
      
      // 检查数据格式并适配
      if (Array.isArray(rawData)) {
        // 新格式：直接是分类数组
        return {
          version: "1.0",
          lastUpdated: new Date().toISOString(),
          config: {
            defaultExpanded: true,
            showCounts: true,
            showIcons: true
          },
          categories: rawData
        }
      } else if (rawData.categories) {
        // 旧格式：包含CategoryConfig结构
        return rawData as CategoryConfig
      } else {
        throw new Error('Invalid categories data format')
      }
    } catch (error) {
      console.error('StaticDataSource - 加载分类失败:', error)
      throw error
    }
  }

  async getCategoryData(categoryId: string): Promise<Website[]> {
    try {
      const websiteData = await import(`@data/${categoryId}.json`)
      const data = websiteData.default
      
      if (!Array.isArray(data)) {
        throw new Error(`分类 ${categoryId} 的数据格式不正确`)
      }
      
      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes('Failed to fetch') || 
          errorMessage.includes('Failed to resolve') || 
          errorMessage.includes('404')) {
        // 文件不存在，返回空数组
        console.debug(`StaticDataSource - 分类 ${categoryId} 暂无数据文件，返回空数组`)
        return []
      } else {
        console.error(`StaticDataSource - 加载分类数据失败: ${categoryId}`, error)
        throw error
      }
    }
  }

  isAvailable(): boolean {
    return true // 静态文件总是可用的
  }
}

// GitHub API数据源
export class GitHubDataSource implements DataSource {
  private cacheTime = 5 * 60 * 1000 // 5分钟缓存
  private cache = new Map<string, { data: any, timestamp: number }>()
  private apiCallCount = 0
  private lastApiCall = 0
  private rateLimitRemaining = 60 // GitHub API 每小时限制
  private rateLimitReset = 0
  private errorHistory: Array<{ timestamp: number, error: string }> = []

  async getCategories(): Promise<CategoryConfig> {
    try {
      const cacheKey = 'categories'
      const cached = this.cache.get(cacheKey)
      
      // 检查缓存
      if (cached && Date.now() - cached.timestamp < this.cacheTime) {
        console.debug('GitHubDataSource - 使用缓存的分类数据')
        return cached.data
      }

      console.debug('GitHubDataSource - 从GitHub获取分类数据')
      this.recordApiCall()
      const result = await githubApi.getFile('data/categories.json')
      this.updateRateLimit(result.headers)
      
      if (!result.content || !result.content.categories) {
        throw new Error('GitHub API返回的分类配置数据格式无效')
      }

      // 更新缓存
      this.cache.set(cacheKey, {
        data: result.content,
        timestamp: Date.now()
      })

      return result.content
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.recordError(`加载分类失败: ${errorMessage}`)
      console.error('GitHubDataSource - 加载分类失败:', error)
      throw error
    }
  }

  async getCategoryData(categoryId: string): Promise<Website[]> {
    try {
      const cacheKey = `category-${categoryId}`
      const cached = this.cache.get(cacheKey)
      
      // 检查缓存
      if (cached && Date.now() - cached.timestamp < this.cacheTime) {
        console.debug(`GitHubDataSource - 使用缓存的分类数据: ${categoryId}`)
        return cached.data
      }

      console.debug(`GitHubDataSource - 从GitHub获取分类数据: ${categoryId}`)
      this.recordApiCall()
      const result = await githubApi.getFile(`data/${categoryId}.json`)
      this.updateRateLimit(result.headers)
      
      if (!Array.isArray(result.content)) {
        throw new Error(`GitHub API返回的分类 ${categoryId} 数据格式不正确`)
      }

      // 更新缓存
      this.cache.set(cacheKey, {
        data: result.content,
        timestamp: Date.now()
      })

      return result.content
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes('文件不存在') || 
          errorMessage.includes('404')) {
        // 文件不存在，返回空数组
        console.debug(`GitHubDataSource - 分类 ${categoryId} 暂无数据文件，返回空数组`)
        return []
      } else {
        this.recordError(`加载分类数据失败 ${categoryId}: ${errorMessage}`)
        console.error(`GitHubDataSource - 加载分类数据失败: ${categoryId}`, error)
        throw error
      }
    }
  }

  isAvailable(): boolean {
    try {
      return !!githubApi.getConfig()
    } catch {
      return false
    }
  }

  // 清除缓存
  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
    console.debug('GitHubDataSource - 缓存已清除', key || '全部')
  }

  // 记录API调用
  private recordApiCall(): void {
    this.apiCallCount++
    this.lastApiCall = Date.now()
  }

  // 更新速率限制信息
  private updateRateLimit(headers?: Record<string, string>): void {
    if (headers) {
      const remaining = headers['x-ratelimit-remaining']
      const reset = headers['x-ratelimit-reset']
      
      if (remaining) this.rateLimitRemaining = parseInt(remaining, 10)
      if (reset) this.rateLimitReset = parseInt(reset, 10) * 1000
    }
  }

  // 记录错误
  private recordError(error: string): void {
    this.errorHistory.push({
      timestamp: Date.now(),
      error
    })
    
    // 只保留最近10个错误
    if (this.errorHistory.length > 10) {
      this.errorHistory = this.errorHistory.slice(-10)
    }
  }

  // 获取统计信息
  getStats(): {
    apiCallCount: number
    lastApiCall: number
    rateLimitRemaining: number
    rateLimitReset: number
    cacheSize: number
    errorCount: number
    recentErrors: Array<{ timestamp: number, error: string }>
  } {
    return {
      apiCallCount: this.apiCallCount,
      lastApiCall: this.lastApiCall,
      rateLimitRemaining: this.rateLimitRemaining,
      rateLimitReset: this.rateLimitReset,
      cacheSize: this.cache.size,
      errorCount: this.errorHistory.length,
      recentErrors: this.errorHistory.slice(-5) // 最近5个错误
    }
  }
}

// 混合数据源（GitHub优先，静态文件兜底）
export class HybridDataSource implements DataSource {
  private githubSource = new GitHubDataSource()
  private staticSource = new StaticDataSource()
  private fallbackCount = 0
  private lastFallbackTime = 0
  private successfulGitHubCalls = 0

  async getCategories(): Promise<CategoryConfig> {
    // 优先尝试GitHub API
    if (this.githubSource.isAvailable()) {
      try {
        console.debug('HybridDataSource - 尝试从GitHub获取分类数据')
        const result = await this.githubSource.getCategories()
        this.successfulGitHubCalls++
        return result
      } catch (error) {
        console.warn('HybridDataSource - GitHub API失败，回退到静态文件:', error)
        this.recordFallback()
      }
    }

    // 回退到静态文件
    console.debug('HybridDataSource - 使用静态文件获取分类数据')
    return await this.staticSource.getCategories()
  }

  async getCategoryData(categoryId: string): Promise<Website[]> {
    // 优先尝试GitHub API
    if (this.githubSource.isAvailable()) {
      try {
        console.debug(`HybridDataSource - 尝试从GitHub获取分类数据: ${categoryId}`)
        const result = await this.githubSource.getCategoryData(categoryId)
        this.successfulGitHubCalls++
        return result
      } catch (error) {
        console.warn(`HybridDataSource - GitHub API失败，回退到静态文件: ${categoryId}`, error)
        this.recordFallback()
      }
    }

    // 回退到静态文件
    console.debug(`HybridDataSource - 使用静态文件获取分类数据: ${categoryId}`)
    return await this.staticSource.getCategoryData(categoryId)
  }

  isAvailable(): boolean {
    return this.githubSource.isAvailable() || this.staticSource.isAvailable()
  }

  // 清除GitHub缓存
  clearCache(key?: string): void {
    this.githubSource.clearCache(key)
  }

  // 记录回退
  private recordFallback(): void {
    this.fallbackCount++
    this.lastFallbackTime = Date.now()
  }

  // 获取混合数据源统计信息
  getStats(): {
    githubStats: ReturnType<GitHubDataSource['getStats']>
    fallbackCount: number
    lastFallbackTime: number
    successfulGitHubCalls: number
    fallbackRate: number
  } {
    const totalCalls = this.successfulGitHubCalls + this.fallbackCount
    return {
      githubStats: this.githubSource.getStats(),
      fallbackCount: this.fallbackCount,
      lastFallbackTime: this.lastFallbackTime,
      successfulGitHubCalls: this.successfulGitHubCalls,
      fallbackRate: totalCalls > 0 ? (this.fallbackCount / totalCalls) * 100 : 0
    }
  }

  // 强制使用GitHub源
  async forceGitHubRefresh(): Promise<void> {
    this.clearCache()
    // 重新加载数据以清除缓存
    await this.githubSource.getCategories()
  }

  // 健康检查
  async healthCheck(): Promise<{
    github: boolean
    staticSource: boolean
    overall: boolean
  }> {
    const github = this.githubSource.isAvailable()
    const staticSource = this.staticSource.isAvailable()
    
    return {
      github,
      staticSource,
      overall: github || staticSource
    }
  }
}

// 数据源工厂
export class DataSourceFactory {
  private static instance: DataSource | null = null

  static create(type: 'static' | 'github' | 'hybrid' = 'static'): DataSource {
    switch (type) {
      case 'github':
        return new GitHubDataSource()
      case 'hybrid':
        return new HybridDataSource()
      case 'static':
      default:
        return new StaticDataSource()
    }
  }

  static getInstance(type: 'static' | 'github' | 'hybrid' = 'static'): DataSource {
    if (!this.instance) {
      this.instance = this.create(type)
    }
    return this.instance
  }

  static resetInstance(): void {
    this.instance = null
  }
} 