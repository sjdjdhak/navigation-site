// 认证服务
import { githubApi, type GitHubConfig } from '@/admin/services/github-api'
import { secureStore, secureRetrieve, secureRemove, isCryptoSupported } from '@/utils/crypto'

export interface AuthState {
  isAuthenticated: boolean
  user: any | null
  config: GitHubConfig | null
}

class AuthService {
  private readonly STORAGE_KEY = 'github_config_encrypted'
  private readonly LEGACY_KEY = 'github_config' // 旧的明文存储key
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
  private async loadFromStorage() {
    try {
      // 检查是否支持加密
      if (!isCryptoSupported()) {
        console.warn('浏览器不支持Web Crypto API，使用明文存储（不推荐）')
        this.loadLegacyConfig()
        return
      }

      // 尝试加载加密配置
      const config = await secureRetrieve(this.STORAGE_KEY)
      if (config) {
        await this.setConfig(config, false)
        return
      }

      // 如果没有加密配置，尝试迁移旧配置
      this.migrateLegacyConfig()
    } catch (error) {
      console.error('加载认证配置失败:', error)
      this.clearConfig()
    }
  }

  // 加载旧的明文配置（兼容性）
  private loadLegacyConfig() {
    try {
      const stored = localStorage.getItem(this.LEGACY_KEY)
      if (stored) {
        const config = JSON.parse(stored)
        this.setConfig(config, false)
      }
    } catch (error) {
      console.error('加载旧配置失败:', error)
    }
  }

  // 迁移旧配置到加密存储
  private async migrateLegacyConfig() {
    try {
      const stored = localStorage.getItem(this.LEGACY_KEY)
      if (stored) {
        const config = JSON.parse(stored)
        // 保存到加密存储
        await this.saveToStorage(config)
        // 删除旧的明文存储
        localStorage.removeItem(this.LEGACY_KEY)
        console.info('已成功迁移配置到加密存储')
        await this.setConfig(config, false)
      }
    } catch (error) {
      console.error('迁移配置失败:', error)
    }
  }

  // 保存配置到安全存储
  private async saveToStorage(config: GitHubConfig) {
    try {
      if (isCryptoSupported()) {
        await secureStore(this.STORAGE_KEY, config)
      } else {
        // 降级到明文存储（不推荐，但保证兼容性）
        console.warn('使用明文存储（不安全）')
        localStorage.setItem(this.LEGACY_KEY, JSON.stringify(config))
      }
    } catch (error) {
      console.error('保存认证配置失败:', error)
      throw new Error('保存认证配置失败')
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
        
        // 设置GitHub模式标识
        localStorage.setItem('admin_mode', 'github')
        localStorage.setItem('admin_login_time', new Date().toISOString())
      }

      this.state.config = config
      this.state.isAuthenticated = true
      
      if (validate) {
        await this.saveToStorage(config)
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
    
    // 清除所有相关存储
    if (isCryptoSupported()) {
      secureRemove(this.STORAGE_KEY)
    }
    localStorage.removeItem(this.LEGACY_KEY)
    localStorage.removeItem('admin_mode')
    localStorage.removeItem('admin_login_time')
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
    // 只检查GitHub模式（已移除测试模式）
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
    const classicPattern = /^ghp_[a-zA-Z0-9]{36}$/
    const fineGrainedPattern = /^github_pat_[a-zA-Z0-9_]{22,255}$/
    
    return classicPattern.test(token) || fineGrainedPattern.test(token)
  }

  // 获取Token使用指南URL
  getTokenGuideUrl(): string {
    return 'https://docs.github.com/zh/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens'
  }

  // 获取所需权限列表
  getRequiredPermissions(): string[] {
    return [
      'Contents (读写) - 用于读取和更新仓库内容',
      'Metadata (读) - 用于访问仓库基本信息'
    ]
  }

  // 获取安全状态信息
  getSecurityInfo() {
    return {
      cryptoSupported: isCryptoSupported(),
      storageType: isCryptoSupported() ? 'encrypted' : 'plaintext',
      recommendation: isCryptoSupported() ? 
        '您的配置已加密存储，安全性良好' : 
        '建议升级浏览器以支持加密存储'
    }
  }
}

export const authService = new AuthService() 