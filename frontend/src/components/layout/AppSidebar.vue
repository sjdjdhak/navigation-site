<template>
  <div 
    class="sidebar-container"
    :class="{ active: appStore.sidebarOpen }"
  >
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2 class="sidebar-title">资源分类</h2>
        <button 
          class="close-sidebar md:hidden" 
          @click="appStore.closeSidebar"
          title="关闭菜单"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <!-- 分类树 -->
      <CategoryTree
        :categories="dataStore.categories"
        :loading="dataStore.loading"
        :selected-path="appStore.selectedCategoryPath || []"
        :show-icons="true"
        :show-counts="true"
        :tool-counts="dataStore.toolCounts"
        :default-expanded="['design-tools']"
        @select="handleCategorySelect"
        @expand-change="handleExpandChange"
      />
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CategoryTree from '@/components/CategoryTree.vue'
import { useAppStore } from '@/stores/app'
import { useDataStore } from '@/stores/data'

const appStore = useAppStore()
const dataStore = useDataStore()

// 处理分类选择
const handleCategorySelect = async (path: string[] | null) => {
  // 处理取消选中的情况
  if (path === null) {
    appStore.setSelectedCategoryPath(null)
    
    // 移动端关闭侧边栏
    if (window.innerWidth <= 768) {
      appStore.closeSidebar()
    }
    return
  }
  
  // 设置选中的分类路径
  appStore.setSelectedCategoryPath(path)
  
  // 确保选中分类及其所有父级分类的数据都已加载
  const categoriesToLoad: string[] = []
  
  // 收集需要加载的分类ID（包括路径中的所有分类）
  for (let i = 0; i < path.length; i++) {
    const categoryId = path[i]
    if (!dataStore.isCategoryLoaded(categoryId) && !dataStore.isCategoryLoading(categoryId)) {
      categoriesToLoad.push(categoryId)
    }
  }
  
  // 如果有需要加载的分类，先加载数据
  if (categoriesToLoad.length > 0) {
    console.debug('🔄 按需加载分类数据:', categoriesToLoad.join(', '))
    try {
      await dataStore.loadMultipleCategoriesLazy(categoriesToLoad)
    } catch (error) {
      console.error('❌ 按需加载分类数据失败:', error)
    }
  }
  
  // 移动端关闭侧边栏
  if (window.innerWidth <= 768) {
    appStore.closeSidebar()
  }
}

// 处理展开状态变化
const handleExpandChange = (expandedIds: string[]) => {
  // 展开状态已在CategoryTree组件中保存到localStorage
  // 这里可以添加其他需要的处理逻辑
}
</script>

<style lang="scss" scoped>
.sidebar-container {
  position: relative;
  
  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 100;
    transform: translateX(var(--sidebar-collapsed));
    transition: transform 0.3s ease;
    
    &.active {
      transform: translateX(0);
    }
  }
}

.sidebar {
  width: var(--sidebar-width);
  flex-shrink: 0;
  background-color: var(--card);
  border-radius: var(--radius-xl);
  padding: 24px;
  height: fit-content;
  position: sticky;
  top: calc(var(--navbar-height) + 20px);
  @include card-shadow;
  transition: transform 0.3s ease;
  z-index: 100;
  
  @media (max-width: 768px) {
    width: var(--sidebar-width);
    height: 100vh;
    border-radius: 0;
    top: 0;
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.2);
    overflow-y: auto;
  }
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.sidebar-title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: var(--text-primary);
}

.close-sidebar {
  @include fluent-button;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 16px;
  color: var(--text-secondary);
  
  &:hover {
    color: var(--text-primary);
  }
  
  @media (min-width: 769px) {
    display: none;
  }
}
</style> 