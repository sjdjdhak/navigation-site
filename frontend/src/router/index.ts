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
  // 后台管理路由
  {
    path: '/admin',
    redirect: '/admin/dashboard'
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('@/admin/views/AdminLogin.vue'),
    meta: {
      title: '后台管理 - 登录',
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
        path: 'tags',
        name: 'AdminTags',
        component: () => import('@/admin/views/AdminTags.vue'),
        meta: {
          title: '后台管理 - 标签管理'
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
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 检查认证状态
const checkAuth = (): boolean => {
  // 检查测试模式认证
  const adminMode = localStorage.getItem('admin_mode') || sessionStorage.getItem('admin_mode')
  
  if (adminMode === 'test') {
    const adminUser = localStorage.getItem('admin_user') || sessionStorage.getItem('admin_user')
    const loginTime = localStorage.getItem('admin_login_time') || sessionStorage.getItem('admin_login_time')
    
    // 检查测试模式登录是否有效（24小时内有效）
    if (adminUser && loginTime) {
      const loginDate = new Date(loginTime)
      const now = new Date()
      const hoursDiff = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60)
      
      if (hoursDiff < 24) {
        return true
      } else {
        // 登录已过期，清除认证信息
        localStorage.removeItem('admin_mode')
        localStorage.removeItem('admin_user')
        localStorage.removeItem('admin_login_time')
        sessionStorage.removeItem('admin_mode')
        sessionStorage.removeItem('admin_user')
        sessionStorage.removeItem('admin_login_time')
      }
    }
  }
  
  // 检查GitHub模式认证
  if (adminMode === 'github') {
    const token = localStorage.getItem('github_token') || sessionStorage.getItem('github_token')
    const repository = localStorage.getItem('github_repository') || sessionStorage.getItem('github_repository')
    return !!(token && repository)
  }
  
  return false
}

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta?.title) {
    document.title = to.meta.title as string
  }
  
  // 检查是否需要认证
  if (to.meta?.requiresAuth) {
    if (!checkAuth()) {
      next('/admin/login')
      return
    }
  }
  
  // 检查是否需要游客状态（已登录用户不能访问登录页）
  if (to.meta?.requiresGuest) {
    if (checkAuth()) {
      next('/admin/dashboard')
      return
    }
  }
  
  next()
})

export default router 