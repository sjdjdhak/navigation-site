import { createRouter, createWebHistory } from 'vue-router'
import { authService } from '../services/auth-service'

// 路由组件
import AdminLogin from '../views/AdminLogin.vue'
import AdminLayout from '../layout/AdminLayout.vue'
import AdminDashboard from '../views/AdminDashboard.vue'
import AdminSites from '../views/AdminSites.vue'
import AdminCategories from '../views/AdminCategories.vue'
import AdminTags from '../views/AdminTags.vue'
import AdminSettings from '../views/AdminSettings.vue'

const routes = [
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: AdminLogin,
    meta: { requiresAuth: false }
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard'
      },
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: AdminDashboard,
        meta: { title: '仪表盘' }
      },
      {
        path: 'sites',
        name: 'AdminSites',
        component: AdminSites,
        meta: { title: '网站管理' }
      },
      {
        path: 'categories',
        name: 'AdminCategories',
        component: AdminCategories,
        meta: { title: '分类管理' }
      },
      {
        path: 'tags',
        name: 'AdminTags',
        component: AdminTags,
        meta: { title: '标签管理' }
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: AdminSettings,
        meta: { title: '系统设置' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.meta.requiresAuth

  if (requiresAuth) {
    // 检查是否为测试模式
    const testMode = localStorage.getItem('admin_mode')
    if (testMode === 'test') {
      const user = localStorage.getItem('admin_user')
      if (user) {
        next()
        return
      }
    }

    // 检查GitHub认证
    const authState = authService.getState()
    if (authState.isAuthenticated) {
      const isValid = await authService.checkAuth()
      if (isValid) {
        next()
        return
      }
    }

    // 未认证，跳转到登录页
    next('/admin/login')
  } else {
    // 不需要认证的页面
    if (to.path === '/admin/login') {
      // 如果已经登录，跳转到后台首页
      const testMode = localStorage.getItem('admin_mode')
      if (testMode === 'test') {
        const user = localStorage.getItem('admin_user')
        if (user) {
          next('/admin/dashboard')
          return
        }
      }

      const authState = authService.getState()
      if (authState.isAuthenticated) {
        const isValid = await authService.checkAuth()
        if (isValid) {
          next('/admin/dashboard')
          return
        }
      }
    }
    
    next()
  }
})

export default router 