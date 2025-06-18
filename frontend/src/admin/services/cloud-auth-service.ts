import { githubApi, type GitHubConfig } from './github-api'

// 用户配置接口
export interface CloudUserConfig {
  username: string
  passwordHash: string
  role: 'admin' | 'manager' | 'viewer'
  permissions: string[]
  active: boolean
  createdAt?: string
  lastLogin?: string | null
  lastLoginTime?: string
  githubConfig: GitHubConfig
  settings?: any
  metadata?: any
}

// 云端认证状态接口
export interface CloudAuthState {
  isAuthenticated: boolean
  user: CloudUserConfig | null
  currentConfig: GitHubConfig | null
}

// 云端配置仓库结构
interface CloudConfigRepo {
  owner: string
  repo: string
  token: string
  branch?: string
}

class CloudAuthService {
  private state: CloudAuthState = {
    isAuthenticated: false,
    user: null,
    currentConfig: null
  }

  private listeners: Array<(state: CloudAuthState) => void> = []
  private loginAttempts: Record<string, { count: number; lastAttempt: number }> = {}
  
  // 配置仓库信息（这个可以是硬编码的公共配置）
  private configRepo: CloudConfigRepo = {
    owner: 'sjdjdhak',         // 你的配置仓库所有者
    repo: 'navigation-site',   // 配置仓库名
    token: '',                 // 这个Token只用于读取用户配置，权限最小
    branch: 'main'
  }

  constructor() {
    this.initConfigRepo()
    // 调试信息：检查配置状态
    console.log('CloudAuthService 配置状态:', this.getConfigStatus())
    
    // 调试：生成hello123的哈希值
    this.hashPassword('hello123').then(hash => {
      console.log('hello123的SHA-256哈希值:', hash)
    })
  }

  // 初始化配置仓库信息
  private initConfigRepo() {
    // 这里可以从环境变量或其他安全地方获取配置仓库的Token
    // 这个Token只需要读取配置仓库的权限
    const configToken = import.meta.env.VITE_CONFIG_REPO_TOKEN
    const configOwner = import.meta.env.VITE_CONFIG_REPO_OWNER
    const configRepo = import.meta.env.VITE_CONFIG_REPO_NAME
    const configBranch = import.meta.env.VITE_CONFIG_REPO_BRANCH
    
    // 调试：输出环境变量读取结果
    console.log('环境变量读取结果:', {
      VITE_CONFIG_REPO_TOKEN: configToken ? `${configToken.substring(0, 10)}...` : 'undefined',
      VITE_CONFIG_REPO_OWNER: configOwner,
      VITE_CONFIG_REPO_NAME: configRepo,
      VITE_CONFIG_REPO_BRANCH: configBranch
    })
    
    if (configToken) {
      this.configRepo.token = configToken
    }
    if (configOwner) {
      this.configRepo.owner = configOwner
    }
    if (configRepo) {
      this.configRepo.repo = configRepo
    }
    if (configBranch) {
      this.configRepo.branch = configBranch
    }
    
    console.log('最终配置仓库设置:', {
      owner: this.configRepo.owner,
      repo: this.configRepo.repo,
      hasToken: !!this.configRepo.token,
      branch: this.configRepo.branch
    })
  }

  // 从云端获取用户配置
  private async fetchUserConfig(username: string): Promise<CloudUserConfig | null> {
    try {
      if (!this.configRepo.token) {
        throw new Error('配置仓库Token未设置')
      }

      // 创建临时的GitHub API实例用于读取用户配置
      const configRepoUrl = `https://api.github.com/repos/${this.configRepo.owner}/${this.configRepo.repo}/contents/.admin/users/${username}.json`
      
      const response = await fetch(configRepoUrl, {
        headers: {
          'Authorization': `token ${this.configRepo.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null // 用户不存在
        }
        throw new Error(`获取用户配置失败: ${response.statusText}`)
      }

      const fileData = await response.json()
      
      // 解码base64内容
      const content = atob(fileData.content.replace(/\s/g, ''))
      const userConfig: CloudUserConfig = JSON.parse(content)
      
      // 替换GitHub Token占位符
      if (userConfig.githubConfig?.token === '${GITHUB_TOKEN}') {
        userConfig.githubConfig.token = this.configRepo.token
      }
      
      return userConfig
    } catch (error) {
      console.error('获取用户配置失败:', error)
      return null
    }
  }

  // 订阅状态变化
  subscribe(listener: (state: CloudAuthState) => void) {
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
  getState(): CloudAuthState {
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

  // 更新用户最后登录时间
  private async updateLastLoginTime(userConfig: CloudUserConfig): Promise<void> {
    try {
      if (!this.configRepo.token) return

      const updatedConfig = {
        ...userConfig,
        lastLoginTime: new Date().toISOString()
      }

      // 先获取文件的SHA值
      const configPath = `.admin/users/${userConfig.username}.json`
      const getUrl = `https://api.github.com/repos/${this.configRepo.owner}/${this.configRepo.repo}/contents/${configPath}`
      
      const getResponse = await fetch(getUrl, {
        headers: {
          'Authorization': `token ${this.configRepo.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })

      if (!getResponse.ok) {
        throw new Error('无法获取文件信息')
      }

      const fileInfo = await getResponse.json()
      
      // 更新文件
      const updateBody = {
        message: `更新用户 ${userConfig.username} 最后登录时间`,
        content: btoa(JSON.stringify(updatedConfig, null, 2)),
        sha: fileInfo.sha,
        branch: this.configRepo.branch || 'main'
      }

      await fetch(getUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${this.configRepo.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateBody)
      })
    } catch (error) {
      console.warn('更新最后登录时间失败:', error)
      // 不抛出错误，因为这不是关键操作
    }
  }

  // 用户登录
  async login(username: string, password: string): Promise<void> {
    try {
      // 检查登录限制
      if (!this.checkLoginRestrictions(username)) {
        throw new Error('账号已被锁定，请稍后再试')
      }

      // 从云端获取用户配置
      const userConfig = await this.fetchUserConfig(username)
      console.log('获取用户配置结果:', {
        用户名: username,
        配置存在: !!userConfig,
        用户活跃: userConfig?.active,
        配置详情: userConfig ? {
          username: userConfig.username,
          passwordHash: userConfig.passwordHash?.substring(0, 10) + '...',
          active: userConfig.active,
          hasGithubConfig: !!userConfig.githubConfig
        } : null
      })
      
      if (!userConfig) {
        this.recordLoginAttempt(username, false)
        throw new Error('用户名或密码错误')
      }

      if (!userConfig.active) {
        this.recordLoginAttempt(username, false)
        throw new Error('账号已被禁用')
      }

      // 验证密码
      const computedHash = await this.hashPassword(password)
      console.log('密码验证调试信息:', {
        输入密码: password,
        计算的哈希: computedHash,
        存储的哈希: userConfig.passwordHash,
        哈希匹配: computedHash === userConfig.passwordHash
      })
      
      const isValidPassword = await this.verifyPassword(password, userConfig.passwordHash)
      
      if (!isValidPassword) {
        this.recordLoginAttempt(username, false)
        throw new Error('用户名或密码错误')
      }

      // 验证用户的GitHub Token
      if (userConfig.githubConfig.token) {
        try {
          githubApi.setConfig(userConfig.githubConfig)
          const isTokenValid = await githubApi.validateToken()
          if (!isTokenValid) {
            throw new Error('GitHub Token已失效，请联系管理员')
          }
        } catch (error) {
          console.error('GitHub Token验证失败:', error)
          throw new Error('GitHub配置验证失败，请联系管理员')
        }
      } else {
        throw new Error('GitHub配置不完整，请联系管理员')
      }

      // 登录成功
      this.recordLoginAttempt(username, true)
      
      // 设置认证状态
      this.state.isAuthenticated = true
      this.state.user = userConfig
      this.state.currentConfig = userConfig.githubConfig
      
      // 设置GitHub API配置
      githubApi.setConfig(userConfig.githubConfig)
      
      // 设置会话信息
      localStorage.setItem('admin_mode', 'cloud-auth')
      localStorage.setItem('admin_login_time', new Date().toISOString())
      localStorage.setItem('admin_username', username)
      
      // 异步更新最后登录时间（不阻塞登录流程）
      this.updateLastLoginTime(userConfig).catch(console.warn)
      
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
      
      if (mode !== 'cloud-auth' || !username || !loginTime) {
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

      // 重新获取用户配置以确保最新状态
      const userConfig = await this.fetchUserConfig(username)
      
      if (!userConfig || !userConfig.active) {
        this.logout()
        return false
      }

      // 验证GitHub Token是否仍然有效
      if (userConfig.githubConfig.token) {
        try {
          githubApi.setConfig(userConfig.githubConfig)
          const isTokenValid = await githubApi.validateToken()
          if (!isTokenValid) {
            this.logout()
            return false
          }
        } catch (error) {
          console.warn('Token验证失败:', error)
          this.logout()
          return false
        }
      }

      // 恢复认证状态
      this.state.isAuthenticated = true
      this.state.user = userConfig
      this.state.currentConfig = userConfig.githubConfig
      
      this.notify()
      return true
    } catch (error) {
      console.error('认证检查失败:', error)
      this.logout()
      return false
    }
  }

  // 用户登出
  logout() {
    this.state.isAuthenticated = false
    this.state.user = null
    this.state.currentConfig = null
    
    localStorage.removeItem('admin_mode')
    localStorage.removeItem('admin_login_time')
    localStorage.removeItem('admin_username')
    
    this.notify()
  }

  // 检查权限
  hasPermission(permission: string): boolean {
    return this.state.user?.permissions.includes(permission) || false
  }

  // 获取当前用户
  getCurrentUser(): CloudUserConfig | null {
    return this.state.user
  }

  // 生成密码哈希（用于管理员创建用户）
  async generatePasswordHash(password: string): Promise<string> {
    return this.hashPassword(password)
  }

  // 检查服务是否支持
  isSupported(): boolean {
    return true // 云端认证总是支持的
  }

  // 获取配置状态
  getConfigStatus() {
    return {
      hasConfigRepo: !!this.configRepo.token,
      configRepo: {
        owner: this.configRepo.owner,
        repo: this.configRepo.repo,
        hasToken: !!this.configRepo.token
      }
    }
  }

  // 设置配置仓库信息（用于动态配置）
  setConfigRepo(config: Partial<CloudConfigRepo>) {
    this.configRepo = { ...this.configRepo, ...config }
  }
}

// 导出单例
export const cloudAuthService = new CloudAuthService()
export default cloudAuthService 