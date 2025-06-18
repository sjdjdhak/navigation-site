<template>
  <div class="config-diagnostic">
    <h3>🔧 配置诊断工具</h3>
    
    <div class="diagnostic-section">
      <h4>1. 配置文件加载状态</h4>
      <div class="status-item">
        <span class="label">config.json 访问状态:</span>
        <span :class="['status', configFileStatus.loaded ? 'success' : 'error']">
          {{ configFileStatus.loaded ? '✅ 成功' : '❌ 失败' }}
        </span>
        <button @click="testConfigFile" class="btn-small">重新测试</button>
      </div>
      <div v-if="configFileStatus.error" class="error-details">
        错误: {{ configFileStatus.error }}
      </div>
      <div v-if="configFileStatus.content" class="config-content">
        <details>
          <summary>配置内容预览</summary>
          <pre>{{ JSON.stringify(configFileStatus.content, null, 2) }}</pre>
        </details>
      </div>
    </div>

    <div class="diagnostic-section">
      <h4>2. 环境变量状态</h4>
      <div class="env-vars">
        <div v-for="(value, key) in envVars" :key="key" class="env-item">
          <span class="env-key">{{ key }}:</span>
          <span :class="['env-value', value ? 'has-value' : 'no-value']">
            {{ value ? '✅ 已设置' : '❌ 未设置' }}
          </span>
        </div>
      </div>
    </div>

    <div class="diagnostic-section">
      <h4>3. GitHub API 连接测试</h4>
      <div class="status-item">
        <span class="label">GitHub API 状态:</span>
        <span :class="['status', githubApiStatus.connected ? 'success' : 'error']">
          {{ githubApiStatus.connected ? '✅ 连接正常' : '❌ 连接失败' }}
        </span>
        <button @click="testGitHubApi" class="btn-small">测试连接</button>
      </div>
      <div v-if="githubApiStatus.error" class="error-details">
        错误: {{ githubApiStatus.error }}
      </div>
    </div>

    <div class="diagnostic-section">
      <h4>4. 用户配置文件测试</h4>
      <div class="user-config-test">
        <input v-model="testUsername" placeholder="输入用户名（如：admin）" />
        <button @click="testUserConfig" class="btn-small">测试用户配置</button>
      </div>
      <div class="status-item">
        <span class="label">用户配置访问:</span>
        <span :class="['status', userConfigStatus.loaded ? 'success' : 'error']">
          {{ userConfigStatus.loaded ? '✅ 成功' : (userConfigStatus.tested ? '❌ 失败' : '⏳ 未测试') }}
        </span>
      </div>
      <div v-if="userConfigStatus.error" class="error-details">
        错误: {{ userConfigStatus.error }}
      </div>
    </div>

    <div class="diagnostic-section">
      <h4>5. 云端认证服务状态</h4>
      <div class="service-status">
        <div class="status-item">
          <span class="label">服务初始化:</span>
          <span :class="['status', serviceStatus.initialized ? 'success' : 'warning']">
            {{ serviceStatus.initialized ? '✅ 已初始化' : '⏳ 初始化中' }}
          </span>
        </div>
        <div class="status-item">
          <span class="label">配置仓库:</span>
          <span class="value">{{ serviceStatus.configRepo }}</span>
        </div>
        <div class="status-item">
          <span class="label">Token状态:</span>
          <span :class="['status', serviceStatus.hasToken ? 'success' : 'error']">
            {{ serviceStatus.hasToken ? '✅ 有Token' : '❌ 无Token' }}
          </span>
        </div>
      </div>
    </div>

    <div class="diagnostic-actions">
      <button @click="runFullDiagnostic" class="btn btn-primary">🔍 运行完整诊断</button>
      <button @click="refreshAll" class="btn btn-secondary">🔄 刷新所有状态</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { cloudAuthService } from '@/admin/services/cloud-auth-service'
import { configService } from '@/admin/services/config-service'

// 响应式数据
const testUsername = ref('admin')

const configFileStatus = reactive({
  loaded: false,
  error: '',
  content: null as any
})

const envVars = reactive({
  'VITE_CONFIG_REPO_TOKEN': import.meta.env.VITE_CONFIG_REPO_TOKEN,
  'VITE_CONFIG_REPO_OWNER': import.meta.env.VITE_CONFIG_REPO_OWNER,
  'VITE_CONFIG_REPO_NAME': import.meta.env.VITE_CONFIG_REPO_NAME,
  'VITE_CONFIG_REPO_BRANCH': import.meta.env.VITE_CONFIG_REPO_BRANCH
})

const githubApiStatus = reactive({
  connected: false,
  error: ''
})

const userConfigStatus = reactive({
  loaded: false,
  tested: false,
  error: ''
})

const serviceStatus = reactive({
  initialized: false,
  configRepo: '',
  hasToken: false
})

// 测试配置文件加载
const testConfigFile = async () => {
  try {
    console.log('测试配置文件加载...')
    const config = await configService.getConfig()
    configFileStatus.loaded = true
    configFileStatus.content = config
    configFileStatus.error = ''
    console.log('配置文件加载成功:', config)
  } catch (error: any) {
    configFileStatus.loaded = false
    configFileStatus.error = error.message || '加载失败'
    configFileStatus.content = null
    console.error('配置文件加载失败:', error)
  }
}

// 测试GitHub API连接
const testGitHubApi = async () => {
  try {
    console.log('测试GitHub API连接...')
    const response = await fetch('https://api.github.com/rate_limit')
    if (response.ok) {
      githubApiStatus.connected = true
      githubApiStatus.error = ''
      console.log('GitHub API连接成功')
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
  } catch (error: any) {
    githubApiStatus.connected = false
    githubApiStatus.error = error.message || '连接失败'
    console.error('GitHub API连接失败:', error)
  }
}

// 测试用户配置
const testUserConfig = async () => {
  try {
    console.log('测试用户配置访问...', testUsername.value)
    userConfigStatus.tested = true
    
    // 直接测试用户配置API
    const cloudConfig = await configService.getCloudAuthConfig()
    const userConfigUrl = `https://api.github.com/repos/${cloudConfig.configRepo.owner}/${cloudConfig.configRepo.repo}/contents/${cloudConfig.userConfigPath}/${testUsername.value}.json`
    
    console.log('用户配置URL:', userConfigUrl)
    
    const response = await fetch(userConfigUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    })

    if (response.ok) {
      userConfigStatus.loaded = true
      userConfigStatus.error = ''
      console.log('用户配置访问成功')
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
  } catch (error: any) {
    userConfigStatus.loaded = false
    userConfigStatus.error = error.message || '访问失败'
    console.error('用户配置访问失败:', error)
  }
}

// 更新服务状态
const updateServiceStatus = async () => {
  try {
    const status = await cloudAuthService.getConfigStatusAsync()
    serviceStatus.initialized = true
    serviceStatus.configRepo = `${status.configRepo.owner}/${status.configRepo.repo}`
    serviceStatus.hasToken = status.configRepo.hasToken
  } catch (error) {
    console.error('获取服务状态失败:', error)
    serviceStatus.initialized = false
  }
}

// 运行完整诊断
const runFullDiagnostic = async () => {
  console.log('🔍 开始运行完整诊断...')
  
  await testConfigFile()
  await testGitHubApi()
  await testUserConfig()
  await updateServiceStatus()
  
  console.log('✅ 完整诊断完成')
}

// 刷新所有状态
const refreshAll = async () => {
  console.log('🔄 刷新所有状态...')
  
  // 重新加载配置
  await configService.reloadConfig()
  
  // 重新运行诊断
  await runFullDiagnostic()
  
  console.log('✅ 状态刷新完成')
}

// 组件挂载时运行初始诊断
onMounted(() => {
  runFullDiagnostic()
})
</script>

<style lang="scss" scoped>
.config-diagnostic {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: var(--surface);
  border-radius: 8px;
  border: 1px solid var(--border);
}

.diagnostic-section {
  margin-bottom: 24px;
  padding: 16px;
  background: var(--surface-variant);
  border-radius: 6px;
  border: 1px solid var(--border-light);

  h4 {
    margin: 0 0 12px 0;
    color: var(--text-primary);
    font-size: 16px;
    font-weight: 600;
  }
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;

  .label {
    color: var(--text-secondary);
    min-width: 120px;
  }

  .status {
    font-weight: 500;
    
    &.success {
      color: var(--success);
    }
    
    &.error {
      color: var(--error);
    }
    
    &.warning {
      color: var(--warning);
    }
  }

  .value {
    color: var(--text-primary);
    font-family: monospace;
  }
}

.btn-small {
  padding: 4px 8px;
  font-size: 12px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background: var(--primary-dark);
  }
}

.error-details {
  background: var(--error-light);
  color: var(--error-dark);
  padding: 8px;
  border-radius: 4px;
  font-size: 14px;
  margin-top: 8px;
}

.config-content {
  margin-top: 12px;
  
  details {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    
    summary {
      padding: 8px;
      cursor: pointer;
      background: var(--surface-variant);
      
      &:hover {
        background: var(--hover);
      }
    }
    
    pre {
      margin: 0;
      padding: 12px;
      font-size: 12px;
      overflow-x: auto;
      background: var(--surface);
    }
  }
}

.env-vars {
  display: grid;
  gap: 8px;
}

.env-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: var(--surface);
  border-radius: 4px;
  border: 1px solid var(--border);

  .env-key {
    color: var(--text-secondary);
    font-family: monospace;
    min-width: 200px;
  }

  .env-value {
    font-weight: 500;
    
    &.has-value {
      color: var(--success);
    }
    
    &.no-value {
      color: var(--error);
    }
  }
}

.user-config-test {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;

  input {
    flex: 1;
    padding: 8px;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--surface);
    color: var(--text-primary);
  }
}

.service-status {
  display: grid;
  gap: 8px;
}

.diagnostic-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border);

  .btn {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &.btn-primary {
      background: var(--primary);
      color: white;
      
      &:hover {
        background: var(--primary-dark);
      }
    }

    &.btn-secondary {
      background: var(--surface-variant);
      color: var(--text-primary);
      border: 1px solid var(--border);
      
      &:hover {
        background: var(--hover);
      }
    }
  }
}
</style> 