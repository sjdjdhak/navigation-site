<template>
  <div class="lazy-load-demo">
    <div class="demo-header">
      <h1>懒加载与图标主题演示</h1>
      <p>体验不同的图标主题和懒加载效果</p>
    </div>

    <!-- 图标主题选择 -->
    <section class="demo-section">
      <h2>1. 图标主题选择</h2>
      <IconThemeSelector @theme-change="handleThemeChange" />
    </section>

    <!-- 图标展示 -->
    <section class="demo-section">
      <h2>2. 图标主题效果</h2>
      <div class="icon-showcase">
        <div 
          v-for="site in showcaseSites" 
          :key="site.domain"
          class="showcase-card"
        >
          <OptimizedIcon
            :domain="site.domain"
            :title="site.title"
            :size="iconSettings.size"
            :border-radius="iconSettings.borderRadius"
            :theme="iconSettings.theme"
            :lazy="true"
          />
          <div class="site-info">
            <h4>{{ site.title }}</h4>
            <p>{{ site.domain }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 基础懒加载演示 -->
    <section class="demo-section">
      <h2>3. 基础懒加载</h2>
      <div class="demo-grid">
        <LazyWrapper
          v-for="i in 8"
          :key="`basic-${i}`"
          :min-height="200"
          :delay="i * 100"
        >
          <div class="demo-card">
            <h3>懒加载卡片 {{ i }}</h3>
            <p>这是第 {{ i }} 个懒加载的内容块</p>
            <div class="card-content">
              <span class="badge">延迟: {{ i * 100 }}ms</span>
              <OptimizedIcon
                :domain="sampleSites[(i - 1) % sampleSites.length].domain"
                :size="iconSettings.size"
                :theme="iconSettings.theme"
                :border-radius="iconSettings.borderRadius"
                :lazy="true"
              />
            </div>
          </div>
        </LazyWrapper>
      </div>
    </section>

    <!-- 图片懒加载演示 -->
    <section class="demo-section">
      <h2>4. 图片懒加载效果对比</h2>
      <div class="comparison-container">
        <div class="comparison-column">
          <h3>普通加载</h3>
          <div class="icon-grid">
            <div v-for="(site, index) in sampleSites" :key="`normal-${index}`" class="icon-item">
              <OptimizedIcon
                :domain="site.domain"
                :title="site.title"
                :size="iconSettings.size"
                :theme="iconSettings.theme"
                :border-radius="iconSettings.borderRadius"
                :lazy="false"
              />
              <span>{{ site.title }}</span>
            </div>
          </div>
        </div>
        
        <div class="comparison-column">
          <h3>懒加载</h3>
          <div class="icon-grid">
            <div v-for="(site, index) in sampleSites" :key="`lazy-${index}`" class="icon-item">
              <LazyWrapper :min-height="iconSettings.size + 20">
                <OptimizedIcon
                  :domain="site.domain"
                  :title="site.title"
                  :size="iconSettings.size"
                  :theme="iconSettings.theme"
                  :border-radius="iconSettings.borderRadius"
                  :lazy="true"
                />
                <span>{{ site.title }}</span>
              </LazyWrapper>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 无限滚动演示 -->
    <section class="demo-section">
      <h2>5. 无限滚动</h2>
      <div class="infinite-demo">
        <div 
          v-for="item in infiniteItems"
          :key="item.id"
          class="infinite-item"
        >
          <OptimizedIcon
            :domain="item.domain"
            :size="32"
            :theme="iconSettings.theme"
            :border-radius="iconSettings.borderRadius"
            :lazy="true"
          />
          <div class="item-content">
            <span class="item-id">#{{ item.id }}</span>
            <span class="item-title">{{ item.title }}</span>
            <span class="item-description">{{ item.description }}</span>
          </div>
        </div>
        
        <!-- 加载更多触发器 -->
        <LazyWrapper
          v-if="hasMore"
          :min-height="100"
          @visible="loadMoreItems"
        >
          <div v-if="infiniteLoading" class="loading-more">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>加载更多...</span>
          </div>
          <div v-else class="load-more-placeholder">
            <span>滚动到此处加载更多</span>
          </div>
        </LazyWrapper>
        
        <div v-if="!hasMore" class="no-more">
          没有更多内容了
        </div>
      </div>
    </section>

    <!-- 预加载状态显示 -->
    <section class="demo-section">
      <h2>6. 预加载状态监控</h2>
      <div class="preload-status">
        <h3>图片预加载器状态</h3>
        <div class="status-info">
          <div class="status-item">
            <span>缓存大小:</span>
            <span>{{ preloadStatus.size }} / {{ preloadStatus.maxSize }}</span>
          </div>
          <div class="status-item">
            <span>处理中:</span>
            <span>{{ preloadStatus.processing }}</span>
          </div>
          <div class="status-item">
            <span>队列长度:</span>
            <span>{{ preloadStatus.queue }}</span>
          </div>
        </div>
        <div class="status-actions">
          <el-button @click="preloadTestImages" type="primary">
            预加载测试图片
          </el-button>
          <el-button @click="clearPreloadCache" type="danger">
            清空缓存
          </el-button>
          <el-button @click="refreshIcons" type="success">
            刷新所有图标
          </el-button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import LazyWrapper from '@/components/LazyWrapper.vue'
import OptimizedIcon from '@/components/OptimizedIcon.vue'
import IconThemeSelector from '@/components/IconThemeSelector.vue'
import { globalPreloader } from '@/utils/preloader'

// 图标设置
const iconSettings = ref({
  theme: 'modern' as 'default' | 'modern' | 'glass' | 'minimal',
  borderRadius: 8,
  size: 40
})

// 展示网站数据
const showcaseSites = [
  { title: 'GitHub', domain: 'github.com' },
  { title: 'Vue.js', domain: 'vuejs.org' },
  { title: 'React', domain: 'reactjs.org' },
  { title: 'TypeScript', domain: 'typescriptlang.org' },
  { title: 'Vite', domain: 'vitejs.dev' },
  { title: 'Figma', domain: 'figma.com' },
  { title: 'Dribbble', domain: 'dribbble.com' },
  { title: 'Behance', domain: 'behance.net' },
  { title: 'Apple', domain: 'apple.com' },
  { title: 'Google', domain: 'google.com' },
  { title: 'Microsoft', domain: 'microsoft.com' },
  { title: 'Adobe', domain: 'adobe.com' }
]

// 示例网站数据
const sampleSites = [
  { title: 'GitHub', domain: 'github.com' },
  { title: 'Vue.js', domain: 'vuejs.org' },
  { title: 'Element Plus', domain: 'element-plus.org' },
  { title: 'TypeScript', domain: 'typescriptlang.org' },
  { title: 'Vite', domain: 'vitejs.dev' },
  { title: 'Figma', domain: 'figma.com' },
  { title: 'Dribbble', domain: 'dribbble.com' },
  { title: 'Behance', domain: 'behance.net' }
]

// 无限滚动数据
const infiniteItems = ref<Array<{
  id: number
  title: string
  description: string
  domain: string
}>>([])
const infiniteLoading = ref(false)
const hasMore = ref(true)
const currentPage = ref(1)

// 生成无限滚动项目
const generateItems = (page: number, count: number = 10) => {
  const items = []
  const startId = (page - 1) * count + 1
  const domains = ['github.com', 'google.com', 'apple.com', 'microsoft.com', 'figma.com']
  
  for (let i = 0; i < count; i++) {
    const id = startId + i
    items.push({
      id,
      title: `项目 ${id}`,
      description: `这是第 ${id} 个动态加载的项目内容`,
      domain: domains[i % domains.length]
    })
  }
  
  return items
}

// 加载更多项目
const loadMoreItems = async () => {
  if (infiniteLoading.value || !hasMore.value) return
  
  infiniteLoading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newItems = generateItems(currentPage.value)
    infiniteItems.value.push(...newItems)
    currentPage.value++
    
    if (currentPage.value > 5) {
      hasMore.value = false
    }
  } catch (error) {
    console.error('加载更多失败:', error)
  } finally {
    infiniteLoading.value = false
  }
}

// 预加载状态
const preloadStatus = ref({
  size: 0,
  maxSize: 0,
  processing: 0,
  queue: 0
})

const updatePreloadStatus = () => {
  preloadStatus.value = globalPreloader.getCacheInfo()
}

// 主题变化处理
const handleThemeChange = (theme: any, borderRadius: number, size: number) => {
  iconSettings.value = {
    theme,
    borderRadius,
    size
  }
}

// 预加载测试图片
const preloadTestImages = async () => {
  const testDomains = [
    'amazon.com', 'netflix.com', 'spotify.com', 'instagram.com', 
    'twitter.com', 'linkedin.com', 'youtube.com', 'discord.com'
  ]
  try {
    await globalPreloader.preloadFavicons(testDomains)
    updatePreloadStatus()
    console.log('测试图片预加载完成')
  } catch (error) {
    console.error('预加载失败:', error)
  }
}

// 清空预加载缓存
const clearPreloadCache = () => {
  globalPreloader.clearCache()
  updatePreloadStatus()
}

// 刷新所有图标
const refreshIcons = () => {
  // 触发页面重新加载图标
  window.location.reload()
}

// 定时更新预加载状态
let statusInterval: ReturnType<typeof setInterval>

onMounted(() => {
  // 初始化数据
  infiniteItems.value = generateItems(1)
  currentPage.value = 2
  
  // 定时更新状态
  statusInterval = setInterval(updatePreloadStatus, 1000)
  updatePreloadStatus()
})

onUnmounted(() => {
  if (statusInterval) {
    clearInterval(statusInterval)
  }
})
</script>

<style lang="scss" scoped>
.lazy-load-demo {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.demo-header {
  text-align: center;
  margin-bottom: 40px;
  
  h1 {
    font-size: 32px;
    color: var(--el-text-color-primary);
    margin-bottom: 10px;
  }
  
  p {
    color: var(--el-text-color-secondary);
    font-size: 16px;
  }
}

.demo-section {
  margin-bottom: 50px;
  
  h2 {
    font-size: 24px;
    color: var(--el-text-color-primary);
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid var(--el-border-color);
  }
  
  h3 {
    font-size: 18px;
    color: var(--el-text-color-primary);
    margin-bottom: 15px;
  }
}

.icon-showcase {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.showcase-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    border-color: var(--el-color-primary-light-5);
  }
  
  .site-info {
    margin-top: 12px;
    text-align: center;
    
    h4 {
      margin: 0 0 4px 0;
      font-size: 14px;
      color: var(--el-text-color-primary);
    }
    
    p {
      margin: 0;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
}

.demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.demo-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  h3 {
    color: var(--el-text-color-primary);
    margin-bottom: 10px;
  }
  
  p {
    color: var(--el-text-color-secondary);
    margin-bottom: 15px;
  }
}

.card-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .badge {
    background: var(--el-color-primary);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
  }
}

.comparison-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.comparison-column {
  padding: 20px;
  background: var(--el-bg-color-page);
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 15px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--el-bg-color);
  border-radius: 6px;
  
  span {
    font-size: 11px;
    color: var(--el-text-color-secondary);
    text-align: center;
  }
}

.infinite-demo {
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
}

.infinite-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  
  &:last-child {
    border-bottom: none;
  }
}

.item-content {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
  
  .item-id {
    font-weight: bold;
    color: var(--el-color-primary);
    min-width: 50px;
  }
  
  .item-title {
    font-weight: 500;
    color: var(--el-text-color-primary);
    min-width: 100px;
  }
  
  .item-description {
    color: var(--el-text-color-secondary);
    flex: 1;
  }
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  color: var(--el-text-color-secondary);
}

.load-more-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: var(--el-text-color-placeholder);
  background: var(--el-bg-color-page);
}

.no-more {
  text-align: center;
  padding: 20px;
  color: var(--el-text-color-secondary);
  background: var(--el-bg-color-page);
}

.preload-status {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  padding: 20px;
  
  h3 {
    margin-bottom: 15px;
    color: var(--el-text-color-primary);
  }
}

.status-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--el-bg-color-page);
  border-radius: 4px;
  font-size: 14px;
  
  span:first-child {
    color: var(--el-text-color-secondary);
  }
  
  span:last-child {
    color: var(--el-text-color-primary);
    font-weight: 500;
  }
}

.status-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
</style> 