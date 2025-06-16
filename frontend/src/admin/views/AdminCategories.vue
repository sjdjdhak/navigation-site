<template>
  <div class="admin-categories">
    <div class="page-header">
      <div class="header-content">
        <h1>分类管理</h1>
        <p>管理导航站的分类结构</p>
      </div>
      <div class="header-actions">
        <!-- 头部只保留刷新按钮 -->
        <el-button @click="loadCategories" :loading="loading" :icon="Refresh">
          刷新
        </el-button>
      </div>
    </div>

    <div class="content-container">
      <!-- 双栏布局 -->
      <div class="dual-panel-layout">
        <!-- 左侧：分类树导航 -->
        <div class="tree-panel">
          <div class="tree-panel-header">
            <h3>分类结构</h3>
            <div class="header-actions">
              <el-button 
                type="primary" 
                size="small" 
                @click="showAddDialog()" 
                :icon="Plus"
              >
                添加分类
              </el-button>
              <el-button 
                size="small" 
                @click="loadCategories" 
                :loading="loading" 
                :icon="Refresh"
              >
                刷新
              </el-button>
            </div>
          </div>
          
          <div class="tree-panel-content" v-loading="loading">
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

            <!-- 搜索框 -->
            <div v-else class="search-box">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索分类..."
                :prefix-icon="Search"
                clearable
                size="small"
              />
            </div>

            <!-- 树形导航 -->
            <el-tree
              v-if="categories.length > 0"
              :data="filteredCategories"
              node-key="id"
              :props="{ children: 'children', label: 'name' }"
              :default-expand-all="true"
              :expand-on-click-node="false"
              :highlight-current="true"
              draggable
              :allow-drop="allowDrop"
              :allow-drag="allowDrag"
              @node-drag-end="handleDragEnd"
              @node-click="selectCategory"
              class="navigation-tree"
              ref="treeRef"
            >
              <!-- 自定义节点内容 -->
              <template #default="{ node, data }">
                <div class="tree-node" :class="{ 'is-selected': selectedCategory?.id === data.id }">
                  <!-- 图标 -->
                  <el-icon v-if="data.icon" class="node-icon">
                    <component :is="data.icon" />
                  </el-icon>
                  <el-icon v-else class="node-icon">
                    <Folder />
                  </el-icon>
                  
                  <!-- 分类名称 -->
                  <span class="node-name">{{ data.name }}</span>
                  
                  <!-- 子分类数量 -->
                  <el-tag 
                    v-if="data.children && data.children.length > 0" 
                    size="small" 
                    type="info"
                    class="children-badge"
                  >
                    {{ data.children.length }}
                  </el-tag>
                </div>
              </template>
            </el-tree>
          </div>
        </div>

        <!-- 右侧：详情面板 -->
        <div class="detail-panel">
          <div class="detail-panel-header">
            <h3>分类详情</h3>
            <div class="batch-actions" v-if="selectedCategory">
              <el-button 
                type="primary" 
                size="small" 
                @click="showAddDialog(selectedCategory)" 
                :icon="Plus"
              >
                添加子分类
              </el-button>
              <el-button 
                size="small" 
                @click="showEditDialog(selectedCategory, getSelectedParent())" 
                :icon="Edit"
              >
                编辑分类
              </el-button>
              <el-button 
                size="small" 
                type="danger" 
                @click="deleteCategory(selectedCategory, getSelectedParent())" 
                :icon="Delete"
              >
                删除分类
              </el-button>
            </div>
          </div>
          
          <div class="detail-panel-content">
            <!-- 选中分类的详细信息 -->
            <div v-if="selectedCategory" class="category-details">
              <!-- 基本信息卡片 -->
              <el-card class="info-card" shadow="never">
                <template #header>
                  <div class="card-header">
                    <el-icon class="header-icon">
                      <component :is="selectedCategory.icon || 'Folder'" />
                    </el-icon>
                    <span class="header-title">{{ selectedCategory.name }}</span>
                  </div>
                </template>
                
                <el-descriptions :column="1" border size="small">
                  <el-descriptions-item label="分类ID">
                    <el-tag size="small">{{ selectedCategory.id }}</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="分类名称">
                    {{ selectedCategory.name }}
                  </el-descriptions-item>
                  <el-descriptions-item label="描述">
                    {{ selectedCategory.description || '暂无描述' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="排序">
                    <el-input-number 
                      v-model="selectedCategory.order" 
                      :min="0" 
                      size="small"
                      @change="updateCategoryOrder(selectedCategory, getSelectedParent())"
                      style="width: 120px;"
                    />
                  </el-descriptions-item>
                  <el-descriptions-item label="子分类数量">
                    <el-tag type="info" size="small">
                      {{ selectedCategory.children?.length || 0 }} 个
                    </el-tag>
                  </el-descriptions-item>
                </el-descriptions>
              </el-card>

              <!-- 子分类列表 -->
              <el-card v-if="selectedCategory.children?.length > 0" class="children-card" shadow="never">
                <template #header>
                  <span>子分类列表</span>
                </template>
                
                <div class="children-list">
                  <div 
                    v-for="child in selectedCategory.children" 
                    :key="child.id"
                    class="child-item"
                    @click="selectCategory(child)"
                  >
                    <el-icon class="child-icon">
                      <component :is="child.icon || 'Document'" />
                    </el-icon>
                    <div class="child-info">
                      <div class="child-name">{{ child.name }}</div>
                      <div class="child-desc">{{ child.description || '暂无描述' }}</div>
                    </div>
                    <el-tag v-if="child.children?.length" size="small" type="info">
                      {{ child.children.length }}
                    </el-tag>
                  </div>
                </div>
              </el-card>
              
              <!-- 统计信息 -->
              <el-card class="stats-card" shadow="never">
                <template #header>
                  <span>统计信息</span>
                </template>
                
                <div class="stats-grid">
                  <div class="stat-item">
                    <div class="stat-value">{{ getTotalChildren(selectedCategory) }}</div>
                    <div class="stat-label">总子分类</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">{{ getMaxDepth(selectedCategory) }}</div>
                    <div class="stat-label">最大层级</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">{{ selectedCategory.order }}</div>
                    <div class="stat-label">排序位置</div>
                  </div>
                </div>
              </el-card>
            </div>

            <!-- 未选中状态 -->
            <div v-else class="no-selection">
              <el-icon class="no-selection-icon">
                <Folder />
              </el-icon>
              <div class="no-selection-title">请选择分类</div>
              <div class="no-selection-desc">
                在左侧分类树中点击任意分类查看详细信息
              </div>
            </div>
          </div>
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
            @input="handleNameChange"
          />
        </el-form-item>

        <el-form-item label="分类ID" prop="id">
          <el-input 
            v-model="formData.id"
            placeholder="请输入自定义分类ID或使用建议ID"
            :disabled="isEdit && !allowEditId"
            @input="handleIdChange"
          >
            <template #prepend>
              <el-icon><Key /></el-icon>
            </template>
            <template #append>
              <el-button 
                @click="generateRandomId" 
                class="random-id-btn"
                :loading="generatingId"
              >
                <el-icon><Refresh /></el-icon>
                随机生成
              </el-button>
            </template>
          </el-input>

          
          <!-- ID验证状态 -->
          <div class="id-validation" v-if="idValidation.message">
            <el-text :type="idValidation.type" size="small">
              <el-icon v-if="idValidation.type === 'success'"><SuccessFilled /></el-icon>
              <el-icon v-if="idValidation.type === 'warning'"><Warning /></el-icon>
              <el-icon v-if="idValidation.type === 'danger'"><CircleClose /></el-icon>
              {{ idValidation.message }}
            </el-text>
          </div>
          
          <!-- ID格式说明 -->
          <div class="id-help-text">
            <el-text type="info" size="small">
              ID只能包含小写字母、数字和连字符(-)，用于URL和API调用
            </el-text>
          </div>
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
        
        <el-form-item label="父分类">
          <el-select 
            v-model="selectedParentId" 
            placeholder="选择父分类（留空为顶级分类）"
            clearable
            style="width: 100%"
            @change="handleParentChange"
          >
            <el-option label="顶级分类" value="" />
            <template v-for="option in parentOptions" :key="option.value">
              <el-option 
                :label="option.label" 
                :value="option.value"
                :disabled="option.disabled"
              />
            </template>
          </el-select>
          <div v-if="parentCategory" class="form-tip">
            当前选择的父分类：{{ parentCategory.name }}
          </div>
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
  Search,
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
  VideoPause,
  Key,
  SuccessFilled,
  Warning,
  CircleClose
} from '@element-plus/icons-vue'
import { dataService, type Category, type CategoryConfig } from '@/admin/services/data-service'
import { mapFaIconToElement } from '@/admin/utils/icon-mapping'
import { getIconOptions } from '@/admin/utils/icon-config'

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
const selectedParentId = ref('')
const selectedCategory = ref<Category | null>(null)
const searchKeyword = ref('')
const treeRef = ref()

// ID管理相关
const allowEditId = ref(true)
const generatingId = ref(false)
const recentGeneratedIds = new Set<string>()
const idValidation = reactive({
  type: '' as 'success' | 'warning' | 'danger' | '',
  message: ''
})

// 父分类选项
const parentOptions = computed(() => {
  const options: Array<{ label: string; value: string; disabled: boolean }> = []
  
  function addOptions(cats: Category[], level = 0, disabled = false) {
    cats.forEach(cat => {
      // 如果正在编辑分类，禁用自己和自己的子分类
      const isDisabled = disabled || 
        (isEdit.value && editingCategory.value && 
         (cat.id === editingCategory.value.id || isChildOf(editingCategory.value, cat)))
      
      options.push({
        label: '　'.repeat(level) + cat.name,
        value: cat.id,
        disabled: isDisabled
      })
      
      if (cat.children) {
        addOptions(cat.children, level + 1, isDisabled)
      }
    })
  }
  
  addOptions(categories.value)
  return options
})

// 检查是否为子分类
function isChildOf(parent: Category, child: Category): boolean {
  if (!parent.children) return false
  
  for (const c of parent.children) {
    if (c.id === child.id) return true
    if (isChildOf(c, child)) return true
  }
  return false
}

// 处理父分类变化
function handleParentChange(parentId: string) {
  if (parentId) {
    parentCategory.value = findCategoryById(parentId)
  } else {
    parentCategory.value = null
  }
}

// 过滤分类（搜索功能）
const filteredCategories = computed(() => {
  if (!searchKeyword.value.trim()) {
    return categories.value
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  
  function filterCategories(cats: Category[]): Category[] {
    return cats.filter(cat => {
      const matchName = cat.name.toLowerCase().includes(keyword)
      const matchDesc = cat.description?.toLowerCase().includes(keyword)
      const hasMatchingChildren = cat.children && filterCategories(cat.children).length > 0
      
      if (matchName || matchDesc || hasMatchingChildren) {
        return {
          ...cat,
          children: cat.children ? filterCategories(cat.children) : undefined
        }
      }
      return false
    }).map(cat => ({
      ...cat,
      children: cat.children ? filterCategories(cat.children) : undefined
    }))
  }
  
  return filterCategories(categories.value)
})

// 选择分类
function selectCategory(category: Category) {
  selectedCategory.value = category
  // 在树中高亮选中的节点
  if (treeRef.value) {
    treeRef.value.setCurrentKey(category.id)
  }
}

// 获取选中分类的父分类
function getSelectedParent(): Category | undefined {
  if (!selectedCategory.value) return undefined
  
  function findParent(cats: Category[], target: Category): Category | undefined {
    for (const cat of cats) {
      if (cat.children) {
        const found = cat.children.find(child => child.id === target.id)
        if (found) return cat
        
        const parentInChild = findParent(cat.children, target)
        if (parentInChild) return parentInChild
      }
    }
    return undefined
  }
  
  return findParent(categories.value, selectedCategory.value)
}

// 获取总子分类数量
function getTotalChildren(category: Category): number {
  if (!category.children) return 0
  
  let count = category.children.length
  category.children.forEach(child => {
    count += getTotalChildren(child)
  })
  return count
}

// 获取最大层级深度
function getMaxDepth(category: Category): number {
  if (!category.children || category.children.length === 0) return 1
  
  let maxChildDepth = 0
  category.children.forEach(child => {
    const childDepth = getMaxDepth(child)
    maxChildDepth = Math.max(maxChildDepth, childDepth)
  })
  
  return maxChildDepth + 1
}

// 格式化日期
function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleString('zh-CN')
  } catch {
    return dateString
  }
}

// 表单验证规则
const rules: FormRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 20, message: '分类名称长度在 1 到 20 个字符', trigger: 'blur' }
  ],
  id: [
    { required: true, message: '请输入分类ID', trigger: 'blur' },
    { 
      pattern: /^[a-z0-9-]+$/, 
      message: 'ID只能包含小写字母、数字和连字符(-)', 
      trigger: 'blur' 
    },
    { min: 2, max: 50, message: 'ID长度在 2 到 50 个字符', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: Function) => {
        if (value && (value.startsWith('-') || value.endsWith('-') || value.includes('--'))) {
          callback(new Error('ID不能以连字符开头或结尾，也不能包含连续的连字符'))
        } else if (value && isIdExists(value) && (!isEdit.value || value !== editingCategory.value?.id)) {
          callback(new Error('该ID已存在，请选择其他ID'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
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
    
    // 递归处理图标映射
    function processCategories(cats: Category[]): Category[] {
      return cats.map(cat => ({
        ...cat,
        icon: mapFaIconToElement(cat.icon),
        children: cat.children ? processCategories(cat.children) : undefined
      }))
    }
    
    categories.value = processCategories(categoryConfig.value.categories)
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

// 获取节点的父分类
function getParentCategory(node: any): Category | undefined {
  if (!node.parent || node.parent.level === 0) {
    return undefined
  }
  return node.parent.data
}

// 拖拽相关方法
function allowDrop(draggingNode: any, dropNode: any, type: string) {
  // 允许所有拖拽操作，但可以在这里添加业务逻辑限制
  return true
}

function allowDrag(draggingNode: any) {
  // 允许所有节点拖拽，但可以在这里添加业务逻辑限制
  return true
}

async function handleDragEnd(draggingNode: any, dropNode: any, dropType: string, ev: DragEvent) {
  // 拖拽结束后重新排序和保存
  try {
    if (!categoryConfig.value) return
    
    // 重新计算所有分类的排序
    function updateOrderRecursively(categories: Category[], startOrder = 0) {
      categories.forEach((category, index) => {
        category.order = startOrder + index
        if (category.children) {
          updateOrderRecursively(category.children)
        }
      })
    }
    
    updateOrderRecursively(categoryConfig.value.categories)
    
    await dataService.updateCategories(categoryConfig.value)
    ElMessage.success('分类排序已更新')
  } catch (error) {
    console.error('更新排序失败:', error)
    ElMessage.error('更新排序失败')
    // 重新加载数据以恢复原始状态
    await loadCategories()
  }
}

// 显示添加对话框
function showAddDialog(parent?: Category) {
  resetForm()
  isEdit.value = false
  editingCategory.value = null
  parentCategory.value = parent || null
  selectedParentId.value = parent?.id || ''
  
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
  selectedParentId.value = parent?.id || ''
  
  // 填充表单数据
  Object.assign(formData, {
    id: category.id,
    name: category.name,
    icon: category.icon || '',
    description: category.description || '',
    order: category.order
  })
  
  // 设置ID编辑权限 - 默认允许编辑，但可以配置
  allowEditId.value = true
  
  // 验证当前ID
  validateId()
  
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
  selectedParentId.value = ''
  
  // 重置ID相关状态
  idValidation.type = ''
  idValidation.message = ''
  allowEditId.value = true
  generatingId.value = false
  
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

// ====== ID管理相关函数 ======

// 中文转拼音的简单映射表
const pinyinMap: Record<string, string> = {
  '设': 'she', '计': 'ji', '开': 'kai', '发': 'fa', '编': 'bian', '程': 'cheng',
  '前': 'qian', '端': 'duan', '后': 'hou', '移': 'yi', '动': 'dong', '网': 'wang',
  '站': 'zhan', '应': 'ying', '用': 'yong', '工': 'gong', '具': 'ju', '学': 'xue',
  '习': 'xi', '教': 'jiao', '娱': 'yu', '乐': 'yue', '游': 'you',
  '戏': 'xi2', '音': 'yin', '视': 'shi', '频': 'pin', '图': 'tu',
  '片': 'pian', '社': 'she2', '交': 'jiao2', '购': 'gou', '物': 'wu', '金': 'jin',
  '融': 'rong', '财': 'cai', '经': 'jing', '新': 'xin', '闻': 'wen', '资': 'zi',
  '讯': 'xun', '科': 'ke', '技': 'ji2', '数': 'shu', '码': 'ma', '电': 'dian',
  '脑': 'nao', '手': 'shou', '机': 'ji3', '软': 'ruan', '件': 'jian', '硬': 'ying',
  '办': 'ban', '公': 'gong2', '生': 'sheng', '活': 'huo', '服': 'fu', '务': 'wu2',
  '旅': 'lv', '美': 'mei', '食': 'shi2', '健': 'jian2', '康': 'kang',
  '体': 'ti', '育': 'yu2', '运': 'yun', '汽': 'qi', '车': 'che', '房': 'fang',
  '产': 'chan', '装': 'zhuang', '修': 'xiu', '时': 'shi3', '尚': 'shang', '母': 'mu',
  '婴': 'ying2', '宠': 'chong', '花': 'hua', '卉': 'hui', '摄': 'she3', '影': 'ying3'
}

// 中文转拼音
function convertToPinyin(text: string): string {
  return text.split('').map(char => pinyinMap[char] || char).join('')
}

// 生成友好的ID
function generateFriendlyId(name: string, style: 'kebab' | 'snake' | 'camel' = 'kebab'): string {
  // 先转换中文为拼音
  let converted = convertToPinyin(name)
  
  // 清理特殊字符，保留字母、数字、空格、连字符
  converted = converted.toLowerCase().replace(/[^a-z0-9\s-]/g, '')
  
  // 根据样式处理
  switch (style) {
    case 'kebab':
      return converted.replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '')
    case 'snake':
      return converted.replace(/\s+/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '')
    case 'camel':
      return converted.replace(/\s+(.)/g, (_, char) => char.toUpperCase()).replace(/^\w/, c => c.toLowerCase())
    default:
      return converted
  }
}

// 处理名称变化
function handleNameChange() {
  validateId()
}

// 处理ID变化
function handleIdChange() {
  validateId()
}

// 高质量随机字符串生成
function generateSecureRandom(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  
  // 使用多重随机源
  const now = Date.now()
  const performanceNow = performance.now()
  const seed = (now + performanceNow + Math.random() * 1000000) % 1000000
  
  for (let i = 0; i < length; i++) {
    // 结合时间、性能计时器和数学运算增强随机性
    const randomIndex = Math.floor(
      (Math.sin(seed + i) * 10000 + Math.random() * 1000 + (now % 1000)) % chars.length
    )
    result += chars[Math.abs(randomIndex) % chars.length]
  }
  
  return result
}

// 获取高精度时间戳字符串
function getHighPrecisionTimestamp(): string {
  const now = Date.now()
  const micro = Math.floor(performance.now() * 1000) % 1000
  return (now.toString(36) + micro.toString(36)).slice(-8)
}

// 随机生成ID
async function generateRandomId() {
  generatingId.value = true
  
  try {
    // 模拟一点延时，给用户视觉反馈
    await new Promise(resolve => setTimeout(resolve, 200))
    
    let baseId = ''
    let randomId = ''
    
    // 随机选择生成模式 (1-5)
    const mode = Math.floor(Math.random() * 5) + 1
    
    switch (mode) {
      case 1:
        // 模式1: 基于名称 + 随机字符串
        if (formData.name.trim()) {
          baseId = generateFriendlyId(formData.name.trim(), 'kebab')
          randomId = baseId ? `${baseId}-${generateSecureRandom(4)}` : `cat-${generateSecureRandom(6)}`
        } else {
          randomId = `cat-${generateSecureRandom(6)}`
        }
        break
        
      case 2:
        // 模式2: 缩写 + 时间戳
        if (formData.name.trim()) {
          const words = formData.name.trim().split(/\s+/)
          const abbreviation = words.map(word => {
            const firstChar = word.charAt(0)
            return pinyinMap[firstChar] || firstChar.toLowerCase()
          }).join('').slice(0, 3)
          randomId = `${abbreviation || 'cat'}${getHighPrecisionTimestamp()}`
        } else {
          randomId = `cat${getHighPrecisionTimestamp()}`
        }
        break
        
      case 3:
        // 模式3: 完全随机 + 前缀
        const prefixes = ['item', 'node', 'cat', 'type', 'group']
        const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)]
        randomId = `${randomPrefix}-${generateSecureRandom(6)}`
        break
        
      case 4:
        // 模式4: 基于名称首字母 + 随机数字
        if (formData.name.trim()) {
          const firstLetter = formData.name.charAt(0)
          const convertedLetter = pinyinMap[firstLetter] || firstLetter.toLowerCase()
          const randomNum = Math.floor(Math.random() * 9999) + 1000
          randomId = `${convertedLetter}${randomNum}`
        } else {
          randomId = `c${Math.floor(Math.random() * 99999) + 10000}`
        }
        break
        
      case 5:
      default:
        // 模式5: 混合模式 - 名称简化 + 日期 + 随机
        const today = new Date()
        const dateStr = `${today.getMonth() + 1}${today.getDate()}`
        if (formData.name.trim()) {
          const shortName = generateFriendlyId(formData.name.trim(), 'kebab').split('-')[0] || 'cat'
          randomId = `${shortName}-${dateStr}-${generateSecureRandom(3)}`
        } else {
          randomId = `cat-${dateStr}-${generateSecureRandom(4)}`
        }
        break
    }
    
    // 确保唯一性检查
    let finalId = randomId
    let attempts = 0
    const maxAttempts = 50
    
    while ((isIdExists(finalId) || recentGeneratedIds.has(finalId)) && attempts < maxAttempts) {
      // 如果重复，添加更多随机性
      const extraRandom = generateSecureRandom(3)
      finalId = `${randomId}-${extraRandom}`
      attempts++
    }
    
    // 如果仍然重复，使用UUID兜底
    if (isIdExists(finalId) || recentGeneratedIds.has(finalId)) {
      const timestamp = Date.now().toString(36)
      const random = generateSecureRandom(6)
      finalId = `id-${timestamp}-${random}`
    }
    
    // 记录到最近生成的ID中（最多保存100个）
    recentGeneratedIds.add(finalId)
    if (recentGeneratedIds.size > 100) {
      const firstId = recentGeneratedIds.values().next().value
      recentGeneratedIds.delete(firstId)
    }
    
    formData.id = finalId
    validateId()
    
    // 成功反馈
    if (idValidation.type === 'success') {
      // 短暂显示成功状态
      setTimeout(() => {
        generatingId.value = false
      }, 300)
    }
    
  } catch (error) {
    console.error('生成随机ID失败:', error)
    // 降级到简单随机
    const fallbackId = `cat-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`
    formData.id = fallbackId
    validateId()
  } finally {
    generatingId.value = false
  }
}

// 验证ID
function validateId() {
  const id = formData.id.trim()
  
  if (!id) {
    idValidation.type = ''
    idValidation.message = ''
    return
  }
  
  // 格式验证
  const formatRegex = /^[a-z0-9-]+$/
  if (!formatRegex.test(id)) {
    idValidation.type = 'danger'
    idValidation.message = 'ID只能包含小写字母、数字和连字符(-)'
    return
  }
  
  // 长度验证
  if (id.length < 2) {
    idValidation.type = 'danger'
    idValidation.message = 'ID长度至少为2个字符'
    return
  }
  
  if (id.length > 50) {
    idValidation.type = 'danger'
    idValidation.message = 'ID长度不能超过50个字符'
    return
  }
  
  // 连字符规则验证
  if (id.startsWith('-') || id.endsWith('-') || id.includes('--')) {
    idValidation.type = 'danger'
    idValidation.message = 'ID不能以连字符开头或结尾，也不能包含连续的连字符'
    return
  }
  
  // 唯一性验证
  if (isIdExists(id) && (!isEdit.value || id !== editingCategory.value?.id)) {
    idValidation.type = 'danger'
    idValidation.message = '该ID已存在，请选择其他ID'
    return
  }
  
  // 验证通过
  idValidation.type = 'success'
  idValidation.message = 'ID格式正确且唯一'
}

// 检查ID是否已存在
function isIdExists(id: string): boolean {
  function checkInCategories(cats: Category[]): boolean {
    return cats.some(cat => {
      if (cat.id === id) return true
      if (cat.children) return checkInCategories(cat.children)
      return false
    })
  }
  
  return checkInCategories(categories.value)
}

// 生成分类ID (原有函数，保持兼容)
function generateCategoryId(name: string): string {
  // 如果表单中已有有效ID，直接使用
  if (formData.id && formData.id.trim()) {
    return formData.id.trim()
  }
  
  // 否则生成默认ID
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 5)
  const nameSlug = generateFriendlyId(name, 'kebab')
  return nameSlug ? `${nameSlug}-${timestamp}-${random}` : `category-${timestamp}-${random}`
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

// 双栏布局
.dual-panel-layout {
  display: flex;
  gap: 20px;
  min-height: 600px;
  
  // 左侧树形面板
  .tree-panel {
    flex: 0 0 320px;
    background: white;
    border-radius: 8px;
    border: 1px solid #e4e7ed;
    display: flex;
    flex-direction: column;
    
    .tree-panel-header {
      padding: 16px 20px;
      border-bottom: 1px solid #e4e7ed;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #fafafa;
      border-radius: 8px 8px 0 0;
      
      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }
      
      .header-actions {
        display: flex;
        gap: 8px;
      }
    }
    
    .tree-panel-content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      
      .search-box {
        padding: 16px 16px 8px 16px;
        
        .el-input {
          background: #f8f9fa;
        }
      }
      
      .navigation-tree {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
        
        .tree-node {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 8px 12px;
          border-radius: 6px;
          transition: all 0.2s ease;
          cursor: pointer;
          
          &:hover {
            background: #f5f7fa;
          }
          
          &.is-selected {
            background: #e8f4ff;
            color: #409eff;
            
            .node-icon {
              color: #409eff;
            }
          }
          
          .node-icon {
            font-size: 16px;
            color: #666;
            flex-shrink: 0;
          }
          
          .node-name {
            flex: 1;
            font-size: 14px;
            font-weight: 500;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          
          .children-badge {
            flex-shrink: 0;
            font-size: 12px;
          }
        }
        
        // Element Plus Tree 样式覆盖
        :deep(.el-tree-node) {
          .el-tree-node__content {
            padding: 0;
            height: auto;
            
            &:hover {
              background: transparent !important;
            }
          }
          
          .el-tree-node__expand-icon {
            color: #909399;
            font-size: 14px;
            margin-right: 4px;
            
            &.expanded {
              transform: rotate(90deg);
            }
          }
          
          .el-tree-node__label {
            font-weight: normal;
            padding: 0;
            width: 100%;
          }
        }
        
        :deep(.el-tree-node__children) {
          .el-tree-node {
            .el-tree-node__content {
              padding-left: 20px;
            }
          }
        }
        
        // 拖拽样式
        :deep(.el-tree-node.is-drop-inner) {
          .tree-node {
            background-color: #e8f4ff !important;
            border: 1px dashed #409eff;
          }
        }
        
        :deep(.el-tree-node.is-dragging) {
          opacity: 0.6;
        }
      }
    }
  }
  
  // 右侧详情面板
  .detail-panel {
    flex: 1;
    background: white;
    border-radius: 8px;
    border: 1px solid #e4e7ed;
    display: flex;
    flex-direction: column;
    
    .detail-panel-header {
      padding: 16px 20px;
      border-bottom: 1px solid #e4e7ed;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #fafafa;
      border-radius: 8px 8px 0 0;
      
      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }
      
      .batch-actions {
        display: flex;
        gap: 8px;
      }
    }
    
    .detail-panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      
      .category-details {
        .info-card,
        .children-card,
        .stats-card {
          margin-bottom: 16px;
          
          &:last-child {
            margin-bottom: 0;
          }
          
          :deep(.el-card__header) {
            padding: 12px 16px;
            
            .card-header {
              display: flex;
              align-items: center;
              gap: 8px;
              
              .header-icon {
                font-size: 18px;
                color: #409eff;
              }
              
              .header-title {
                font-size: 16px;
                font-weight: 600;
                color: #303133;
              }
            }
          }
          
          :deep(.el-card__body) {
            padding: 16px;
          }
        }
        
        .children-list {
          .child-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            border: 1px solid #e4e7ed;
            border-radius: 6px;
            margin-bottom: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            
            &:hover {
              background: #f8f9fa;
              border-color: #409eff;
            }
            
            &:last-child {
              margin-bottom: 0;
            }
            
            .child-icon {
              font-size: 16px;
              color: #666;
              flex-shrink: 0;
            }
            
            .child-info {
              flex: 1;
              min-width: 0;
              
              .child-name {
                font-size: 14px;
                font-weight: 500;
                color: #303133;
                margin-bottom: 4px;
              }
              
              .child-desc {
                font-size: 12px;
                color: #909399;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
            }
          }
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          
          .stat-item {
            text-align: center;
            padding: 16px;
            background: #f8f9fa;
            border-radius: 6px;
            
            .stat-value {
              font-size: 24px;
              font-weight: 600;
              color: #409eff;
              margin-bottom: 4px;
            }
            
            .stat-label {
              font-size: 12px;
              color: #909399;
            }
          }
        }
      }
      
      .no-selection {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 400px;
        color: #909399;
        
        .no-selection-icon {
          font-size: 64px;
          margin-bottom: 16px;
          opacity: 0.5;
        }
        
        .no-selection-title {
          font-size: 18px;
          font-weight: 500;
          margin-bottom: 8px;
        }
        
        .no-selection-desc {
          font-size: 14px;
          text-align: center;
          line-height: 1.6;
        }
      }
    }
  }
}

// 响应式布局
@media (max-width: 1200px) {
  .dual-panel-layout {
    .tree-panel {
      flex: 0 0 280px;
    }
  }
}

@media (max-width: 768px) {
  .dual-panel-layout {
    flex-direction: column;
    
    .tree-panel {
      flex: none;
      max-height: 300px;
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

// 表单提示样式
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

// ID 管理相关样式
.id-validation {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  
  .el-text {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.id-help-text {
  margin-top: 6px;
}

// 随机生成按钮样式
.random-id-btn {
  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
  color: white !important;
  font-weight: 500;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(45deg, #764ba2 0%, #667eea 100%) !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  .el-icon {
    margin-right: 4px;
    animation: none;
  }
  
  &.is-loading {
    .el-icon {
      animation: rotate 1s linear infinite;
    }
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>