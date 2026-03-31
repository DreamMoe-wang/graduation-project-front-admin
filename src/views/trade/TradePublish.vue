<template>
    <div class="trade-publish">
        <!-- 搜索区域 -->
        <el-card class="search-card">
            <el-form :inline="true" :model="searchForm" class="search-form">
                <el-form-item label="标题">
                    <el-input v-model="searchForm.title" placeholder="请输入交易标题" clearable style="width: 200px" />
                </el-form-item>
                <el-form-item label="交易状态">
                    <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 150px">
                        <el-option label="草稿" value="draft" />
                        <el-option label="审核中" value="auditing" />
                        <el-option label="已发布" value="published" />
                        <el-option label="未通过" value="rejected" />
                        <el-option label="交易中" value="trading" />
                        <el-option label="交易结束" value="completed" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleSearch">
                        <el-icon>
                            <Search />
                        </el-icon>
                        搜索
                    </el-button>
                    <el-button @click="handleReset">
                        <el-icon>
                            <Refresh />
                        </el-icon>
                        重置
                    </el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <!-- 表格区域 -->
        <el-card class="table-card">
            <div class="table-header">
                <div class="header-left">
                    <span class="page-title">交易管理</span>
                </div>
                <div class="header-right">
                    <el-button type="primary" @click="handleAdd">
                        <el-icon>
                            <Plus />
                        </el-icon>
                        发布交易
                    </el-button>
                </div>
            </div>

            <el-table :data="tableData" border style="width: 100%" v-loading="loading">
                <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
                <el-table-column prop="clientName" label="委托人" width="100" />
                <el-table-column prop="clientPhone" label="委托人电话" width="130" />
                <el-table-column prop="workerName" label="接单人" width="100">
                    <template #default="{ row }">
                        <span>{{ row.workerName || '-' }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="workerPhone" label="接单人电话" width="130">
                    <template #default="{ row }">
                        <span>{{ row.workerPhone || '-' }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="amount" label="交易金额" width="100" align="center">
                    <template #default="{ row }">
                        <span class="amount-text">{{ formatAmount(row.amount) }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="status" label="交易状态" width="100" align="center">
                    <template #default="{ row }">
                        <el-tag :type="getStatusType(row.status)" size="small">
                            {{ getStatusText(row.status) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="150" fixed="right" align="center">
                    <template #default="{ row }">
                        <el-button link type="primary" size="small" @click="handleViewDetail(row)">
                            详情
                        </el-button>
                        <el-button link type="warning" size="small" @click="handleEdit(row)">
                            编辑
                        </el-button>
                        <el-button link type="danger" size="small" @click="handleDelete(row)">
                            删除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 分页 -->
            <div class="pagination">
                <el-pagination v-model:current-page="pagination.currentPage" v-model:page-size="pagination.pageSize"
                    :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
                    :total="pagination.total" @size-change="handleSizeChange" @current-change="handleCurrentChange" />
            </div>
        </el-card>

        <!-- 添加/编辑对话框 -->
        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" @close="handleDialogClose">
            <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
                <el-form-item label="交易标题" prop="title">
                    <el-input v-model="formData.title" placeholder="请输入交易标题" />
                </el-form-item>
                <el-form-item label="委托人" prop="clientName">
                    <el-input v-model="formData.clientName" placeholder="请输入委托人姓名" />
                </el-form-item>
                <el-form-item label="委托人电话" prop="clientPhone">
                    <el-input v-model="formData.clientPhone" placeholder="请输入联系方式" maxlength="11" />
                </el-form-item>
                <el-form-item label="交易金额" prop="amount">
                    <el-input-number v-model="formData.amount" :min="0" :precision="2" placeholder="请输入金额"
                        style="width: 100%" />
                </el-form-item>
                <el-form-item label="交易状态" prop="status">
                    <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
                        <el-option label="草稿" value="draft" />
                        <el-option label="审核中" value="auditing" />
                        <el-option label="已发布" value="published" />
                        <el-option label="未通过" value="rejected" />
                        <el-option label="交易中" value="trading" />
                        <el-option label="交易结束" value="completed" />
                    </el-select>
                </el-form-item>
                <el-form-item label="备注说明" prop="description">
                    <el-input v-model="formData.description" type="textarea" :rows="4" placeholder="请输入交易描述" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
                    确定
                </el-button>
            </template>
        </el-dialog>

        <!-- 详情对话框 -->
        <el-dialog v-model="detailVisible" title="交易详情" width="600px">
            <el-descriptions :column="1" border v-if="currentRow">
                <el-descriptions-item label="交易标题">{{ currentRow.title }}</el-descriptions-item>
                <el-descriptions-item label="委托人">{{ currentRow.clientName }}</el-descriptions-item>
                <el-descriptions-item label="委托人电话">{{ currentRow.clientPhone }}</el-descriptions-item>
                <el-descriptions-item label="接单人">
                    {{ currentRow.workerName || '暂无' }}
                </el-descriptions-item>
                <el-descriptions-item label="接单人电话">
                    {{ currentRow.workerPhone || '暂无' }}
                </el-descriptions-item>
                <el-descriptions-item label="交易金额">
                    <span class="amount-red">{{ formatAmount(currentRow.amount) }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="交易状态">
                    <el-tag :type="getStatusType(currentRow.status)" size="small">
                        {{ getStatusText(currentRow.status) }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="发布时间">{{ currentRow.createTime || '2024-01-01 12:00:00'
                }}</el-descriptions-item>
                <el-descriptions-item label="备注说明" :span="2">
                    {{ currentRow.description || '无' }}
                </el-descriptions-item>
            </el-descriptions>
        </el-dialog>
    </div>
</template>

<script>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import { useTradePublishStore } from '@/stores/tradePublish'

const TRADE_STATUS_TYPE_MAP = {
    draft: 'info',
    auditing: 'warning',
    published: 'primary',
    rejected: 'danger',
    trading: 'success',
    completed: ''
}

const TRADE_STATUS_TEXT_MAP = {
    draft: '草稿',
    auditing: '审核中',
    published: '已发布',
    rejected: '未通过',
    trading: '交易中',
    completed: '交易结束'
}

const formRules = {
    title: [
        { required: true, message: '请输入交易标题', trigger: 'blur' },
        { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    clientName: [
        { required: true, message: '请输入委托人姓名', trigger: 'blur' }
    ],
    clientPhone: [
        { required: true, message: '请输入委托人电话', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
    ],
    amount: [
        { required: true, message: '请输入交易金额', trigger: 'blur' }
    ],
    status: [
        { required: true, message: '请选择交易状态', trigger: 'change' }
    ]
}

export default {
    name: 'TradePublish',
    components: {
        Search,
        Refresh,
        Plus
    },
    setup() {
        const store = useTradePublishStore()
        const route = useRoute()
        const router = useRouter()
        const formRef = ref(null)
        const {
            searchForm,
            tableData,
            loading,
            pagination,
            dialogVisible,
            detailVisible,
            dialogTitle,
            isEdit,
            submitLoading,
            currentRow,
            formData
        } = storeToRefs(store)

        const clearEditQuery = () => {
            if (!route.query.id) return

            const query = { ...route.query }
            delete query.id
            router.replace({
                path: route.path,
                query
            }).catch(() => { })
        }

        const openEditDialogById = async id => {
            if (!id) return

            try {
                await store.openEditDialogById(id)
            } catch (error) {
                console.error('打开编辑弹窗失败:', error)
            }
        }

        const handleSearch = async () => {
            try {
                await store.search()
            } catch (error) {
                console.error('搜索交易发布失败:', error)
            }
        }

        const handleReset = async () => {
            try {
                await store.resetSearch()
            } catch (error) {
                console.error('重置交易发布筛选失败:', error)
            }
        }

        const handleAdd = () => {
            clearEditQuery()
            store.openCreateDialog()
            setTimeout(() => {
                formRef.value?.clearValidate()
            })
        }

        const handleEdit = row => {
            openEditDialogById(row.id)
        }

        const handleViewDetail = async row => {
            try {
                await store.openDetail(row.id)
            } catch (error) {
                console.error('获取交易详情失败:', error)
            }
        }

        const handleDelete = async row => {
            try {
                await ElMessageBox.confirm(`确定要删除交易"${row.title}"吗？`, '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                })

                await store.deleteById(row.id)
                ElMessage.success('删除成功')
            } catch (error) {
                if (error !== 'cancel' && error !== 'close') {
                    console.error('删除交易失败:', error)
                }
            }
        }

        const handleSubmit = () => {
            formRef.value?.validate(async valid => {
                if (!valid) return

                try {
                    const mode = await store.submitForm()
                    ElMessage.success(mode === 'edit' ? '修改成功' : '发布成功')
                    clearEditQuery()
                } catch (error) {
                    console.error('保存交易失败:', error)
                }
            })
        }

        const handleDialogClose = () => {
            formRef.value?.resetFields()
            store.closeDialog()
            clearEditQuery()
        }

        const handleSizeChange = async val => {
            try {
                await store.setPageSize(val)
            } catch (error) {
                console.error('切换交易发布分页大小失败:', error)
            }
        }

        const handleCurrentChange = async val => {
            try {
                await store.setCurrentPage(val)
            } catch (error) {
                console.error('切换交易发布页码失败:', error)
            }
        }

        const formatAmount = amount => `¥${Number(amount || 0).toFixed(2)}`
        const getStatusType = status => TRADE_STATUS_TYPE_MAP[status] || 'info'
        const getStatusText = status => TRADE_STATUS_TEXT_MAP[status] || status

        onMounted(async () => {
            try {
                await store.fetchData()
            } catch (error) {
                console.error('获取交易发布列表失败:', error)
            }

            if (route.query.id) {
                await openEditDialogById(route.query.id)
            }
        })

        watch(
            () => route.query.id,
            async id => {
                if (id) {
                    await openEditDialogById(id)
                }
            }
        )

        onUnmounted(() => {
            store.resetTransientState()
        })

        return {
            formRef,
            formRules,
            searchForm,
            tableData,
            loading,
            pagination,
            dialogVisible,
            detailVisible,
            dialogTitle,
            isEdit,
            submitLoading,
            currentRow,
            formData,
            handleSearch,
            handleReset,
            handleAdd,
            handleEdit,
            handleViewDetail,
            handleDelete,
            handleSubmit,
            handleDialogClose,
            handleSizeChange,
            handleCurrentChange,
            formatAmount,
            getStatusType,
            getStatusText
        }
    }
}
</script>

<style scoped>
.trade-publish {
    padding: 10px;
}

.search-card {
    margin-bottom: 15px;
}

.search-form {
    display: flex;
    flex-wrap: wrap;
}

.table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.page-title {
    font-size: 16px;
    font-weight: bold;
    color: #303133;
}

.header-right {
    display: flex;
    align-items: center;
}

.pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}

.amount-red {
    color: #f56c6c;
    font-weight: bold;
    font-size: 14px;
}

.amount-bold {
    color: #f56c6c;
    font-weight: bold;
    font-size: 13px;
}
</style>
