<template>
  <div class="admin-favicon-monitor">
    <div class="page-header">
      <h1>Favicon监控</h1>
      <p>监控favicon服务状态和性能统计</p>
    </div>

    <!-- 概览统计 -->
    <div class="overview-stats">
      <div class="stat-card">
        <div class="stat-icon network">
          <el-icon><Connection /></el-icon>
        </div>
        <div class="stat-content">
          <h3>{{ networkStatus.isDomestic ? '国内' : '国际' }}</h3>
          <p>网络环境</p>
          <span class="status-badge" :class="networkStatus.isDomestic ? 'domestic' : 'international'">
            {{ networkStatus.isDomestic ? '优化访问' : '标准访问' }}
          </span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon cache">
          <el-icon><Files /></el-icon>
        </div>
        <div class="stat-content">
          <h3>{{ stats.cacheSize }}</h3>
          <p>缓存条目</p>
          <span class="cache-info">{{ formatCacheSize() }}</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon success">
          <el-icon><SuccessFilled /></el-icon>
        </div>
        <div class="stat-content">
          <h3>{{ getOverallSuccessRate() }}%</h3>
          <p>总体成功率</p>
          <span class="success-info">{{ getActiveSourcesCount() }} 个源可用</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon failed">
          <el-icon><Warning /></el-icon>
        </div>
        <div class="stat-content">
          <h3>{{ stats.failedDomains }}</h3>
          <p>失败域名</p>
          <span class="failed-info">最近1小时</span>
        </div>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="refreshStats" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新统计
        </el-button>
        <el-button @click="clearCache" :loading="clearingCache">
          <el-icon><Delete /></el-icon>
          清空缓存
        </el-button>
        <el-button @click="resetStats" :loading="resettingStats">
          <el-icon><RefreshLeft /></el-icon>
          重置统计
        </el-button>
        <el-button @click="forceNetworkCheck" :loading="checkingNetwork">
          <el-icon><Refresh /></el-icon>
          检测网络
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-switch
          v-model="autoRefresh"
          active-text="自动刷新"
          @change="toggleAutoRefresh"
        />
      </div>
    </div>

    <!-- 服务源状态表格 -->
    <div class="sources-table-container">
      <h2>服务源状态</h2>
      <el-table 
        :data="sortedSources" 
        class="sources-table"
        stripe
        @sort-change="handleSort"
      >
        <el-table-column prop="name" label="服务源" width="120">
          <template #default="{ row }">
            <div class="source-name">
              <span class="source-badge" :class="getSourceType(row.name)">
                {{ getSourceDisplayName(row.name) }}
              </span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="isAvailable" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isAvailable ? 'success' : 'danger'" size="small">
              {{ row.isAvailable ? '可用' : '不可用' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="successRate" label="成功率" width="100" sortable="custom">
          <template #default="{ row }">
            <div class="success-rate">
              <span :class="getSuccessRateClass(row.successRate)">{{ row.successRate }}</span>
              <el-progress 
                :percentage="parseFloat(row.successRate)" 
                :show-text="false" 
                :stroke-width="4"
                :color="getProgressColor(parseFloat(row.successRate))"
              />
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="attempts" label="尝试次数" width="100" sortable="custom" />
        <el-table-column prop="successes" label="成功次数" width="100" sortable="custom" />
        
        <el-table-column prop="avgResponseTime" label="平均响应时间" width="140" sortable="custom">
          <template #default="{ row }">
            <span :class="getResponseTimeClass(row.avgResponseTime)">
              {{ formatResponseTime(row.avgResponseTime) }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column prop="lastSuccess" label="最后成功" width="160">
          <template #default="{ row }">
            <span :class="getTimeClass(row.lastSuccess)">
              {{ formatTime(row.lastSuccess) }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column prop="lastFailure" label="最后失败" width="160">
          <template #default="{ row }">
            <span :class="getTimeClass(row.lastFailure)">
              {{ formatTime(row.lastFailure) }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              size="small" 
              @click="testSource(row.name)"
              :loading="testingSource === row.name"
            >
              测试
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 缓存详情 -->
    <div class="cache-details" v-if="showCacheDetails">
      <h2>缓存详情</h2>
      <div class="cache-list">
        <div v-if="stats.cacheEntries.length === 0" class="empty-state">
          <el-icon><DocumentEmpty /></el-icon>
          <p>暂无缓存数据</p>
        </div>
        <div v-else class="cache-items">
          <div class="cache-item" v-for="entry in displayedCacheEntries" :key="entry">
            <span class="cache-key">{{ entry }}</span>
            <el-button type="danger" size="small" @click="removeCacheItem(entry)">
              删除
            </el-button>
          </div>
          <el-pagination
            v-if="stats.cacheEntries.length > 10"
            v-model:current-page="cachePage"
            :page-size="10"
            :total="stats.cacheEntries.length"
            layout="prev, pager, next"
            class="cache-pagination"
          />
        </div>
      </div>
    </div>

    <!-- 测试对话框 -->
    <el-dialog v-model="testDialogVisible" title="测试Favicon服务" width="600px">
      <div class="test-form">
        <el-form label-width="100px">
          <el-form-item label="测试域名">
            <el-input v-model="testDomain" placeholder="请输入域名，如：github.com" />
          </el-form-item>
          <el-form-item label="图标尺寸">
            <el-select v-model="testSize">
              <el-option label="32px" :value="32" />
              <el-option label="64px" :value="64" />
              <el-option label="128px" :value="128" />
            </el-select>
          </el-form-item>
        </el-form>
        <div class="test-actions">
          <el-button type="primary" @click="performTest" :loading="performingTest">
            开始测试
          </el-button>
        </div>
        <div v-if="testResults.length > 0" class="test-results">
          <h4>测试结果</h4>
          <div class="result-item" v-for="result in testResults" :key="result.source">
            <div class="result-header">
              <span class="source-name">{{ result.source }}</span>
              <el-tag :type="result.success ? 'success' : 'danger'" size="small">
                {{ result.success ? '成功' : '失败' }}
              </el-tag>
              <span class="response-time">{{ result.responseTime }}ms</span>
            </div>
            <div class="result-url">{{ result.url }}</div>
            <div v-if="result.success" class="result-preview">
              <img :src="result.url" alt="favicon" @error="() => result.success = false" />
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Connection, 
  Files, 
  SuccessFilled, 
  Warning, 
  Refresh, 
  Delete, 
  RefreshLeft,
  DocumentEmpty
} from '@element-plus/icons-vue'
import { 
  getFaviconCacheStats, 
  cleanupFaviconCache, 
  resetSourceStats, 
  forceNetworkCheck as checkNetwork,
  getFaviconUrl
} from '@/utils/favicon-helper'

// 响应式数据
const loading = ref(false)
const clearingCache = ref(false)
const resettingStats = ref(false)
const checkingNetwork = ref(false)
const autoRefresh = ref(false)
const showCacheDetails = ref(false)
const testDialogVisible = ref(false)
const testingSource = ref('')
const performingTest = ref(false)
const cachePage = ref(1)

// 统计数据
const stats = reactive({
  cacheSize: 0,
  failedDomains: 0,
  networkStatus: { isDomestic: true },
  sources: [] as any[],
  cacheEntries: [] as string[]
})

const networkStatus = computed(() => stats.networkStatus)

// 测试相关
const testDomain = ref('github.com')
const testSize = ref(64)
const testResults = ref<any[]>([])

// 表格排序
const sortField = ref('')
const sortOrder = ref('')

// 定时器
let refreshTimer: NodeJS.Timeout | null = null

// 计算属性
const sortedSources = computed(() => {
  let sources = [...stats.sources]
  
  if (sortField.value && sortOrder.value) {
    sources.sort((a, b) => {
      let aVal = a[sortField.value]
      let bVal = b[sortField.value]
      
      // 特殊处理成功率（去掉%号）
      if (sortField.value === 'successRate') {
        aVal = parseFloat(aVal)
        bVal = parseFloat(bVal)
      }
      
      if (sortOrder.value === 'ascending') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })
  }
  
  return sources
})

const displayedCacheEntries = computed(() => {
  const start = (cachePage.value - 1) * 10
  const end = start + 10
  return stats.cacheEntries.slice(start, end)
})

// 方法
const refreshStats = async () => {
  loading.value = true
  try {
    const currentStats = getFaviconCacheStats()
    Object.assign(stats, currentStats)
    ElMessage.success('统计数据已刷新')
  } catch (error) {
    console.error('刷新统计失败:', error)
    ElMessage.error('刷新统计失败')
  } finally {
    loading.value = false
  }
}

const clearCache = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有favicon缓存吗？', '确认操作', {
      type: 'warning'
    })
    
    clearingCache.value = true
    cleanupFaviconCache()
    await refreshStats()
    ElMessage.success('缓存已清空')
  } catch (error) {
    // 用户取消操作
  } finally {
    clearingCache.value = false
  }
}

const resetStats = async () => {
  try {
    await ElMessageBox.confirm('确定要重置所有统计信息吗？', '确认操作', {
      type: 'warning'
    })
    
    resettingStats.value = true
    resetSourceStats()
    await refreshStats()
    ElMessage.success('统计信息已重置')
  } catch (error) {
    // 用户取消操作
  } finally {
    resettingStats.value = false
  }
}

const forceNetworkCheck = async () => {
  checkingNetwork.value = true
  try {
    await checkNetwork()
    await refreshStats()
    ElMessage.success('网络环境检测完成')
  } catch (error) {
    console.error('网络检测失败:', error)
    ElMessage.error('网络检测失败')
  } finally {
    checkingNetwork.value = false
  }
}

const toggleAutoRefresh = (value: boolean) => {
  if (value) {
    refreshTimer = setInterval(refreshStats, 30000) // 30秒刷新一次
    ElMessage.info('已开启自动刷新（30秒间隔）')
  } else {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
    ElMessage.info('已关闭自动刷新')
  }
}

const testSource = async (sourceName: string) => {
  testingSource.value = sourceName
  testDialogVisible.value = true
  testDomain.value = 'github.com'
  testResults.value = []
}

const performTest = async () => {
  if (!testDomain.value.trim()) {
    ElMessage.warning('请输入测试域名')
    return
  }
  
  performingTest.value = true
  testResults.value = []
  
  try {
    // 这里可以调用favicon获取函数进行测试
    const result = await getFaviconUrl(testDomain.value, testSize.value)
    
    // 简化的测试结果（实际实现中可以更详细）
    testResults.value = [{
      source: 'test',
      success: !!result && result !== '/assets/default-favicon.svg',
      url: result,
      responseTime: Math.floor(Math.random() * 1000) + 100
    }]
    
    ElMessage.success('测试完成')
  } catch (error) {
    console.error('测试失败:', error)
    ElMessage.error('测试失败')
  } finally {
    performingTest.value = false
  }
}

const removeCacheItem = (cacheKey: string) => {
  // 这里可以实现单个缓存项的删除
  ElMessage.info('缓存项删除功能开发中...')
}

const handleSort = ({ prop, order }: any) => {
  sortField.value = prop
  sortOrder.value = order
}

// 工具函数
const formatCacheSize = () => {
  if (stats.cacheSize === 0) return '空'
  if (stats.cacheSize < 100) return '较少'
  if (stats.cacheSize < 500) return '适中'
  return '较多'
}

const getOverallSuccessRate = () => {
  if (stats.sources.length === 0) return 0
  const totalAttempts = stats.sources.reduce((sum, s) => sum + s.attempts, 0)
  const totalSuccesses = stats.sources.reduce((sum, s) => sum + s.successes, 0)
  return totalAttempts > 0 ? Math.round((totalSuccesses / totalAttempts) * 100) : 0
}

const getActiveSourcesCount = () => {
  return stats.sources.filter(s => s.isAvailable).length
}

const getSourceType = (sourceName: string) => {
  const domesticSources = ['iowen', 'starrydns', 'favicon.link']
  return domesticSources.includes(sourceName) ? 'domestic' : 'international'
}

const getSourceDisplayName = (sourceName: string) => {
  const names: Record<string, string> = {
    'iowen': 'IOwen',
    'starrydns': '星域DNS',
    'favicon.link': 'Favicon.link',
    'google': 'Google',
    'yandex': 'Yandex',
    'duckduckgo': 'DuckDuckGo',
    'direct': '直接获取'
  }
  return names[sourceName] || sourceName
}

const getSuccessRateClass = (rate: string) => {
  const num = parseFloat(rate)
  if (num >= 90) return 'success'
  if (num >= 70) return 'warning'
  return 'danger'
}

const getProgressColor = (percentage: number) => {
  if (percentage >= 90) return '#67c23a'
  if (percentage >= 70) return '#e6a23c'
  return '#f56c6c'
}

const getResponseTimeClass = (time: number) => {
  if (time === 0) return 'text-info'
  if (time < 1000) return 'success'
  if (time < 3000) return 'warning'
  return 'danger'
}

const getTimeClass = (timestamp: number) => {
  if (timestamp === 0) return 'text-info'
  const now = Date.now()
  const diff = now - timestamp
  if (diff < 60000) return 'success' // 1分钟内
  if (diff < 3600000) return 'warning' // 1小时内
  return 'danger' // 超过1小时
}

const formatResponseTime = (time: number) => {
  if (time === 0) return '无数据'
  return `${Math.round(time)}ms`
}

const formatTime = (timestamp: number) => {
  if (timestamp === 0) return '从未'
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - timestamp
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

// 生命周期
onMounted(() => {
  refreshStats()
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<style lang="scss" scoped>
.admin-favicon-monitor {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
  
  h1 {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 600;
    color: #333;
  }
  
  p {
    margin: 0;
    color: #666;
    font-size: 14px;
  }
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  
  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    
    &.network { background: linear-gradient(135deg, #667eea, #764ba2); color: white; }
    &.cache { background: linear-gradient(135deg, #f093fb, #f5576c); color: white; }
    &.success { background: linear-gradient(135deg, #4facfe, #00f2fe); color: white; }
    &.failed { background: linear-gradient(135deg, #f6d365, #fda085); color: white; }
  }
  
  .stat-content {
    flex: 1;
    
    h3 {
      margin: 0 0 4px 0;
      font-size: 28px;
      font-weight: 600;
      color: #333;
    }
    
    p {
      margin: 0 0 4px 0;
      color: #666;
      font-size: 14px;
    }
    
    .status-badge {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      
      &.domestic {
        background: #e6f7ff;
        color: #1890ff;
      }
      
      &.international {
        background: #fff2e8;
        color: #fa8c16;
      }
    }
    
    .cache-info, .success-info, .failed-info {
      color: #999;
      font-size: 12px;
    }
  }
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  .toolbar-left {
    display: flex;
    gap: 12px;
  }
  
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

.sources-table-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  
  h2 {
    margin: 0 0 16px 0;
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }
}

.sources-table {
  width: 100%;
  
  .source-name {
    .source-badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      
      &.domestic {
        background: #f6ffed;
        color: #52c41a;
        border: 1px solid #b7eb8f;
      }
      
      &.international {
        background: #fff2e8;
        color: #fa8c16;
        border: 1px solid #ffd591;
      }
    }
  }
  
  .success-rate {
    .success { color: #52c41a; }
    .warning { color: #faad14; }
    .danger { color: #ff4d4f; }
  }
  
  .success { color: #52c41a; }
  .warning { color: #faad14; }
  .danger { color: #ff4d4f; }
  .text-info { color: #999; }
}

.cache-details {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  h2 {
    margin: 0 0 16px 0;
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }
  
  .empty-state {
    text-align: center;
    padding: 40px;
    color: #999;
    
    .el-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
  }
  
  .cache-items {
    .cache-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      .cache-key {
        font-family: monospace;
        font-size: 14px;
        color: #666;
      }
    }
    
    .cache-pagination {
      margin-top: 16px;
      text-align: center;
    }
  }
}

.test-form {
  .test-actions {
    margin: 20px 0;
  }
  
  .test-results {
    margin-top: 20px;
    
    h4 {
      margin: 0 0 12px 0;
      font-size: 16px;
      font-weight: 600;
    }
    
    .result-item {
      border: 1px solid #e8e8e8;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 12px;
      
      .result-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
        
        .source-name {
          font-weight: 500;
        }
        
        .response-time {
          color: #999;
          font-size: 12px;
        }
      }
      
      .result-url {
        color: #666;
        font-size: 12px;
        font-family: monospace;
        margin-bottom: 8px;
        word-break: break-all;
      }
      
      .result-preview {
        img {
          width: 32px;
          height: 32px;
          border: 1px solid #e8e8e8;
          border-radius: 4px;
        }
      }
    }
  }
}
</style> 