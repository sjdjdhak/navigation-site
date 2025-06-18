// 基于环境变量的认证服务
import { githubApi, type GitHubConfig } from '@/admin/services/github-api'

export interface EnvUserConfig {
  username: string
  passwordHash: string
  role: 'admin' | 'manager' | 'viewer'
  permissions: string[]
  active: boolean
  githubConfig: GitHubConfig
}

export interface EnvAuthState {
  isAuthenticated: boolean
  user: EnvUserConfig | null
  currentConfig: GitHubConfig | null
}

class EnvAuthService {
  private state: EnvAuthState = {
    isAuthenticated: false,
    user: null,
    currentConfig: null
  }
  private listeners: Array<(state: EnvAuthState) => void> = []
  private loginAttempts: Record<string, { count: number; lastAttempt: number }> = {}

  // 从环境变量获取配置
  private getEnvConfig(): EnvUserConfig | null {
    const username = import.meta.env.VITE_ADMIN_USERNAME
    const passwordHash = import.meta.env.VITE_ADMIN_PASSWORD_HASH
    const githubOwner = import.meta.env.VITE_GITHUB_OWNER
    const githubRepo = import.meta.env.VITE_GITHUB_REPO
    const githubBranch = import.meta.env.VITE_GITHUB_BRANCH || 'main'
    const githubToken = import.meta.env.VITE_GITHUB_TOKEN

    if (!username || !passwordHash || !githubOwner || !githubRepo) {
      console.error('环境变量配置不完整，请检查 .env.local 文件')
      return null
    }

    if (!githubToken) {
      console.warn('未配置GitHub Token，某些功能可能无法使用')
    }

    return {
      username,
      passwordHash,
      role: 'admin',
      permissions: ['read', 'write', 'manage', 'config'],
      active: true,
      githubConfig: {
        owner: githubOwner,
        repo: githubRepo,
        token: githubToken || '',
        branch: githubBranch
      }
    }
  }

  // 订阅状态变化
  subscribe(listener: (state: EnvAuthState) => void) {
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
  getState(): EnvAuthState {
    return { ...this.state }
  }

  // 密码哈希函数
  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // 验证密码
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    const computedHash = await this.hashPassword(password)
    return computedHash === hash
  }

  // 检查登录限制
  private checkLoginRestrictions(username: string): boolean {
    const now = Date.now()
    const attempt = this.loginAttempts[username]
    
    if (!attempt) return true
    
    const maxAttempts = 5
    const lockoutDuration = 300 * 1000 // 5分钟
    
    if (attempt.count >= maxAttempts) {
      const timeSinceLastAttempt = now - attempt.lastAttempt
      if (timeSinceLastAttempt < lockoutDuration) {
        return false
      } else {
        delete this.loginAttempts[username]
        return true
      }
    }
    
    return true
  }

  // 记录登录尝试
  private recordLoginAttempt(username: string, success: boolean) {
    const now = Date.now()
    
    if (success) {
      delete this.loginAttempts[username]
    } else {
      if (!this.loginAttempts[username]) {
        this.loginAttempts[username] = { count: 0, lastAttempt: 0 }
      }
      this.loginAttempts[username].count++
      this.loginAttempts[username].lastAttempt = now
    }
  }

  // 用户登录
  async login(username: string, password: string): Promise<void> {
    try {
      // 检查登录限制
      if (!this.checkLoginRestrictions(username)) {
        throw new Error('账号已被锁定，请稍后再试')
      }

      // 获取环境变量配置
      const envConfig = this.getEnvConfig()
      
      if (!envConfig) {
        this.recordLoginAttempt(username, false)
        throw new Error('系统配置错误，请联系管理员')
      }

      // 验证用户名
      if (username !== envConfig.username) {
        this.recordLoginAttempt(username, false)
        throw new Error('用户名或密码错误')
      }

      if (!envConfig.active) {
        this.recordLoginAttempt(username, false)
        throw new Error('账号已被禁用')
      }

      // 验证密码
      const isValidPassword = await this.verifyPassword(password, envConfig.passwordHash)
      
      if (!isValidPassword) {
        this.recordLoginAttempt(username, false)
        throw new Error('用户名或密码错误')
      }

      // 验证GitHub Token（如果配置了的话）
      if (envConfig.githubConfig.token) {
        try {
          githubApi.setConfig(envConfig.githubConfig)
          const isTokenValid = await githubApi.validateToken()
          if (!isTokenValid) {
            console.warn('GitHub Token验证失败，但允许登录')
          }
        } catch (error) {
          console.warn('GitHub Token验证出错:', error)
        }
      }

      // 登录成功
      this.recordLoginAttempt(username, true)
      
      // 设置认证状态
      this.state.isAuthenticated = true
      this.state.user = envConfig
      this.state.currentConfig = envConfig.githubConfig
      
      // 设置GitHub API配置
      if (envConfig.githubConfig.token) {
        githubApi.setConfig(envConfig.githubConfig)
      }
      
      // 设置会话信息
      localStorage.setItem('admin_mode', 'env-auth')
      localStorage.setItem('admin_login_time', new Date().toISOString())
      localStorage.setItem('admin_username', username)
      
      this.notify()
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  }

  // 检查认证状态
  async checkAuth(): Promise<boolean> {
    try {
      const mode = localStorage.getItem('admin_mode')
      const username = localStorage.getItem('admin_username')
      const loginTime = localStorage.getItem('admin_login_time')
      
      if (mode !== 'env-auth' || !username || !loginTime) {
        return false
      }

      // 检查会话是否过期（1小时）
      const sessionTimeout = 3600 * 1000
      const now = Date.now()
      const loginTimestamp = new Date(loginTime).getTime()
      
      if (now - loginTimestamp > sessionTimeout) {
        this.logout()
        return false
      }

      // 重新获取配置
      const envConfig = this.getEnvConfig()
      
      if (!envConfig || !envConfig.active || envConfig.username !== username) {
        this.logout()
        return false
      }

      // 恢复认证状态
      this.state.isAuthenticated = true
      this.state.user = envConfig
      this.state.currentConfig = envConfig.githubConfig
      
      // 设置GitHub API配置
      if (envConfig.githubConfig.token) {
        githubApi.setConfig(envConfig.githubConfig)
      }
      
      this.notify()
      return true
    } catch (error) {
      console.error('检查认证状态失败:', error)
      this.logout()
      return false
    }
  }

  // 退出登录
  logout() {
    this.state = {
      isAuthenticated: false,
      user: null,
      currentConfig: null
    }
    
    localStorage.removeItem('admin_mode')
    localStorage.removeItem('admin_login_time')
    localStorage.removeItem('admin_username')
    
    this.notify()
  }

  // 获取当前用户权限
  hasPermission(permission: string): boolean {
    return this.state.user?.permissions.includes(permission) || false
  }

  // 获取用户信息
  getCurrentUser(): EnvUserConfig | null {
    return this.state.user
  }

  // 生成密码哈希（用于配置）
  async generatePasswordHash(password: string): Promise<string> {
    return await this.hashPassword(password)
  }

  // 检查是否支持环境变量认证
  isSupported(): boolean {
    const authMode = import.meta.env.VITE_AUTH_MODE
    return authMode === 'local' || authMode === 'env'
  }

  // 获取配置状态
  getConfigStatus() {
    const config = this.getEnvConfig()
    return {
      hasConfig: !!config,
      hasToken: !!(config?.githubConfig.token),
      username: config?.username || 'unknown',
      githubRepo: config ? `${config.githubConfig.owner}/${config.githubConfig.repo}` : 'unknown'
    }
  }
}

export const envAuthService = new EnvAuthService() 