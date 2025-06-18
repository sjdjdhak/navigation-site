<template>
  <div class="github-login-form">
    <div class="login-header">
      <h2>GitHub 直连登录</h2>
      <p class="description">直接输入您的GitHub配置信息进行登录</p>
    </div>

    <form @submit.prevent="handleLogin" class="login-form">
      <div class="form-group">
        <label for="owner">GitHub 用户名/组织名</label>
        <input
          id="owner"
          v-model="formData.owner"
          type="text"
          required
          :disabled="loading"
          placeholder="例如：octocat"
        />
      </div>

      <div class="form-group">
        <label for="repo">仓库名</label>
        <input
          id="repo"
          v-model="formData.repo"
          type="text"
          required
          :disabled="loading"
          placeholder="例如：my-navigation"
        />
      </div>

      <div class="form-group">
        <label for="token">GitHub Token</label>
        <div class="token-input">
          <input
            id="token"
            v-model="formData.token"
            :type="showToken ? 'text' : 'password'"
            required
            :disabled="loading"
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
          />
          <button
            type="button"
            class="toggle-token"
            @click="showToken = !showToken"
            :disabled="loading"
          >
            <i :class="showToken ? 'icon-eye-off' : 'icon-eye'"></i>
          </button>
        </div>
        <p class="help-text">
          需要具有仓库读写权限的Personal Access Token
          <a href="https://github.com/settings/tokens" target="_blank" rel="noopener">
            获取Token
          </a>
        </p>
      </div>

      <div class="form-group">
        <label for="branch">分支名（可选）</label>
        <input
          id="branch"
          v-model="formData.branch"
          type="text"
          :disabled="loading"
          placeholder="main"
        />
      </div>

      <!-- 错误信息 -->
      <div v-if="error" class="alert alert-error">
        <i class="icon-error"></i>
        {{ error }}
      </div>

      <!-- 登录按钮 -->
      <button
        type="submit"
        class="btn btn-primary"
        :disabled="loading"
      >
        <span v-if="loading" class="loading-spinner"></span>
        {{ loading ? '连接中...' : '连接GitHub' }}
      </button>
    </form>

    <!-- 帮助信息 -->
    <div class="help-section">
      <h3>配置说明</h3>
      <ul>
        <li><strong>用户名/组织名：</strong>GitHub仓库的所有者</li>
        <li><strong>仓库名：</strong>存储导航数据的仓库名称</li>
        <li><strong>Token：</strong>用于访问仓库的Personal Access Token</li>
        <li><strong>分支名：</strong>数据存储的分支，默认为main</li>
      </ul>
    </div>

    <!-- 其他登录方式 -->
    <div class="alternative-login">
      <p>
        其他登录方式：
        <button type="button" class="link-btn" @click="$emit('switchMode', 'cloud-auth')">
          云端认证
        </button>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { unifiedAuthService } from '@/admin/services/unified-auth-service'

// 组件事件
const emit = defineEmits<{
  switchMode: [mode: string]
  success: []
}>()

// 响应式数据
const loading = ref(false)
const error = ref('')
const showToken = ref(false)

const formData = reactive({
  owner: '',
  repo: '',
  token: '',
  branch: 'main'
})

// 处理登录
const handleLogin = async () => {
  if (!formData.owner || !formData.repo || !formData.token) {
    error.value = '请填写所有必需字段'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const githubConfig = {
      owner: formData.owner,
      repo: formData.repo,
      token: formData.token,
      branch: formData.branch || 'main'
    }

    await unifiedAuthService.login('github', githubConfig)
    emit('success')
  } catch (err: any) {
    error.value = err.message || '连接失败，请检查配置信息'
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
@import "@/assets/styles/variables.scss";

.github-login-form {
  max-width: 500px;
  margin: 0 auto;
  
  .login-header {
    text-align: center;
    margin-bottom: 30px;
    
    h2 {
      color: var(--primary);
      margin-bottom: 10px;
    }
    
    .description {
      color: var(--text-secondary);
      font-size: 14px;
    }
  }
  
  .login-form {
    margin-bottom: 30px;
    
    .form-group {
      margin-bottom: 20px;
      
      label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        color: var(--text-primary);
      }
      
      input {
        width: 100%;
        padding: 12px;
        border: 1px solid var(--border);
        border-radius: 6px;
        font-size: 14px;
        transition: border-color 0.3s ease;
        
        &:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.1);
        }
        
        &:disabled {
          background-color: var(--card);
          color: var(--text-secondary);
          cursor: not-allowed;
        }
      }
      
      .help-text {
        margin-top: 5px;
        font-size: 12px;
        color: var(--text-secondary);
        
        a {
          color: var(--primary);
          text-decoration: none;
          
          &:hover {
            text-decoration: underline;
          }
        }
      }
    }
    
    .token-input {
      position: relative;
      
      .toggle-token {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 4px;
        
        &:hover {
          color: var(--primary);
        }
        
        &:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
      }
    }
    
    .alert {
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      
      &.alert-error {
        background-color: #f8d7da;
        border: 1px solid #f1aeb5;
        color: #721c24;
      }
      
      i {
        font-size: 16px;
      }
    }
    
    .btn {
      width: 100%;
      padding: 12px;
      background-color: var(--primary);
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      cursor: pointer;
      transition: background-color 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      
      &:hover:not(:disabled) {
        background-color: var(--primary-dark);
      }
      
      &:disabled {
        background-color: var(--text-secondary);
        cursor: not-allowed;
      }
      
      .loading-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s ease-in-out infinite;
      }
    }
  }
  
  .help-section {
    background-color: var(--card);
    padding: 16px;
    border-radius: 6px;
    margin-bottom: 20px;
    
    h3 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: var(--text-primary);
    }
    
    ul {
      margin: 0;
      padding-left: 20px;
      
      li {
        margin-bottom: 8px;
        font-size: 13px;
        color: var(--text-secondary);
        
        strong {
          color: var(--text-primary);
        }
      }
    }
  }
  
  .alternative-login {
    text-align: center;
    
    p {
      font-size: 13px;
      color: var(--text-secondary);
      margin: 0;
    }
    
    .link-btn {
      background: none;
      border: none;
      color: var(--primary);
      cursor: pointer;
      text-decoration: underline;
      font-size: 13px;
      margin: 0 8px;
      
      &:hover {
        color: var(--primary-dark);
      }
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style> 