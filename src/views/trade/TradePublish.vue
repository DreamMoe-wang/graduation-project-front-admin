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
import { Search, Refresh, Plus, View, Edit, Delete } from '@element-plus/icons-vue'

export default {
    name: 'TradePublish',
    components: {
        Search,
        Refresh,
        Plus,
        View,
        Edit,
        Delete
    },
    data() {
        return {
            // 搜索表单
            searchForm: {
                title: '',
                status: ''
            },
            // 表格数据
            tableData: [],
            loading: false,
            // 分页
            pagination: {
                currentPage: 1,
                pageSize: 10,
                total: 0
            },
            // 对话框
            dialogVisible: false,
            detailVisible: false,
            dialogTitle: '',
            isEdit: false,
            submitLoading: false,
            currentRow: null,
            // 表单数据
            formData: {
                id: null,
                title: '',
                clientName: '',
                clientPhone: '',
                workerName: '',
                workerPhone: '',
                amount: 0,
                status: 'draft',
                description: ''
            },
            // 表单验证规则
            formRules: {
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
        }
    },
    mounted() {
        this.fetchData()
    },
    methods: {
        // 获取数据
        fetchData() {
            this.loading = true
            // TODO: 实际项目中这里调用 API
            setTimeout(() => {
                this.tableData = [
                    {
                        id: 1,
                        title: '上门维修服务 - 空调清洗',
                        clientName: '张先生',
                        clientPhone: '13800138001',
                        workerName: '李师傅',
                        workerPhone: '13900139001',
                        amount: 150.00,
                        status: 'trading',
                        createTime: '2024-01-15 10:30:00',
                        description: '需要清洗两台壁挂式空调'
                    },
                    {
                        id: 2,
                        title: '搬家服务 - 小型搬运',
                        clientName: '王女士',
                        clientPhone: '13800138002',
                        workerName: '',
                        workerPhone: '',
                        amount: 300.00,
                        status: 'published',
                        createTime: '2024-01-16 14:20:00',
                        description: '一居室搬家，有电梯'
                    },
                    {
                        id: 3,
                        title: '家教辅导 - 初中数学',
                        clientName: '刘先生',
                        clientPhone: '13800138003',
                        workerName: '陈老师',
                        workerPhone: '13900139003',
                        amount: 200.00,
                        status: 'trading',
                        createTime: '2024-01-17 09:00:00',
                        description: '每周两次，每次两小时'
                    },
                    {
                        id: 4,
                        title: '宠物寄养 - 猫咪照顾',
                        clientName: '赵女士',
                        clientPhone: '13800138004',
                        workerName: '',
                        workerPhone: '',
                        amount: 100.00,
                        status: 'auditing',
                        createTime: '2024-01-18 16:45:00',
                        description: '春节假期 7 天寄养'
                    },
                    {
                        id: 5,
                        title: '代驾服务 - 晚间代驾',
                        clientName: '孙先生',
                        clientPhone: '13800138005',
                        workerName: '周师傅',
                        workerPhone: '13900139005',
                        amount: 80.00,
                        status: 'completed',
                        createTime: '2024-01-19 20:00:00',
                        description: '从酒吧到小区'
                    },
                    {
                        id: 6,
                        title: '保洁服务 - 深度清洁',
                        clientName: '吴女士',
                        clientPhone: '13800138006',
                        workerName: '',
                        workerPhone: '',
                        amount: 250.00,
                        status: 'draft',
                        createTime: '2024-01-20 11:30:00',
                        description: '三居室全屋清洁'
                    },
                    {
                        id: 7,
                        title: '电脑维修 - 系统重装',
                        clientName: '郑先生',
                        clientPhone: '13800138007',
                        workerName: '钱工程师',
                        workerPhone: '13900139007',
                        amount: 120.00,
                        status: 'rejected',
                        createTime: '2024-01-21 13:15:00',
                        description: '笔记本系统重装，数据备份'
                    }
                ]
                this.pagination.total = this.tableData.length
                this.loading = false
            }, 500)
        },
        // 搜索
        handleSearch() {
            console.log('搜索条件:', this.searchForm)
            this.fetchData()
        },
        // 重置
        handleReset() {
            this.searchForm = {
                title: '',
                status: ''
            }
            this.fetchData()
        },
        // 添加
        handleAdd() {
            this.dialogTitle = '发布交易'
            this.isEdit = false
            this.formData = {
                id: null,
                title: '',
                clientName: '',
                clientPhone: '',
                workerName: '',
                workerPhone: '',
                amount: 0,
                status: 'draft',
                description: ''
            }
            this.dialogVisible = true
        },
        // 编辑
        handleEdit(row) {
            this.dialogTitle = '编辑交易'
            this.isEdit = true
            this.formData = { ...row }
            this.dialogVisible = true
        },
        // 查看详情
        handleViewDetail(row) {
            this.currentRow = row
            this.detailVisible = true
        },
        // 删除
        handleDelete(row) {
            this.$confirm(`确定要删除交易"${row.title}"吗？`, '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                // TODO: 调用删除 API
                console.log('删除:', row.id)
                this.$message.success('删除成功')
                this.fetchData()
            }).catch(() => { })
        },
        // 提交表单
        handleSubmit() {
            this.$refs.formRef.validate((valid) => {
                if (valid) {
                    this.submitLoading = true
                    // TODO: 调用保存 API
                    setTimeout(() => {
                        this.submitLoading = false
                        this.dialogVisible = false
                        this.$message.success(this.isEdit ? '修改成功' : '发布成功')
                        this.fetchData()
                    }, 500)
                }
            })
        },
        // 关闭对话框
        handleDialogClose() {
            this.$refs.formRef?.resetFields()
        },
        // 分页处理
        handleSizeChange(val) {
            console.log('每页条数:', val)
            this.fetchData()
        },
        handleCurrentChange(val) {
            console.log('当前页码:', val)
            this.fetchData()
        },
        // 格式化金额
        formatAmount(amount) {
            return `¥${Number(amount).toFixed(2)}`
        },
        // 获取状态类型
        getStatusType(status) {
            const typeMap = {
                draft: 'info',
                auditing: 'warning',
                published: 'primary',
                rejected: 'danger',
                trading: 'success',
                completed: ''
            }
            return typeMap[status] || 'info'
        },
        // 获取状态文本
        getStatusText(status) {
            const textMap = {
                draft: '草稿',
                auditing: '审核中',
                published: '已发布',
                rejected: '未通过',
                trading: '交易中',
                completed: '交易结束'
            }
            return textMap[status] || status
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
