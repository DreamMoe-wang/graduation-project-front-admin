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
              type="primary"
              size="small"
              :loading="isActionLoading(item.id, 'receive')"
              @click="handleReceive(item)"
            >
              去接单
            </el-button>
            <el-button
              v-if="item.status === 'progress'"
              type="success"
              size="small"
              :loading="isActionLoading(item.id, 'complete')"
              @click="handleComplete(item)"
            >
              完成任务
            </el-button>
            <el-button
              v-if="item.status === 'pending'"
              type="danger"
              size="small"
              plain
              :loading="isActionLoading(item.id, 'cancel')"
              @click="handleCancel(item)"
            >
              取消订单
            </el-button>
            <el-button size="small" plain @click="handleViewDetail(item)">查看详情</el-button>
            <el-button size="small" plain @click="handleContact">联系对方</el-button>
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
import {
  cancelTradeOrder,
  completeTradeOrder,
  getTradeOrderDetail,
  getTradeOrderPage,
  getTradeOrderStats,
  receiveTradeOrder
} from '@/api/tradeOrder'

function createDefaultStats() {
  return {
    totalCount: 0,
    pendingCount: 0,
    progressCount: 0,
    successCount: 0
  }
}

function createDefaultActionLoading() {
  return {
    id: null,
    type: ''
  }
}

export default {
  name: 'TradeOrder',
  data() {
    return {
      loading: false,
      orderStats: createDefaultStats(),
      orderList: [],
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      detailVisible: false,
      currentOrder: null,
      actionLoading: createDefaultActionLoading()
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      this.loading = true

      try {
        const [stats, pageData] = await Promise.all([
          getTradeOrderStats(),
          getTradeOrderPage({
            pageNum: this.pagination.currentPage,
            pageSize: this.pagination.pageSize
          })
        ])

        this.orderStats = {
          ...createDefaultStats(),
          ...stats
        }
        this.orderList = pageData?.records || []
        this.pagination.total = Number(pageData?.total || 0)
      } catch (error) {
        this.orderStats = createDefaultStats()
        this.orderList = []
        this.pagination.total = 0
        console.error('获取订单数据失败:', error)
      } finally {
        this.loading = false
      }
    },
    async handleViewDetail(item) {
      try {
        this.currentOrder = await getTradeOrderDetail(item.id)
        this.detailVisible = true
      } catch (error) {
        console.error('获取订单详情失败:', error)
      }
    },
    handleReceive(item) {
      this.runOrderAction(item, 'receive', receiveTradeOrder, '接单成功')
    },
    handleComplete(item) {
      this.runOrderAction(item, 'complete', completeTradeOrder, '订单已完成')
    },
    handleCancel(item) {
      this.$confirm(`确定要取消订单"${item.orderNo}"吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.runOrderAction(item, 'cancel', cancelTradeOrder, '订单已取消')
      }).catch(() => { })
    },
    async runOrderAction(item, type, requestFn, successMessage) {
      this.actionLoading = {
        id: item.id,
        type
      }

      try {
        await requestFn(item.id)
        this.$message.success(successMessage)

        if (this.detailVisible && this.currentOrder?.id === item.id) {
          this.currentOrder = await getTradeOrderDetail(item.id)
        }

        await this.fetchData()
      } catch (error) {
        console.error('订单操作失败:', error)
      } finally {
        this.actionLoading = createDefaultActionLoading()
      }
    },
    isActionLoading(id, type) {
      return this.actionLoading.id === id && this.actionLoading.type === type
    },
    handleContact() {
      this.$router.push('/chat')
      this.$message.info('已跳转到聊天室，请在会话列表中联系对方')
    },
    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.pagination.currentPage = 1
      this.fetchData()
    },
    handleCurrentChange(val) {
      this.pagination.currentPage = val
      this.fetchData()
    },
    formatPrice(price) {
      return Number(price || 0).toFixed(2)
    },
    getStatusType(status) {
      const typeMap = {
        pending: 'warning',
        progress: 'primary',
        success: 'success',
        cancel: 'info'
      }

      return typeMap[status] || ''
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
