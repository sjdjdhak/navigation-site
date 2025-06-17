import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Website, Category, CategoryConfig, SearchResult } from '@/types'

// 预加载配置接口
interface PreloadConfig {
  enabled: boolean
  maxConcurrent: number
  retryTimes: number
  retryDelay: number
  priorityCategories: string[]
  immediateLoad: string[]
  delayedLoad: {
    priority: string[]
    normal: string[]
  }
}

// 加载状态接口
interface LoadingProgress {
  total: number
  loaded: number
  failed: number
  loading: number
  percentage: number
}

// 默认预加载配置
const DEFAULT_PRELOAD_CONFIG: PreloadConfig = {
  enabled: true,
  maxConcurrent: 3,
  retryTimes: 2,
  retryDelay: 1000,
  priorityCategories: ['design-tools', 'dev-resources', 'productivity'],
  immediateLoad: [], // 立即加载的分类（除了推荐网站）
  delayedLoad: {
    priority: ['design-tools', 'dev-resources', 'productivity'], // 优先预加载
    normal: [] // 普通预加载，将自动包含所有其他分类
  }
}

// 数据适配器：将旧格式转换为新格式
const adaptCategoryData = (rawData: any[]): Category[] => {
  return rawData.map(item => {
    const category: Category = {
      id: item.id,
      name: item.name,
      icon: item.icon,
      description: item.description,
      order: item.order,
      expanded: false // 默认不展开，由expandedCategories统一管理
    }
    
    // 将subcategories转换为children
    if (item.subcategories && item.subcategories.length > 0) {
      category.children = item.subcategories.map((sub: any) => ({
        id: sub.id,
        name: sub.name,
        description: sub.description,
        order: sub.order,
        expanded: false
      }))
    }
    
    return category
  })
}

export const useDataStore = defineStore('data', () => {
  // 状态
  const websites = ref<Website[]>([])
  const categoryConfig = ref<CategoryConfig | null>(null)
  const rawCategoriesData = ref<any[]>([]) // 存储原始数据
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // 懒加载相关状态
  const loadedCategories = ref<Set<string>>(new Set())
  const loadingCategories = ref<Set<string>>(new Set())
  const categoryLoadPromises = ref<Map<string, Promise<void>>>(new Map())

  // 预加载相关状态
  const preloadConfig = ref<PreloadConfig>({ ...DEFAULT_PRELOAD_CONFIG })
  const preloadProgress = ref<LoadingProgress>({
    total: 0,
    loaded: 0,
    failed: 0,
    loading: 0,
    percentage: 0
  })
  const failedCategories = ref<Set<string>>(new Set())
  const retryAttempts = ref<Map<string, number>>(new Map())
  const preloadQueue = ref<string[]>([])
  const isPreloading = ref(false)

  // 计算属性
  const categories = computed(() => {
    if (rawCategoriesData.value.length > 0) {
      return adaptCategoryData(rawCategoriesData.value)
    }
    return categoryConfig.value?.categories || []
  })

  const websitesByCategoryPath = computed(() => {
    const grouped: Record<string, Website[]> = {}
    websites.value.forEach(website => {
      const pathKey = website.categoryPath.join('/')
      if (!grouped[pathKey]) {
        grouped[pathKey] = []
      }
      grouped[pathKey].push(website)
    })
    return grouped
  })

  const featuredWebsites = computed(() => {
    return websites.value.filter(website => website.featured)
  })

  const allTags = computed(() => {
    const tags = new Set<string>()
    websites.value.forEach(website => {
      website.tags.forEach(tag => tags.add(tag))
    })
    return Array.from(tags).sort()
  })

  // 计算每个分类的工具数量
  const toolCounts = computed(() => {
    const counts: Record<string, number> = {}
    
    // 递归计算分类及其子分类的工具数量
    const calculateCounts = (category: Category, path: string[] = []) => {
      const currentPath = [...path, category.id]
      
      // 计算直接属于此分类的工具数量
      const directCount = websites.value.filter(website => 
        website.categoryPath.length === currentPath.length &&
        website.categoryPath.every((id, index) => id === currentPath[index])
      ).length
      
      // 计算子分类的工具数量
      let childrenCount = 0
      if (category.children) {
        category.children.forEach(child => {
          childrenCount += calculateCounts(child, currentPath)
        })
      }
      
      const totalCount = directCount + childrenCount
      counts[category.id] = totalCount
      return totalCount
    }
    
    categories.value.forEach(category => {
      calculateCounts(category)
    })
    
    return counts
  })

  // 扁平化分类列表（用于搜索和查找）
  const flatCategories = computed(() => {
    const flattened: (Category & { path: string[], level: number })[] = []
    
    const flatten = (categories: Category[], path: string[] = [], level = 0) => {
      categories.forEach(category => {
        const currentPath = [...path, category.id]
        flattened.push({ ...category, path: currentPath, level })
        
        if (category.children) {
          flatten(category.children, currentPath, level + 1)
        }
      })
    }
    
    flatten(categories.value)
    return flattened
  })

  // 获取所有顶级分类ID
  const getAllCategoryIds = (): string[] => {
    return categories.value.map(cat => cat.id)
  }

  // 更新预加载进度
  const updatePreloadProgress = () => {
    const total = preloadProgress.value.total
    const loaded = loadedCategories.value.size
    const loading = loadingCategories.value.size
    const failed = failedCategories.value.size
    
    preloadProgress.value = {
      total,
      loaded,
      failed,
      loading,
      percentage: total > 0 ? Math.round((loaded / total) * 100) : 0
    }
  }

  // 动作
  const loadCategories = async () => {
    try {
      loading.value = true
      error.value = null
      
      // 导入根目录的JSON文件
      const categoriesData = await import('@data/categories.json')
      const rawData = categoriesData.default
      
      // 检查数据格式并适配
      if (Array.isArray(rawData)) {
        // 新格式：直接是分类数组
        rawCategoriesData.value = rawData
      } else if (rawData.categories) {
        // 旧格式：包含CategoryConfig结构
        categoryConfig.value = rawData as CategoryConfig
      } else {
        throw new Error('Invalid categories data format')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error loading categories:', err)
    } finally {
      loading.value = false
    }
  }

  // 验证分类ID是否有效
  const isValidCategoryId = (categoryId: string): boolean => {
    // 检查是否是顶级分类
    const topLevelCategory = categories.value.find(cat => cat.id === categoryId)
    return !!topLevelCategory
  }

  // 懒加载特定分类的网站数据
  const loadWebsitesLazy = async (categoryId: string): Promise<void> => {
    // 验证分类ID
    if (!isValidCategoryId(categoryId)) {
      console.warn(`⚠️ 跳过无效分类: ${categoryId}`)
      failedCategories.value.add(categoryId)
      return Promise.resolve()
    }

    // 如果已经加载或正在加载，返回现有的 Promise
    if (loadedCategories.value.has(categoryId)) {
      return Promise.resolve()
    }
    
    if (loadingCategories.value.has(categoryId)) {
      return categoryLoadPromises.value.get(categoryId) || Promise.resolve()
    }

    // 创建加载 Promise
    const loadPromise = (async () => {
      try {
        loadingCategories.value.add(categoryId)
        console.debug(`🔄 懒加载分类数据: ${categoryId}`)
        updatePreloadProgress()
        
        const websiteData = await import(`@data/${categoryId}.json`)
        const data = websiteData.default
        
        // 验证数据格式
        if (!Array.isArray(data)) {
          throw new Error(`分类 ${categoryId} 的数据格式不正确`)
        }
        
        // 移除旧的相同分类数据，避免重复
        websites.value = websites.value.filter(w => 
          !w.categoryPath.includes(categoryId)
        )
        
        // 添加新数据
        websites.value.push(...data)
        loadedCategories.value.add(categoryId)
        failedCategories.value.delete(categoryId) // 清除失败标记
        
        console.debug(`✅ 分类数据加载完成: ${categoryId}, 加载了 ${data.length} 个网站`)
      } catch (err) {
        console.error(`❌ 分类数据加载失败: ${categoryId}`, err)
        failedCategories.value.add(categoryId)
        
        // 不再抛出错误，避免影响其他分类的加载
        console.debug(`⚠️ 分类 ${categoryId} 加载失败，将跳过此分类`)
      } finally {
        loadingCategories.value.delete(categoryId)
        categoryLoadPromises.value.delete(categoryId)
        updatePreloadProgress()
      }
    })()

    categoryLoadPromises.value.set(categoryId, loadPromise)
    return loadPromise
  }

  const loadMultipleCategoriesLazy = async (categoryIds: string[]): Promise<void> => {
    const promises = categoryIds.map(id => loadWebsitesLazy(id))
    await Promise.allSettled(promises)
  }

  // 带重试机制的加载单个分类
  const loadCategoryWithRetry = async (categoryId: string): Promise<boolean> => {
    // 验证分类ID
    if (!isValidCategoryId(categoryId)) {
      console.warn(`⚠️ 跳过无效分类: ${categoryId}`)
      return false
    }

    const maxRetries = preloadConfig.value.retryTimes
    let currentAttempt = retryAttempts.value.get(categoryId) || 0
    
    while (currentAttempt <= maxRetries) {
      try {
        await loadWebsitesLazy(categoryId)
        retryAttempts.value.delete(categoryId)
        return true
      } catch (error) {
        currentAttempt++
        retryAttempts.value.set(categoryId, currentAttempt)
        
        if (currentAttempt <= maxRetries) {
          console.debug(`🔄 重试加载分类 ${categoryId}, 第 ${currentAttempt}/${maxRetries} 次`)
          await new Promise(resolve => setTimeout(resolve, preloadConfig.value.retryDelay))
        } else {
          console.error(`❌ 分类 ${categoryId} 加载失败，已达到最大重试次数`)
          failedCategories.value.add(categoryId)
          return false
        }
      }
    }
    return false
  }

  // 并发控制的批量加载
  const loadCategoriesWithConcurrencyControl = async (categoryIds: string[]): Promise<void> => {
    const { maxConcurrent } = preloadConfig.value
    const chunks: string[][] = []
    
    // 将分类ID分组，每组最多包含maxConcurrent个
    for (let i = 0; i < categoryIds.length; i += maxConcurrent) {
      chunks.push(categoryIds.slice(i, i + maxConcurrent))
    }
    
    // 逐组加载
    for (const chunk of chunks) {
      const promises = chunk.map(id => loadCategoryWithRetry(id))
      await Promise.allSettled(promises)
      
      // 小延迟，避免过于频繁的网络请求
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
  }

  // 全量预加载所有分类
  const preloadAllCategories = async (): Promise<void> => {
    if (!preloadConfig.value.enabled || isPreloading.value) {
      return
    }
    
    isPreloading.value = true
    
    try {
      const allCategoryIds = getAllCategoryIds()
      const unloadedCategories = allCategoryIds.filter(id => !loadedCategories.value.has(id))
      
      if (unloadedCategories.length === 0) {
        console.debug('✅ 所有分类已加载完成')
        return
      }
      
      // 设置总数
      preloadProgress.value.total = allCategoryIds.length
      updatePreloadProgress()
      
      console.debug(`🚀 开始预加载所有分类数据，共 ${unloadedCategories.length} 个分类待加载`)
      
      // 分优先级加载
      const { priorityCategories } = preloadConfig.value
      const priorityToLoad = unloadedCategories.filter(id => priorityCategories.includes(id))
      const normalToLoad = unloadedCategories.filter(id => !priorityCategories.includes(id))
      
      // 先加载优先级分类
      if (priorityToLoad.length > 0) {
        console.debug(`📋 优先加载分类: ${priorityToLoad.join(', ')}`)
        await loadCategoriesWithConcurrencyControl(priorityToLoad)
      }
      
      // 再加载普通分类
      if (normalToLoad.length > 0) {
        console.debug(`📋 普通加载分类: ${normalToLoad.join(', ')}`)
        await loadCategoriesWithConcurrencyControl(normalToLoad)
      }
      
      const finalLoaded = loadedCategories.value.size
      const finalFailed = failedCategories.value.size
      
      console.debug(`✅ 预加载完成！成功: ${finalLoaded}, 失败: ${finalFailed}`)
      
    } catch (error) {
      console.error('❌ 预加载过程中发生错误:', error)
    } finally {
      isPreloading.value = false
      updatePreloadProgress()
    }
  }

  // 渐进式预加载
  const progressivePreload = async (): Promise<void> => {
    if (!preloadConfig.value.enabled) {
      return
    }
    
    const allCategoryIds = getAllCategoryIds()
    preloadProgress.value.total = allCategoryIds.length
    
    const { delayedLoad } = preloadConfig.value
    
    // 第一阶段：优先分类（500ms后）
    setTimeout(async () => {
      const priorityToLoad = delayedLoad.priority.filter(id => 
        allCategoryIds.includes(id) && !loadedCategories.value.has(id)
      )
      
      if (priorityToLoad.length > 0) {
        console.debug(`🎯 第一阶段预加载: ${priorityToLoad.join(', ')}`)
        await loadCategoriesWithConcurrencyControl(priorityToLoad)
      }
    }, 500)
    
    // 第二阶段：剩余分类（2秒后）
    setTimeout(async () => {
      const remainingCategories = allCategoryIds.filter(id => 
        !loadedCategories.value.has(id) && !loadingCategories.value.has(id)
      )
      
      if (remainingCategories.length > 0) {
        console.debug(`🔄 第二阶段预加载: ${remainingCategories.join(', ')}`)
        await loadCategoriesWithConcurrencyControl(remainingCategories)
      }
    }, 2000)
  }

  const preloadPopularCategories = async (): Promise<void> => {
    const popularCategories = ['design-tools', 'dev-resources', 'productivity']
    
    // 延迟预加载，避免影响首屏
    setTimeout(async () => {
      try {
        console.debug('🚀 开始预加载热门分类...')
        await loadMultipleCategoriesLazy(popularCategories)
        console.debug('✅ 热门分类预加载完成')
      } catch (error) {
        console.debug('⚠️ 预加载失败，但不影响正常使用:', error)
      }
    }, 2000)
  }

  const loadWebsites = async (categoryId?: string) => {
    try {
      loading.value = true
      error.value = null
      
      if (categoryId) {
        // 使用懒加载方式加载特定分类
        await loadWebsitesLazy(categoryId)
      } else {
        // 加载所有网站数据
        const allWebsites: Website[] = []
        
        // 遍历所有顶级分类，加载对应的数据文件
        for (const category of categories.value) {
          try {
            const websiteData = await import(`@data/${category.id}.json`)
            allWebsites.push(...websiteData.default)
            loadedCategories.value.add(category.id)
          } catch (err) {
            console.warn(`Failed to load data for category: ${category.id}`, err)
          }
        }
        
        websites.value = allWebsites
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error loading websites:', err)
    } finally {
      loading.value = false
    }
  }

  const searchWebsites = (query: string, categoryPath?: string[]): SearchResult => {
    let filteredWebsites = websites.value

    // 按分类路径筛选
    if (categoryPath && categoryPath.length > 0) {
      filteredWebsites = filteredWebsites.filter(website => {
        // 检查网站的分类路径是否以指定路径开头
        return categoryPath.every((id, index) => 
          website.categoryPath[index] === id
        )
      })
    }

    // 搜索筛选
    if (query.trim()) {
      const searchTerm = query.toLowerCase().trim()
      filteredWebsites = filteredWebsites.filter(website => {
        return (
          website.title.toLowerCase().includes(searchTerm) ||
          website.description.toLowerCase().includes(searchTerm) ||
          website.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
          website.domain.toLowerCase().includes(searchTerm)
        )
      })
    }

    // 提取搜索结果中的分类和标签
    const resultCategories = [...new Set(filteredWebsites.flatMap(w => w.categoryPath))]
    const resultTags = [...new Set(filteredWebsites.flatMap(w => w.tags))]

    return {
      websites: filteredWebsites,
      total: filteredWebsites.length,
      query,
      categories: resultCategories,
      tags: resultTags
    }
  }

  const getWebsitesByPath = (categoryPath: string[]) => {
    return websites.value.filter(website => {
      return categoryPath.every((id, index) => 
        website.categoryPath[index] === id
      )
    })
  }

  const getWebsitesByExactPath = (categoryPath: string[]) => {
    return websites.value.filter(website => {
      return website.categoryPath.length === categoryPath.length &&
        website.categoryPath.every((id, index) => id === categoryPath[index])
    })
  }

  const getCategoryByPath = (categoryPath: string[]): Category | null => {
    let current = categories.value
    let result: Category | null = null
    
    for (const id of categoryPath) {
      const found = current.find(cat => cat.id === id)
      if (!found) return null
      
      result = found
      current = found.children || []
    }
    
    return result
  }

  const getCategoryNames = (categoryPath: string[]): string[] => {
    const names: string[] = []
    let current = categories.value
    
    for (const id of categoryPath) {
      const found = current.find(cat => cat.id === id)
      if (!found) break
      
      names.push(found.name)
      current = found.children || []
    }
    
    return names
  }

  const addWebsite = (website: Website) => {
    websites.value.push(website)
  }

  const updateWebsite = (id: string, updates: Partial<Website>) => {
    const index = websites.value.findIndex(w => w.id === id)
    if (index !== -1) {
      websites.value[index] = { ...websites.value[index], ...updates }
    }
  }

  const removeWebsite = (id: string) => {
    const index = websites.value.findIndex(w => w.id === id)
    if (index !== -1) {
      websites.value.splice(index, 1)
    }
  }

  const clearError = () => {
    error.value = null
  }

  // 检查分类是否已加载
  const isCategoryLoaded = (categoryId: string): boolean => {
    return loadedCategories.value.has(categoryId)
  }

  // 检查分类是否正在加载
  const isCategoryLoading = (categoryId: string): boolean => {
    return loadingCategories.value.has(categoryId)
  }

  // 重试失败的分类
  const retryFailedCategories = async (): Promise<void> => {
    const failedIds = Array.from(failedCategories.value)
    if (failedIds.length === 0) return
    
    console.debug(`🔄 重试失败的分类: ${failedIds.join(', ')}`)
    
    // 清除失败状态
    failedIds.forEach(id => {
      failedCategories.value.delete(id)
      retryAttempts.value.delete(id)
    })
    
    await loadCategoriesWithConcurrencyControl(failedIds)
  }

  // 更新预加载配置
  const updatePreloadConfig = (newConfig: Partial<PreloadConfig>) => {
    preloadConfig.value = { ...preloadConfig.value, ...newConfig }
  }

  // 获取预加载统计信息
  const getPreloadStats = () => {
    return {
      progress: preloadProgress.value,
      isPreloading: isPreloading.value,
      loadedCount: loadedCategories.value.size,
      failedCount: failedCategories.value.size,
      loadedCategories: Array.from(loadedCategories.value),
      failedCategories: Array.from(failedCategories.value),
      config: preloadConfig.value
    }
  }

  // 清除预加载状态
  const clearPreloadState = () => {
    preloadProgress.value = {
      total: 0,
      loaded: 0,
      failed: 0,
      loading: 0,
      percentage: 0
    }
    failedCategories.value.clear()
    retryAttempts.value.clear()
    isPreloading.value = false
  }

  // 优化后的初始化方法
  const initialize = async (strategy: 'lazy' | 'progressive' | 'immediate' = 'progressive') => {
    await loadCategories()
    
    // 设置预加载总数
    const allCategoryIds = getAllCategoryIds()
    preloadProgress.value.total = allCategoryIds.length
    
    // 检查是否有推荐网站，如果没有则加载第一个分类作为示例
    const featuredSites = websites.value.filter(w => w.featured)
    if (featuredSites.length === 0) {
      const firstCategory = categories.value[0]
      if (firstCategory) {
        await loadWebsitesLazy(firstCategory.id)
      }
    }
    
    // 根据策略启动不同的预加载方式
    switch (strategy) {
      case 'immediate':
        // 立即加载所有数据
        setTimeout(() => preloadAllCategories(), 100)
        break
      case 'progressive':
        // 渐进式预加载（默认策略）
        progressivePreload()
        break
      case 'lazy':
        // 只预加载热门分类
        preloadPopularCategories()
        break
    }
  }

  return {
    // 状态
    websites,
    categoryConfig,
    rawCategoriesData,
    loading,
    error,
    
    // 预加载状态
    preloadConfig,
    preloadProgress,
    isPreloading,
    failedCategories: computed(() => Array.from(failedCategories.value)),
    loadedCategories: computed(() => Array.from(loadedCategories.value)),
    
    // 计算属性
    categories,
    websitesByCategoryPath,
    featuredWebsites,
    allTags,
    toolCounts,
    flatCategories,
    
    // 动作
    loadCategories,
    loadWebsites,
    loadWebsitesLazy,
    loadMultipleCategoriesLazy,
    
    // 预加载方法
    preloadAllCategories,
    progressivePreload,
    preloadPopularCategories,
    retryFailedCategories,
    updatePreloadConfig,
    getPreloadStats,
    clearPreloadState,
    
    // 其他方法
    searchWebsites,
    getWebsitesByPath,
    getWebsitesByExactPath,
    getCategoryByPath,
    getCategoryNames,
    addWebsite,
    updateWebsite,
    removeWebsite,
    clearError,
    isCategoryLoaded,
    isCategoryLoading,
    initialize
  }
}) 