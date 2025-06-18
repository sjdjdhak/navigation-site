<template>
  <div class="env-login-form">
    <div class="login-header">
      <h2>环境变量认证</h2>
      <p class="description">使用环境变量配置的简单登录方式</p>
    </div>

    <!-- 配置状态检查 -->
    <div v-if="!configStatus.hasConfig" class="alert alert-warning">
      <i class="icon-warning"></i>
      <div>
        <strong>环境变量未配置</strong>
        <p>请确保已正确配置环境变量文件</p>
      </div>
    </div>

    <form @submit.prevent="handleLogin" class="login-form">
      <div class="form-group">
        <label for="username">用户名</label>
        <input
          id="username"
          v-model="formData.username"
          type="text"
          required
          :disabled="loading"
          placeholder="请输入用户名"
          autocomplete="username"
        />
      </div>

      <div class="form-group">
        <label for="password">密码</label>
        <div class="password-input">
          <input
            id="password"
            v-model="formData.password"
            :type="showPassword ? 'text' : 'password'"
            required
            :disabled="loading"
            placeholder="请输入密码"
            autocomplete="current-password"
          />
          <button
            type="button"
            class="toggle-password"
            @click="showPassword = !showPassword"
            :disabled="loading"
          >
            <i :class="showPassword ? 'icon-eye-off' : 'icon-eye'"></i>
          </button>
        </div>
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
        :disabled="loading || !configStatus.hasConfig"
      >
        <span v-if="loading" class="loading-spinner"></span>
        {{ loading ? '登录中...' : '登录' }}
      </button>
    </form>

    <!-- 配置状态信息 -->
    <div class="config-info">
      <h3>环境配置信息</h3>
      <div class="config-details">
        <div class="config-item">
          <span class="label">配置用户:</span>
          <span class="value">{{ configStatus.username }}</span>
        </div>
        <div class="config-item">
          <span class="label">GitHub仓库:</span>
          <span class="value">{{ configStatus.githubRepo }}</span>
        </div>
        <div class="config-item">
          <span class="label">Token状态:</span>
          <span :class="['status', configStatus.hasToken ? 'connected' : 'disconnected']">
            {{ configStatus.hasToken ? '已配置' : '未配置' }}
          </span>
        </div>
      </div>
    </div>

    <!-- 帮助信息 -->
    <div class="help-section">
      <h3>使用说明</h3>
      <ul>
        <li>需要在环境变量文件中预先配置账号信息</li>
        <li>适用于本地开发环境或单用户场景</li>
        <li>配置简单，无需联网验证</li>
        <li>安全性依赖于环境变量的保护</li>
      </ul>
    </div>

    <!-- 其他登录方式 -->
    <div class="alternative-login">
      <p>
        其他登录方式：
        <button type="button" class="link-btn" @click="$emit('switchMode', 'cloud-auth')">
          云端认证
        </button>
        <button type="button" class="link-btn" @click="$emit('switchMode', 'github')">
          GitHub直连
        </button>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { envAuthService } from '@/admin/services/env-auth-service'

// 组件事件
const emit = defineEmits<{
  switchMode: [mode: string]
  loginSuccess: []
}>()

// 响应式数据
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

const formData = reactive({
  username: '',
  password: ''
})

const configStatus = ref({
  hasConfig: false,
  hasToken: false,
  username: 'unknown',
  githubRepo: 'unknown'
})

// 获取配置状态
const getConfigStatus = () => {
  const status = envAuthService.getConfigStatus()
  configStatus.value = status
}

// 处理登录
const handleLogin = async () => {
  if (!formData.username || !formData.password) {
    error.value = '请输入用户名和密码'
    return
  }

  if (!configStatus.value.hasConfig) {
    error.value = '环境变量配置不完整，请检查配置文件'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await envAuthService.login(formData.username, formData.password)
    emit('loginSuccess')
  } catch (err: any) {
    error.value = err.message || '登录失败，请重试'
  } finally {
    loading.value = false
  }
}

// 组件挂载时获取配置状态
onMounted(() => {
  getConfigStatus()
})
</script>

<style lang="scss" scoped>
@import "@/assets/styles/variables.scss";

.env-login-form {
  max-width: 400px;
  margin: 0 auto;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
  
  h2 {
    color: var(--text-primary);
    margin-bottom: 8px;
    font-size: 24px;
    font-weight: 600;
  }
  
  .description {
    color: var(--text-secondary);
    font-size: 14px;
  }
}

.alert {
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
  
  &.alert-warning {
    background-color: #fff7e6;
    border: 1px solid #ffd666;
    color: #d48806;
  }
  
  &.alert-error {
    background-color: #fff2f0;
    border: 1px solid #ffccc7;
    color: #cf1322;
  }
  
  i {
    margin-right: 8px;
    margin-top: 2px;
  }
  
  div {
    flex: 1;
    
    strong {
      display: block;
      margin-bottom: 4px;
    }
  }
}

.login-form {
  .form-group {
    margin-bottom: 20px;
    
    label {
      display: block;
      margin-bottom: 6px;
      color: var(--text-primary);
      font-weight: 500;
    }
    
    input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.2s;
      
      &:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.1);
      }
      
      &:disabled {
        background-color: var(--card);
        cursor: not-allowed;
      }
    }
  }
  
  .password-input {
    position: relative;
    
    .toggle-password {
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
        color: var(--text-primary);
      }
      
      &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
    }
  }
}

.btn {
  width: 100%;
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &.btn-primary {
    background: var(--primary);
    color: white;
    
    &:hover:not(:disabled) {
      background: var(--primary-dark);
    }
    
    &:disabled {
      background: var(--text-secondary);
      cursor: not-allowed;
    }
  }
  
  .loading-spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 8px;
  }
}

.config-info {
  margin: 30px 0;
  padding: 20px;
  background: var(--card);
  border-radius: 8px;
  
  h3 {
    margin: 0 0 15px 0;
    font-size: 16px;
    color: var(--text-primary);
  }
  
  .config-details {
    .config-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      
      .label {
        color: var(--text-secondary);
        font-size: 14px;
      }
      
      .value {
        color: var(--text-primary);
        font-size: 14px;
        font-weight: 500;
      }
      
      .status {
        font-size: 14px;
        font-weight: 500;
        
        &.connected {
          color: #52c41a;
        }
        
        &.disconnected {
          color: #ff4d4f;
        }
      }
    }
  }
}

.help-section {
  margin: 20px 0;
  
  h3 {
    margin: 0 0 10px 0;
    font-size: 16px;
    color: var(--text-primary);
  }
  
  ul {
    margin: 0;
    padding-left: 20px;
    
    li {
      margin-bottom: 6px;
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.4;
    }
  }
}

.alternative-login {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
  
  p {
    margin: 0;
    font-size: 14px;
    color: var(--text-secondary);
  }
  
  .link-btn {
    background: none;
    border: none;
    color: var(--primary);
    cursor: pointer;
    text-decoration: underline;
    font-size: 14px;
    margin: 0 8px;
    
    &:hover {
      color: var(--primary-dark);
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 