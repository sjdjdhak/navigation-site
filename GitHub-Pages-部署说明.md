# GitHub Pages 部署说明

## 问题说明

部署到 GitHub Pages 后显示"未连接"，需要设置 GitHub Secrets。

## 解决步骤

### 1. 设置 Repository Secrets

进入仓库 Settings → Secrets and variables → Actions

添加以下 4 个 Secrets：

1. `VITE_CONFIG_REPO_TOKEN` - 您的 GitHub Token
2. `VITE_CONFIG_REPO_OWNER` - 仓库所有者用户名
3. `VITE_CONFIG_REPO_NAME` - 仓库名称
4. `VITE_CONFIG_REPO_BRANCH` - 分支名（通常是 main）

### 2. 重新部署

设置完成后，GitHub Actions 会自动重新部署。

### 3. 验证

访问您的站点，检查登录页面的连接状态。

## 登录信息

- 用户名: admin
- 密码: hello123 