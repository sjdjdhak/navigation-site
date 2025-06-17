<template>
  <div 
    class="optimized-icon" 
    :class="{
      'icon-loading': isLoading,
      'icon-loaded': isLoaded,
      'icon-error': hasError,
      'icon-small': size <= 24,
      'icon-medium': size > 24 && size <= 48,
      'icon-large': size > 48
    }"
    :style="containerStyle"
  >
    <!-- 背景渐变 -->
    <div class="icon-background" :style="backgroundStyle"></div>
    
    <!-- 主图标 -->
    <div class="icon-content">
      <img
        v-if="currentIconUrl && !hasError"
        :src="currentIconUrl"
        :alt="alt || title"
        :style="iconStyle"
        @load="handleLoad"
        @error="handleError"
        class="icon-image"
      />
      
      <!-- 加载状态 -->
      <div v-else-if="isLoading" class="icon-placeholder loading">
        <div class="loading-spinner"></div>
      </div>
      
      <!-- 错误/默认状态 -->
      <div v-else class="icon-placeholder default">
        <div class="default-icon" :style="defaultIconStyle">
          {{ getDefaultIcon() }}
        </div>
      </div>
    </div>
    
    <!-- 装饰性边框 -->
    <div class="icon-border"></div>
    
    <!-- 闪光效果（加载完成时） -->
    <div v-if="showShine" class="shine-effect"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { getFaviconUrl } from '@/utils/favicon-helper'

interface Props {
  domain?: string
  url?: string
  title?: string
  alt?: string
  size?: number
  lazy?: boolean
  fallbackIcon?: string
  borderRadius?: number
  theme?: 'default' | 'modern' | 'glass' | 'minimal'
}

const props = withDefaults(defineProps<Props>(), {
  domain: '',
  url: '',
  title: '',
  alt: '',
  size: 32,
  lazy: false,
  fallbackIcon: '/assets/default-favicon.svg',
  borderRadius: 8,
  theme: 'modern'
})

const currentIconUrl = ref('')
const isLoading = ref(false)
const isLoaded = ref(false)
const hasError = ref(false)
const showShine = ref(false)
const retryCount = ref(0)
const maxRetries = 3

// 容器样式
const containerStyle = computed(() => ({
  width: props.size + 'px',
  height: props.size + 'px',
  borderRadius: props.borderRadius + 'px'
}))

// 背景样式（根据主题生成）
const backgroundStyle = computed(() => {
  const baseSize = props.size
  
  switch (props.theme) {
    case 'modern':
      return {
        background: isLoaded.value 
          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          : hasError.value
            ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)'
            : 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        opacity: isLoaded.value ? '0.1' : '0.8'
      }
    case 'glass':
      return {
        background: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.18)'
      }
    case 'minimal':
      return {
        background: 'var(--el-bg-color-page)',
        border: '1px solid var(--el-border-color-light)'
      }
    default:
      return {
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }
  }
})

// 图标样式
const iconStyle = computed(() => ({
  width: props.size - 4 + 'px',
  height: props.size - 4 + 'px',
  borderRadius: (props.borderRadius - 2) + 'px',
  objectFit: 'cover' as const
}))

// 默认图标样式
const defaultIconStyle = computed(() => {
  const fontSize = Math.max(12, Math.min(props.size * 0.5, 24))
  return {
    fontSize: fontSize + 'px',
    fontWeight: '600',
    color: hasError.value ? '#ff4757' : '#2f3542'
  }
})

// 提取域名
const extractDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  }
}

// 生成默认图标（使用域名首字母或通用图标）
const getDefaultIcon = (): string => {
  if (hasError.value) return '⚠'
  
  const domain = props.domain || (props.url ? extractDomain(props.url) : '')
  if (domain) {
    // 使用域名首字母
    return domain.charAt(0).toUpperCase()
  }
  
  const title = props.title || props.alt
  if (title) {
    return title.charAt(0).toUpperCase()
  }
  
  return '🌐'
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
      isLoaded.value = false
    }
    
    console.debug(`✅ Favicon获取成功: ${targetDomain} -> ${iconUrl}`)
  } catch (error) {
    console.error(`❌ Favicon获取失败: ${targetDomain}`, error)
    hasError.value = true
    currentIconUrl.value = ''
  } finally {
    isLoading.value = false
  }
}

// 图片加载成功
const handleLoad = async () => {
  isLoaded.value = true
  hasError.value = false
  retryCount.value = 0
  
  // 触发闪光效果
  await nextTick()
  showShine.value = true
  setTimeout(() => {
    showShine.value = false
  }, 600)
  
  console.debug(`🖼️ 图标加载成功: ${currentIconUrl.value}`)
}

// 图片加载失败
const handleError = async () => {
  console.warn(`🚫 图标加载失败: ${currentIconUrl.value}`)
  
  if (retryCount.value < maxRetries) {
    retryCount.value++
    console.debug(`🔄 重试获取图标 (${retryCount.value}/${maxRetries})`)
    
    setTimeout(() => {
      fetchIcon(true)
    }, retryCount.value * 1000)
  } else {
    hasError.value = true
    currentIconUrl.value = ''
    console.debug(`💡 使用默认图标显示`)
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

// 暴露方法
defineExpose({
  refresh: () => fetchIcon(true),
  retry: () => {
    retryCount.value = 0
    fetchIcon(true)
  }
})
</script>

<style lang="scss" scoped>
.optimized-icon {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  
  // 悬停效果
  &:hover {
    transform: translateY(-1px);
    
    .icon-background {
      opacity: 0.9 !important;
    }
    
    .icon-border {
      opacity: 1;
      transform: scale(1.05);
    }
  }
  
  // 大小变体
  &.icon-small {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  &.icon-medium {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
  
  &.icon-large {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  // 状态变体
  &.icon-loading {
    .icon-content {
      opacity: 0.7;
    }
  }
  
  &.icon-loaded {
    .icon-image {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  &.icon-error {
    .icon-background {
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%) !important;
      opacity: 0.1 !important;
    }
  }
}

.icon-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: inherit;
  transition: all 0.3s ease;
  z-index: 1;
}

.icon-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.icon-image {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  transform: scale(0.8);
  border-radius: inherit;
  
  &:not(.icon-loading) {
    opacity: 1;
    transform: scale(1);
  }
}

.icon-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  
  &.loading {
    .loading-spinner {
      width: 50%;
      height: 50%;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      opacity: 0.6;
    }
  }
  
  &.default {
    .default-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      transition: all 0.3s ease;
    }
  }
}

.icon-border {
  position: absolute;
  top: -1px;
  left: -1px;
  right: -1px;
  bottom: -1px;
  border-radius: inherit;
  background: linear-gradient(45deg, 
    rgba(255, 255, 255, 0.3) 0%, 
    rgba(255, 255, 255, 0.1) 50%, 
    rgba(255, 255, 255, 0.3) 100%);
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 3;
  pointer-events: none;
}

.shine-effect {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 100%
  );
  border-radius: inherit;
  animation: shine 0.6s ease-out;
  z-index: 4;
  pointer-events: none;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes shine {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

// 深色模式适配
@media (prefers-color-scheme: dark) {
  .optimized-icon {
    &.icon-small {
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    }
    
    &.icon-medium {
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    }
    
    &.icon-large {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    }
  }
  
  .icon-placeholder.default .default-icon {
    color: #f1f2f6;
  }
}

// 主题样式
.optimized-icon[data-theme="glass"] {
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.optimized-icon[data-theme="minimal"] {
  box-shadow: none;
  border: 1px solid var(--el-border-color-light);
  
  &:hover {
    border-color: var(--el-border-color);
  }
}
</style> 