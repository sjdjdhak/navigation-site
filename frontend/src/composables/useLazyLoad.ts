import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import type { Ref } from 'vue'

interface LazyLoadOptions {
  /** 根边距 */
  rootMargin?: string
  /** 阈值 */
  threshold?: number
  /** 是否只触发一次 */
  once?: boolean
  /** 延迟时间 */
  delay?: number
}

/**
 * 基础懒加载 Hook
 */
export function useLazyLoad(options: LazyLoadOptions = {}) {
  const {
    rootMargin = '50px',
    threshold = 0.1,
    once = true,
    delay = 0
  } = options

  const targetRef = ref<HTMLElement>()
  const isVisible = ref(false)
  const observer = ref<IntersectionObserver>()

  const initObserver = () => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      isVisible.value = true
      return
    }

    observer.value = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => {
              isVisible.value = true
            }, delay)
          } else {
            isVisible.value = true
          }

          if (once && observer.value && targetRef.value) {
            observer.value.unobserve(targetRef.value)
          }
        } else if (!once) {
          isVisible.value = false
        }
      },
      { rootMargin, threshold }
    )

    if (targetRef.value) {
      observer.value.observe(targetRef.value)
    }
  }

  onMounted(() => {
    nextTick(() => {
      initObserver()
    })
  })

  onUnmounted(() => {
    if (observer.value && targetRef.value) {
      observer.value.unobserve(targetRef.value)
    }
  })

  return {
    targetRef,
    isVisible
  }
}

/**
 * 数据懒加载 Hook
 */
export function useLazyData<T>(
  loadFn: () => Promise<T>,
  options: LazyLoadOptions & { immediate?: boolean } = {}
) {
  const { immediate = false, ...lazyOptions } = options
  const { targetRef, isVisible } = useLazyLoad(lazyOptions)
  
  const data = ref<T>()
  const loading = ref(false)
  const error = ref<Error | undefined>()

  const load = async () => {
    if (loading.value) return
    
    try {
      loading.value = true
      error.value = undefined
      data.value = await loadFn()
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      console.error('Lazy data loading failed:', err)
    } finally {
      loading.value = false
    }
  }

  // 监听可见性变化
  const stopWatcher = isVisible.value ? null : (() => {
    const watcher = () => {
      if (isVisible.value && !data.value) {
        load()
        if (stopWatcher) stopWatcher()
      }
    }
    
    // 使用定时器检查，避免响应式系统的复杂性
    const interval = setInterval(() => {
      if (isVisible.value && !data.value) {
        load()
        clearInterval(interval)
      }
    }, 100)
    
    return () => clearInterval(interval)
  })()

  // 立即加载
  if (immediate) {
    load()
  }

  onUnmounted(() => {
    if (stopWatcher) stopWatcher()
  })

  return {
    targetRef,
    data: data as Ref<T | undefined>,
    loading,
    error,
    load,
    reload: load
  }
}

/**
 * 图片懒加载 Hook
 */
export function useLazyImage(src: Ref<string> | string, options: LazyLoadOptions = {}) {
  const { targetRef, isVisible } = useLazyLoad(options)
  
  const imageLoaded = ref(false)
  const imageError = ref(false)
  const imageSrc = ref('')

  const loadImage = () => {
    const srcValue = typeof src === 'string' ? src : src.value
    if (!srcValue || imageSrc.value === srcValue) return

    imageLoaded.value = false
    imageError.value = false
    
    const img = new Image()
    img.onload = () => {
      imageSrc.value = srcValue
      imageLoaded.value = true
      imageError.value = false
    }
    img.onerror = () => {
      imageError.value = true
      imageLoaded.value = false
    }
    img.src = srcValue
  }

  // 监听可见性
  const stopWatcher = (() => {
    const interval = setInterval(() => {
      if (isVisible.value && !imageSrc.value) {
        loadImage()
        clearInterval(interval)
      }
    }, 100)
    
    return () => clearInterval(interval)
  })()

  onUnmounted(() => {
    if (stopWatcher) stopWatcher()
  })

  return {
    targetRef,
    imageSrc,
    imageLoaded,
    imageError,
    isVisible
  }
}

/**
 * 列表懒加载 Hook（无限滚动）
 */
export function useLazyList<T>(
  loadMoreFn: (page: number) => Promise<T[]>,
  options: LazyLoadOptions & { pageSize?: number } = {}
) {
  const { pageSize = 20, ...lazyOptions } = options
  const { targetRef, isVisible } = useLazyLoad({ ...lazyOptions, once: false })
  
  const items = ref<T[]>([])
  const loading = ref(false)
  const hasMore = ref(true)
  const page = ref(1)
  const error = ref<Error | undefined>()

  const loadMore = async () => {
    if (loading.value || !hasMore.value) return
    
    try {
      loading.value = true
      error.value = undefined
      
      const newItems = await loadMoreFn(page.value)
      
      if (newItems.length < pageSize) {
        hasMore.value = false
      }
      
      items.value.push(...(newItems as any))
      page.value++
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      console.error('Load more failed:', err)
    } finally {
      loading.value = false
    }
  }

  // 监听滚动到底部
  const stopWatcher = (() => {
    const interval = setInterval(() => {
      if (isVisible.value && hasMore.value && !loading.value) {
        loadMore()
      }
    }, 200)
    
    return () => clearInterval(interval)
  })()

  // 初始加载
  onMounted(() => {
    loadMore()
  })

  onUnmounted(() => {
    if (stopWatcher) stopWatcher()
  })

  const reset = () => {
    items.value = []
    page.value = 1
    hasMore.value = true
    error.value = undefined
    loadMore()
  }

  return {
    targetRef,
    items: items as Ref<T[]>,
    loading,
    hasMore,
    error,
    loadMore,
    reset
  }
} 