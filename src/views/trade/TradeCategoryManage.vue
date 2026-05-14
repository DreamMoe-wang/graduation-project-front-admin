<template>
  <div class="trade-category-manage">
    <el-card class="page-card">
      <div class="page-header">
        <div>
          <h2 class="page-title">交易标签管理</h2>
          <p class="page-subtitle">管理员可维护交易标签，并设置接单时是否需要资格认证。</p>
        </div>
        <div class="page-actions">
          <el-button @click="fetchData">刷新列表</el-button>
          <el-button type="primary" @click="handleCreate">新增标签</el-button>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        class="category-table"
        empty-text="暂无交易标签"
      >
        <el-table-column prop="categoryName" label="标签名称" min-width="180" />
        <el-table-column label="需要认证" width="140" align="center">
          <template #default="{ row }">
            <el-tag :type="row.requiresQualification ? 'warning' : 'success'">
              {{ row.requiresQualification ? '需要认证' : '无需认证' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="warning" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="editorVisible"
      :title="editorMode === 'create' ? '新增交易标签' : '编辑交易标签'"
      width="520px"
      destroy-on-close
      @closed="resetEditor"
    >
      <el-form ref="editorFormRef" :model="editorForm" :rules="editorRules" label-width="100px">
        <el-form-item label="标签名称" prop="categoryName">
          <el-input v-model="editorForm.categoryName" maxlength="100" placeholder="请输入交易标签名称" />
        </el-form-item>

        <el-form-item label="需要认证">
          <el-switch
            v-model="editorForm.requiresQualification"
            inline-prompt
            active-text="是"
            inactive-text="否"
          />
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="editorForm.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editorVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="handleSubmit">
            {{ editorMode === 'create' ? '创建标签' : '保存修改' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import {
  createTradeCategory,
  deleteTradeCategory,
  getTradeCategoryManageList,
  updateTradeCategory
} from '@/api/tradeCategory'

function createDefaultEditorForm() {
  return {
    id: null,
    categoryName: '',
    requiresQualification: false,
    status: 1
  }
}

export default {
  name: 'TradeCategoryManage',
  data() {
    return {
      loading: false,
      saving: false,
      tableData: [],
      editorVisible: false,
      editorMode: 'create',
      editorForm: createDefaultEditorForm(),
      editorRules: {
        categoryName: [
          { required: true, message: '请输入标签名称', trigger: 'blur' },
          { min: 1, max: 100, message: '标签名称长度应为 1-100 个字符', trigger: 'blur' }
        ],
        status: [
          { required: true, message: '请选择状态', trigger: 'change' }
        ]
      }
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    normalizeRow(item = {}) {
      return {
        id: item.id ?? null,
        categoryName: item.categoryName || '',
        requiresQualification: !!item.requiresQualification,
        status: Number(item.status ?? 1)
      }
    },
    async fetchData() {
      this.loading = true

      try {
        const list = await getTradeCategoryManageList()
        this.tableData = Array.isArray(list) ? list.map(this.normalizeRow) : []
      } catch (error) {
        this.tableData = []
        console.error('Load trade category list failed:', error)
      } finally {
        this.loading = false
      }
    },
    handleCreate() {
      this.editorMode = 'create'
      this.editorForm = createDefaultEditorForm()
      this.editorVisible = true
    },
    handleEdit(row) {
      this.editorMode = 'edit'
      this.editorForm = {
        id: row.id,
        categoryName: row.categoryName,
        requiresQualification: !!row.requiresQualification,
        status: Number(row.status ?? 1)
      }
      this.editorVisible = true
    },
    async handleDelete(row) {
      try {
        await this.$confirm(`确定要删除标签“${row.categoryName}”吗？`, '删除确认', {
          type: 'warning',
          confirmButtonText: '确定',
          cancelButtonText: '取消'
        })

        await deleteTradeCategory(row.id)
        this.$message.success('标签删除成功')
        await this.fetchData()
      } catch (error) {
        if (error !== 'cancel' && error !== 'close') {
          console.error('Delete trade category failed:', error)
        }
      }
    },
    async handleSubmit() {
      const formRef = this.$refs.editorFormRef
      if (!formRef) return

      try {
        await formRef.validate()
      } catch (error) {
        return
      }

      this.saving = true

      try {
        const payload = {
          categoryName: this.editorForm.categoryName.trim(),
          requiresQualification: !!this.editorForm.requiresQualification,
          status: Number(this.editorForm.status ?? 1)
        }

        if (this.editorMode === 'create') {
          await createTradeCategory(payload)
          this.$message.success('标签创建成功')
        } else {
          await updateTradeCategory(this.editorForm.id, payload)
          this.$message.success('标签更新成功')
        }

        this.editorVisible = false
        await this.fetchData()
      } catch (error) {
        console.error('Save trade category failed:', error)
      } finally {
        this.saving = false
      }
    },
    resetEditor() {
      this.editorForm = createDefaultEditorForm()
      this.saving = false
      this.$refs.editorFormRef?.resetFields()
    }
  }
}
</script>

<style scoped>
.trade-category-manage {
  min-height: 100%;
}

.page-card {
  border-radius: 16px;
  border: none;
  background: var(--app-surface);
  box-shadow: var(--app-card-shadow);
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
  color: var(--app-text);
  font-weight: 700;
}

.page-subtitle {
  margin: 8px 0 0;
  color: var(--app-text-secondary);
  font-size: 0.95rem;
}

.page-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.category-table {
  width: 100%;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .page-actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
</style>
