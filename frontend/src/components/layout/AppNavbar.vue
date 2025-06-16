<template>
  <nav class="navbar">
    <div class="navbar-left">
      <div class="logo">
        <i class="fas fa-compass logo-icon"></i>
        <span class="logo-text">导航站</span>
      </div>
    </div>
    
    <ul class="nav-links">
      <li>
        <router-link to="/" class="nav-link" active-class="active">
          导航
        </router-link>
      </li>
      <li>
        <a href="#" class="nav-link">博客</a>
      </li>
      <li>
        <a href="#" class="nav-link">作品集</a>
      </li>
      <li>
        <a href="#" class="nav-link">关于我</a>
      </li>
    </ul>
    
    <div class="nav-actions">
      <button 
        class="theme-toggle" 
        @click="appStore.toggleTheme"
        :title="appStore.isDarkTheme ? '切换到浅色主题' : '切换到深色主题'"
      >
        <i :class="appStore.isDarkTheme ? 'fas fa-sun' : 'fas fa-moon'"></i>
      </button>
      
      <button 
        class="menu-toggle md:hidden" 
        @click="appStore.toggleSidebar"
        title="打开菜单"
      >
        <i class="fas fa-bars"></i>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
</script>

<style lang="scss" scoped>
.navbar {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: var(--navbar-height);
  @include glass-effect;
  box-shadow: 0 2px 8px var(--shadow);
  z-index: 1000;
}

.navbar-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: inherit;
}

.logo-icon {
  font-size: 24px;
  color: var(--primary);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-light);
  border-radius: 50%;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.nav-links {
  display: flex;
  gap: 32px;
  list-style: none;
  
  @media (max-width: 768px) {
    display: none;
  }
}

.nav-link {
  text-decoration: none;
  color: var(--text-secondary);
  font-weight: 500;
  padding: 8px 0;
  transition: var(--transition);
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 2px;
    background-color: var(--primary);
    border-radius: 2px;
    transition: width 0.3s ease;
  }
  
  &:hover {
    color: var(--text-primary);
    
    &::after {
      width: 100%;
    }
  }
  
  &.active {
    color: var(--primary);
    font-weight: 600;
    
    &::after {
      width: 100%;
    }
  }
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.theme-toggle {
  @include fluent-button;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 18px;
  color: var(--text-secondary);
  
  &:hover {
    color: var(--text-primary);
  }
}

.menu-toggle {
  @include fluent-button;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 20px;
  color: var(--text-primary);
  
  @media (min-width: 769px) {
    display: none;
  }
}
</style> 