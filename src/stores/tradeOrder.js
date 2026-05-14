import { defineStore } from 'pinia'
import {
  cancelTradeOrder,
  completeTradeOrder,
  confirmTradeOrder,
  getTradeOrderDetail,
  getTradeOrderPage,
  getTradeOrderStats,
  payTradeOrder,
  receiveTradeOrder
} from '@/api/tradeOrder'
import {
  applyPageResult,
  createPaginationState,
  updateCurrentPage,
  updatePageSize
} from '@/utils/pagination'

function createDefaultStats() {
  return {
    totalCount: 0,
    pendingCount: 0,
    progressCount: 0,
    successCount: 0
  }
}

function createDefaultPagination() {
  return createPaginationState()
}

function createDefaultActionLoading() {
  return {
    id: null,
    type: ''
  }
}

export const useTradeOrderStore = defineStore('tradeOrder', {
  state: () => ({
    loading: false,
    orderStats: createDefaultStats(),
    orderList: [],
    pagination: createDefaultPagination(),
    detailVisible: false,
    currentOrder: null,
    actionLoading: createDefaultActionLoading()
  }),
  actions: {
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
        applyPageResult(this, pageData, 'orderList')
      } catch (error) {
        this.orderStats = createDefaultStats()
        this.orderList = []
        this.pagination.total = 0
        throw error
      } finally {
        this.loading = false
      }
    },
    async openDetail(id) {
      this.currentOrder = await getTradeOrderDetail(id)
      this.detailVisible = true
    },
    closeDetail() {
      this.detailVisible = false
      this.currentOrder = null
    },
    async receive(id) {
      await this.performOrderAction(id, 'receive', receiveTradeOrder)
    },
    async complete(id) {
      await this.performOrderAction(id, 'complete', completeTradeOrder)
    },
    async confirm(id) {
      await this.performOrderAction(id, 'confirm', confirmTradeOrder)
    },
    async pay(id) {
      await this.performOrderAction(id, 'pay', payTradeOrder)
    },
    async cancel(id) {
      await this.performOrderAction(id, 'cancel', cancelTradeOrder)
    },
    async performOrderAction(id, type, requestFn) {
      this.actionLoading = {
        id,
        type
      }

      try {
        await requestFn(id)

        if (this.detailVisible && this.currentOrder?.id === id) {
          this.currentOrder = await getTradeOrderDetail(id)
        }

        await this.fetchData()
      } finally {
        this.actionLoading = createDefaultActionLoading()
      }
    },
    isActionLoading(id, type) {
      return this.actionLoading.id === id && this.actionLoading.type === type
    },
    async setPageSize(pageSize) {
      updatePageSize(this, pageSize)
      await this.fetchData()
    },
    async setCurrentPage(page) {
      updateCurrentPage(this, page)
      await this.fetchData()
    },
    resetTransientState() {
      this.detailVisible = false
      this.currentOrder = null
      this.actionLoading = createDefaultActionLoading()
    }
  }
})
