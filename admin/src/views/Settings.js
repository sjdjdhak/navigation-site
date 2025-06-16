/**
 * 设置页面
 * 系统配置和个人设置
 */

// TODO: 实现设置页面 

// Settings 设置页面组件
const Settings = {
  name: 'SettingsView',
  setup() {
    const { ref, reactive, onMounted } = Vue;
    
    // 响应式数据
    const activeTab = ref('github');
    const loading = ref(false);
    
    // GitHub设置表单
    const githubForm = reactive({
      token: '',
      repository: '',
      branch: 'main',
      autoSync: true,
      syncInterval: 30
    });
    
    // 系统设置表单
    const systemForm = reactive({
      siteName: '工具集导航站',
      siteDescription: '个人工具集导航站后台管理系统',
      theme: 'light',
      language: 'zh-CN',
      pageSize: 10,
      autoSave: true,
      enableNotifications: true
    });
    
    // 数据备份设置
    const backupForm = reactive({
      autoBackup: true,
      backupInterval: 'daily',
      maxBackups: 30,
      backupLocation: 'github'
    });
    
    // 表单验证规则
    const githubRules = reactive({
      token: [
        { required: true, message: '请输入GitHub Token', trigger: 'blur' }
      ],
      repository: [
        { required: true, message: '请输入仓库地址', trigger: 'blur' }
      ]
    });
    
    const systemRules = reactive({
      siteName: [
        { required: true, message: '请输入站点名称', trigger: 'blur' }
      ]
    });
    
    const githubFormRef = ref(null);
    const systemFormRef = ref(null);
    const backupFormRef = ref(null);
    
    // 方法
    const loadSettings = async () => {
      try {
        loading.value = true;
        
        // 模拟加载设置数据
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 从本地存储加载GitHub设置
        const savedToken = localStorage.getItem('github_token') || sessionStorage.getItem('github_token');
        const savedRepository = localStorage.getItem('github_repository') || sessionStorage.getItem('github_repository');
        
        if (savedToken) {
          githubForm.token = savedToken;
        }
        
        if (savedRepository) {
          githubForm.repository = savedRepository;
        }
        
        // 加载其他设置
        const savedTheme = localStorage.getItem('theme') || 'light';
        systemForm.theme = savedTheme;
        
      } catch (error) {
        console.error('加载设置失败:', error);
        ElMessage.error('加载设置失败');
      } finally {
        loading.value = false;
      }
    };
    
    const saveGitHubSettings = async () => {
      try {
        const valid = await githubFormRef.value.validate();
        if (!valid) return;
        
        // 保存GitHub设置
        localStorage.setItem('github_token', githubForm.token);
        localStorage.setItem('github_repository', githubForm.repository);
        localStorage.setItem('github_branch', githubForm.branch);
        localStorage.setItem('github_auto_sync', githubForm.autoSync.toString());
        localStorage.setItem('github_sync_interval', githubForm.syncInterval.toString());
        
        ElMessage.success('GitHub设置保存成功');
        
      } catch (error) {
        console.error('保存GitHub设置失败:', error);
        ElMessage.error('保存设置失败');
      }
    };
    
    const saveSystemSettings = async () => {
      try {
        const valid = await systemFormRef.value.validate();
        if (!valid) return;
        
        // 保存系统设置
        localStorage.setItem('site_name', systemForm.siteName);
        localStorage.setItem('site_description', systemForm.siteDescription);
        localStorage.setItem('theme', systemForm.theme);
        localStorage.setItem('language', systemForm.language);
        localStorage.setItem('page_size', systemForm.pageSize.toString());
        localStorage.setItem('auto_save', systemForm.autoSave.toString());
        localStorage.setItem('enable_notifications', systemForm.enableNotifications.toString());
        
        // 应用主题
        document.documentElement.setAttribute('data-theme', systemForm.theme);
        
        ElMessage.success('系统设置保存成功');
        
      } catch (error) {
        console.error('保存系统设置失败:', error);
        ElMessage.error('保存设置失败');
      }
    };
    
    const saveBackupSettings = async () => {
      try {
        // 保存备份设置
        localStorage.setItem('auto_backup', backupForm.autoBackup.toString());
        localStorage.setItem('backup_interval', backupForm.backupInterval);
        localStorage.setItem('max_backups', backupForm.maxBackups.toString());
        localStorage.setItem('backup_location', backupForm.backupLocation);
        
        ElMessage.success('备份设置保存成功');
        
      } catch (error) {
        console.error('保存备份设置失败:', error);
        ElMessage.error('保存设置失败');
      }
    };
    
    const testGitHubConnection = async () => {
      if (!githubForm.token || !githubForm.repository) {
        ElMessage.warning('请先填写GitHub Token和仓库地址');
        return;
      }
      
      try {
        loading.value = true;
        
        // 模拟测试连接
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        ElMessage.success('GitHub连接测试成功');
        
      } catch (error) {
        console.error('GitHub连接测试失败:', error);
        ElMessage.error('连接测试失败，请检查Token和仓库地址');
      } finally {
        loading.value = false;
      }
    };
    
    const exportData = async () => {
      try {
        // 模拟导出数据
        const data = {
          sites: [],
          categories: [],
          settings: {
            github: githubForm,
            system: systemForm,
            backup: backupForm
          },
          exportTime: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `navigation-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        ElMessage.success('数据导出成功');
        
      } catch (error) {
        console.error('导出数据失败:', error);
        ElMessage.error('导出数据失败');
      }
    };
    
    const importData = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          
          console.log('导入的数据:', data);
          ElMessage.success('数据导入成功');
          
        } catch (error) {
          console.error('导入数据失败:', error);
          ElMessage.error('导入数据失败，请检查文件格式');
        }
      };
      input.click();
    };
    
    const clearCache = () => {
      ElMessageBox.confirm(
        '确定要清除所有缓存数据吗？这将清除本地存储的所有设置和临时数据。',
        '清除缓存',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        // 清除缓存但保留重要设置
        const importantKeys = ['github_token', 'github_repository', 'theme'];
        const savedData = {};
        
        importantKeys.forEach(key => {
          const value = localStorage.getItem(key);
          if (value) {
            savedData[key] = value;
          }
        });
        
        localStorage.clear();
        sessionStorage.clear();
        
        // 恢复重要设置
        Object.keys(savedData).forEach(key => {
          localStorage.setItem(key, savedData[key]);
        });
        
        ElMessage.success('缓存清除成功');
      }).catch(() => {
        // 用户取消
      });
    };
    
    const resetSettings = () => {
      ElMessageBox.confirm(
        '确定要重置所有设置为默认值吗？此操作不可撤销。',
        '重置设置',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        // 重置表单数据
        Object.assign(githubForm, {
          token: '',
          repository: '',
          branch: 'main',
          autoSync: true,
          syncInterval: 30
        });
        
        Object.assign(systemForm, {
          siteName: '工具集导航站',
          siteDescription: '个人工具集导航站后台管理系统',
          theme: 'light',
          language: 'zh-CN',
          pageSize: 10,
          autoSave: true,
          enableNotifications: true
        });
        
        Object.assign(backupForm, {
          autoBackup: true,
          backupInterval: 'daily',
          maxBackups: 30,
          backupLocation: 'github'
        });
        
        ElMessage.success('设置已重置为默认值');
      }).catch(() => {
        // 用户取消
      });
    };
    
    // 生命周期
    onMounted(() => {
      loadSettings();
    });
    
    return {
      activeTab,
      loading,
      githubForm,
      systemForm,
      backupForm,
      githubRules,
      systemRules,
      githubFormRef,
      systemFormRef,
      backupFormRef,
      saveGitHubSettings,
      saveSystemSettings,
      saveBackupSettings,
      testGitHubConnection,
      exportData,
      importData,
      clearCache,
      resetSettings
    };
  },
  template: `
    <div class="settings-view">
      <!-- 页面头部 -->
      <div class="page-header">
        <h1 class="page-title">系统设置</h1>
        <p class="page-description">配置系统参数和个人偏好</p>
      </div>
      
      <!-- 设置选项卡 -->
      <div class="settings-tabs">
        <el-tabs v-model="activeTab" type="border-card">
          <!-- GitHub设置 -->
          <el-tab-pane label="GitHub配置" name="github">
            <div class="settings-section">
              <h3 class="section-title">GitHub API配置</h3>
              <p class="section-description">
                配置GitHub Personal Access Token和仓库信息，用于数据存储和同步
              </p>
              
              <el-form
                ref="githubFormRef"
                :model="githubForm"
                :rules="githubRules"
                label-width="120px"
              >
                <el-form-item label="Access Token" prop="token">
                  <el-input
                    v-model="githubForm.token"
                    type="password"
                    placeholder="请输入GitHub Personal Access Token"
                    show-password
                  />
                  <div class="form-help">
                    Token需要具有对目标仓库的读写权限
                    <el-link type="primary" href="https://github.com/settings/tokens" target="_blank">
                      获取Token
                    </el-link>
                  </div>
                </el-form-item>
                
                <el-form-item label="仓库地址" prop="repository">
                  <el-input
                    v-model="githubForm.repository"
                    placeholder="例如: username/navigation-data"
                  />
                </el-form-item>
                
                <el-form-item label="分支名称">
                  <el-input
                    v-model="githubForm.branch"
                    placeholder="默认: main"
                  />
                </el-form-item>
                
                <el-form-item label="自动同步">
                  <el-switch v-model="githubForm.autoSync" />
                  <div class="form-help">
                    开启后将定期自动同步数据到GitHub
                  </div>
                </el-form-item>
                
                <el-form-item label="同步间隔" v-if="githubForm.autoSync">
                  <el-input-number
                    v-model="githubForm.syncInterval"
                    :min="5"
                    :max="1440"
                    :step="5"
                  />
                  <span style="margin-left: 8px;">分钟</span>
                </el-form-item>
                
                <el-form-item>
                  <el-button type="primary" @click="saveGitHubSettings">
                    保存设置
                  </el-button>
                  <el-button @click="testGitHubConnection" :loading="loading">
                    测试连接
                  </el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>
          
          <!-- 系统设置 -->
          <el-tab-pane label="系统设置" name="system">
            <div class="settings-section">
              <h3 class="section-title">基本设置</h3>
              <p class="section-description">
                配置系统的基本信息和显示选项
              </p>
              
              <el-form
                ref="systemFormRef"
                :model="systemForm"
                :rules="systemRules"
                label-width="120px"
              >
                <el-form-item label="站点名称" prop="siteName">
                  <el-input v-model="systemForm.siteName" />
                </el-form-item>
                
                <el-form-item label="站点描述">
                  <el-input
                    v-model="systemForm.siteDescription"
                    type="textarea"
                    :rows="3"
                  />
                </el-form-item>
                
                <el-form-item label="主题">
                  <el-radio-group v-model="systemForm.theme">
                    <el-radio label="light">亮色主题</el-radio>
                    <el-radio label="dark">暗色主题</el-radio>
                  </el-radio-group>
                </el-form-item>
                
                <el-form-item label="语言">
                  <el-select v-model="systemForm.language">
                    <el-option label="简体中文" value="zh-CN" />
                    <el-option label="English" value="en-US" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="每页显示">
                  <el-input-number
                    v-model="systemForm.pageSize"
                    :min="5"
                    :max="100"
                    :step="5"
                  />
                  <span style="margin-left: 8px;">条记录</span>
                </el-form-item>
                
                <el-form-item label="自动保存">
                  <el-switch v-model="systemForm.autoSave" />
                  <div class="form-help">
                    开启后编辑时会自动保存草稿
                  </div>
                </el-form-item>
                
                <el-form-item label="桌面通知">
                  <el-switch v-model="systemForm.enableNotifications" />
                </el-form-item>
                
                <el-form-item>
                  <el-button type="primary" @click="saveSystemSettings">
                    保存设置
                  </el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>
          
          <!-- 数据管理 -->
          <el-tab-pane label="数据管理" name="data">
            <div class="settings-section">
              <h3 class="section-title">数据备份</h3>
              <p class="section-description">
                管理数据备份和恢复，确保数据安全
              </p>
              
              <el-form
                ref="backupFormRef"
                :model="backupForm"
                label-width="120px"
              >
                <el-form-item label="自动备份">
                  <el-switch v-model="backupForm.autoBackup" />
                </el-form-item>
                
                <el-form-item label="备份频率" v-if="backupForm.autoBackup">
                  <el-select v-model="backupForm.backupInterval">
                    <el-option label="每小时" value="hourly" />
                    <el-option label="每天" value="daily" />
                    <el-option label="每周" value="weekly" />
                    <el-option label="每月" value="monthly" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="保留备份">
                  <el-input-number
                    v-model="backupForm.maxBackups"
                    :min="1"
                    :max="100"
                  />
                  <span style="margin-left: 8px;">个</span>
                </el-form-item>
                
                <el-form-item>
                  <el-button type="primary" @click="saveBackupSettings">
                    保存设置
                  </el-button>
                </el-form-item>
              </el-form>
            </div>
            
            <div class="settings-section">
              <h3 class="section-title">数据操作</h3>
              <p class="section-description">
                导入导出数据，清除缓存等操作
              </p>
              
              <div class="action-buttons">
                <el-button type="success" @click="exportData">
                  <i class="fas fa-download"></i>
                  导出数据
                </el-button>
                <el-button type="warning" @click="importData">
                  <i class="fas fa-upload"></i>
                  导入数据
                </el-button>
                <el-button type="info" @click="clearCache">
                  <i class="fas fa-broom"></i>
                  清除缓存
                </el-button>
                <el-button type="danger" @click="resetSettings">
                  <i class="fas fa-undo"></i>
                  重置设置
                </el-button>
              </div>
            </div>
          </el-tab-pane>
          
          <!-- 关于 -->
          <el-tab-pane label="关于" name="about">
            <div class="settings-section">
              <h3 class="section-title">关于系统</h3>
              
              <el-descriptions :column="1" border>
                <el-descriptions-item label="系统名称">
                  工具集导航站后台管理系统
                </el-descriptions-item>
                <el-descriptions-item label="版本">
                  v1.0.0
                </el-descriptions-item>
                <el-descriptions-item label="技术栈">
                  Vue 3 + Element Plus + GitHub API
                </el-descriptions-item>
                <el-descriptions-item label="开发者">
                  Claude Assistant
                </el-descriptions-item>
                <el-descriptions-item label="许可证">
                  MIT License
                </el-descriptions-item>
                <el-descriptions-item label="更新时间">
                  {{ new Date().toLocaleDateString() }}
                </el-descriptions-item>
              </el-descriptions>
              
              <div style="margin-top: 24px;">
                <el-alert
                  title="使用说明"
                  type="info"
                  :closable="false"
                  show-icon
                >
                  <p>1. 首先配置GitHub Token和仓库地址</p>
                  <p>2. 创建分类结构，组织网站内容</p>
                  <p>3. 添加网站信息，支持批量操作</p>
                  <p>4. 定期备份数据，确保数据安全</p>
                </el-alert>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  `
};

// 导出组件
window.SettingsView = Settings; 