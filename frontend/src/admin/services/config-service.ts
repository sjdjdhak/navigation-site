// 运行时配置服务
interface RuntimeConfig {
  cloudAuth: {
    configRepo: {
      owner: string
      repo: string
      branch: string
    }
    userConfigPath: string
    enabled: boolean
  }
  app: {
    name: string
    version: string
    description: string
  }
  features: {
    cloudAuth: boolean
    envAuth: boolean
    githubAuth: boolean
  }
}

class ConfigService {
  private config: RuntimeConfig | null = null
  private loading: boolean = false
  private loadPromise: Promise<RuntimeConfig> | null = null

  // 获取配置，如果尚未加载则先加载
  async getConfig(): Promise<RuntimeConfig> {
    if (this.config) {
      return this.config
    }

    if (this.loadPromise) {
      return this.loadPromise
    }

    this.loadPromise = this.loadConfig()
    return this.loadPromise
  }

  // 从远程加载配置
  private async loadConfig(): Promise<RuntimeConfig> {
    try {
      this.loading = true
      
      // 尝试从多个可能的路径加载配置
      const configPaths = [
        '/navigation-site/config.json',  // GitHub Pages路径
        '/config.json',                  // 根路径
        './config.json'                  // 相对路径
      ]

      let config: RuntimeConfig | null = null
      let lastError: Error | null = null

      for (const path of configPaths) {
        try {
          console.log(`尝试从 ${path} 加载配置...`)
          const response = await fetch(path, {
            cache: 'no-cache',
            headers: {
              'Accept': 'application/json'
            }
          })

          if (response.ok) {
            config = await response.json()
            console.log(`成功从 ${path} 加载配置:`, config)
            break
          } else {
            console.warn(`从 ${path} 加载配置失败: ${response.status}`)
          }
        } catch (error) {
          console.warn(`从 ${path} 加载配置出错:`, error)
          lastError = error as Error
        }
      }

      if (!config) {
        // 如果所有路径都失败，使用默认配置
        console.warn('所有配置路径都失败，使用默认配置')
        config = this.getDefaultConfig()
      }

      this.config = config
      return config
    } catch (error) {
      console.error('加载配置失败:', error)
      // 返回默认配置作为降级方案
      this.config = this.getDefaultConfig()
      return this.config
    } finally {
      this.loading = false
    }
  }

  // 默认配置（降级方案）
  private getDefaultConfig(): RuntimeConfig {
    return {
      cloudAuth: {
        configRepo: {
          owner: 'sjdjdhak',
          repo: 'navigation-site',
          branch: 'main'
        },
        userConfigPath: '.admin/users',
        enabled: true
      },
      app: {
        name: '导航站',
        version: '1.0.0',
        description: '精选设计、开发与创意资源'
      },
      features: {
        cloudAuth: true,
        envAuth: true,
        githubAuth: true
      }
    }
  }

  // 获取云端认证配置
  async getCloudAuthConfig() {
    const config = await this.getConfig()
    return config.cloudAuth
  }

  // 检查功能是否启用
  async isFeatureEnabled(feature: keyof RuntimeConfig['features']): Promise<boolean> {
    const config = await this.getConfig()
    return config.features[feature]
  }

  // 获取应用信息
  async getAppInfo() {
    const config = await this.getConfig()
    return config.app
  }

  // 强制重新加载配置
  async reloadConfig(): Promise<RuntimeConfig> {
    this.config = null
    this.loadPromise = null
    return this.getConfig()
  }

  // 检查配置是否已加载
  isLoaded(): boolean {
    return this.config !== null
  }

  // 检查是否正在加载
  isLoading(): boolean {
    return this.loading
  }
}

// 导出单例
export const configService = new ConfigService()
export default configService
export type { RuntimeConfig } 