<template>
  <div class="icon-theme-selector">
    <h3>图标主题选择</h3>
    <div class="theme-grid">
      <div 
        v-for="theme in themes"
        :key="theme.value"
        class="theme-option"
        :class="{ active: currentTheme === theme.value }"
        @click="selectTheme(theme.value)"
      >
        <div class="theme-preview">
          <OptimizedIcon
            domain="github.com"
            :size="40"
            :theme="theme.value"
            :border-radius="theme.borderRadius"
          />
          <OptimizedIcon
            domain="vue.js"
            :size="32"
            :theme="theme.value"
            :border-radius="theme.borderRadius"
          />
          <OptimizedIcon
            domain="figma.com"
            :size="24"
            :theme="theme.value"
            :border-radius="theme.borderRadius"
          />
        </div>
        <div class="theme-info">
          <h4>{{ theme.name }}</h4>
          <p>{{ theme.description }}</p>
        </div>
      </div>
    </div>
    
    <div class="current-settings">
      <h4>当前设置</h4>
      <div class="settings-grid">
        <div class="setting-item">
          <label>边框圆角</label>
          <el-slider
            v-model="borderRadius"
            :min="0"
            :max="20"
            :step="2"
            @input="updateSettings"
          />
          <span class="setting-value">{{ borderRadius }}px</span>
        </div>
        <div class="setting-item">
          <label>图标大小</label>
          <el-slider
            v-model="iconSize"
            :min="16"
            :max="64"
            :step="4"
            @input="updateSettings"
          />
          <span class="setting-value">{{ iconSize }}px</span>
        </div>
      </div>
    </div>
    
    <div class="preview-section">
      <h4>实时预览</h4>
      <div class="preview-container">
        <div 
          v-for="domain in previewDomains"
          :key="domain"
          class="preview-item"
        >
          <OptimizedIcon
            :domain="domain"
            :size="iconSize"
            :theme="currentTheme"
            :border-radius="borderRadius"
          />
          <span>{{ domain }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import OptimizedIcon from './OptimizedIcon.vue'

interface Theme {
  value: 'default' | 'modern' | 'glass' | 'minimal'
  name: string
  description: string
  borderRadius: number
}

const themes: Theme[] = [
  {
    value: 'modern',
    name: '现代风格',
    description: '渐变背景，圆润边角，适合现代化设计',
    borderRadius: 8
  },
  {
    value: 'glass',
    name: '玻璃拟态',
    description: '透明质感，毛玻璃效果，时尚前卫',
    borderRadius: 12
  },
  {
    value: 'minimal',
    name: '极简风格',
    description: '简洁线条，清晰边界，专业商务',
    borderRadius: 4
  },
  {
    value: 'default',
    name: '经典风格',
    description: '传统设计，稳定可靠，通用性强',
    borderRadius: 6
  }
]

const previewDomains = [
  'github.com',
  'google.com',
  'apple.com',
  'microsoft.com',
  'figma.com',
  'dribbble.com'
]

const currentTheme = ref<Theme['value']>('modern')
const borderRadius = ref(8)
const iconSize = ref(40)

const emit = defineEmits<{
  themeChange: [theme: Theme['value'], borderRadius: number, size: number]
}>()

const selectTheme = (theme: Theme['value']) => {
  currentTheme.value = theme
  const selectedTheme = themes.find(t => t.value === theme)
  if (selectedTheme) {
    borderRadius.value = selectedTheme.borderRadius
  }
  updateSettings()
}

const updateSettings = () => {
  emit('themeChange', currentTheme.value, borderRadius.value, iconSize.value)
  
  // 保存到本地存储
  localStorage.setItem('icon-theme-settings', JSON.stringify({
    theme: currentTheme.value,
    borderRadius: borderRadius.value,
    iconSize: iconSize.value
  }))
}

// 从本地存储加载设置
const loadSettings = () => {
  try {
    const saved = localStorage.getItem('icon-theme-settings')
    if (saved) {
      const settings = JSON.parse(saved)
      currentTheme.value = settings.theme || 'modern'
      borderRadius.value = settings.borderRadius || 8
      iconSize.value = settings.iconSize || 40
    }
  } catch (error) {
    console.warn('加载图标主题设置失败:', error)
  }
}

onMounted(() => {
  loadSettings()
  updateSettings()
})
</script>

<style lang="scss" scoped>
.icon-theme-selector {
  padding: 20px;
  background: var(--el-bg-color);
  border-radius: 12px;
  border: 1px solid var(--el-border-color);
  
  h3 {
    margin: 0 0 20px 0;
    color: var(--el-text-color-primary);
    font-size: 18px;
  }
  
  h4 {
    margin: 0 0 12px 0;
    color: var(--el-text-color-primary);
    font-size: 14px;
    font-weight: 600;
  }
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 30px;
}

.theme-option {
  padding: 16px;
  border: 2px solid var(--el-border-color-light);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--el-bg-color-page);
  
  &:hover {
    border-color: var(--el-color-primary-light-5);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  &.active {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    
    .theme-info h4 {
      color: var(--el-color-primary);
    }
  }
}

.theme-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 12px;
  background: var(--el-bg-color);
  border-radius: 6px;
  min-height: 60px;
}

.theme-info {
  text-align: center;
  
  h4 {
    margin: 0 0 4px 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
  
  p {
    margin: 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.4;
  }
}

.current-settings {
  margin-bottom: 30px;
  padding: 16px;
  background: var(--el-bg-color-page);
  border-radius: 8px;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  label {
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-regular);
  }
  
  .setting-value {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    text-align: center;
    margin-top: 4px;
  }
}

.preview-section {
  padding: 16px;
  background: var(--el-bg-color-page);
  border-radius: 8px;
}

.preview-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 16px;
}

.preview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--el-bg-color);
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
  
  span {
    font-size: 11px;
    color: var(--el-text-color-secondary);
    text-align: center;
    word-break: break-all;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .theme-grid {
    grid-template-columns: 1fr;
  }
  
  .settings-grid {
    grid-template-columns: 1fr;
  }
  
  .preview-container {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }
}
</style> 