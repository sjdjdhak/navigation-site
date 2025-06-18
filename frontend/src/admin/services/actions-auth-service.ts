/**
 * GitHub Actions 认证服务
 * 使用GitHub Actions作为后端，实现安全的用户认证
 */

import { githubActionsAPI } from './github-actions-api';

interface User {
  username: string;
  passwordHash: string;
  active: boolean;
  permissions: string[];
  lastLoginTime?: string;
  githubConfig?: {
    owner: string;
    repo: string;
    branch: string;
  };
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  currentConfig: any;
}

class ActionsAuthService {
  private state: AuthState = {
    isAuthenticated: false,
    user: null,
    currentConfig: null
  };

  private listeners: Array<(state: AuthState) => void> = [];
  private loginAttempts: Record<string, { count: number; lastAttempt: number }> = {};

  /**
   * 订阅状态变化
   */
  subscribe(listener: (state: AuthState) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * 通知状态变化
   */
  private notify() {
    this.listeners.forEach(listener => listener(this.state));
  }

  /**
   * 获取当前状态
   */
  getState(): AuthState {
    return { ...this.state };
  }

  /**
   * 密码哈希计算
   */
  async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * 验证密码
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await this.hashPassword(password) === hash;
  }

  /**
   * 检查登录限制
   */
  private checkLoginRestrictions(username: string): boolean {
    const now = Date.now();
    const attempts = this.loginAttempts[username];
    
    if (!attempts) return true;
    
    const maxAttempts = 5;
    const lockoutTime = 5 * 60 * 1000; // 5分钟
    
    if (attempts.count >= maxAttempts) {
      if (now - attempts.lastAttempt < lockoutTime) {
        return false;
      } else {
        // 重置尝试次数
        delete this.loginAttempts[username];
        return true;
      }
    }
    
    return true;
  }

  /**
   * 记录登录尝试
   */
  private recordLoginAttempt(username: string, success: boolean) {
    const now = Date.now();
    
    if (success) {
      delete this.loginAttempts[username];
    } else {
      if (!this.loginAttempts[username]) {
        this.loginAttempts[username] = { count: 0, lastAttempt: 0 };
      }
      this.loginAttempts[username].count++;
      this.loginAttempts[username].lastAttempt = now;
    }
  }

  /**
   * 用户登录
   */
  async login(username: string, password: string): Promise<void> {
    try {
      // 检查登录限制
      if (!this.checkLoginRestrictions(username)) {
        throw new Error('账号已被锁定，请稍后再试');
      }

      // 通过GitHub Actions验证用户
      const result = await githubActionsAPI.validateUser(username, password);
      
      if (result.status === 'error') {
        this.recordLoginAttempt(username, false);
        throw new Error(result.error || '登录失败');
      }

      if (!result.data) {
        this.recordLoginAttempt(username, false);
        throw new Error('用户名或密码错误');
      }

      const userConfig = result.data;
      
      // 验证用户状态
      if (!userConfig.active) {
        this.recordLoginAttempt(username, false);
        throw new Error('账号已被禁用');
      }

      // 验证密码
      if (!await this.verifyPassword(password, userConfig.passwordHash)) {
        this.recordLoginAttempt(username, false);
        throw new Error('用户名或密码错误');
      }

      // 登录成功
      this.recordLoginAttempt(username, true);
      this.state.isAuthenticated = true;
      this.state.user = userConfig;
      this.state.currentConfig = userConfig.githubConfig;
      
      // 保存登录状态
      localStorage.setItem('admin_mode', 'actions-auth');
      localStorage.setItem('admin_login_time', new Date().toISOString());
      localStorage.setItem('admin_username', username);
      
      this.notify();

    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  }

  /**
   * 检查认证状态
   */
  async checkAuth(): Promise<boolean> {
    try {
      const mode = localStorage.getItem('admin_mode');
      const username = localStorage.getItem('admin_username');
      const loginTime = localStorage.getItem('admin_login_time');

      if (mode !== 'actions-auth' || !username || !loginTime) {
        return false;
      }

      // 检查会话是否过期（1小时）
      const sessionTimeout = 60 * 60 * 1000;
      const now = Date.now();
      const loginTimestamp = new Date(loginTime).getTime();

      if (now - loginTimestamp > sessionTimeout) {
        this.logout();
        return false;
      }

      // 通过GitHub Actions获取用户配置
      const result = await githubActionsAPI.getUserConfig(username);
      
      if (result.status === 'error' || !result.data) {
        this.logout();
        return false;
      }

      const userConfig = result.data;
      
      if (!userConfig.active) {
        this.logout();
        return false;
      }

      // 恢复认证状态
      this.state.isAuthenticated = true;
      this.state.user = userConfig;
      this.state.currentConfig = userConfig.githubConfig;
      this.notify();

      return true;

    } catch (error) {
      console.error('认证检查失败:', error);
      this.logout();
      return false;
    }
  }

  /**
   * 用户登出
   */
  logout() {
    this.state.isAuthenticated = false;
    this.state.user = null;
    this.state.currentConfig = null;
    
    localStorage.removeItem('admin_mode');
    localStorage.removeItem('admin_login_time');
    localStorage.removeItem('admin_username');
    
    this.notify();
  }

  /**
   * 检查权限
   */
  hasPermission(permission: string): boolean {
    return this.state.user?.permissions.includes(permission) || false;
  }

  /**
   * 获取当前用户
   */
  getCurrentUser(): User | null {
    return this.state.user;
  }

  /**
   * 生成密码哈希
   */
  async generatePasswordHash(password: string): Promise<string> {
    return this.hashPassword(password);
  }

  /**
   * 更新用户配置
   */
  async updateUserConfig(updates: any): Promise<void> {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        throw new Error('用户未登录');
      }

      // 如果要修改密码，验证当前密码
      if (updates.password && updates.currentPassword) {
        if (!await this.verifyPassword(updates.currentPassword, currentUser.passwordHash)) {
          throw new Error('当前密码错误');
        }
      }

      // 构建新的用户配置
      const newConfig = {
        ...currentUser,
        ...(updates.username && { username: updates.username }),
        ...(updates.password && { passwordHash: await this.hashPassword(updates.password) }),
        lastLoginTime: new Date().toISOString()
      };

      // 通过GitHub Actions更新配置
      const result = await githubActionsAPI.updateUserConfig(currentUser.username, newConfig);
      
      if (result.status === 'error') {
        throw new Error(result.error || '更新失败');
      }

      // 更新本地状态
      this.state.user = newConfig;
      
      // 如果用户名改变，更新localStorage
      if (updates.username) {
        localStorage.setItem('admin_username', newConfig.username);
      }
      
      this.notify();

    } catch (error) {
      console.error('更新用户配置失败:', error);
      throw error;
    }
  }

  /**
   * 检查服务是否支持
   */
  isSupported(): boolean {
    return true;
  }

  /**
   * 获取配置状态
   */
  getConfigStatus() {
    return {
      hasConfigRepo: true,
      configRepo: {
        owner: 'sjdjdhak',
        repo: 'navigation-site',
        hasToken: true // GitHub Actions中有安全的Token
      }
    };
  }

  /**
   * 检查服务健康状态
   */
  async checkHealth(): Promise<boolean> {
    return await githubActionsAPI.checkHealth();
  }
}

// 导出单例实例
export const actionsAuthService = new ActionsAuthService();
export default actionsAuthService; 