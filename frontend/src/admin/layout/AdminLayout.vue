<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <aside class="admin-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <h1 v-if="!sidebarCollapsed">后台管理</h1>
        <h1 v-else>管理</h1>
        <div v-if="!sidebarCollapsed" class="mode-indicator">
          <span :class="['mode-badge', adminMode]">
            {{ adminMode === 'test' ? '测试模式' : 'GitHub模式' }}
          </span>
        </div>
      </div>
      
      <nav class="sidebar-nav">
        <router-link 
          v-for="item in menuItems" 
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: $route.path === item.path }"
        >
          <i :class="item.icon"></i>
          <span v-if="!sidebarCollapsed">{{ item.title }}</span>
        </router-link>
      </nav>
    </aside>
    
    <!-- 主内容区 -->
    <div class="admin-main">
      <!-- 顶部导航 -->
      <header class="admin-header">
        <div class="header-left">
          <button 
            class="sidebar-toggle"
            @click="toggleSidebar"
          >
            <i class="fas fa-bars"></i>
          </button>
          
          <h2 class="page-title">{{ currentPageTitle }}</h2>
        </div>
        
        <div class="header-right">
          <div class="user-info">
            <span class="user-name">{{ currentUser }}</span>
            <span class="login-time">{{ loginTimeText }}</span>
          </div>
          
          <button class="header-btn" @click="goToFrontend">
            <i class="fas fa-external-link-alt"></i>
            <span>查看前台</span>
          </button>
          
          <button class="header-btn logout-btn" @click="handleLogout">
            <i class="fas fa-sign-out-alt"></i>
            <span>退出登录</span>
          </button>
        </div>
      </header>
      
      <!-- 页面内容 -->
      <main class="admin-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authService } from '../services/auth-service'

interface MenuItem {
  path: string
  title: string
  icon: string
}

const router = useRouter()
const route = useRoute()

const sidebarCollapsed = ref(false)
const adminMode = ref<'test' | 'github'>('github')
const currentUser = ref('')
const loginTime = ref('')
const authState = ref(authService.getState())

const menuItems: MenuItem[] = [
  { path: '/admin/dashboard', title: '仪表盘', icon: 'fas fa-tachometer-alt' },
  { path: '/admin/sites', title: '网站管理', icon: 'fas fa-globe' },
  { path: '/admin/categories', title: '分类管理', icon: 'fas fa-folder' },
  { path: '/admin/tags', title: '标签管理', icon: 'fas fa-tags' },
  { path: '/admin/settings', title: '系统设置', icon: 'fas fa-cog' }
]

const currentPageTitle = computed(() => {
  const currentItem = menuItems.find(item => item.path === route.path)
  return currentItem?.title || '后台管理'
})

const loginTimeText = computed(() => {
  if (!loginTime.value) return ''
  
  const loginDate = new Date(loginTime.value)
  const now = new Date()
  const diffMs = now.getTime() - loginDate.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  
  if (diffHours > 0) {
    return `${diffHours}小时${diffMinutes}分钟前登录`
  } else {
    return `${diffMinutes}分钟前登录`
  }
})

const emit = defineEmits<{
  logout: []
}>()

// 初始化用户信息
const initUserInfo = () => {
  const testMode = localStorage.getItem('admin_mode')
  const time = localStorage.getItem('admin_login_time')
  
  if (testMode === 'test') {
    adminMode.value = 'test'
    currentUser.value = localStorage.getItem('admin_user') || 'admin'
    loginTime.value = time || ''
  } else if (authState.value.isAuthenticated) {
    adminMode.value = 'github'
    currentUser.value = authState.value.user?.login || authState.value.config?.owner || 'GitHub用户'
    loginTime.value = time || ''
  }
}

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const goToFrontend = () => {
  window.open('/', '_blank')
}

const handleLogout = () => {
  // 清除测试模式认证信息
  localStorage.removeItem('admin_mode')
  localStorage.removeItem('admin_user')
  localStorage.removeItem('admin_login_time')
  
  // 清除GitHub认证信息
  authService.logout()
  
  emit('logout')
  router.push('/admin/login')
}

// 订阅认证状态变化
let unsubscribe: (() => void) | null = null

onMounted(() => {
  initUserInfo()
  
  // 监听认证状态变化
  unsubscribe = authService.subscribe((state) => {
    authState.value = state
    initUserInfo()
  })
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})
</script>

<style lang="scss" scoped>
.admin-layout {
  display: flex;
  height: 100vh;
  background-color: #f5f5f5;
}

.admin-sidebar {
  width: 250px;
  background: #2c3e50;
  color: white;
  transition: width 0.3s ease;
  
  &.collapsed {
    width: 70px;
  }
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #34495e;
  text-align: center;
  
  h1 {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
  }
}

.mode-indicator {
  margin-top: 8px;
}

.mode-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
  
  &.test {
    background-color: #f39c12;
    color: white;
  }
  
  &.github {
    background-color: #27ae60;
    color: white;
  }
}

.sidebar-nav {
  padding: 20px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: #bdc3c7;
  text-decoration: none;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #34495e;
    color: white;
  }
  
  &.active {
    background-color: #3498db;
    color: white;
  }
  
  i {
    width: 20px;
    margin-right: 12px;
    text-align: center;
  }
  
  .collapsed & {
    justify-content: center;
    
    span {
      display: none;
    }
    
    i {
      margin-right: 0;
    }
  }
}

.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.admin-header {
  height: 60px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.sidebar-toggle {
  background: none;
  border: none;
  font-size: 18px;
  color: #666;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: #f0f0f0;
  }
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 12px;
  
  .user-name {
    font-weight: 600;
    color: #333;
  }
  
  .login-time {
    color: #999;
    margin-top: 2px;
  }
}

.header-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  color: #666;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #f0f0f0;
    border-color: #ccc;
  }
  
  &.logout-btn {
    border-color: #e74c3c;
    color: #e74c3c;
    
    &:hover {
      background-color: #e74c3c;
      color: white;
    }
  }
}

.admin-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #f5f5f5;
}
</style> 