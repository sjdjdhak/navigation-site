<template>
  <div v-if="visible" class="loading-progress" :class="{ 'compact': compact }">
    <div class="progress-container">
      <div class="progress-header">
        <div class="progress-title">
          <el-icon class="loading-icon" :class="{ 'is-loading': isLoading }">
            <Loading v-if="isLoading" />
            <Check v-else-if="isComplete" />
            <Warning v-else-if="hasFailed" />
          </el-icon>
          <span>{{ statusText }}</span>
        </div>
                 <div class="progress-stats" v-if="!compact">
           <span class="stat-item">{{ stats.progress.loaded }}/{{ stats.progress.total }}</span>
           <span class="stat-item" v-if="stats.progress.failed > 0">失败: {{ stats.progress.failed }}</span>
         </div>
      </div>
      
             <div class="progress-bar-container">
         <el-progress 
           :percentage="stats.progress.percentage" 
           :status="progressStatus"
           :show-text="false"
           :stroke-width="compact ? 4 : 6"
         />
       </div>
      
      <div v-if="!compact && showDetails" class="progress-details">
        <div class="detail-row">
          <span>已加载: {{ loadedCategories.join(', ') || '无' }}</span>
        </div>
        <div v-if="failedCategories.length > 0" class="detail-row failed">
          <span>失败: {{ failedCategories.join(', ') }}</span>
          <el-button size="small" type="primary" @click="retryFailed">重试</el-button>
        </div>
      </div>
    </div>
    
    <div v-if="!compact" class="progress-actions">
      <el-button size="small" @click="toggleDetails">
        {{ showDetails ? '隐藏详情' : '显示详情' }}
      </el-button>
      <el-button v-if="!isComplete" size="small" type="primary" @click="loadAll">
        立即加载全部
      </el-button>
      <el-button size="small" @click="dismiss">关闭</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Loading, Check, Warning } from '@element-plus/icons-vue'
import { useDataStore } from '@/stores/data'

interface Props {
  compact?: boolean
  autoHide?: boolean
  autoHideDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
  autoHide: true,
  autoHideDelay: 3000
})

const dataStore = useDataStore()

const visible = ref(false)
const showDetails = ref(false)

// 计算属性
const stats = computed(() => dataStore.getPreloadStats())
const isLoading = computed(() => stats.value.isPreloading || stats.value.progress.loading > 0)
const isComplete = computed(() => 
  stats.value.progress.total > 0 && 
  stats.value.progress.loaded >= stats.value.progress.total && 
  !isLoading.value
)
const hasFailed = computed(() => stats.value.progress.failed > 0)

const loadedCategories = computed(() => stats.value.loadedCategories)
const failedCategories = computed(() => stats.value.failedCategories)

const statusText = computed(() => {
  if (isLoading.value) {
    return '正在加载资源...'
  } else if (isComplete.value) {
    return '所有资源加载完成'
  } else if (hasFailed.value) {
    return '部分资源加载失败'
  } else {
    return '等待加载'
  }
})

const progressStatus = computed(() => {
  if (hasFailed.value && !isLoading.value) return 'exception'
  if (isComplete.value) return 'success'
  return undefined
})

// 监听加载状态变化
watch(
  () => [stats.value.progress.total, stats.value.isPreloading],
  ([total, isPreloading]) => {
    if ((typeof total === 'number' && total > 0) || isPreloading) {
      visible.value = true
    }
  },
  { immediate: true }
)

// 自动隐藏
watch(
  () => isComplete.value,
  (complete) => {
    if (complete && props.autoHide) {
      setTimeout(() => {
        visible.value = false
      }, props.autoHideDelay)
    }
  }
)

// 方法
const toggleDetails = () => {
  showDetails.value = !showDetails.value
}

const retryFailed = async () => {
  await dataStore.retryFailedCategories()
}

const loadAll = async () => {
  await dataStore.preloadAllCategories()
}

const dismiss = () => {
  visible.value = false
}

// 暴露方法给父组件
defineExpose({
  show: () => { visible.value = true },
  hide: () => { visible.value = false },
  toggle: () => { visible.value = !visible.value }
})
</script>

<style lang="scss" scoped>
.loading-progress {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  box-shadow: var(--shadow-sm);
  
  &.compact {
    padding: 8px 12px;
    
    .progress-container {
      gap: 8px;
    }
    
    .progress-header {
      .progress-title {
        font-size: 14px;
      }
    }
  }
}

.progress-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: var(--text-primary);
}

.loading-icon {
  &.is-loading {
    animation: rotate 1s linear infinite;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.progress-stats {
  display: flex;
  gap: 12px;
  font-size: 14px;
  color: var(--text-secondary);
}

.stat-item {
  &:not(:last-child)::after {
    content: '|';
    margin-left: 6px;
    color: var(--border-color);
  }
}

.progress-bar-container {
  width: 100%;
}

.progress-details {
  font-size: 12px;
  color: var(--text-secondary);
  
  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
    
    &.failed {
      color: var(--danger);
    }
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.progress-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

// 响应式设计
@media (max-width: 768px) {
  .loading-progress {
    padding: 12px;
    
    .progress-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
    
    .progress-actions {
      flex-wrap: wrap;
    }
  }
}
</style> 