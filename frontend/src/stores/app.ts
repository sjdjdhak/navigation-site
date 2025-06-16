import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Theme, ViewMode, FilterOptions } from '@/types'

export const useAppStore = defineStore('app', () => {
  // 状态
  const theme = ref<Theme>('light')
  const sidebarOpen = ref(false)
  const viewMode = ref<ViewMode>('grid')
  const searchQuery = ref('')
  const selectedCategoryPath = ref<string[] | null>(null)
  const filterOptions = ref<FilterOptions>({
    sortBy: 'name',
    sortOrder: 'asc'
  })
  const loading = ref(false)

  // 计算属性
  const isDarkTheme = computed(() => theme.value === 'dark')
  const isGridView = computed(() => viewMode.value === 'grid')
  const hasActiveFilters = computed(() => {
    return !!(
      selectedCategoryPath.value?.length ||
      searchQuery.value ||
      filterOptions.value.tags?.length ||
      filterOptions.value.featured
    )
  })

  // 兼容性计算属性（保持向后兼容）
  const selectedCategory = computed(() => {
    return selectedCategoryPath.value?.[0] || null
  })

  const selectedSubcategory = computed(() => {
    return selectedCategoryPath.value?.[1] || null
  })

  // 动作
  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    updateBodyTheme()
  }

  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme
    updateBodyTheme()
  }

  const updateBodyTheme = () => {
    if (typeof document !== 'undefined') {
      if (theme.value === 'dark') {
        document.body.classList.add('dark-theme')
      } else {
        document.body.classList.remove('dark-theme')
      }
    }
  }

  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value
  }

  const openSidebar = () => {
    sidebarOpen.value = true
  }

  const closeSidebar = () => {
    sidebarOpen.value = false
  }

  const setViewMode = (mode: ViewMode) => {
    viewMode.value = mode
  }

  const toggleViewMode = () => {
    viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid'
  }

  const setSearchQuery = (query: string) => {
    searchQuery.value = query
  }

  const clearSearch = () => {
    searchQuery.value = ''
  }

  const setSelectedCategoryPath = (path: string[] | null) => {
    selectedCategoryPath.value = path
  }

  // 兼容性方法（保持向后兼容）
  const setSelectedCategory = (categoryId: string | null) => {
    if (categoryId) {
      selectedCategoryPath.value = [categoryId]
    } else {
      selectedCategoryPath.value = null
    }
  }

  const setSelectedSubcategory = (subcategoryId: string | null) => {
    if (subcategoryId && selectedCategoryPath.value) {
      // 保持第一级分类，设置第二级
      selectedCategoryPath.value = [selectedCategoryPath.value[0], subcategoryId]
    }
  }

  const updateFilterOptions = (options: Partial<FilterOptions>) => {
    filterOptions.value = { ...filterOptions.value, ...options }
  }

  const clearFilters = () => {
    selectedCategoryPath.value = null
    searchQuery.value = ''
    filterOptions.value = {
      sortBy: 'name',
      sortOrder: 'asc'
    }
  }

  const setLoading = (isLoading: boolean) => {
    loading.value = isLoading
  }

  // 初始化主题
  const initializeTheme = () => {
    // 检查本地存储或系统偏好
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      
      if (savedTheme) {
        setTheme(savedTheme)
      } else if (systemPrefersDark) {
        setTheme('dark')
      }
    }
  }

  return {
    // 状态
    theme,
    sidebarOpen,
    viewMode,
    searchQuery,
    selectedCategoryPath,
    filterOptions,
    loading,
    
    // 计算属性
    isDarkTheme,
    isGridView,
    hasActiveFilters,
    selectedCategory, // 兼容性
    selectedSubcategory, // 兼容性
    
    // 动作
    toggleTheme,
    setTheme,
    toggleSidebar,
    openSidebar,
    closeSidebar,
    setViewMode,
    toggleViewMode,
    setSearchQuery,
    clearSearch,
    setSelectedCategoryPath,
    setSelectedCategory, // 兼容性
    setSelectedSubcategory, // 兼容性
    updateFilterOptions,
    clearFilters,
    setLoading,
    initializeTheme
  }
}) 