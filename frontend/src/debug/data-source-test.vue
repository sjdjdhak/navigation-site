<template>
  <div class="data-source-test">
    <h2>数据源测试页面</h2>
    
    <!-- 当前状态 -->
    <div class="status-panel">
      <h3>当前状态</h3>
      <div class="status-grid">
        <div class="status-item">
          <label>数据源类型:</label>
          <span :class="['status-value', sourceInfo.type]">{{ sourceInfo.type }}</span>
        </div>
        <div class="status-item">
          <label>是否可用:</label>
          <span :class="['status-value', sourceInfo.isAvailable ? 'success' : 'error']">
            {{ sourceInfo.isAvailable ? '可用' : '不可用' }}
          </span>
        </div>
        <div class="status-item">
          <label>已加载分类:</label>
          <span class="status-value">{{ sourceInfo.stats.loadedCategories }}</span>
        </div>
        <div class="status-item">
          <label>失败分类:</label>
          <span class="status-value">{{ sourceInfo.stats.failedCategories }}</span>
        </div>
        <div class="status-item">
          <label>总网站数:</label>
          <span class="status-value">{{ sourceInfo.stats.totalWebsites }}</span>
        </div>
      </div>
    </div>

    <!-- 数据源切换 -->
    <div class="controls-panel">
      <h3>数据源控制</h3>
      <div class="control-group">
        <label>切换数据源:</label>
        <div class="button-group">
          <button 
            @click="switchTo('static')" 
            :class="{ active: sourceInfo.type === 'static' }"
            :disabled="switching"
          >
            静态文件
          </button>
          <button 
            @click="switchTo('github')" 
            :class="{ active: sourceInfo.type === 'github' }"
            :disabled="switching"
          >
            GitHub API
          </button>
          <button 
            @click="switchTo('hybrid')" 
            :class="{ active: sourceInfo.type === 'hybrid' }"
            :disabled="switching"
          >
            混合模式
          </button>
        </div>
      </div>

      <div class="control-group">
        <label>缓存操作:</label>
        <div class="button-group">
          <button @click="clearCache()" :disabled="loading">清除缓存</button>
          <button @click="forceRefresh()" :disabled="loading">强制刷新</button>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div class="loading-panel" v-if="loading || switching">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <span>{{ switching ? '切换数据源中...' : '加载中...' }}</span>
      </div>
    </div>

    <!-- 分类数据预览 -->
    <div class="data-panel">
      <h3>分类数据预览</h3>
      <div v-if="categories.length > 0" class="categories-preview">
        <div v-for="category in categories" :key="category.id" class="category-item">
          <div class="category-header">
            <i :class="category.icon" v-if="category.icon"></i>
            <span class="category-name">{{ category.name }}</span>
            <span class="category-count">({{ toolCounts[category.id] || 0 }})</span>
            <button 
              @click="loadCategoryData(category.id)" 
              :disabled="isCategoryLoading(category.id)"
              class="load-btn"
            >
              {{ isCategoryLoaded(category.id) ? '已加载' : '加载数据' }}
            </button>
          </div>
          <div class="category-desc" v-if="category.description">
            {{ category.description }}
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        暂无分类数据
      </div>
    </div>

    <!-- 错误信息 -->
    <div class="error-panel" v-if="error">
      <h3>错误信息</h3>
      <div class="error-message">{{ error }}</div>
      <button @click="clearError()">清除错误</button>
    </div>

    <!-- 调试日志 -->
    <div class="debug-panel">
      <h3>调试日志</h3>
      <div class="debug-controls">
        <button @click="showDebugInfo = !showDebugInfo">
          {{ showDebugInfo ? '隐藏' : '显示' }}详细信息
        </button>
        <button @click="clearLogs()">清除日志</button>
      </div>
      
      <div v-if="showDebugInfo" class="debug-content">
        <h4>配置信息:</h4>
        <pre>{{ JSON.stringify(sourceInfo.config, null, 2) }}</pre>
        
        <h4>控制台日志:</h4>
        <div class="console-logs">
          <div v-for="log in logs" :key="log.id" :class="['log-item', log.level]">
            <span class="log-time">{{ log.time }}</span>
            <span class="log-level">{{ log.level }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDataStore } from '@/stores/data'

const dataStore = useDataStore()

// 响应式数据
const switching = ref(false)
const showDebugInfo = ref(false)
const logs = ref<Array<{ id: number, time: string, level: string, message: string }>>([])

// 计算属性
const sourceInfo = computed(() => dataStore.getDataSourceInfo())
const categories = computed(() => dataStore.categories)
const toolCounts = computed(() => dataStore.toolCounts)
const loading = computed(() => dataStore.loading)
const error = computed(() => dataStore.error)

// 方法
const switchTo = async (type: 'static' | 'github' | 'hybrid') => {
  if (switching.value) return
  
  try {
    switching.value = true
    addLog('info', `切换到 ${type} 数据源`)
    await dataStore.switchDataSource(type)
    addLog('success', `切换到 ${type} 数据源成功`)
  } catch (err) {
    addLog('error', `切换数据源失败: ${err}`)
  } finally {
    switching.value = false
  }
}

const clearCache = () => {
  dataStore.clearCache()
  addLog('info', '缓存已清除')
}

const forceRefresh = async () => {
  try {
    addLog('info', '开始强制刷新')
    await dataStore.forceRefresh()
    addLog('success', '强制刷新完成')
  } catch (err) {
    addLog('error', `强制刷新失败: ${err}`)
  }
}

const loadCategoryData = async (categoryId: string) => {
  try {
    addLog('info', `开始加载分类数据: ${categoryId}`)
    await dataStore.loadWebsitesLazy(categoryId)
    addLog('success', `分类数据加载完成: ${categoryId}`)
  } catch (err) {
    addLog('error', `加载分类数据失败: ${categoryId}, ${err}`)
  }
}

const isCategoryLoaded = (categoryId: string) => dataStore.isCategoryLoaded(categoryId)
const isCategoryLoading = (categoryId: string) => dataStore.isCategoryLoading(categoryId)
const clearError = () => dataStore.clearError()

const addLog = (level: string, message: string) => {
  logs.value.unshift({
    id: Date.now(),
    time: new Date().toLocaleTimeString(),
    level,
    message
  })
  
  // 限制日志数量
  if (logs.value.length > 50) {
    logs.value = logs.value.slice(0, 50)
  }
}

const clearLogs = () => {
  logs.value = []
}

// 初始化
onMounted(async () => {
  addLog('info', '数据源测试页面已加载')
  
  // 初始化数据
  if (categories.value.length === 0) {
    try {
      await dataStore.loadCategories()
      addLog('success', '分类数据初始化完成')
    } catch (err) {
      addLog('error', `分类数据初始化失败: ${err}`)
    }
  }
})

onUnmounted(() => {
  // 清理工作
})
</script>

<style lang="scss" scoped>
.data-source-test {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  
  h2, h3, h4 {
    color: var(--text-primary);
    margin-bottom: 16px;
  }
}

.status-panel,
.controls-panel,
.data-panel,
.error-panel,
.debug-panel {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  label {
    font-weight: 500;
    color: var(--text-secondary);
  }
}

.status-value {
  font-weight: 600;
  
  &.static { color: #409eff; }
  &.github { color: #67c23a; }
  &.hybrid { color: #e6a23c; }
  &.success { color: #67c23a; }
  &.error { color: #f56c6c; }
}

.control-group {
  margin-bottom: 16px;
  
  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: var(--text-secondary);
  }
}

.button-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

button {
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover:not(:disabled) {
    background: var(--bg-secondary);
    border-color: var(--primary-color);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &.active {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
  }
}

.loading-panel {
  text-align: center;
  padding: 40px;
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 16px;
  color: var(--text-secondary);
}

.categories-preview {
  display: grid;
  gap: 12px;
}

.category-item {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 16px;
  background: var(--bg-primary);
}

.category-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  
  i {
    color: var(--primary-color);
    width: 16px;
  }
}

.category-name {
  font-weight: 500;
  flex: 1;
}

.category-count {
  color: var(--text-secondary);
  font-size: 14px;
}

.load-btn {
  padding: 4px 12px;
  font-size: 12px;
  margin-left: auto;
}

.category-desc {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.4;
}

.empty-state {
  text-align: center;
  color: var(--text-secondary);
  padding: 40px;
}

.error-panel {
  border-color: #f56c6c;
  background: rgba(245, 108, 108, 0.1);
}

.error-message {
  color: #f56c6c;
  background: rgba(245, 108, 108, 0.1);
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
  font-family: monospace;
}

.debug-controls {
  margin-bottom: 16px;
}

.debug-content {
  h4 {
    margin: 16px 0 8px 0;
    font-size: 14px;
    color: var(--text-secondary);
  }
  
  pre {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 12px;
    overflow-x: auto;
    font-size: 12px;
    line-height: 1.4;
  }
}

.console-logs {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-primary);
}

.log-item {
  display: flex;
  gap: 8px;
  padding: 4px 8px;
  font-size: 12px;
  font-family: monospace;
  border-bottom: 1px solid var(--border-color);
  
  &:last-child {
    border-bottom: none;
  }
  
  &.info { color: #409eff; }
  &.success { color: #67c23a; }
  &.error { color: #f56c6c; }
  &.warn { color: #e6a23c; }
}

.log-time {
  color: var(--text-secondary);
  min-width: 60px;
}

.log-level {
  min-width: 50px;
  font-weight: 500;
  text-transform: uppercase;
}

.log-message {
  flex: 1;
}
</style> 