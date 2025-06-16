<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { useDataStore } from '@/stores/data'

const appStore = useAppStore()
const dataStore = useDataStore()

onMounted(async () => {
  // 初始化主题
  appStore.initializeTheme()
  
  // 初始化数据
  try {
    await dataStore.initialize()
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
</style> 