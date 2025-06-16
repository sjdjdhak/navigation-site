<template>
  <div class="admin-tags">
    <div class="page-header">
      <h1>标签管理</h1>
      <p>管理导航站中的所有标签</p>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          添加标签
        </el-button>
        <el-button 
          type="danger" 
          :disabled="selectedTags.length === 0"
          @click="handleBatchDelete"
        >
          <el-icon><Delete /></el-icon>
          批量删除 ({{ selectedTags.length }})
        </el-button>
        <el-button @click="handleRefresh" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-input
          v-model="searchQuery"
          placeholder="搜索标签..."
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
        :data="paginatedTags"
        @selection-change="handleSelectionChange"
        stripe
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column label="标签名称" min-width="200">
          <template #default="{ row }">
            <div class="tag-info">
              <el-tag size="large" type="info">{{ row.name }}</el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="使用次数" width="120">
          <template #default="{ row }">
            <el-badge :value="row.usageCount" :max="999" type="primary">
              <span>{{ row.usageCount || 0 }} 次</span>
            </el-badge>
          </template>
        </el-table-column>

        <el-table-column label="颜色" width="100">
          <template #default="{ row }">
            <div class="color-preview">
              <div 
                class="color-block"
                :style="{ backgroundColor: row.color || '#409eff' }"
              ></div>
              <span>{{ row.color || '#409eff' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" width="150">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
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
              :disabled="row.usageCount > 0"
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
          :total="totalTags"
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
      width="500px"
      :close-on-click-modal="false"
    >
      <TagForm
        :tag="currentTag"
        @submit="handleFormSubmit"
        @cancel="handleFormCancel"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Refresh, Search } from '@element-plus/icons-vue'
import { tagService, type Tag } from '../services/tag-service'
import TagForm from '../components/TagForm.vue'

// 响应式数据
const loading = ref(false)
const tags = ref<Tag[]>([])
const selectedTags = ref<Tag[]>([])
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

// 对话框状态
const dialogVisible = ref(false)
const currentTag = ref<Tag | null>(null)

const dialogTitle = computed(() => {
  return currentTag.value ? '编辑标签' : '添加标签'
})

// 筛选标签
const filteredTags = computed(() => {
  if (!searchQuery.value.trim()) {
    return tags.value
  }
  
  const query = searchQuery.value.toLowerCase()
  return tags.value.filter(tag => 
    tag.name.toLowerCase().includes(query)
  )
})

// 分页标签
const totalTags = computed(() => filteredTags.value.length)

const paginatedTags = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredTags.value.slice(start, end)
})

// 加载标签数据
const loadData = async () => {
  loading.value = true
  try {
    tags.value = await tagService.getAllTags()
  } catch (error) {
    console.error('加载标签失败:', error)
    ElMessage.error('加载标签失败: ' + (error as Error).message)
  } finally {
    loading.value = false
  }
}

// 格式化日期
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 处理选择变化
const handleSelectionChange = (selection: Tag[]) => {
  selectedTags.value = selection
}

// 处理搜索
const handleSearch = () => {
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
  loadData()
}

// 添加标签
const handleAdd = () => {
  currentTag.value = null
  dialogVisible.value = true
}

// 编辑标签
const handleEdit = (tag: Tag) => {
  currentTag.value = { ...tag }
  dialogVisible.value = true
}

// 删除标签
const handleDelete = async (tag: Tag) => {
  if (tag.usageCount > 0) {
    ElMessage.warning('该标签正在被使用，无法删除')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除标签 "${tag.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    loading.value = true
    await tagService.deleteTag(tag.id)
    
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
  if (selectedTags.value.length === 0) return

  const inUseTags = selectedTags.value.filter(tag => tag.usageCount > 0)
  if (inUseTags.length > 0) {
    ElMessage.warning(`有 ${inUseTags.length} 个标签正在被使用，无法删除`)
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedTags.value.length} 个标签吗？`,
      '确认批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    loading.value = true
    const tagIds = selectedTags.value.map(tag => tag.id)
    await tagService.deleteTags(tagIds)
    
    ElMessage.success(`成功删除 ${tagIds.length} 个标签`)
    selectedTags.value = []
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
const handleFormSubmit = async (tagData: Partial<Tag>) => {
  try {
    loading.value = true
    
    if (currentTag.value) {
      // 更新标签
      await tagService.updateTag(currentTag.value.id, tagData)
      ElMessage.success('更新成功')
    } else {
      // 添加标签
      await tagService.addTag(tagData as Omit<Tag, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>)
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
  currentTag.value = null
}

// 组件挂载时加载数据
onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.admin-tags {
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

.tag-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .color-block {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    border: 1px solid #e0e0e0;
  }
  
  span {
    font-size: 12px;
    color: #666;
  }
}

.pagination {
  padding: 20px;
  display: flex;
  justify-content: center;
}
</style> 