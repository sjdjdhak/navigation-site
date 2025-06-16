<template>
  <div class="admin-login">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>后台管理系统</h1>
          <p>导航站数据管理平台</p>
        </div>
        
        <!-- GitHub模式登录表单 -->
        <div class="github-mode">
          <LoginForm @success="handleGitHubSuccess" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/admin/services/auth-service'
import LoginForm from '@/admin/components/LoginForm.vue'

const router = useRouter()

// GitHub模式登录成功
const handleGitHubSuccess = async () => {
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
  // 检查GitHub模式
  const authState = authService.getState()
  if (authState.isAuthenticated) {
    const isValid = await authService.checkAuth()
    if (isValid) {
      router.push('/admin/dashboard')
    }
  }
}

onMounted(() => {
  checkExistingAuth()
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

.github-mode {
  :deep(.login-form) {
    padding: 0;
  }
  
  :deep(.login-header) {
    display: none;
  }
}
</style> 