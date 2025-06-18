<template>
  <div class="site-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      @submit.prevent="handleSubmit"
    >
      <el-form-item label="网站标题" prop="title">
        <el-input
          v-model="formData.title"
          placeholder="请输入网站标题"
          @blur="handleTitleBlur"
        />
      </el-form-item>

      <el-form-item label="网站URL" prop="url">
        <el-input
          v-model="formData.url"
          placeholder="https://example.com"
          @blur="handleUrlBlur"
        />
      </el-form-item>

      <el-form-item label="网站描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入网站描述"
        />
      </el-form-item>

      <el-form-item label="分类" prop="categoryPath">
        <!-- 分类选择模式切换 -->
        <div class="category-mode-selector">
          <div class="mode-switch">
            <el-radio-group v-model="categorySelectMode" size="small">
              <el-radio-button label="strict">精确模式</el-radio-button>
              <el-radio-button label="flexible">灵活模式</el-radio-button>
            </el-radio-group>
            <el-tooltip 
              :content="categorySelectMode === 'strict' ? '只能选择最底层分类' : '可以选择任意层级分类'" 
              placement="top"
            >
              <el-icon class="mode-help-icon">
                <QuestionFilled />
              </el-icon>
            </el-tooltip>
          </div>
          <div class="mode-description">
            <span v-if="categorySelectMode === 'strict'" class="mode-desc">
              精确模式：只能选择到最底层的具体分类
            </span>
            <span v-else class="mode-desc">
              灵活模式：可以选择任意层级的分类，包括父级分类
            </span>
          </div>
        </div>
        
        <!-- 分类级联选择器 -->
        <el-cascader
          v-model="formData.categoryPath"
          :options="categoryOptions"
          :props="cascaderProps"
          :placeholder="categorySelectMode === 'strict' ? '请选择具体分类' : '请选择分类（可选择任意层级）'"
          style="width: 100%"
        />
      </el-form-item>



      <el-form-item label="网站图标">
        <div class="icon-preview">
          <img
            v-if="formData.icon"
            :src="formData.icon"
            :alt="formData.title"
            class="icon-img"
            @error="handleIconError"
          />
                     <el-icon v-else class="icon-placeholder">
             <Link />
           </el-icon>
          <div class="icon-info">
            <p>图标将自动从网站获取</p>
            <el-button
              size="small"
              @click="refreshIcon"
              :loading="iconLoading"
            >
              刷新图标
            </el-button>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="特色推荐">
        <el-switch
          v-model="formData.featured"
          active-text="是"
          inactive-text="否"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          {{ isEdit ? '更新' : '添加' }}
        </el-button>
        <el-button @click="handleCancel">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Link, QuestionFilled } from '@element-plus/icons-vue'
import { dataService, type Site, type Category } from '@/admin/services/data-service'
import { getFaviconUrl } from '@/utils/favicon-helper'

interface Props {
  site?: Site | null
  visible?: boolean
}

interface Emits {
  (e: 'submit', site: Partial<Site>): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  site: null,
  visible: false
})

const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const loading = ref(false)
const iconLoading = ref(false)
const categories = ref<Category[]>([])
const categorySelectMode = ref<'strict' | 'flexible'>('strict')

const isEdit = computed(() => !!props.site)

// 表单数据
const formData = reactive({
  title: '',
  url: '',
  description: '',
  categoryPath: [] as string[],
  icon: '',
  domain: '',
  featured: false
})

// 表单验证规则
const rules: FormRules = {
  title: [
    { required: true, message: '请输入网站标题', trigger: 'blur' },
    { min: 1, max: 100, message: '标题长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  url: [
    { required: true, message: '请输入网站URL', trigger: 'blur' },
    { 
      pattern: /^https?:\/\/.+/, 
      message: '请输入有效的URL（以http://或https://开头）', 
      trigger: 'blur' 
    }
  ],
  description: [
    { required: true, message: '请输入网站描述', trigger: 'blur' },
    { min: 1, max: 500, message: '描述长度在 1 到 500 个字符', trigger: 'blur' }
  ],
  categoryPath: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ]
}

// 级联选择器配置 - 根据选择模式动态调整
const cascaderProps = computed(() => ({
  value: 'id',
  label: 'name',
  children: 'children',
  emitPath: true,
  checkStrictly: categorySelectMode.value === 'flexible'
}))

// 分类选项
const categoryOptions = computed(() => {
  return categories.value.map(category => ({
    id: category.id,
    name: category.name,
    children: category.children?.map(child => ({
      id: child.id,
      name: child.name,
      children: child.children?.map(grandChild => ({
        id: grandChild.id,
        name: grandChild.name
      }))
    }))
  }))
})

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    title: '',
    url: '',
    description: '',
    categoryPath: [],
    icon: '',
    domain: '',
    featured: false
  })
  categorySelectMode.value = 'strict' // 重置为默认模式
  formRef.value?.clearValidate()
}

// 检查分类路径是否为叶子节点
const isLeafCategory = (path: string[]): boolean => {
  if (path.length === 0) return false
  
  let currentCategories = categories.value
  for (let i = 0; i < path.length; i++) {
    const category = currentCategories.find(cat => cat.id === path[i])
    if (!category) return false
    
    if (i === path.length - 1) {
      // 检查最后一个节点是否有子节点
      return !category.children || category.children.length === 0
    }
    currentCategories = category.children || []
  }
  return false
}

// 监听分类选择模式变化
watch(categorySelectMode, (newMode, oldMode) => {
  if (formData.categoryPath.length > 0) {
    // 从灵活模式切换到精确模式时，检查当前选择是否为叶子节点
    if (newMode === 'strict' && oldMode === 'flexible') {
      if (!isLeafCategory(formData.categoryPath)) {
        ElMessage.warning('精确模式下只能选择最底层分类，当前选择已被清空，请重新选择')
        formData.categoryPath = []
      }
    }
  }
})

// 监听网站数据变化
watch(() => props.site, (newSite) => {
  if (newSite) {
    Object.assign(formData, {
      title: newSite.title,
      url: newSite.url,
      description: newSite.description,
      categoryPath: [...newSite.categoryPath],
      icon: newSite.icon,
      domain: newSite.domain,
      featured: newSite.featured
    })
  } else {
    resetForm()
  }
}, { immediate: true })

// 处理标题失焦
const handleTitleBlur = () => {
  if (formData.title && !formData.description) {
    // 可以根据标题自动生成描述的逻辑
  }
}

// 处理URL失焦
const handleUrlBlur = async () => {
  if (formData.url) {
    try {
      const domain = dataService.extractDomain(formData.url)
      formData.domain = domain
      
      if (!formData.icon) {
        // 使用新的多源favicon获取方法
        formData.icon = await getFaviconUrl(domain)
      }
    } catch (error) {
      console.error('解析URL失败:', error)
    }
  }
}

// 刷新图标
const refreshIcon = async () => {
  if (!formData.domain) return
  
  iconLoading.value = true
  try {
    // 使用新的多源favicon获取方法
    formData.icon = await getFaviconUrl(formData.domain, 64)
    ElMessage.success('图标已刷新')
  } catch (error) {
    console.error('刷新图标失败:', error)
    ElMessage.error('刷新图标失败')
  } finally {
    iconLoading.value = false
  }
}

// 处理图标加载错误
const handleIconError = () => {
  formData.icon = ''
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    loading.value = true
    
    const siteData: Partial<Site> = {
      title: formData.title.trim(),
      url: formData.url.trim(),
      description: formData.description.trim(),
      categoryPath: [...formData.categoryPath],
      tags: [], // 设置为空数组，保持数据结构兼容性
      icon: formData.icon,
      domain: formData.domain,
      featured: formData.featured
    }
    
    emit('submit', siteData)
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    loading.value = false
  }
}

// 取消操作
const handleCancel = () => {
  emit('cancel')
}

// 加载分类数据
const loadCategories = async () => {
  try {
    const categoryConfig = await dataService.getCategories()
    categories.value = categoryConfig.categories
  } catch (error) {
    console.error('加载分类失败:', error)
    ElMessage.error('加载分类失败')
  }
}

onMounted(() => {
  loadCategories()
})
</script>

<style lang="scss" scoped>
.site-form {
  max-width: 600px;
}

.icon-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .icon-img {
    width: 32px;
    height: 32px;
    border-radius: 4px;
    border: 1px solid #e0e0e0;
  }
  
  .icon-placeholder {
    width: 32px;
    height: 32px;
    color: #ccc;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .icon-info {
    flex: 1;
    
    p {
      margin: 0 0 4px 0;
      font-size: 12px;
      color: #666;
    }
  }
}

:deep(.el-cascader) {
  width: 100%;
}
</style> 