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
        <el-form-item label="交易类型">
          <el-select
            v-model="searchForm.categoryNames"
            multiple
            collapse-tags
            collapse-tags-tooltip
            clearable
            filterable
            placeholder="请选择交易类型"
            style="width: 260px"
          >
            <el-option
              v-for="item in tradeCategoryOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
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
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
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
      </div>

      <div class="action-toolbar">
        <div class="toolbar-left">
          <span class="selection-hint">已选 {{ selectedRows.length }} 项</span>
        </div>
        <div class="toolbar-right">
          <el-button
            v-permission="'trade:publish:view'"
            type="primary"
            @click="handleAdd"
          >
            <el-icon><Plus /></el-icon>
            发布交易
          </el-button>
          <el-button
            v-permission="'trade:review'"
            type="success"
            :disabled="!selectedAuditableIds.length"
            :loading="auditLoading && auditAction === 'approve'"
            @click="handleBatchApprove"
          >
            批量通过
          </el-button>
          <el-button
            v-permission="'trade:review'"
            type="warning"
            :disabled="!selectedAuditableIds.length"
            :loading="auditLoading && auditAction === 'reject'"
            @click="handleBatchReject"
          >
            批量驳回
          </el-button>
        </div>
      </div>

      <el-table
        :data="tableData"
        border
        style="width: 100%"
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column
          type="selection"
          width="54"
          :selectable="isRowSelectable"
        />
        <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
        <el-table-column prop="clientName" label="委托人" width="100" />
        <el-table-column prop="clientPhone" label="委托人电话" width="130" />
        <el-table-column prop="location" label="位置" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.location || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="categoryNames" label="交易类型" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ (row.categoryNames || []).join(' / ') || '-' }}</span>
          </template>
        </el-table-column>
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
            <el-button
              v-if="row.status === 'auditing'"
              v-permission="'trade:review'"
              link
              type="success"
              size="small"
              @click="handleApprove(row)"
            >
              通过
            </el-button>
            <el-button
              v-if="row.status === 'auditing'"
              v-permission="'trade:review'"
              link
              type="warning"
              size="small"
              @click="handleReject(row)"
            >
              驳回
            </el-button>
            <el-button v-permission="'trade:publish:view'" link type="warning" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button v-permission="'trade:publish:view'" link type="danger" size="small" @click="handleDelete(row)">
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
        <el-descriptions-item label="位置" :span="2">
          {{ currentRow.location || '未填写' }}
        </el-descriptions-item>
        <el-descriptions-item label="交易类型" :span="2">
          {{ (currentRow.categoryNames || []).join(' / ') || '无' }}
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
import { computed, onMounted, onUnmounted, ref } from 'vue'
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
import { getTradeCategoryList } from '@/api/tradeCategory'

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
    const tradeCategoryOptions = ref([])
    const {
      searchForm,
      tableData,
      loading,
      pagination,
      detailVisible,
      currentRow,
      selectedRows,
      auditLoading,
      auditAction
    } = storeToRefs(store)

    const selectedAuditableIds = computed(() => selectedRows.value
      .filter(item => store.isAuditable(item))
      .map(item => item.id))

    const loadTradeCategoryOptions = async () => {
      try {
        const list = await getTradeCategoryList()
        tradeCategoryOptions.value = Array.isArray(list) ? list.map(item => item?.categoryName).filter(Boolean) : []
      } catch (error) {
        tradeCategoryOptions.value = []
        console.error('Load trade categories failed:', error)
      }
    }

    const handleSearch = async () => {
      try {
        await store.search()
      } catch (error) {
        console.error('Search trade publish failed:', error)
      }
    }

    const handleReset = async () => {
      try {
        await store.resetSearch()
      } catch (error) {
        console.error('Reset trade publish filter failed:', error)
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
        console.error('Open trade publish detail failed:', error)
      }
    }

    const handleDelete = async row => {
      try {
        await ElMessageBox.confirm(`确定要删除交易“${row.title}”吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        await store.deleteById(row.id)
        ElMessage.success('删除成功')
      } catch (error) {
        if (error !== 'cancel' && error !== 'close') {
          console.error('Delete trade publish failed:', error)
        }
      }
    }

    const handleSelectionChange = rows => {
      store.setSelectedRows(rows)
    }

    const isRowSelectable = row => store.isAuditable(row)

    const handleApprove = async row => {
      try {
        await ElMessageBox.confirm(`确认通过交易“${row.title}”的审核吗？`, '审核确认', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'success'
        })

        await store.auditRows([row.id], 'approve')
        ElMessage.success('审核通过')
      } catch (error) {
        if (error !== 'cancel' && error !== 'close') {
          console.error('Approve trade failed:', error)
        }
      }
    }

    const handleReject = async row => {
      try {
        const { value } = await ElMessageBox.prompt('请输入驳回说明（可选）', '审核驳回', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputPlaceholder: '例如：信息不完整，请补充后重新提交',
          inputValue: ''
        })

        await store.auditRows([row.id], 'reject', value || '')
        ElMessage.success('已驳回')
      } catch (error) {
        if (error !== 'cancel' && error !== 'close') {
          console.error('Reject trade failed:', error)
        }
      }
    }

    const handleBatchApprove = async () => {
      if (!selectedAuditableIds.value.length) {
        ElMessage.warning('请先勾选待审核的交易')
        return
      }

      try {
        await ElMessageBox.confirm(`确认批量通过 ${selectedAuditableIds.value.length} 条交易吗？`, '批量审核', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'success'
        })

        await store.auditRows(selectedAuditableIds.value, 'approve')
        ElMessage.success('批量审核通过完成')
      } catch (error) {
        if (error !== 'cancel' && error !== 'close') {
          console.error('Batch approve trade failed:', error)
        }
      }
    }

    const handleBatchReject = async () => {
      if (!selectedAuditableIds.value.length) {
        ElMessage.warning('请先勾选待审核的交易')
        return
      }

      try {
        const { value } = await ElMessageBox.prompt('请输入批量驳回说明（可选）', '批量驳回', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputPlaceholder: '例如：请补充交易描述后重新提交',
          inputValue: ''
        })

        await store.auditRows(selectedAuditableIds.value, 'reject', value || '')
        ElMessage.success('批量驳回完成')
      } catch (error) {
        if (error !== 'cancel' && error !== 'close') {
          console.error('Batch reject trade failed:', error)
        }
      }
    }

    const handleSizeChange = async val => {
      try {
        await store.setPageSize(val)
      } catch (error) {
        console.error('Change trade publish page size failed:', error)
      }
    }

    const handleCurrentChange = async val => {
      try {
        await store.setCurrentPage(val)
      } catch (error) {
        console.error('Change trade publish page failed:', error)
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
        await Promise.all([
          store.fetchData(),
          loadTradeCategoryOptions()
        ])
      } catch (error) {
        console.error('Load trade publish list failed:', error)
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
      tradeCategoryOptions,
      handleSearch,
      handleReset,
      handleAdd,
      handleEdit,
      handleViewDetail,
      handleDelete,
      handleSelectionChange,
      isRowSelectable,
      handleApprove,
      handleReject,
      handleBatchApprove,
      handleBatchReject,
      handleSizeChange,
      handleCurrentChange,
      handleDetailClose,
      formatAmount,
      statusOptions: TRADE_STATUS_OPTIONS,
      selectedRows,
      selectedAuditableIds,
      auditLoading,
      auditAction,
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
  font-weight: 700;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
}

.action-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.toolbar-left {
  color: #6b7280;
  font-size: 14px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.selection-hint {
  line-height: 32px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.amount-red {
  color: #f56c6c;
  font-weight: 700;
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
