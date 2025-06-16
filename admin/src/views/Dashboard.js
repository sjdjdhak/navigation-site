/**
 * 仪表盘页面
 * 显示数据统计和快捷操作
 */

// Dashboard 仪表盘页面组件
const Dashboard = {
  name: 'DashboardView',
  setup() {
    const { ref, reactive, onMounted } = Vue;
    
    // 响应式数据
    const loading = ref(true);
    const stats = reactive({
      totalSites: 0,
      totalCategories: 0,
      totalTags: 0,
      lastUpdate: ''
    });
    
    const recentActivities = ref([]);
    const chartData = ref({});
    
    // 方法
    const loadDashboardData = async () => {
      try {
        loading.value = true;
        
        // 模拟加载数据
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 模拟统计数据
        stats.totalSites = 156;
        stats.totalCategories = 12;
        stats.totalTags = 45;
        stats.lastUpdate = new Date().toLocaleString();
        
        // 模拟最近活动
        recentActivities.value = [
          {
            id: 1,
            type: 'add',
            title: '添加了新网站: Figma',
            category: '设计工具',
            time: '2小时前',
            icon: 'fas fa-plus',
            color: 'success'
          },
          {
            id: 2,
            type: 'edit',
            title: '更新了网站: GitHub',
            category: '开发工具',
            time: '4小时前',
            icon: 'fas fa-edit',
            color: 'primary'
          },
          {
            id: 3,
            type: 'delete',
            title: '删除了网站: 旧工具',
            category: '其他',
            time: '1天前',
            icon: 'fas fa-trash',
            color: 'danger'
          },
          {
            id: 4,
            type: 'category',
            title: '创建了新分类: AI工具',
            category: '分类管理',
            time: '2天前',
            icon: 'fas fa-folder-plus',
            color: 'warning'
          },
          {
            id: 5,
            type: 'import',
            title: '批量导入了20个网站',
            category: '数据管理',
            time: '3天前',
            icon: 'fas fa-upload',
            color: 'info'
          }
        ];
        
      } catch (error) {
        console.error('加载仪表盘数据失败:', error);
        ElMessage.error('加载数据失败');
      } finally {
        loading.value = false;
      }
    };
    
    const getActivityIcon = (activity) => {
      return activity.icon;
    };
    
    const getActivityTypeText = (type) => {
      const typeMap = {
        add: '新增',
        edit: '编辑',
        delete: '删除',
        category: '分类',
        import: '导入'
      };
      return typeMap[type] || '操作';
    };
    
    const refreshData = () => {
      loadDashboardData();
    };
    
    // 生命周期
    onMounted(() => {
      loadDashboardData();
    });
    
    return {
      loading,
      stats,
      recentActivities,
      chartData,
      getActivityIcon,
      getActivityTypeText,
      refreshData
    };
  },
  template: `
    <div class="dashboard-view">
      <!-- 页面头部 -->
      <div class="page-header">
        <h1 class="page-title">仪表盘</h1>
        <p class="page-description">欢迎使用工具集导航站后台管理系统</p>
      </div>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="8" animated />
      </div>
      
      <!-- 主要内容 -->
      <div v-else>
        <!-- 统计卡片 -->
        <div class="stats-grid">
          <div class="stats-card">
            <div class="stats-icon" style="background-color: #e3f2fd; color: #1976d2;">
              <i class="fas fa-globe"></i>
            </div>
            <div class="stats-value">{{ stats.totalSites }}</div>
            <div class="stats-label">网站总数</div>
          </div>
          
          <div class="stats-card">
            <div class="stats-icon" style="background-color: #f3e5f5; color: #7b1fa2;">
              <i class="fas fa-folder"></i>
            </div>
            <div class="stats-value">{{ stats.totalCategories }}</div>
            <div class="stats-label">分类数量</div>
          </div>
          
          <div class="stats-card">
            <div class="stats-icon" style="background-color: #e8f5e8; color: #388e3c;">
              <i class="fas fa-tags"></i>
            </div>
            <div class="stats-value">{{ stats.totalTags }}</div>
            <div class="stats-label">标签数量</div>
          </div>
          
          <div class="stats-card">
            <div class="stats-icon" style="background-color: #fff3e0; color: #f57c00;">
              <i class="fas fa-clock"></i>
            </div>
            <div class="stats-value">{{ stats.lastUpdate }}</div>
            <div class="stats-label">最后更新</div>
          </div>
        </div>
        
        <!-- 图表和最近活动 -->
        <div class="dashboard-charts">
          <!-- 图表区域 -->
          <div class="chart-container">
            <div class="page-container">
              <div class="page-header">
                <h3 class="page-title">数据趋势</h3>
                <el-button type="text" @click="refreshData">
                  <i class="fas fa-refresh"></i>
                  刷新
                </el-button>
              </div>
              <div class="page-content">
                <div class="empty-state">
                  <i class="fas fa-chart-line"></i>
                  <div class="empty-title">图表功能开发中</div>
                  <div class="empty-description">
                    这里将显示网站添加趋势、分类分布等统计图表
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 最近活动 -->
          <div class="dashboard-recent">
            <div class="recent-header">
              <h3 class="recent-title">最近活动</h3>
              <el-button type="text" size="small">
                查看全部
              </el-button>
            </div>
            <ul class="recent-list">
              <li 
                v-for="activity in recentActivities" 
                :key="activity.id"
                class="recent-item"
              >
                <div class="item-info">
                  <div class="item-title">
                    <el-tag 
                      :type="activity.color" 
                      size="small"
                      style="margin-right: 8px;"
                    >
                      <i :class="getActivityIcon(activity)"></i>
                      {{ getActivityTypeText(activity.type) }}
                    </el-tag>
                    {{ activity.title }}
                  </div>
                  <div class="item-meta">
                    分类: {{ activity.category }}
                  </div>
                </div>
                <div class="item-time">
                  {{ activity.time }}
                </div>
              </li>
            </ul>
          </div>
        </div>
        
        <!-- 快捷操作 -->
        <div class="page-container">
          <div class="page-header">
            <h3 class="page-title">快捷操作</h3>
            <p class="page-description">常用功能快速入口</p>
          </div>
          <div class="page-content">
            <div class="toolbar">
              <div class="toolbar-left">
                <el-button type="primary" icon="fas fa-plus">
                  添加网站
                </el-button>
                <el-button type="success" icon="fas fa-folder-plus">
                  创建分类
                </el-button>
                <el-button type="info" icon="fas fa-upload">
                  批量导入
                </el-button>
              </div>
              <div class="toolbar-right">
                <el-button type="warning" icon="fas fa-download">
                  导出数据
                </el-button>
                <el-button type="default" icon="fas fa-cog">
                  系统设置
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};

// 导出组件
window.DashboardView = Dashboard; 