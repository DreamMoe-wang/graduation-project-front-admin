<template>
    <div class="log-manage">
        <el-card class="page-card">
            <div class="page-header">
                <div>
                    <h2 class="page-title">日志管理</h2>
                    <p class="page-subtitle">记录后台关键操作，包括菜单、动作、操作人、IP、耗时和时间。</p>
                </div>
                <div class="page-actions">
                    <el-button @click="fetchData">刷新列表</el-button>
                    <el-button type="danger" v-permission="'log:manage'" @click="handleClean">清空日志</el-button>
                </div>
            </div>

            <el-form :inline="true" :model="searchForm" class="search-form">
                <el-form-item label="菜单名称">
                    <el-input v-model="searchForm.menuName" placeholder="如：通知公告" clearable />
                </el-form-item>
                <el-form-item label="操作名称">
                    <el-input v-model="searchForm.actionName" placeholder="如：删除" clearable />
                </el-form-item>
                <el-form-item label="操作人">
                    <el-input v-model="searchForm.username" placeholder="如：admin" clearable />
                </el-form-item>
                <el-form-item label="操作IP">
                    <el-input v-model="searchForm.ipAddress" placeholder="如：127.0.0.1" clearable />
                </el-form-item>
                <el-form-item label="结果状态">
                    <el-select v-model="searchForm.operationStatus" placeholder="全部" clearable style="width: 120px">
                        <el-option label="成功" :value="1" />
                        <el-option label="失败" :value="0" />
                    </el-select>
                </el-form-item>
                <el-form-item label="操作时间">
                    <el-date-picker
                        v-model="searchForm.dateRange"
                        type="datetimerange"
                        range-separator="至"
                        start-placeholder="开始时间"
                        end-placeholder="结束时间"
                        value-format="YYYY-MM-DD HH:mm:ss"
                    />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleSearch">查询</el-button>
                    <el-button @click="handleReset">重置</el-button>
                </el-form-item>
            </el-form>

            <el-table
                v-loading="loading"
                :data="tableData"
                border
                stripe
                empty-text="暂无日志记录"
            >
                <el-table-column prop="menuName" label="菜单" width="140" />
                <el-table-column prop="actionName" label="操作" width="130" />
                <el-table-column prop="username" label="操作人" width="140" />
                <el-table-column prop="ipAddress" label="IP" width="150" />
                <el-table-column prop="requestMethod" label="请求方式" width="110" align="center">
                    <template #default="{ row }">
                        <el-tag :type="row.requestMethod === 'GET' ? 'info' : 'primary'">
                            {{ row.requestMethod }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="结果" width="110" align="center">
                    <template #default="{ row }">
                        <el-tag :type="row.operationStatus === 1 ? 'success' : 'danger'">
                            {{ row.operationStatus === 1 ? '成功' : '失败' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="durationMs" label="耗时(ms)" width="110" />
                <el-table-column prop="requestUri" label="请求地址" min-width="240" show-overflow-tooltip />
                <el-table-column prop="createTime" label="操作时间" width="180" />
                <el-table-column label="操作" width="160" fixed="right" align="center">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="handleView(row)">详情</el-button>
                        <el-button link type="danger" v-permission="'log:manage'" @click="handleDelete(row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-wrap">
                <el-pagination
                    v-model:current-page="pagination.currentPage"
                    v-model:page-size="pagination.pageSize"
                    :page-sizes="[10, 20, 50, 100]"
                    layout="total, sizes, prev, pager, next, jumper"
                    :total="pagination.total"
                    @size-change="handleSizeChange"
                    @current-change="handleCurrentChange"
                />
            </div>
        </el-card>

        <el-dialog
            v-model="detailVisible"
            title="日志详情"
            width="680px"
            destroy-on-close
        >
            <div v-loading="detailLoading" class="detail-panel">
                <template v-if="currentRow">
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">菜单</span>
                            <span class="detail-value">{{ currentRow.menuName || '-' }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">操作</span>
                            <span class="detail-value">{{ currentRow.actionName || '-' }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">操作人</span>
                            <span class="detail-value">{{ currentRow.username || '-' }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">IP</span>
                            <span class="detail-value">{{ currentRow.ipAddress || '-' }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">请求方式</span>
                            <span class="detail-value">{{ currentRow.requestMethod || '-' }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">结果</span>
                            <span class="detail-value">{{ currentRow.operationStatus === 1 ? '成功' : '失败' }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">耗时</span>
                            <span class="detail-value">{{ currentRow.durationMs || 0 }} ms</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">操作时间</span>
                            <span class="detail-value">{{ currentRow.createTime || '-' }}</span>
                        </div>
                    </div>

                    <div class="detail-block">
                        <div class="detail-block-label">菜单路径</div>
                        <div class="detail-block-value">{{ currentRow.menuPath || '-' }}</div>
                    </div>

                    <div class="detail-block">
                        <div class="detail-block-label">请求地址</div>
                        <div class="detail-block-value">{{ currentRow.requestUri || '-' }}</div>
                    </div>

                    <div class="detail-block">
                        <div class="detail-block-label">结果消息</div>
                        <div class="detail-block-value">{{ currentRow.resultMessage || '-' }}</div>
                    </div>
                </template>
                <el-empty v-else description="暂无详情" :image-size="56" />
            </div>
        </el-dialog>
    </div>
</template>

<script>
import { cleanLog, deleteLog, getLogDetail, getLogPage } from '@/api/log'

function createDefaultSearchForm() {
    return {
        menuName: '',
        actionName: '',
        username: '',
        ipAddress: '',
        operationStatus: null,
        dateRange: []
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
    name: 'LogManage',
    data() {
        return {
            loading: false,
            detailLoading: false,
            tableData: [],
            currentRow: null,
            detailVisible: false,
            searchForm: createDefaultSearchForm(),
            pagination: createPagination()
        }
    },
    mounted() {
        this.fetchData()
    },
    methods: {
        buildQueryParams() {
            const [startTime, endTime] = Array.isArray(this.searchForm.dateRange) ? this.searchForm.dateRange : []

            return {
                pageNum: this.pagination.currentPage,
                pageSize: this.pagination.pageSize,
                menuName: this.searchForm.menuName.trim(),
                actionName: this.searchForm.actionName.trim(),
                username: this.searchForm.username.trim(),
                ipAddress: this.searchForm.ipAddress.trim(),
                operationStatus: this.searchForm.operationStatus,
                startTime,
                endTime
            }
        },
        async fetchData() {
            this.loading = true

            try {
                const pageData = await getLogPage(this.buildQueryParams())
                this.tableData = Array.isArray(pageData?.records) ? pageData.records : []
                this.pagination.total = Number(pageData?.total || 0)
            } catch (error) {
                this.tableData = []
                this.pagination.total = 0
                console.error('获取日志列表失败:', error)
            } finally {
                this.loading = false
            }
        },
        async handleSearch() {
            this.pagination.currentPage = 1
            await this.fetchData()
        },
        async handleReset() {
            this.searchForm = createDefaultSearchForm()
            this.pagination.currentPage = 1
            await this.fetchData()
        },
        async handleView(row) {
            this.detailVisible = true
            this.detailLoading = true

            try {
                this.currentRow = await getLogDetail(row.id)
            } catch (error) {
                this.currentRow = null
                console.error('获取日志详情失败:', error)
            } finally {
                this.detailLoading = false
            }
        },
        async handleDelete(row) {
            try {
                await this.$confirm(`确定要删除这条日志记录吗？`, '删除确认', {
                    type: 'warning',
                    confirmButtonText: '确定',
                    cancelButtonText: '取消'
                })

                await deleteLog(row.id)

                if (this.tableData.length === 1 && this.pagination.currentPage > 1) {
                    this.pagination.currentPage -= 1
                }

                this.$message.success('日志删除成功')
                await this.fetchData()
            } catch (error) {
                if (error !== 'cancel' && error !== 'close') {
                    console.error('删除日志失败:', error)
                }
            }
        },
        async handleClean() {
            try {
                await this.$confirm('确定要清空所有日志吗？清空后无法恢复。', '清空确认', {
                    type: 'warning',
                    confirmButtonText: '确定',
                    cancelButtonText: '取消'
                })

                await cleanLog()
                this.$message.success('日志已清空')
                this.pagination.currentPage = 1
                await this.fetchData()
            } catch (error) {
                if (error !== 'cancel' && error !== 'close') {
                    console.error('清空日志失败:', error)
                }
            }
        },
        async handleSizeChange(pageSize) {
            this.pagination.pageSize = pageSize
            this.pagination.currentPage = 1
            await this.fetchData()
        },
        async handleCurrentChange(currentPage) {
            this.pagination.currentPage = currentPage
            await this.fetchData()
        }
    }
}
</script>

<style scoped>
.log-manage {
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

.search-form {
    margin-bottom: 16px;
}

.pagination-wrap {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}

.detail-panel {
    min-height: 180px;
}

.detail-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 18px;
    margin-bottom: 18px;
}

.detail-item {
    padding: 14px 16px;
    background: var(--app-surface-soft);
    border-radius: 12px;
}

.detail-label {
    display: block;
    font-size: 0.82rem;
    color: var(--app-text-secondary);
    margin-bottom: 6px;
}

.detail-value {
    color: var(--app-text);
    font-weight: 600;
    word-break: break-word;
}

.detail-block {
    margin-top: 14px;
}

.detail-block-label {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--app-text);
    margin-bottom: 8px;
}

.detail-block-value {
    background: var(--app-surface-soft);
    border-radius: 12px;
    padding: 14px 16px;
    color: var(--app-text);
    line-height: 1.7;
    word-break: break-word;
    white-space: pre-wrap;
}

@media (max-width: 768px) {
    .page-header {
        flex-direction: column;
        align-items: stretch;
    }

    .page-actions {
        flex-wrap: wrap;
        justify-content: flex-start;
    }

    .detail-grid {
        grid-template-columns: 1fr;
    }

    .pagination-wrap {
        justify-content: center;
    }
}
</style>
