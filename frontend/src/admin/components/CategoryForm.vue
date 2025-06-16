<template>
  <div class="category-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="80px"
      @submit.prevent="handleSubmit"
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
      
      <el-form-item label="分类描述" prop="description">
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
          style="width: 100%"
        />
        <div class="form-tip">数字越小排序越靠前</div>
      </el-form-item>
      
      <el-form-item v-if="parentCategory" label="父分类">
        <el-input :value="parentCategory.name" disabled />
        <div class="form-tip">该分类将作为"{{ parentCategory.name }}"的子分类</div>
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
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { 
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
  House,
  User,
  Calendar,
  Clock,
  Message,
  Phone,
  Position,
  Search,
  Share,
  Tools,
  Warning,
  InfoFilled,
  SuccessFilled,
  CircleClose
} from '@element-plus/icons-vue'
import type { Category } from '../services/data-service'
import { getIconOptions } from '../utils/icon-config'

interface Props {
  category?: Category | null
  parentCategory?: Category | null
  visible?: boolean
}

interface Emits {
  (e: 'submit', category: Partial<Category>): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  category: null,
  parentCategory: null,
  visible: false
})

const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const loading = ref(false)

const isEdit = computed(() => !!props.category)

// 表单数据
const formData = reactive({
  id: '',
  name: '',
  icon: '',
  description: '',
  order: 0
})

// 表单验证规则
const rules: FormRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 20, message: '分类名称长度在 1 到 20 个字符', trigger: 'blur' }
  ],
  order: [
    { required: true, message: '请设置排序', trigger: 'blur' },
    { type: 'number', min: 0, message: '排序不能小于0', trigger: 'blur' }
  ]
}

// 图标选项
const iconOptions = getIconOptions()

// 监听分类变化，更新表单数据
watch(() => props.category, (newCategory) => {
  if (newCategory) {
    Object.assign(formData, {
      id: newCategory.id,
      name: newCategory.name,
      icon: newCategory.icon || '',
      description: newCategory.description || '',
      order: newCategory.order
    })
  } else {
    resetForm()
  }
}, { immediate: true })

// 监听显示状态
watch(() => props.visible, (visible) => {
  if (visible) {
    nextTick(() => {
      formRef.value?.clearValidate()
    })
  }
})

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
    loading.value = true
    
    const categoryData: Partial<Category> = {
      name: formData.name,
      icon: formData.icon || undefined,
      description: formData.description || undefined,
      order: formData.order
    }
    
    if (isEdit.value) {
      categoryData.id = formData.id
    }
    
    emit('submit', categoryData)
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    loading.value = false
  }
}

// 取消操作
function handleCancel() {
  emit('cancel')
}

// 暴露方法
defineExpose({
  resetForm,
  validate: () => formRef.value?.validate(),
  clearValidate: () => formRef.value?.clearValidate()
})
</script>

<style lang="scss" scoped>
.category-form {
  .icon-selector {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    
    .selected-icon {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #f5f7fa;
      border-radius: 4px;
      border: 1px solid #e4e7ed;
      
      .icon-preview {
        font-size: 20px;
        color: #606266;
      }
      
      span {
        font-size: 14px;
        color: #606266;
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
  
  .form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
    line-height: 1.4;
  }
}

// Element Plus 样式覆盖
:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-select) {
  .el-input {
    .el-input__wrapper {
      padding-left: 8px;
    }
  }
}
</style> 