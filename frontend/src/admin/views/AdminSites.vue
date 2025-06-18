<template>
  <div class="admin-sites">
    <div class="page-header">
      <h1>网站管理</h1>
      <p>管理导航站中的所有网站</p>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          添加网站
        </el-button>
        <el-button 
          type="danger" 
          :disabled="selectedSites.length === 0"
          @click="handleBatchDelete"
        >
          <el-icon><Delete /></el-icon>
          批量删除 ({{ selectedSites.length }})
        </el-button>
        <el-button @click="handleRefresh" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-select
          v-model="filterCategory"
          placeholder="筛选分类"
          clearable
          style="width: 200px; margin-right: 12px"
          @change="handleCategoryFilter"
        >
          <el-option label="全部分类" value="" />
          <el-option
            v-for="category in categories"
            :key="category.id"
            :label="category.name"
            :value="category.id"
          />
        </el-select>
        <el-input
          v-model="searchQuery"
          placeholder="搜索网站..."
          style="width: 300px"
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="paginatedSites"
        @selection-change="handleSelectionChange"
        stripe
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column label="网站" min-width="300">
          <template #default="{ row }">
            <div class="site-info">
              <img
                :src="row.icon"
                :alt="row.title"
                class="site-icon"
                @error="handleIconError($event, row)"
              />
              <div class="site-details">
                <div class="site-title">
                  <a :href="row.url" target="_blank" class="site-link">
                    {{ row.title }}
                  </a>
                  <el-tag v-if="row.featured" type="warning" size="small">
                    特色
                  </el-tag>
                </div>
                <div class="site-description">{{ row.description }}</div>
                <div class="site-url">{{ row.domain }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="分类" width="200">
          <template #default="{ row }">
            <div class="category-path">
              <el-tag
                v-for="(path, index) in getCategoryNames(row.categoryPath)"
                :key="index"
                size="small"
                :type="index === 0 ? 'primary' : 'info'"
              >
                {{ path }}
              </el-tag>
            </div>
          </template>
        </el-table-column>



        <el-table-column label="更新时间" width="150">
          <template #default="{ row }">
            {{ formatDate(row.updatedAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              size="small"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalSites"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      :close-on-click-modal="false"
    >
      <SiteForm
        :site="currentSite"
        @submit="handleFormSubmit"
        @cancel="handleFormCancel"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Refresh, Search } from '@element-plus/icons-vue'
import { dataService, type Site, type Category } from '@/admin/services/data-service'
import { unifiedAuthService } from '@/admin/services/unified-auth-service'
import SiteForm from '@/admin/components/SiteForm.vue'

// 响应式数据
const loading = ref(false)
const sites = ref<Site[]>([])
const categories = ref<Category[]>([])
const selectedSites = ref<Site[]>([])
const searchQuery = ref('')
const filterCategory = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

// 对话框状态
const dialogVisible = ref(false)
const currentSite = ref<Site | null>(null)

const dialogTitle = computed(() => {
  return currentSite.value ? '编辑网站' : '添加网站'
})

// 过滤后的网站列表
const filteredSites = computed(() => {
  let result = sites.value

  // 分类筛选
  if (filterCategory.value) {
    result = result.filter(site => 
      site.categoryPath.includes(filterCategory.value)
    )
  }

  // 搜索筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(site => {
      const searchText = `${site.title} ${site.description}`.toLowerCase()
      return searchText.includes(query)
    })
  }

  return result
})

// 总数
const totalSites = computed(() => filteredSites.value.length)

// 分页后的数据
const paginatedSites = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredSites.value.slice(start, end)
})

// 加载所有数据
const loadData = async () => {
  loading.value = true
  try {
    // 检查认证状态
    const authState = unifiedAuthService.getState()
    if (!authState.isAuthenticated) {
      ElMessage.error('请先登录')
      return
    }

    // 并行加载分类和网站数据
    const [categoryConfig, allSites] = await Promise.all([
      dataService.getCategories(),
      dataService.getAllSites()
    ])

    categories.value = categoryConfig.categories
    
    // 合并所有分类的网站数据
    const allSitesList: Site[] = []
    Object.values(allSites).forEach(categorySites => {
      allSitesList.push(...categorySites)
    })
    
    // 按更新时间排序
    sites.value = allSitesList.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )

  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败: ' + (error as Error).message)
  } finally {
    loading.value = false
  }
}

// 获取分类名称路径
const getCategoryNames = (categoryPath: string[]): string[] => {
  const names: string[] = []
  
  const findCategoryName = (categories: Category[], id: string): string => {
    for (const category of categories) {
      if (category.id === id) {
        return category.name
      }
      if (category.children) {
        const childName = findCategoryName(category.children, id)
        if (childName) return childName
      }
    }
    return id
  }

  categoryPath.forEach(id => {
    names.push(findCategoryName(categories.value, id))
  })

  return names
}

// 格式化日期
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 处理图标加载错误  
const handleIconError = async (event: Event, site: Site) => {
  const img = event.target as HTMLImageElement
  try {
    // 使用新的多源favicon获取方法
    const { getFaviconUrl } = await import('@/utils/favicon-helper')
    img.src = await getFaviconUrl(site.domain, 32)
  } catch (error) {
    console.error('获取备用图标失败:', error)
    // 最终兜底：使用默认图标
    img.src = '/assets/default-favicon.svg'
  }
}

// 处理选择变化
const handleSelectionChange = (selection: Site[]) => {
  selectedSites.value = selection
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1
}

// 处理分类筛选
const handleCategoryFilter = () => {
  currentPage.value = 1
}

// 处理分页大小变化
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

// 处理页码变化
const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

// 刷新数据
const handleRefresh = () => {
  dataService.clearAllCache()
  loadData()
}

// 添加网站
const handleAdd = () => {
  currentSite.value = null
  dialogVisible.value = true
}

// 编辑网站
const handleEdit = (site: Site) => {
  currentSite.value = { ...site }
  dialogVisible.value = true
}

// 删除网站
const handleDelete = async (site: Site) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除网站 "${site.title}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    loading.value = true
    await dataService.deleteSite(site.id)
    
    ElMessage.success('删除成功')
    await loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败: ' + (error as Error).message)
    }
  } finally {
    loading.value = false
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedSites.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedSites.value.length} 个网站吗？`,
      '确认批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    loading.value = true
    const siteIds = selectedSites.value.map(site => site.id)
    await dataService.deleteSites(siteIds)
    
    ElMessage.success(`成功删除 ${siteIds.length} 个网站`)
    selectedSites.value = []
    await loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败: ' + (error as Error).message)
    }
  } finally {
    loading.value = false
  }
}

// 处理表单提交
const handleFormSubmit = async (siteData: Partial<Site>) => {
  try {
    loading.value = true
    
    if (currentSite.value) {
      // 更新网站
      await dataService.updateSite(currentSite.value.id, siteData)
      ElMessage.success('更新成功')
    } else {
      // 添加网站
      await dataService.addSite(siteData as Omit<Site, 'id' | 'createdAt' | 'updatedAt'>)
      ElMessage.success('添加成功')
    }
    
    dialogVisible.value = false
    await loadData()
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败: ' + (error as Error).message)
  } finally {
    loading.value = false
  }
}

// 处理表单取消
const handleFormCancel = () => {
  dialogVisible.value = false
  currentSite.value = null
}

// 组件挂载时加载数据
onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.admin-sites {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
  
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

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  .toolbar-left {
    display: flex;
    gap: 12px;
  }

  .toolbar-right {
    display: flex;
    align-items: center;
  }
}

.table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.site-info {
  display: flex;
  align-items: center;
  gap: 12px;

  .site-icon {
    width: 32px;
    height: 32px;
    border-radius: 4px;
    border: 1px solid #e0e0e0;
    flex-shrink: 0;
  }

  .site-details {
    flex: 1;
    min-width: 0;

    .site-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;

      .site-link {
        color: #409eff;
        text-decoration: none;
        font-weight: 500;
        
        &:hover {
          text-decoration: underline;
        }
      }
    }

    .site-description {
      font-size: 12px;
      color: #666;
      margin-bottom: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .site-url {
      font-size: 11px;
      color: #999;
    }
  }
}

.category-path {
  display: flex;
  flex-direction: column;
  gap: 4px;
}



.pagination {
  padding: 20px;
  display: flex;
  justify-content: center;
}

:deep(.el-table) {
  .el-table__row {
    &:hover {
      background-color: #f5f7fa;
    }
  }
}

:deep(.el-dialog) {
  .el-dialog__body {
    padding: 20px;
  }
}
</style> 