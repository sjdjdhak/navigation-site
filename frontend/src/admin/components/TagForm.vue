<template>
  <div class="tag-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="80px"
      @submit.prevent="handleSubmit"
    >
      <el-form-item label="标签名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="请输入标签名称"
          maxlength="20"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="标签颜色" prop="color">
        <div class="color-picker">
          <el-color-picker v-model="formData.color" />
          <span class="color-text">{{ formData.color }}</span>
        </div>
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入标签描述（可选）"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="预览">
        <el-tag 
          :color="formData.color"
          size="large"
          effect="dark"
        >
          {{ formData.name || '标签预览' }}
        </el-tag>
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
import { ref, reactive, computed, watch } from 'vue'
import { type FormInstance, type FormRules } from 'element-plus'
import { type Tag } from '../services/tag-service'

interface Props {
  tag?: Tag | null
}

interface Emits {
  (e: 'submit', tag: Partial<Tag>): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  tag: null
})

const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const loading = ref(false)

const isEdit = computed(() => !!props.tag)

// 表单数据
const formData = reactive({
  name: '',
  color: '#409eff',
  description: ''
})

// 表单验证规则
const rules: FormRules = {
  name: [
    { required: true, message: '请输入标签名称', trigger: 'blur' },
    { min: 1, max: 20, message: '标签名称长度在 1 到 20 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9\u4e00-\u9fa5]+$/, message: '标签名称只能包含中文、英文和数字', trigger: 'blur' }
  ],
  color: [
    { required: true, message: '请选择标签颜色', trigger: 'change' }
  ],
  description: [
    { max: 100, message: '描述长度不能超过 100 个字符', trigger: 'blur' }
  ]
}

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    name: '',
    color: '#409eff',
    description: ''
  })
  formRef.value?.clearValidate()
}

// 监听标签数据变化
watch(() => props.tag, (newTag) => {
  if (newTag) {
    Object.assign(formData, {
      name: newTag.name,
      color: newTag.color || '#409eff',
      description: newTag.description || ''
    })
  } else {
    resetForm()
  }
}, { immediate: true })

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    loading.value = true
    
    const tagData: Partial<Tag> = {
      name: formData.name.trim(),
      color: formData.color,
      description: formData.description.trim()
    }
    
    emit('submit', tagData)
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
</script>

<style lang="scss" scoped>
.tag-form {
  max-width: 400px;
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .color-text {
    font-family: 'Courier New', monospace;
    font-size: 14px;
    color: #666;
    background: #f5f5f5;
    padding: 4px 8px;
    border-radius: 4px;
  }
}
</style> 