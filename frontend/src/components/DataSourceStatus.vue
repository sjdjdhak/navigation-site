<template>
  <div class="data-source-status" v-if="showStatus">
    <div class="status-card" :class="statusClass">
      <div class="status-header">
        <div class="status-info">
          <i :class="statusIcon" class="status-icon"></i>
          <span class="status-text">{{ statusText }}</span>
        </div>
        <div class="status-actions">
          <button 
            @click="refreshData" 
            :disabled="loading"
            class="refresh-btn"
            title="刷新数据"
          >
            <i :class="['fas', 'fa-sync-alt', { 'fa-spin': loading }]"></i>
          </button>
          <button 
            @click="toggleDetails" 
            class="details-btn"
            title="显示详情"
          >
            <i :class="['fas', showDetails ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
          </button>
          <button 
            @click="hideStatus" 
            class="close-btn"
            title="关闭"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      
      <div class="status-details" v-if="showDetails">
        <div class="detail-row">
          <span class="detail-label">数据源类型:</span>
          <span class="detail-value">{{ sourceInfo.type }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">GitHub API:</span>
          <span :class="['detail-value', sourceInfo.isAvailable ? 'available' : 'unavailable']">
            {{ sourceInfo.isAvailable ? '可用' : '不可用' }}
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">已加载分类:</span>
          <span class="detail-value">{{ sourceInfo.stats.loadedCategories }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">总网站数:</span>
          <span class="detail-value">{{ sourceInfo.stats.totalWebsites }}</span>
        </div>
        <div class="detail-actions">
          <button @click="clearCache" class="action-btn secondary">
            清除缓存
          </button>
          <button @click="forceRefresh" class="action-btn primary" :disabled="loading">
            强制刷新
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDataStore } from '@/stores/data'

interface Props {
  autoHide?: boolean
  autoHideDelay?: number
  showOnError?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoHide: false,
  autoHideDelay: 5000,
  showOnError: true
})

const dataStore = useDataStore()

// 响应式数据
const showStatus = ref(false)
const showDetails = ref(false)
const autoHideTimer = ref<number | null>(null)

// 计算属性
const sourceInfo = computed(() => dataStore.getDataSourceInfo())
const loading = computed(() => dataStore.loading)
const error = computed(() => dataStore.error)

const statusClass = computed(() => {
  if (loading.value) return 'loading'
  if (error.value) return 'error'
  if (sourceInfo.value.type === 'hybrid') return 'hybrid'
  if (sourceInfo.value.type === 'github') return 'github'
  return 'static'
})

const statusIcon = computed(() => {
  if (loading.value) return 'fas fa-spinner fa-spin'
  if (error.value) return 'fas fa-exclamation-triangle'
  if (sourceInfo.value.type === 'hybrid') return 'fas fa-exchange-alt'
  if (sourceInfo.value.type === 'github') return 'fab fa-github'
  return 'fas fa-file'
})

const statusText = computed(() => {
  if (loading.value) return '数据加载中...'
  if (error.value) return '数据加载失败'
  
  switch (sourceInfo.value.type) {
    case 'hybrid':
      return 'GitHub API + 静态文件'
    case 'github':
      return 'GitHub API'
    case 'static':
    default:
      return '静态文件'
  }
})

// 方法
const refreshData = async () => {
  try {
    await dataStore.loadCategories()
    if (props.autoHide) {
      scheduleAutoHide()
    }
  } catch (err) {
    console.error('刷新数据失败:', err)
  }
}

const clearCache = () => {
  dataStore.clearCache()
  if (props.autoHide) {
    scheduleAutoHide()
  }
}

const forceRefresh = async () => {
  try {
    await dataStore.forceRefresh()
    if (props.autoHide) {
      scheduleAutoHide()
    }
  } catch (err) {
    console.error('强制刷新失败:', err)
  }
}

const toggleDetails = () => {
  showDetails.value = !showDetails.value
}

const hideStatus = () => {
  showStatus.value = false
  clearAutoHideTimer()
}

const scheduleAutoHide = () => {
  if (!props.autoHide) return
  
  clearAutoHideTimer()
  autoHideTimer.value = window.setTimeout(() => {
    showStatus.value = false
  }, props.autoHideDelay)
}

const clearAutoHideTimer = () => {
  if (autoHideTimer.value) {
    clearTimeout(autoHideTimer.value)
    autoHideTimer.value = null
  }
}

// 监听数据变化
const checkDataStatus = () => {
  // 如果设置了在错误时显示，且有错误，则显示状态
  if (props.showOnError && error.value) {
    showStatus.value = true
    return
  }
  
  // 如果正在加载，显示状态
  if (loading.value) {
    showStatus.value = true
    return
  }
  
  // 如果配置了自动隐藏，则在成功后隐藏
  if (props.autoHide && !error.value && !loading.value) {
    scheduleAutoHide()
  }
}

// 暴露方法给父组件
const show = () => {
  showStatus.value = true
  clearAutoHideTimer()
}

const hide = () => {
  showStatus.value = false
  clearAutoHideTimer()
}

// 生命周期
onMounted(() => {
  // 监听数据状态变化
  checkDataStatus()
})

onUnmounted(() => {
  clearAutoHideTimer()
})

// 暴露方法
defineExpose({
  show,
  hide,
  refresh: refreshData
})
</script>

<style lang="scss" scoped>
.data-source-status {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  max-width: 400px;
}

.status-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  transition: all 0.3s ease;
  
  &.loading {
    border-color: #409eff;
    background: rgba(64, 158, 255, 0.05);
  }
  
  &.error {
    border-color: #f56c6c;
    background: rgba(245, 108, 108, 0.05);
  }
  
  &.hybrid {
    border-color: #e6a23c;
    background: rgba(230, 162, 60, 0.05);
  }
  
  &.github {
    border-color: #67c23a;
    background: rgba(103, 194, 58, 0.05);
  }
  
  &.static {
    border-color: #909399;
    background: rgba(144, 147, 153, 0.05);
  }
}

.status-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
}

.status-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-icon {
  width: 16px;
  height: 16px;
  
  .loading & {
    color: #409eff;
  }
  
  .error & {
    color: #f56c6c;
  }
  
  .hybrid & {
    color: #e6a23c;
  }
  
  .github & {
    color: #67c23a;
  }
  
  .static & {
    color: #909399;
  }
}

.status-text {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 14px;
}

.status-actions {
  display: flex;
  gap: 4px;
}

.refresh-btn,
.details-btn,
.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.status-details {
  padding: 16px;
  background: var(--bg-primary);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  
  &:not(:last-child) {
    border-bottom: 1px solid var(--border-color);
    margin-bottom: 8px;
    padding-bottom: 8px;
  }
}

.detail-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.detail-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  
  &.available {
    color: #67c23a;
  }
  
  &.unavailable {
    color: #f56c6c;
  }
}

.detail-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: var(--bg-secondary);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &.primary {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
    
    &:hover:not(:disabled) {
      background: var(--primary-color-dark);
    }
  }
  
  &.secondary {
    background: transparent;
    
    &:hover:not(:disabled) {
      background: var(--bg-secondary);
      border-color: var(--primary-color);
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .data-source-status {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
  
  .status-header {
    padding: 10px 12px;
  }
  
  .status-details {
    padding: 12px;
  }
  
  .detail-actions {
    flex-direction: column;
  }
}
</style> 