/**
 * 登录页面
 * GitHub Token认证界面
 */

// Login 登录页面组件
const Login = {
  name: 'LoginView',
  emits: ['login-success'],
  setup(props, { emit }) {
    const { ref, reactive } = Vue;
    
    // 响应式数据
    const loading = ref(false);
    const showPassword = ref(false);
    
    // 表单数据
    const loginForm = reactive({
      token: '',
      repository: '',
      remember: false
    });
    
    // 表单验证规则
    const rules = reactive({
      token: [
        { required: true, message: '请输入GitHub Token', trigger: 'blur' },
        { min: 40, max: 40, message: 'GitHub Token长度应为40位', trigger: 'blur' }
      ],
      repository: [
        { required: true, message: '请输入仓库地址', trigger: 'blur' },
        { 
          pattern: /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/, 
          message: '仓库地址格式应为: username/repository', 
          trigger: 'blur' 
        }
      ]
    });
    
    const formRef = ref(null);
    
    // 方法
    const handleLogin = async () => {
      try {
        const valid = await formRef.value.validate();
        if (!valid) return;
        
        loading.value = true;
        
        // 模拟登录验证
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 保存认证信息
        if (loginForm.remember) {
          localStorage.setItem('github_token', loginForm.token);
          localStorage.setItem('github_repository', loginForm.repository);
        } else {
          sessionStorage.setItem('github_token', loginForm.token);
          sessionStorage.setItem('github_repository', loginForm.repository);
        }
        
        ElMessage.success('登录成功！');
        emit('login-success', {
          token: loginForm.token,
          repository: loginForm.repository
        });
        
      } catch (error) {
        console.error('登录失败:', error);
        ElMessage.error('登录失败，请检查Token和仓库地址是否正确');
      } finally {
        loading.value = false;
      }
    };
    
    const togglePasswordVisibility = () => {
      showPassword.value = !showPassword.value;
    };
    
    const openGitHubTokenHelp = () => {
      window.open('https://github.com/settings/tokens', '_blank');
    };
    
    // 初始化表单数据
    const initFormData = () => {
      const savedToken = localStorage.getItem('github_token') || sessionStorage.getItem('github_token');
      const savedRepository = localStorage.getItem('github_repository') || sessionStorage.getItem('github_repository');
      
      if (savedToken) {
        loginForm.token = savedToken;
        loginForm.remember = !!localStorage.getItem('github_token');
      }
      
      if (savedRepository) {
        loginForm.repository = savedRepository;
      }
    };
    
    // 组件挂载时初始化
    Vue.onMounted(() => {
      initFormData();
    });
    
    return {
      loading,
      showPassword,
      loginForm,
      rules,
      formRef,
      handleLogin,
      togglePasswordVisibility,
      openGitHubTokenHelp
    };
  },
  template: `
    <div class="login-view">
      <!-- 登录头部 -->
      <div class="login-header">
        <div class="login-logo">
          <i class="fas fa-compass"></i>
        </div>
        <h1 class="login-title">工具集导航站</h1>
        <p class="login-subtitle">后台管理系统</p>
      </div>
      
      <!-- 登录表单 -->
      <el-form
        ref="formRef"
        :model="loginForm"
        :rules="rules"
        class="login-form"
        label-position="top"
        size="large"
      >
        <el-form-item label="GitHub Personal Access Token" prop="token">
          <el-input
            v-model="loginForm.token"
            :type="showPassword ? 'text' : 'password'"
            placeholder="请输入GitHub Token"
            clearable
          >
            <template #suffix>
              <el-button
                type="text"
                @click="togglePasswordVisibility"
                class="password-toggle"
              >
                <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </el-button>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="GitHub 仓库" prop="repository">
          <el-input
            v-model="loginForm.repository"
            placeholder="例如: username/navigation-data"
            clearable
          >
            <template #prefix>
              <i class="fab fa-github"></i>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="loginForm.remember">
            记住登录信息
          </el-checkbox>
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            class="login-button"
            :loading="loading"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>
      
      <!-- 帮助信息 -->
      <div class="login-help">
        <p>
          需要帮助？
          <a href="#" @click.prevent="openGitHubTokenHelp">
            如何获取GitHub Token
          </a>
        </p>
        <p class="help-text">
          Token需要具有对目标仓库的读写权限
        </p>
      </div>
    </div>
  `
};

// 导出组件
window.LoginView = Login; 