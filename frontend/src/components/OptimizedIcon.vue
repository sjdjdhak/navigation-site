<template>
  <div class="optimized-icon" :style="{ width: size + 'px', height: size + 'px' }">
    <img
      v-if="currentIconUrl"
      :src="currentIconUrl"
      :alt="alt || title"
      :style="iconStyle"
      @load="handleLoad"
      @error="handleError"
      :class="{
        'icon-loading': isLoading,
        'icon-loaded': isLoaded,
        'icon-error': hasError
      }"
    />
    <div v-else-if="isLoading" class="icon-placeholder loading">
      <el-icon :size="Math.round(size * 0.6)">
        <Loading />
      </el-icon>
    </div>
    <div v-else class="icon-placeholder default">
      <el-icon :size="Math.round(size * 0.6)">
        <Link />
      </el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Loading, Link } from '@element-plus/icons-vue'
import { getFaviconUrl } from '@/utils/favicon-helper'

interface Props {
  domain?: string
  url?: string
  title?: string
  alt?: string
  size?: number
  lazy?: boolean
  fallbackIcon?: string
}

const props = withDefaults(defineProps<Props>(), {
  domain: '',
  url: '',
  title: '',
  alt: '',
  size: 32,
  lazy: false,
  fallbackIcon: '/assets/default-favicon.svg'
})

const currentIconUrl = ref('')
const isLoading = ref(false)
const isLoaded = ref(false)
const hasError = ref(false)
const retryCount = ref(0)
const maxRetries = 3

// 计算样式
const iconStyle = computed(() => ({
  width: props.size + 'px',
  height: props.size + 'px',
  borderRadius: '4px',
  objectFit: 'cover' as const
}))

// 提取域名
const extractDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  }
}

// 获取图标URL
const fetchIcon = async (force = false) => {
  if (!force && currentIconUrl.value && !hasError.value) return

  const targetDomain = props.domain || (props.url ? extractDomain(props.url) : '')
  if (!targetDomain) {
    currentIconUrl.value = props.fallbackIcon
    return
  }

  isLoading.value = true
  hasError.value = false

  try {
    console.debug(`🔍 获取favicon: ${targetDomain}`)
    const iconUrl = await getFaviconUrl(targetDomain, props.size)
    
    if (iconUrl !== currentIconUrl.value) {
      currentIconUrl.value = iconUrl
      isLoaded.value = false // 重置加载状态
    }
    
    console.debug(`✅ Favicon获取成功: ${targetDomain} -> ${iconUrl}`)
  } catch (error) {
    console.error(`❌ Favicon获取失败: ${targetDomain}`, error)
    hasError.value = true
    currentIconUrl.value = props.fallbackIcon
  } finally {
    isLoading.value = false
  }
}

// 图片加载成功
const handleLoad = () => {
  isLoaded.value = true
  hasError.value = false
  retryCount.value = 0
  console.debug(`🖼️ 图标加载成功: ${currentIconUrl.value}`)
}

// 图片加载失败
const handleError = async () => {
  console.warn(`🚫 图标加载失败: ${currentIconUrl.value}`)
  
  // 如果当前显示的不是兜底图标，且重试次数未达到上限
  if (currentIconUrl.value !== props.fallbackIcon && retryCount.value < maxRetries) {
    retryCount.value++
    console.debug(`🔄 重试获取图标 (${retryCount.value}/${maxRetries}): ${props.domain || props.url}`)
    
    // 延迟重试，避免立即重复请求
    setTimeout(() => {
      fetchIcon(true)
    }, retryCount.value * 1000)
  } else {
    // 使用兜底图标
    hasError.value = true
    currentIconUrl.value = props.fallbackIcon
    console.debug(`💡 使用兜底图标: ${props.fallbackIcon}`)
  }
}

// 监听属性变化
watch(
  () => [props.domain, props.url],
  () => {
    if (!props.lazy) {
      fetchIcon(true)
    }
  },
  { immediate: !props.lazy }
)

// 组件挂载
onMounted(() => {
  if (props.lazy) {
    // 懒加载模式：使用 Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchIcon()
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    
    const element = document.querySelector('.optimized-icon')
    if (element) {
      observer.observe(element)
    }
  }
})

// 暴露刷新方法
defineExpose({
  refresh: () => fetchIcon(true),
  retry: () => {
    retryCount.value = 0
    fetchIcon(true)
  }
})
</script>

<style scoped>
.optimized-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
}

.optimized-icon img {
  transition: all 0.3s ease;
  border-radius: 4px;
}

.icon-loading {
  opacity: 0.6;
  filter: blur(0.5px);
}

.icon-loaded {
  opacity: 1;
  filter: none;
}

.icon-error {
  opacity: 0.8;
  filter: grayscale(20%);
}

.icon-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #999;
  background: #f5f5f5;
  border-radius: 4px;
}

.icon-placeholder.loading {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

.icon-placeholder.default {
  background: #f8f8f8;
  border: 1px dashed #ddd;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .optimized-icon {
    background: #2d2d2d;
  }
  
  .icon-placeholder {
    background: #2d2d2d;
    color: #666;
  }
  
  .icon-placeholder.loading {
    background: linear-gradient(90deg, #2d2d2d 25%, #3d3d3d 50%, #2d2d2d 75%);
    background-size: 200% 100%;
  }
  
  .icon-placeholder.default {
    background: #2a2a2a;
    border-color: #444;
  }
}
</style> 