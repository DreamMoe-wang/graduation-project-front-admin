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
        <el-card v-for="item in visibleOrderList" :key="item.id" class="order-card">
          <div class="order-header">
            <span class="order-no">订单号：{{ item.orderNo }}</span>
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
                  {{ item.area || '暂无区域' }}
                </span>
                <span>
                  <el-icon><Clock /></el-icon>
                  {{ item.createTime || '暂无时间' }}
                </span>
              </p>
            </div>
            <div class="order-right">
              <div class="order-price">¥{{ formatPrice(item.price) }}</div>
            </div>
          </div>

          <div class="order-actions">
            <el-button
              v-if="canReceive(item)"
              v-permission="'trade:order:view'"
              type="primary"
              size="small"
              :loading="isActionLoading(item.id, 'receive')"
              @click="handleReceive(item)"
            >
              确认接单
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
              v-if="canComplete(item)"
              v-permission="'trade:order:view'"
              type="success"
              size="small"
              :loading="isActionLoading(item.id, 'complete')"
              @click="handleComplete(item)"
            >
              完成任务
            </el-button>
            <el-button
              v-if="item.status === 'progress' && canCancel(item)"
              v-permission="'trade:order:view'"
              type="danger"
              size="small"
              plain
              :loading="isActionLoading(item.id, 'cancel')"
              @click="handleCancel(item)"
            >
              取消订单
            </el-button>
            <el-button
              v-if="item.status === 'pending' && canCancel(item)"
              v-permission="'trade:order:view'"
              type="danger"
              size="small"
              plain
              :loading="isActionLoading(item.id, 'cancel')"
              @click="handleCancel(item)"
            >
              退单
            </el-button>
            <el-button size="small" plain @click="handleViewDetail(item)">查看详情</el-button>
            <el-button
              v-permission="['chat:contact', 'chat:view']"
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
        <el-descriptions-item label="订单号">{{ currentOrder.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="任务标题">{{ currentOrder.title }}</el-descriptions-item>
        <el-descriptions-item label="所在区域">{{ currentOrder.area }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentOrder.createTime }}</el-descriptions-item>
        <el-descriptions-item label="接单人">
          {{
            currentOrder.receiver?.displayName
              || currentOrder.receiver?.nickname
              || currentOrder.receiver?.username
              || '暂无'
          }}
        </el-descriptions-item>
        <el-descriptions-item label="接单人电话">
          {{ currentOrder.receiver?.phone || '暂无' }}
        </el-descriptions-item>
        <el-descriptions-item label="订单金额">
          <span class="price-text">¥{{ formatPrice(currentOrder.price) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="getStatusType(getDisplayOrderStatus(currentOrder))" size="small">
            {{ getStatusText(getDisplayOrderStatus(currentOrder)) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="支付网关">
          {{ currentOrder.payGateway || '未支付' }}
        </el-descriptions-item>
        <el-descriptions-item label="支付时间">
          {{ currentOrder.payTime || '暂无' }}
        </el-descriptions-item>
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
          <span v-else>无</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script>
import { Clock, Location } from '@element-plus/icons-vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOrderStatusText, getOrderStatusType } from '@/config/statusConfig'
import { formatCurrency } from '@/utils/format'
import { useAuthStore } from '@/stores/auth'
import { useTradeOrderStore } from '@/stores/tradeOrder'

const ROLE_ROUTE_MAP = {
  publisher: '/trade/order/publish',
  receiver: '/trade/order/receive'
}

function resolveOrderRoleByPath(path = '') {
  return path === ROLE_ROUTE_MAP.receiver ? 'receiver' : 'publisher'
}

export default {
  name: 'TradeOrder',
  components: {
    Clock,
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

    const roleOptions = [
      { label: '发布订单', value: 'publisher' },
      { label: '接取订单', value: 'receiver' }
    ]

    const normalizeUserId = value => {
      if (value == null || value === '') {
        return null
      }

      const id = Number(value)
      return Number.isNaN(id) ? null : id
    }

    const currentUserId = computed(() => normalizeUserId(currentUser.value?.userId ?? currentUser.value?.id))
    const pageTitle = computed(() => (activeOrderRole.value === 'publisher' ? '发布订单' : '接取订单'))
    const pageSubtitle = computed(() => (activeOrderRole.value === 'publisher'
      ? '查看自己发布的全部订单及支付进度'
      : '查看自己接取的订单并处理履约状态'))

    const extractOrderId = item => normalizeUserId(item?.id ?? item?.orderId)
    const extractOrderUserId = profile => normalizeUserId(profile?.userId ?? profile?.id)
    const extractOrderTradeId = item => normalizeUserId(item?.postId ?? item?.tradeId)

    const visibleOrderList = computed(() => {
      if (!currentUserId.value) {
        return orderList.value
      }

      return orderList.value.filter(item => {
        const publisherId = extractOrderUserId(item?.publisher)
        const receiverId = extractOrderUserId(item?.receiver)

        if (activeOrderRole.value === 'publisher') {
          return publisherId === currentUserId.value
        }

        return receiverId === currentUserId.value
      })
    })

    const emptyDescription = computed(() => (activeOrderRole.value === 'publisher'
      ? '暂无我发布的订单'
      : '暂无我接取的订单'))

    const displayOrderStats = computed(() => visibleOrderList.value.reduce((stats, item) => {
      const displayStatus = getDisplayOrderStatus(item)
      stats.totalCount += 1

      if (displayStatus === 'pending') {
        stats.pendingCount += 1
      } else if (displayStatus === 'progress') {
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

    const canReceive = item => item?.status === 'pending' && activeOrderRole.value === 'receiver'
    const isReceiver = item => currentUserId.value && extractOrderUserId(item?.receiver) === currentUserId.value

    const canComplete = item => {
      if (item?.status !== 'progress' || !currentUserId.value) {
        return false
      }

      return isReceiver(item)
    }

    const canCancel = item => {
      if (!currentUserId.value) {
        return false
      }

      const canCancelStatus = item?.status === 'pending' || item?.status === 'progress'
      if (!canCancelStatus) {
        return false
      }

      return isReceiver(item)
    }

    const canPay = item => {
      if (!currentUserId.value) {
        return false
      }

      const isPublisher = extractOrderUserId(item?.publisher) === currentUserId.value
      if (!isPublisher) {
        return false
      }

      return getDisplayOrderStatus(item) === 'pay_pending'
    }

    const syncRoleByRoute = path => {
      activeOrderRole.value = resolveOrderRoleByPath(path)
    }

    const handleRoleChange = async role => {
      const targetPath = ROLE_ROUTE_MAP[role] || ROLE_ROUTE_MAP.publisher
      if (route.path !== targetPath) {
        await router.push(targetPath)
      }

      try {
        await store.setCurrentPage(1)
      } catch (error) {
        console.error('切换订单菜单失败:', error)
      }
    }

    const handleViewDetail = async item => {
      try {
        await store.openDetail(item.id)
      } catch (error) {
        console.error('获取订单详情失败:', error)
      }
    }

    const handleReceive = async item => {
      try {
        await store.receive(item.id)
        ElMessage.success('接单成功')
      } catch (error) {
        console.error('接单失败:', error)
      }
    }

    const handleComplete = async item => {
      try {
        await store.complete(item.id)
        ElMessage.success('任务已完成，等待发布方支付')
      } catch (error) {
        console.error('完成订单失败:', error)
      }
    }

    const handlePay = async item => {
      try {
        await store.pay(item.id)
        ElMessage.success('支付成功')
      } catch (error) {
        console.error('订单支付失败:', error)
      }
    }

    const handleCancel = async item => {
      const actionText = item?.status === 'pending' ? '退单' : '取消订单'

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
          console.error(`${actionText}失败:`, error)
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
        await store.setPageSize(val)
      } catch (error) {
        console.error('切换订单分页大小失败:', error)
      }
    }

    const handleCurrentChange = async val => {
      try {
        await store.setCurrentPage(val)
      } catch (error) {
        console.error('切换订单页码失败:', error)
      }
    }

    const formatPrice = price => formatCurrency(price, { withSymbol: false })
    const getDisplayOrderStatus = item => {
      if (!item) {
        return ''
      }

      if (item.status === 'success' && (item.payStatus || 'unpaid') === 'unpaid') {
        return 'pay_pending'
      }

      return item.status
    }

    const getStatusType = status => getOrderStatusType(status)
    const getStatusText = status => getOrderStatusText(status)
    const isActionLoading = (id, type) => store.isActionLoading(id, type)

    watch(
      () => route.path,
      path => {
        syncRoleByRoute(path)
      }
    )

    onMounted(async () => {
      syncRoleByRoute(route.path)

      try {
        await store.fetchData()
      } catch (error) {
        console.error('获取订单数据失败:', error)
      }
    })

    onUnmounted(() => {
      store.resetTransientState()
    })

    return {
      loading,
      roleOptions,
      activeOrderRole,
      pageTitle,
      pageSubtitle,
      visibleOrderList,
      emptyDescription,
      displayOrderStats,
      pagination,
      detailVisible,
      currentOrder,
      canReceive,
      canPay,
      canComplete,
      canCancel,
      handleRoleChange,
      handleViewDetail,
      handleReceive,
      handlePay,
      handleComplete,
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
  font-weight: bold;
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
  font-weight: bold;
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
  font-weight: bold;
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
