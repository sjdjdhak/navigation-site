/**
 * 网站管理页面
 * 网站数据的增删改查界面
 */

// SiteManager 网站管理页面组件
const SiteManager = {
  name: 'SiteManagerView',
  setup() {
    const { ref, reactive, computed, onMounted } = Vue;
    
    // 响应式数据
    const loading = ref(false);
    const tableData = ref([]);
    const total = ref(0);
    const dialogVisible = ref(false);
    const dialogTitle = ref('');
    const currentSite = ref(null);
    
    // 搜索和分页
    const searchForm = reactive({
      keyword: '',
      category: '',
      featured: ''
    });
    
    const pagination = reactive({
      currentPage: 1,
      pageSize: 10
    });
    
    // 表单数据
    const siteForm = reactive({
      id: '',
      title: '',
      description: '',
      url: '',
      domain: '',
      icon: '',
      tags: [],
      categoryPath: [],
      featured: false
    });
    
    // 表单验证规则
    const rules = reactive({
      title: [
        { required: true, message: '请输入网站标题', trigger: 'blur' }
      ],
      url: [
        { required: true, message: '请输入网站URL', trigger: 'blur' },
        { type: 'url', message: '请输入有效的URL', trigger: 'blur' }
      ],
      description: [
        { required: true, message: '请输入网站描述', trigger: 'blur' }
      ]
    });
    
    const formRef = ref(null);
    const multipleSelection = ref([]);
    
    // 分类选项（模拟数据）
    const categoryOptions = ref([
      { label: '设计工具', value: 'design-tools' },
      { label: '开发资源', value: 'dev-resources' },
      { label: '创意工具', value: 'creative-tools' },
      { label: '效率工具', value: 'productivity' },
      { label: '学习资源', value: 'learning' }
    ]);
    
    // 计算属性
    const filteredData = computed(() => {
      return tableData.value.filter(item => {
        const matchKeyword = !searchForm.keyword || 
          item.title.toLowerCase().includes(searchForm.keyword.toLowerCase()) ||
          item.description.toLowerCase().includes(searchForm.keyword.toLowerCase());
        
        const matchCategory = !searchForm.category || 
          item.categoryPath.includes(searchForm.category);
        
        const matchFeatured = searchForm.featured === '' || 
          item.featured.toString() === searchForm.featured;
        
        return matchKeyword && matchCategory && matchFeatured;
      });
    });
    
    // 方法
    const loadTableData = async () => {
      try {
        loading.value = true;
        
        // 模拟加载数据
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // 模拟网站数据
        tableData.value = [
          {
            id: '1',
            title: 'Figma',
            description: '强大的云端协作设计工具，支持多人实时协作',
            url: 'https://www.figma.com',
            domain: 'figma.com',
            icon: 'https://www.google.com/s2/favicons?domain=figma.com&sz=64',
            tags: ['设计', '协作', 'UI', '原型'],
            categoryPath: ['design-tools'],
            featured: true,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-15'
          },
          {
            id: '2',
            title: 'GitHub',
            description: '全球最大的代码托管平台和开发者社区',
            url: 'https://github.com',
            domain: 'github.com',
            icon: 'https://www.google.com/s2/favicons?domain=github.com&sz=64',
            tags: ['代码', '版本控制', '开源', '协作'],
            categoryPath: ['dev-resources'],
            featured: true,
            createdAt: '2024-01-02',
            updatedAt: '2024-01-16'
          },
          {
            id: '3',
            title: 'Notion',
            description: '集笔记、知识库、项目管理于一体的全能工作空间',
            url: 'https://www.notion.so',
            domain: 'notion.so',
            icon: 'https://www.google.com/s2/favicons?domain=notion.so&sz=64',
            tags: ['笔记', '知识管理', '协作', '模板'],
            categoryPath: ['productivity'],
            featured: false,
            createdAt: '2024-01-03',
            updatedAt: '2024-01-17'
          }
        ];
        
        total.value = tableData.value.length;
        
      } catch (error) {
        console.error('加载数据失败:', error);
        ElMessage.error('加载数据失败');
      } finally {
        loading.value = false;
      }
    };
    
    const handleSearch = () => {
      pagination.currentPage = 1;
      // 这里应该重新加载数据
      console.log('搜索条件:', searchForm);
    };
    
    const handleReset = () => {
      Object.assign(searchForm, {
        keyword: '',
        category: '',
        featured: ''
      });
      handleSearch();
    };
    
    const handleAdd = () => {
      dialogTitle.value = '添加网站';
      currentSite.value = null;
      resetForm();
      dialogVisible.value = true;
    };
    
    const handleEdit = (row) => {
      dialogTitle.value = '编辑网站';
      currentSite.value = row;
      Object.assign(siteForm, row);
      dialogVisible.value = true;
    };
    
    const handleDelete = (row) => {
      ElMessageBox.confirm(
        `确定要删除网站 "${row.title}" 吗？`,
        '确认删除',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        // 这里应该调用删除API
        console.log('删除网站:', row);
        ElMessage.success('删除成功');
        loadTableData();
      }).catch(() => {
        // 用户取消删除
      });
    };
    
    const handleBatchDelete = () => {
      if (multipleSelection.value.length === 0) {
        ElMessage.warning('请选择要删除的网站');
        return;
      }
      
      ElMessageBox.confirm(
        `确定要删除选中的 ${multipleSelection.value.length} 个网站吗？`,
        '批量删除',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        // 这里应该调用批量删除API
        console.log('批量删除网站:', multipleSelection.value);
        ElMessage.success('批量删除成功');
        loadTableData();
      }).catch(() => {
        // 用户取消删除
      });
    };
    
    const handleSelectionChange = (selection) => {
      multipleSelection.value = selection;
    };
    
    const handleSubmit = async () => {
      try {
        const valid = await formRef.value.validate();
        if (!valid) return;
        
        // 这里应该调用保存API
        console.log('保存网站:', siteForm);
        
        ElMessage.success(currentSite.value ? '更新成功' : '添加成功');
        dialogVisible.value = false;
        loadTableData();
        
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
      Object.assign(siteForm, {
        id: '',
        title: '',
        description: '',
        url: '',
        domain: '',
        icon: '',
        tags: [],
        categoryPath: [],
        featured: false
      });
      
      if (formRef.value) {
        formRef.value.resetFields();
      }
    };
    
    const handleUrlChange = () => {
      if (siteForm.url) {
        try {
          const url = new URL(siteForm.url);
          siteForm.domain = url.hostname;
          siteForm.icon = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`;
        } catch (error) {
          console.error('URL解析失败:', error);
        }
      }
    };
    
    const handlePageChange = (page) => {
      pagination.currentPage = page;
      // 这里应该重新加载数据
    };
    
    const handleSizeChange = (size) => {
      pagination.pageSize = size;
      pagination.currentPage = 1;
      // 这里应该重新加载数据
    };
    
    // 生命周期
    onMounted(() => {
      loadTableData();
    });
    
    return {
      loading,
      tableData,
      total,
      dialogVisible,
      dialogTitle,
      currentSite,
      searchForm,
      pagination,
      siteForm,
      rules,
      formRef,
      multipleSelection,
      categoryOptions,
      filteredData,
      loadTableData,
      handleSearch,
      handleReset,
      handleAdd,
      handleEdit,
      handleDelete,
      handleBatchDelete,
      handleSelectionChange,
      handleSubmit,
      handleCancel,
      resetForm,
      handleUrlChange,
      handlePageChange,
      handleSizeChange
    };
  },
  template: `
    <div class="site-manager-view">
      <!-- 页面头部 -->
      <div class="page-header">
        <h1 class="page-title">网站管理</h1>
        <p class="page-description">管理导航站中的所有网站信息</p>
      </div>
      
      <!-- 搜索工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索网站标题或描述"
            style="width: 250px; margin-right: 16px;"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <i class="fas fa-search"></i>
            </template>
          </el-input>
          
          <el-select
            v-model="searchForm.category"
            placeholder="选择分类"
            style="width: 150px; margin-right: 16px;"
            clearable
          >
            <el-option
              v-for="option in categoryOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          
          <el-select
            v-model="searchForm.featured"
            placeholder="是否特色"
            style="width: 120px; margin-right: 16px;"
            clearable
          >
            <el-option label="特色" value="true" />
            <el-option label="普通" value="false" />
          </el-select>
          
          <el-button type="primary" @click="handleSearch">
            <i class="fas fa-search"></i>
            搜索
          </el-button>
          
          <el-button @click="handleReset">
            <i class="fas fa-redo"></i>
            重置
          </el-button>
        </div>
        
        <div class="toolbar-right">
          <el-button type="primary" @click="handleAdd">
            <i class="fas fa-plus"></i>
            添加网站
          </el-button>
          
          <el-button 
            type="danger" 
            :disabled="multipleSelection.length === 0"
            @click="handleBatchDelete"
          >
            <i class="fas fa-trash"></i>
            批量删除
          </el-button>
        </div>
      </div>
      
      <!-- 数据表格 -->
      <div class="table-container">
        <el-table
          :data="filteredData"
          v-loading="loading"
          @selection-change="handleSelectionChange"
          class="site-table"
        >
          <el-table-column type="selection" width="55" />
          
          <el-table-column label="网站信息" min-width="300">
            <template #default="{ row }">
              <div style="display: flex; align-items: center;">
                <img 
                  :src="row.icon" 
                  :alt="row.title"
                  class="site-icon"
                  style="margin-right: 12px;"
                  @error="$event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xMiA4VjE2TTggMTJIMTYiIHN0cm9rZT0iIzk5OTk5OSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+'"
                />
                <div>
                  <div class="site-title">{{ row.title }}</div>
                  <div class="site-description">{{ row.description }}</div>
                  <a :href="row.url" target="_blank" class="site-url">
                    {{ row.url }}
                  </a>
                </div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="标签" width="200">
            <template #default="{ row }">
              <div class="site-tags">
                <el-tag
                  v-for="tag in row.tags"
                  :key="tag"
                  size="small"
                  class="site-tag"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="分类" width="120">
            <template #default="{ row }">
              <el-tag type="info" size="small">
                {{ categoryOptions.find(c => c.value === row.categoryPath[0])?.label || '未分类' }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="特色" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.featured ? 'success' : 'info'" size="small">
                {{ row.featured ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="更新时间" width="120">
            <template #default="{ row }">
              {{ row.updatedAt }}
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button
                  type="primary"
                  size="small"
                  @click="handleEdit(row)"
                >
                  编辑
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  @click="handleDelete(row)"
                >
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 分页 -->
        <div style="margin-top: 16px; text-align: right;">
          <el-pagination
            v-model:current-page="pagination.currentPage"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </div>
      
      <!-- 添加/编辑对话框 -->
      <el-dialog
        v-model="dialogVisible"
        :title="dialogTitle"
        width="600px"
        class="form-dialog"
        :close-on-click-modal="false"
      >
        <el-form
          ref="formRef"
          :model="siteForm"
          :rules="rules"
          label-width="100px"
        >
          <el-form-item label="网站标题" prop="title">
            <el-input v-model="siteForm.title" placeholder="请输入网站标题" />
          </el-form-item>
          
          <el-form-item label="网站URL" prop="url">
            <el-input 
              v-model="siteForm.url" 
              placeholder="请输入网站URL"
              @blur="handleUrlChange"
            />
          </el-form-item>
          
          <el-form-item label="网站描述" prop="description">
            <el-input
              v-model="siteForm.description"
              type="textarea"
              :rows="3"
              placeholder="请输入网站描述"
            />
          </el-form-item>
          
          <el-form-item label="网站图标">
            <el-input v-model="siteForm.icon" placeholder="图标URL（可自动获取）">
              <template #append>
                <img 
                  v-if="siteForm.icon"
                  :src="siteForm.icon"
                  style="width: 20px; height: 20px;"
                  @error="$event.target.style.display = 'none'"
                />
              </template>
            </el-input>
          </el-form-item>
          
          <el-form-item label="所属分类">
            <el-select v-model="siteForm.categoryPath" multiple placeholder="选择分类">
              <el-option
                v-for="option in categoryOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="标签">
            <el-input
              v-model="siteForm.tags"
              placeholder="请输入标签，用逗号分隔"
              @blur="siteForm.tags = siteForm.tags.split(',').map(t => t.trim()).filter(t => t)"
            />
          </el-form-item>
          
          <el-form-item label="特色推荐">
            <el-switch v-model="siteForm.featured" />
          </el-form-item>
        </el-form>
        
        <template #footer>
          <div class="form-actions">
            <el-button @click="handleCancel">取消</el-button>
            <el-button type="primary" @click="handleSubmit">
              {{ currentSite ? '更新' : '添加' }}
            </el-button>
          </div>
        </template>
      </el-dialog>
    </div>
  `
};

// 导出组件
window.SiteManagerView = SiteManager; 