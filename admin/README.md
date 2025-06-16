# 工具集导航站后台管理系统

基于 Vue 3 + Element Plus 构建的现代化后台管理界面，用于管理工具集导航站的数据。

## 功能特性

### 🎨 界面设计
- 现代化的 Fluent Design 风格界面
- 响应式设计，支持移动端访问
- 明暗主题切换
- 优雅的动画效果和交互体验

### 📊 仪表盘
- 数据统计概览（网站数量、分类数量、标签数量）
- 最近操作记录
- 快捷操作入口
- 数据趋势图表（开发中）

### 🌐 网站管理
- 网站信息的增删改查
- 批量操作支持
- 实时搜索和筛选
- 自动获取网站图标
- 标签和分类管理

### 📁 分类管理
- 树形结构展示
- 拖拽排序支持
- 嵌套分类管理
- 分类详情编辑

### ⚙️ 系统设置
- GitHub API 配置
- 主题和语言设置
- 数据备份和恢复
- 系统参数配置

## 技术栈

- **前端框架**: Vue 3 (Composition API)
- **UI组件库**: Element Plus
- **路由管理**: Vue Router 4
- **图标库**: Font Awesome 6
- **数据存储**: GitHub API + JSON 文件
- **构建方式**: 模块化开发 + 单文件部署

## 快速开始

### 1. 准备工作

1. 创建 GitHub 仓库用于存储数据
2. 生成 GitHub Personal Access Token
   - 访问 [GitHub Settings > Tokens](https://github.com/settings/tokens)
   - 创建新的 Token，授予仓库读写权限

### 2. 部署方式

#### 方式一：GitHub Pages 部署
1. 将整个 `admin` 目录上传到 GitHub 仓库
2. 在仓库设置中启用 GitHub Pages
3. 访问 `https://username.github.io/repository/admin/`

#### 方式二：本地开发
1. 使用任意 HTTP 服务器运行
```bash
# 使用 Python
python -m http.server 8080

# 使用 Node.js
npx serve .

# 使用 PHP
php -S localhost:8080
```

### 3. 初始配置

1. 打开后台管理界面
2. 输入 GitHub Token 和仓库地址
3. 测试连接确保配置正确
4. 开始创建分类和添加网站

## 目录结构

```
admin/
├── index.html              # 主入口文件
├── src/
│   ├── components/         # 组件目录
│   │   └── layout/         # 布局组件
│   │       ├── Header.js   # 头部导航
│   │       ├── Sidebar.js  # 侧边栏
│   │       └── Layout.js   # 主布局
│   ├── views/              # 页面组件
│   │   ├── Login.js        # 登录页面
│   │   ├── Dashboard.js    # 仪表盘
│   │   ├── SiteManager.js  # 网站管理
│   │   ├── CategoryManager.js # 分类管理
│   │   └── Settings.js     # 系统设置
│   ├── config/             # 配置文件
│   │   └── routes.js       # 路由配置
│   ├── styles/             # 样式文件
│   │   ├── variables.css   # CSS变量
│   │   ├── components.css  # 组件样式
│   │   └── pages.css       # 页面样式
│   └── main.js             # 应用入口
└── README.md               # 说明文档
```

## 使用说明

### 登录认证
- 使用 GitHub Personal Access Token 进行认证
- 支持记住登录状态
- 自动检测 Token 有效性

### 网站管理
- 支持批量添加、编辑、删除网站
- 自动获取网站图标和域名信息
- 支持标签和分类归属
- 实时搜索和筛选功能

### 分类管理
- 树形结构展示分类层级
- 支持拖拽调整分类顺序
- 可设置分类图标和描述
- 支持无限层级嵌套

### 数据同步
- 所有数据变更自动同步到 GitHub
- 支持版本控制和历史记录
- 可配置自动同步间隔
- 支持数据导入导出

## 浏览器支持

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## 开发计划

- [ ] 批量导入导出功能
- [ ] 数据统计图表
- [ ] 网站截图预览
- [ ] 多语言支持
- [ ] 插件系统
- [ ] API 接口文档

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目。

## 联系方式

如有问题或建议，请通过 GitHub Issues 联系。 