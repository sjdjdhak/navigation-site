<template>
  <div class="admin-categories">
    <div class="page-header">
      <div class="header-content">
        <h1>分类管理</h1>
        <p>管理导航站的分类结构</p>
        <el-alert
          v-if="isTestMode"
          title="测试模式"
          type="info"
          :closable="false"
          show-icon
          style="margin-top: 12px;"
        >
          当前为测试模式，所有修改仅保存在本地缓存中，不会真实保存到GitHub
        </el-alert>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog" :icon="Plus">
          添加分类
        </el-button>
        <el-button @click="loadCategories" :loading="loading" :icon="Refresh">
          刷新
        </el-button>
      </div>
    </div>

    <div class="content-container">
      <!-- 分类列表 -->
      <div class="category-list" v-loading="loading">
        <div class="list-header">
          <span>分类名称</span>
          <span>描述</span>
          <span>排序</span>
          <span>子分类数</span>
          <span>操作</span>
        </div>
        
        <div 
          v-for="category in categories" 
          :key="category.id"
          class="category-item"
          :class="{ expanded: category.expanded }"
        >
          <!-- 一级分类 -->
          <div class="category-row level-1">
            <div class="category-info">
              <el-button 
                v-if="category.children && category.children.length > 0"
                link 
                @click="toggleExpand(category)"
                class="expand-btn"
              >
                <el-icon>
                  <ArrowRight v-if="!category.expanded" />
                  <ArrowDown v-else />
                </el-icon>
              </el-button>
              <el-icon v-if="category.icon" class="category-icon">
                <component :is="category.icon" />
              </el-icon>
              <el-icon v-else class="category-icon">
                <Folder />
              </el-icon>
              <span class="category-name">{{ category.name }}</span>
            </div>
            
            <div class="category-desc">
              {{ category.description || '-' }}
            </div>
            
            <div class="category-order">
              <el-input-number 
                v-model="category.order" 
                :min="0" 
                size="small"
                @change="updateCategoryOrder(category)"
              />
            </div>
            
            <div class="category-count">
              {{ category.children?.length || 0 }}
            </div>
            
            <div class="category-actions">
              <el-button 
                link 
                @click="showAddDialog(category)" 
                :icon="Plus"
                title="添加子分类"
              >
                添加子分类
              </el-button>
              <el-button 
                link 
                @click="showEditDialog(category)" 
                :icon="Edit"
                title="编辑"
              >
                编辑
              </el-button>
              <el-button 
                link 
                type="danger" 
                @click="deleteCategory(category)" 
                :icon="Delete"
                title="删除"
              >
                删除
              </el-button>
            </div>
          </div>

          <!-- 二级分类 -->
          <div v-if="category.expanded && category.children" class="children-container">
            <div 
              v-for="child in category.children" 
              :key="child.id"
              class="category-row level-2"
            >
              <div class="category-info">
                <div class="indent"></div>
                <el-icon v-if="child.icon" class="category-icon">
                  <component :is="child.icon" />
                </el-icon>
                <el-icon v-else class="category-icon">
                  <Document />
                </el-icon>
                <span class="category-name">{{ child.name }}</span>
              </div>
              
              <div class="category-desc">
                {{ child.description || '-' }}
              </div>
              
              <div class="category-order">
                <el-input-number 
                  v-model="child.order" 
                  :min="0" 
                  size="small"
                  @change="updateCategoryOrder(child, category)"
                />
              </div>
              
              <div class="category-count">
                {{ child.children?.length || 0 }}
              </div>
              
              <div class="category-actions">
                <el-button 
                  link 
                  @click="showEditDialog(child, category)" 
                  :icon="Edit"
                  title="编辑"
                >
                  编辑
                </el-button>
                <el-button 
                  link 
                  type="danger" 
                  @click="deleteCategory(child, category)" 
                  :icon="Delete"
                  title="删除"
                >
                  删除
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="categories.length === 0 && !loading" class="empty-state">
          <el-icon class="empty-icon">
            <Folder />
          </el-icon>
          <p>暂无分类数据</p>
          <el-button type="primary" @click="showAddDialog" :icon="Plus">
            添加第一个分类
          </el-button>
        </div>
      </div>
    </div>

    <!-- 添加/编辑分类对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑分类' : '添加分类'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input 
            v-model="formData.name" 
            placeholder="请输入分类名称"
          />
        </el-form-item>
        
        <el-form-item label="分类图标" prop="icon">
          <div class="icon-selector">
            <div class="selected-icon">
              <el-icon v-if="formData.icon" class="icon-preview">
                <component :is="formData.icon" />
              </el-icon>
              <el-icon v-else class="icon-preview">
                <Folder />
              </el-icon>
              <span>{{ formData.icon || '默认图标' }}</span>
            </div>
            <el-select 
              v-model="formData.icon" 
              placeholder="选择图标"
              clearable
              style="width: 200px"
            >
              <el-option
                v-for="icon in iconOptions"
                :key="icon.value"
                :label="icon.label"
                :value="icon.value"
              >
                <div class="icon-option">
                  <el-icon>
                    <component :is="icon.value" />
                  </el-icon>
                  <span>{{ icon.label }}</span>
                </div>
              </el-option>
            </el-select>
          </div>
        </el-form-item>
        
        <el-form-item label="描述" prop="description">
          <el-input 
            v-model="formData.description" 
            type="textarea"
            :rows="3"
            placeholder="请输入分类描述（可选）"
          />
        </el-form-item>
        
        <el-form-item label="排序" prop="order">
          <el-input-number 
            v-model="formData.order" 
            :min="0" 
            placeholder="数字越小排序越靠前"
          />
        </el-form-item>
        
        <el-form-item v-if="parentCategory" label="父分类">
          <el-input :value="parentCategory.name" disabled />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleSubmit"
          :loading="submitting"
        >
          {{ isEdit ? '更新' : '添加' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { 
  Plus, 
  Edit, 
  Delete, 
  Refresh, 
  ArrowRight, 
  ArrowDown, 
  Folder, 
  Document,
  Setting,
  Menu,
  Star,
  Trophy,
  Present,
  Compass,
  Promotion,
  Bell,
  Camera,
  Mic,
  VideoPlay,
  ShoppingCart,
  Coffee,
  Reading,
  Cpu,
  Monitor,
  Finished,
  DataLine,
  EditPen,
  Wallet,
  Grid,
  Sunny,
  PictureFilled,
  VideoPause
} from '@element-plus/icons-vue'
import { dataService, type Category, type CategoryConfig } from '../services/data-service'
import { mapFaIconToElement } from '../utils/icon-mapping'
import { getIconOptions } from '../utils/icon-config'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const formRef = ref<FormInstance>()
const categories = ref<Category[]>([])
const categoryConfig = ref<CategoryConfig | null>(null)

// 表单数据
const formData = reactive({
  id: '',
  name: '',
  icon: '',
  description: '',
  order: 0
})

// 编辑状态
const isEdit = ref(false)
const editingCategory = ref<Category | null>(null)
const parentCategory = ref<Category | null>(null)

// 检查是否为测试模式
const isTestMode = computed(() => {
  return localStorage.getItem('admin_mode') === 'test'
})

// 表单验证规则
const rules: FormRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 20, message: '分类名称长度在 1 到 20 个字符', trigger: 'blur' }
  ]
}

// 图标选项
const iconOptions = getIconOptions()

// 初始化
onMounted(() => {
  loadCategories()
})

// 加载分类数据
async function loadCategories() {
  loading.value = true
  try {
    categoryConfig.value = await dataService.getCategories()
    categories.value = categoryConfig.value.categories.map(cat => ({
      ...cat,
      icon: mapFaIconToElement(cat.icon),
      expanded: false,
      children: cat.children?.map(child => ({
        ...child,
        icon: mapFaIconToElement(child.icon),
        children: child.children?.map(grandChild => ({
          ...grandChild,
          icon: mapFaIconToElement(grandChild.icon)
        }))
      }))
    }))
  } catch (error) {
    console.error('加载分类数据失败:', error)
    ElMessage.error('加载分类数据失败')
  } finally {
    loading.value = false
  }
}

// 切换展开状态
function toggleExpand(category: Category) {
  category.expanded = !category.expanded
}

// 显示添加对话框
function showAddDialog(parent?: Category) {
  resetForm()
  isEdit.value = false
  parentCategory.value = parent || null
  
  // 如果是添加子分类，设置默认排序
  if (parent && parent.children) {
    formData.order = parent.children.length
  } else {
    formData.order = categories.value.length
  }
  
  dialogVisible.value = true
}

// 显示编辑对话框
function showEditDialog(category: Category, parent?: Category) {
  resetForm()
  isEdit.value = true
  editingCategory.value = category
  parentCategory.value = parent || null
  
  // 填充表单数据
  Object.assign(formData, {
    id: category.id,
    name: category.name,
    icon: category.icon || '',
    description: category.description || '',
    order: category.order
  })
  
  dialogVisible.value = true
}

// 重置表单
function resetForm() {
  Object.assign(formData, {
    id: '',
    name: '',
    icon: '',
    description: '',
    order: 0
  })
  formRef.value?.clearValidate()
}

// 提交表单
async function handleSubmit() {
  const form = formRef.value
  if (!form) return
  
  try {
    await form.validate()
    submitting.value = true
    
    if (isEdit.value) {
      await updateCategory()
    } else {
      await addCategory()
    }
    
    dialogVisible.value = false
    await loadCategories()
    ElMessage.success(isEdit.value ? '更新分类成功' : '添加分类成功')
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败，请重试')
  } finally {
    submitting.value = false
  }
}

// 添加分类
async function addCategory() {
  if (!categoryConfig.value) return
  
  const newCategory: Category = {
    id: generateCategoryId(formData.name),
    name: formData.name,
    icon: formData.icon || undefined,
    description: formData.description || undefined,
    order: formData.order,
    children: []
  }
  
  if (parentCategory.value) {
    // 添加子分类
    const parent = findCategoryById(parentCategory.value.id)
    if (parent) {
      if (!parent.children) parent.children = []
      parent.children.push(newCategory)
      parent.children.sort((a, b) => a.order - b.order)
    }
  } else {
    // 添加顶级分类
    categoryConfig.value.categories.push(newCategory)
    categoryConfig.value.categories.sort((a, b) => a.order - b.order)
  }
  
  await dataService.updateCategories(categoryConfig.value)
}

// 更新分类
async function updateCategory() {
  if (!categoryConfig.value || !editingCategory.value) return
  
  const target = parentCategory.value 
    ? findCategoryById(editingCategory.value.id, parentCategory.value)
    : findCategoryById(editingCategory.value.id)
  
  if (target) {
    target.name = formData.name
    target.icon = formData.icon || undefined
    target.description = formData.description || undefined
    target.order = formData.order
    
    // 重新排序
    if (parentCategory.value) {
      const parent = findCategoryById(parentCategory.value.id)
      if (parent?.children) {
        parent.children.sort((a, b) => a.order - b.order)
      }
    } else {
      categoryConfig.value.categories.sort((a, b) => a.order - b.order)
    }
    
    await dataService.updateCategories(categoryConfig.value)
  }
}

// 删除分类
async function deleteCategory(category: Category, parent?: Category) {
  try {
    await ElMessageBox.confirm(
      `确定要删除分类"${category.name}"吗？${category.children?.length ? '这将同时删除所有子分类。' : ''}`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    if (!categoryConfig.value) return
    
    if (parent) {
      // 删除子分类
      const parentCat = findCategoryById(parent.id)
      if (parentCat?.children) {
        const index = parentCat.children.findIndex(c => c.id === category.id)
        if (index > -1) {
          parentCat.children.splice(index, 1)
        }
      }
    } else {
      // 删除顶级分类
      const index = categoryConfig.value.categories.findIndex(c => c.id === category.id)
      if (index > -1) {
        categoryConfig.value.categories.splice(index, 1)
      }
    }
    
    await dataService.updateCategories(categoryConfig.value)
    await loadCategories()
    ElMessage.success('删除分类成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除分类失败:', error)
      ElMessage.error('删除分类失败')
    }
  }
}

// 更新分类排序
async function updateCategoryOrder(category: Category, parent?: Category) {
  if (!categoryConfig.value) return
  
  try {
    if (parent) {
      // 更新子分类排序
      const parentCat = findCategoryById(parent.id)
      if (parentCat?.children) {
        parentCat.children.sort((a, b) => a.order - b.order)
      }
    } else {
      // 更新顶级分类排序
      categoryConfig.value.categories.sort((a, b) => a.order - b.order)
    }
    
    await dataService.updateCategories(categoryConfig.value)
    ElMessage.success('排序更新成功')
  } catch (error) {
    console.error('更新排序失败:', error)
    ElMessage.error('更新排序失败')
  }
}

// 查找分类
function findCategoryById(id: string, parent?: Category): Category | undefined {
  if (!categoryConfig.value) return undefined
  
  const searchIn = parent?.children || categoryConfig.value.categories
  
  for (const category of searchIn) {
    if (category.id === id) {
      return category
    }
    if (category.children) {
      const found = findCategoryById(id, category)
      if (found) return found
    }
  }
  
  return undefined
}

// 生成分类ID
function generateCategoryId(name: string): string {
  // 简单的ID生成逻辑，实际项目中可能需要更复杂的逻辑
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 5)
  const nameSlug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  return `${nameSlug}-${timestamp}-${random}`
}
</script>

<style lang="scss" scoped>
.admin-categories {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  
  .header-content {
    flex: 1;
    
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
  
  .header-actions {
    display: flex;
    gap: 12px;
    margin-left: 20px;
  }
}

.content-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.category-list {
  min-height: 400px;
  
  .list-header {
    display: grid;
    grid-template-columns: 2fr 2fr 120px 100px 200px;
    gap: 16px;
    padding: 16px 20px;
    background: #f8f9fa;
    border-bottom: 1px solid #eee;
    font-weight: 600;
    color: #333;
    font-size: 14px;
  }
  
  .category-item {
    border-bottom: 1px solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  .category-row {
    display: grid;
    grid-template-columns: 2fr 2fr 120px 100px 200px;
    gap: 16px;
    padding: 16px 20px;
    align-items: center;
    transition: background-color 0.2s;
    
    &:hover {
      background: #f8f9fa;
    }
    
    &.level-1 {
      background: white;
    }
    
    &.level-2 {
      background: #fafbfc;
    }
  }
  
  .category-info {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .expand-btn {
      width: 20px;
      height: 20px;
      padding: 0;
      font-size: 12px;
    }
    
    .category-icon {
      font-size: 16px;
      color: #666;
    }
    
    .category-name {
      font-weight: 500;
      color: #333;
    }
    
    .indent {
      width: 28px;
    }
  }
  
  .category-desc {
    color: #666;
    font-size: 14px;
  }
  
  .category-order {
    .el-input-number {
      width: 100%;
    }
  }
  
  .category-count {
    text-align: center;
    color: #666;
    font-weight: 500;
  }
  
  .category-actions {
    display: flex;
    gap: 8px;
  }
  
  .children-container {
    .category-row {
      border-top: 1px solid #f0f0f0;
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: #666;
  
  .empty-icon {
    font-size: 64px;
    color: #ddd;
    margin-bottom: 16px;
  }
  
  p {
    margin: 0 0 20px 0;
    font-size: 16px;
  }
}

.icon-selector {
  display: flex;
  align-items: center;
  gap: 16px;
  
  .selected-icon {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .icon-preview {
      font-size: 20px;
      color: #666;
    }
  }
}

.icon-option {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .el-icon {
    font-size: 16px;
  }
}

// Element Plus 样式覆盖
:deep(.el-dialog__header) {
  padding: 20px 20px 10px 20px;
}

:deep(.el-dialog__body) {
  padding: 10px 20px 20px 20px;
}

:deep(.el-input-number) {
  width: 100%;
}
</style>