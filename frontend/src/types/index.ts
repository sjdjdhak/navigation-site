// 网站资源类型
export interface Website {
  id: string
  title: string
  description: string
  url: string
  domain: string
  icon?: string
  tags: string[]
  categoryPath: string[]
  featured?: boolean
  createdAt: string
  updatedAt: string
}

// 递归分类类型
export interface Category {
  id: string
  name: string
  icon?: string
  description?: string
  order: number
  expanded?: boolean
  children?: Category[]
}

// 分类配置类型
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

// 子分类类型（保留兼容性）
export interface Subcategory {
  id: string
  name: string
  description?: string
  order: number
}

// 搜索结果类型
export interface SearchResult {
  websites: Website[]
  total: number
  query: string
  categories: string[]
  tags: string[]
}

// 分类路径类型
export interface CategoryPath {
  path: string[]
  names: string[]
  level: number
}

// 分类统计类型
export interface CategoryStats {
  categoryId: string
  totalCount: number
  featuredCount: number
  childrenStats?: CategoryStats[]
}

// 主题类型
export type Theme = 'light' | 'dark'

// 视图模式类型
export type ViewMode = 'grid' | 'list'

// 排序方式类型
export type SortBy = 'name' | 'date' | 'category' | 'featured'

// 筛选选项类型
export interface FilterOptions {
  categoryPath?: string[]
  tags?: string[]
  featured?: boolean
  sortBy?: SortBy
  sortOrder?: 'asc' | 'desc'
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

// 分页类型
export interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

// 分页数据类型
export interface PaginatedData<T> {
  items: T[]
  pagination: Pagination
}

// 应用状态类型
export interface AppState {
  theme: Theme
  sidebarOpen: boolean
  viewMode: ViewMode
  searchQuery: string
  selectedCategoryPath: string[] | null
  filterOptions: FilterOptions
}

// 用户配置类型
export interface UserConfig {
  layout: 'tree' | 'list' | 'grid'
  theme: Theme
  categories: {
    expanded: string[]
    hidden: string[]
    customOrder?: string[]
  }
  performance: {
    enableVirtualScroll: boolean
    enableLazyLoad: boolean
    cacheEnabled: boolean
  }
}

// 用户偏好设置类型
export interface UserPreferences {
  theme: Theme
  viewMode: ViewMode
  sidebarCollapsed: boolean
  defaultCategoryPath?: string[]
  itemsPerPage: number
} 