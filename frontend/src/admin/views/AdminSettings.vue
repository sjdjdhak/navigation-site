<template>
  <div class="admin-settings">
    <div class="page-header">
      <h1>系统设置</h1>
      <p>配置系统参数和选项</p>
    </div>
    
    <div class="content-placeholder">
      <i class="fas fa-cog"></i>
      <h2>系统设置功能</h2>
      <p>此页面正在开发中，敬请期待...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// 系统设置页面
</script>

<style lang="scss" scoped>
.admin-settings {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 30px;
  
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

.content-placeholder {
  background: white;
  border-radius: 8px;
  padding: 60px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  i {
    font-size: 64px;
    color: #ddd;
    margin-bottom: 20px;
  }
  
  h2 {
    margin: 0 0 12px 0;
    font-size: 24px;
    color: #333;
  }
  
  p {
    margin: 0;
    color: #666;
    font-size: 16px;
  }
}
</style> 