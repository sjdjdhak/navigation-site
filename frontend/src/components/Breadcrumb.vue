<template>
  <nav class="breadcrumb" v-if="breadcrumbItems.length > 0">
    <ol class="breadcrumb-list">
      <li class="breadcrumb-item">
        <button 
          class="breadcrumb-link home-link"
          @click="$emit('navigate', [])"
          title="返回首页"
        >
          <i class="fas fa-home"></i>
          <span>首页</span>
        </button>
      </li>
      
      <li 
        v-for="(item, index) in breadcrumbItems" 
        :key="item.id"
        class="breadcrumb-item"
        :class="{ 'is-active': index === breadcrumbItems.length - 1 }"
      >
        <i class="fas fa-chevron-right breadcrumb-separator"></i>
        
        <button
          v-if="index < breadcrumbItems.length - 1"
          class="breadcrumb-link"
          @click="$emit('navigate', item.path)"
          :title="`跳转到 ${item.name}`"
        >
          <i v-if="item.icon" :class="item.icon" class="breadcrumb-icon"></i>
          <span>{{ item.name }}</span>
        </button>
        
        <span v-else class="breadcrumb-current">
          <i v-if="item.icon" :class="item.icon" class="breadcrumb-icon"></i>
          <span>{{ item.name }}</span>
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Category } from '@/types'

interface BreadcrumbItem {
  id: string
  name: string
  icon?: string
  path: string[]
}

interface Props {
  categoryPath?: string[]
  categories?: Category[]
}

interface Emits {
  (e: 'navigate', path: string[]): void
}

const props = withDefaults(defineProps<Props>(), {
  categoryPath: () => [],
  categories: () => []
})

const emit = defineEmits<Emits>()

// 计算面包屑项目
const breadcrumbItems = computed((): BreadcrumbItem[] => {
  if (!props.categoryPath.length || !props.categories.length) {
    return []
  }

  const items: BreadcrumbItem[] = []
  let currentCategories = props.categories
  
  for (let i = 0; i < props.categoryPath.length; i++) {
    const categoryId = props.categoryPath[i]
    const category = currentCategories.find(cat => cat.id === categoryId)
    
    if (!category) break
    
    items.push({
      id: category.id,
      name: category.name,
      icon: category.icon,
      path: props.categoryPath.slice(0, i + 1)
    })
    
    // 更新当前分类列表为子分类
    currentCategories = category.children || []
  }
  
  return items
})
</script>

<style lang="scss" scoped>
.breadcrumb {
  margin-bottom: 20px;
  padding: 0 4px;
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 4px;
  
  &.is-active {
    .breadcrumb-current {
      color: var(--primary);
      font-weight: 500;
    }
  }
}

.breadcrumb-separator {
  font-size: 10px;
  color: var(--text-tertiary);
  margin: 0 4px;
}

.breadcrumb-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border: none;
  background: none;
  color: var(--text-secondary);
  font-size: 14px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  
  &:hover {
    background-color: var(--hover-bg);
    color: var(--primary);
  }
  
  &:focus {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }
  
  &.home-link {
    color: var(--text-tertiary);
    
    &:hover {
      color: var(--primary);
    }
  }
}

.breadcrumb-current {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
}

.breadcrumb-icon {
  font-size: 12px;
  width: 14px;
  text-align: center;
  flex-shrink: 0;
}

// 响应式设计
@media (max-width: 768px) {
  .breadcrumb {
    margin-bottom: 16px;
    padding: 0 2px;
  }
  
  .breadcrumb-link,
  .breadcrumb-current {
    font-size: 13px;
    padding: 4px 6px;
    gap: 4px;
  }
  
  .breadcrumb-icon {
    font-size: 11px;
    width: 12px;
  }
  
  .breadcrumb-separator {
    font-size: 9px;
    margin: 0 2px;
  }
}

// 长路径处理
@media (max-width: 480px) {
  .breadcrumb-list {
    gap: 2px;
  }
  
  .breadcrumb-link span,
  .breadcrumb-current span {
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style> 