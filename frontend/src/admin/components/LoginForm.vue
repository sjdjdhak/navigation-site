<template>
  <div class="login-form">
    <el-form 
      ref="formRef" 
      :model="form" 
      :rules="rules" 
      label-width="120px"
      @submit.prevent="handleLogin"
    >
      <el-form-item label="GitHub用户名" prop="owner">
        <el-input
          v-model="form.owner"
          placeholder="请输入GitHub用户名或组织名"
          clearable
        >
          <template #prepend>
            <i class="el-icon-user"></i>
          </template>
        </el-input>
        <div class="form-help">
          例如：octocat 或 github
        </div>
      </el-form-item>
      
      <el-form-item label="仓库名称" prop="repo">
        <el-input
          v-model="form.repo"
          placeholder="请输入仓库名称"
          clearable
        >
          <template #prepend>
            <i class="el-icon-folder"></i>
          </template>
        </el-input>
        <div class="form-help">
          例如：navigation-data
        </div>
      </el-form-item>
      
      <el-form-item label="GitHub Token" prop="token">
        <el-input
          v-model="form.token"
          type="password"
          placeholder="请输入GitHub Personal Access Token"
          show-password
          clearable
        >
          <template #prepend>
            <i class="el-icon-key"></i>
          </template>
        </el-input>
        <div class="form-help">
          <a :href="tokenGuideUrl" target="_blank" class="help-link">
            如何创建GitHub Token？
          </a>
        </div>
      </el-form-item>
      
      <el-form-item label="分支名称" prop="branch">
        <el-input
          v-model="form.branch"
          placeholder="请输入分支名称（可选）"
          clearable
        >
          <template #prepend>
            <i class="el-icon-collection-tag"></i>
          </template>
        </el-input>
        <div class="form-help">
          默认为 main 分支
        </div>
      </el-form-item>
      
      <el-form-item>
        <el-button 
          type="primary" 
          :loading="loading"
          @click="handleLogin"
          style="width: 100%"
        >
          {{ loading ? '连接中...' : '连接GitHub' }}
        </el-button>
      </el-form-item>
    </el-form>
    
    <div class="github-info">
      <h3>GitHub模式说明</h3>
      <ul>
        <li>需要提供GitHub Personal Access Token</li>
        <li>Token需要仓库读写权限</li>
        <li>数据将存储在指定的GitHub仓库中</li>
        <li>支持多人协作和版本控制</li>
      </ul>
      
      <div class="required-permissions">
        <h4>所需权限</h4>
        <el-tag v-for="permission in requiredPermissions" :key="permission" size="small" type="info">
          {{ permission }}
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { authService } from '@/admin/services/auth-service'
import type { GitHubConfig } from '@/admin/services/github-api'

// 定义emits
const emit = defineEmits<{
  success: []
}>()

// 表单引用
const formRef = ref<FormInstance>()
const loading = ref(false)

// 表单数据
const form = reactive<GitHubConfig>({
  owner: '',
  repo: '',
  token: '',
  branch: 'main'
})

// 获取Token创建指南URL和所需权限
const tokenGuideUrl = computed(() => authService.getTokenGuideUrl())
const requiredPermissions = computed(() => authService.getRequiredPermissions())

// 表单验证规则
const rules = {
  owner: [
    { required: true, message: '请输入GitHub用户名或组织名', trigger: 'blur' },
    { 
      pattern: /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/,
      message: '用户名格式不正确',
      trigger: 'blur'
    }
  ],
  repo: [
    { required: true, message: '请输入仓库名称', trigger: 'blur' },
    { 
      pattern: /^[a-zA-Z0-9._-]+$/,
      message: '仓库名称只能包含字母、数字、点、下划线和连字符',
      trigger: 'blur'
    }
  ],
  token: [
    { required: true, message: '请输入GitHub Token', trigger: 'blur' },
    { 
      pattern: /^(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]+)$/,
      message: 'Token格式不正确，请检查是否为有效的GitHub Personal Access Token',
      trigger: 'blur'
    }
  ],
  branch: [
    { 
      pattern: /^[a-zA-Z0-9._/-]+$/,
      message: '分支名称格式不正确',
      trigger: 'blur'
    }
  ]
}

// 处理登录
const handleLogin = async () => {
  if (!formRef.value) return
  
  try {
    // 表单验证
    await formRef.value.validate()
    
    // 客户端验证
    const errors = authService.validateConfig(form)
    if (errors.length > 0) {
      ElMessage.error(errors[0])
      return
    }
    
    loading.value = true
    
    // 调用认证服务登录
    await authService.login(form)
    
    // 确保状态完全同步
    await new Promise(resolve => setTimeout(resolve, 50))
    
    ElMessage.success('GitHub连接成功！')
    
    // 发射成功事件
    emit('success')
    
  } catch (error) {
    console.error('GitHub登录失败:', error)
    
    // 根据错误类型显示不同的错误信息
    let errorMessage = '连接失败，请检查配置'
    
    if (error instanceof Error) {
      if (error.message.includes('Token无效')) {
        errorMessage = 'GitHub Token无效，请检查Token是否正确'
      } else if (error.message.includes('仓库')) {
        errorMessage = '无法访问指定仓库，请检查仓库名称和Token权限'
      } else if (error.message.includes('网络')) {
        errorMessage = '网络连接失败，请检查网络设置'
      } else {
        errorMessage = error.message
      }
    }
    
    ElMessage.error(errorMessage)
  } finally {
    loading.value = false
  }
}

// 从本地存储加载已保存的配置
const loadSavedConfig = () => {
  const authState = authService.getState()
  if (authState.config) {
    Object.assign(form, authState.config)
  }
}

// 组件挂载时加载配置
onMounted(() => {
  loadSavedConfig()
})
</script>

<style lang="scss" scoped>
.login-form {
  .form-help {
    font-size: 12px;
    color: #999;
    margin-top: 4px;
    
    .help-link {
      color: #409eff;
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
  
  .github-info {
    margin-top: 30px;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 6px;
    border-left: 4px solid #409eff;
    
    h3 {
      margin: 0 0 12px 0;
      font-size: 16px;
      color: #303133;
    }
    
    h4 {
      margin: 16px 0 8px 0;
      font-size: 14px;
      color: #606266;
    }
    
    ul {
      margin: 0;
      padding-left: 20px;
      
      li {
        margin-bottom: 6px;
        color: #606266;
        font-size: 14px;
        line-height: 1.5;
      }
    }
    
    .required-permissions {
      .el-tag {
        margin-right: 8px;
        margin-bottom: 4px;
      }
    }
  }
  
  :deep(.el-input-group__prepend) {
    background-color: #fafafa;
    border-color: #dcdfe6;
    color: #909399;
  }
  
  :deep(.el-form-item) {
    margin-bottom: 24px;
  }
  
  :deep(.el-button) {
    height: 44px;
    font-size: 16px;
    border-radius: 6px;
  }
}
</style> 