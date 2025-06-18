<template>
  <div class="admin-settings">
    <div class="page-header">
      <h1>系统设置</h1>
      <p>管理用户配置和系统参数</p>
    </div>
    
    <div class="settings-container">
      <!-- 用户配置卡片 -->
      <div class="setting-card">
        <div class="card-header">
          <h2>
            <i class="fas fa-user"></i>
            用户配置
          </h2>
          <p>修改当前用户的基本信息</p>
        </div>
        
        <div class="card-content">
          <el-form
            ref="userFormRef"
            :model="userForm"
            :rules="userRules"
            label-width="120px"
            class="user-form"
          >
            <el-form-item label="当前用户名">
              <el-input v-model="currentUsername" disabled>
                <template #prepend>
                  <i class="fas fa-user"></i>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item label="新用户名" prop="username">
              <el-input 
                v-model="userForm.username" 
                placeholder="留空则不修改用户名"
                clearable
              >
                <template #prepend>
                  <i class="fas fa-edit"></i>
                </template>
              </el-input>
            </el-form-item>

            <el-divider content-position="left">密码修改</el-divider>

            <el-form-item label="当前密码" prop="currentPassword">
              <el-input 
                v-model="userForm.currentPassword" 
                type="password" 
                placeholder="修改密码时必填"
                show-password
                clearable
              >
                <template #prepend>
                  <i class="fas fa-lock"></i>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item label="新密码" prop="newPassword">
              <el-input 
                v-model="userForm.newPassword" 
                type="password" 
                placeholder="留空则不修改密码"
                show-password
                clearable
              >
                <template #prepend>
                  <i class="fas fa-key"></i>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item label="确认新密码" prop="confirmPassword">
              <el-input 
                v-model="userForm.confirmPassword" 
                type="password" 
                placeholder="请再次输入新密码"
                show-password
                clearable
              >
                <template #prepend>
                  <i class="fas fa-check"></i>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item>
              <el-button 
                type="primary" 
                @click="handleUpdateUser"
                :loading="updating"
                size="large"
              >
                <i class="fas fa-save"></i>
                保存更改
              </el-button>
              <el-button @click="resetForm" size="large">
                <i class="fas fa-undo"></i>
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 账户信息卡片 -->
      <div class="setting-card">
        <div class="card-header">
          <h2>
            <i class="fas fa-info-circle"></i>
            账户信息
          </h2>
          <p>当前登录账户的详细信息</p>
        </div>
        
        <div class="card-content">
          <div class="info-grid">
            <div class="info-item">
              <label>用户名</label>
              <span>{{ currentUser?.username || '未知' }}</span>
            </div>
            <div class="info-item">
              <label>角色</label>
              <span>{{ currentUser?.role || '未知' }}</span>
            </div>
            <div class="info-item">
              <label>状态</label>
              <span :class="currentUser?.active ? 'status-active' : 'status-inactive'">
                {{ currentUser?.active ? '活跃' : '禁用' }}
              </span>
            </div>
            <div class="info-item">
              <label>创建时间</label>
              <span>{{ formatDate(currentUser?.createdAt) }}</span>
            </div>
            <div class="info-item">
              <label>最后登录</label>
              <span>{{ formatDate(currentUser?.lastLoginTime) }}</span>
            </div>
            <div class="info-item">
              <label>认证模式</label>
              <span>云端认证</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 安全设置卡片 -->
      <div class="setting-card">
        <div class="card-header">
          <h2>
            <i class="fas fa-shield-alt"></i>
            安全设置
          </h2>
          <p>管理账户安全相关设置</p>
        </div>
        
        <div class="card-content">
          <div class="security-options">
            <div class="security-item">
              <div class="security-info">
                <h3>会话管理</h3>
                <p>管理当前登录会话</p>
              </div>
              <el-button type="danger" @click="handleLogout">
                <i class="fas fa-sign-out-alt"></i>
                退出登录
              </el-button>
            </div>
            
            <div class="security-item">
              <div class="security-info">
                <h3>密码安全</h3>
                <p>建议定期更改密码以确保账户安全</p>
              </div>
              <el-tag type="info">上次修改: {{ formatDate(currentUser?.lastLoginTime) }}</el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { unifiedAuthService } from '@/admin/services/unified-auth-service'
import { cloudAuthService } from '@/admin/services/cloud-auth-service'

const router = useRouter()

// 表单引用
const userFormRef = ref<FormInstance>()
const updating = ref(false)

// 当前用户信息
const currentUser = computed(() => unifiedAuthService.getCurrentUser())
const currentUsername = computed(() => currentUser.value?.username || '')

// 用户表单数据
const userForm = reactive({
  username: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 表单验证规则
const userRules = {
  username: [
    {
      pattern: /^[a-zA-Z0-9_-]{3,20}$/,
      message: '用户名只能包含字母、数字、下划线和连字符，长度3-20个字符',
      trigger: 'blur'
    }
  ],
  currentPassword: [
    {
      validator: (rule: any, value: string, callback: any) => {
        if (userForm.newPassword && !value) {
          callback(new Error('修改密码时必须输入当前密码'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  newPassword: [
    {
      min: 6,
      message: '新密码至少6个字符',
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    {
      validator: (rule: any, value: string, callback: any) => {
        if (userForm.newPassword && value !== userForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 格式化日期
const formatDate = (dateString?: string) => {
  if (!dateString) return '未知'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return '格式错误'
  }
}

// 处理用户信息更新
const handleUpdateUser = async () => {
  if (!userFormRef.value) return

  try {
    // 表单验证
    await userFormRef.value.validate()

    // 检查是否有需要更新的内容
    const hasUsernameChange = userForm.username && userForm.username !== currentUsername.value
    const hasPasswordChange = userForm.newPassword && userForm.currentPassword

    if (!hasUsernameChange && !hasPasswordChange) {
      ElMessage.warning('没有需要更新的内容')
      return
    }

    // 确认操作
    const confirmMessage = []
    if (hasUsernameChange) {
      confirmMessage.push(`用户名将从 "${currentUsername.value}" 修改为 "${userForm.username}"`)
    }
    if (hasPasswordChange) {
      confirmMessage.push('密码将被更新')
    }

    await ElMessageBox.confirm(
      `确定要进行以下操作吗？\n\n${confirmMessage.join('\n')}`,
      '确认更新',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    updating.value = true

    // 准备更新数据
    const updates: any = {}
    if (hasUsernameChange) {
      updates.username = userForm.username
    }
    if (hasPasswordChange) {
      updates.password = userForm.newPassword
      updates.currentPassword = userForm.currentPassword
    }

    // 调用更新方法
    await cloudAuthService.updateUserConfig(updates)

    ElMessage.success('用户配置更新成功！')
    
    // 重置表单
    resetForm()

    // 如果用户名发生了变化，提示重新登录
    if (hasUsernameChange) {
      await ElMessageBox.alert(
        '用户名已更新，需要重新登录才能生效',
        '提示',
        {
          confirmButtonText: '立即重新登录',
          type: 'info'
        }
      )
      handleLogout()
    }

  } catch (error: any) {
    console.error('更新用户配置失败:', error)
    if (error.message) {
      ElMessage.error(error.message)
    } else {
      ElMessage.error('更新失败，请重试')
    }
  } finally {
    updating.value = false
  }
}

// 重置表单
const resetForm = () => {
  userForm.username = ''
  userForm.currentPassword = ''
  userForm.newPassword = ''
  userForm.confirmPassword = ''
  userFormRef.value?.resetFields()
}

// 处理登出
const handleLogout = () => {
  unifiedAuthService.logout()
  router.push('/admin/login')
}

// 页面挂载时检查认证状态
onMounted(() => {
  const authState = unifiedAuthService.getState()
  if (!authState.isAuthenticated) {
    router.push('/admin/login')
    return
  }
  
  if (authState.mode !== 'cloud-auth') {
    ElMessage.warning('用户配置管理功能仅支持云端认证模式')
  }
})
</script>

<style lang="scss" scoped>
@import "@/assets/styles/variables.scss";

.admin-settings {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 30px;
  
  h1 {
    margin: 0 0 8px 0;
    font-size: 28px;
    font-weight: 600;
    color: #333;
  }
  
  p {
    margin: 0;
    color: #666;
    font-size: 16px;
  }
}

.settings-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.setting-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  
  h2 {
    margin: 0 0 8px 0;
    font-size: 20px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  p {
    margin: 0;
    opacity: 0.9;
    font-size: 14px;
  }
}

.card-content {
  padding: 24px;
}

.user-form {
  :deep(.el-form-item) {
    margin-bottom: 20px;
  }
  
  :deep(.el-input-group__prepend) {
    background-color: #f8f9fa;
    border-color: #dcdfe6;
    color: #909399;
    width: 45px;
    
    i {
      width: 100%;
      text-align: center;
    }
  }
  
  :deep(.el-button) {
    height: 40px;
    font-size: 14px;
    border-radius: 6px;
    
    i {
      margin-right: 6px;
    }
  }
  
  :deep(.el-divider) {
    margin: 24px 0;
  }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  
  label {
    font-size: 12px;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 500;
  }
  
  span {
    font-size: 14px;
    color: #333;
    font-weight: 500;
    
    &.status-active {
      color: #67c23a;
    }
    
    &.status-inactive {
      color: #f56c6c;
    }
  }
}

.security-options {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.security-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.security-info {
  h3 {
    margin: 0 0 4px 0;
    font-size: 16px;
    color: #333;
  }
  
  p {
    margin: 0;
    font-size: 14px;
    color: #666;
  }
}

@media (max-width: 768px) {
  .admin-settings {
    padding: 0 16px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .security-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style> 