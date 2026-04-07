<template>
    <div class="notice-manage">
        <el-card class="page-card">
            <div class="page-header">
                <div>
                    <h2 class="page-title">通知公告</h2>
                    <p class="page-subtitle">支持发布公告、编辑内容、查看详情和删除公告。</p>
                </div>
                <div class="page-actions">
                    <el-button @click="fetchData">
                        刷新列表
                    </el-button>
                    <el-button type="primary" v-permission="'notice:manage'" @click="handleCreate">
                        发布公告
                    </el-button>
                </div>
            </div>

            <el-table
                v-loading="loading"
                :data="tableData"
                border
                stripe
                class="notice-table"
                empty-text="暂无公告数据"
            >
                <el-table-column prop="title" label="公告标题" min-width="220" show-overflow-tooltip />
                <el-table-column prop="code" label="公告编码" width="180" show-overflow-tooltip />
                <el-table-column label="状态" width="120" align="center">
                    <template #default="{ row }">
                        <el-tag :type="row.status === 1 ? 'success' : 'info'">
                            {{ row.status === 1 ? '已发布' : '草稿' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="公告内容" min-width="320" show-overflow-tooltip>
                    <template #default="{ row }">
                        {{ row.content || '暂无内容' }}
                    </template>
                </el-table-column>
                <el-table-column prop="updateTime" label="更新时间" width="180" />
                <el-table-column label="操作" width="220" fixed="right" align="center">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="handleView(row)">查看</el-button>
                        <el-button link type="warning" v-permission="'notice:manage'" @click="handleEdit(row)">编辑</el-button>
                        <el-button link type="danger" v-permission="'notice:manage'" @click="handleDelete(row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-wrap">
                <el-pagination
                    v-model:current-page="pagination.currentPage"
                    v-model:page-size="pagination.pageSize"
                    :page-sizes="[5, 10, 20, 50]"
                    layout="total, sizes, prev, pager, next, jumper"
                    :total="pagination.total"
                    @size-change="handleSizeChange"
                    @current-change="handleCurrentChange"
                />
            </div>
        </el-card>

        <el-dialog
            v-model="detailVisible"
            title="公告详情"
            width="640px"
            destroy-on-close
        >
            <div v-loading="detailLoading" class="detail-content">
                <template v-if="currentRow">
                    <div class="detail-title">{{ currentRow.title }}</div>
                    <div class="detail-meta">
                        <span>公告编码：{{ currentRow.code || '-' }}</span>
                        <span>状态：{{ currentRow.status === 1 ? '已发布' : '草稿' }}</span>
                        <span>更新时间：{{ currentRow.updateTime || '-' }}</span>
                    </div>
                    <div class="detail-body">{{ currentRow.content || '暂无内容' }}</div>
                </template>
                <el-empty v-else description="暂无详情" :image-size="56" />
            </div>
        </el-dialog>

        <el-dialog
            v-model="editorVisible"
            :title="editorMode === 'create' ? '发布公告' : '编辑公告'"
            width="720px"
            destroy-on-close
            @closed="resetEditor"
        >
            <el-form
                ref="editorFormRef"
                :model="editorForm"
                :rules="editorRules"
                label-width="90px"
            >
                <el-form-item label="公告标题" prop="title">
                    <el-input v-model="editorForm.title" maxlength="100" placeholder="请输入公告标题" />
                </el-form-item>
                <el-form-item label="公告编码" prop="code">
                    <el-input v-model="editorForm.code" maxlength="100" placeholder="可不填，系统将自动生成" />
                </el-form-item>
                <el-form-item label="发布状态" prop="status">
                    <el-radio-group v-model="editorForm.status">
                        <el-radio :value="1">已发布</el-radio>
                        <el-radio :value="0">草稿</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="公告内容" prop="content">
                    <el-input
                        v-model="editorForm.content"
                        type="textarea"
                        :rows="8"
                        maxlength="1000"
                        show-word-limit
                        placeholder="请输入公告内容"
                    />
                </el-form-item>
            </el-form>

            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="editorVisible = false">取消</el-button>
                    <el-button type="primary" :loading="saving" @click="handleSubmit">
                        {{ editorMode === 'create' ? '发布公告' : '保存修改' }}
                    </el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script>
import {
    createNotice,
    deleteNotice,
    getNoticeDetail,
    getNoticePage,
    updateNotice
} from '@/api/notice'

function createDefaultEditorForm() {
    return {
        id: null,
        title: '',
        code: '',
        status: 1,
        content: ''
    }
}

function createPagination() {
    return {
        currentPage: 1,
        pageSize: 10,
        total: 0
    }
}

export default {
    name: 'NoticeManage',
    data() {
        return {
            loading: false,
            detailLoading: false,
            saving: false,
            tableData: [],
            pagination: createPagination(),
            detailVisible: false,
            editorVisible: false,
            editorMode: 'create',
            currentRow: null,
            editorForm: createDefaultEditorForm(),
            editorRules: {
                title: [
                    { required: true, message: '请输入公告标题', trigger: 'blur' },
                    { min: 2, max: 100, message: '标题长度应为 2-100 个字符', trigger: 'blur' }
                ],
                code: [
                    { max: 100, message: '公告编码不能超过 100 个字符', trigger: 'blur' }
                ],
                status: [
                    { required: true, message: '请选择发布状态', trigger: 'change' }
                ],
                content: [
                    { required: true, message: '请输入公告内容', trigger: 'blur' },
                    { min: 2, max: 1000, message: '公告内容长度应为 2-1000 个字符', trigger: 'blur' }
                ]
            }
        }
    },
    mounted() {
        this.fetchData()
    },
    methods: {
        async fetchData() {
            this.loading = true

            try {
                const pageData = await getNoticePage({
                    pageNum: this.pagination.currentPage,
                    pageSize: this.pagination.pageSize
                })

                const records = Array.isArray(pageData?.records) ? pageData.records : []
                this.tableData = records.map(this.normalizeRow)
                this.pagination.total = Number(pageData?.total || 0)
            } catch (error) {
                this.tableData = []
                this.pagination.total = 0
                console.error('获取公告列表失败:', error)
            } finally {
                this.loading = false
            }
        },
        normalizeRow(item = {}) {
            return {
                id: item.id || null,
                title: item.title || item.noticeTitle || item.name || '未命名公告',
                code: item.code || '',
                status: Number(item.status ?? 1),
                content: item.content || item.noticeContent || item.description || '',
                updateTime: item.updateTime || item.publishTime || item.createTime || ''
            }
        },
        async loadNoticeDetail(id) {
            const detail = await getNoticeDetail(id)
            return this.normalizeRow(detail)
        },
        async handleView(row) {
            this.detailVisible = true
            this.detailLoading = true

            try {
                this.currentRow = await this.loadNoticeDetail(row.id)
            } catch (error) {
                this.currentRow = null
                console.error('获取公告详情失败:', error)
            } finally {
                this.detailLoading = false
            }
        },
        handleCreate() {
            this.editorMode = 'create'
            this.editorForm = createDefaultEditorForm()
            this.editorVisible = true
        },
        async handleEdit(row) {
            this.editorMode = 'edit'
            this.editorVisible = true
            this.saving = false

            try {
                const detail = await this.loadNoticeDetail(row.id)
                this.editorForm = {
                    id: detail.id,
                    title: detail.title,
                    code: detail.code,
                    status: detail.status,
                    content: detail.content
                }
            } catch (error) {
                this.editorVisible = false
                console.error('加载编辑公告失败:', error)
            }
        },
        async handleDelete(row) {
            try {
                await this.$confirm(`确定要删除公告“${row.title}”吗？`, '删除确认', {
                    type: 'warning',
                    confirmButtonText: '确定',
                    cancelButtonText: '取消'
                })

                await deleteNotice(row.id)

                if (this.tableData.length === 1 && this.pagination.currentPage > 1) {
                    this.pagination.currentPage -= 1
                }

                this.$message.success('公告已删除')
                await this.fetchData()
            } catch (error) {
                if (error !== 'cancel' && error !== 'close') {
                    console.error('删除公告失败:', error)
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
                    name: this.editorForm.title.trim(),
                    code: this.editorForm.code.trim(),
                    status: Number(this.editorForm.status),
                    description: this.editorForm.content.trim()
                }

                if (this.editorMode === 'create') {
                    await createNotice(payload)
                    this.$message.success('公告发布成功')
                } else {
                    await updateNotice(this.editorForm.id, payload)
                    this.$message.success('公告修改成功')
                }

                this.editorVisible = false
                await this.fetchData()
            } catch (error) {
                console.error('保存公告失败:', error)
            } finally {
                this.saving = false
            }
        },
        handleSizeChange(pageSize) {
            this.pagination.pageSize = pageSize
            this.pagination.currentPage = 1
            this.fetchData()
        },
        handleCurrentChange(currentPage) {
            this.pagination.currentPage = currentPage
            this.fetchData()
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
.notice-manage {
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

.notice-table {
    width: 100%;
}

.pagination-wrap {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}

.detail-content {
    min-height: 160px;
}

.detail-title {
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--app-text);
    margin-bottom: 14px;
}

.detail-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 20px;
    color: var(--app-text-secondary);
    font-size: 0.9rem;
    margin-bottom: 18px;
}

.detail-body {
    line-height: 1.8;
    color: var(--app-text);
    white-space: pre-wrap;
    word-break: break-word;
    background: var(--app-surface-soft);
    border-radius: 12px;
    padding: 16px;
    min-height: 180px;
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

    .pagination-wrap {
        justify-content: center;
    }
}
</style>
