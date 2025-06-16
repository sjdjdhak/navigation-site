import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Website, Category, CategoryConfig, SearchResult } from '@/types'

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

  const loadWebsites = async (categoryId?: string) => {
    try {
      loading.value = true
      error.value = null
      
      if (categoryId) {
        // 加载特定分类的网站
        const websiteData = await import(`@data/${categoryId}.json`)
        const data = websiteData.default
        
        // 替换特定分类的网站
        websites.value = websites.value.filter(w => 
          !w.categoryPath.includes(categoryId)
        )
        websites.value.push(...data)
      } else {
        // 加载所有网站数据
        const allWebsites: Website[] = []
        
        // 遍历所有顶级分类，加载对应的数据文件
        for (const category of categories.value) {
          try {
            const websiteData = await import(`@data/${category.id}.json`)
            allWebsites.push(...websiteData.default)
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

  // 初始化数据
  const initialize = async () => {
    await loadCategories()
    await loadWebsites()
  }

  return {
    // 状态
    websites,
    categoryConfig,
    rawCategoriesData,
    loading,
    error,
    
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
    searchWebsites,
    getWebsitesByPath,
    getWebsitesByExactPath,
    getCategoryByPath,
    getCategoryNames,
    addWebsite,
    updateWebsite,
    removeWebsite,
    clearError,
    initialize
  }
}) 