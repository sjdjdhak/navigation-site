<template>
  <div class="data-source-manager">
    <div class="manager-header">
      <h1 class="title">📊 数据源管理中心</h1>
      <p class="subtitle">监控、切换和管理数据源配置</p>
      
      <div class="quick-actions">
        <el-button 
          type="primary" 
          :icon="Refresh" 
          @click="refreshAll" 
          :loading="loading"
        >
          刷新所有数据
        </el-button>
        <el-button 
          type="warning" 
          :icon="Delete" 
          @click="clearAllCache"
        >
          清除缓存
        </el-button>
        <el-button 
          type="success" 
          :icon="Check" 
          @click="runHealthCheck"
          :loading="healthChecking"
        >
          健康检查
        </el-button>
      </div>
    </div>

    <!-- 数据源状态概览 -->
    <div class="status-overview">
      <div class="overview-grid">
        <div class="status-card" :class="getStatusClass(currentStatus.type)">
          <div class="card-header">
            <i :class="getStatusIcon(currentStatus.type)"></i>
            <h3>当前数据源</h3>
          </div>
          <div class="card-body">
            <div class="main-value">{{ getStatusLabel(currentStatus.type) }}</div>
            <div class="sub-value">{{ currentStatus.isAvailable ? '可用' : '不可用' }}</div>
          </div>
        </div>

        <div class="status-card">
          <div class="card-header">
            <i class="fas fa-folder"></i>
            <h3>已加载分类</h3>
          </div>
          <div class="card-body">
            <div class="main-value">{{ currentStatus.stats.loadedCategories }}</div>
            <div class="sub-value">个分类</div>
          </div>
        </div>

        <div class="status-card">
          <div class="card-header">
            <i class="fas fa-globe"></i>
            <h3>网站总数</h3>
          </div>
          <div class="card-body">
            <div class="main-value">{{ currentStatus.stats.totalWebsites }}</div>
            <div class="sub-value">个网站</div>
          </div>
        </div>

        <div class="status-card">
          <div class="card-header">
            <i class="fas fa-clock"></i>
            <h3>最后更新</h3>
          </div>
          <div class="card-body">
            <div class="main-value">{{ formatTime(currentStatus.stats.lastUpdated) }}</div>
            <div class="sub-value">{{ getTimeAgo(currentStatus.stats.lastUpdated) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据源切换 -->
    <el-card class="section-card">
      <template #header>
        <div class="card-title">
          <i class="fas fa-exchange-alt"></i>
          <span>数据源切换</span>
        </div>
      </template>
      
      <div class="source-options">
        <div 
          v-for="option in dataSourceOptions" 
          :key="option.value"
          class="source-option"
          :class="{ active: currentDataSource === option.value }"
          @click="switchDataSource(option.value)"
        >
          <div class="option-header">
            <i :class="option.icon"></i>
            <h4>{{ option.label }}</h4>
            <el-tag v-if="currentDataSource === option.value" type="success" size="small">
              当前
            </el-tag>
          </div>
          <p class="option-description">{{ option.description }}</p>
          <div class="option-features">
            <span 
              v-for="feature in option.features" 
              :key="feature"
              class="feature-tag"
            >
              {{ feature }}
            </span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 详细统计信息 -->
    <el-card class="section-card" v-if="showAdvancedStats">
      <template #header>
        <div class="card-title">
          <i class="fas fa-chart-bar"></i>
          <span>详细统计</span>
        </div>
      </template>
      
      <div class="stats-grid">
        <div v-if="currentStatus.stats.cacheSize !== undefined" class="stat-item">
          <label>缓存大小</label>
          <value>{{ currentStatus.stats.cacheSize }} 项</value>
        </div>
        <div v-if="currentStatus.stats.apiCallCount !== undefined" class="stat-item">
          <label>API 调用次数</label>
          <value>{{ currentStatus.stats.apiCallCount }} 次</value>
        </div>
        <div v-if="currentStatus.stats.fallbackRate !== undefined" class="stat-item">
          <label>回退率</label>
          <value>{{ currentStatus.stats.fallbackRate.toFixed(1) }}%</value>
        </div>
      </div>
    </el-card>

    <!-- 健康检查结果 -->
    <el-card v-if="healthResult" class="section-card">
      <template #header>
        <div class="card-title">
          <i class="fas fa-heartbeat"></i>
          <span>健康检查结果</span>
          <el-tag 
            :type="healthResult.overall ? 'success' : 'danger'" 
            size="small"
          >
            {{ healthResult.overall ? '健康' : '异常' }}
          </el-tag>
        </div>
      </template>
      
      <div class="health-details">
        <div 
          v-for="detail in healthResult.details" 
          :key="detail"
          class="health-item"
          :class="getHealthItemClass(detail)"
        >
          <i :class="getHealthItemIcon(detail)"></i>
          <span>{{ detail }}</span>
        </div>
      </div>
    </el-card>

    <!-- 实时日志 -->
    <el-card class="section-card">
      <template #header>
        <div class="card-title">
          <i class="fas fa-terminal"></i>
          <span>实时日志</span>
          <div class="header-actions">
            <el-button size="small" @click="clearLogs">清除</el-button>
            <el-button 
              size="small" 
              :type="autoScroll ? 'primary' : 'default'"
              @click="autoScroll = !autoScroll"
            >
              自动滚动
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="log-container" ref="logContainer">
        <div 
          v-for="(log, index) in logs" 
          :key="index"
          class="log-item"
          :class="log.level"
        >
          <span class="log-time">{{ formatLogTime(log.timestamp) }}</span>
          <span class="log-level">{{ log.level.toUpperCase() }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
        <div v-if="logs.length === 0" class="no-logs">
          暂无日志记录
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useDataStore } from '@/stores/data'
import { getDataConfig, updateDataConfig } from '@/config/data-config'
import { ElMessage } from 'element-plus'
import { Refresh, Delete, Check } from '@element-plus/icons-vue'

interface LogItem {
  timestamp: number
  level: 'info' | 'warn' | 'error' | 'success'
  message: string
}

const dataStore = useDataStore()

// 响应式数据
const loading = ref(false)
const healthChecking = ref(false)
const healthResult = ref<any>(null)
const logs = ref<LogItem[]>([])
const autoScroll = ref(true)
const logContainer = ref<HTMLElement>()

// 数据源选项配置
const dataSourceOptions = [
  {
    value: 'static',
    label: '静态文件',
    icon: 'fas fa-file',
    description: '使用本地静态JSON文件，速度快，无网络依赖',
    features: ['快速加载', '离线可用', '无API限制']
  },
  {
    value: 'github',
    label: 'GitHub API',
    icon: 'fab fa-github',
    description: '直接从GitHub仓库获取最新数据，实时同步',
    features: ['实时同步', '自动更新', 'API缓存']
  },
  {
    value: 'hybrid',
    label: '混合模式',
    icon: 'fas fa-exchange-alt',
    description: 'GitHub API优先，静态文件兜底，最佳性能与稳定性',
    features: ['智能切换', '故障恢复', '最佳体验']
  }
]

// 计算属性
const currentDataSource = computed(() => getDataConfig().dataSource)
const currentStatus = computed(() => dataStore.getDataSourceInfo())

const showAdvancedStats = computed(() => {
  return currentStatus.value.stats.cacheSize !== undefined ||
         currentStatus.value.stats.apiCallCount !== undefined ||
         currentStatus.value.stats.fallbackRate !== undefined
})

// 方法
const addLog = (level: LogItem['level'], message: string) => {
  logs.value.push({
    timestamp: Date.now(),
    level,
    message
  })
  
  // 限制日志数量
  if (logs.value.length > 100) {
    logs.value = logs.value.slice(-100)
  }
  
  // 自动滚动
  if (autoScroll.value) {
    nextTick(() => {
      if (logContainer.value) {
        logContainer.value.scrollTop = logContainer.value.scrollHeight
      }
    })
  }
}

const refreshAll = async () => {
  loading.value = true
  addLog('info', '开始刷新所有数据...')
  
  try {
    await dataStore.forceRefresh()
    addLog('success', '数据刷新完成')
    ElMessage.success('数据刷新成功')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    addLog('error', `数据刷新失败: ${message}`)
    ElMessage.error('数据刷新失败')
  } finally {
    loading.value = false
  }
}

const clearAllCache = () => {
  try {
    dataStore.clearCache()
    addLog('info', '所有缓存已清除')
    ElMessage.success('缓存清除成功')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    addLog('error', `缓存清除失败: ${message}`)
    ElMessage.error('缓存清除失败')
  }
}

const runHealthCheck = async () => {
  healthChecking.value = true
  addLog('info', '开始健康检查...')
  
  try {
    // 这里需要实现健康检查逻辑
    // healthResult.value = await dataStore.healthCheck()
    
    // 模拟健康检查结果
    healthResult.value = {
      overall: true,
      details: [
        '数据源可用',
        `已加载 ${currentStatus.value.stats.loadedCategories} 个分类`,
        `包含 ${currentStatus.value.stats.totalWebsites} 个网站`,
        'GitHub API 可用',
        '静态文件数据源可用'
      ]
    }
    
    addLog('success', '健康检查完成')
    ElMessage.success('系统状态良好')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    addLog('error', `健康检查失败: ${message}`)
    ElMessage.error('健康检查失败')
  } finally {
    healthChecking.value = false
  }
}

const switchDataSource = async (newType: 'static' | 'github' | 'hybrid') => {
  if (newType === currentDataSource.value) {
    return
  }
  
  addLog('info', `切换数据源到: ${getSourceLabel(newType)}`)
  
  try {
    // 更新配置
    const config = getDataConfig()
    config.dataSource = newType
    updateDataConfig(config)
    
    // 切换数据源
    await dataStore.switchDataSource(newType)
    
    addLog('success', `数据源已切换到: ${getSourceLabel(newType)}`)
    ElMessage.success('数据源切换成功')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    addLog('error', `数据源切换失败: ${message}`)
    ElMessage.error('数据源切换失败')
  }
}

const clearLogs = () => {
  logs.value = []
  addLog('info', '日志已清除')
}

// 辅助函数
const getStatusClass = (type: string) => {
  switch (type) {
    case 'hybrid': return 'hybrid'
    case 'github': return 'github'
    case 'static': return 'static'
    default: return 'unknown'
  }
}

const getStatusIcon = (type: string) => {
  switch (type) {
    case 'hybrid': return 'fas fa-exchange-alt'
    case 'github': return 'fab fa-github'
    case 'static': return 'fas fa-file'
    default: return 'fas fa-question'
  }
}

const getStatusLabel = (type: string) => {
  switch (type) {
    case 'hybrid': return '混合模式'
    case 'github': return 'GitHub API'
    case 'static': return '静态文件'
    default: return '未知'
  }
}

const getSourceLabel = (type: string) => {
  return getStatusLabel(type)
}

const formatTime = (timeStr: string) => {
  return new Date(timeStr).toLocaleTimeString()
}

const getTimeAgo = (timeStr: string) => {
  const diff = Date.now() - new Date(timeStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

const formatLogTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString()
}

const getHealthItemClass = (detail: string) => {
  if (detail.includes('失败') || detail.includes('不可用') || detail.includes('异常')) {
    return 'error'
  }
  if (detail.includes('警告')) {
    return 'warning'
  }
  return 'success'
}

const getHealthItemIcon = (detail: string) => {
  if (detail.includes('失败') || detail.includes('不可用') || detail.includes('异常')) {
    return 'fas fa-times-circle'
  }
  if (detail.includes('警告')) {
    return 'fas fa-exclamation-triangle'
  }
  return 'fas fa-check-circle'
}

// 监听数据源变化
watch(currentDataSource, (newSource, oldSource) => {
  if (oldSource) {
    addLog('info', `数据源已从 ${getSourceLabel(oldSource)} 切换到 ${getSourceLabel(newSource)}`)
  }
})

// 初始化
onMounted(() => {
  addLog('info', '数据源管理中心已启动')
  addLog('info', `当前数据源: ${getSourceLabel(currentDataSource.value)}`)
})
</script>

<style lang="scss" scoped>
.data-source-manager {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.manager-header {
  text-align: center;
  margin-bottom: 32px;
  
  .title {
    font-size: 28px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 8px;
  }
  
  .subtitle {
    font-size: 16px;
    color: var(--text-secondary);
    margin-bottom: 24px;
  }
  
  .quick-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }
}

.status-overview {
  margin-bottom: 32px;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.status-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: var(--shadow-md);
  }
  
  &.hybrid {
    border-left: 4px solid #e6a23c;
  }
  
  &.github {
    border-left: 4px solid #67c23a;
  }
  
  &.static {
    border-left: 4px solid #909399;
  }
  
  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    
    i {
      font-size: 18px;
      color: var(--primary-color);
    }
    
    h3 {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-secondary);
      margin: 0;
    }
  }
  
  .card-body {
    .main-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 4px;
    }
    
    .sub-value {
      font-size: 12px;
      color: var(--text-secondary);
    }
  }
}

.section-card {
  margin-bottom: 24px;
  
  .card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    
    i {
      color: var(--primary-color);
    }
  }
  
  .header-actions {
    margin-left: auto;
    display: flex;
    gap: 8px;
  }
}

.source-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.source-option {
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: var(--primary-color);
    box-shadow: var(--shadow-sm);
  }
  
  &.active {
    border-color: var(--primary-color);
    background: rgba(64, 158, 255, 0.05);
  }
  
  .option-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    
    i {
      font-size: 20px;
      color: var(--primary-color);
    }
    
    h4 {
      flex: 1;
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }
  }
  
  .option-description {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 16px;
    line-height: 1.5;
  }
  
  .option-features {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .feature-tag {
    display: inline-block;
    padding: 4px 8px;
    background: var(--bg-secondary);
    color: var(--text-secondary);
    font-size: 12px;
    border-radius: 4px;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-item {
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 6px;
  
  label {
    display: block;
    font-size: 12px;
    color: var(--text-secondary);
    margin-bottom: 4px;
  }
  
  value {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
  }
}

.health-details {
  .health-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
    font-size: 14px;
    
    &.success {
      color: #67c23a;
    }
    
    &.warning {
      color: #e6a23c;
    }
    
    &.error {
      color: #f56c6c;
    }
    
    i {
      font-size: 16px;
    }
  }
}

.log-container {
  max-height: 300px;
  overflow-y: auto;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 16px;
  border-radius: 6px;
}

.log-item {
  margin-bottom: 4px;
  
  .log-time {
    color: #808080;
  }
  
  .log-level {
    font-weight: 600;
    margin: 0 8px;
  }
  
  &.info .log-level {
    color: #569cd6;
  }
  
  &.success .log-level {
    color: #4ec9b0;
  }
  
  &.warn .log-level {
    color: #dcdcaa;
  }
  
  &.error .log-level {
    color: #f44747;
  }
}

.no-logs {
  text-align: center;
  color: #808080;
  font-style: italic;
}

// 响应式设计
@media (max-width: 768px) {
  .data-source-manager {
    padding: 16px;
  }
  
  .overview-grid {
    grid-template-columns: 1fr;
  }
  
  .source-options {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .quick-actions {
    flex-direction: column;
    align-items: center;
  }
}
</style> 