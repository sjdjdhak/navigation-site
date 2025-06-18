<template>
  <li class="category-node" :class="{ 'has-children': hasChildren, 'is-expanded': isExpanded }">
    <!-- 分类头部 -->
    <div 
      class="category-header"
      :class="{ 
        'is-selected': isSelected,
        'is-active': isActive
      }"
      :style="{ paddingLeft: `${level * 16 + 12}px` }"
      @click="handleClick"
    >
      <!-- 展开/折叠图标 -->
      <button 
        v-if="hasChildren"
        class="expand-button"
        @click.stop="toggleExpanded"
        :aria-label="isExpanded ? '折叠' : '展开'"
      >
        <i class="fas fa-chevron-right expand-icon" :class="{ 'expanded': isExpanded }"></i>
      </button>
      
      <!-- 分类信息 -->
      <div class="category-info">
        <i v-if="category.icon && showIcons" :class="category.icon" class="category-icon"></i>
        <span class="category-name">{{ category.name }}</span>
        <span v-if="showCounts && toolCount > 0" class="tool-count">{{ toolCount }}</span>
      </div>
    </div>
    
    <!-- 子分类 -->
    <ul v-if="hasChildren && isExpanded" class="children-list">
      <CategoryNode
        v-for="child in category.children"
        :key="child.id"
        :category="child"
        :level="level + 1"
        :selected-path="selectedPath"
        :expanded-categories="expandedCategories"
        :show-icons="showIcons"
        :show-counts="showCounts"
        :tool-counts="toolCounts"
        :parent-path="currentPath"
        @select="$emit('select', $event)"
        @toggle="$emit('toggle', $event)"
      />
    </ul>
  </li>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Category } from '@/types'

interface Props {
  category: Category
  level?: number
  selectedPath?: string[]
  expandedCategories?: string[]
  showIcons?: boolean
  showCounts?: boolean
  toolCounts?: Record<string, number>
  parentPath?: string[]
}

interface Emits {
  (e: 'select', path: string[] | null): void
  (e: 'toggle', categoryId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  level: 0,
  selectedPath: () => [],
  expandedCategories: () => [],
  showIcons: true,
  showCounts: true,
  toolCounts: () => ({}),
  parentPath: () => []
})

const emit = defineEmits<Emits>()

// 计算属性
const hasChildren = computed(() => {
  return props.category.children && props.category.children.length > 0
})

const isExpanded = computed(() => {
  return props.expandedCategories.includes(props.category.id)
})

const isSelected = computed(() => {
  return props.selectedPath.includes(props.category.id)
})

const isActive = computed(() => {
  return props.selectedPath[props.selectedPath.length - 1] === props.category.id
})

const toolCount = computed(() => {
  return props.toolCounts[props.category.id] || 0
})

const currentPath = computed(() => {
  // 使用父级路径来构建完整路径，而不是依赖selectedPath
  return [...props.parentPath, props.category.id]
})

// 方法
const handleClick = () => {
  // 🎯 实现点击切换逻辑
  // 检查当前分类路径是否与已选中的路径完全匹配
  const currentlySelected = props.selectedPath.length === currentPath.value.length &&
    props.selectedPath.every((id, index) => id === currentPath.value[index])
  
  if (currentlySelected) {
    // 如果当前分类已选中，点击取消选中（返回推荐状态）
    emit('select', null)
  } else {
    // 如果当前分类未选中，点击选中该分类
    emit('select', currentPath.value)
  }
  
  // 如果有子分类且当前未展开，则展开
  if (hasChildren.value && !isExpanded.value) {
    toggleExpanded()
  }
}

const toggleExpanded = () => {
  emit('toggle', props.category.id)
}
</script>

<style lang="scss" scoped>
.category-node {
  list-style: none;
  
  &.has-children {
    .category-header {
      cursor: pointer;
    }
  }
}

.category-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
  position: relative;
  min-height: 40px;
  cursor: pointer;
  
  &:hover {
    background-color: var(--hover-bg);
    
    .category-name {
      color: var(--primary);
    }
    
    .expand-icon {
      color: var(--primary);
    }
  }
  
  &.is-selected {
    background-color: var(--primary-bg);
    
    .category-name {
      color: var(--primary);
      font-weight: 500;
    }
    
    &:hover {
      background-color: var(--primary-light, var(--primary-bg));
      
      .category-name {
        color: var(--primary-dark, var(--primary));
      }
      
      &::after {
        content: '';
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background-color: var(--primary);
        opacity: 0.6;
      }
    }
  }
  
  &.is-active {
    background-color: var(--primary);
    color: white;
    
    .category-name,
    .category-icon,
    .tool-count {
      color: white;
    }
    
    .expand-icon {
      color: white;
    }
    
    &:hover {
      background-color: var(--primary-dark, var(--primary));
      
      &::after {
        content: '';
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background-color: white;
        opacity: 0.8;
      }
    }
  }
}

.expand-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: var(--radius-sm);
  margin-right: 8px;
  flex-shrink: 0;
  
  &:hover {
    background-color: var(--hover-bg);
  }
}

.expand-icon {
  font-size: 12px;
  color: var(--text-tertiary);
  transition: transform 0.2s ease;
  
  &.expanded {
    transform: rotate(90deg);
  }
}

.category-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0; // 防止文本溢出
}

.category-icon {
  font-size: 14px;
  color: var(--text-secondary);
  width: 16px;
  text-align: center;
  flex-shrink: 0;
}

.category-name {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 400;
  transition: color 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.tool-count {
  font-size: 12px;
  color: var(--text-tertiary);
  background-color: var(--bg-secondary);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-weight: 500;
  flex-shrink: 0;
}

.children-list {
  list-style: none;
  padding: 0;
  margin: 0;
  
  // 添加连接线效果（可选）
  .category-node {
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      left: calc(var(--level) * 16px + 22px);
      top: 0;
      bottom: 50%;
      width: 1px;
      background-color: var(--border-light);
    }
    
    &:last-child::before {
      display: none;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .category-header {
    padding: 10px 8px;
    min-height: 44px;
  }
  
  .category-name {
    font-size: 15px;
  }
  
  .expand-button {
    width: 24px;
    height: 24px;
  }
}
</style> 