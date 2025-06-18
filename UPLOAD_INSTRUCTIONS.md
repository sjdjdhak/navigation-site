# 📋 GitHub 上传操作指南

由于终端工具暂时无法使用，请按以下步骤在GitHub网页上手动更新代码：

## 🎯 第一步：访问GitHub仓库
1. 打开浏览器访问：https://github.com/sjdjdhak/navigation-site
2. 导航到：`frontend/src/admin/components/CloudLoginForm.vue`

## 🔧 第二步：编辑文件
1. 点击 `CloudLoginForm.vue` 文件
2. 点击右上角的编辑按钮（铅笔图标）
3. **删除从 `<ConfigDiagnostic />` 这一行**
4. **删除 `import ConfigDiagnostic from './ConfigDiagnostic.vue'` 这一行**

## 💾 第三步：提交更改
1. 滚动到页面底部
2. 在 "Commit changes" 区域输入提交信息：
   ```
   fix: 移除诊断组件引用，简化登录页面
   ```
3. 点击 "Commit changes" 按钮

## 🚀 第四步：等待部署
1. 访问 Actions 页面等待构建完成（约2-3分钟）
2. 构建完成后访问登录页面测试

## 🔍 第五步：检查状态
访问：https://sjdjdhak.github.io/navigation-site/admin/login
- 应该不再显示"配置仓库未设置"错误
- 连接状态应该显示"已连接"

## 📋 后续如果需要诊断
如果还是显示"未连接"，我们再添加内联的诊断功能。

---
**注意**：只需要删除这两行引用ConfigDiagnostic的代码，保留其他所有内容不变。 