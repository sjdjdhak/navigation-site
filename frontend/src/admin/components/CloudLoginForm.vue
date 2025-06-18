<template>
  <div class="cloud-login-form">
    <div class="login-header">
      <h2>云端认证登录</h2>
      <p class="description">使用您的账号密码登录，所有配置安全存储在云端</p>
    </div>

    <!-- 配置状态检查 -->
    <div v-if="!configStatus.hasConfigRepo" class="alert alert-warning">
      <i class="icon-warning"></i>
      <div>
        <strong>配置仓库未设置</strong>
        <p>请联系管理员配置云端存储仓库信息</p>
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
        :disabled="loading || !configStatus.hasConfigRepo"
      >
        <span v-if="loading" class="loading-spinner"></span>
        {{ loading ? '登录中...' : '登录' }}
      </button>
    </form>

    <!-- 配置状态信息 -->
    <div class="config-info">
      <h3>云端配置信息</h3>
      <div class="config-details">
        <div class="config-item">
          <span class="label">配置仓库:</span>
          <span class="value">{{ configStatus.configRepo.owner }}/{{ configStatus.configRepo.repo }}</span>
        </div>
        <div class="config-item">
          <span class="label">连接状态:</span>
          <span :class="['status', configStatus.hasConfigRepo ? 'connected' : 'disconnected']">
            {{ configStatus.hasConfigRepo ? '已连接' : '未连接' }}
          </span>
        </div>
      </div>
    </div>

    <!-- 帮助信息 -->
    <div class="help-section">
      <h3>使用说明</h3>
      <ul>
        <li>使用管理员分配的账号密码登录</li>
        <li>所有GitHub配置信息安全存储在云端</li>
        <li>支持多用户权限管理</li>
        <li>登录状态会自动同步到云端</li>
      </ul>
    </div>

    <!-- 其他登录方式 -->
    <div class="alternative-login">
      <p>
        其他登录方式：
        <button type="button" class="link-btn" @click="$emit('switchMode', 'github')">
          GitHub直连登录
        </button>
        <button type="button" class="link-btn" @click="$emit('switchMode', 'env-auth')">
          环境变量登录
        </button>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { cloudAuthService } from '@/admin/services/cloud-auth-service'

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
  hasConfigRepo: false,
  configRepo: {
    owner: '',
    repo: '',
    hasToken: false
  }
})

// 获取配置状态
const getConfigStatus = () => {
  const status = cloudAuthService.getConfigStatus()
  configStatus.value = status
  console.log('CloudLoginForm 配置状态更新:', status)
}

// 处理登录
const handleLogin = async () => {
  if (!formData.username || !formData.password) {
    error.value = '请输入用户名和密码'
    return
  }

  if (!configStatus.value.hasConfigRepo) {
    error.value = '云端配置仓库未设置，请联系管理员'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await cloudAuthService.login(formData.username, formData.password)
    emit('loginSuccess')
  } catch (err: any) {
    error.value = err.message || '登录失败，请重试'
  } finally {
    loading.value = false
  }
}

// 组件挂载时获取配置状态
let unsubscribe: (() => void) | null = null

onMounted(() => {
  getConfigStatus()
  
  // 监听云端认证服务状态变化
  unsubscribe = cloudAuthService.subscribe((state) => {
    getConfigStatus()
  })
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})
</script>

<style lang="scss" scoped>
@import "@/assets/styles/variables.scss";

.cloud-login-form {
  max-width: 400px;
  margin: 0 auto;
  
  .login-header {
    text-align: center;
    margin-bottom: 30px;
    
    h2 {
      color: var(--text-primary);
      margin-bottom: 10px;
    }
    
    .description {
      color: var(--text-secondary);
      font-size: 14px;
    }
  }
  
  .alert {
    padding: 12px;
    border-radius: 6px;
    margin-bottom: 20px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    
    &.alert-warning {
      background-color: #fff3cd;
      border: 1px solid #ffeaa7;
      color: #856404;
    }
    
    &.alert-error {
      background-color: #f8d7da;
      border: 1px solid #f1aeb5;
      color: #721c24;
    }
    
    i {
      font-size: 16px;
      margin-top: 2px;
    }
    
    strong {
      display: block;
      margin-bottom: 4px;
    }
    
    p {
      margin: 0;
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
          color: var(--primary);
        }
        
        &:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
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
  
  .config-info {
    background-color: var(--card);
    padding: 16px;
    border-radius: 6px;
    margin-bottom: 20px;
    
    h3 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: var(--text-primary);
    }
    
    .config-details {
      .config-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        
        .label {
          color: var(--text-secondary);
          font-size: 13px;
        }
        
        .value {
          font-size: 13px;
          font-family: monospace;
          color: var(--text-primary);
        }
        
        .status {
          font-size: 13px;
          font-weight: 500;
          
          &.connected {
            color: #28a745;
          }
          
          &.disconnected {
            color: #dc3545;
          }
        }
      }
    }
  }
  
  .help-section {
    margin-bottom: 20px;
    
    h3 {
      font-size: 14px;
      margin-bottom: 12px;
      color: var(--text-primary);
    }
    
    ul {
      margin: 0;
      padding-left: 20px;
      
      li {
        margin-bottom: 6px;
        font-size: 13px;
        color: var(--text-secondary);
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