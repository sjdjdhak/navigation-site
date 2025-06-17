<template>
  <div class="home-page">
    <!-- 数据源状态 -->
    <DataSourceStatus 
      ref="dataSourceStatus"
      :auto-hide="true"
      :auto-hide-delay="3000"
      :show-on-error="true"
    />
    
    <!-- 导航栏 -->
    <AppNavbar />
    
    <!-- 搜索区域 -->
    <SearchSection />
    
    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 抽屉式侧边栏 -->
      <AppSidebar />
      
      <!-- 侧边栏遮罩层 -->
      <div 
        v-if="appStore.sidebarOpen" 
        class="sidebar-overlay"
        @click="appStore.closeSidebar"
      ></div>
      
      <!-- 卡片内容区 -->
      <div class="cards-container">
        <div class="cards-header">
          <h2 class="section-title">{{ sectionTitle }}</h2>
          <div class="header-actions">
            <span v-if="showLoadingInfo" class="loading-info">
              {{ loadingInfo }}
            </span>
            <el-button size="small" @click="showLoadAll">查看加载状态</el-button>
          </div>
        </div>
        
        <!-- 预加载状态卡片 -->
        <div v-if="showPreloadStatus" class="preload-status-card">
          <LoadingProgress :compact="false" :auto-hide="false" />
        </div>
        
        <ResourceGrid :websites="filteredWebsites" />
        
        <!-- 如果正在加载且没有数据显示骨架屏 -->
        <div v-if="isInitialLoading && filteredWebsites.length === 0" class="skeleton-grid">
          <div v-for="n in 12" :key="n" class="skeleton-card">
            <el-skeleton animated>
              <template #template>
                <div class="skeleton-content">
                  <el-skeleton-item variant="image" class="skeleton-avatar" />
                  <div class="skeleton-text">
                    <el-skeleton-item variant="h3" class="skeleton-title" />
                    <el-skeleton-item variant="text" />
                    <el-skeleton-item variant="text" style="width: 60%" />
                  </div>
                </div>
              </template>
            </el-skeleton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { useDataStore } from '@/stores/data'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import SearchSection from '@/components/SearchSection.vue'
import ResourceGrid from '@/components/ResourceGrid.vue'
import LoadingProgress from '@/components/LoadingProgress.vue'
import DataSourceStatus from '@/components/DataSourceStatus.vue'

const appStore = useAppStore()
const dataStore = useDataStore()

// 状态管理
const showPreloadStatus = ref(false)
const isInitialLoading = ref(true)

// 计算过滤后的网站列表
const filteredWebsites = computed(() => {
  const { searchQuery, selectedCategoryPath } = appStore
  
  if (!searchQuery && (!selectedCategoryPath || selectedCategoryPath.length === 0)) {
    // 显示推荐网站（featured为true的网站）
    return dataStore.featuredWebsites
  }
  
  // 使用搜索功能
  const result = dataStore.searchWebsites(
    searchQuery,
    selectedCategoryPath || undefined
  )
  
  return result.websites
})

// 动态页面标题
const sectionTitle = computed(() => {
  const { searchQuery, selectedCategoryPath } = appStore
  
  if (searchQuery) {
    return `搜索结果: "${searchQuery}"`
  } else if (selectedCategoryPath && selectedCategoryPath.length > 0) {
    const categoryNames = dataStore.getCategoryNames(selectedCategoryPath)
    return categoryNames.join(' > ')
  } else {
    return '推荐资源'
  }
})

// 预加载统计信息
const preloadStats = computed(() => dataStore.getPreloadStats())

// 加载信息显示
const showLoadingInfo = computed(() => {
  return preloadStats.value.isPreloading || preloadStats.value.progress.loading > 0
})

const loadingInfo = computed(() => {
  const stats = preloadStats.value.progress
  if (stats.loading > 0) {
    return `正在加载 ${stats.loading} 个分类...`
  } else if (stats.total > 0) {
    return `已加载 ${stats.loaded}/${stats.total} 个分类`
  }
  return ''
})

// 方法
const showLoadAll = () => {
  showPreloadStatus.value = !showPreloadStatus.value
}

onMounted(async () => {
  // 确保数据已加载
  if (dataStore.websites.length === 0) {
    await dataStore.initialize('progressive')
  }
  
  // 设置初始加载状态
  setTimeout(() => {
    isInitialLoading.value = false
  }, 1000)
})
</script>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  display: flex;
  padding: 0 24px 60px;
  gap: 32px;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
  
  @media (max-width: 768px) {
    padding: 0 20px 40px;
    flex-direction: column;
  }
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;
  backdrop-filter: blur(4px);
  
  @media (min-width: 769px) {
    display: none;
  }
}

.cards-container {
  flex: 1;
}

.cards-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.loading-info {
  font-size: 14px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.preload-status-card {
  margin-bottom: 24px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.skeleton-card {
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
  background: var(--bg-primary);
}

.skeleton-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  flex-shrink: 0;
}

.skeleton-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-title {
  height: 20px;
  border-radius: 4px;
}

.view-all {
  color: var(--primary);
  text-decoration: none;
  font-weight: 500;
  transition: var(--transition);
  
  &:hover {
    text-decoration: underline;
  }
}
</style> 