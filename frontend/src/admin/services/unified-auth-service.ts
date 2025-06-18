// 统一认证服务管理器
import { authService, type AuthState } from './auth-service'
import { envAuthService, type EnvAuthState } from './env-auth-service'
import { cloudAuthService, type CloudAuthState } from './cloud-auth-service'
import { actionsAuthService } from './actions-auth-service'
import type { GitHubConfig } from './github-api'

// 认证模式类型
export type AuthMode = 'github' | 'env-auth' | 'cloud-auth' | 'actions-auth'

// 统一的认证状态接口
export interface UnifiedAuthState {
  mode: AuthMode | null
  isAuthenticated: boolean
  user: any | null
  currentConfig: GitHubConfig | null
  availableModes: AuthMode[]
}

// 认证模式配置
interface AuthModeConfig {
  name: string
  description: string
  isSupported: () => boolean
  priority: number
}

class UnifiedAuthService {
  private state: UnifiedAuthState = {
    mode: null,
    isAuthenticated: false,
    user: null,
    currentConfig: null,
    availableModes: []
  }

  private listeners: Array<(state: UnifiedAuthState) => void> = []
  
  // 认证模式配置
  private authModes: Record<AuthMode, AuthModeConfig> = {
    'actions-auth': {
      name: 'Actions认证',
      description: '使用GitHub Actions作为后端的安全认证',
      isSupported: () => actionsAuthService.isSupported(),
      priority: 1
    },
    'cloud-auth': {
      name: '云端认证',
      description: '简单账号密码登录，配置存储在云端',
      isSupported: () => cloudAuthService.isSupported(),
      priority: 2
    },
    'env-auth': {
      name: '环境变量认证',
      description: '使用环境变量配置的简单登录',
      isSupported: () => envAuthService.isSupported(),
      priority: 3
    },
    'github': {
      name: 'GitHub直连',
      description: '直接输入GitHub配置信息',
      isSupported: () => true,
      priority: 4
    }
  }

  constructor() {
    this.init()
  }

  // 初始化服务
  private async init() {
    // 更新可用模式
    this.updateAvailableModes()
    
    // 检查当前认证状态
    await this.checkCurrentAuth()
    
    // 订阅各个认证服务的状态变化
    this.subscribeToAuthServices()
  }

  // 更新可用认证模式
  private updateAvailableModes() {
    const availableModes: AuthMode[] = []
    
    for (const [mode, config] of Object.entries(this.authModes)) {
      if (config.isSupported()) {
        availableModes.push(mode as AuthMode)
      }
    }
    
    // 按优先级排序
    availableModes.sort((a, b) => {
      return this.authModes[a].priority - this.authModes[b].priority
    })
    
    this.state.availableModes = availableModes
  }

  // 检查当前认证状态
  private async checkCurrentAuth() {
    const storedMode = localStorage.getItem('admin_mode') as AuthMode
    
    if (!storedMode) {
      this.notify()
      return
    }

    let isAuthenticated = false
    
    try {
      switch (storedMode) {
        case 'actions-auth':
          isAuthenticated = await actionsAuthService.checkAuth()
          if (isAuthenticated) {
            const actionsState = actionsAuthService.getState()
            this.state.user = actionsState.user
            this.state.currentConfig = actionsState.currentConfig
          }
          break
          
        case 'cloud-auth':
          isAuthenticated = await cloudAuthService.checkAuth()
          if (isAuthenticated) {
            const cloudState = cloudAuthService.getState()
            this.state.user = cloudState.user
            this.state.currentConfig = cloudState.currentConfig
          }
          break
          
        case 'env-auth':
          isAuthenticated = await envAuthService.checkAuth()
          if (isAuthenticated) {
            const envState = envAuthService.getState()
            this.state.user = envState.user
            this.state.currentConfig = envState.currentConfig
          }
          break
          
        case 'github':
          isAuthenticated = await authService.checkAuth()
          if (isAuthenticated) {
            const githubState = authService.getState()
            this.state.user = githubState.user
            this.state.currentConfig = githubState.config
          }
          break
          
        default:
          console.warn('未知的认证模式:', storedMode)
      }
    } catch (error) {
      console.error('检查认证状态失败:', error)
      isAuthenticated = false
    }

    this.state.mode = isAuthenticated ? storedMode : null
    this.state.isAuthenticated = isAuthenticated
    this.notify()
  }

  // 订阅各个认证服务的状态变化
  private subscribeToAuthServices() {
    // Actions认证
    actionsAuthService.subscribe((state) => {
      if (state.isAuthenticated) {
        this.state.mode = 'actions-auth'
        this.state.isAuthenticated = true
        this.state.user = state.user
        this.state.currentConfig = state.currentConfig
        this.notify()
      } else if (this.state.mode === 'actions-auth') {
        this.state.mode = null
        this.state.isAuthenticated = false
        this.state.user = null
        this.state.currentConfig = null
        this.notify()
      }
    })

    // 云端认证
    cloudAuthService.subscribe((state: CloudAuthState) => {
      if (state.isAuthenticated) {
        this.state.mode = 'cloud-auth'
        this.state.isAuthenticated = true
        this.state.user = state.user
        this.state.currentConfig = state.currentConfig
        this.notify()
      } else if (this.state.mode === 'cloud-auth') {
        // 如果云端认证失效且当前模式是云端认证，清除状态
        this.state.mode = null
        this.state.isAuthenticated = false
        this.state.user = null
        this.state.currentConfig = null
        this.notify()
      }
    })

    // 环境变量认证
    envAuthService.subscribe((state: EnvAuthState) => {
      if (state.isAuthenticated) {
        this.state.mode = 'env-auth'
        this.state.isAuthenticated = true
        this.state.user = state.user
        this.state.currentConfig = state.currentConfig
        this.notify()
      } else if (this.state.mode === 'env-auth') {
        this.state.mode = null
        this.state.isAuthenticated = false
        this.state.user = null
        this.state.currentConfig = null
        this.notify()
      }
    })

    // GitHub直连认证
    authService.subscribe((state: AuthState) => {
      if (state.isAuthenticated) {
        this.state.mode = 'github'
        this.state.isAuthenticated = true
        this.state.user = state.user
        this.state.currentConfig = state.config
        this.notify()
      } else if (this.state.mode === 'github') {
        this.state.mode = null
        this.state.isAuthenticated = false
        this.state.user = null
        this.state.currentConfig = null
        this.notify()
      }
    })
  }

  // 订阅状态变化
  subscribe(listener: (state: UnifiedAuthState) => void) {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  // 通知状态变化
  private notify() {
    this.listeners.forEach(listener => listener(this.state))
  }

  // 获取当前状态
  getState(): UnifiedAuthState {
    return { ...this.state }
  }

  // 使用指定模式登录
  async login(mode: AuthMode, credentials: any): Promise<void> {
    try {
      switch (mode) {
        case 'actions-auth':
          await actionsAuthService.login(credentials.username, credentials.password)
          break
          
        case 'cloud-auth':
          await cloudAuthService.login(credentials.username, credentials.password)
          break
          
        case 'env-auth':
          await envAuthService.login(credentials.username, credentials.password)
          break
          
        case 'github':
          await authService.login(credentials)
          break
          
        default:
          throw new Error(`不支持的认证模式: ${mode}`)
      }
      
      // 更新状态
      await this.checkCurrentAuth()
    } catch (error) {
      console.error(`${mode} 登录失败:`, error)
      throw error
    }
  }

  // 登出
  logout() {
    // 清除当前认证模式的状态
    switch (this.state.mode) {
      case 'actions-auth':
        actionsAuthService.logout()
        break
      case 'cloud-auth':
        cloudAuthService.logout()
        break
      case 'env-auth':
        envAuthService.logout()
        break
      case 'github':
        authService.logout()
        break
    }

    // 重置状态
    this.state.mode = null
    this.state.isAuthenticated = false
    this.state.user = null
    this.state.currentConfig = null
    
    this.notify()
  }

  // 检查权限
  hasPermission(permission: string): boolean {
    if (!this.state.isAuthenticated) return false
    
    switch (this.state.mode) {
      case 'actions-auth':
        return actionsAuthService.hasPermission(permission)
      case 'cloud-auth':
        return cloudAuthService.hasPermission(permission)
      case 'env-auth':
        return envAuthService.hasPermission(permission)
      case 'github':
        return true // GitHub直连默认有所有权限
      default:
        return false
    }
  }

  // 获取认证模式信息
  getAuthModeInfo(mode: AuthMode) {
    return this.authModes[mode]
  }

  // 获取所有可用模式信息
  getAvailableModesInfo() {
    return this.state.availableModes.map(mode => ({
      mode,
      ...this.authModes[mode]
    }))
  }

  // 获取推荐的认证模式
  getRecommendedMode(): AuthMode | null {
    return this.state.availableModes[0] || null
  }

  // 获取当前用户信息
  getCurrentUser() {
    return this.state.user
  }

  // 获取当前GitHub配置
  getCurrentConfig(): GitHubConfig | null {
    return this.state.currentConfig
  }

  // 检查是否已认证
  isAuthenticated(): boolean {
    return this.state.isAuthenticated
  }

  // 获取当前认证模式
  getCurrentMode(): AuthMode | null {
    return this.state.mode
  }
}

// 导出单例
export const unifiedAuthService = new UnifiedAuthService()
export default unifiedAuthService 