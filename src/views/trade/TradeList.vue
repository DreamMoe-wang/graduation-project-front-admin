<template>
    <div class="trade-list">
        <!-- 搜索筛选区域 -->
        <el-card class="search-card">
            <el-form :inline="true" :model="searchForm" class="search-form" label-width="80px">
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

                <el-form-item label="金额范围">
                    <div class="amount-range">
                        <el-input v-model="searchForm.minAmount" placeholder="最低" type="number" style="width: 100px" />
                        <span class="range-separator">-</span>
                        <el-input v-model="searchForm.maxAmount" placeholder="最高" type="number" style="width: 100px" />
                    </div>
                </el-form-item>

                <el-form-item label="时间范围">
                    <el-date-picker v-model="searchForm.dateRange" type="daterange" range-separator="至"
                        start-placeholder="开始日期" end-placeholder="结束日期" style="width: 240px"
                        value-format="YYYY-MM-DD" />
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
                    <span class="page-title">交易大全</span>
                </div>
                <div class="header-right">
                    <el-button type="success" @click="handleExport">
                        <el-icon>
                            <Download />
                        </el-icon>
                        导出
                    </el-button>
                </div>
            </div>

            <!-- 卡片网格 -->
            <div class="card-grid" v-loading="loading">
                <el-card v-for="item in tableData" :key="item.id" class="trade-card" shadow="hover">
                    <div class="card-header">
                        <div class="card-title">{{ item.title }}</div>
                        <el-tag :type="getStatusType(item.status)" size="small">
                            {{ getStatusText(item.status) }}
                        </el-tag>
                    </div>

                    <div class="card-body">
                        <div class="info-row">
                            <span class="label">委托人：</span>
                            <span class="value">{{ item.clientName }}</span>
                            <span class="phone">{{ item.clientPhone }}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">接单人：</span>
                            <span class="value">{{ item.workerName || '暂无' }}</span>
                            <span class="phone" v-if="item.workerPhone">{{ item.workerPhone }}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">发布时间：</span>
                            <span class="value">{{ item.createTime }}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">备注：</span>
                            <span class="value desc">{{ item.description || '无' }}</span>
                        </div>
                    </div>

                    <div class="card-footer">
                        <div class="amount">
                            <span class="label">交易金额：</span>
                            <span class="price">¥{{ formatAmount(item.amount) }}</span>
                        </div>
                        <div class="actions">
                            <el-button type="primary" size="small" @click="handleViewDetail(item)">
                                详情
                            </el-button>
                            <el-button type="warning" size="small" @click="handleEdit(item)">
                                编辑
                            </el-button>
                            <el-button type="danger" size="small" @click="handleDelete(item)">
                                删除
                            </el-button>
                        </div>
                    </div>
                </el-card>
            </div>

            <!-- 分页 -->
            <div class="pagination">
                <el-pagination v-model:current-page="pagination.currentPage" v-model:page-size="pagination.pageSize"
                    :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
                    :total="pagination.total" @size-change="handleSizeChange" @current-change="handleCurrentChange" />
            </div>
        </el-card>

        <!-- 详情对话框 -->
        <el-dialog v-model="detailVisible" title="交易详情" width="700px">
            <el-descriptions :column="2" border v-if="currentRow">
                <el-descriptions-item label="交易 ID">{{ currentRow.id }}</el-descriptions-item>
                <el-descriptions-item label="交易状态">
                    <el-tag :type="getStatusType(currentRow.status)" size="small">
                        {{ getStatusText(currentRow.status) }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="交易标题" :span="2">{{ currentRow.title }}</el-descriptions-item>
                <el-descriptions-item label="委托人">{{ currentRow.clientName }}</el-descriptions-item>
                <el-descriptions-item label="委托人电话">{{ currentRow.clientPhone }}</el-descriptions-item>
                <el-descriptions-item label="接单人">
                    {{ currentRow.workerName || '暂无' }}
                </el-descriptions-item>
                <el-descriptions-item label="接单人电话">
                    {{ currentRow.workerPhone || '暂无' }}
                </el-descriptions-item>
                <el-descriptions-item label="交易金额">
                    <span class="amount-red">¥{{ formatAmount(currentRow.amount) }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="发布时间">{{ currentRow.createTime }}</el-descriptions-item>
                <el-descriptions-item label="备注说明" :span="2">
                    {{ currentRow.description || '无' }}
                </el-descriptions-item>
            </el-descriptions>
        </el-dialog>
    </div>
</template>

<script>
import { Search, Refresh, Download } from '@element-plus/icons-vue'

export default {
    name: 'TradeList',
    components: {
        Search,
        Refresh,
        Download
    },
    data() {
        return {
            // 搜索表单
            searchForm: {
                status: '',
                minAmount: '',
                maxAmount: '',
                dateRange: []
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
            // 排序
            sortField: '',
            sortOrder: '',
            // 对话框
            detailVisible: false,
            currentRow: null
        }
    },
    mounted() {
        this.fetchData()
    },
    methods: {
        // 获取数据
        fetchData() {
            this.loading = true
            // TODO: 实际项目中这里调用 API，传递搜索条件和分页参数
            setTimeout(() => {
                this.tableData = [
                    {
                        id: 1001,
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
                        id: 1002,
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
                        id: 1003,
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
                        id: 1004,
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
                        id: 1005,
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
                        id: 1006,
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
                        id: 1007,
                        title: '电脑维修 - 系统重装',
                        clientName: '郑先生',
                        clientPhone: '13800138007',
                        workerName: '钱工程师',
                        workerPhone: '13900139007',
                        amount: 120.00,
                        status: 'rejected',
                        createTime: '2024-01-21 13:15:00',
                        description: '笔记本系统重装，数据备份'
                    },
                    {
                        id: 1008,
                        title: '管道疏通 - 厨房下水道',
                        clientName: '冯女士',
                        clientPhone: '13800138008',
                        workerName: '刘师傅',
                        workerPhone: '13900139008',
                        amount: 180.00,
                        status: 'trading',
                        createTime: '2024-01-22 09:30:00',
                        description: '厨房下水道堵塞'
                    },
                    {
                        id: 1009,
                        title: '跑腿代购 - 超市采购',
                        clientName: '陈先生',
                        clientPhone: '13800138009',
                        workerName: '',
                        workerPhone: '',
                        amount: 50.00,
                        status: 'published',
                        createTime: '2024-01-23 15:00:00',
                        description: '帮忙购买生活用品'
                    },
                    {
                        id: 1010,
                        title: '汽车保养 - 更换机油',
                        clientName: '杨先生',
                        clientPhone: '13800138010',
                        workerName: '黄技师',
                        workerPhone: '13900139010',
                        amount: 380.00,
                        status: 'completed',
                        createTime: '2024-01-24 10:00:00',
                        description: '全合成机油更换'
                    }
                ]
                this.pagination.total = this.tableData.length
                this.loading = false
            }, 500)
        },
        // 搜索
        handleSearch() {
            console.log('搜索条件:', this.searchForm)
            this.pagination.currentPage = 1
            this.fetchData()
        },
        // 重置
        handleReset() {
            this.searchForm = {
                status: '',
                minAmount: '',
                maxAmount: '',
                dateRange: []
            }
            this.pagination.currentPage = 1
            this.fetchData()
        },
        // 查看详情
        handleViewDetail(row) {
            this.currentRow = row
            this.detailVisible = true
        },
        // 编辑
        handleEdit(row) {
            // 跳转到交易发布页面进行编辑
            this.$router.push({
                path: '/trade/publish',
                query: { id: row.id }
            })
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
        // 导出
        handleExport() {
            this.$message.info('导出功能开发中...')
            // TODO: 实现导出功能
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
        // 排序处理
        handleSortChange({ prop, order }) {
            this.sortField = prop
            this.sortOrder = order
            console.log('排序:', prop, order)
            this.fetchData()
        },
        // 格式化金额
        formatAmount(amount) {
            return Number(amount).toFixed(2)
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
.trade-list {
    padding: 10px;
}

.search-card {
    margin-bottom: 15px;
}

.search-form {
    display: flex;
    flex-wrap: wrap;
}

.amount-range {
    display: flex;
    align-items: center;
    gap: 8px;
}

.range-separator {
    color: #909399;
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

/* 卡片网格布局 */
.card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 20px;
    padding: 10px 0;
}

.trade-card {
    transition: all 0.3s;
}

.trade-card:hover {
    transform: translateY(-4px);
}

.trade-card .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f0f0f0;
}

.trade-card .card-title {
    font-size: 15px;
    font-weight: bold;
    color: #303133;
    max-width: 280px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.trade-card .card-body {
    margin-bottom: 15px;
}

.trade-card .info-row {
    display: flex;
    align-items: flex-start;
    margin-bottom: 10px;
    line-height: 1.6;
}

.trade-card .info-row:last-child {
    margin-bottom: 0;
}

.trade-card .info-row .label {
    color: #909399;
    font-size: 14px;
    flex-shrink: 0;
    width: 70px;
}

.trade-card .info-row .value {
    color: #606266;
    font-size: 14px;
    flex: 1;
}

.trade-card .info-row .value.desc {
    display: block;
    max-width: 250px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.trade-card .info-row .phone {
    color: #409EFF;
    font-size: 13px;
    margin-left: 10px;
}

.trade-card .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 12px;
    border-top: 1px solid #f0f0f0;
}

.trade-card .card-footer .amount {
    display: flex;
    align-items: center;
    gap: 8px;
}

.trade-card .card-footer .amount .label {
    color: #909399;
    font-size: 14px;
}

.trade-card .card-footer .amount .price {
    color: #f56c6c;
    font-size: 18px;
    font-weight: bold;
}

.trade-card .card-footer .actions {
    display: flex;
    gap: 8px;
}

.amount-red {
    color: #f56c6c;
    font-weight: bold;
    font-size: 14px;
}
</style>
