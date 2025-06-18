<template>
  <div class="admin-login">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>后台管理系统</h1>
          <p>导航站数据管理平台</p>
        </div>
        
        <!-- 认证模式选择 -->
        <div class="auth-mode-selector">
          <div class="mode-tabs">
            <button 
              v-for="mode in availableModes" 
              :key="mode.key"
              @click="currentMode = mode.key"
              :class="['mode-tab', { active: currentMode === mode.key }]"
            >
              {{ mode.name }}
            </button>
          </div>
        </div>
        
        <!-- 云端认证模式 -->
        <div v-if="currentMode === 'cloud-auth'" class="auth-form">
          <CloudLoginForm 
            @login-success="handleLoginSuccess" 
            @switch-mode="currentMode = $event"
          />
        </div>
        
        <!-- GitHub直连模式 -->
        <div v-else-if="currentMode === 'github'" class="auth-form">
          <GitHubLoginForm 
            @success="handleLoginSuccess" 
            @switch-mode="currentMode = $event"
          />
        </div>
        
        <!-- 环境变量模式 -->
        <div v-else-if="currentMode === 'env-auth'" class="auth-form">
          <EnvLoginForm 
            @login-success="handleLoginSuccess" 
            @switch-mode="currentMode = $event"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { unifiedAuthService } from '@/admin/services/unified-auth-service'
import CloudLoginForm from '@/admin/components/CloudLoginForm.vue'
import GitHubLoginForm from '@/admin/components/GitHubLoginForm.vue'
import EnvLoginForm from '@/admin/components/EnvLoginForm.vue'

const router = useRouter()

// 当前认证模式
const currentMode = ref<string>('cloud-auth')

// 可用的认证模式
const availableModes = computed(() => {
  const authState = unifiedAuthService.getState()
  return authState.availableModes.map(mode => ({
    key: mode,
    name: getModeName(mode)
  }))
})

// 获取模式名称
const getModeName = (mode: string) => {
  const modeNames: Record<string, string> = {
    'cloud-auth': '云端认证',
    'github': 'GitHub直连',
    'env-auth': '环境变量',
    'repo-auth': '仓库认证'
  }
  return modeNames[mode] || mode
}

// 登录成功处理
const handleLoginSuccess = async () => {
  // 确保状态完全同步后再跳转
  await new Promise(resolve => setTimeout(resolve, 100))
  
  try {
    await router.push('/admin/dashboard')
  } catch (error) {
    console.error('跳转失败:', error)
    // 如果跳转失败，可能是路由守卫问题，尝试刷新页面
    window.location.href = '/admin/dashboard'
  }
}

// 检查是否已登录
const checkExistingAuth = async () => {
  const authState = unifiedAuthService.getState()
  if (authState.isAuthenticated) {
    router.push('/admin/dashboard')
  }
}

onMounted(() => {
  checkExistingAuth()
  
  // 设置默认认证模式为云端认证（如果可用）
  const authState = unifiedAuthService.getState()
  if (authState.availableModes.includes('cloud-auth')) {
    currentMode.value = 'cloud-auth'
  } else if (authState.availableModes.length > 0) {
    currentMode.value = authState.availableModes[0]
  }
})
</script>

<style lang="scss" scoped>
.admin-login {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 600px;
}

.login-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
  
  h1 {
    color: #333;
    margin-bottom: 8px;
    font-size: 28px;
    font-weight: 600;
  }
  
  p {
    color: #666;
    font-size: 14px;
  }
}

.auth-mode-selector {
  margin-bottom: 20px;
  
  .mode-tabs {
    display: flex;
    border-radius: 8px;
    background: #f5f5f5;
    padding: 4px;
    
    .mode-tab {
      flex: 1;
      padding: 10px 15px;
      border: none;
      background: transparent;
      color: #666;
      cursor: pointer;
      border-radius: 4px;
      font-size: 14px;
      transition: all 0.2s;
      
      &:hover {
        color: #333;
      }
      
      &.active {
        background: white;
        color: #667eea;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
    }
  }
}

.auth-form {
  :deep(.login-header) {
    margin-bottom: 15px;
    
    h2 {
      font-size: 20px;
      margin-bottom: 5px;
    }
    
    .description {
      font-size: 13px;
      color: #666;
    }
  }
}
</style> 