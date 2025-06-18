/**
 * GitHub Actions API 代理服务
 * 使用GitHub Actions作为后端API，避免在前端暴露Token
 */

interface APIResponse {
  status: 'success' | 'error';
  data?: any;
  error?: string;
}

interface WorkflowDispatchPayload {
  action: string;
  payload?: string;
}

class GitHubActionsAPI {
  private owner: string;
  private repo: string;
  private baseUrl: string;

  constructor() {
    this.owner = 'sjdjdhak';
    this.repo = 'navigation-site';
    this.baseUrl = 'https://api.github.com';
  }

  /**
   * 触发GitHub Action工作流
   */
  private async triggerWorkflow(payload: WorkflowDispatchPayload): Promise<string> {
    const url = `${this.baseUrl}/repos/${this.owner}/${this.repo}/actions/workflows/api-proxy.yml/dispatches`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        // 注意：这里仍需要一个触发Action的Token，但这个可以是只读权限的
        'Authorization': `token ${import.meta.env.VITE_GITHUB_TRIGGER_TOKEN || ''}`
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          action: payload.action,
          payload: payload.payload || '{}'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to trigger workflow: ${response.status}`);
    }

    // 返回工作流运行ID（需要通过其他API获取）
    return Date.now().toString();
  }

  /**
   * 等待工作流完成并获取结果
   */
  private async waitForResult(runId: string, maxWaitTime: number = 30000): Promise<APIResponse> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        // 尝试获取结果 artifact
        const artifactUrl = `${this.baseUrl}/repos/${this.owner}/${this.repo}/actions/artifacts`;
        const response = await fetch(artifactUrl, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `token ${import.meta.env.VITE_GITHUB_TRIGGER_TOKEN || ''}`
          }
        });

        if (response.ok) {
          const artifacts = await response.json();
          const resultArtifact = artifacts.artifacts.find((a: any) => 
            a.name.startsWith('api-response-') && 
            a.created_at > new Date(Date.now() - 60000).toISOString() // 最近1分钟创建的
          );

          if (resultArtifact) {
            // 下载并解析结果
            return await this.downloadArtifactResult(resultArtifact.archive_download_url);
          }
        }
        
        // 等待2秒后重试
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.warn('Waiting for action result:', error);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    throw new Error('Workflow execution timeout');
  }

  /**
   * 下载并解析artifact结果
   */
  private async downloadArtifactResult(downloadUrl: string): Promise<APIResponse> {
    // 注意：GitHub的artifact下载需要特殊处理，这里简化实现
    // 实际项目中可能需要使用GitHub REST API或其他方式
    try {
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `token ${import.meta.env.VITE_GITHUB_TRIGGER_TOKEN || ''}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        return result;
      }
      
      throw new Error('Failed to download result');
    } catch (error) {
      console.error('Error downloading artifact:', error);
      return {
        status: 'error',
        error: 'Failed to get action result'
      };
    }
  }

  /**
   * 验证用户凭据
   */
  async validateUser(username: string, password: string): Promise<APIResponse> {
    const payload = {
      action: 'validate-user',
      payload: JSON.stringify({ username, password })
    };

    const runId = await this.triggerWorkflow(payload);
    return this.waitForResult(runId);
  }

  /**
   * 获取用户配置
   */
  async getUserConfig(username: string): Promise<APIResponse> {
    const payload = {
      action: 'get-user-config',
      payload: JSON.stringify({ username })
    };

    const runId = await this.triggerWorkflow(payload);
    return this.waitForResult(runId);
  }

  /**
   * 更新用户配置
   */
  async updateUserConfig(username: string, config: any): Promise<APIResponse> {
    const payload = {
      action: 'update-user-config',
      payload: JSON.stringify({ username, config })
    };

    const runId = await this.triggerWorkflow(payload);
    return this.waitForResult(runId);
  }

  /**
   * 检查服务是否可用
   */
  async checkHealth(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/repos/${this.owner}/${this.repo}/actions/workflows`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${import.meta.env.VITE_GITHUB_TRIGGER_TOKEN || ''}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// 导出单例实例
export const githubActionsAPI = new GitHubActionsAPI();
export default githubActionsAPI; 