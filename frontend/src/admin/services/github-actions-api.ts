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
                console.log('工作流执行成功，尝试获取结果...');
                // 尝试从仓库文件读取结果
                const result = await this.getResultFromRepository(recentRun.id);
                if (result) {
                  console.log('成功获取工作流结果:', result);
                  return result;
                }
                
                                 console.warn('工作流成功但未找到结果文件，可能Git推送失败');
                 // 如果没有找到结果文件，返回错误而不是不完整的数据
                 return { 
                   status: 'error', 
                   error: '工作流执行成功但结果文件创建失败，请检查GitHub Actions日志'
                 };
              } else {
                console.error('工作流执行失败详情:', {
                  runId: recentRun.id,
                  conclusion: recentRun.conclusion,
                  status: recentRun.status,
                  url: recentRun.html_url,
                  createdAt: recentRun.created_at,
                  updatedAt: recentRun.updated_at
                });
                return { 
                  status: 'error', 
                  error: `工作流执行失败: ${recentRun.conclusion}。请查看详细日志: ${recentRun.html_url}` 
                };
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
   * 从仓库文件获取结果
   */
  private async getResultFromRepository(runId: string): Promise<APIResponse | null> {
    try {
      // 获取 .actions-results 目录的内容
      const contentsUrl = `${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/.actions-results`;
      const response = await fetch(contentsUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${import.meta.env.VITE_GITHUB_TRIGGER_TOKEN || ''}`
        }
      });

      if (!response.ok) {
        console.log('Results directory not found or empty');
        return null;
      }

      const files = await response.json();
      
      // 查找匹配的结果文件
      const resultFile = files.find((file: any) => 
        file.name.includes(`api-result-${runId}`) && file.name.endsWith('.json')
      );

      if (!resultFile) {
        console.log(`No result file found for run ${runId}`);
        return null;
      }

      console.log(`找到结果文件: ${resultFile.name}`);

      // 获取文件内容
      const fileResponse = await fetch(resultFile.download_url, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `token ${import.meta.env.VITE_GITHUB_TRIGGER_TOKEN || ''}`
        }
      });

      if (fileResponse.ok) {
        const result = await fileResponse.json();
        console.log('成功获取结果:', result);
        
        // 可选：删除结果文件以清理
        await this.cleanupResultFile(resultFile.path);
        
        return result;
      }

      throw new Error('Failed to fetch result file content');
    } catch (error) {
      console.error('Error getting result from repository:', error);
      return null;
    }
  }

  /**
   * 清理结果文件
   */
  private async cleanupResultFile(filePath: string): Promise<void> {
    try {
      // 获取文件信息以获取SHA
      const fileInfoUrl = `${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${filePath}`;
      const fileInfoResponse = await fetch(fileInfoUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${import.meta.env.VITE_GITHUB_TRIGGER_TOKEN || ''}`
        }
      });

      if (fileInfoResponse.ok) {
        const fileInfo = await fileInfoResponse.json();
        
        // 删除文件
        const deleteResponse = await fetch(fileInfoUrl, {
          method: 'DELETE',
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `token ${import.meta.env.VITE_GITHUB_TRIGGER_TOKEN || ''}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `Clean up result file: ${filePath}`,
            sha: fileInfo.sha
          })
        });

        if (deleteResponse.ok) {
          console.log(`Cleaned up result file: ${filePath}`);
        } else {
          console.warn(`Failed to clean up result file: ${filePath}`);
        }
      }
    } catch (error) {
      console.warn('Error during cleanup:', error);
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