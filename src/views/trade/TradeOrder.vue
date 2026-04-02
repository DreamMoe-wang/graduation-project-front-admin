<template>
  <div class="trade-order">
    <!-- 订单统计 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-label">全部订单</div>
            <div class="stat-value">{{ orderStats.totalCount }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-label">待接单</div>
            <div class="stat-value stat-pending">{{ orderStats.pendingCount }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-label">进行中</div>
            <div class="stat-value stat-progress">{{ orderStats.progressCount }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-label">已完成</div>
            <div class="stat-value stat-success">{{ orderStats.successCount }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <div v-loading="loading">
      <template v-if="orderList.length">
        <!-- 订单列表 -->
        <el-card class="order-card" v-for="item in orderList" :key="item.id">
          <div class="order-header">
            <span class="order-no">订单号：{{ item.orderNo }}</span>
            <el-tag :type="getStatusType(item.status)" size="small">
              {{ item.statusText }}
            </el-tag>
          </div>
          <div class="order-content">
            <div class="order-left">
              <h3 class="order-title">{{ item.title }}</h3>
              <p class="order-info">
                <span>
                  <el-icon>
                    <Location />
                  </el-icon>
                  {{ item.area }}
                </span>
                <span>
                  <el-icon>
                    <Clock />
                  </el-icon>
                  {{ item.createTime }}
                </span>
              </p>
            </div>
            <div class="order-right">
              <div class="order-price">¥{{ formatPrice(item.price) }}</div>
            </div>
          </div>
          <div class="order-actions">
            <el-button
              v-if="item.status === 'pending'"
              v-permission="'trade:order:view'"
              type="primary"
              size="small"
              :loading="isActionLoading(item.id, 'receive')"
              @click="handleReceive(item)"
            >
              去接单
            </el-button>
            <el-button
              v-if="item.status === 'progress'"
              v-permission="'trade:order:view'"
              type="success"
              size="small"
              :loading="isActionLoading(item.id, 'complete')"
              @click="handleComplete(item)"
            >
              完成任务
            </el-button>
            <el-button
              v-if="item.status === 'pending'"
              v-permission="'trade:order:view'"
              type="danger"
              size="small"
              plain
              :loading="isActionLoading(item.id, 'cancel')"
              @click="handleCancel(item)"
            >
              取消订单
            </el-button>
            <el-button size="small" plain @click="handleViewDetail(item)">查看详情</el-button>
            <el-button v-permission="'chat:view'" size="small" plain @click="handleContact">联系对方</el-button>
          </div>
        </el-card>
      </template>

      <el-empty v-else description="暂无订单数据" />
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
        <el-descriptions-item label="订单金额">
          <span class="price-text">¥{{ formatPrice(currentOrder.price) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="getStatusType(currentOrder.status)" size="small">
            {{ currentOrder.statusText }}
          </el-tag>
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
import { getOrderStatusType } from '@/config/statusConfig'
import { formatCurrency } from '@/utils/format'
import { useTradeOrderStore } from '@/stores/tradeOrder'

export default {
  name: 'TradeOrder',
  setup() {
    const store = useTradeOrderStore()
    const router = useRouter()
    const { loading, orderStats, orderList, pagination, detailVisible, currentOrder } = storeToRefs(store)

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
        ElMessage.success('订单已完成')
      } catch (error) {
        console.error('完成订单失败:', error)
      }
    }

    const handleCancel = async item => {
      try {
        await ElMessageBox.confirm(`确定要取消订单"${item.orderNo}"吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        await store.cancel(item.id)
        ElMessage.success('订单已取消')
      } catch (error) {
        if (error !== 'cancel' && error !== 'close') {
          console.error('取消订单失败:', error)
        }
      }
    }

    const handleContact = () => {
      router.push('/chat')
      ElMessage.info('已跳转到聊天室，请在会话列表中联系对方')
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
    const getStatusType = status => getOrderStatusType(status)
    const isActionLoading = (id, type) => store.isActionLoading(id, type)

    onMounted(async () => {
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
      orderStats,
      orderList,
      pagination,
      detailVisible,
      currentOrder,
      handleViewDetail,
      handleReceive,
      handleComplete,
      handleCancel,
      handleContact,
      handleSizeChange,
      handleCurrentChange,
      formatPrice,
      getStatusType,
      isActionLoading
    }
  }
}
</script>

<style scoped>
.trade-order {
  padding: 20px;
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
  margin-bottom: 16px;
}

.order-title {
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
}

.order-info {
  color: #666;
  font-size: 13px;
  display: flex;
  gap: 16px;
}

.order-price {
  font-size: 24px;
  color: #f56c6c;
  font-weight: bold;
}

.order-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
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
</style>
