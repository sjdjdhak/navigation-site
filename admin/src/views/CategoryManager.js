/**
 * 分类管理页面
 * 分类数据的树形管理界面
 */

// TODO: 实现分类管理页面 

// CategoryManager 分类管理页面组件
const CategoryManager = {
  name: 'CategoryManagerView',
  setup() {
    const { ref, reactive, onMounted } = Vue;
    
    // 响应式数据
    const loading = ref(false);
    const treeData = ref([]);
    const selectedCategory = ref(null);
    const dialogVisible = ref(false);
    const dialogTitle = ref('');
    const currentCategory = ref(null);
    
    // 表单数据
    const categoryForm = reactive({
      id: '',
      name: '',
      icon: '',
      description: '',
      order: 1,
      expanded: true,
      parentId: ''
    });
    
    // 表单验证规则
    const rules = reactive({
      name: [
        { required: true, message: '请输入分类名称', trigger: 'blur' }
      ],
      icon: [
        { required: true, message: '请输入分类图标', trigger: 'blur' }
      ]
    });
    
    const formRef = ref(null);
    const treeRef = ref(null);
    
    // 图标选项
    const iconOptions = ref([
      { label: '设计工具', value: 'fas fa-palette' },
      { label: '开发资源', value: 'fas fa-code' },
      { label: '创意工具', value: 'fas fa-magic' },
      { label: '效率工具', value: 'fas fa-rocket' },
      { label: '学习资源', value: 'fas fa-book' },
      { label: '文件夹', value: 'fas fa-folder' },
      { label: '标签', value: 'fas fa-tag' },
      { label: '星星', value: 'fas fa-star' },
      { label: '心形', value: 'fas fa-heart' },
      { label: '齿轮', value: 'fas fa-cog' }
    ]);
    
    // 方法
    const loadTreeData = async () => {
      try {
        loading.value = true;
        
        // 模拟加载数据
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // 模拟分类树数据
        treeData.value = [
          {
            id: 'design-tools',
            name: '设计工具',
            icon: 'fas fa-palette',
            description: 'UI设计、原型设计、图标资源等设计相关工具',
            order: 1,
            expanded: true,
            children: [
              {
                id: 'ui-design',
                name: 'UI设计',
                icon: 'fas fa-paint-brush',
                description: '界面设计工具和资源',
                order: 1,
                parentId: 'design-tools'
              },
              {
                id: 'prototyping',
                name: '原型设计',
                icon: 'fas fa-sitemap',
                description: '原型设计和交互设计工具',
                order: 2,
                parentId: 'design-tools'
              }
            ]
          },
          {
            id: 'dev-resources',
            name: '开发资源',
            icon: 'fas fa-code',
            description: '编程工具、代码库、API文档等开发资源',
            order: 2,
            expanded: false,
            children: [
              {
                id: 'code-editors',
                name: '代码编辑器',
                icon: 'fas fa-edit',
                description: '各种代码编辑器和IDE',
                order: 1,
                parentId: 'dev-resources'
              },
              {
                id: 'version-control',
                name: '版本控制',
                icon: 'fas fa-code-branch',
                description: 'Git和其他版本控制工具',
                order: 2,
                parentId: 'dev-resources'
              }
            ]
          },
          {
            id: 'productivity',
            name: '效率工具',
            icon: 'fas fa-rocket',
            description: '提高工作效率的各种工具和应用',
            order: 3,
            expanded: false,
            children: []
          }
        ];
        
      } catch (error) {
        console.error('加载分类数据失败:', error);
        ElMessage.error('加载数据失败');
      } finally {
        loading.value = false;
      }
    };
    
    const handleNodeClick = (data) => {
      selectedCategory.value = data;
      console.log('选中分类:', data);
    };
    
    const handleAddRoot = () => {
      dialogTitle.value = '添加根分类';
      currentCategory.value = null;
      resetForm();
      categoryForm.parentId = '';
      dialogVisible.value = true;
    };
    
    const handleAddChild = (node, data) => {
      dialogTitle.value = '添加子分类';
      currentCategory.value = null;
      resetForm();
      categoryForm.parentId = data.id;
      dialogVisible.value = true;
    };
    
    const handleEdit = (node, data) => {
      dialogTitle.value = '编辑分类';
      currentCategory.value = data;
      Object.assign(categoryForm, data);
      dialogVisible.value = true;
    };
    
    const handleDelete = (node, data) => {
      ElMessageBox.confirm(
        `确定要删除分类 "${data.name}" 吗？${data.children && data.children.length > 0 ? '删除后其子分类也将被删除。' : ''}`,
        '确认删除',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        // 这里应该调用删除API
        console.log('删除分类:', data);
        ElMessage.success('删除成功');
        loadTreeData();
      }).catch(() => {
        // 用户取消删除
      });
    };
    
    const handleSubmit = async () => {
      try {
        const valid = await formRef.value.validate();
        if (!valid) return;
        
        // 这里应该调用保存API
        console.log('保存分类:', categoryForm);
        
        ElMessage.success(currentCategory.value ? '更新成功' : '添加成功');
        dialogVisible.value = false;
        loadTreeData();
        
      } catch (error) {
        console.error('保存失败:', error);
        ElMessage.error('保存失败');
      }
    };
    
    const handleCancel = () => {
      dialogVisible.value = false;
      resetForm();
    };
    
    const resetForm = () => {
      Object.assign(categoryForm, {
        id: '',
        name: '',
        icon: '',
        description: '',
        order: 1,
        expanded: true,
        parentId: ''
      });
      
      if (formRef.value) {
        formRef.value.resetFields();
      }
    };
    
    const handleDragStart = (node, ev) => {
      console.log('开始拖拽:', node);
    };
    
    const handleDragEnter = (draggingNode, dropNode, dropType, ev) => {
      console.log('拖拽进入:', draggingNode, dropNode, dropType);
    };
    
    const handleDragLeave = (draggingNode, dropNode, dropType, ev) => {
      console.log('拖拽离开:', draggingNode, dropNode, dropType);
    };
    
    const handleDragOver = (draggingNode, dropNode, dropType, ev) => {
      console.log('拖拽悬停:', draggingNode, dropNode, dropType);
    };
    
    const handleDragEnd = (draggingNode, dropNode, dropType, ev) => {
      console.log('拖拽结束:', draggingNode, dropNode, dropType);
      if (dropType !== 'none') {
        ElMessage.success('分类顺序已更新');
        // 这里应该调用API保存新的顺序
      }
    };
    
    const allowDrop = (draggingNode, dropNode, type) => {
      // 可以根据业务需求限制拖拽规则
      return true;
    };
    
    const allowDrag = (draggingNode) => {
      // 可以根据业务需求限制哪些节点可以拖拽
      return true;
    };
    
    // 生命周期
    onMounted(() => {
      loadTreeData();
    });
    
    return {
      loading,
      treeData,
      selectedCategory,
      dialogVisible,
      dialogTitle,
      currentCategory,
      categoryForm,
      rules,
      formRef,
      treeRef,
      iconOptions,
      loadTreeData,
      handleNodeClick,
      handleAddRoot,
      handleAddChild,
      handleEdit,
      handleDelete,
      handleSubmit,
      handleCancel,
      resetForm,
      handleDragStart,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDragEnd,
      allowDrop,
      allowDrag
    };
  },
  template: `
    <div class="category-manager-view">
      <!-- 页面头部 -->
      <div class="page-header">
        <h1 class="page-title">分类管理</h1>
        <p class="page-description">管理导航站的分类结构，支持拖拽排序</p>
      </div>
      
      <!-- 主要内容 -->
      <div class="category-layout">
        <!-- 分类树面板 -->
        <div class="category-tree-panel">
          <div class="category-tree-header">
            <h3>分类结构</h3>
            <el-button type="primary" size="small" @click="handleAddRoot">
              <i class="fas fa-plus"></i>
              添加根分类
            </el-button>
          </div>
          
          <div class="category-tree-content" v-loading="loading">
            <el-tree
              ref="treeRef"
              :data="treeData"
              :props="{ children: 'children', label: 'name' }"
              node-key="id"
              :default-expand-all="false"
              :expand-on-click-node="false"
              :draggable="true"
              :allow-drop="allowDrop"
              :allow-drag="allowDrag"
              @node-click="handleNodeClick"
              @node-drag-start="handleDragStart"
              @node-drag-enter="handleDragEnter"
              @node-drag-leave="handleDragLeave"
              @node-drag-over="handleDragOver"
              @node-drag-end="handleDragEnd"
              class="category-tree"
            >
              <template #default="{ node, data }">
                <div class="custom-tree-node">
                  <div class="node-label">
                    <i :class="data.icon" class="node-icon"></i>
                    <span>{{ data.name }}</span>
                    <el-tag v-if="data.children && data.children.length > 0" size="small" type="info">
                      {{ data.children.length }}
                    </el-tag>
                  </div>
                  <div class="node-actions">
                    <el-button
                      type="text"
                      size="small"
                      @click.stop="handleAddChild(node, data)"
                    >
                      <i class="fas fa-plus"></i>
                    </el-button>
                    <el-button
                      type="text"
                      size="small"
                      @click.stop="handleEdit(node, data)"
                    >
                      <i class="fas fa-edit"></i>
                    </el-button>
                    <el-button
                      type="text"
                      size="small"
                      @click.stop="handleDelete(node, data)"
                    >
                      <i class="fas fa-trash"></i>
                    </el-button>
                  </div>
                </div>
              </template>
            </el-tree>
          </div>
        </div>
        
        <!-- 分类详情面板 -->
        <div class="category-detail-panel">
          <div class="category-detail-header">
            <h3>分类详情</h3>
          </div>
          
          <div class="category-detail-content">
            <div v-if="selectedCategory">
              <el-descriptions :column="1" border>
                <el-descriptions-item label="分类名称">
                  <div style="display: flex; align-items: center;">
                    <i :class="selectedCategory.icon" style="margin-right: 8px; color: var(--primary-color);"></i>
                    {{ selectedCategory.name }}
                  </div>
                </el-descriptions-item>
                <el-descriptions-item label="分类ID">
                  {{ selectedCategory.id }}
                </el-descriptions-item>
                <el-descriptions-item label="描述">
                  {{ selectedCategory.description || '暂无描述' }}
                </el-descriptions-item>
                <el-descriptions-item label="排序">
                  {{ selectedCategory.order }}
                </el-descriptions-item>
                <el-descriptions-item label="子分类数量">
                  {{ selectedCategory.children ? selectedCategory.children.length : 0 }}
                </el-descriptions-item>
                <el-descriptions-item label="默认展开">
                  <el-tag :type="selectedCategory.expanded ? 'success' : 'info'">
                    {{ selectedCategory.expanded ? '是' : '否' }}
                  </el-tag>
                </el-descriptions-item>
              </el-descriptions>
              
              <div style="margin-top: 24px;">
                <el-button type="primary" @click="handleEdit(null, selectedCategory)">
                  <i class="fas fa-edit"></i>
                  编辑分类
                </el-button>
                <el-button type="success" @click="handleAddChild(null, selectedCategory)">
                  <i class="fas fa-plus"></i>
                  添加子分类
                </el-button>
                <el-button type="danger" @click="handleDelete(null, selectedCategory)">
                  <i class="fas fa-trash"></i>
                  删除分类
                </el-button>
              </div>
            </div>
            
            <div v-else class="empty-state">
              <i class="fas fa-folder-open"></i>
              <div class="empty-title">请选择分类</div>
              <div class="empty-description">
                点击左侧分类树中的分类查看详细信息
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 添加/编辑对话框 -->
      <el-dialog
        v-model="dialogVisible"
        :title="dialogTitle"
        width="500px"
        class="form-dialog"
        :close-on-click-modal="false"
      >
        <el-form
          ref="formRef"
          :model="categoryForm"
          :rules="rules"
          label-width="100px"
        >
          <el-form-item label="分类名称" prop="name">
            <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
          </el-form-item>
          
          <el-form-item label="分类图标" prop="icon">
            <el-select v-model="categoryForm.icon" placeholder="选择图标" style="width: 100%;">
              <el-option
                v-for="option in iconOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              >
                <div style="display: flex; align-items: center;">
                  <i :class="option.value" style="margin-right: 8px;"></i>
                  {{ option.label }}
                </div>
              </el-option>
            </el-select>
          </el-form-item>
          
          <el-form-item label="分类描述">
            <el-input
              v-model="categoryForm.description"
              type="textarea"
              :rows="3"
              placeholder="请输入分类描述"
            />
          </el-form-item>
          
          <el-form-item label="排序">
            <el-input-number
              v-model="categoryForm.order"
              :min="1"
              :max="999"
              style="width: 100%;"
            />
          </el-form-item>
          
          <el-form-item label="默认展开">
            <el-switch v-model="categoryForm.expanded" />
          </el-form-item>
        </el-form>
        
        <template #footer>
          <div class="form-actions">
            <el-button @click="handleCancel">取消</el-button>
            <el-button type="primary" @click="handleSubmit">
              {{ currentCategory ? '更新' : '添加' }}
            </el-button>
          </div>
        </template>
      </el-dialog>
    </div>
  `
};

// 导出组件
window.CategoryManagerView = CategoryManager; 