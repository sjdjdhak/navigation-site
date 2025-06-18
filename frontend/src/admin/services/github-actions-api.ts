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
  private async triggerWorkflow(payload: WorkflowDispatchPayload): Promise<number> {
    const url = `${this.baseUrl}/repos/${this.owner}/${this.repo}/actions/workflows/api-proxy.yml/dispatches`;
    
    const triggerTime = Date.now();
    console.log(`触发工作流: ${payload.action}, 时间: ${new Date(triggerTime).toISOString()}`);
    
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
      const errorText = await response.text();
      console.error(`工作流触发失败: ${response.status}`, errorText);
      throw new Error(`Failed to trigger workflow: ${response.status}`);
    }

    console.log('工作流触发成功');
    // 返回触发时间，用于后续查找对应的运行
    return triggerTime;
  }

  /**
   * 等待工作流完成并获取结果
   */
  private async waitForResult(triggerTime: number, maxWaitTime: number = 60000): Promise<APIResponse> {
    const startTime = Date.now();
    let lastCheck = triggerTime;
    
    console.log(`开始等待工作流结果，触发时间: ${new Date(triggerTime).toISOString()}`);
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        // 获取最近的工作流运行
        const runsUrl = `${this.baseUrl}/repos/${this.owner}/${this.repo}/actions/workflows/api-proxy.yml/runs`;
        const runsResponse = await fetch(runsUrl, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `token ${import.meta.env.VITE_GITHUB_TRIGGER_TOKEN || ''}`
          }
        });

        if (runsResponse.ok) {
          const runsData = await runsResponse.json();
          
          // 查找在触发时间之后创建的最新运行
          const recentRun = runsData.workflow_runs.find((run: any) => {
            const runTime = new Date(run.created_at).getTime();
            return runTime >= triggerTime - 5000; // 5秒容错
          });

          if (recentRun) {
            console.log(`找到工作流运行: ${recentRun.id}, 状态: ${recentRun.status}`);
            
            if (recentRun.status === 'completed') {
              if (recentRun.conclusion === 'success') {
                // 获取artifacts
                const artifactsUrl = `${this.baseUrl}/repos/${this.owner}/${this.repo}/actions/runs/${recentRun.id}/artifacts`;
                const artifactsResponse = await fetch(artifactsUrl, {
                  headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Authorization': `token ${import.meta.env.VITE_GITHUB_TRIGGER_TOKEN || ''}`
                  }
                });

                if (artifactsResponse.ok) {
                  const artifactsData = await artifactsResponse.json();
                  const resultArtifact = artifactsData.artifacts.find((a: any) => 
                    a.name.startsWith('api-response-')
                  );

                  if (resultArtifact) {
                    console.log(`找到结果artifact: ${resultArtifact.name}`);
                    return await this.downloadArtifactResult(resultArtifact.archive_download_url);
                  }
                }
                
                // 如果没有找到artifact，返回成功但无数据
                return { status: 'success', data: null };
              } else {
                return { status: 'error', error: `工作流执行失败: ${recentRun.conclusion}` };
              }
            }
          }
        }
        
        // 等待3秒后重试
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log(`等待中... 已等待 ${Math.round((Date.now() - startTime) / 1000)}s`);
      } catch (error) {
        console.warn('等待工作流结果时出错:', error);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    throw new Error('工作流执行超时，请检查GitHub Actions状态');
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

    const triggerTime = await this.triggerWorkflow(payload);
    return this.waitForResult(triggerTime);
  }

  /**
   * 获取用户配置
   */
  async getUserConfig(username: string): Promise<APIResponse> {
    const payload = {
      action: 'get-user-config',
      payload: JSON.stringify({ username })
    };

    const triggerTime = await this.triggerWorkflow(payload);
    return this.waitForResult(triggerTime);
  }

  /**
   * 更新用户配置
   */
  async updateUserConfig(username: string, config: any): Promise<APIResponse> {
    const payload = {
      action: 'update-user-config',
      payload: JSON.stringify({ username, config })
    };

    const triggerTime = await this.triggerWorkflow(payload);
    return this.waitForResult(triggerTime);
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