// 认证服务
import { githubApi, type GitHubConfig } from './github-api'

export interface AuthState {
  isAuthenticated: boolean
  user: any | null
  config: GitHubConfig | null
}

class AuthService {
  private readonly STORAGE_KEY = 'github_config'
  private state: AuthState = {
    isAuthenticated: false,
    user: null,
    config: null
  }
  private listeners: Array<(state: AuthState) => void> = []

  constructor() {
    this.loadFromStorage()
  }

  // 订阅状态变化
  subscribe(listener: (state: AuthState) => void) {
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
  getState(): AuthState {
    return { ...this.state }
  }

  // 从本地存储加载配置
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const config = JSON.parse(stored)
        this.setConfig(config, false)
      }
    } catch (error) {
      console.error('加载认证配置失败:', error)
      this.clearConfig()
    }
  }

  // 保存配置到本地存储
  private saveToStorage(config: GitHubConfig) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config))
    } catch (error) {
      console.error('保存认证配置失败:', error)
    }
  }

  // 设置GitHub配置
  async setConfig(config: GitHubConfig, validate: boolean = true): Promise<boolean> {
    try {
      // 设置GitHub API配置
      githubApi.setConfig(config)

      if (validate) {
        // 验证Token有效性
        const isValid = await githubApi.validateToken()
        if (!isValid) {
          throw new Error('GitHub Token无效')
        }

        // 获取用户信息
        const user = await githubApi.getUserInfo()
        
        // 验证仓库访问权限
        try {
          await githubApi.getRepoInfo()
        } catch (error) {
          throw new Error('无法访问指定仓库，请检查仓库名称和权限')
        }

        this.state.user = user
      }

      this.state.config = config
      this.state.isAuthenticated = true
      
      if (validate) {
        this.saveToStorage(config)
      }
      
      this.notify()
      return true
    } catch (error) {
      console.error('设置GitHub配置失败:', error)
      this.clearConfig()
      throw error
    }
  }

  // 清除配置
  clearConfig() {
    this.state = {
      isAuthenticated: false,
      user: null,
      config: null
    }
    
    localStorage.removeItem(this.STORAGE_KEY)
    this.notify()
  }

  // 登录
  async login(config: GitHubConfig): Promise<void> {
    await this.setConfig(config, true)
  }

  // 登出
  logout() {
    this.clearConfig()
  }

  // 检查认证状态
  async checkAuth(): Promise<boolean> {
    // 检查测试模式
    const testMode = localStorage.getItem('admin_mode')
    if (testMode === 'test') {
      const user = localStorage.getItem('admin_user')
      return !!user // 如果有测试用户信息，则认为已认证
    }

    // 检查GitHub模式
    if (!this.state.isAuthenticated || !this.state.config) {
      return false
    }

    try {
      // 验证Token是否仍然有效
      const isValid = await githubApi.validateToken()
      if (!isValid) {
        this.clearConfig()
        return false
      }
      return true
    } catch (error) {
      console.error('检查认证状态失败:', error)
      this.clearConfig()
      return false
    }
  }

  // 刷新用户信息
  async refreshUserInfo(): Promise<void> {
    if (!this.state.isAuthenticated) {
      throw new Error('用户未认证')
    }

    try {
      const user = await githubApi.getUserInfo()
      this.state.user = user
      this.notify()
    } catch (error) {
      console.error('刷新用户信息失败:', error)
      throw error
    }
  }

  // 验证配置格式
  validateConfig(config: Partial<GitHubConfig>): string[] {
    const errors: string[] = []

    if (!config.owner?.trim()) {
      errors.push('GitHub用户名/组织名不能为空')
    }

    if (!config.repo?.trim()) {
      errors.push('仓库名称不能为空')
    }

    if (!config.token?.trim()) {
      errors.push('GitHub Token不能为空')
    } else if (!this.isValidToken(config.token)) {
      errors.push('GitHub Token格式不正确')
    }

    return errors
  }

  // 验证Token格式
  private isValidToken(token: string): boolean {
    // GitHub Personal Access Token格式验证
    // 经典Token: ghp_开头，40字符
    // Fine-grained Token: github_pat_开头
    return /^(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]+)$/.test(token)
  }

  // 获取Token创建指南URL
  getTokenGuideUrl(): string {
    return 'https://docs.github.com/zh/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token'
  }

  // 获取所需权限列表
  getRequiredPermissions(): string[] {
    return [
      'repo - 仓库访问权限',
      'contents:write - 文件读写权限',
      'metadata:read - 仓库元数据读取权限'
    ]
  }
}

export const authService = new AuthService() 