<template>
  <div class="category-tag-wrapper">
    <!-- 主分类标签 -->
    <div 
      class="category-tag"
      :class="{ 
        'has-tooltip': showTooltip,
        'clickable': clickable,
        [`size-${size}`]: size !== 'small',
        [categoryColorClass]: categoryColorClass
      }"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      @click="handleClick"
    >
      <i v-if="categoryIcon" :class="categoryIcon" class="category-icon"></i>
      <span class="category-name">{{ displayName }}</span>
    </div>
    
    <!-- 悬停时显示的完整路径工具提示 -->
    <Teleport to="body">
      <div
        v-if="showTooltip && tooltipVisible"
        ref="tooltipRef"
        class="category-tooltip"
        :style="tooltipStyle"
      >
        <div class="breadcrumb">
          <span 
            v-for="(name, index) in categoryNames" 
            :key="index"
            class="breadcrumb-item"
          >
            {{ name }}
            <i 
              v-if="index < categoryNames.length - 1" 
              class="fas fa-chevron-right breadcrumb-separator"
            ></i>
          </span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useDataStore } from '@/stores/data'

interface Props {
  categoryPath: string[]
  clickable?: boolean
  showIcon?: boolean
  size?: 'small' | 'medium'
}

interface Emits {
  (e: 'click', categoryPath: string[]): void
}

const props = withDefaults(defineProps<Props>(), {
  clickable: true,
  showIcon: true,
  size: 'small'
})

const emit = defineEmits<Emits>()

const dataStore = useDataStore()

// 响应式状态
const tooltipVisible = ref(false)
const tooltipRef = ref<HTMLElement>()
const tooltipStyle = ref({})

// 计算属性
const categoryNames = computed(() => {
  return dataStore.getCategoryNames(props.categoryPath)
})

const displayName = computed(() => {
  // 显示最后一级分类名称
  const names = categoryNames.value
  if (names.length === 0) {
    // 如果没有获取到分类名称，可能是数据还在加载
    return props.categoryPath.length > 0 ? '加载中...' : '未分类'
  }
  return names[names.length - 1]
})

const categoryIcon = computed(() => {
  if (!props.showIcon) return null
  
  // 获取最后一级分类的图标
  const lastCategory = dataStore.getCategoryByPath(props.categoryPath)
  return lastCategory?.icon || 'fas fa-folder'
})

const categoryColorClass = computed(() => {
  // 根据顶级分类返回不同的颜色类
  if (props.categoryPath.length === 0) return ''
  
  const topCategory = props.categoryPath[0]
  
  switch (topCategory) {
    case 'design-tools':
      return 'category-design'
    case 'dev-resources':
      return 'category-dev'
    case 'creative-tools':
      return 'category-creative'
    case 'productivity':
      return 'category-productivity'
    case 'learning':
      return 'category-learning'
    default:
      return ''
  }
})

const showTooltip = computed(() => {
  // 只有当分类路径长度大于1时才显示工具提示
  return categoryNames.value.length > 1
})

// 方法
const handleMouseEnter = async (event: MouseEvent) => {
  if (!showTooltip.value) return
  
  tooltipVisible.value = true
  
  await nextTick()
  
  if (tooltipRef.value) {
    const rect = (event.target as HTMLElement).getBoundingClientRect()
    const tooltipRect = tooltipRef.value.getBoundingClientRect()
    
    // 计算工具提示位置
    let left = rect.left + rect.width / 2 - tooltipRect.width / 2
    let top = rect.top - tooltipRect.height - 8
    
    // 边界检测
    const padding = 16
    if (left < padding) {
      left = padding
    } else if (left + tooltipRect.width > window.innerWidth - padding) {
      left = window.innerWidth - tooltipRect.width - padding
    }
    
    if (top < padding) {
      // 如果上方空间不够，显示在下方
      top = rect.bottom + 8
    }
    
    tooltipStyle.value = {
      left: `${left}px`,
      top: `${top}px`
    }
  }
}

const handleMouseLeave = () => {
  tooltipVisible.value = false
}

const handleClick = (event: Event) => {
  if (!props.clickable) return
  
  event.stopPropagation()
  emit('click', props.categoryPath)
}
</script>

<style lang="scss" scoped>
.category-tag-wrapper {
  position: relative;
  display: inline-block;
}

.category-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 6px;
  border-radius: var(--radius-sm);
  background: var(--border-light);
  color: var(--text-tertiary);
  font-size: 10px;
  font-weight: 500;
  line-height: 1.2;
  transition: var(--transition);
  cursor: default;
  border: 1px solid transparent;
  
  &.has-tooltip {
    cursor: help;
  }
  
  &.clickable {
    cursor: pointer;
    
    &:hover {
      background: var(--text-tertiary);
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    }
  }
  
  // 尺寸变体
  &.size-medium {
    padding: 6px 10px;
    font-size: 13px;
    
    .category-icon {
      font-size: 12px;
    }
  }
}

.category-icon {
  font-size: 10px;
  opacity: 0.8;
}

.category-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

// 工具提示样式
.category-tooltip {
  position: fixed;
  z-index: 1000;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  font-size: 12px;
  max-width: 300px;
  backdrop-filter: blur(10px);
  
  .dark-theme & {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  }
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
}

.breadcrumb-item {
  white-space: nowrap;
  
  &:last-child {
    color: var(--text-primary);
    font-weight: 500;
  }
}

.breadcrumb-separator {
  font-size: 10px;
  opacity: 0.6;
  margin: 0 2px;
}

// 分类颜色变体
.category-tag {
  &.category-design {
    background: rgba(156, 45, 175, 0.1);
    color: #9c2daf;
    
    &.clickable:hover {
      background: #9c2daf;
    }
  }
  
  &.category-dev {
    background: rgba(16, 124, 16, 0.1);
    color: #107c10;
    
    &.clickable:hover {
      background: #107c10;
    }
  }
  
  &.category-creative {
    background: rgba(216, 59, 1, 0.1);
    color: #d83b01;
    
    &.clickable:hover {
      background: #d83b01;
    }
  }
  
  &.category-productivity {
    background: rgba(0, 103, 192, 0.1);
    color: #0067c0;
    
    &.clickable:hover {
      background: #0067c0;
    }
  }
  
  &.category-learning {
    background: rgba(164, 38, 44, 0.1);
    color: #a4262c;
    
    &.clickable:hover {
      background: #a4262c;
    }
  }
}

// 响应式适配
@media (max-width: 768px) {
  .category-tag {
    font-size: 11px;
    padding: 3px 6px;
    
    .category-icon {
      font-size: 9px;
    }
  }
  
  .category-name {
    max-width: 80px;
  }
  
  .category-tooltip {
    font-size: 11px;
    max-width: 250px;
    margin: 0 8px;
  }
}
</style> 