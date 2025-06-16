<template>
  <div class="resource-grid">
    <div 
      v-if="loading" 
      class="loading-state"
    >
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>
    
    <div 
      v-else-if="websites.length === 0" 
      class="empty-state"
    >
      <i class="fas fa-search empty-icon"></i>
      <h3>未找到相关资源</h3>
      <p>尝试使用其他关键词或浏览不同分类</p>
    </div>
    
    <div 
      v-else 
      class="cards-grid"
    >
      <div 
        v-for="website in websites" 
        :key="website.id"
        class="card"
        @click="openWebsite(website.url)"
      >
        <div class="card-header">
          <div class="card-icon">
            <img 
              :src="website.icon || getDefaultIcon(website.domain)" 
              :alt="website.title"
              @error="handleImageError"
            >
          </div>
          <div class="card-info">
            <h3 class="card-title">{{ website.title }}</h3>
            <div class="card-url">{{ website.domain }}</div>
          </div>
          <div v-if="website.featured" class="featured-badge">
            <i class="fas fa-star"></i>
          </div>
        </div>
        
        <p class="card-desc">{{ website.description }}</p>
        
        <div class="card-tags">
          <span 
            v-for="tag in website.tags.slice(0, 4)" 
            :key="tag"
            class="tag"
          >
            {{ tag }}
          </span>
          <span 
            v-if="website.tags.length > 4" 
            class="tag tag-more"
          >
            +{{ website.tags.length - 4 }}
          </span>
        </div>
        
        <!-- 波纹效果 -->
        <div class="ripple-container"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Website } from '@/types'

interface Props {
  websites: Website[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const getDefaultIcon = (domain: string) => {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iIzBENkVGRiIvPgo8cGF0aCBkPSJNMTYgOEMxMi42ODYzIDggMTAgMTAuNjg2MyAxMCAxNEMxMCAxNy4zMTM3IDEyLjY4NjMgMjAgMTYgMjBDMTkuMzEzNyAyMCAyMiAxNy4zMTM3IDIyIDE0QzIyIDEwLjY4NjMgMTkuMzEzNyA4IDE2IDhaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K'
}

const openWebsite = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer')
}

// 波纹效果
const createRipple = (event: MouseEvent, element: HTMLElement) => {
  const rippleContainer = element.querySelector('.ripple-container') as HTMLElement
  if (!rippleContainer) return
  
  const rect = element.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const x = event.clientX - rect.left - size / 2
  const y = event.clientY - rect.top - size / 2
  
  const ripple = document.createElement('span')
  ripple.className = 'ripple'
  ripple.style.width = ripple.style.height = `${size}px`
  ripple.style.left = `${x}px`
  ripple.style.top = `${y}px`
  
  rippleContainer.appendChild(ripple)
  
  setTimeout(() => {
    ripple.remove()
  }, 600)
}
</script>

<style lang="scss" scoped>
.resource-grid {
  width: 100%;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border);
  border-top: 3px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 48px;
  color: var(--text-tertiary);
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  
  @media (max-width: 1024px) {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.card {
  background-color: var(--card);
  border-radius: var(--radius-xl);
  padding: 24px;
  transition: var(--transition);
  @include card-shadow;
  display: flex;
  flex-direction: column;
  gap: 20px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border-light);
  
  &:hover {
    transform: translateY(-6px);
    @include card-hover-shadow;
    background-color: var(--card-hover);
    z-index: 10;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, transparent, rgba(var(--primary-rgb), 0.1));
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: -1;
  }
  
  &:hover::after {
    opacity: 1;
  }
  
  @media (max-width: 768px) {
    padding: 20px;
  }
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  position: relative;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  
  img {
    width: 32px;
    height: 32px;
    object-fit: contain;
  }
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 4px;
  letter-spacing: -0.5px;
  color: var(--text-primary);
  line-height: 1.3;
}

.card-url {
  color: var(--text-tertiary);
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: var(--transition);
}

.card:hover .card-url {
  color: var(--primary);
}

.featured-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 24px;
  height: 24px;
  background: var(--warning);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.card-desc {
  color: var(--text-secondary);
  line-height: 1.7;
  font-size: 15px;
  flex: 1;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: auto;
}

.tag {
  background-color: var(--primary-light);
  color: var(--primary);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  transition: var(--transition);
  white-space: nowrap;
  
  &.tag-more {
    background-color: var(--border);
    color: var(--text-tertiary);
  }
}

.card:hover .tag {
  background-color: var(--primary);
  color: white;
  
  &.tag-more {
    background-color: var(--text-tertiary);
    color: white;
  }
}

.ripple-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

.ripple {
  position: absolute;
  border-radius: 50%;
  background-color: rgba(var(--primary-rgb), 0.15);
  transform: scale(0);
  animation: ripple 0.6s var(--spring);
  pointer-events: none;
}

@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}
</style> 