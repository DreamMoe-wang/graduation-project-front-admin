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
      仅命中需要资格认证标签的订单，在接取前才需要通过对应资格认证。
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
            <div class="stat-label">待支付</div>
            <div class="stat-value stat-pay">{{ displayOrderStats.payPendingCount }}</div>
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
            <span class="order-no">订单号：{{ item.orderNo || '-' }}</span>
            <el-tag :type="getStatusType(getDisplayOrderStatus(item))" size="small">
              {{ getStatusText(getDisplayOrderStatus(item)) }}
            </el-tag>
          </div>

          <div class="order-content">
            <div class="order-left">
              <h3 class="order-title">{{ item.title }}</h3>
              <p class="order-info">
                <span>
                  <el-icon><Location /></el-icon>
                  {{ item.location || item.area || '暂无区域' }}
                </span>
                <span>
                  <el-icon><CollectionTag /></el-icon>
                  {{ (item.categoryNames || []).join(' / ') || '暂无类型' }}
                </span>
                <span>
                  <el-icon><Clock /></el-icon>
                  {{ item.createTime || item.publishTime || '暂无时间' }}
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
              :loading="isActionLoading(item.id, 'receive')"
              @click="handleReceive(item)"
            >
              确认接单
            </el-button>
            <el-button
              v-if="canComplete(item)"
              v-permission="'trade:order:complete'"
              type="success"
              size="small"
              :loading="isActionLoading(item.id, 'complete')"
              @click="handleComplete(item)"
            >
              完成任务
            </el-button>
            <el-button
              v-if="canConfirm(item)"
              v-permission="'trade:order:view'"
              type="primary"
              size="small"
              :loading="isActionLoading(item.id, 'confirm')"
              @click="handleConfirm(item)"
            >
              确认完成
            </el-button>
            <el-button
              v-if="canPay(item)"
              v-permission="'trade:order:view'"
              type="warning"
              size="small"
              :loading="isActionLoading(item.id, 'pay')"
              @click="handlePay(item)"
            >
              去支付
            </el-button>
            <el-button
              v-if="canCancel(item)"
              v-permission="'trade:order:cancel'"
              type="danger"
              size="small"
              plain
              :loading="isActionLoading(item.id, 'cancel')"
              @click="handleCancel(item)"
            >
              {{ getDisplayOrderStatus(item) === 'pending' ? '退单' : '取消订单' }}
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

    <el-dialog v-model="detailVisible" title="订单详情" width="600px">
      <el-descriptions v-if="currentOrder" :column="1" border>
        <el-descriptions-item label="订单号">{{ currentOrder.orderNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="任务标题">{{ currentOrder.title || '-' }}</el-descriptions-item>
        <el-descriptions-item label="所在区域">{{ currentOrder.location || currentOrder.area || '-' }}</el-descriptions-item>
        <el-descriptions-item label="交易类型">
          {{ (currentOrder.categoryNames || []).join(' / ') || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentOrder.createTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="接单人">
          {{
            currentOrder.receiver?.displayName
              || currentOrder.receiver?.nickname
              || currentOrder.receiver?.username
              || '-'
          }}
        </el-descriptions-item>
        <el-descriptions-item label="接单人电话">{{ currentOrder.receiver?.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="订单金额">
          <span class="price-text">￥{{ formatPrice(currentOrder.price ?? currentOrder.amount) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="getStatusType(getDisplayOrderStatus(currentOrder))" size="small">
            {{ getStatusText(getDisplayOrderStatus(currentOrder)) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="支付网关">{{ currentOrder.payGateway || '未支付' }}</el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ currentOrder.payTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="图片信息">
          <div v-if="currentOrder.imageUrls?.length" class="detail-image-list">
            <el-image
              v-for="(url, index) in currentOrder.imageUrls"
              :key="`${url}-${index}`"
              :src="url"
              :preview-src-list="currentOrder.imageUrls"
              preview-teleported
              fit="cover"
              class="detail-image"
            />
          </div>
          <span v-else>-</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="publishTradeDetailVisible" title="订单详情" width="600px">
      <el-descriptions v-if="currentPublishTrade" :column="1" border>
        <el-descriptions-item label="订单号">
          {{ currentPublishTrade.postNo || currentPublishTrade.orderNo || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="任务标题">{{ currentPublishTrade.title || '-' }}</el-descriptions-item>
        <el-descriptions-item label="所在区域">
          {{ currentPublishTrade.location || currentPublishTrade.address || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="交易类型">
          {{ (currentPublishTrade.categoryNames || []).join(' / ') || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ currentPublishTrade.createTime || currentPublishTrade.publishTime || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="接单人">
          {{ currentPublishTrade.workerName || currentPublishTrade.receiver?.displayName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="接单人电话">
          {{ currentPublishTrade.workerPhone || currentPublishTrade.receiver?.phone || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="订单金额">
          <span class="price-text">￥{{ formatPrice(currentPublishTrade.price ?? currentPublishTrade.amount) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="getStatusType(getDisplayOrderStatus(currentPublishTrade))" size="small">
            {{ getStatusText(getDisplayOrderStatus(currentPublishTrade)) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="支付网关">未支付</el-descriptions-item>
        <el-descriptions-item label="支付时间">-</el-descriptions-item>
        <el-descriptions-item label="图片信息">
          <div v-if="currentPublishTrade.imageUrls?.length" class="detail-image-list">
            <el-image
              v-for="(url, index) in currentPublishTrade.imageUrls"
              :key="`${url}-${index}`"
              :src="url"
              :preview-src-list="currentPublishTrade.imageUrls"
              preview-teleported
              fit="cover"
              class="detail-image"
            />
          </div>
          <span v-else>-</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script>
import { Clock, CollectionTag, Location } from '@element-plus/icons-vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOrderStatusText, getOrderStatusType } from '@/config/statusConfig'
import { getTradePublishDetail, getTradePublishPage } from '@/api/tradePublish'
import { formatCurrency } from '@/utils/format'
import { useAuthStore } from '@/stores/auth'
import { useTradeOrderStore } from '@/stores/tradeOrder'
import { fetchCurrentQualificationSafe, resolveQualificationRedirectPath } from '@/utils/qualification'
import { getTradeCategoryList } from '@/api/tradeCategory'

const ROLE_ROUTE_MAP = {
  publisher: '/trade/order/publish',
  receiver: '/trade/order/receive'
}

const APPROVED_PUBLISH_STATUSES = new Set(['published', 'trading', 'completed'])

function resolveOrderRoleByPath(path = '') {
  return path === ROLE_ROUTE_MAP.receiver ? 'receiver' : 'publisher'
}

function normalizeTradePostStatus(status) {
  if (status == null || status === '') return ''

  const statusMap = {
    0: 'draft',
    1: 'auditing',
    2: 'rejected',
    3: 'published',
    4: 'trading',
    5: 'completed'
  }

  if (typeof status === 'number') {
    return statusMap[status] || String(status)
  }

  return String(status)
}

function normalizeOrderStatus(status) {
  if (status == null || status === '') return ''

  const statusMap = {
    0: 'pending',
    1: 'progress',
    2: 'confirm_pending',
    3: 'success',
    4: 'cancel'
  }

  if (typeof status === 'number') {
    return statusMap[status] || String(status)
  }

  const normalized = String(status)
  return statusMap[normalized] || normalized
}

function normalizePayStatus(status) {
  if (status == null || status === '') return ''

  const statusMap = {
    0: 'unpaid',
    1: 'paid',
    2: 'refunded',
    3: 'settled'
  }

  if (typeof status === 'number') {
    return statusMap[status] || String(status)
  }

  const normalized = String(status)
  return statusMap[normalized] || normalized
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
    const { loading, orderList, pagination, detailVisible, currentOrder } = storeToRefs(store)
    const { currentUser } = storeToRefs(authStore)
    const activeOrderRole = ref(resolveOrderRoleByPath(route.path))
    const qualificationChecked = ref(false)
    const qualificationRecord = ref(null)
    const tradeCategoryOptions = ref([])
    const publishTradeList = ref([])
    const publisherOrderList = ref([])
    const publishTradeDetailVisible = ref(false)
    const currentPublishTrade = ref(null)

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

    const approvedQualificationTypes = computed(() => (
      Array.isArray(qualificationRecord.value?.approvedQualificationTypes)
        ? qualificationRecord.value.approvedQualificationTypes
        : []
    ))

    const tradeCategoryRequirementMap = computed(() => tradeCategoryOptions.value.reduce((acc, item) => {
      if (item?.categoryName) {
        acc[item.categoryName] = !!item.requiresQualification
      }
      return acc
    }, {}))

    const pageTitle = computed(() => (activeOrderRole.value === 'publisher' ? '发布订单' : '接取订单'))
    const pageSubtitle = computed(() => (
      activeOrderRole.value === 'publisher'
        ? '显示当前用户已审核通过的发布单，以及已进入订单流程的记录。'
        : '查看自己接取的全部订单，并推进确认、退单与履约流程。'
    ))

    const extractOrderId = item => normalizeUserId(item?.id ?? item?.orderId)
    const extractOrderTradeId = item => normalizeUserId(item?.postId ?? item?.tradeId)

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
    )

    const normalizeOrderItem = item => ({
      ...item,
      __recordType: 'order',
      id: item?.id ?? item?.orderId,
      orderNo: item?.orderNo || '',
      postId: item?.postId ?? item?.tradeId ?? null,
      title: item?.title || '',
      area: item?.area || item?.location || '',
      location: item?.location || item?.area || '',
      categoryNames: Array.isArray(item?.categoryNames) ? item.categoryNames : [],
      createTime: item?.createTime || '',
      publishTime: item?.publishTime || '',
      price: Number(item?.price ?? item?.amount ?? 0),
      amount: Number(item?.amount ?? item?.price ?? 0),
      payStatus: normalizePayStatus(item?.payStatus),
      status: normalizeOrderStatus(item?.status),
      publisherId: extractPublisherId(item),
      receiverId: extractReceiverId(item)
    })

    const normalizePublishTradeItem = item => ({
      ...item,
      __recordType: 'publish',
      id: item?.id ?? item?.postId,
      orderNo: item?.postNo || item?.orderNo || '',
      postId: item?.id ?? item?.postId ?? null,
      title: item?.title || '',
      area: item?.area || item?.areaName || item?.cityName || '',
      location: item?.location || item?.address || item?.areaName || item?.cityName || '',
      categoryNames: Array.isArray(item?.categoryNames) ? item.categoryNames : [],
      createTime: item?.createTime || item?.publishTime || '',
      publishTime: item?.publishTime || '',
      price: Number(item?.price ?? item?.amount ?? 0),
      amount: Number(item?.amount ?? item?.price ?? 0),
      status: normalizeTradePostStatus(item?.status),
      publisherId: extractPublisherId(item),
      receiverId: extractReceiverId(item),
      payStatus: normalizePayStatus(item?.payStatus)
    })

    const publishDisplayList = computed(() => publishTradeList.value.map(normalizePublishTradeItem))
    const receiverDisplayList = computed(() => orderList.value.map(normalizeOrderItem))
    const publisherOrderDisplayList = computed(() => publisherOrderList.value.map(normalizeOrderItem))

    const publisherFullList = computed(() => {
      const approvedPublishList = publishDisplayList.value.filter(item => APPROVED_PUBLISH_STATUSES.has(item.status))
      const publisherOrders = publisherOrderDisplayList.value.filter(item => (
        !currentUserId.value || extractPublisherId(item) === currentUserId.value
      ))
      const orderPostIdSet = new Set(publisherOrders.map(item => item.postId).filter(Boolean))
      const pendingPublishList = approvedPublishList.filter(item => !orderPostIdSet.has(item.postId))

      return [...publisherOrders, ...pendingPublishList].sort((left, right) => {
        const leftTime = new Date(left.createTime || left.publishTime || 0).getTime()
        const rightTime = new Date(right.createTime || right.publishTime || 0).getTime()
        return rightTime - leftTime
      })
    })

    const visibleOrderList = computed(() => {
      if (activeOrderRole.value === 'publisher') {
        const start = (pagination.value.currentPage - 1) * pagination.value.pageSize
        const end = start + pagination.value.pageSize
        return publisherFullList.value.slice(start, end)
      }

      const sourceList = receiverDisplayList.value
      if (!currentUserId.value) return sourceList
      return sourceList.filter(item => extractReceiverId(item) === currentUserId.value)
    })

    const getRequiredQualificationTypes = item => (item?.categoryNames || [])
      .filter(name => tradeCategoryRequirementMap.value[name])

    const showQualificationTip = computed(() => (
      activeOrderRole.value === 'receiver'
      && visibleOrderList.value.some(item => getRequiredQualificationTypes(item).length > 0)
    ))

    const emptyDescription = computed(() => (
      activeOrderRole.value === 'publisher'
        ? '暂无我发布的订单'
        : '暂无我接取的订单'
    ))

    const getDisplayOrderStatus = item => {
      if (!item) return ''

      if (item.__recordType === 'publish') {
        if (item.status === 'published') return 'published'
        if (item.status === 'trading') return 'progress'
        if (item.status === 'completed') return 'success'
        if (item.status === 'cancel') return 'cancel'
      }

      const normalizedStatus = normalizeOrderStatus(item.status)
      const normalizedPayStatus = normalizePayStatus(item.payStatus)
      if (normalizedStatus === 'success' && (normalizedPayStatus || 'unpaid') === 'unpaid') {
        return 'pay_pending'
      }

      return normalizedStatus
    }

    const displayOrderStats = computed(() => visibleOrderList.value.reduce((stats, item) => {
      const displayStatus = getDisplayOrderStatus(item)
      stats.totalCount += 1

      if (displayStatus === 'pending' || displayStatus === 'published') {
        stats.pendingCount += 1
      } else if (displayStatus === 'progress' || displayStatus === 'confirm_pending') {
        stats.progressCount += 1
      } else if (displayStatus === 'pay_pending') {
        stats.payPendingCount += 1
      } else if (displayStatus === 'success') {
        stats.successCount += 1
      }

      return stats
    }, {
      totalCount: 0,
      pendingCount: 0,
      progressCount: 0,
      payPendingCount: 0,
      successCount: 0
    }))

    const loadTradeCategoryOptions = async () => {
      try {
        const list = await getTradeCategoryList()
        tradeCategoryOptions.value = Array.isArray(list) ? list.filter(item => item?.categoryName) : []
      } catch (error) {
        tradeCategoryOptions.value = []
        console.error('Load trade categories failed:', error)
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
      if (!qualificationChecked.value) {
        await refreshQualificationStatus()
      }

      const requiredTypes = getRequiredQualificationTypes(item)
      if (!requiredTypes.length) return true
      if (hasRequiredQualification(item)) return true

      ElMessage.warning(`请先完成并通过以下任一资格认证后再接单：${requiredTypes.join(' / ')}`)
      router.push(resolveQualificationRedirectPath(qualificationRecord.value))
      return false
    }

    const isReceiver = item => currentUserId.value && extractReceiverId(item) === currentUserId.value
    const isPublisher = item => currentUserId.value && extractPublisherId(item) === currentUserId.value

    const canReceive = item => {
      if (item?.__recordType !== 'order') return false
      if (activeOrderRole.value !== 'receiver') return false
      return getDisplayOrderStatus(item) === 'pending' && hasRequiredQualification(item)
    }

    const getQualificationWarning = item => {
      if (item?.__recordType !== 'order') return ''
      const requiredTypes = getRequiredQualificationTypes(item)
      if (!requiredTypes.length || hasRequiredQualification(item)) return ''
      return `该订单需具备以下任一已通过认证：${requiredTypes.join(' / ')}`
    }

    const canComplete = item => item?.__recordType === 'order' && getDisplayOrderStatus(item) === 'progress' && isReceiver(item)
    const canConfirm = item => item?.__recordType === 'order' && getDisplayOrderStatus(item) === 'confirm_pending' && isPublisher(item)

    const canCancel = item => {
      if (item?.__recordType !== 'order') return false
      if (!currentUserId.value || !isReceiver(item)) return false
      const displayStatus = getDisplayOrderStatus(item)
      return displayStatus === 'pending' || displayStatus === 'progress' || displayStatus === 'confirm_pending'
    }

    const canPay = item => {
      if (item?.__recordType !== 'order') return false
      return !!currentUserId.value && isPublisher(item) && getDisplayOrderStatus(item) === 'pay_pending'
    }

    const canContact = item => item?.__recordType === 'order'

    const syncRoleByRoute = path => {
      activeOrderRole.value = resolveOrderRoleByPath(path)
    }

    const fetchPublisherTrades = async () => {
      const pageData = await getTradePublishPage({
        publisherId: currentUserId.value,
        pageNum: 1,
        pageSize: 1000
      })

      publishTradeList.value = Array.isArray(pageData?.records) ? pageData.records : []
      pagination.value.total = publisherFullList.value.length
    }

    const fetchPublisherOrders = async () => {
      const pageData = await getTradeOrderPage({
        pageNum: 1,
        pageSize: 1000
      })

      const records = Array.isArray(pageData?.records) ? pageData.records : []
      publisherOrderList.value = records.filter(item => extractPublisherId(item) === currentUserId.value)
    }

    const fetchRoleData = async () => {
      if (activeOrderRole.value === 'publisher') {
        await Promise.all([
          fetchPublisherTrades(),
          fetchPublisherOrders()
        ])
        pagination.value.total = publisherFullList.value.length
        return
      }

      await store.fetchData()
    }

    const handleRoleChange = async role => {
      const targetPath = ROLE_ROUTE_MAP[role] || ROLE_ROUTE_MAP.publisher
      if (route.path !== targetPath) {
        await router.push(targetPath)
      }

      try {
        pagination.value.currentPage = 1
        await fetchRoleData()
      } catch (error) {
        console.error('Switch order role failed:', error)
      }
    }

    const handleViewDetail = async item => {
      try {
        if (item?.__recordType === 'publish') {
          currentPublishTrade.value = await getTradePublishDetail(item.id)
          publishTradeDetailVisible.value = true
          return
        }

        await store.openDetail(item.id)
      } catch (error) {
        console.error('Open order detail failed:', error)
      }
    }

    const handleReceive = async item => {
      try {
        const allowed = await ensureQualificationApproved(item)
        if (!allowed) return

        if (!canReceive(item)) {
          ElMessage.warning(getQualificationWarning(item) || '当前订单暂不允许确认接单')
          return
        }

        await store.receive(item.id)
        ElMessage.success('接单成功')
      } catch (error) {
        console.error('Receive order failed:', error)
      }
    }

    const handleComplete = async item => {
      try {
        await store.complete(item.id)
        ElMessage.success('已提交完成，等待委托方确认')
      } catch (error) {
        console.error('Complete order failed:', error)
      }
    }

    const handleConfirm = async item => {
      try {
        await store.confirm(item.id)
        ElMessage.success('委托方已确认完成，可进入支付')
      } catch (error) {
        console.error('Confirm order failed:', error)
      }
    }

    const handlePay = async item => {
      try {
        await store.pay(item.id)
        ElMessage.success('支付成功')
      } catch (error) {
        console.error('Pay order failed:', error)
      }
    }

    const handleCancel = async item => {
      const actionText = getDisplayOrderStatus(item) === 'pending' ? '退单' : '取消订单'

      try {
        await ElMessageBox.confirm(`确定要${actionText}“${item.orderNo}”吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        await store.cancel(item.id)
        ElMessage.success(`${actionText}成功`)
      } catch (error) {
        if (error !== 'cancel' && error !== 'close') {
          console.error(`${actionText} failed:`, error)
        }
      }
    }

    const handleContact = item => {
      const orderId = extractOrderId(item)
      if (!orderId) {
        ElMessage.warning('当前订单信息不完整，暂时无法创建会话')
        return
      }

      const tradeId = extractOrderTradeId(item)
      router.push({
        path: '/chat',
        query: {
          orderId,
          ...(tradeId ? { tradeId } : {})
        }
      })
      ElMessage.info('已跳转到聊天室，正在打开对应订单会话')
    }

    const handleSizeChange = async val => {
      try {
        pagination.value.pageSize = val
        pagination.value.currentPage = 1
        await fetchRoleData()
      } catch (error) {
        console.error('Change order page size failed:', error)
      }
    }

    const handleCurrentChange = async val => {
      try {
        pagination.value.currentPage = val
        await fetchRoleData()
      } catch (error) {
        console.error('Change order page failed:', error)
      }
    }

    const formatPrice = price => formatCurrency(price, { withSymbol: false })
    const getStatusType = status => getOrderStatusType(status)
    const getStatusText = status => getOrderStatusText(status)
    const isActionLoading = (id, type) => store.isActionLoading(id, type)

    watch(
      () => route.path,
      async path => {
        syncRoleByRoute(path)
        try {
          await fetchRoleData()
        } catch (error) {
          console.error('Sync order role data failed:', error)
        }
      }
    )

    onMounted(async () => {
      syncRoleByRoute(route.path)

      try {
        await Promise.all([
          fetchRoleData(),
          refreshQualificationStatus(),
          loadTradeCategoryOptions()
        ])
      } catch (error) {
        console.error('Load order data failed:', error)
      }
    })

    onUnmounted(() => {
      store.resetTransientState()
      publisherOrderList.value = []
      publishTradeList.value = []
      publishTradeDetailVisible.value = false
      currentPublishTrade.value = null
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
      detailVisible,
      currentOrder,
      publishTradeDetailVisible,
      currentPublishTrade,
      canReceive,
      canComplete,
      canConfirm,
      canPay,
      canCancel,
      canContact,
      getQualificationWarning,
      handleRoleChange,
      handleViewDetail,
      handleReceive,
      handleComplete,
      handleConfirm,
      handlePay,
      handleCancel,
      handleContact,
      handleSizeChange,
      handleCurrentChange,
      formatPrice,
      getDisplayOrderStatus,
      getStatusType,
      getStatusText,
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

.stat-pay {
  color: #f56c6c;
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

.price-text {
  color: #f56c6c;
  font-weight: 700;
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
