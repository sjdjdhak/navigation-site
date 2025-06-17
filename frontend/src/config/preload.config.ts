// 预加载配置文件
export interface PreloadStrategy {
  name: string
  description: string
  enabled: boolean
  maxConcurrent: number
  retryTimes: number
  retryDelay: number
  priorityCategories: string[]
  immediateLoad: string[]
  delayedLoad: {
    priority: string[]
    normal: string[]
    delay: number
  }
  features: {
    progressIndicator: boolean
    errorRetry: boolean
    backgroundLoading: boolean
    localStorage: boolean
  }
}

// 预设策略
export const PRELOAD_STRATEGIES: Record<string, PreloadStrategy> = {
  // 懒加载策略 - 最少资源消耗
  lazy: {
    name: 'lazy',
    description: '按需加载，最小化初始资源消耗',
    enabled: true,
    maxConcurrent: 1,
    retryTimes: 1,
    retryDelay: 2000,
    priorityCategories: ['design-tools'],
    immediateLoad: [],
    delayedLoad: {
      priority: ['design-tools'],
      normal: [],
      delay: 5000
    },
    features: {
      progressIndicator: false,
      errorRetry: true,
      backgroundLoading: true,
      localStorage: false
    }
  },

  // 渐进式策略 - 平衡性能和体验
  progressive: {
    name: 'progressive',
    description: '渐进式加载，平衡首屏性能和用户体验',
    enabled: true,
    maxConcurrent: 3,
    retryTimes: 2,
    retryDelay: 1000,
    priorityCategories: ['design-tools', 'dev-resources', 'productivity'],
    immediateLoad: [],
    delayedLoad: {
      priority: ['design-tools', 'dev-resources', 'productivity'],
      normal: ['creative-tools', 'learning'],
      delay: 500
    },
    features: {
      progressIndicator: true,
      errorRetry: true,
      backgroundLoading: true,
      localStorage: true
    }
  },

  // 立即加载策略 - 最佳用户体验
  immediate: {
    name: 'immediate',
    description: '立即加载所有资源，提供最佳用户体验',
    enabled: true,
    maxConcurrent: 5,
    retryTimes: 3,
    retryDelay: 500,
    priorityCategories: ['design-tools', 'dev-resources', 'productivity'],
    immediateLoad: ['design-tools', 'dev-resources'],
    delayedLoad: {
      priority: ['productivity', 'creative-tools'],
      normal: ['learning'],
      delay: 100
    },
    features: {
      progressIndicator: true,
      errorRetry: true,
      backgroundLoading: false,
      localStorage: true
    }
  },

  // 高性能策略 - 适合高端设备
  performance: {
    name: 'performance',
    description: '高性能设备优化，最大化并发加载',
    enabled: true,
    maxConcurrent: 8,
    retryTimes: 3,
    retryDelay: 300,
    priorityCategories: ['design-tools', 'dev-resources', 'productivity', 'creative-tools'],
    immediateLoad: ['design-tools', 'dev-resources', 'productivity'],
    delayedLoad: {
      priority: ['creative-tools'],
      normal: ['learning'],
      delay: 50
    },
    features: {
      progressIndicator: true,
      errorRetry: true,
      backgroundLoading: false,
      localStorage: true
    }
  },

  // 低端设备策略
  lowEnd: {
    name: 'lowEnd',
    description: '低端设备优化，减少内存和网络消耗',
    enabled: true,
    maxConcurrent: 1,
    retryTimes: 1,
    retryDelay: 3000,
    priorityCategories: ['design-tools'],
    immediateLoad: [],
    delayedLoad: {
      priority: ['design-tools'],
      normal: [],
      delay: 3000
    },
    features: {
      progressIndicator: false,
      errorRetry: false,
      backgroundLoading: true,
      localStorage: false
    }
  }
}

// 自动检测策略
export const detectOptimalStrategy = (): string => {
  // 检测网络连接
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
  const isSlowConnection = connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g'
  
  // 检测设备性能
  const deviceMemory = (navigator as any).deviceMemory || 4 // 默认4GB
  const isLowEndDevice = navigator.hardwareConcurrency < 4 || deviceMemory < 4
  
  // 检测电池状态
  const isBatteryLow = false // 可以通过Battery API检测，但需要用户授权
  
  // 根据条件选择策略
  if (isSlowConnection || isLowEndDevice || isBatteryLow) {
    return 'lowEnd'
  } else if (navigator.hardwareConcurrency >= 8 && deviceMemory >= 8) {
    return 'performance'
  } else {
    return 'progressive'
  }
}

// 获取当前推荐策略
export const getRecommendedStrategy = (): PreloadStrategy => {
  const strategyName = detectOptimalStrategy()
  return PRELOAD_STRATEGIES[strategyName]
}

// 用户偏好存储
export const PreloadPreferences = {
  // 保存用户选择的策略
  save(strategy: string) {
    try {
      localStorage.setItem('preload-strategy', strategy)
    } catch (e) {
      console.warn('无法保存预加载策略偏好:', e)
    }
  },

  // 加载用户选择的策略
  load(): string | null {
    try {
      return localStorage.getItem('preload-strategy')
    } catch (e) {
      console.warn('无法加载预加载策略偏好:', e)
      return null
    }
  },

  // 清除用户偏好
  clear() {
    try {
      localStorage.removeItem('preload-strategy')
    } catch (e) {
      console.warn('无法清除预加载策略偏好:', e)
    }
  }
}

// 导出默认配置
export const DEFAULT_PRELOAD_CONFIG = PRELOAD_STRATEGIES.progressive 