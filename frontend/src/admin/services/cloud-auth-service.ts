import { githubApi, type GitHubConfig } from './github-api'
import { configService } from './config-service'

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
  private initPromise: Promise<void> | null = null
  
  // 配置仓库信息（这个可以是硬编码的公共配置）
  private configRepo: CloudConfigRepo = {
    owner: 'sjdjdhak',         // 你的配置仓库所有者
    repo: 'navigation-site',   // 配置仓库名
    token: '',                 // 这个Token只用于读取用户配置，权限最小
    branch: 'main'
  }

  constructor() {
    // 不在constructor中进行异步操作
    // 调试：生成hello123的哈希值
    this.hashPassword('hello123').then(hash => {
      console.log('hello123的SHA-256哈希值:', hash)
    })
  }

  // 确保服务已初始化
  private async ensureInitialized(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.initConfigRepo()
    }
    return this.initPromise
  }

  // 初始化配置仓库信息
  private async initConfigRepo() {
    try {
      // 先从运行时配置加载基础信息
      const cloudConfig = await configService.getCloudAuthConfig()
      
      // 更新仓库基础信息
      this.configRepo.owner = cloudConfig.configRepo.owner
      this.configRepo.repo = cloudConfig.configRepo.repo
      this.configRepo.branch = cloudConfig.configRepo.branch
      
      // 尝试从环境变量获取Token（降级方案）
      const configToken = import.meta.env.VITE_CONFIG_REPO_TOKEN
      
      console.log('配置初始化:', {
        运行时配置: {
          owner: this.configRepo.owner,
          repo: this.configRepo.repo,
          branch: this.configRepo.branch
        },
        环境变量Token: configToken ? `${configToken.substring(0, 10)}...` : 'undefined'
      })
      
      if (configToken) {
        this.configRepo.token = configToken
      }
      
      console.log('配置仓库初始化完成:', {
        owner: this.configRepo.owner,
        repo: this.configRepo.repo,
        hasToken: !!this.configRepo.token,
        branch: this.configRepo.branch
      })
    } catch (error) {
      console.error('配置初始化失败，使用默认配置:', error)
      // 使用默认配置作为降级方案
      this.configRepo = {
        owner: 'sjdjdhak',
        repo: 'navigation-site',
        token: import.meta.env.VITE_CONFIG_REPO_TOKEN || '',
        branch: 'main'
      }
    }
  }

  // 从云端获取用户配置
  private async fetchUserConfig(username: string): Promise<CloudUserConfig | null> {
    try {
      // 获取可用的Token
      const availableToken = this.getAvailableToken()
      
      if (!availableToken) {
        // 如果没有Token，尝试使用公开API（仅适用于公开仓库）
        console.warn('没有可用的Token，尝试使用公开API访问')
      }

      // 获取运行时配置
      const cloudConfig = await configService.getCloudAuthConfig()
      const userConfigPath = `${cloudConfig.userConfigPath}/${username}.json`
      
      // 创建GitHub API请求URL
      const configRepoUrl = `https://api.github.com/repos/${this.configRepo.owner}/${this.configRepo.repo}/contents/${userConfigPath}`
      
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      }
      
      // 如果有Token，添加授权头
      if (availableToken) {
        headers['Authorization'] = `token ${availableToken}`
      }
      
      const response = await fetch(configRepoUrl, { headers })

      if (!response.ok) {
        if (response.status === 404) {
          return null // 用户不存在
        }
        throw new Error(`获取用户配置失败: ${response.status} ${response.statusText}`)
      }

      const fileData = await response.json()
      
      // 解码base64内容
      const content = atob(fileData.content.replace(/\s/g, ''))
      const storedConfig = JSON.parse(content)
      
      // 重构完整的用户配置，添加缺失的 GitHub token
      // 确保从环境变量或配置中获取有效的 token
      const availableTokenDebug = {
        availableToken: availableToken ? `${availableToken.substring(0, 10)}...` : 'null',
        configRepoToken: this.configRepo.token ? `${this.configRepo.token.substring(0, 10)}...` : 'null',
        envToken: import.meta.env.VITE_CONFIG_REPO_TOKEN ? `${import.meta.env.VITE_CONFIG_REPO_TOKEN.substring(0, 10)}...` : 'null',
        storedToken: storedConfig.githubConfig?.token ? `${storedConfig.githubConfig.token.substring(0, 10)}...` : 'null'
      }
      
      console.log('Token 重建调试信息:', availableTokenDebug)
      
      // 优先级：环境变量 > 配置token > 可用token > 存储token
      const effectiveToken = import.meta.env.VITE_CONFIG_REPO_TOKEN || 
                           this.configRepo.token || 
                           availableToken || 
                           storedConfig.githubConfig?.token
      
      if (!effectiveToken) {
        console.error('Token 获取失败详情:', {
          环境变量: import.meta.env.VITE_CONFIG_REPO_TOKEN ? '存在' : '缺失',
          配置Token: this.configRepo.token ? '存在' : '缺失',
          可用Token: availableToken ? '存在' : '缺失',
          存储Token: storedConfig.githubConfig?.token ? '存在' : '缺失',
          环境变量详情: Object.keys(import.meta.env).filter(key => key.includes('TOKEN'))
        })
        throw new Error('GitHub Token 配置缺失，请检查环境变量 VITE_CONFIG_REPO_TOKEN 是否正确设置')
      }
      
      console.log('最终使用的 Token:', `${effectiveToken.substring(0, 10)}...`)
      
      const userConfig: CloudUserConfig = {
        ...storedConfig,
        githubConfig: {
          ...storedConfig.githubConfig,
          token: effectiveToken
        }
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
  // 注意：此功能暂时禁用，避免GitHub API 409冲突影响登录体验
  private async updateLastLoginTime(userConfig: CloudUserConfig): Promise<void> {
    try {
      if (!this.configRepo.token) return
      
      // 暂时禁用此功能，因为频繁的409冲突影响用户体验
      console.log('用户登录时间更新功能已暂时禁用，避免API冲突')
      return

      // 以下代码保留备用，如需重新启用请移除上面的return语句
      const updatedConfig = {
        ...userConfig,
        lastLoginTime: new Date().toISOString()
      }

      const configPath = `.admin/users/${userConfig.username}.json`
      const url = `https://api.github.com/repos/${this.configRepo.owner}/${this.configRepo.repo}/contents/${configPath}`
      
      // 获取文件信息
      const getResponse = await fetch(url, {
        headers: {
          'Authorization': `token ${this.configRepo.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })

      if (!getResponse.ok) {
        throw new Error(`获取文件信息失败: ${getResponse.status}`)
      }

      const fileInfo = await getResponse.json()
      
      // 更新文件
      const updateBody = {
        message: `更新用户 ${userConfig.username} 最后登录时间`,
        content: btoa(JSON.stringify(updatedConfig, null, 2)),
        sha: fileInfo.sha,
        branch: this.configRepo.branch || 'main'
      }

      const updateResponse = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${this.configRepo.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateBody)
      })

      if (updateResponse.ok) {
        console.log('成功更新最后登录时间')
      } else {
        console.warn(`更新最后登录时间失败: ${updateResponse.status}`)
      }
    } catch (error) {
      console.warn('更新最后登录时间失败:', error)
      // 不抛出错误，因为这不是关键操作
    }
  }

  // 用户登录
  async login(username: string, password: string): Promise<void> {
    try {
      // 确保服务已初始化
      await this.ensureInitialized()
      
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
      // 暂时禁用，避免 409 冲突影响用户体验
      // this.updateLastLoginTime(userConfig).catch(console.warn)
      
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

  // 更新用户配置
  async updateUserConfig(updates: {
    username?: string
    password?: string
    currentPassword?: string
  }): Promise<void> {
    try {
      await this.ensureInitialized()
      
      const currentUser = this.getCurrentUser()
      if (!currentUser) {
        throw new Error('用户未登录')
      }

      // 如果要修改密码，需要验证当前密码
      if (updates.password && updates.currentPassword) {
        const isValidCurrentPassword = await this.verifyPassword(
          updates.currentPassword, 
          currentUser.passwordHash
        )
        if (!isValidCurrentPassword) {
          throw new Error('当前密码错误')
        }
      }

      // 准备更新的配置
      const updatedConfig: CloudUserConfig = {
        ...currentUser,
        ...(updates.username && { username: updates.username }),
        ...(updates.password && { passwordHash: await this.hashPassword(updates.password) }),
        lastLoginTime: new Date().toISOString()
      }

      // 确定文件路径（如果用户名改变了，需要处理文件移动）
      const oldPath = `.admin/users/${currentUser.username}.json`
      const newPath = `.admin/users/${updatedConfig.username}.json`
      const token = this.getAvailableToken()
      
      if (!token) {
        throw new Error('没有可用的访问令牌')
      }

      // 如果用户名没有改变，直接更新文件
      if (currentUser.username === updatedConfig.username) {
        await this.updateUserFile(newPath, updatedConfig, token)
      } else {
        // 如果用户名改变了，需要创建新文件并删除旧文件
        await this.createUserFile(newPath, updatedConfig, token)
        await this.deleteUserFile(oldPath, token)
        
        // 更新本地存储的用户名
        localStorage.setItem('admin_username', updatedConfig.username)
      }

      // 更新本地状态
      this.state.user = updatedConfig
      this.notify()

    } catch (error) {
      console.error('更新用户配置失败:', error)
      throw error
    }
  }

  // 创建安全的配置副本，移除敏感信息以避免GitHub API安全检查
  private createSafeConfigForStorage(config: CloudUserConfig): Omit<CloudUserConfig, 'githubConfig'> & { githubConfig: Omit<GitHubConfig, 'token'> } {
    const { githubConfig, ...restConfig } = config
    
    // 移除 GitHub token，保留其他配置信息
    const safeGithubConfig = {
      owner: githubConfig.owner,
      repo: githubConfig.repo,
      branch: githubConfig.branch
    }
    
    return {
      ...restConfig,
      githubConfig: safeGithubConfig
    }
  }

  // 更新用户文件
  private async updateUserFile(path: string, config: CloudUserConfig, token: string): Promise<void> {
    const url = `https://api.github.com/repos/${this.configRepo.owner}/${this.configRepo.repo}/contents/${path}`
    
    // 获取文件信息
    const getResponse = await fetch(url, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })

    if (!getResponse.ok) {
      throw new Error(`获取用户文件失败: ${getResponse.status}`)
    }

    const fileInfo = await getResponse.json()
    
    // 创建安全的配置副本，移除敏感信息
    const safeConfig = this.createSafeConfigForStorage(config)
    
    // 更新文件
    const updateBody = {
      message: `更新用户配置: ${config.username}`,
      content: btoa(JSON.stringify(safeConfig, null, 2)),
      sha: fileInfo.sha,
      branch: this.configRepo.branch || 'main'
    }

    const updateResponse = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateBody)
    })

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text()
      throw new Error(`更新用户文件失败: ${updateResponse.status} - ${errorText}`)
    }
  }

  // 创建用户文件
  private async createUserFile(path: string, config: CloudUserConfig, token: string): Promise<void> {
    const url = `https://api.github.com/repos/${this.configRepo.owner}/${this.configRepo.repo}/contents/${path}`
    
    // 创建安全的配置副本，移除敏感信息
    const safeConfig = this.createSafeConfigForStorage(config)
    
    const createBody = {
      message: `创建用户配置: ${config.username}`,
      content: btoa(JSON.stringify(safeConfig, null, 2)),
      branch: this.configRepo.branch || 'main'
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(createBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`创建用户文件失败: ${response.status} - ${errorText}`)
    }
  }

  // 删除用户文件
  private async deleteUserFile(path: string, token: string): Promise<void> {
    const url = `https://api.github.com/repos/${this.configRepo.owner}/${this.configRepo.repo}/contents/${path}`
    
    // 获取文件信息
    const getResponse = await fetch(url, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })

    if (!getResponse.ok) {
      // 如果文件不存在，不需要删除
      if (getResponse.status === 404) return
      throw new Error(`获取要删除的文件信息失败: ${getResponse.status}`)
    }

    const fileInfo = await getResponse.json()
    
    // 删除文件
    const deleteBody = {
      message: `删除旧的用户配置文件: ${path}`,
      sha: fileInfo.sha,
      branch: this.configRepo.branch || 'main'
    }

    const deleteResponse = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(deleteBody)
    })

    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text()
      throw new Error(`删除用户文件失败: ${deleteResponse.status} - ${errorText}`)
    }
  }

  // 检查服务是否支持
  isSupported(): boolean {
    return true // 云端认证总是支持的
  }

  // 获取配置状态
  getConfigStatus() {
    // 先尝试同步获取状态
    const hasToken = !!this.configRepo.token || this.hasUserToken()
    
    // 如果还没有初始化，启动异步初始化但立即返回当前状态
    if (!this.initPromise) {
      console.log('开始异步初始化配置...')
      this.ensureInitialized().then(() => {
        console.log('异步初始化完成，通知状态更新')
        this.notify() // 初始化完成后通知所有监听者
      }).catch(error => {
        console.error('异步初始化失败:', error)
      })
    }
    
    const status = {
      hasConfigRepo: hasToken,
      configRepo: {
        owner: this.configRepo.owner,
        repo: this.configRepo.repo,
        hasToken: hasToken
      }
    }
    
    console.log('getConfigStatus 返回状态:', status)
    return status
  }

  // 异步获取配置状态（等待初始化完成）
  async getConfigStatusAsync() {
    await this.ensureInitialized()
    return this.getConfigStatus()
  }

  // 检查是否有用户Token可用
  private hasUserToken(): boolean {
    // 如果用户已登录，可以使用用户配置中的Token
    if (this.state.isAuthenticated && this.state.user?.githubConfig?.token) {
      return true
    }
    return false
  }

  // 获取可用的Token（优先使用用户Token，降级到配置Token）
  private getAvailableToken(): string | null {
    // 优先使用当前用户的Token
    if (this.state.isAuthenticated && this.state.user?.githubConfig?.token) {
      return this.state.user.githubConfig.token
    }
    
    // 降级使用配置仓库的Token
    return this.configRepo.token || null
  }

  // 设置配置仓库信息（用于动态配置）
  setConfigRepo(config: Partial<CloudConfigRepo>) {
    this.configRepo = { ...this.configRepo, ...config }
  }
}

// 导出单例
export const cloudAuthService = new CloudAuthService()
export default cloudAuthService 