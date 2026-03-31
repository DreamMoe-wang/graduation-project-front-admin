<template>
  <div class="trade-publish">
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="标题">
          <el-input
            v-model="searchForm.title"
            placeholder="请输入交易标题"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="交易状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
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

      <div class="pagination">
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

    <el-dialog v-model="detailVisible" title="交易详情" width="600px" @close="handleDetailClose">
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
        <el-descriptions-item label="发布时间">
          {{ currentRow.createTime || '2024-01-01 12:00:00' }}
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
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import {
  getTradeStatusText,
  getTradeStatusType,
  TRADE_STATUS_OPTIONS
} from '@/config/statusConfig'
import { formatCurrency } from '@/utils/format'
import { useTradePublishStore } from '@/stores/tradePublish'

export default {
  name: 'TradePublish',
  components: {
    Search,
    Refresh,
    Plus
  },
  setup() {
    const store = useTradePublishStore()
    const router = useRouter()
    const {
      searchForm,
      tableData,
      loading,
      pagination,
      detailVisible,
      currentRow
    } = storeToRefs(store)

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
      router.push('/trade/publish/create')
    }

    const handleEdit = row => {
      router.push(`/trade/publish/edit/${row.id}`)
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

    const handleDetailClose = () => {
      store.closeDetail()
    }

    const formatAmount = amount => formatCurrency(amount)
    const getStatusType = status => getTradeStatusType(status)
    const getStatusText = status => getTradeStatusText(status)

    onMounted(async () => {
      try {
        await store.fetchData()
      } catch (error) {
        console.error('获取交易发布列表失败:', error)
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
      handleAdd,
      handleEdit,
      handleViewDetail,
      handleDelete,
      handleSizeChange,
      handleCurrentChange,
      handleDetailClose,
      formatAmount,
      statusOptions: TRADE_STATUS_OPTIONS,
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
</style>
