// GitHub API服务
export interface GitHubConfig {
  owner: string
  repo: string
  token: string
  branch?: string
}

export interface GitHubFile {
  name: string
  path: string
  sha: string
  size: number
  url: string
  html_url: string
  git_url: string
  download_url: string
  type: string
  content: string
  encoding: string
}

export interface CommitResponse {
  content: GitHubFile
  commit: {
    sha: string
    message: string
  }
}

class GitHubApiService {
  private config: GitHubConfig | null = null
  private baseUrl = 'https://api.github.com'

  // 设置配置
  setConfig(config: GitHubConfig) {
    this.config = { branch: 'main', ...config }
  }

  // 获取配置
  getConfig(): GitHubConfig | null {
    return this.config
  }

  // 检查配置是否有效
  private checkConfig() {
    if (!this.config) {
      throw new Error('GitHub配置未设置')
    }
    if (!this.config.token) {
      throw new Error('GitHub Token未设置')
    }
  }

  // 构建请求头
  private getHeaders() {
    this.checkConfig()
    return {
      'Authorization': `token ${this.config!.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    }
  }

  // 构建API URL
  private getApiUrl(path: string) {
    this.checkConfig()
    return `${this.baseUrl}/repos/${this.config!.owner}/${this.config!.repo}/contents/${path}`
  }

  // 获取文件内容
  async getFile(path: string): Promise<any> {
    try {
      const response = await fetch(this.getApiUrl(path), {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`文件不存在: ${path}`)
        }
        throw new Error(`获取文件失败: ${response.statusText}`)
      }

      const data: GitHubFile = await response.json()
      
      // 解码base64内容
      const content = atob(data.content.replace(/\s/g, ''))
      return {
        ...data,
        content: JSON.parse(content)
      }
    } catch (error) {
      console.error('获取文件失败:', error)
      throw error
    }
  }

  // 更新文件内容
  async updateFile(path: string, content: any, message: string, sha?: string): Promise<CommitResponse> {
    try {
      // 如果没有提供sha，先获取文件信息
      if (!sha) {
        try {
          const fileInfo = await this.getFile(path)
          sha = fileInfo.sha
        } catch (error) {
          // 文件不存在，创建新文件
          sha = undefined
        }
      }

      const body = {
        message,
        content: btoa(JSON.stringify(content, null, 2)),
        branch: this.config!.branch,
        ...(sha && { sha })
      }

      const response = await fetch(this.getApiUrl(path), {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        throw new Error(`更新文件失败: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('更新文件失败:', error)
      throw error
    }
  }

  // 删除文件
  async deleteFile(path: string, message: string, sha: string): Promise<any> {
    try {
      const body = {
        message,
        sha,
        branch: this.config!.branch
      }

      const response = await fetch(this.getApiUrl(path), {
        method: 'DELETE',
        headers: this.getHeaders(),
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        throw new Error(`删除文件失败: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('删除文件失败:', error)
      throw error
    }
  }

  // 获取目录内容
  async getDirectory(path: string): Promise<GitHubFile[]> {
    try {
      const response = await fetch(this.getApiUrl(path), {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`获取目录失败: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('获取目录失败:', error)
      throw error
    }
  }

  // 验证Token有效性
  async validateToken(): Promise<boolean> {
    try {
      this.checkConfig()
      const response = await fetch(`${this.baseUrl}/user`, {
        headers: this.getHeaders()
      })
      return response.ok
    } catch (error) {
      return false
    }
  }

  // 获取用户信息
  async getUserInfo(): Promise<any> {
    try {
      this.checkConfig()
      const response = await fetch(`${this.baseUrl}/user`, {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error('获取用户信息失败')
      }

      return await response.json()
    } catch (error) {
      console.error('获取用户信息失败:', error)
      throw error
    }
  }

  // 获取仓库信息
  async getRepoInfo(): Promise<any> {
    try {
      this.checkConfig()
      const response = await fetch(`${this.baseUrl}/repos/${this.config!.owner}/${this.config!.repo}`, {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error('获取仓库信息失败')
      }

      return await response.json()
    } catch (error) {
      console.error('获取仓库信息失败:', error)
      throw error
    }
  }
}

export const githubApi = new GitHubApiService() 