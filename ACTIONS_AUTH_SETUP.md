# GitHub Actions认证系统配置指南

## 🎯 概述

GitHub Actions认证系统提供了一个安全的"伪后端"解决方案，将敏感Token存储在GitHub Secrets中，避免在前端代码中暴露。

## 🔧 配置步骤

### 第1步：设置GitHub Secrets

1. 访问：https://github.com/sjdjdhak/navigation-site/settings/secrets/actions
2. 点击 "New repository secret"
3. 添加以下Secret：
   ```
   Name: ADMIN_TOKEN
   Value: [你的完整权限GitHub Token]
   ```

### 第2步：生成Actions触发Token

1. 访问：https://github.com/settings/personal-access-tokens/new
2. 配置Token：
   - **名称**: `Actions Trigger Token`
   - **过期时间**: `90 days` 或更长
   - **权限**:
     - ✅ actions (必需)
     - ✅ metadata (自动选择)
     - ❌ 其他权限都不选

3. 生成Token并复制

### 第3步：更新 .env 文件

在 `frontend/.env` 文件中添加：

```bash
# GitHub Actions触发Token（只需要actions权限）
VITE_GITHUB_TRIGGER_TOKEN=[你的Actions触发Token]

# 保留原有配置用于向后兼容
VITE_CONFIG_REPO_TOKEN=[你的完整权限GitHub Token]
VITE_CONFIG_REPO_OWNER=sjdjdhak
VITE_CONFIG_REPO_NAME=navigation-site
```

## 🔒 安全优势

- ✅ **主Token安全**: 存储在GitHub Secrets中，不暴露在前端
- ✅ **最小权限**: 触发Token只有actions权限
- ✅ **无服务器成本**: 使用GitHub免费资源
- ✅ **完整审计**: 所有操作都有Actions日志

## 🎮 使用方式

配置完成后，登录页面会显示"Actions认证"选项，这是最安全的认证方式。

## 📊 认证优先级

1. **Actions认证** (最安全)
2. 云端认证
3. 环境变量认证
4. GitHub直连

## 🔧 故障排除

### 常见问题

1. **Token权限不足**
   - 确保Actions触发Token有`actions`权限
   - 确保GitHub Secret中的Token有完整仓库权限

2. **工作流执行失败**
   - 检查GitHub Actions日志
   - 确认工作流文件格式正确

3. **前端无法触发Actions**
   - 检查Token是否正确配置
   - 确认仓库名称和所有者信息正确

### 调试方法

1. 查看浏览器控制台错误信息
2. 检查GitHub Actions执行日志
3. 确认所有环境变量都已正确设置

## 🚀 部署说明

当部署到GitHub Pages时：
- GitHub Secrets会自动可用
- 前端的VITE_GITHUB_TRIGGER_TOKEN会被编译进代码
- 这是安全的，因为触发Token权限极小

## ⚡ 性能说明

- Actions执行时间：通常30-60秒
- 适合管理操作，不适合高频操作
- 有GitHub Actions使用限制（但对个人项目足够） 