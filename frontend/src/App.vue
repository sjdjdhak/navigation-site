<template>
  <div id="app">
    <!-- 全局加载进度指示器 -->
    <Teleport to="body">
      <div class="global-loading-container">
        <LoadingProgress :compact="true" :auto-hide="true" />
      </div>
    </Teleport>
    
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { useDataStore } from '@/stores/data'
import LoadingProgress from '@/components/LoadingProgress.vue'

const appStore = useAppStore()
const dataStore = useDataStore()

onMounted(async () => {
  // 初始化主题
  appStore.initializeTheme()
  
  // 初始化数据，使用渐进式预加载策略
  try {
    await dataStore.initialize('progressive')
  } catch (error) {
    console.error('Failed to initialize data:', error)
  }
})
</script>

<style lang="scss">
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.global-loading-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  max-width: 350px;
  
  @media (max-width: 768px) {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
}
</style> 