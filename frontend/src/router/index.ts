import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomePage.vue'),
    meta: {
      title: '导航站 - 发现优质资源'
    }
  },
  {
    path: '/category/:id',
    name: 'Category',
    component: () => import('@/views/CategoryPage.vue'),
    props: true,
    meta: {
      title: '分类浏览'
    }
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/views/SearchPage.vue'),
    meta: {
      title: '搜索结果'
    }
  },
  {
    path: '/demo/lazy-load',
    name: 'LazyLoadDemo',
    component: () => import('@/views/LazyLoadDemo.vue'),
    meta: {
      title: '懒加载技术演示'
    }
  },
  // 后台管理路由
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('@/admin/views/AdminLogin.vue'),
    meta: {
      title: '后台管理 - 登录',
      requiresAuth: false,
      requiresGuest: true
    }
  },
  {
    path: '/admin',
    component: () => import('@/admin/layout/AdminLayout.vue'),
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard'
      },
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/admin/views/AdminDashboard.vue'),
        meta: {
          title: '后台管理 - 仪表盘'
        }
      },
      {
        path: 'sites',
        name: 'AdminSites',
        component: () => import('@/admin/views/AdminSites.vue'),
        meta: {
          title: '后台管理 - 网站管理'
        }
      },
      {
        path: 'categories',
        name: 'AdminCategories',
        component: () => import('@/admin/views/AdminCategories.vue'),
        meta: {
          title: '后台管理 - 分类管理'
        }
      },
      {
        path: 'favicon-monitor',
        name: 'AdminFaviconMonitor',
        component: () => import('@/admin/views/AdminFaviconMonitor.vue'),
        meta: {
          title: '后台管理 - Favicon监控'
        }
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: () => import('@/admin/views/AdminSettings.vue'),
        meta: {
          title: '后台管理 - 系统设置'
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundPage.vue'),
    meta: {
      title: '页面未找到'
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 动态导入认证服务（避免循环依赖）
let authService: any = null
const getAuthService = async () => {
  if (!authService) {
    const module = await import('@/admin/services/auth-service')
    authService = module.authService
  }
  return authService
}

// 检查认证状态
const checkAuth = async (): Promise<boolean> => {
  // 只检查GitHub模式认证（已移除测试模式）
  const adminMode = localStorage.getItem('admin_mode')
  
  if (adminMode === 'github') {
    try {
      const authSvc = await getAuthService()
      const authState = authSvc.getState()
      
      if (authState.isAuthenticated) {
        const isValid = await authSvc.checkAuth()
        return isValid
      }
    } catch (error) {
      console.error('检查GitHub认证状态失败:', error)
    }
  }
  
  return false
}

// 路由守卫
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  if (to.meta?.title) {
    document.title = to.meta.title as string
  }
  
  // 检查是否需要认证
  if (to.meta?.requiresAuth) {
    const isAuthenticated = await checkAuth()
    
    if (!isAuthenticated) {
      next('/admin/login')
      return
    }
  }
  
  // 检查是否需要游客状态（已登录用户不能访问登录页）
  if (to.meta?.requiresGuest) {
    const isAuthenticated = await checkAuth()
    
    if (isAuthenticated) {
      next('/admin/dashboard')
      return
    }
  }
  
  next()
})

export default router 