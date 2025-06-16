// 标签服务
export interface Tag {
  id: string
  name: string
  color?: string
  description?: string
  usageCount?: number
  createdAt: string
  updatedAt: string
}

class TagService {
  private readonly STORAGE_KEY = 'tags_data'
  private cache: Tag[] | null = null

  // 获取所有标签
  async getAllTags(): Promise<Tag[]> {
    if (this.cache) {
      return [...this.cache]
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const tags = JSON.parse(stored)
        this.cache = tags
        return [...tags]
      }
      
      // 返回默认标签
      const defaultTags = this.getDefaultTags()
      await this.saveToStorage(defaultTags)
      return defaultTags
    } catch (error) {
      console.error('加载标签失败:', error)
      return this.getDefaultTags()
    }
  }

  // 添加标签
  async addTag(tagData: Omit<Tag, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<Tag> {
    const tags = await this.getAllTags()
    
    // 检查标签名是否已存在
    if (tags.some(tag => tag.name === tagData.name)) {
      throw new Error('标签名已存在')
    }

    const newTag: Tag = {
      id: this.generateId(tagData.name),
      name: tagData.name,
      color: tagData.color || '#409eff',
      description: tagData.description || '',
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    tags.push(newTag)
    await this.saveToStorage(tags)
    
    return newTag
  }

  // 更新标签
  async updateTag(tagId: string, updates: Partial<Tag>): Promise<Tag> {
    const tags = await this.getAllTags()
    const tagIndex = tags.findIndex(tag => tag.id === tagId)
    
    if (tagIndex === -1) {
      throw new Error('标签不存在')
    }

    // 检查新名称是否与其他标签冲突
    if (updates.name && updates.name !== tags[tagIndex].name) {
      if (tags.some(tag => tag.name === updates.name && tag.id !== tagId)) {
        throw new Error('标签名已存在')
      }
    }

    const updatedTag: Tag = {
      ...tags[tagIndex],
      ...updates,
      id: tagId, // 确保ID不被修改
      updatedAt: new Date().toISOString()
    }

    tags[tagIndex] = updatedTag
    await this.saveToStorage(tags)
    
    return updatedTag
  }

  // 删除标签
  async deleteTag(tagId: string): Promise<void> {
    const tags = await this.getAllTags()
    const filteredTags = tags.filter(tag => tag.id !== tagId)
    
    if (filteredTags.length === tags.length) {
      throw new Error('标签不存在')
    }

    await this.saveToStorage(filteredTags)
  }

  // 批量删除标签
  async deleteTags(tagIds: string[]): Promise<void> {
    const tags = await this.getAllTags()
    const filteredTags = tags.filter(tag => !tagIds.includes(tag.id))
    await this.saveToStorage(filteredTags)
  }

  // 获取标签选项（用于下拉选择）
  async getTagOptions(): Promise<{ label: string; value: string; color?: string }[]> {
    const tags = await this.getAllTags()
    return tags.map(tag => ({
      label: tag.name,
      value: tag.name,
      color: tag.color
    }))
  }

  // 更新标签使用次数
  async updateTagUsage(tagNames: string[]): Promise<void> {
    const tags = await this.getAllTags()
    let hasChanges = false

    tagNames.forEach(tagName => {
      const tag = tags.find(t => t.name === tagName)
      if (tag) {
        tag.usageCount = (tag.usageCount || 0) + 1
        tag.updatedAt = new Date().toISOString()
        hasChanges = true
      }
    })

    if (hasChanges) {
      await this.saveToStorage(tags)
    }
  }

  // 减少标签使用次数
  async decreaseTagUsage(tagNames: string[]): Promise<void> {
    const tags = await this.getAllTags()
    let hasChanges = false

    tagNames.forEach(tagName => {
      const tag = tags.find(t => t.name === tagName)
      if (tag && (tag.usageCount || 0) > 0) {
        tag.usageCount = (tag.usageCount || 0) - 1
        tag.updatedAt = new Date().toISOString()
        hasChanges = true
      }
    })

    if (hasChanges) {
      await this.saveToStorage(tags)
    }
  }

  // 保存到本地存储
  private async saveToStorage(tags: Tag[]): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tags))
      this.cache = [...tags]
    } catch (error) {
      console.error('保存标签失败:', error)
      throw new Error('保存标签失败')
    }
  }

  // 生成标签ID
  private generateId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 50) + '-' + Date.now()
  }

  // 获取默认标签
  private getDefaultTags(): Tag[] {
    const now = new Date().toISOString()
    return [
      {
        id: 'tool-' + Date.now(),
        name: '工具',
        color: '#409eff',
        description: '实用工具类网站',
        usageCount: 0,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'design-' + Date.now(),
        name: '设计',
        color: '#67c23a',
        description: '设计相关资源',
        usageCount: 0,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'development-' + Date.now(),
        name: '开发',
        color: '#e6a23c',
        description: '开发工具和资源',
        usageCount: 0,
        createdAt: now,
        updatedAt: now
      }
    ]
  }

  // 清除缓存
  clearCache(): void {
    this.cache = null
  }
}

export const tagService = new TagService() 