/**
 * 后台管理系统主入口文件
 * 负责初始化Vue应用和路由
 */

// 主应用入口文件

// 等待所有依赖加载完成
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM加载完成，开始检查组件...');
  
  // 简化的初始化方式
  const simpleInit = () => {
    console.log('使用简化初始化方式');
    setTimeout(initApp, 1000);
  };
  
  // 确保所有组件都已加载
  const checkComponents = () => {
    const requiredComponents = [
      'AppHeader',
      'AppSidebar', 
      'AppLayout',
      'LoginView',
      'DashboardView',
      'SiteManagerView',
      'CategoryManagerView',
      'SettingsView',
      'AppRouter'
    ];
    
    const missingComponents = requiredComponents.filter(name => !window[name]);
    
    if (missingComponents.length > 0) {
      console.log('等待组件加载:', missingComponents);
      // 增加超时机制，避免无限等待
      if (!window.componentCheckCount) {
        window.componentCheckCount = 0;
      }
      window.componentCheckCount++;
      
      if (window.componentCheckCount > 30) {
        console.error('组件加载超时，使用简化初始化');
        simpleInit();
        return;
      }
      
      setTimeout(checkComponents, 100);
      return;
    }
    
    console.log('所有组件加载完成');
    // 所有组件都已加载，初始化应用
    initApp();
  };
  
  // 先尝试正常检查，如果失败则使用简化方式
  try {
    checkComponents();
  } catch (error) {
    console.error('组件检查失败:', error);
    simpleInit();
  }
});

// 初始化应用
function initApp() {
  const { createApp, ref, onMounted } = Vue;
  
  // 主应用组件
  const App = {
    setup() {
      const loading = ref(true);
      const isAuthenticated = ref(false);
      
      // 检查认证状态
      const checkAuth = () => {
        const token = localStorage.getItem('github_token') || sessionStorage.getItem('github_token');
        const repository = localStorage.getItem('github_repository') || sessionStorage.getItem('github_repository');
        
        isAuthenticated.value = !!(token && repository);
        console.log('认证检查结果:', {
          hasToken: !!token,
          hasRepository: !!repository,
          isAuthenticated: isAuthenticated.value
        });
        return isAuthenticated.value;
      };
      
      // 处理登录成功
      const handleLoginSuccess = (authData) => {
        console.log('登录成功:', authData);
        isAuthenticated.value = true;
      };
      
      // 处理退出登录
      const handleLogout = () => {
        // 清除认证信息
        localStorage.removeItem('github_token');
        localStorage.removeItem('github_repository');
        sessionStorage.removeItem('github_token');
        sessionStorage.removeItem('github_repository');
        
        isAuthenticated.value = false;
        
        // 重新加载页面
        window.location.reload();
      };
      
      // 初始化主题
      const initTheme = () => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
      };
      
      // 组件挂载时执行
      onMounted(() => {
        // 减少加载时间
        setTimeout(() => {
          loading.value = false;
          checkAuth();
          initTheme();
        }, 500);
      });
      
      return {
        loading,
        isAuthenticated,
        handleLoginSuccess,
        handleLogout
      };
    },
    template: `
      <div>
        <!-- 加载中状态 -->
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>系统初始化中...</p>
          </div>
        </div>
        
        <!-- 主应用 -->
        <div v-else-if="!isAuthenticated" class="login-container">
          <login-view @login-success="handleLoginSuccess"></login-view>
        </div>
        
        <!-- 已登录状态 -->
        <div v-else class="admin-container">
          <app-layout @logout="handleLogout">
            <router-view></router-view>
          </app-layout>
        </div>
      </div>
    `
  };
  
  // 创建Vue应用实例
  const app = createApp(App);
  
  // 注册全局组件（带错误处理）
  try {
    if (window.AppHeader) app.component('app-header', window.AppHeader);
    if (window.AppSidebar) app.component('app-sidebar', window.AppSidebar);
    if (window.AppLayout) app.component('app-layout', window.AppLayout);
    if (window.LoginView) app.component('login-view', window.LoginView);
  } catch (error) {
    console.error('注册组件失败:', error);
  }
  
  // 使用路由（带错误处理）
  try {
    if (window.AppRouter) {
      app.use(window.AppRouter);
    } else {
      console.warn('路由未加载，使用默认路由');
    }
  } catch (error) {
    console.error('路由初始化失败:', error);
  }
  
  // 使用Element Plus
  try {
    if (window.ElementPlus) {
      app.use(ElementPlus);
    } else {
      console.error('Element Plus未加载');
    }
  } catch (error) {
    console.error('Element Plus初始化失败:', error);
  }
  
  // 全局错误处理
  app.config.errorHandler = (err, vm, info) => {
    console.error('Vue应用错误:', err, info);
    ElMessage.error('应用发生错误，请刷新页面重试');
  };
  
  // 挂载应用
  app.mount('#app');
  
  console.log('工具集导航站后台管理系统已启动');
} 