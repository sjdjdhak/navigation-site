// 数据服务
import { githubApi } from '@/admin/services/github-api'
import { getFaviconUrl, preloadFavicons } from '@/utils/favicon-helper'

export interface Site {
  id: string
  title: string
  description: string
  url: string
  domain: string
  icon: string
  tags: string[]
  categoryPath: string[]
  featured: boolean
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  icon?: string
  description?: string
  order: number
  expanded?: boolean
  children?: Category[]
}

export interface CategoryConfig {
  version: string
  lastUpdated: string
  config: {
    defaultExpanded: boolean
    showCounts: boolean
    showIcons: boolean
  }
  categories: Category[]
}

class DataService {
  private cache = new Map<string, any>()
  private cacheExpiry = new Map<string, number>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

  // 检查缓存是否有效
  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key)
    return expiry ? Date.now() < expiry : false
  }

  // 设置缓存
  private setCache(key: string, data: any) {
    this.cache.set(key, data)
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION)
  }

  // 清除缓存
  private clearCache(key?: string) {
    if (key) {
      this.cache.delete(key)
      this.cacheExpiry.delete(key)
    } else {
      this.cache.clear()
      this.cacheExpiry.clear()
    }
  }

  // 获取分类配置
  async getCategories(): Promise<CategoryConfig> {
    const cacheKey = 'categories'
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      console.log('从GitHub获取分类配置...')
      const result = await githubApi.getFile('data/categories.json')
      console.log('分类配置获取成功:', result.content)
      
      // 验证数据完整性
      if (!result.content || !result.content.categories) {
        throw new Error('分类配置数据格式无效')
      }
      
      this.setCache(cacheKey, result.content)
      return result.content
    } catch (error) {
      console.error('获取分类配置失败:', error)
      console.log('使用模拟数据作为兜底方案')
      
      // 兜底方案：使用模拟数据
      const mockData = this.getMockCategories()
      this.setCache(cacheKey, mockData)
      return mockData
    }
  }

  // 获取模拟分类数据
  private getMockCategories(): CategoryConfig {
    return {
      version: "1.0",
      lastUpdated: new Date().toISOString(),
      config: {
        defaultExpanded: true,
        showCounts: true,
        showIcons: true
      },
      categories: [
        {
          id: "design-tools",
          name: "设计工具",
          icon: "EditPen",
          description: "UI设计、原型设计、图标资源等设计相关工具",
          order: 1,
          children: [
            {
              id: "ui-design",
              name: "UI设计",
              icon: "Monitor",
              description: "界面设计工具和资源",
              order: 1,
              children: [
                {
                  id: "wireframe",
                  name: "线框图工具",
                  icon: "Document",
                  description: "快速原型和线框图设计",
                  order: 1
                },
                {
                  id: "visual-design",
                  name: "视觉设计",
                  icon: "PictureFilled",
                  description: "UI界面和视觉效果设计",
                  order: 2
                }
              ]
            },
            {
              id: "prototyping",
              name: "原型设计",
              icon: "Setting",
              description: "交互原型设计工具",
              order: 2
            }
          ]
        },
        {
          id: "dev-resources",
          name: "开发资源",
          icon: "DataLine",
          description: "前端框架、API工具、数据库等开发资源",
          order: 2,
          children: [
            {
              id: "frontend",
              name: "前端开发",
              icon: "Monitor",
              description: "前端框架和工具",
              order: 1
            },
            {
              id: "backend",
              name: "后端开发",
              icon: "Grid",
              description: "后端框架和服务",
              order: 2
            }
          ]
        },
        {
          id: "creative-tools",
          name: "创意工具",
          icon: "Finished",
          description: "视频编辑、3D建模、音频制作等创意工具",
          order: 3,
          children: [
            {
              id: "video-editing",
              name: "视频编辑",
              icon: "VideoPlay",
              description: "视频剪辑和后期制作工具",
              order: 1
            },
            {
              id: "audio-production",
              name: "音频制作",
              icon: "Mic",
              description: "音频编辑和音乐制作工具",
              order: 2
            }
          ]
        },
        {
          id: "productivity",
          name: "效率工具",
          icon: "Document",
          description: "任务管理、笔记应用、团队协作等效率工具",
          order: 4,
          children: [
            {
              id: "task-management",
              name: "任务管理",
              icon: "Calendar",
              description: "项目管理和任务跟踪工具",
              order: 1
            },
            {
              id: "note-taking",
              name: "笔记应用",
              icon: "Reading",
              description: "知识管理和笔记工具",
              order: 2
            }
          ]
        },
        {
          id: "learning",
          name: "学习资源",
          icon: "Reading",
          description: "在线课程、技术文档、学习平台等教育资源",
          order: 5,
          children: [
            {
              id: "online-courses",
              name: "在线课程",
              icon: "Trophy",
              description: "编程和设计相关课程平台",
              order: 1
            },
            {
              id: "documentation",
              name: "技术文档",
              icon: "Document",
              description: "技术文档和参考资料",
              order: 2
            }
          ]
        }
      ]
    }
  }

  // 获取模拟网站数据
  private getMockSites(categoryId: string): Site[] {
    const now = new Date().toISOString()
    
    // 根据分类ID返回不同的模拟数据
    switch (categoryId) {
      case 'design-tools':
        return [
          {
            id: 'figma',
            title: 'Figma',
            description: '强大的云端协作设计工具，支持多人实时协作，是现代UI/UX设计的首选工具',
            url: 'https://www.figma.com',
            domain: 'figma.com',
            icon: 'https://www.google.com/s2/favicons?domain=figma.com&sz=64',
            tags: ['设计', '协作', 'UI', '原型', '云端'],
            categoryPath: ['design-tools', 'ui-design', 'visual-design'],
            featured: true,
            createdAt: now,
            updatedAt: now
          },
          {
            id: 'sketch',
            title: 'Sketch',
            description: '专业的矢量图形设计工具，Mac平台上的经典UI设计软件',
            url: 'https://www.sketch.com',
            domain: 'sketch.com',
            icon: 'https://www.google.com/s2/favicons?domain=sketch.com&sz=64',
            tags: ['设计', 'UI', '矢量', 'Mac'],
            categoryPath: ['design-tools', 'ui-design', 'visual-design'],
            featured: false,
            createdAt: now,
            updatedAt: now
          }
        ]
      
      case 'dev-resources':
        return [
          {
            id: 'github',
            title: 'GitHub',
            description: '全球最大的代码托管平台，开发者必备工具',
            url: 'https://github.com',
            domain: 'github.com',
            icon: 'https://www.google.com/s2/favicons?domain=github.com&sz=64',
            tags: ['代码', '版本控制', '开源', '协作'],
            categoryPath: ['dev-resources', 'frontend', 'build-tools'],
            featured: true,
            createdAt: now,
            updatedAt: now
          }
        ]
      
      default:
        return []
    }
  }

  // 更新分类配置
  async updateCategories(categories: CategoryConfig): Promise<void> {
    try {
      categories.lastUpdated = new Date().toISOString()
      
      await githubApi.updateFile(
        'data/categories.json',
        categories,
        `更新分类配置 - ${new Date().toLocaleString()}`
      )
      this.clearCache('categories')
    } catch (error) {
      console.error('更新分类配置失败:', error)
      throw error
    }
  }

  // 创建分类数据文件
  async createCategoryDataFile(categoryId: string, initialData: Site[] = []): Promise<void> {
    try {
      console.log(`创建分类数据文件: ${categoryId}`)
      
      await githubApi.updateFile(
        `data/${categoryId}.json`,
        initialData,
        `创建分类数据文件: ${categoryId} - ${new Date().toLocaleString()}`
      )
      
      // 清除相关缓存
      this.clearCache(`sites-${categoryId}`)
      
      console.log(`分类数据文件创建成功: ${categoryId}`)
    } catch (error) {
      console.error(`创建分类数据文件失败: ${categoryId}`, error)
      throw error
    }
  }

  // 检查分类数据文件是否存在
  async checkCategoryDataFile(categoryId: string): Promise<boolean> {
    try {
      await githubApi.getFile(`data/${categoryId}.json`)
      return true
    } catch (error) {
      // 文件不存在
      return false
    }
  }

  // 确保分类数据文件存在（如果不存在则创建）
  async ensureCategoryDataFile(categoryId: string): Promise<void> {
    const exists = await this.checkCategoryDataFile(categoryId)
    if (!exists) {
      console.log(`分类数据文件不存在，正在创建: ${categoryId}`)
      await this.createCategoryDataFile(categoryId, [])
    }
  }

  // 批量确保分类数据文件存在
  async ensureAllCategoryDataFiles(categories: CategoryConfig): Promise<void> {
    const getAllCategoryIds = (cats: Category[]): string[] => {
      const ids: string[] = []
      for (const cat of cats) {
        ids.push(cat.id)
        if (cat.children) {
          ids.push(...getAllCategoryIds(cat.children))
        }
      }
      return ids
    }

    const allIds = getAllCategoryIds(categories.categories)
    console.log(`检查 ${allIds.length} 个分类的数据文件`)

    // 并发检查和创建
    const tasks = allIds.map(async (id) => {
      try {
        await this.ensureCategoryDataFile(id)
      } catch (error) {
        console.warn(`确保分类数据文件失败: ${id}`, error)
      }
    })

    await Promise.allSettled(tasks)
    console.log('所有分类数据文件检查完成')
  }

  // 获取指定分类的网站数据
  async getSitesByCategory(categoryId: string): Promise<Site[]> {
    const cacheKey = `sites-${categoryId}`
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    try {
      console.log(`从GitHub获取分类 ${categoryId} 的网站数据...`)
      const result = await githubApi.getFile(`data/${categoryId}.json`)
      console.log(`分类 ${categoryId} 数据获取成功，网站数量:`, result.content?.length || 0)
      
      // 验证数据格式
      const sites = Array.isArray(result.content) ? result.content : []
      
      // 验证网站数据完整性
      const validSites = sites.filter(site => 
        site && 
        typeof site.id === 'string' && 
        typeof site.title === 'string' && 
        typeof site.url === 'string'
      )
      
      if (validSites.length !== sites.length) {
        console.warn(`分类 ${categoryId} 中有 ${sites.length - validSites.length} 个无效网站数据`)
      }
      
      this.setCache(cacheKey, validSites)
      return validSites
    } catch (error) {
      // 检查是否是文件不存在错误（404）
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
        console.log(`📁 分类 ${categoryId} 的数据文件不存在，返回空数组`)
        this.setCache(cacheKey, [])
        return []
      }
      
      console.error(`获取分类 ${categoryId} 的网站数据失败:`, error)
      console.log(`使用分类 ${categoryId} 的模拟数据作为兜底方案`)
      
      // 兜底方案：使用模拟数据
      const mockData = this.getMockSites(categoryId)
      this.setCache(cacheKey, mockData)
      return mockData
    }
  }

  // 更新指定分类的网站数据
  async updateSitesByCategory(categoryId: string, sites: Site[]): Promise<void> {
    try {
      await githubApi.updateFile(
        `data/${categoryId}.json`,
        sites,
        `更新分类 ${categoryId} 的网站数据 - ${new Date().toLocaleString()}`
      )
      this.clearCache(`sites-${categoryId}`)
    } catch (error) {
      console.error(`更新分类 ${categoryId} 的网站数据失败:`, error)
      throw error
    }
  }

  // 获取所有网站数据
  async getAllSites(): Promise<{ [categoryId: string]: Site[] }> {
    try {
      const categories = await this.getCategories()
      const allSites: { [categoryId: string]: Site[] } = {}
      
      // 获取所有分类的网站数据
      const promises = categories.categories.map(async (category) => {
        try {
          const sites = await this.getSitesByCategory(category.id)
          allSites[category.id] = sites
        } catch (error) {
          console.warn(`获取分类 ${category.id} 的数据失败:`, error)
          allSites[category.id] = []
        }
      })

      await Promise.all(promises)
      return allSites
    } catch (error) {
      console.error('获取所有网站数据失败:', error)
      throw error
    }
  }

  // 搜索网站
  async searchSites(query: string): Promise<Site[]> {
    try {
      const allSites = await this.getAllSites()
      const results: Site[] = []
      
      Object.values(allSites).forEach(sites => {
        sites.forEach(site => {
          const searchText = `${site.title} ${site.description} ${site.tags.join(' ')}`.toLowerCase()
          if (searchText.includes(query.toLowerCase())) {
            results.push(site)
          }
        })
      })

      return results
    } catch (error) {
      console.error('搜索网站失败:', error)
      throw error
    }
  }

  // 添加网站
  async addSite(site: Omit<Site, 'id' | 'createdAt' | 'updatedAt'>): Promise<Site> {
    try {
      // 生成ID
      const id = this.generateId(site.title)
      
      // 创建完整的网站对象
      const newSite: Site = {
        ...site,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // 确定分类ID
      const categoryId = site.categoryPath[0]
      if (!categoryId) {
        throw new Error('网站必须指定分类')
      }

      // 获取当前分类的网站数据
      const sites = await this.getSitesByCategory(categoryId)
      
      // 检查ID是否重复
      if (sites.some(s => s.id === id)) {
        throw new Error('网站ID已存在')
      }

      // 添加新网站
      sites.push(newSite)
      
      // 更新数据
      await this.updateSitesByCategory(categoryId, sites)
      
      return newSite
    } catch (error) {
      console.error('添加网站失败:', error)
      throw error
    }
  }

  // 更新网站
  async updateSite(siteId: string, updates: Partial<Site>): Promise<Site> {
    try {
      // 查找网站所在的分类
      const allSites = await this.getAllSites()
      let targetCategoryId = ''
      let targetSite: Site | null = null

      for (const [categoryId, sites] of Object.entries(allSites)) {
        const site = sites.find(s => s.id === siteId)
        if (site) {
          targetCategoryId = categoryId
          targetSite = site
          break
        }
      }

      if (!targetSite || !targetCategoryId) {
        throw new Error('网站不存在')
      }

      // 更新网站信息
      const updatedSite: Site = {
        ...targetSite,
        ...updates,
        id: siteId, // 确保ID不被修改
        updatedAt: new Date().toISOString()
      }

      // 检查是否需要移动到其他分类
      const newCategoryId = updatedSite.categoryPath[0]
      
      if (newCategoryId !== targetCategoryId) {
        // 需要移动到新分类
        // 从原分类中删除
        const oldSites = allSites[targetCategoryId].filter(s => s.id !== siteId)
        await this.updateSitesByCategory(targetCategoryId, oldSites)
        
        // 添加到新分类
        const newSites = await this.getSitesByCategory(newCategoryId)
        newSites.push(updatedSite)
        await this.updateSitesByCategory(newCategoryId, newSites)
      } else {
        // 在同一分类内更新
        const sites = allSites[targetCategoryId].map(s => 
          s.id === siteId ? updatedSite : s
        )
        await this.updateSitesByCategory(targetCategoryId, sites)
      }

      return updatedSite
    } catch (error) {
      console.error('更新网站失败:', error)
      throw error
    }
  }

  // 删除网站
  async deleteSite(siteId: string): Promise<void> {
    try {
      // 查找网站所在的分类
      const allSites = await this.getAllSites()
      let targetCategoryId = ''

      for (const [categoryId, sites] of Object.entries(allSites)) {
        if (sites.some(s => s.id === siteId)) {
          targetCategoryId = categoryId
          break
        }
      }

      if (!targetCategoryId) {
        throw new Error('网站不存在')
      }

      // 从分类中删除网站
      const sites = allSites[targetCategoryId].filter(s => s.id !== siteId)
      await this.updateSitesByCategory(targetCategoryId, sites)
    } catch (error) {
      console.error('删除网站失败:', error)
      throw error
    }
  }

  // 批量删除网站
  async deleteSites(siteIds: string[]): Promise<void> {
    try {
      const allSites = await this.getAllSites()
      const updatedCategories: { [categoryId: string]: Site[] } = {}

      // 按分类分组要删除的网站
      for (const siteId of siteIds) {
        for (const [categoryId, sites] of Object.entries(allSites)) {
          if (sites.some(s => s.id === siteId)) {
            if (!updatedCategories[categoryId]) {
              updatedCategories[categoryId] = [...sites]
            }
            updatedCategories[categoryId] = updatedCategories[categoryId].filter(s => s.id !== siteId)
            break
          }
        }
      }

      // 批量更新各个分类
      const promises = Object.entries(updatedCategories).map(([categoryId, sites]) =>
        this.updateSitesByCategory(categoryId, sites)
      )

      await Promise.all(promises)
    } catch (error) {
      console.error('批量删除网站失败:', error)
      throw error
    }

  }

  // 生成网站ID
  private generateId(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 50)
  }

  // 验证网站数据
  validateSite(site: Partial<Site>): string[] {
    const errors: string[] = []

    if (!site.title?.trim()) {
      errors.push('网站标题不能为空')
    }

    if (!site.url?.trim()) {
      errors.push('网站URL不能为空')
    } else if (!this.isValidUrl(site.url)) {
      errors.push('网站URL格式不正确')
    }

    if (!site.description?.trim()) {
      errors.push('网站描述不能为空')
    }

    if (!site.categoryPath?.length) {
      errors.push('必须选择网站分类')
    }

    return errors
  }

  // 验证URL格式
  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  // 获取网站图标URL (使用新的多源兜底机制)
  async getFaviconUrlAsync(domain: string, size: number = 64): Promise<string> {
    return await getFaviconUrl(domain, size)
  }

  // 兼容性方法：同步获取favicon URL (仅用于向后兼容)
  getFaviconUrl(domain: string, size: number = 64): string {
    // 先尝试使用异步方法获取，如果失败则返回默认图标
    getFaviconUrl(domain, size).catch(() => {})
    // 返回Google API作为临时显示
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`
  }

  // 从URL提取域名
  extractDomain(url: string): string {
    try {
      return new URL(url).hostname.replace('www.', '')
    } catch {
      return ''
    }
  }

  // 清除所有缓存
  clearAllCache() {
    this.clearCache()
  }
}

export const dataService = new DataService() 