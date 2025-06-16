<template>
  <div class="admin-login">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>后台管理系统</h1>
          <p>导航站数据管理平台</p>
        </div>
        
        <!-- 登录模式切换 -->
        <div class="mode-switch">
          <el-radio-group v-model="loginMode" @change="handleModeChange">
            <el-radio-button label="test">测试模式</el-radio-button>
            <el-radio-button label="github">GitHub模式</el-radio-button>
          </el-radio-group>
        </div>
        
        <!-- 测试模式登录表单 -->
        <div v-if="isTestMode" class="test-mode">
          <el-form 
            ref="testFormRef" 
            :model="testForm" 
            :rules="testRules" 
            label-width="120px"
            @submit.prevent="handleTestLogin"
          >
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="testForm.username"
                placeholder="请输入用户名"
              />
              <div class="form-help">
                测试账号：admin
              </div>
            </el-form-item>
            
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="testForm.password"
                type="password"
                placeholder="请输入密码"
                show-password
              />
              <div class="form-help">
                测试密码：123456
              </div>
            </el-form-item>
            
            <el-form-item>
              <el-button 
                type="primary" 
                :loading="loading"
                @click="handleTestLogin"
                style="width: 100%"
              >
                {{ loading ? '登录中...' : '登录' }}
              </el-button>
            </el-form-item>
          </el-form>
          
          <div class="test-info">
            <h3>测试模式说明</h3>
            <ul>
              <li>测试账号：<strong>admin</strong></li>
              <li>测试密码：<strong>123456</strong></li>
              <li>此模式仅用于本地开发测试</li>
              <li>生产环境请使用 GitHub 模式</li>
            </ul>
          </div>
        </div>
        
        <!-- GitHub模式登录表单 -->
        <div v-else class="github-mode">
          <LoginForm @success="handleGitHubSuccess" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance } from 'element-plus'
import { authService } from '../services/auth-service'
import LoginForm from '../components/LoginForm.vue'

interface TestForm {
  username: string
  password: string
}

const router = useRouter()
const testFormRef = ref<FormInstance>()
const loading = ref(false)
const loginMode = ref<'test' | 'github'>('github')

const isTestMode = computed(() => loginMode.value === 'test')

// 测试模式表单
const testForm = reactive<TestForm>({
  username: '',
  password: ''
})

// 测试模式验证规则
const testRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

// 处理模式切换
const handleModeChange = () => {
  if (isTestMode.value) {
    Object.assign(testForm, { username: '', password: '' })
  }
}

// 测试模式登录
const handleTestLogin = async () => {
  if (!testFormRef.value) return
  
  try {
    await testFormRef.value.validate()
    loading.value = true
    
    // 模拟登录验证
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 验证测试账号密码
    if (testForm.username !== 'admin' || testForm.password !== '123456') {
      throw new Error('用户名或密码错误')
    }
    
    // 保存测试模式标识
    localStorage.setItem('admin_mode', 'test')
    localStorage.setItem('admin_user', testForm.username)
    localStorage.setItem('admin_login_time', new Date().toISOString())
    
    ElMessage.success('登录成功')
    
    // 跳转到管理后台
    router.push('/admin/dashboard')
    
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '登录失败')
  } finally {
    loading.value = false
  }
}

// GitHub模式登录成功
const handleGitHubSuccess = () => {
  router.push('/admin/dashboard')
}

// 检查是否已登录
const checkExistingAuth = async () => {
  // 检查测试模式
  const testMode = localStorage.getItem('admin_mode')
  if (testMode === 'test') {
    const user = localStorage.getItem('admin_user')
    if (user) {
      router.push('/admin/dashboard')
      return
    }
  }
  
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

.mode-switch {
  margin-bottom: 30px;
  text-align: center;
  
  :deep(.el-radio-group) {
    width: 100%;
  }
  
  :deep(.el-radio-button) {
    flex: 1;
  }
}

.form-help {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.test-info {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  
  h3 {
    font-size: 14px;
    color: #333;
    margin-bottom: 10px;
  }
  
  ul {
    font-size: 12px;
    color: #666;
    padding-left: 16px;
    
    li {
      margin-bottom: 4px;
    }
  }
  
  strong {
    color: #409eff;
    font-weight: 600;
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