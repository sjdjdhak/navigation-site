/**
 * Favicon获取工具类
 * 提供多源获取、错误处理、缓存、智能降级等功能
 */

// Favicon获取源配置 - 重新排序，国内服务优先
const FAVICON_SOURCES = [
  // 国内favicon服务 (优先级最高)
  {
    name: 'iowen',
    url: (domain: string, size = 64) => `https://api.iowen.cn/favicon/${domain}.png`,
    timeout: 3000,
    priority: 1
  },
  {
    name: 'starrydns', 
    url: (domain: string) => `https://api.starrydns.com/tool/favicon?url=${domain}`,
    timeout: 3000,
    priority: 2
  },
  {
    name: 'favicon.link',
    url: (domain: string) => `https://favicon.link/favicon/${domain}`,
    timeout: 4000,
    priority: 3
  },
  
  // 国外服务 (降级使用)
  {
    name: 'google',
    url: (domain: string, size = 64) => `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`,
    timeout: 5000,
    priority: 4
  },
  {
    name: 'yandex',
    url: (domain: string) => `https://favicon.yandex.net/favicon/${domain}`,
    timeout: 5000,
    priority: 5
  },
  {
    name: 'duckduckgo',
    url: (domain: string) => `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    timeout: 5000,
    priority: 6
  },
  
  // 直接获取
  {
    name: 'direct',
    url: (domain: string) => `https://${domain}/favicon.ico`,
    timeout: 3000,
    priority: 7
  }
]

// 本地默认图标 - 使用内联SVG避免404问题
const DEFAULT_FAVICON = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iIzY2N2VlYSIvPgo8cGF0aCBkPSJNMTYgOEMxMi42ODYzIDggMTAgMTAuNjg2MyAxMCAxNEMxMCAxNy4zMTM3IDEyLjY4NjMgMjAgMTYgMjBDMTkuMzEzNyAyMCAyMiAxNy4zMTM3IDIyIDE0QzIyIDEwLjY4NjMgMTkuMzEzNyA4IDE2IDhaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K'

// 缓存管理
const faviconCache = new Map<string, CacheEntry>()
const failedDomains = new Set<string>()
const sourceStats = new Map<string, SourceStats>() // 源的成功率统计
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24小时缓存
const RETRY_DELAY = 60 * 60 * 1000 // 1小时后重试失败的域名
const NETWORK_CHECK_INTERVAL = 5 * 60 * 1000 // 5分钟检查一次网络状态

interface CacheEntry {
  url: string
  timestamp: number
  source: string
}

interface SourceStats {
  attempts: number
  successes: number
  lastSuccess: number
  lastFailure: number
  avgResponseTime: number
  isAvailable: boolean
}

// 网络状态
let networkStatus = {
  isDomestic: true, // 默认认为是国内网络
  lastCheck: 0,
  domesticSources: ['iowen', 'starrydns', 'favicon.link'],
  internationalSources: ['google', 'yandex', 'duckduckgo']
}

/**
 * 初始化源统计
 */
function initSourceStats() {
  FAVICON_SOURCES.forEach(source => {
    if (!sourceStats.has(source.name)) {
      sourceStats.set(source.name, {
        attempts: 0,
        successes: 0,
        lastSuccess: 0,
        lastFailure: 0,
        avgResponseTime: 0,
        isAvailable: true
      })
    }
  })
}

/**
 * 更新源统计信息
 */
function updateSourceStats(sourceName: string, success: boolean, responseTime?: number) {
  const stats = sourceStats.get(sourceName)
  if (!stats) return
  
  stats.attempts++
  
  if (success) {
    stats.successes++
    stats.lastSuccess = Date.now()
    stats.isAvailable = true
    
    if (responseTime) {
      stats.avgResponseTime = stats.avgResponseTime === 0 
        ? responseTime 
        : (stats.avgResponseTime + responseTime) / 2
    }
  } else {
    stats.lastFailure = Date.now()
    
    // 连续失败多次则标记为不可用
    const recentFailures = stats.attempts - stats.successes
    if (recentFailures >= 3) {
      stats.isAvailable = false
    }
  }
  
  // 保存到localStorage
  try {
    localStorage.setItem('favicon-source-stats', JSON.stringify(Array.from(sourceStats.entries())))
  } catch (e) {
    console.debug('Failed to save source stats:', e)
  }
}

/**
 * 从localStorage恢复源统计
 */
function loadSourceStats() {
  try {
    const saved = localStorage.getItem('favicon-source-stats')
    if (saved) {
      const entries = JSON.parse(saved)
      entries.forEach(([name, stats]: [string, SourceStats]) => {
        sourceStats.set(name, stats)
      })
    }
  } catch (e) {
    console.debug('Failed to load source stats:', e)
  }
}

/**
 * 检测网络环境
 */
async function detectNetworkEnvironment(): Promise<void> {
  const now = Date.now()
  
  // 避免频繁检测
  if (now - networkStatus.lastCheck < NETWORK_CHECK_INTERVAL) {
    return
  }
  
  networkStatus.lastCheck = now
  
  try {
    // 快速检测国内服务可用性
    const domesticPromises = networkStatus.domesticSources.slice(0, 2).map(async (sourceName) => {
      const source = FAVICON_SOURCES.find(s => s.name === sourceName)
      if (!source) return false
      
      try {
        const controller = new AbortController()
        setTimeout(() => controller.abort(), 2000) // 2秒超时
        
        const response = await fetch(source.url('baidu.com'), {
          method: 'HEAD',
          signal: controller.signal,
          mode: 'no-cors' // 添加no-cors模式避免CORS问题
        })
        
        return response.ok || response.type === 'opaque' // opaque响应也认为是成功的
      } catch (error) {
        console.debug(`检测源 ${sourceName} 失败:`, error)
        return false
      }
    })
    
    const domesticResults = await Promise.allSettled(domesticPromises)
    const domesticAvailable = domesticResults.some(result => 
      result.status === 'fulfilled' && result.value === true
    )
    
    networkStatus.isDomestic = domesticAvailable
    
    console.debug(`网络环境检测: ${domesticAvailable ? '国内' : '国际'}网络`)
    
  } catch (error) {
    console.debug('网络环境检测失败:', error)
    // 检测失败时保持当前状态
  }
}

/**
 * 获取排序后的源列表
 */
function getSortedSources(): typeof FAVICON_SOURCES {
  const sorted = [...FAVICON_SOURCES].sort((a, b) => {
    const statsA = sourceStats.get(a.name)
    const statsB = sourceStats.get(b.name)
    
    // 不可用的源排到最后
    if (statsA && !statsA.isAvailable && statsB && statsB.isAvailable) return 1
    if (statsB && !statsB.isAvailable && statsA && statsA.isAvailable) return -1
    
    // 根据网络环境调整优先级
    if (networkStatus.isDomestic) {
      const aIsDomestic = networkStatus.domesticSources.includes(a.name)
      const bIsDomestic = networkStatus.domesticSources.includes(b.name)
      
      if (aIsDomestic && !bIsDomestic) return -1
      if (bIsDomestic && !aIsDomestic) return 1
    }
    
    // 按成功率排序
    const successRateA = statsA ? (statsA.successes / Math.max(statsA.attempts, 1)) : 0
    const successRateB = statsB ? (statsB.successes / Math.max(statsB.attempts, 1)) : 0
    
    if (successRateA !== successRateB) {
      return successRateB - successRateA
    }
    
    // 按原始优先级排序
    return a.priority - b.priority
  })
  
  return sorted
}

/**
 * 验证图片URL是否可用
 */
async function validateImageUrl(url: string, sourceName: string, timeout = 5000): Promise<boolean> {
  const startTime = Date.now()
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'force-cache',
      mode: 'no-cors' // 添加no-cors模式处理CORS问题
    })
    
    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime
    
    if (response.ok || response.type === 'opaque') {
      // 对于opaque响应，我们无法检查content-type，但假设是有效的
      const contentType = response.headers.get('content-type')
      const isValid = response.type === 'opaque' || (contentType ? contentType.startsWith('image/') : true)
      
      updateSourceStats(sourceName, isValid, responseTime)
      return isValid
    }
    
    updateSourceStats(sourceName, false, responseTime)
    return false
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.debug(`Favicon validation failed for ${url}:`, error)
    updateSourceStats(sourceName, false, responseTime)
    return false
  }
}

/**
 * 从多个源获取有效的favicon URL
 */
export async function getFaviconUrl(domain: string, size = 64): Promise<string> {
  if (!domain) {
    return DEFAULT_FAVICON
  }
  
  // 初始化
  initSourceStats()
  loadSourceStats()
  
  // 检测网络环境
  await detectNetworkEnvironment()
  
  // 清理域名
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  const cacheKey = `${cleanDomain}-${size}`
  
  // 检查缓存
  const cached = faviconCache.get(cacheKey)
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.debug(`✅ 缓存命中: ${cleanDomain} -> ${cached.source}`)
    return cached.url
  }
  
  // 检查是否是近期失败的域名
  const failedKey = `${cleanDomain}-failed`
  if (failedDomains.has(failedKey)) {
    const failedTime = parseInt(localStorage.getItem(failedKey) || '0')
    if (Date.now() - failedTime < RETRY_DELAY) {
      console.debug(`⏰ 跳过近期失败的域名: ${cleanDomain}`)
      return DEFAULT_FAVICON
    } else {
      // 重试时间已到，清除失败标记
      failedDomains.delete(failedKey)
      localStorage.removeItem(failedKey)
    }
  }
  
  console.debug(`🔍 正在获取 ${cleanDomain} 的favicon (网络环境: ${networkStatus.isDomestic ? '国内' : '国际'})...`)
  
  // 获取排序后的源列表
  const sortedSources = getSortedSources()
  
  // 尝试所有源
  for (let i = 0; i < sortedSources.length; i++) {
    const source = sortedSources[i]
    const url = source.url(cleanDomain, size)
    
    console.debug(`🔄 尝试源 ${source.name} (${i + 1}/${sortedSources.length}): ${url}`)
    
    if (await validateImageUrl(url, source.name, source.timeout)) {
      console.debug(`✅ 源 ${source.name} 获取成功: ${cleanDomain}`)
      
      // 缓存成功的结果
      faviconCache.set(cacheKey, {
        url,
        timestamp: Date.now(),
        source: source.name
      })
      
      return url
    }
  }
  
  // 所有源都失败，记录失败状态并返回默认图标
  console.warn(`❌ 所有favicon源都失败: ${cleanDomain}`)
  failedDomains.add(failedKey)
  localStorage.setItem(failedKey, Date.now().toString())
  
  // 缓存默认图标结果
  faviconCache.set(cacheKey, {
    url: DEFAULT_FAVICON,
    timestamp: Date.now(),
    source: 'default'
  })
  
  return DEFAULT_FAVICON
}

/**
 * 预加载favicon (可选的性能优化)
 */
export function preloadFavicon(domain: string, size = 64): void {
  getFaviconUrl(domain, size).catch(error => {
    console.debug(`Favicon预加载失败 ${domain}:`, error)
  })
}

/**
 * 批量预加载多个域名的favicon
 */
export function preloadFavicons(domains: string[], size = 64): void {
  domains.forEach(domain => {
    const delay = Math.random() * 2000 // 增加延迟范围，避免并发过高
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
 * 重置源统计信息
 */
export function resetSourceStats(): void {
  sourceStats.clear()
  localStorage.removeItem('favicon-source-stats')
  console.debug('源统计信息已重置')
}

/**
 * 强制检测网络环境
 */
export async function forceNetworkCheck(): Promise<void> {
  networkStatus.lastCheck = 0
  await detectNetworkEnvironment()
}

/**
 * 获取缓存和统计信息
 */
export function getFaviconCacheStats() {
  const sources = Array.from(sourceStats.entries()).map(([name, stats]) => ({
    name,
    ...stats,
    successRate: stats.attempts > 0 ? (stats.successes / stats.attempts * 100).toFixed(1) + '%' : '0%'
  }))
  
  return {
    cacheSize: faviconCache.size,
    failedDomains: failedDomains.size,
    networkStatus: networkStatus,
    sources: sources,
    cacheEntries: Array.from(faviconCache.keys())
  }
}

// 初始化
if (typeof window !== 'undefined') {
  // 定期清理缓存 (每小时一次)
  setInterval(cleanupFaviconCache, 60 * 60 * 1000)
  
  // 初始化时进行一次网络检测
  setTimeout(detectNetworkEnvironment, 1000)
} 