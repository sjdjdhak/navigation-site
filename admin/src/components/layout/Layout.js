/**
 * 主布局组件
 * 包含头部、侧边栏和主内容区域
 */

// Layout 主布局组件
const Layout = {
  name: 'AppLayout',
  setup() {
    const { ref, onMounted } = Vue;
    
    // 响应式数据
    const sidebarCollapsed = ref(false);
    const isMobile = ref(false);
    const mobileMenuOpen = ref(false);
    
    // 方法
    const toggleSidebar = () => {
      if (isMobile.value) {
        mobileMenuOpen.value = !mobileMenuOpen.value;
      } else {
        sidebarCollapsed.value = !sidebarCollapsed.value;
      }
    };
    
    const handleThemeToggle = (isDark) => {
      // 主题切换逻辑
      console.log('主题切换:', isDark ? '暗色' : '亮色');
    };
    
    const handleLogout = () => {
      // 退出登录逻辑
      console.log('退出登录');
      // 这里应该清除认证状态并跳转到登录页
    };
    
    const checkMobile = () => {
      isMobile.value = window.innerWidth <= 768;
      if (!isMobile.value) {
        mobileMenuOpen.value = false;
      }
    };
    
    const handleResize = () => {
      checkMobile();
    };
    
    const handleClickOutside = (event) => {
      if (isMobile.value && mobileMenuOpen.value) {
        const sidebar = document.querySelector('.app-sidebar');
        if (sidebar && !sidebar.contains(event.target)) {
          mobileMenuOpen.value = false;
        }
      }
    };
    
    // 生命周期
    onMounted(() => {
      checkMobile();
      window.addEventListener('resize', handleResize);
      document.addEventListener('click', handleClickOutside);
    });
    
    return {
      sidebarCollapsed,
      isMobile,
      mobileMenuOpen,
      toggleSidebar,
      handleThemeToggle,
      handleLogout
    };
  },
  template: `
    <div class="app-layout">
      <!-- 头部导航 -->
      <app-header
        :collapsed="sidebarCollapsed"
        @toggle-sidebar="toggleSidebar"
        @toggle-theme="handleThemeToggle"
        @logout="handleLogout"
      />
      
      <!-- 主体内容 -->
      <div class="app-body">
        <!-- 侧边栏 -->
        <app-sidebar
          :collapsed="isMobile ? false : sidebarCollapsed"
          :class="{
            'mobile-open': isMobile && mobileMenuOpen
          }"
        />
        
        <!-- 主内容区 -->
        <main class="app-main">
          <slot></slot>
        </main>
      </div>
      
      <!-- 移动端遮罩层 -->
      <div 
        v-if="isMobile && mobileMenuOpen"
        class="mobile-overlay"
        @click="mobileMenuOpen = false"
      ></div>
    </div>
  `
};

// 导出组件
window.AppLayout = Layout; 