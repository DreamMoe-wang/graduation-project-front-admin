<template>
  <div class="qualification-manage">
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="姓名">
          <el-input
            v-model="searchForm.realName"
            placeholder="请输入认证姓名"
            clearable
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item label="认证状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 160px"
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
        <div>
          <div class="page-title">资格认证</div>
          <div class="page-subtitle">
            普通用户可提交多条认证记录，管理员负责审核通过或驳回。
          </div>
        </div>
        <div class="toolbar-right">
          <el-button
            v-if="!isReviewer"
            v-permission="'qualification:create'"
            type="primary"
            @click="handleCreateOrEdit()"
          >
            <el-icon><Plus /></el-icon>
            发起认证
          </el-button>
          <el-button
            v-if="isReviewer"
            v-permission="'qualification:review'"
            type="success"
            :disabled="!selectedAuditableIds.length"
            :loading="auditLoading && auditAction === 'approve'"
            @click="handleBatchApprove"
          >
            批量通过
          </el-button>
          <el-button
            v-if="isReviewer"
            v-permission="'qualification:review'"
            type="warning"
            :disabled="!selectedAuditableIds.length"
            :loading="auditLoading && auditAction === 'reject'"
            @click="handleBatchReject"
          >
            批量驳回
          </el-button>
        </div>
      </div>

      <div v-if="!isReviewer" class="status-banner">
        <div class="status-banner-label">当前认证</div>
        <div class="status-banner-main">
          <el-tag :type="currentStatusType" size="large">
            {{ currentStatusText }}
          </el-tag>
          <span class="status-banner-text">
            {{ currentStatusHint }}
          </span>
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
          v-if="isReviewer"
          type="selection"
          width="54"
          :selectable="isRowSelectable"
        />
        <el-table-column prop="applicantName" label="申请人" min-width="120" />
        <el-table-column prop="realName" label="认证姓名" min-width="120" />
        <el-table-column prop="contactPhone" label="联系电话" width="140" />
        <el-table-column prop="qualificationType" label="资格类型" min-width="140" />
        <el-table-column prop="qualificationNo" label="资格编号" min-width="180" show-overflow-tooltip />
        <el-table-column prop="qualificationOrg" label="发证机构" min-width="160" show-overflow-tooltip />
        <el-table-column prop="status" label="认证状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" min-width="170" />
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleViewDetail(row)">
              详情
            </el-button>
            <el-button
              v-if="isReviewer && row.status === 'auditing'"
              v-permission="'qualification:review'"
              link
              type="success"
              size="small"
              @click="handleApprove(row)"
            >
              通过
            </el-button>
            <el-button
              v-if="isReviewer && row.status === 'auditing'"
              v-permission="'qualification:review'"
              link
              type="warning"
              size="small"
              @click="handleReject(row)"
            >
              驳回
            </el-button>
            <el-button
              v-if="!isReviewer"
              v-permission="'qualification:edit'"
              link
              type="warning"
              size="small"
              @click="handleCreateOrEdit(row)"
            >
              修改
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

    <el-dialog v-model="detailVisible" title="认证详情" width="760px" @close="handleDetailClose">
      <el-descriptions v-if="currentRow" :column="2" border>
        <el-descriptions-item label="申请人">{{ currentRow.applicantName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="认证状态">
          <el-tag :type="getStatusType(currentRow.status)" size="small">
            {{ getStatusText(currentRow.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="认证姓名">{{ currentRow.realName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentRow.contactPhone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="身份证号">{{ maskIdCardNo(currentRow.idCardNo) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="资格类型">{{ currentRow.qualificationType || '-' }}</el-descriptions-item>
        <el-descriptions-item label="资格编号">{{ currentRow.qualificationNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="发证机构">{{ currentRow.qualificationOrg || '-' }}</el-descriptions-item>
        <el-descriptions-item label="所在地" :span="2">
          {{ buildLocation(currentRow) || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="认证图片" :span="2">
          <div class="detail-image-list">
            <el-image
              v-if="getPrimaryImage(currentRow)"
              :src="getPrimaryImage(currentRow)"
              :preview-src-list="[getPrimaryImage(currentRow)]"
              preview-teleported
              fit="cover"
              class="detail-image"
            />
            <span v-else>无</span>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="补充证明" :span="2">
          <div v-if="getSupplementProofUrls(currentRow).length" class="detail-image-list">
            <el-image
              v-for="(url, index) in getSupplementProofUrls(currentRow)"
              :key="`${url}-${index}`"
              :src="url"
              :preview-src-list="getSupplementProofUrls(currentRow)"
              preview-teleported
              fit="cover"
              class="detail-image"
            />
          </div>
          <span v-else>无</span>
        </el-descriptions-item>
        <el-descriptions-item label="补充说明" :span="2">
          {{ currentRow.description || '无' }}
        </el-descriptions-item>
        <el-descriptions-item label="审核说明" :span="2">
          {{ currentRow.reviewRemark || '无' }}
        </el-descriptions-item>
        <el-descriptions-item label="审核人">{{ currentRow.reviewerName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="审核时间">{{ currentRow.reviewTime || '-' }}</el-descriptions-item>
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
  getQualificationStatusText,
  getQualificationStatusType,
  QUALIFICATION_STATUS_OPTIONS
} from '@/config/statusConfig'
import { useAuthStore } from '@/stores/auth'
import { useQualificationStore } from '@/stores/qualification'
import {
  buildQualificationLocation,
  fetchCurrentQualificationSafe,
  maskIdCardNo
} from '@/utils/qualification'

export default {
  name: 'QualificationManage',
  components: {
    Search,
    Refresh,
    Plus
  },
  setup() {
    const authStore = useAuthStore()
    const store = useQualificationStore()
    const router = useRouter()
    const currentRecord = ref(null)
    const hasApprovedRecord = ref(false)
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

    const isReviewer = computed(() => authStore.hasPermission('qualification:review'))
    const selectedAuditableIds = computed(() => selectedRows.value
      .filter(item => store.isAuditable(item))
      .map(item => item.id))

    const currentStatus = computed(() => currentRecord.value?.status || '')
    const currentStatusType = computed(() => getQualificationStatusType(currentStatus.value))
    const currentStatusText = computed(() => getQualificationStatusText(currentStatus.value))
    const currentStatusHint = computed(() => {
      if (!currentRecord.value) {
        return '还没有提交认证信息，发起认证并通过审核后才可以接单。'
      }

      if (currentStatus.value === 'approved') {
        return '已有通过认证，可以正常接单，也可以继续发起新的认证记录。'
      }

      if (currentStatus.value === 'auditing') {
        return hasApprovedRecord.value
          ? '已有通过认证可继续接单；最新认证记录正在审核中。'
          : '最新认证记录正在审核中，请等待管理员处理。'
      }

      if (currentStatus.value === 'rejected') {
        return hasApprovedRecord.value
          ? `最新认证已被驳回，但你仍保留已通过认证。驳回原因：${currentRecord.value.reviewRemark || '请根据审核说明修改后重新提交。'}`
          : `审核未通过：${currentRecord.value.reviewRemark || '请根据审核说明修改后重新提交。'}`
      }

      return hasApprovedRecord.value
        ? '当前是草稿状态，你仍保留已通过认证，可继续接单。'
        : '当前为草稿状态，提交并通过审核后才能获得接单资格。'
    })

    const refreshCurrentRecord = async () => {
      if (isReviewer.value) {
        currentRecord.value = null
        hasApprovedRecord.value = false
        return
      }

      const result = await fetchCurrentQualificationSafe()
      currentRecord.value = result.record || null
      hasApprovedRecord.value = !!result.approved
    }

    const getPrimaryImage = row => {
      if (!row) {
        return ''
      }

      return row.idCardFrontUrl || row.idCardBackUrl || row.qualificationImageUrls?.[0] || ''
    }

    const getSupplementProofUrls = row => {
      const primaryImage = getPrimaryImage(row)
      const urls = Array.isArray(row?.qualificationImageUrls) ? row.qualificationImageUrls : []
      return urls.filter((url, index) => url && url !== primaryImage && urls.indexOf(url) === index)
    }

    const handleSearch = async () => {
      try {
        await store.search()
      } catch (error) {
        console.error('Search qualification failed:', error)
      }
    }

    const handleReset = async () => {
      try {
        await store.resetSearch()
      } catch (error) {
        console.error('Reset qualification filter failed:', error)
      }
    }

    const handleCreateOrEdit = row => {
      if (row?.id) {
        router.push(`/qualification/edit/${row.id}`)
        return
      }

      router.push('/qualification/create')
    }

    const handleViewDetail = async row => {
      try {
        await store.openDetail(row.id)
      } catch (error) {
        console.error('Open qualification detail failed:', error)
      }
    }

    const handleSelectionChange = rows => {
      store.setSelectedRows(rows)
    }

    const isRowSelectable = row => store.isAuditable(row)

    const handleApprove = async row => {
      try {
        await ElMessageBox.confirm(`确认通过 ${row.realName || row.applicantName} 的认证申请吗？`, '审核确认', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'success'
        })

        await store.auditRows([row.id], 'approve')
        ElMessage.success('认证审核通过')
      } catch (error) {
        if (error !== 'cancel' && error !== 'close') {
          console.error('Approve qualification failed:', error)
        }
      }
    }

    const handleReject = async row => {
      try {
        const { value } = await ElMessageBox.prompt('请输入驳回说明', '审核驳回', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputPlaceholder: '例如：证明材料不清晰，请重新上传',
          inputValue: ''
        })

        await store.auditRows([row.id], 'reject', value || '')
        ElMessage.success('认证已驳回')
      } catch (error) {
        if (error !== 'cancel' && error !== 'close') {
          console.error('Reject qualification failed:', error)
        }
      }
    }

    const handleBatchApprove = async () => {
      if (!selectedAuditableIds.value.length) {
        ElMessage.warning('请先勾选待审核的认证记录')
        return
      }

      try {
        await ElMessageBox.confirm(`确认批量通过 ${selectedAuditableIds.value.length} 条认证记录吗？`, '批量审核', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'success'
        })

        await store.auditRows(selectedAuditableIds.value, 'approve')
        ElMessage.success('批量审核通过完成')
      } catch (error) {
        if (error !== 'cancel' && error !== 'close') {
          console.error('Batch approve qualification failed:', error)
        }
      }
    }

    const handleBatchReject = async () => {
      if (!selectedAuditableIds.value.length) {
        ElMessage.warning('请先勾选待审核的认证记录')
        return
      }

      try {
        const { value } = await ElMessageBox.prompt('请输入批量驳回说明', '批量驳回', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputPlaceholder: '例如：请补充完整身份信息或证明材料',
          inputValue: ''
        })

        await store.auditRows(selectedAuditableIds.value, 'reject', value || '')
        ElMessage.success('批量驳回完成')
      } catch (error) {
        if (error !== 'cancel' && error !== 'close') {
          console.error('Batch reject qualification failed:', error)
        }
      }
    }

    const handleSizeChange = async val => {
      try {
        await store.setPageSize(val)
      } catch (error) {
        console.error('Change qualification page size failed:', error)
      }
    }

    const handleCurrentChange = async val => {
      try {
        await store.setCurrentPage(val)
      } catch (error) {
        console.error('Change qualification page failed:', error)
      }
    }

    const handleDetailClose = () => {
      store.closeDetail()
    }

    const getStatusType = status => getQualificationStatusType(status)
    const getStatusText = status => getQualificationStatusText(status)
    const buildLocation = row => buildQualificationLocation(row)

    onMounted(async () => {
      try {
        await Promise.all([
          store.fetchData(),
          refreshCurrentRecord()
        ])
      } catch (error) {
        console.error('Load qualification page failed:', error)
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
      selectedAuditableIds,
      auditLoading,
      auditAction,
      statusOptions: QUALIFICATION_STATUS_OPTIONS,
      isReviewer,
      currentRecord,
      currentStatusType,
      currentStatusText,
      currentStatusHint,
      handleSearch,
      handleReset,
      handleCreateOrEdit,
      handleViewDetail,
      handleSelectionChange,
      isRowSelectable,
      handleApprove,
      handleReject,
      handleBatchApprove,
      handleBatchReject,
      handleSizeChange,
      handleCurrentChange,
      handleDetailClose,
      getStatusType,
      getStatusText,
      buildLocation,
      maskIdCardNo,
      getPrimaryImage,
      getSupplementProofUrls
    }
  }
}
</script>

<style scoped>
.qualification-manage {
  padding: 10px;
}

.search-card {
  margin-bottom: 15px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
}

.table-card {
  border-radius: 16px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.page-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.page-subtitle {
  margin-top: 6px;
  color: #6b7280;
  font-size: 14px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.status-banner {
  margin-bottom: 16px;
  padding: 16px 18px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.08), rgba(255, 255, 255, 0.98));
}

.status-banner-label {
  color: #6b7280;
  font-size: 13px;
  margin-bottom: 10px;
}

.status-banner-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.status-banner-text {
  color: #374151;
  line-height: 1.6;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
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

@media (max-width: 768px) {
  .table-header {
    flex-direction: column;
  }
}
</style>
