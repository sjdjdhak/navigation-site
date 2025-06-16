/**
 * 头部导航组件
 * 包含Logo、用户信息、主题切换等
 */

// Header 布局组件
const Header = {
  name: 'AppHeader',
  props: {
    collapsed: {
      type: Boolean,
      default: false
    }
  },
  emits: ['toggle-sidebar', 'toggle-theme', 'logout'],
  setup(props, { emit }) {
    const { ref, computed } = Vue;
    
    // 响应式数据
    const userInfo = ref({
      name: 'Admin',
      avatar: '',
      email: 'admin@example.com'
    });
    
    const isDark = ref(false);
    
    // 计算属性
    const themeIcon = computed(() => {
      return isDark.value ? 'fas fa-sun' : 'fas fa-moon';
    });
    
    // 方法
    const toggleSidebar = () => {
      emit('toggle-sidebar');
    };
    
    const toggleTheme = () => {
      isDark.value = !isDark.value;
      document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light');
      emit('toggle-theme', isDark.value);
    };
    
    const handleLogout = () => {
      emit('logout');
    };
    
    const handleCommand = (command) => {
      switch (command) {
        case 'profile':
          // 处理个人资料
          console.log('打开个人资料');
          break;
        case 'settings':
          // 处理设置
          console.log('打开设置');
          break;
        case 'logout':
          handleLogout();
          break;
      }
    };
    
    return {
      userInfo,
      isDark,
      themeIcon,
      toggleSidebar,
      toggleTheme,
      handleLogout,
      handleCommand
    };
  },
  template: `
    <header class="app-header">
      <div class="logo">
        <el-button 
          type="text" 
          @click="toggleSidebar"
          class="sidebar-toggle"
        >
          <i class="fas fa-bars"></i>
        </el-button>
        <i class="fas fa-compass"></i>
        <span>工具集导航站</span>
      </div>
      
      <div class="header-actions">
        <!-- 主题切换 -->
        <el-tooltip content="切换主题" placement="bottom">
          <el-button 
            type="text" 
            @click="toggleTheme"
            class="theme-toggle"
          >
            <i :class="themeIcon"></i>
          </el-button>
        </el-tooltip>
        
        <!-- 通知 -->
        <el-tooltip content="通知" placement="bottom">
          <el-badge :value="3" class="notification-badge">
            <el-button type="text">
              <i class="fas fa-bell"></i>
            </el-button>
          </el-badge>
        </el-tooltip>
        
        <!-- 用户菜单 -->
        <el-dropdown @command="handleCommand" trigger="click">
          <div class="user-info">
            <el-avatar 
              :size="32" 
              :src="userInfo.avatar"
              class="user-avatar"
            >
              <i class="fas fa-user"></i>
            </el-avatar>
            <span class="user-name">{{ userInfo.name }}</span>
            <i class="fas fa-chevron-down"></i>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">
                <i class="fas fa-user"></i>
                个人资料
              </el-dropdown-item>
              <el-dropdown-item command="settings">
                <i class="fas fa-cog"></i>
                设置
              </el-dropdown-item>
              <el-dropdown-item divided command="logout">
                <i class="fas fa-sign-out-alt"></i>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>
  `
};

// 导出组件
window.AppHeader = Header; 