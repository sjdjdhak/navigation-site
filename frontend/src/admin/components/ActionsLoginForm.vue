<template>
  <div class="actions-login-form">
    <div class="auth-header">
      <h3>Actions认证</h3>
      <p>使用GitHub Actions作为后端的安全认证</p>
    </div>

    <el-form @submit.prevent="handleLogin" :loading="loading">
      <el-form-item>
        <el-input
          v-model="username"
          placeholder="请输入用户名"
          size="large"
          :disabled="loading"
        />
      </el-form-item>

      <el-form-item>
        <el-input
          v-model="password"
          type="password"
          placeholder="请输入密码"
          size="large"
          :disabled="loading"
          @keyup.enter="handleLogin"
        />
      </el-form-item>

      <el-form-item>
        <el-button
          type="primary"
          size="large"
          :loading="loading"
          @click="handleLogin"
          style="width: 100%"
        >
          {{ loading ? '认证中...' : '登录' }}
        </el-button>
      </el-form-item>
    </el-form>

    <div class="status-info">
      <div class="status-item">
        <span class="label">服务状态:</span>
        <span :class="['status', healthStatus ? 'success' : 'error']">
          {{ healthStatus ? '正常' : '离线' }}
        </span>
      </div>
      <div class="status-item">
        <span class="label">认证方式:</span>
        <span class="value">GitHub Actions</span>
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { actionsAuthService } from '../services/actions-auth-service'

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const healthStatus = ref(false)

const handleLogin = async () => {
  if (!username.value || !password.value) {
    ElMessage.error('请输入用户名和密码')
    return
  }

  loading.value = true
  error.value = ''

  try {
    await actionsAuthService.login(username.value, password.value)
    ElMessage.success('登录成功')
  } catch (err: any) {
    error.value = err.message || '登录失败'
    ElMessage.error(error.value)
  } finally {
    loading.value = false
  }
}

const checkHealth = async () => {
  try {
    healthStatus.value = await actionsAuthService.checkHealth()
  } catch (error) {
    healthStatus.value = false
  }
}

onMounted(() => {
  checkHealth()
})
</script>

<style scoped lang="scss">
@import "@/assets/styles/variables.scss";

.actions-login-form {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;

  h3 {
    color: $primary;
    margin-bottom: 0.5rem;
    font-size: 1.5rem;
  }

  p {
    color: $text-secondary;
    font-size: 0.9rem;
  }
}

.status-info {
  margin-top: 1rem;
  padding: 1rem;
  background: $card;
  border-radius: $radius-md;
  font-size: 0.9rem;

  .status-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;

    &:last-child {
      margin-bottom: 0;
    }

    .label {
      color: $text-secondary;
    }

    .status {
      &.success {
        color: var(--success);
      }

      &.error {
        color: var(--error);
      }
    }

    .value {
      color: $text-primary;
    }
  }
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(164, 38, 44, 0.1);
  border: 1px solid rgba(164, 38, 44, 0.3);
  border-radius: 6px;
  color: var(--error);
  font-size: 0.9rem;
  text-align: center;
}

:deep(.el-form-item) {
  margin-bottom: 1.5rem;
}

:deep(.el-input__wrapper) {
  border-radius: $radius-md;
}

:deep(.el-button) {
  border-radius: $radius-md;
  height: 44px;
  font-weight: 600;
}
</style> 