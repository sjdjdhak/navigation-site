/**
 * 路由配置
 * 定义后台管理系统的页面路由
 */

// 路由配置
const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: window.DashboardView,
    meta: {
      title: '仪表盘',
      icon: 'fas fa-tachometer-alt'
    }
  },
  {
    path: '/sites',
    name: 'Sites',
    redirect: '/sites/list',
    meta: {
      title: '网站管理',
      icon: 'fas fa-globe'
    },
    children: [
      {
        path: '/sites/list',
        name: 'SitesList',
        component: window.SiteManagerView,
        meta: {
          title: '网站列表',
          parent: 'Sites'
        }
      },
      {
        path: '/sites/add',
        name: 'SitesAdd',
        component: window.SiteManagerView,
        meta: {
          title: '添加网站',
          parent: 'Sites'
        }
      }
    ]
  },
  {
    path: '/categories',
    name: 'Categories',
    component: window.CategoryManagerView,
    meta: {
      title: '分类管理',
      icon: 'fas fa-folder-tree'
    }
  },
  {
    path: '/import-export',
    name: 'ImportExport',
    component: {
      template: `
        <div class="page-container">
          <div class="page-header">
            <h1 class="page-title">导入导出</h1>
            <p class="page-description">批量导入导出网站数据</p>
          </div>
          <div class="page-content">
            <div class="empty-state">
              <i class="fas fa-exchange-alt"></i>
              <div class="empty-title">功能开发中</div>
              <div class="empty-description">
                导入导出功能正在开发中，敬请期待
              </div>
            </div>
          </div>
        </div>
      `
    },
    meta: {
      title: '导入导出',
      icon: 'fas fa-exchange-alt'
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: window.SettingsView,
    meta: {
      title: '系统设置',
      icon: 'fas fa-cog'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: {
      template: `
        <div class="page-container">
          <div class="empty-state">
            <i class="fas fa-exclamation-triangle" style="font-size: 64px; color: var(--warning-color);"></i>
            <div class="empty-title" style="font-size: 24px; margin-top: 16px;">页面未找到</div>
            <div class="empty-description">
              抱歉，您访问的页面不存在
            </div>
            <el-button type="primary" @click="$router.push('/dashboard')" style="margin-top: 24px;">
              返回首页
            </el-button>
          </div>
        </div>
      `
    },
    meta: {
      title: '页面未找到'
    }
  }
];

// 创建路由实例
const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes
});

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta && to.meta.title) {
    document.title = `${to.meta.title} - 工具集导航站后台管理`;
  }
  
  // 这里可以添加权限验证逻辑
  // 检查是否已登录
  const isAuthenticated = localStorage.getItem('github_token') || sessionStorage.getItem('github_token');
  
  if (!isAuthenticated && to.path !== '/login') {
    // 如果未登录且不是登录页，重定向到登录页
    // 注意：这里暂时不做重定向，因为登录状态在主应用中管理
  }
  
  next();
});

router.afterEach((to, from) => {
  // 路由切换后的处理
  console.log(`路由切换: ${from.path} -> ${to.path}`);
});

// 导出路由实例
window.AppRouter = router; 