// 数据源配置
export interface DataConfig {
  // 数据源类型：'static' | 'github' | 'hybrid'
  dataSource: 'static' | 'github' | 'hybrid'
  
  // GitHub配置
  github: {
    useGitHub: boolean // 是否使用GitHub API
    fallbackToStatic: boolean // 失败时回退到静态文件
    retryTimes: number // 重试次数
    retryDelay: number // 重试延迟（毫秒）
  }
  
  // 缓存配置
  cache: {
    enabled: boolean // 是否启用缓存
    ttl: number // 缓存时间（毫秒）
    maxSize: number // 最大缓存条目数
  }
  
  // 调试配置
  debug: {
    enabled: boolean // 是否启用调试日志
    logDataSource: boolean // 是否记录数据源切换
    logCacheHit: boolean // 是否记录缓存命中
  }
}

// 默认配置
export const DEFAULT_DATA_CONFIG: DataConfig = {
  // 切换到混合模式（GitHub优先，静态文件兜底）
  dataSource: 'hybrid',
  
  github: {
    useGitHub: true, // 启用GitHub API
    fallbackToStatic: true, // 启用兜底机制
    retryTimes: 2, // 重试2次
    retryDelay: 1000, // 延迟1秒
  },
  
  cache: {
    enabled: true, // 启用缓存
    ttl: 5 * 60 * 1000, // 5分钟缓存
    maxSize: 100, // 最多缓存100个条目
  },
  
  debug: {
    enabled: process.env.NODE_ENV === 'development', // 开发环境启用调试
    logDataSource: true,
    logCacheHit: false,
  }
}

// 当前生效的配置
let currentConfig: DataConfig = { ...DEFAULT_DATA_CONFIG }

// 获取当前配置
export function getDataConfig(): DataConfig {
  return currentConfig
}

// 更新配置
export function updateDataConfig(newConfig: Partial<DataConfig>): void {
  currentConfig = {
    ...currentConfig,
    ...newConfig,
    github: {
      ...currentConfig.github,
      ...newConfig.github,
    },
    cache: {
      ...currentConfig.cache,
      ...newConfig.cache,
    },
    debug: {
      ...currentConfig.debug,
      ...newConfig.debug,
    },
  }
  
  if (currentConfig.debug.enabled && currentConfig.debug.logDataSource) {
    console.log('DataConfig - 配置已更新:', currentConfig)
  }
}

// 重置配置为默认值
export function resetDataConfig(): void {
  currentConfig = { ...DEFAULT_DATA_CONFIG }
  
  if (currentConfig.debug.enabled) {
    console.log('DataConfig - 配置已重置为默认值')
  }
}

// 从环境变量或本地存储加载配置
export function loadDataConfig(): void {
  try {
    // 1. 从环境变量加载
    const envConfig: Partial<DataConfig> = {}
    
    if (process.env.VITE_DATA_SOURCE) {
      envConfig.dataSource = process.env.VITE_DATA_SOURCE as any
    }
    
    if (process.env.VITE_USE_GITHUB === 'true') {
      envConfig.github = {
        ...currentConfig.github,
        useGitHub: true,
      }
    }
    
    // 2. 从本地存储加载（开发环境）
    if (process.env.NODE_ENV === 'development') {
      try {
        const stored = localStorage.getItem('dataConfig')
        if (stored) {
          const storedConfig = JSON.parse(stored)
          Object.assign(envConfig, storedConfig)
        }
      } catch (error) {
        console.warn('DataConfig - 加载本地存储配置失败:', error)
      }
    }
    
    // 3. 应用配置
    if (Object.keys(envConfig).length > 0) {
      updateDataConfig(envConfig)
    }
    
  } catch (error) {
    console.error('DataConfig - 加载配置失败:', error)
  }
}

// 保存配置到本地存储（仅开发环境）
export function saveDataConfig(): void {
  if (process.env.NODE_ENV === 'development') {
    try {
      localStorage.setItem('dataConfig', JSON.stringify(currentConfig))
      console.log('DataConfig - 配置已保存到本地存储')
    } catch (error) {
      console.warn('DataConfig - 保存配置到本地存储失败:', error)
    }
  }
}

// 预设配置模式
export const CONFIG_PRESETS = {
  // 静态文件模式（当前模式）
  static: {
    dataSource: 'static' as const,
    github: { useGitHub: false, fallbackToStatic: true, retryTimes: 0, retryDelay: 0 },
  },
  
  // GitHub API模式
  github: {
    dataSource: 'github' as const,
    github: { useGitHub: true, fallbackToStatic: false, retryTimes: 3, retryDelay: 1000 },
  },
  
  // 混合模式（推荐）
  hybrid: {
    dataSource: 'hybrid' as const,
    github: { useGitHub: true, fallbackToStatic: true, retryTimes: 2, retryDelay: 1000 },
  },
} as const

// 应用预设配置
export function applyPreset(preset: keyof typeof CONFIG_PRESETS): void {
  const presetConfig = CONFIG_PRESETS[preset]
  updateDataConfig(presetConfig)
  
  if (currentConfig.debug.enabled) {
    console.log(`DataConfig - 已应用预设配置: ${preset}`, presetConfig)
  }
}

// 初始化配置
loadDataConfig() 