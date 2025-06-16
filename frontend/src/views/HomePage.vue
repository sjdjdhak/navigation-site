<template>
  <div class="home-page">
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
          <h2 class="section-title">推荐资源</h2>
          <a href="#" class="view-all">查看全部</a>
        </div>
        
        <ResourceGrid :websites="filteredWebsites" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { useDataStore } from '@/stores/data'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import SearchSection from '@/components/SearchSection.vue'
import ResourceGrid from '@/components/ResourceGrid.vue'

const appStore = useAppStore()
const dataStore = useDataStore()

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

onMounted(async () => {
  // 确保数据已加载
  if (dataStore.websites.length === 0) {
    await dataStore.initialize()
  }
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