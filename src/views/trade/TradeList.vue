<template>
    <div class="trade-list">
        <!-- 搜索筛选区域 -->
        <el-card class="search-card">
            <el-form :inline="true" :model="searchForm" class="search-form" label-width="80px">

                <el-form-item label="交易标题">
                    <el-input v-model="searchForm.title" placeholder="请输入交易标题" clearable style="width: 180px" />
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
                    <el-button v-permission="['trade:list:export', 'trade:review']" type="success"
                        @click="handleExport">
                        <el-icon>
                            <Download />
                        </el-icon>
                        导出
                    </el-button>
                </div>
            </div>

            <!-- 卡片网格 -->
            <div class="card-grid" v-loading="loading">
                <template v-if="tableData.length">
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
                                <span class="label">位置：</span>
                                <span class="value desc">{{ item.location || '未填写' }}</span>
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
                                <el-button v-permission="['chat:contact', 'chat:view']" type="success" size="small"
                                    plain @click="handleContact(item)">
                                    私聊
                                </el-button>
                                <el-button v-if="item.status === 'published'"
                                    v-permission="['trade:list:take', 'trade:order:receive']" type="primary"
                                    size="small" @click="handleReceive(item)">
                                    接取
                                </el-button>
                                <el-button v-permission="['trade:list:edit', 'trade:review']" type="warning"
                                    size="small" @click="handleEdit(item)">
                                    编辑
                                </el-button>
                                <el-button v-permission="['trade:list:delete', 'trade:review']" type="danger"
                                    size="small" @click="handleDelete(item)">
                                    删除
                                </el-button>
                            </div>
                        </div>
                    </el-card>
                </template>
                <el-empty v-else description="暂无交易数据" />
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
                <el-descriptions-item label="交易状态" :span="2">
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
                <el-descriptions-item label="位置" :span="2">
                    {{ currentRow.location || '未填写' }}
                </el-descriptions-item>
                <el-descriptions-item label="发布时间">{{ currentRow.createTime }}</el-descriptions-item>
                <el-descriptions-item label="图片信息" :span="2">
                    <div v-if="currentRow.imageUrls?.length" class="detail-image-list">
                        <el-image
                            v-for="(url, index) in currentRow.imageUrls"
                            :key="`${url}-${index}`"
                            :src="url"
                            :preview-src-list="currentRow.imageUrls"
                            preview-teleported
                            fit="cover"
                            class="detail-image"
                        />
                    </div>
                    <span v-else>无</span>
                </el-descriptions-item>
                <el-descriptions-item label="备注说明" :span="2">
                    {{ currentRow.description || '无' }}
                </el-descriptions-item>
            </el-descriptions>
        </el-dialog>
    </div>
</template>

<script>
import { onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Download } from '@element-plus/icons-vue'
import { getTradeStatusText, getTradeStatusType } from '@/config/statusConfig'
import { formatCurrency } from '@/utils/format'
import { useTradeListStore } from '@/stores/tradeList'

export default {
    name: 'TradeList',
    components: {
        Search,
        Refresh,
        Download
    },
    setup() {
        const store = useTradeListStore()
        const router = useRouter()
        const { searchForm, tableData, loading, pagination, detailVisible, currentRow } = storeToRefs(store)

        const handleSearch = async () => {
            try {
                await store.search()
            } catch (error) {
                console.error('搜索交易大全失败:', error)
            }
        }

        const handleReset = async () => {
            try {
                await store.resetSearch()
            } catch (error) {
                console.error('重置交易大全筛选失败:', error)
            }
        }

        const handleViewDetail = async row => {
            try {
                await store.openDetail(row.id)
            } catch (error) {
                console.error('获取交易详情失败:', error)
            }
        }

        const handleEdit = row => {
            router.push(`/trade/publish/edit/${row.id}`)
        }

        const handleReceive = async row => {
            try {
                await store.receiveById(row.id)
                ElMessage.success('接取成功')
            } catch (error) {
                console.error('接取交易失败:', error)
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

        const handleExport = async () => {
            try {
                const data = await store.exportData()
                ElMessage.info(data?.message || '导出接口已预留')
            } catch (error) {
                console.error('导出交易列表失败:', error)
            }
        }

        const handleContact = item => {
            router.push({
                path: '/chat',
                query: {
                    tradeId: item.id
                }
            })
            ElMessage.info('已跳转到聊天室，请联系发布方')
        }

        const handleSizeChange = async val => {
            try {
                await store.setPageSize(val)
            } catch (error) {
                console.error('切换交易大全分页大小失败:', error)
            }
        }

        const handleCurrentChange = async val => {
            try {
                await store.setCurrentPage(val)
            } catch (error) {
                console.error('切换交易大全页码失败:', error)
            }
        }

        const formatAmount = amount => formatCurrency(amount, { withSymbol: false })
        const getStatusType = status => getTradeStatusType(status)
        const getStatusText = status => getTradeStatusText(status)

        onMounted(async () => {
            try {
                await store.fetchData()
            } catch (error) {
                console.error('获取交易大全列表失败:', error)
            }
        })

        onUnmounted(() => {
            store.resetTransientState()
        })

        return {
            searchForm,
            tableData,
            loading,
            pagination,
            detailVisible,
            currentRow,
            handleSearch,
            handleReset,
            handleViewDetail,
            handleEdit,
            handleReceive,
            handleDelete,
            handleExport,
            handleContact,
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

.detail-image-list {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
}

.detail-image {
    width: 88px;
    height: 88px;
    border-radius: 10px;
    overflow: hidden;
}
</style>
