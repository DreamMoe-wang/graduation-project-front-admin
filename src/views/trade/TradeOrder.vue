<template>
  <div class="trade-order">
    <div class="order-role-header">
      <div>
        <h2 class="order-role-title">{{ pageTitle }}</h2>
        <p class="order-role-subtitle">{{ pageSubtitle }}</p>
      </div>
      <el-segmented
        v-model="activeOrderRole"
        :options="roleOptions"
        class="role-switch"
        @change="handleRoleChange"
      />
    </div>

    <div v-if="activeOrderRole === 'receiver' && showQualificationTip" class="qualification-tip">
      接取带资格要求的订单前，需要先通过对应资格认证。
    </div>

    <el-row :gutter="20" class="stats-row">
      <el-col :xs="12" :sm="8" :md="8" :lg="4" :xl="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-label">全部订单</div>
            <div class="stat-value">{{ displayOrderStats.totalCount }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8" :md="8" :lg="4" :xl="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-label">待确认</div>
            <div class="stat-value stat-pending">{{ displayOrderStats.pendingCount }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8" :md="8" :lg="4" :xl="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-label">进行中</div>
            <div class="stat-value stat-progress">{{ displayOrderStats.progressCount }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="8" :md="8" :lg="4" :xl="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-label">已完成</div>
            <div class="stat-value stat-success">{{ displayOrderStats.successCount }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <div v-loading="loading">
      <template v-if="visibleOrderList.length">
        <el-card v-for="item in visibleOrderList" :key="`${item.__recordType}-${item.id}`" class="order-card">
          <div class="order-header">
            <span class="order-no">订单号：{{ item.orderNo || item.postNo || '-' }}</span>
            <el-tag :type="getStatusType(getDisplayStatus(item))" size="small">
              {{ getStatusText(getDisplayStatus(item)) }}
            </el-tag>
          </div>

          <div class="order-content">
            <div class="order-left">
              <h3 class="order-title">{{ item.title }}</h3>
              <p class="order-info">
                <span>
                  <el-icon><Location /></el-icon>
                  {{ item.location || item.area || '-' }}
                </span>
                <span>
                  <el-icon><CollectionTag /></el-icon>
                  {{ (item.categoryNames || []).join(' / ') || '-' }}
                </span>
                <span>
                  <el-icon><Clock /></el-icon>
                  {{ item.createTime || item.publishTime || '-' }}
                </span>
              </p>
            </div>
            <div class="order-right">
              <div class="order-price">￥{{ formatPrice(item.price ?? item.amount) }}</div>
            </div>
          </div>

          <div v-if="getQualificationWarning(item)" class="qualification-item-tip">
            {{ getQualificationWarning(item) }}
          </div>

          <div class="order-actions">
            <el-button
              v-if="canReceive(item)"
              v-permission="'trade:order:receive'"
              type="primary"
              size="small"
              :loading="isActionLoading(getActionOrderId(item), 'receive')"
              @click="handleReceive(item)"
            >
              确认接单
            </el-button>
            <el-button
              v-if="canComplete(item)"
              v-permission="'trade:order:complete'"
              type="success"
              size="small"
              :loading="isActionLoading(getActionOrderId(item), 'complete')"
              @click="handleComplete(item)"
            >
              完成任务
            </el-button>
            <el-button
              v-if="canConfirm(item)"
              v-permission="{ any: ['trade:publish:view', 'trade:order:view'] }"
              type="primary"
              size="small"
              :loading="isActionLoading(getActionOrderId(item), 'confirm')"
              @click="handleConfirm(item)"
            >
              委托方确认
            </el-button>
            <el-button
              v-if="canCancel(item)"
              v-permission="'trade:order:cancel'"
              type="danger"
              size="small"
              plain
              :loading="isActionLoading(getActionOrderId(item), 'cancel')"
              @click="handleCancel(item)"
            >
              {{ getDisplayStatus(item) === 'pending' ? '退单' : '取消订单' }}
            </el-button>
            <el-button size="small" plain @click="handleViewDetail(item)">查看详情</el-button>
            <el-button
              v-if="canContact(item)"
              v-permission="{ any: ['chat:contact', 'chat:view'] }"
              size="small"
              plain
              @click="handleContact(item)"
            >
              联系对方
            </el-button>
          </div>
        </el-card>
      </template>

      <el-empty v-else :description="emptyDescription" />
    </div>

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
  </div>
</template>

<script>
import { Clock, CollectionTag, Location } from '@element-plus/icons-vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOrderStatusText, getOrderStatusType } from '@/config/statusConfig'
import { getTradePublishPage } from '@/api/tradePublish'
import { formatCurrency } from '@/utils/format'
import { useAuthStore } from '@/stores/auth'
import { useTradeOrderStore } from '@/stores/tradeOrder'
import { fetchCurrentQualificationSafe, resolveQualificationRedirectPath } from '@/utils/qualification'
import { getTradeCategoryList } from '@/api/tradeCategory'

const ROLE_ROUTE_MAP = {
  publisher: '/trade/order/publish',
  receiver: '/trade/order/receive'
}

const PUBLISH_FLOW_SET = new Set(['published', 'pending', 'progress', 'confirm_pending', 'success'])

function resolveOrderRoleByPath(path = '') {
  return path === ROLE_ROUTE_MAP.receiver ? 'receiver' : 'publisher'
}

function normalizeTradeStatus(status) {
  if (status == null || status === '') return ''
  if (typeof status === 'number') {
    return {
      0: 'draft',
      1: 'auditing',
      2: 'rejected',
      3: 'published',
      4: 'trading',
      5: 'completed'
    }[status] || String(status)
  }
  return String(status)
}

function normalizeOrderStatus(status) {
  if (status == null || status === '') return ''
  if (typeof status === 'number') {
    return {
      0: 'pending',
      1: 'progress',
      2: 'confirm_pending',
      3: 'success',
      4: 'cancel'
    }[status] || String(status)
  }
  return String(status)
}

function normalizePayStatus(status) {
  if (status == null || status === '') return ''
  if (typeof status === 'number') {
    return {
      0: 'unpaid',
      1: 'paid',
      2: 'refunded',
      3: 'settled'
    }[status] || String(status)
  }
  return String(status)
}

export default {
  name: 'TradeOrder',
  components: {
    Clock,
    CollectionTag,
    Location
  },
  setup() {
    const store = useTradeOrderStore()
    const authStore = useAuthStore()
    const route = useRoute()
    const router = useRouter()
    const { loading, orderList, pagination } = storeToRefs(store)
    const { currentUser } = storeToRefs(authStore)

    const activeOrderRole = ref(resolveOrderRoleByPath(route.path))
    const qualificationChecked = ref(false)
    const qualificationRecord = ref(null)
    const tradeCategoryOptions = ref([])
    const publishTradeList = ref([])

    const roleOptions = [
      { label: '发布订单', value: 'publisher' },
      { label: '接取订单', value: 'receiver' }
    ]

    const normalizeUserId = value => {
      if (value == null || value === '') return null
      const id = Number(value)
      return Number.isNaN(id) ? null : id
    }

    const currentUserId = computed(() => normalizeUserId(currentUser.value?.userId ?? currentUser.value?.id))

    const pageTitle = computed(() => (activeOrderRole.value === 'publisher' ? '发布订单' : '接取订单'))
    const pageSubtitle = computed(() => (
      activeOrderRole.value === 'publisher'
        ? '显示当前用户发布后的订单流程记录。'
        : '显示当前用户接取后的订单流程记录。'
    ))

    const approvedQualificationTypes = computed(() => (
      Array.isArray(qualificationRecord.value?.approvedQualificationTypes)
        ? qualificationRecord.value.approvedQualificationTypes
        : []
    ))

    const tradeCategoryRequirementMap = computed(() => tradeCategoryOptions.value.reduce((acc, item) => {
      if (item?.categoryName) acc[item.categoryName] = !!item.requiresQualification
      return acc
    }, {}))

    const extractPublisherId = item => normalizeUserId(
      item?.publisherId
      ?? item?.publisher?.userId
      ?? item?.publisher?.id
      ?? item?.publishUserId
      ?? item?.userId
    )

    const extractReceiverId = item => normalizeUserId(
      item?.receiverId
      ?? item?.receiver?.userId
      ?? item?.receiver?.id
      ?? item?.workerId
      ?? item?.worker?.userId
      ?? item?.worker?.id
    )

    const getActionOrderId = item => normalizeUserId(item?.orderId ?? item?.id)
    const extractTradeId = item => normalizeUserId(item?.postId ?? item?.id)

    const normalizeOrderItem = item => ({
      ...item,
      __recordType: 'order',
      id: item?.id ?? null,
      orderId: item?.id ?? null,
      postId: item?.postId ?? null,
      postNo: item?.postNo || '',
      orderNo: item?.orderNo || '',
      title: item?.title || '',
      location: item?.location || item?.area || '',
      area: item?.area || item?.location || '',
      categoryNames: Array.isArray(item?.categoryNames) ? item.categoryNames : [],
      createTime: item?.createTime || '',
      publishTime: item?.publishTime || '',
      price: Number(item?.price ?? item?.amount ?? 0),
      amount: Number(item?.amount ?? item?.price ?? 0),
      status: normalizeOrderStatus(item?.status),
      payStatus: normalizePayStatus(item?.payStatus),
      publisherId: extractPublisherId(item),
      receiverId: extractReceiverId(item)
    })

    const normalizePublishItem = item => ({
      ...item,
      __recordType: 'publish',
      id: item?.id ?? null,
      orderId: normalizeUserId(item?.orderId),
      postId: item?.id ?? item?.postId ?? null,
      postNo: item?.postNo || '',
      orderNo: item?.orderNo || '',
      title: item?.title || '',
      location: item?.location || '',
      area: item?.areaName || item?.cityName || '',
      categoryNames: Array.isArray(item?.categoryNames) ? item.categoryNames : [],
      createTime: item?.createTime || '',
      publishTime: item?.publishTime || '',
      price: Number(item?.amount ?? 0),
      amount: Number(item?.amount ?? 0),
      tradeStatus: normalizeTradeStatus(item?.status),
      flowStatus: normalizeOrderStatus(item?.flowStatus) || normalizeTradeStatus(item?.flowStatus) || normalizeTradeStatus(item?.status),
      payStatus: normalizePayStatus(item?.payStatus),
      publisherId: extractPublisherId(item),
      receiverId: extractReceiverId(item)
    })

    const normalizedReceiverOrders = computed(() => orderList.value.map(normalizeOrderItem))
    const normalizedPublisherTrades = computed(() => publishTradeList.value.map(normalizePublishItem))

    const visibleOrderList = computed(() => {
      const sourceList = activeOrderRole.value === 'publisher'
        ? normalizedPublisherTrades.value.filter(item => PUBLISH_FLOW_SET.has(getDisplayStatus(item)))
        : normalizedReceiverOrders.value.filter(item => item.receiverId === currentUserId.value)
      return sourceList
    })

    const getRequiredQualificationTypes = item => (item?.categoryNames || [])
      .filter(name => tradeCategoryRequirementMap.value[name])

    const showQualificationTip = computed(() => (
      activeOrderRole.value === 'receiver'
      && visibleOrderList.value.some(item => getRequiredQualificationTypes(item).length > 0)
    ))

    const emptyDescription = computed(() => (
      activeOrderRole.value === 'publisher' ? '暂无我发布的订单' : '暂无我接取的订单'
    ))

    const getDisplayStatus = item => {
      if (!item) return ''
      if (item.__recordType === 'publish') {
        return item.flowStatus || item.tradeStatus || ''
      }
      return item.status
    }

    const displayOrderStats = computed(() => visibleOrderList.value.reduce((stats, item) => {
      const status = getDisplayStatus(item)
      stats.totalCount += 1
      if (status === 'published' || status === 'pending') stats.pendingCount += 1
      else if (status === 'progress' || status === 'confirm_pending') stats.progressCount += 1
      else if (status === 'success') stats.successCount += 1
      return stats
    }, {
      totalCount: 0,
      pendingCount: 0,
      progressCount: 0,
      successCount: 0
    }))

    const loadTradeCategoryOptions = async () => {
      try {
        const list = await getTradeCategoryList()
        tradeCategoryOptions.value = Array.isArray(list) ? list.filter(item => item?.categoryName) : []
      } catch (error) {
        tradeCategoryOptions.value = []
      }
    }

    const refreshQualificationStatus = async () => {
      if (authStore.hasPermission('qualification:review')) {
        qualificationChecked.value = true
        qualificationRecord.value = null
        return
      }
      const result = await fetchCurrentQualificationSafe()
      qualificationChecked.value = true
      qualificationRecord.value = result.record || null
    }

    const hasRequiredQualification = item => {
      const requiredTypes = getRequiredQualificationTypes(item)
      if (!requiredTypes.length) return true
      if (authStore.hasPermission('qualification:review')) return true
      return requiredTypes.some(type => approvedQualificationTypes.value.includes(type))
    }

    const ensureQualificationApproved = async item => {
      if (!qualificationChecked.value) await refreshQualificationStatus()
      const requiredTypes = getRequiredQualificationTypes(item)
      if (!requiredTypes.length || hasRequiredQualification(item)) return true
      ElMessage.warning(`请先完成并通过以下任一资格认证后再接单：${requiredTypes.join(' / ')}`)
      router.push(resolveQualificationRedirectPath(qualificationRecord.value))
      return false
    }

    const isReceiver = item => currentUserId.value && extractReceiverId(item) === currentUserId.value
    const isPublisher = item => currentUserId.value && extractPublisherId(item) === currentUserId.value

    const canReceive = item => item?.__recordType === 'order' && activeOrderRole.value === 'receiver' && getDisplayStatus(item) === 'pending' && hasRequiredQualification(item)
    const canComplete = item => item?.__recordType === 'order' && isReceiver(item) && getDisplayStatus(item) === 'progress'
    const canConfirm = item => isPublisher(item) && !!getActionOrderId(item) && getDisplayStatus(item) === 'confirm_pending'
    const canCancel = item => item?.__recordType === 'order' && isReceiver(item) && ['pending', 'progress', 'confirm_pending'].includes(getDisplayStatus(item))
    const canContact = item => !!getActionOrderId(item)

    const getQualificationWarning = item => {
      if (item?.__recordType !== 'order') return ''
      const requiredTypes = getRequiredQualificationTypes(item)
      if (!requiredTypes.length || hasRequiredQualification(item)) return ''
      return `该订单需具备以下任一已通过认证：${requiredTypes.join(' / ')}`
    }

    const syncRoleByRoute = path => {
      activeOrderRole.value = resolveOrderRoleByPath(path)
    }

    const fetchPublisherTrades = async () => {
      const pageData = await getTradePublishPage({
        status: 'all',
        pageNum: 1,
        pageSize: 1000
      })
      const records = Array.isArray(pageData?.records) ? pageData.records : []
      publishTradeList.value = records.filter(item => extractPublisherId(item) === currentUserId.value)
      pagination.value.total = publishTradeList.value.length
    }

    const fetchRoleData = async () => {
      if (activeOrderRole.value === 'publisher') {
        await fetchPublisherTrades()
        pagination.value.total = visibleOrderList.value.length
        return
      }
      await store.fetchData()
    }

    const handleRoleChange = async role => {
      const targetPath = ROLE_ROUTE_MAP[role] || ROLE_ROUTE_MAP.publisher
      if (route.path !== targetPath) {
        await router.push(targetPath)
      }
      pagination.value.currentPage = 1
      await fetchRoleData()
    }

    const handleViewDetail = item => {
      const orderId = getActionOrderId(item)
      if (!orderId) {
        ElMessage.info('当前是未成单记录，可在交易发布页查看详细发布信息')
        return
      }
      store.openDetail(orderId)
    }

    const handleReceive = async item => {
      const allowed = await ensureQualificationApproved(item)
      if (!allowed) return
      await store.receive(item.id)
      ElMessage.success('接单成功')
    }

    const handleComplete = async item => {
      await store.complete(item.id)
      ElMessage.success('已提交完成，等待委托方确认')
    }

    const handleConfirm = async item => {
      await store.confirm(getActionOrderId(item))
      ElMessage.success('委托方已确认完成')
      await fetchRoleData()
    }

    const handleCancel = async item => {
      const actionText = getDisplayStatus(item) === 'pending' ? '退单' : '取消订单'
      await ElMessageBox.confirm(`确定要${actionText}“${item.orderNo}”吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await store.cancel(getActionOrderId(item))
      ElMessage.success(`${actionText}成功`)
    }

    const handleContact = item => {
      const orderId = getActionOrderId(item)
      if (!orderId) {
        ElMessage.warning('当前记录没有可聊天的订单')
        return
      }
      const tradeId = extractTradeId(item)
      router.push({
        path: '/chat',
        query: {
          orderId,
          ...(tradeId ? { tradeId } : {})
        }
      })
    }

    const handleSizeChange = async val => {
      pagination.value.pageSize = val
      pagination.value.currentPage = 1
      await fetchRoleData()
    }

    const handleCurrentChange = async val => {
      pagination.value.currentPage = val
      await fetchRoleData()
    }

    const formatPrice = price => formatCurrency(price, { withSymbol: false })
    const getStatusType = status => getOrderStatusType(status)
    const getStatusText = status => getOrderStatusText(status)
    const isActionLoading = (id, type) => store.isActionLoading(id, type)

    watch(
      () => route.path,
      async path => {
        syncRoleByRoute(path)
        await fetchRoleData()
      }
    )

    onMounted(async () => {
      syncRoleByRoute(route.path)
      await Promise.all([
        fetchRoleData(),
        refreshQualificationStatus(),
        loadTradeCategoryOptions()
      ])
    })

    onUnmounted(() => {
      store.resetTransientState()
      publishTradeList.value = []
    })

    return {
      loading,
      roleOptions,
      activeOrderRole,
      showQualificationTip,
      pageTitle,
      pageSubtitle,
      visibleOrderList,
      emptyDescription,
      displayOrderStats,
      pagination,
      canReceive,
      canComplete,
      canConfirm,
      canCancel,
      canContact,
      getQualificationWarning,
      handleRoleChange,
      handleViewDetail,
      handleReceive,
      handleComplete,
      handleConfirm,
      handleCancel,
      handleContact,
      handleSizeChange,
      handleCurrentChange,
      formatPrice,
      getDisplayStatus,
      getStatusType,
      getStatusText,
      getActionOrderId,
      isActionLoading
    }
  }
}
</script>

<style scoped>
.trade-order {
  padding: 20px;
}

.order-role-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.order-role-title {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
  color: #1f2937;
}

.order-role-subtitle {
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.role-switch {
  flex-shrink: 0;
}

.qualification-tip {
  margin-bottom: 18px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(245, 158, 11, 0.08);
  color: #9a6b16;
  font-size: 14px;
}

.qualification-item-tip {
  margin-bottom: 12px;
  color: #9a6b16;
  font-size: 13px;
  line-height: 1.6;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-item {
  padding: 20px 0;
}

.stat-label {
  color: #999;
  font-size: 14px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #333;
}

.stat-pending {
  color: #e6a23c;
}

.stat-progress {
  color: #409eff;
}

.stat-success {
  color: #67c23a;
}

.order-card {
  margin-bottom: 16px;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.order-no {
  color: #999;
  font-size: 13px;
}

.order-content {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.order-left {
  min-width: 0;
}

.order-title {
  margin: 0 0 8px;
  font-size: 16px;
  color: #333;
}

.order-info {
  margin: 0;
  color: #666;
  font-size: 13px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.order-info span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.order-price {
  font-size: 24px;
  color: #f56c6c;
  font-weight: 700;
  white-space: nowrap;
}

.order-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  flex-wrap: wrap;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .order-role-header {
    flex-direction: column;
    align-items: stretch;
  }

  .order-content {
    flex-direction: column;
  }

  .order-actions {
    justify-content: flex-start;
  }
}
</style>
