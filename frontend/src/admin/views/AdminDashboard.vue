<template>
  <div class="admin-dashboard">
    <div class="dashboard-header">
      <h1>仪表盘</h1>
      <p>欢迎使用导航站后台管理系统</p>
    </div>
    
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-globe"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.totalSites }}</h3>
          <p>网站总数</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-folder"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.totalCategories }}</h3>
          <p>分类总数</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-star"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.featuredSites }}</h3>
          <p>推荐网站</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-content">
          <h3>{{ stats.lastUpdate }}</h3>
          <p>最后更新</p>
        </div>
      </div>
    </div>
    
    <!-- 快速操作 -->
    <div class="quick-actions">
      <h2>快速操作</h2>
      <div class="action-grid">
        <router-link to="/admin/sites" class="action-card">
          <i class="fas fa-plus"></i>
          <h3>添加网站</h3>
          <p>添加新的网站到导航</p>
        </router-link>
        
        <router-link to="/admin/categories" class="action-card">
          <i class="fas fa-folder-plus"></i>
          <h3>管理分类</h3>
          <p>创建和编辑网站分类</p>
        </router-link>
        
        <router-link to="/admin/settings" class="action-card">
          <i class="fas fa-cog"></i>
          <h3>系统设置</h3>
          <p>配置系统参数</p>
        </router-link>
        
        <a href="/" target="_blank" class="action-card">
          <i class="fas fa-external-link-alt"></i>
          <h3>查看前台</h3>
          <p>预览导航站效果</p>
        </a>
      </div>
    </div>
    
    <!-- 最近活动 -->
    <div class="recent-activity">
      <h2>最近活动</h2>
      <div class="activity-list">
        <div v-if="activities.length === 0" class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>暂无活动记录</p>
        </div>
        
        <div 
          v-for="activity in activities" 
          :key="activity.id"
          class="activity-item"
        >
          <div class="activity-icon">
            <i :class="activity.icon"></i>
          </div>
          <div class="activity-content">
            <h4>{{ activity.title }}</h4>
            <p>{{ activity.description }}</p>
            <span class="activity-time">{{ activity.time }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { dataService } from '../services/data-service'
import { authService } from '../services/auth-service'

interface Stats {
  totalSites: number
  totalCategories: number
  featuredSites: number
  lastUpdate: string
}

interface Activity {
  id: string
  title: string
  description: string
  time: string
  icon: string
}

const stats = ref<Stats>({
  totalSites: 0,
  totalCategories: 0,
  featuredSites: 0,
  lastUpdate: '暂无'
})

const activities = ref<Activity[]>([])
const loading = ref(false)

const loadStats = async () => {
  try {
    loading.value = true
    
    // 检查认证状态
    const authState = authService.getState()
    const testMode = localStorage.getItem('admin_mode')
    
    if (testMode === 'test') {
      // 测试模式使用模拟数据
      stats.value = {
        totalSites: 156,
        totalCategories: 12,
        featuredSites: 24,
        lastUpdate: '刚刚'
      }
      return
    }
    
    if (!authState.isAuthenticated) {
      ElMessage.warning('请先登录')
      return
    }

    // 加载真实数据
    const [categoryConfig, allSites] = await Promise.all([
      dataService.getCategories(),
      dataService.getAllSites()
    ])

    // 计算统计数据
    let totalSites = 0
    let featuredSites = 0
    
    Object.values(allSites).forEach(sites => {
      totalSites += sites.length
      featuredSites += sites.filter(site => site.featured).length
    })

    // 计算分类总数（包括子分类）
    const countCategories = (categories: any[]): number => {
      let count = categories.length
      categories.forEach(category => {
        if (category.children) {
          count += countCategories(category.children)
        }
      })
      return count
    }

    const totalCategories = countCategories(categoryConfig.categories)

    // 格式化最后更新时间
    const lastUpdateTime = new Date(categoryConfig.lastUpdated)
    const now = new Date()
    const diffMs = now.getTime() - lastUpdateTime.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    let lastUpdateText = '未知'
    if (diffHours === 0) {
      lastUpdateText = diffMinutes === 0 ? '刚刚' : `${diffMinutes}分钟前`
    } else if (diffHours < 24) {
      lastUpdateText = `${diffHours}小时前`
    } else {
      const diffDays = Math.floor(diffHours / 24)
      lastUpdateText = `${diffDays}天前`
    }

    stats.value = {
      totalSites,
      totalCategories,
      featuredSites,
      lastUpdate: lastUpdateText
    }

  } catch (error) {
    console.error('加载统计数据失败:', error)
    ElMessage.error('加载统计数据失败')
    
    // 使用默认值
    stats.value = {
      totalSites: 0,
      totalCategories: 0,
      featuredSites: 0,
      lastUpdate: '加载失败'
    }
  } finally {
    loading.value = false
  }
}

const loadActivities = async () => {
  try {
    // 模拟活动记录
    activities.value = [
      {
        id: '1',
        title: '欢迎使用',
        description: '欢迎使用导航站管理系统',
        time: '刚刚',
        icon: 'fas fa-star text-warning'
      },
      {
        id: '2',
        title: '系统提示',
        description: '可以开始添加和管理您的网站收藏',
        time: '刚刚',
        icon: 'fas fa-info text-primary'
      }
    ]
  } catch (error) {
    console.error('加载活动记录失败:', error)
  }
}

onMounted(() => {
  loadStats()
  loadActivities()
})
</script>

<style lang="scss" scoped>
.admin-dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: 30px;
  
  h1 {
    margin: 0 0 8px 0;
    font-size: 28px;
    font-weight: 600;
    color: #333;
  }
  
  p {
    margin: 0;
    color: #666;
    font-size: 16px;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.stat-content {
  h3 {
    margin: 0 0 4px 0;
    font-size: 24px;
    font-weight: 600;
    color: #333;
  }
  
  p {
    margin: 0;
    color: #666;
    font-size: 14px;
  }
}

.quick-actions {
  margin-bottom: 40px;
  
  h2 {
    margin: 0 0 20px 0;
    font-size: 20px;
    font-weight: 600;
    color: #333;
  }
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.action-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  text-align: center;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
  
  i {
    font-size: 32px;
    color: #667eea;
    margin-bottom: 12px;
  }
  
  h3 {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }
  
  p {
    margin: 0;
    color: #666;
    font-size: 14px;
  }
}

.recent-activity {
  h2 {
    margin: 0 0 20px 0;
    font-size: 20px;
    font-weight: 600;
    color: #333;
  }
}

.activity-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.empty-state {
  padding: 40px;
  text-align: center;
  color: #999;
  
  i {
    font-size: 48px;
    margin-bottom: 16px;
  }
  
  p {
    margin: 0;
    font-size: 16px;
  }
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  i {
    font-size: 16px;
    
    &.text-success { color: #28a745; }
    &.text-primary { color: #007bff; }
    &.text-danger { color: #dc3545; }
  }
}

.activity-content {
  flex: 1;
  
  h4 {
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }
  
  p {
    margin: 0 0 8px 0;
    color: #666;
    font-size: 14px;
  }
  
  .activity-time {
    font-size: 12px;
    color: #999;
  }
}
</style> 