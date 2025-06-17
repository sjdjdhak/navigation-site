<template>
  <div ref="containerRef" class="lazy-wrapper">
    <!-- 内容已加载或强制加载时显示 -->
    <div v-if="isVisible || forceLoad" class="lazy-content">
      <slot />
    </div>
    
    <!-- 占位内容 -->
    <div v-else class="lazy-placeholder" :style="placeholderStyle">
      <!-- 骨架屏 -->
      <div v-if="showSkeleton" class="skeleton">
        <div class="skeleton-title"></div>
        <div class="skeleton-text"></div>
        <div class="skeleton-text short"></div>
      </div>
      
      <!-- 加载指示器 -->
      <div v-else class="loading-indicator">
        <el-icon class="is-loading" size="24">
          <Loading />
        </el-icon>
        <span class="loading-text">{{ loadingText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { Loading } from '@element-plus/icons-vue'

interface Props {
  /** 是否显示骨架屏 */
  showSkeleton?: boolean
  /** 加载文本 */
  loadingText?: string
  /** 占位容器的最小高度 */
  minHeight?: number
  /** 强制加载（跳过懒加载） */
  forceLoad?: boolean
  /** Intersection Observer 的 rootMargin */
  rootMargin?: string
  /** Intersection Observer 的 threshold */
  threshold?: number
  /** 延迟加载时间（ms） */
  delay?: number
}

interface Emits {
  (e: 'visible'): void
  (e: 'loaded'): void
}

const props = withDefaults(defineProps<Props>(), {
  showSkeleton: true,
  loadingText: '加载中...',
  minHeight: 200,
  forceLoad: false,
  rootMargin: '50px',
  threshold: 0.1,
  delay: 0
})

const emit = defineEmits<Emits>()

const containerRef = ref<HTMLElement>()
const isVisible = ref(false)
const observer = ref<IntersectionObserver>()

// 计算占位样式
const placeholderStyle = computed(() => ({
  minHeight: `${props.minHeight}px`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column'
}))

// 处理元素进入视窗
const handleIntersection = (entries: IntersectionObserverEntry[]) => {
  const entry = entries[0]
  if (entry.isIntersecting && !isVisible.value) {
    if (props.delay > 0) {
      setTimeout(() => {
        markAsVisible()
      }, props.delay)
    } else {
      markAsVisible()
    }
  }
}

// 标记为可见
const markAsVisible = () => {
  isVisible.value = true
  emit('visible')
  
  // 断开观察器
  if (observer.value && containerRef.value) {
    observer.value.unobserve(containerRef.value)
  }
  
  // 延迟触发 loaded 事件，确保内容渲染完成
  setTimeout(() => {
    emit('loaded')
  }, 50)
}

// 初始化 Intersection Observer
const initObserver = () => {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    // 如果不支持 IntersectionObserver，直接加载
    markAsVisible()
    return
  }

  observer.value = new IntersectionObserver(handleIntersection, {
    rootMargin: props.rootMargin,
    threshold: props.threshold
  })

  if (containerRef.value) {
    observer.value.observe(containerRef.value)
  }
}

onMounted(() => {
  if (!props.forceLoad) {
    initObserver()
  } else {
    markAsVisible()
  }
})

onUnmounted(() => {
  if (observer.value && containerRef.value) {
    observer.value.unobserve(containerRef.value)
  }
})

// 暴露方法
defineExpose({
  /** 手动触发加载 */
  load: markAsVisible,
  /** 重置状态 */
  reset: () => {
    isVisible.value = false
    if (!props.forceLoad) {
      initObserver()
    }
  }
})
</script>

<style lang="scss" scoped>
.lazy-wrapper {
  width: 100%;
}

.lazy-content {
  width: 100%;
}

.lazy-placeholder {
  background: var(--el-bg-color-page, #f5f5f5);
  border-radius: 8px;
  color: var(--el-text-color-secondary, #909399);
  transition: all 0.3s ease;
  
  &:hover {
    background: var(--el-bg-color, #ffffff);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.loading-text {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.skeleton {
  width: 100%;
  max-width: 300px;
  padding: 20px;
}

.skeleton-title,
.skeleton-text {
  height: 16px;
  background: linear-gradient(
    90deg,
    var(--el-border-color-lighter) 25%,
    var(--el-border-color-light) 50%,
    var(--el-border-color-lighter) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 12px;
}

.skeleton-title {
  height: 20px;
  width: 60%;
}

.skeleton-text {
  width: 100%;
  
  &.short {
    width: 80%;
    margin-bottom: 0;
  }
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

// 深色模式适配
@media (prefers-color-scheme: dark) {
  .lazy-placeholder {
    background: var(--el-bg-color-page, #141414);
    
    &:hover {
      background: var(--el-bg-color, #1a1a1a);
    }
  }
}
</style> 