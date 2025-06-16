# 导航站后台管理系统

## 功能概述

导航站后台管理系统是一个基于 Vue 3 + Element Plus 的现代化数据管理平台，支持通过 GitHub API 管理导航站的网站数据。

## 主要功能

### 🔐 认证系统
- **测试模式**: 本地开发测试，使用内置账号密码
- **GitHub模式**: 连接GitHub仓库，使用Personal Access Token认证
- 自动认证状态检查和会话管理
- 安全的Token存储和管理

### 🌐 网站管理
- **增删改查**: 完整的网站信息CRUD操作
- **批量操作**: 支持批量删除网站
- **分类管理**: 多级分类结构，支持拖拽排序
- **搜索筛选**: 实时搜索和分类筛选
- **数据验证**: 表单验证和数据完整性检查
- **图标管理**: 自动获取网站图标，支持手动刷新

### 📊 数据统计
- **仪表盘**: 网站总数、分类数量、特色推荐等统计信息
- **活动记录**: 最近操作历史
- **实时更新**: 数据自动刷新和缓存管理

### ⚙️ 系统功能
- **响应式设计**: 适配不同屏幕尺寸
- **现代化UI**: 基于Element Plus的美观界面
- **错误处理**: 完善的错误提示和异常处理
- **性能优化**: 数据缓存、懒加载、分页等

## 技术架构

### 前端技术栈
- **框架**: Vue 3 + TypeScript
- **UI组件**: Element Plus
- **路由**: Vue Router 4
- **构建**: Vite
- **样式**: SCSS

### 数据存储
- **GitHub仓库**: 使用GitHub作为数据存储后端
- **JSON文件**: 结构化的网站数据存储
- **版本控制**: 所有数据变更都有Git提交记录

### 服务架构
```
services/
├── github-api.ts      # GitHub API封装
├── data-service.ts    # 数据操作服务
└── auth-service.ts    # 认证管理服务
```

## 快速开始

### 1. 安装依赖

```bash
cd frontend
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 访问后台管理

访问 `http://localhost:5173/admin/login` 进入登录页面。

### 4. 登录方式

#### 测试模式（推荐用于开发）
- 用户名: `admin`
- 密码: `123456`

#### GitHub模式（用于生产）
1. 创建GitHub Personal Access Token
2. 确保Token具有以下权限：
   - `repo` - 仓库访问权限
   - `contents:write` - 文件读写权限
   - `metadata:read` - 仓库元数据读取权限

## GitHub配置

### 创建Personal Access Token

1. 访问 [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. 点击 "Generate new token"
3. 选择权限：
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
4. 复制生成的Token

### 配置仓库信息

在登录页面填写：
- **GitHub用户名**: 您的GitHub用户名或组织名
- **仓库名称**: 存储导航数据的仓库名
- **分支名称**: 数据存储分支（通常为main）
- **Access Token**: 上面创建的Personal Access Token

## 数据结构

### 分类配置 (categories.json)
```json
{
  "version": "1.0",
  "lastUpdated": "2024-01-01T00:00:00Z",
  "config": {
    "defaultExpanded": true,
    "showCounts": true,
    "showIcons": true
  },
  "categories": [
    {
      "id": "design-tools",
      "name": "设计工具",
      "icon": "fas fa-palette",
      "description": "UI设计、原型设计等",
      "order": 1,
      "children": [...]
    }
  ]
}
```

### 网站数据 (design-tools.json)
```json
[
  {
    "id": "figma",
    "title": "Figma",
    "description": "强大的云端协作设计工具",
    "url": "https://www.figma.com",
    "domain": "figma.com",
    "icon": "https://www.google.com/s2/favicons?domain=figma.com&sz=64",
    "tags": ["设计", "协作", "UI"],
    "categoryPath": ["design-tools", "ui-design"],
    "featured": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

## 页面功能

### 🏠 仪表盘 (/admin/dashboard)
- 显示网站总数、分类数量等统计信息
- 快速操作入口
- 最近活动记录

### 🌐 网站管理 (/admin/sites)
- 网站列表展示，支持搜索和筛选
- 添加/编辑网站信息
- 批量删除操作
- 分页和排序功能

### 📁 分类管理 (/admin/categories)
- 分类树形结构管理
- 添加/编辑/删除分类
- 拖拽排序功能

### ⚙️ 系统设置 (/admin/settings)
- GitHub配置管理
- 系统参数设置
- 数据备份和恢复

## 开发指南

### 组件结构
```
admin/
├── components/          # 组件库
│   ├── SiteForm.vue    # 网站表单组件
│   └── LoginForm.vue   # 登录表单组件
├── views/              # 页面组件
│   ├── AdminLogin.vue  # 登录页面
│   ├── AdminDashboard.vue # 仪表盘
│   ├── AdminSites.vue  # 网站管理
│   └── AdminSettings.vue # 系统设置
├── services/           # 服务层
├── layout/            # 布局组件
└── router/            # 路由配置
```

### 添加新功能

1. **创建服务**: 在 `services/` 目录添加新的服务类
2. **创建组件**: 在 `components/` 或 `views/` 添加Vue组件
3. **配置路由**: 在 `router/index.ts` 添加路由配置
4. **更新菜单**: 在 `AdminLayout.vue` 更新侧边栏菜单

### 数据服务API

```typescript
// 获取所有网站
const sites = await dataService.getAllSites()

// 添加网站
const newSite = await dataService.addSite(siteData)

// 更新网站
const updatedSite = await dataService.updateSite(id, updates)

// 删除网站
await dataService.deleteSite(id)

// 搜索网站
const results = await dataService.searchSites(query)
```

## 部署指南

### 生产环境部署

1. **构建项目**
```bash
npm run build
```

2. **部署到GitHub Pages**
- 将构建文件部署到 `gh-pages` 分支
- 配置自定义域名（可选）

3. **配置GitHub Token**
- 使用Fine-grained Token限制仓库访问
- 设置合适的过期时间
- 定期更新Token

### 安全注意事项

- ✅ Token仅存储在浏览器本地
- ✅ 支持Token过期检测
- ✅ 最小权限原则
- ✅ 操作日志记录
- ❌ 不要在代码中硬编码Token
- ❌ 不要使用过于宽泛的权限

## 故障排除

### 常见问题

#### 1. Token验证失败
- 检查Token是否正确复制
- 确认Token权限是否足够
- 验证仓库名称和用户名

#### 2. 数据加载失败
- 检查网络连接
- 确认GitHub API限制
- 查看浏览器开发者工具错误信息

#### 3. 数据保存失败
- 确认Token具有写入权限
- 检查数据格式是否正确
- 验证分支名称

### 调试技巧

1. **开启浏览器开发者工具**
2. **查看Network标签页**：观察API请求和响应
3. **查看Console标签页**：查看错误日志
4. **使用测试模式**：在开发时使用测试模式避免API限制

## 更新日志

### v1.0.0
- ✅ 完整的网站管理功能
- ✅ GitHub API集成
- ✅ 响应式用户界面
- ✅ 数据验证和错误处理
- ✅ 批量操作支持
- ✅ 搜索和筛选功能

## 技术支持

如果您在使用过程中遇到问题，可以：

1. 查看浏览器开发者工具的错误信息
2. 检查GitHub Token权限设置
3. 确认网络连接和防火墙设置
4. 参考上述故障排除指南

---

🎉 现在您可以开始使用完善的网站管理功能来管理您的导航站数据了！ 