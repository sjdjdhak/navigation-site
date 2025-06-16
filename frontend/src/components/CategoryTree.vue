<template>
  <div class="category-tree">
    <!-- 树形分类列表 -->
    <ul class="category-list" v-if="categories.length > 0">
      <CategoryNode
        v-for="category in categories"
        :key="category.id"
        :category="category"
        :level="0"
        :selected-path="selectedPath"
        :expanded-categories="expandedCategories"
        :show-icons="showIcons"
        :show-counts="showCounts"
        :tool-counts="toolCounts"
        @select="handleCategorySelect"
        @toggle="handleCategoryToggle"
      />
    </ul>
    
    <!-- 加载状态 -->
    <div v-else-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <span>加载分类中...</span>
    </div>
    
    <!-- 空状态 -->
    <div v-else class="empty-state">
      <i class="fas fa-folder-open"></i>
      <span>暂无分类数据</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import CategoryNode from './CategoryNode.vue'
import type { Category, CategoryConfig } from '@/types'

interface Props {
  categories?: Category[]
  loading?: boolean
  selectedPath?: string[]
  showIcons?: boolean
  showCounts?: boolean
  toolCounts?: Record<string, number>
  defaultExpanded?: string[]
}

interface Emits {
  (e: 'select', path: string[]): void
  (e: 'expand-change', expandedIds: string[]): void
}

const props = withDefaults(defineProps<Props>(), {
  categories: () => [],
  loading: false,
  selectedPath: () => [],
  showIcons: true,
  showCounts: true,
  toolCounts: () => ({}),
  defaultExpanded: () => []
})

const emit = defineEmits<Emits>()

// 响应式状态
const expandedCategories = ref<string[]>([])

// 计算属性
const flattenedCategories = computed(() => {
  const flattened: (Category & { level: number })[] = []
  
  const flatten = (categories: Category[], level = 0) => {
    categories.forEach(category => {
      flattened.push({ ...category, level })
      if (category.children) {
        flatten(category.children, level + 1)
      }
    })
  }
  
  flatten(props.categories)
  return flattened
})

// 初始化展开状态
const initializeExpandedState = () => {
  const expanded = new Set<string>()
  
  // 添加默认展开的分类
  props.defaultExpanded.forEach(id => expanded.add(id))
  
  // 从localStorage恢复用户的展开偏好
  try {
    const savedExpanded = localStorage.getItem('expandedCategories')
    if (savedExpanded) {
      const savedIds = JSON.parse(savedExpanded) as string[]
      savedIds.forEach(id => expanded.add(id))
    }
  } catch (error) {
    console.warn('Failed to load expanded categories from localStorage:', error)
  }
  
  // 如果有选中路径，确保路径上的所有父级都展开
  if (props.selectedPath.length > 0) {
    // 构建完整的父级路径
    const ensureParentExpanded = (categories: Category[], targetPath: string[], currentPath: string[] = []) => {
      categories.forEach(category => {
        const newPath = [...currentPath, category.id]
        
        // 如果当前分类在选中路径中，展开它
        if (targetPath.includes(category.id)) {
          expanded.add(category.id)
        }
        
        // 如果有子分类，递归检查
        if (category.children) {
          ensureParentExpanded(category.children, targetPath, newPath)
        }
      })
    }
    
    ensureParentExpanded(props.categories, props.selectedPath)
  }
  
  expandedCategories.value = Array.from(expanded)
}

// 方法
const handleCategorySelect = (path: string[]) => {
  emit('select', path)
}

const handleCategoryToggle = (categoryId: string) => {
  const index = expandedCategories.value.indexOf(categoryId)
  
  if (index > -1) {
    // 折叠：移除该分类及其所有子分类
    expandedCategories.value.splice(index, 1)
    collapseChildren(categoryId)
  } else {
    // 展开：添加该分类
    expandedCategories.value.push(categoryId)
  }
  
  // 保存到localStorage
  try {
    localStorage.setItem('expandedCategories', JSON.stringify(expandedCategories.value))
  } catch (error) {
    console.warn('Failed to save expanded categories to localStorage:', error)
  }
  
  emit('expand-change', expandedCategories.value)
}

const collapseChildren = (parentId: string) => {
  const findAndCollapseChildren = (categories: Category[]) => {
    categories.forEach(category => {
      if (category.id === parentId && category.children) {
        category.children.forEach(child => {
          const index = expandedCategories.value.indexOf(child.id)
          if (index > -1) {
            expandedCategories.value.splice(index, 1)
          }
          if (child.children) {
            collapseChildren(child.id)
          }
        })
      } else if (category.children) {
        findAndCollapseChildren(category.children)
      }
    })
  }
  
  findAndCollapseChildren(props.categories)
}

const expandPath = (path: string[]) => {
  path.forEach(id => {
    if (!expandedCategories.value.includes(id)) {
      expandedCategories.value.push(id)
    }
  })
  emit('expand-change', expandedCategories.value)
}

const collapsePath = (path: string[]) => {
  path.forEach(id => {
    const index = expandedCategories.value.indexOf(id)
    if (index > -1) {
      expandedCategories.value.splice(index, 1)
    }
  })
  emit('expand-change', expandedCategories.value)
}

const expandAll = () => {
  const allIds = flattenedCategories.value
    .filter(cat => cat.children && cat.children.length > 0)
    .map(cat => cat.id)
  
  expandedCategories.value = allIds
  emit('expand-change', expandedCategories.value)
}

const collapseAll = () => {
  expandedCategories.value = []
  // 清除localStorage中的展开状态
  try {
    localStorage.removeItem('expandedCategories')
  } catch (error) {
    console.warn('Failed to clear expanded categories from localStorage:', error)
  }
  emit('expand-change', expandedCategories.value)
}

const resetExpandedState = () => {
  // 重置为默认状态
  try {
    localStorage.removeItem('expandedCategories')
  } catch (error) {
    console.warn('Failed to clear expanded categories from localStorage:', error)
  }
  initializeExpandedState()
  emit('expand-change', expandedCategories.value)
}

// 监听器
watch(() => props.categories, (newCategories) => {
  if (newCategories && newCategories.length > 0) {
    initializeExpandedState()
  }
}, { immediate: true })

watch(() => props.selectedPath, (newPath) => {
  if (newPath.length > 0) {
    // 确保选中路径上的所有父级都展开
    newPath.forEach(id => {
      if (!expandedCategories.value.includes(id)) {
        expandedCategories.value.push(id)
      }
    })
  }
}, { deep: true })

// 生命周期
onMounted(() => {
  initializeExpandedState()
})

// 暴露方法给父组件
defineExpose({
  expandPath,
  collapsePath,
  expandAll,
  collapseAll,
  resetExpandedState,
  expandedCategories: expandedCategories.value
})
</script>

<style lang="scss" scoped>
.category-tree {
  width: 100%;
}

.category-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--text-secondary);
  text-align: center;
  
  i {
    font-size: 24px;
    margin-bottom: 12px;
    color: var(--text-tertiary);
  }
  
  span {
    font-size: 14px;
  }
}

.loading-state i {
  color: var(--primary);
}

// 滚动条样式
.category-tree {
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: var(--bg-secondary);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 3px;
    
    &:hover {
      background: var(--text-tertiary);
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .loading-state,
  .empty-state {
    padding: 30px 15px;
    
    i {
      font-size: 20px;
      margin-bottom: 8px;
    }
    
    span {
      font-size: 13px;
    }
  }
}
</style> 