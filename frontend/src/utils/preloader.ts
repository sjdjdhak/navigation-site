/**
 * 图片预加载工具类
 * 支持队列管理、并发控制、错误处理和缓存
 */

interface PreloadTask {
  url: string
  priority: number
  resolve: (img: HTMLImageElement) => void
  reject: (error: Error) => void
}

interface PreloadOptions {
  priority?: number
  timeout?: number
}

export class ImagePreloader {
  private cache = new Map<string, Promise<HTMLImageElement>>()
  private queue: PreloadTask[] = []
  private concurrent = 3
  private processing = 0
  private maxCacheSize = 100

  /**
   * 预加载单张图片
   */
  async preload(url: string, options: PreloadOptions = {}): Promise<HTMLImageElement> {
    const { priority = 0, timeout = 10000 } = options

    // 检查缓存
    if (this.cache.has(url)) {
      return this.cache.get(url)!
    }

    // 创建预加载 Promise
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      this.queue.push({ url, priority, resolve, reject })
      this.queue.sort((a, b) => b.priority - a.priority) // 按优先级排序
      this.processQueue()
    })

    // 添加到缓存
    this.cache.set(url, promise)
    
    // 清理缓存大小
    if (this.cache.size > this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    // 添加超时处理
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Image preload timeout: ${url}`)), timeout)
      })
    ])
  }

  /**
   * 批量预加载图片
   */
  async preloadBatch(urls: string[], options: PreloadOptions = {}): Promise<HTMLImageElement[]> {
    const promises = urls.map(url => this.preload(url, options))
    return Promise.allSettled(promises).then(results => 
      results
        .filter((result): result is PromiseFulfilledResult<HTMLImageElement> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value)
    )
  }

  /**
   * 处理预加载队列
   */
  private async processQueue(): Promise<void> {
    while (this.queue.length > 0 && this.processing < this.concurrent) {
      const task = this.queue.shift()!
      this.processing++
      
      try {
        const img = await this.loadImage(task.url)
        task.resolve(img)
      } catch (error) {
        console.warn(`Failed to preload image: ${task.url}`, error)
        task.reject(error instanceof Error ? error : new Error(String(error)))
        
        // 从缓存中移除失败的项
        this.cache.delete(task.url)
      } finally {
        this.processing--
        
        // 继续处理队列
        if (this.queue.length > 0) {
          setTimeout(() => this.processQueue(), 0)
        }
      }
    }
  }

  /**
   * 加载单张图片
   */
  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      img.onload = () => {
        console.debug(`✅ Image preloaded: ${url}`)
        resolve(img)
      }
      
      img.onerror = () => {
        const error = new Error(`Failed to load image: ${url}`)
        console.debug(`❌ Image preload failed: ${url}`)
        reject(error)
      }
      
      // 设置跨域属性
      img.crossOrigin = 'anonymous'
      img.src = url
    })
  }

  /**
   * 预加载网站图标列表
   */
  async preloadFavicons(domains: string[], size = 64): Promise<void> {
    const { getFaviconUrl } = await import('./favicon-helper')
    
    // 获取图标URL
    const faviconUrls = await Promise.allSettled(
      domains.map(domain => getFaviconUrl(domain, size))
    )
    
    const validUrls = faviconUrls
      .filter((result): result is PromiseFulfilledResult<string> => 
        result.status === 'fulfilled' && !result.value.includes('default-favicon')
      )
      .map(result => result.value)
    
    // 分批预加载，避免并发过高
    const batchSize = 5
    for (let i = 0; i < validUrls.length; i += batchSize) {
      const batch = validUrls.slice(i, i + batchSize)
      await this.preloadBatch(batch, { priority: 1 })
      
      // 批次间添加小延迟，避免阻塞主线程
      if (i + batchSize < validUrls.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.cache.clear()
    console.debug('Image preloader cache cleared')
  }

  /**
   * 获取缓存状态
   */
  getCacheInfo(): { size: number; maxSize: number; processing: number; queue: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      processing: this.processing,
      queue: this.queue.length
    }
  }

  /**
   * 设置并发数
   */
  setConcurrency(count: number): void {
    this.concurrent = Math.max(1, Math.min(10, count))
  }
}

// 创建全局预加载器实例
export const globalPreloader = new ImagePreloader()

/**
 * 便捷的预加载函数
 */
export function preloadImage(url: string, options?: PreloadOptions): Promise<HTMLImageElement> {
  return globalPreloader.preload(url, options)
}

/**
 * 便捷的批量预加载函数
 */
export function preloadImages(urls: string[], options?: PreloadOptions): Promise<HTMLImageElement[]> {
  return globalPreloader.preloadBatch(urls, options)
}

/**
 * 预加载网站图标的便捷函数
 */
export function preloadFavicons(domains: string[], size?: number): Promise<void> {
  return globalPreloader.preloadFavicons(domains, size)
} 