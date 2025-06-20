# 工具集导航站 🧭

一个现代化的个人工具集导航站，用于存储和管理经常使用的网站，支持分类管理和高效浏览。

## ✨ 特性

- 🎨 **现代化设计**: 基于 Fluent Design 风格的清爽界面
- 📱 **响应式布局**: 完美适配桌面端和移动端
- 🔍 **智能搜索**: 实时搜索，支持标题、描述、标签匹配
- 🌓 **主题切换**: 支持明暗主题切换
- 📂 **分类管理**: 左侧抽屉式分类导航，支持嵌套分类
- ⚡ **性能优化**: 
  - 图片懒加载
  - 虚拟滚动
  - 按需加载
- 🛠️ **后台管理**: 完整的网站和分类管理系统
- 🔐 **GitHub 集成**: 基于 GitHub API 的数据存储和版本控制

## 🛠️ 技术栈

### 前端
- **框架**: Vue.js 3 + Vite
- **状态管理**: Pinia
- **路由**: Vue Router
- **样式**: SCSS + CSS 变量
- **构建工具**: Vite

### 后台管理
- **框架**: Vue.js 3 + Element Plus
- **数据存储**: GitHub 仓库 JSON 文件
- **API**: GitHub REST API
- **认证**: GitHub Personal Access Token

### 部署
- **前端**: Vercel / GitHub Pages
- **数据**: GitHub 仓库存储

## 📁 项目结构

```
├── frontend/          # 前端应用
│   ├── src/
│   ├── public/
│   └── package.json
├── admin/            # 后台管理系统
├── data/             # 数据文件
├── scripts/          # 脚本文件
└── docs/             # 文档
```

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/yourusername/navigation-site.git
cd navigation-site
```

### 2. 安装依赖
```bash
cd frontend
npm install
```

### 3. 启动开发服务器
```bash
npm run dev
```

### 4. 构建生产版本
```bash
npm run build
```

## 📖 使用说明

### 前端展示
- 访问主页浏览分类和网站
- 使用搜索框快速查找网站
- 点击右上角切换主题
- 移动端可通过左侧菜单导航

### 后台管理
1. 访问 `/admin` 路径
2. 输入 GitHub Personal Access Token
3. 管理网站和分类数据

### 数据格式
项目使用 JSON 文件存储数据，支持分类管理和网站信息存储。详细数据结构请参考 `需求文档.md`。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 📧 联系

如有问题，请通过 Issue 联系。
