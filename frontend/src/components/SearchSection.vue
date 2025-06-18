<template>
  <section class="search-section">
    <div class="search-content">
      <h1 class="search-title">发现优质资源</h1>
      <p class="search-subtitle">精选设计、开发与创意资源，助您高效工作与创作</p>
    </div>
    
    <div class="search-container">
      <div class="search-input-wrapper">
        <input 
          ref="searchInputRef"
          type="text" 
          class="search-input" 
          placeholder="搜索工具、资源或关键词..."
          v-model="searchQuery"
          @input="handleSearch"
          @keydown.enter="handleEnter"
        >
        <i class="fas fa-search search-icon"></i>
      </div>
      <p class="search-hint">按 Ctrl + K 快速聚焦搜索框</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const searchInputRef = ref<HTMLInputElement>()

// 双向绑定搜索查询，并监听store中的变化
const searchQuery = ref(appStore.searchQuery)

// 监听store中搜索查询的变化，保持同步
watch(() => appStore.searchQuery, (newQuery) => {
  searchQuery.value = newQuery
})

const handleSearch = () => {
  const trimmedQuery = searchQuery.value.trim()
  appStore.setSearchQuery(searchQuery.value)
  
  // 🎯 方案一：搜索时自动清除分类过滤，实现全局搜索
  // 当用户输入搜索内容时，自动退出分类浏览模式
  // 但当搜索框清空时，不强制清除分类选择，让用户可以继续浏览分类
  if (trimmedQuery) {
    appStore.setSelectedCategoryPath(null)
  }
}

const handleEnter = () => {
  // 提交搜索查询
  handleSearch()
}

// 键盘快捷键处理
const handleKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    searchInputRef.value?.focus()
  }
  
  if (e.key === 'Escape') {
    searchInputRef.value?.blur()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style lang="scss" scoped>
.search-section {
  padding: 80px 24px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  text-align: center;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at 20% 20%, var(--primary-light) 0%, transparent 60%);
    opacity: 0.1;
    z-index: -1;
  }
  
  .dark-theme &::before {
    background: radial-gradient(circle at 20% 20%, var(--primary-dark) 0%, transparent 70%);
    opacity: 0.2;
  }
  
  @media (max-width: 768px) {
    padding: 60px 20px 30px;
  }
}

.search-content {
  max-width: 800px;
}

.search-title {
  font-size: 40px;
  font-weight: 800;
  margin-bottom: 8px;
  letter-spacing: -1px;
  background: linear-gradient(to right, var(--primary), var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  
  @media (max-width: 768px) {
    font-size: 32px;
  }
}

.search-subtitle {
  color: var(--text-secondary);
  max-width: 600px;
  font-size: 18px;
  font-weight: 400;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    font-size: 16px;
  }
}

.search-container {
  width: 100%;
  max-width: 720px;
  z-index: 2;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  padding: 16px 24px 16px 52px;
  font-size: 18px;
  border: 2px solid transparent;
  border-radius: var(--radius-xl);
  background-color: var(--card);
  color: var(--text-primary);
  @include card-shadow;
  transition: var(--transition);
  font-weight: 500;
  
  &::placeholder {
    color: var(--text-tertiary);
  }
  
  &:focus {
    outline: none;
    border-color: var(--primary);
    @include card-hover-shadow;
  }
  
  @media (max-width: 768px) {
    font-size: 16px;
    padding: 14px 20px 14px 48px;
  }
}

.search-icon {
  position: absolute;
  left: 24px;
  color: var(--text-tertiary);
  font-size: 20px;
  transition: var(--transition);
  pointer-events: none;
  
  @media (max-width: 768px) {
    left: 20px;
    font-size: 18px;
  }
}

.search-input:focus + .search-icon {
  color: var(--primary);
}

.search-hint {
  color: var(--text-tertiary);
  font-size: 14px;
  margin-top: 12px;
  
  @media (max-width: 768px) {
    font-size: 13px;
  }
}
</style> 