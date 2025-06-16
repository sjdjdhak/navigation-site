/**
 * Favicon获取工具类
 * 提供多源获取、错误处理、缓存等功能
 */

// Favicon获取源配置
const FAVICON_SOURCES = [
  // Google Favicon API (主要源)
  (domain: string, size = 64) => `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`,
  
  // Yandex Favicon API (备用源1)
  (domain: string) => `https://favicon.yandex.net/favicon/${domain}`,
  
  // DuckDuckGo Favicon API (备用源2)
  (domain: string) => `https://icons.duckduckgo.com/ip3/${domain}.ico`,
  
  // 直接从域名获取 (备用源3)
  (domain: string) => `https://${domain}/favicon.ico`,
  
  // 本地默认图标 (兜底方案)
  () => '/assets/default-favicon.svg'
]

// 缓存管理
const faviconCache = new Map<string, CacheEntry>()
const failedDomains = new Set<string>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24小时缓存
const RETRY_DELAY = 60 * 60 * 1000 // 1小时后重试失败的域名

interface CacheEntry {
  url: string
  timestamp: number
}

/**
 * 验证图片URL是否可用
 */
async function validateImageUrl(url: string, timeout = 5000): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    const response = await fetch(url, {
      method: 'HEAD', // 只获取头部信息，节省流量
      signal: controller.signal,
      cache: 'force-cache' // 使用缓存
    })
    
    clearTimeout(timeoutId)
    
    // 检查响应状态和内容类型
    if (response.ok) {
      const contentType = response.headers.get('content-type')
      return contentType ? contentType.startsWith('image/') : true
    }
    
    return false
  } catch (error) {
    console.debug(`Favicon validation failed for ${url}:`, error)
    return false
  }
}

/**
 * 从多个源获取有效的favicon URL
 */
export async function getFaviconUrl(domain: string, size = 64): Promise<string> {
  if (!domain) {
    return FAVICON_SOURCES[FAVICON_SOURCES.length - 1]('', size) // 返回默认图标
  }
  
  // 清理域名
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  const cacheKey = `${cleanDomain}-${size}`
  
  // 检查缓存
  const cached = faviconCache.get(cacheKey)
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.url
  }
  
  // 检查是否是近期失败的域名
  const failedKey = `${cleanDomain}-failed`
  if (failedDomains.has(failedKey)) {
    const failedTime = parseInt(localStorage.getItem(failedKey) || '0')
    if (Date.now() - failedTime < RETRY_DELAY) {
      const defaultUrl = FAVICON_SOURCES[FAVICON_SOURCES.length - 1]('', size)
      return defaultUrl
    } else {
      // 重试时间已到，清除失败标记
      failedDomains.delete(failedKey)
      localStorage.removeItem(failedKey)
    }
  }
  
  console.debug(`正在获取 ${cleanDomain} 的favicon...`)
  
  // 尝试所有源
  for (let i = 0; i < FAVICON_SOURCES.length - 1; i++) {
    const source = FAVICON_SOURCES[i]
    const url = source(cleanDomain, size)
    
    console.debug(`尝试源 ${i + 1}: ${url}`)
    
    if (await validateImageUrl(url)) {
      console.debug(`✅ 源 ${i + 1} 获取成功: ${cleanDomain}`)
      
      // 缓存成功的结果
      faviconCache.set(cacheKey, {
        url,
        timestamp: Date.now()
      })
      
      return url
    }
  }
  
  // 所有源都失败，记录失败状态并返回默认图标
  console.warn(`❌ 所有favicon源都失败: ${cleanDomain}`)
  failedDomains.add(failedKey)
  localStorage.setItem(failedKey, Date.now().toString())
  
  const defaultUrl = FAVICON_SOURCES[FAVICON_SOURCES.length - 1]('', size)
  
  // 缓存默认图标结果
  faviconCache.set(cacheKey, {
    url: defaultUrl,
    timestamp: Date.now()
  })
  
  return defaultUrl
}

/**
 * 预加载favicon (可选的性能优化)
 */
export function preloadFavicon(domain: string, size = 64): void {
  // 异步预加载，不阻塞主流程
  getFaviconUrl(domain, size).catch(error => {
    console.debug(`Favicon预加载失败 ${domain}:`, error)
  })
}

/**
 * 批量预加载多个域名的favicon
 */
export function preloadFavicons(domains: string[], size = 64): void {
  domains.forEach(domain => {
    // 添加随机延迟，避免同时发起太多请求
    const delay = Math.random() * 1000
    setTimeout(() => preloadFavicon(domain, size), delay)
  })
}

/**
 * 清理过期缓存
 */
export function cleanupFaviconCache(): void {
  const now = Date.now()
  
  for (const [key, entry] of faviconCache.entries()) {
    if (now - (entry as CacheEntry).timestamp > CACHE_DURATION) {
      faviconCache.delete(key)
    }
  }
  
  console.debug(`缓存清理完成，当前缓存条目: ${faviconCache.size}`)
}

/**
 * 获取缓存统计信息
 */
export function getFaviconCacheStats() {
  return {
    cacheSize: faviconCache.size,
    failedDomains: failedDomains.size,
    cacheEntries: Array.from(faviconCache.keys())
  }
}

// 定期清理缓存 (每小时一次)
if (typeof window !== 'undefined') {
  setInterval(cleanupFaviconCache, 60 * 60 * 1000)
} 