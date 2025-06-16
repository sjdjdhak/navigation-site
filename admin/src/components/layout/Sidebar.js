/**
 * 侧边栏菜单组件
 * 包含导航菜单和功能入口
 */

// Sidebar 侧边栏组件
const Sidebar = {
  name: 'AppSidebar',
  props: {
    collapsed: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const { ref, computed, onMounted } = Vue;
    const router = VueRouter.useRouter();
    const route = VueRouter.useRoute();
    
    // 响应式数据
    const activeMenu = ref('dashboard');
    
    // 菜单数据
    const menuItems = ref([
      {
        index: 'dashboard',
        title: '仪表盘',
        icon: 'fas fa-tachometer-alt',
        path: '/dashboard'
      },
      {
        index: 'sites',
        title: '网站管理',
        icon: 'fas fa-globe',
        path: '/sites',
        children: [
          {
            index: 'sites-list',
            title: '网站列表',
            path: '/sites/list'
          },
          {
            index: 'sites-add',
            title: '添加网站',
            path: '/sites/add'
          }
        ]
      },
      {
        index: 'categories',
        title: '分类管理',
        icon: 'fas fa-folder-tree',
        path: '/categories'
      },
      {
        index: 'import-export',
        title: '导入导出',
        icon: 'fas fa-exchange-alt',
        path: '/import-export'
      },
      {
        index: 'settings',
        title: '系统设置',
        icon: 'fas fa-cog',
        path: '/settings'
      }
    ]);
    
    // 计算属性
    const sidebarClass = computed(() => {
      return {
        'app-sidebar': true,
        'collapsed': props.collapsed
      };
    });
    
    const menuClass = computed(() => {
      return {
        'sidebar-menu': true,
        'collapsed': props.collapsed
      };
    });
    
    // 方法
    const handleMenuSelect = (index, indexPath) => {
      const menuItem = findMenuItem(index);
      if (menuItem && menuItem.path) {
        router.push(menuItem.path);
      }
    };
    
    const findMenuItem = (index) => {
      for (const item of menuItems.value) {
        if (item.index === index) {
          return item;
        }
        if (item.children) {
          for (const child of item.children) {
            if (child.index === index) {
              return child;
            }
          }
        }
      }
      return null;
    };
    
    // 根据当前路由设置活动菜单
    const setActiveMenuByRoute = () => {
      const currentPath = route.path;
      for (const item of menuItems.value) {
        if (item.path === currentPath) {
          activeMenu.value = item.index;
          return;
        }
        if (item.children) {
          for (const child of item.children) {
            if (child.path === currentPath) {
              activeMenu.value = child.index;
              return;
            }
          }
        }
      }
    };
    
    // 生命周期
    onMounted(() => {
      setActiveMenuByRoute();
    });
    
    return {
      activeMenu,
      menuItems,
      sidebarClass,
      menuClass,
      handleMenuSelect
    };
  },
  template: `
    <aside :class="sidebarClass">
      <el-menu
        :class="menuClass"
        :default-active="activeMenu"
        :collapse="collapsed"
        :unique-opened="true"
        @select="handleMenuSelect"
      >
        <template v-for="item in menuItems" :key="item.index">
          <!-- 有子菜单的项 -->
          <el-sub-menu 
            v-if="item.children && item.children.length > 0"
            :index="item.index"
          >
            <template #title>
              <i :class="item.icon"></i>
              <span>{{ item.title }}</span>
            </template>
            <el-menu-item
              v-for="child in item.children"
              :key="child.index"
              :index="child.index"
            >
              <span>{{ child.title }}</span>
            </el-menu-item>
          </el-sub-menu>
          
          <!-- 普通菜单项 -->
          <el-menu-item 
            v-else
            :index="item.index"
          >
            <i :class="item.icon"></i>
            <span>{{ item.title }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </aside>
  `
};

// 导出组件
window.AppSidebar = Sidebar; 