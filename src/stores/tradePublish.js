import { defineStore } from 'pinia'
import {
  approveTradePublish,
  deleteTradePublish,
  getTradePublishDetail,
  getTradePublishPage,
  rejectTradePublish
} from '@/api/tradePublish'
import {
  applyPageResult,
  createPaginationState,
  resetPagination,
  updateCurrentPage,
  updatePageSize
} from '@/utils/pagination'

function createDefaultSearchForm() {
  return {
    title: '',
    status: 'all'
  }
}

function createDefaultPagination() {
  return createPaginationState()
}

export const useTradePublishStore = defineStore('tradePublish', {
  state: () => ({
    searchForm: createDefaultSearchForm(),
    tableData: [],
    loading: false,
    pagination: createDefaultPagination(),
    detailVisible: false,
    currentRow: null,
    selectedRows: [],
    auditLoading: false,
    auditAction: ''
  }),
  actions: {
    async fetchData() {
      this.loading = true

      try {
        const pageData = await getTradePublishPage({
          ...this.searchForm,
          pageNum: this.pagination.currentPage,
          pageSize: this.pagination.pageSize
        })

        applyPageResult(this, pageData, 'tableData')
      } catch (error) {
        this.tableData = []
        this.pagination.total = 0
        throw error
      } finally {
        this.loading = false
      }
    },
    async search() {
      resetPagination(this)
      await this.fetchData()
    },
    async resetSearch() {
      this.searchForm = createDefaultSearchForm()
      resetPagination(this)
      await this.fetchData()
    },
    async openDetail(id) {
      this.currentRow = await getTradePublishDetail(id)
      this.detailVisible = true
    },
    closeDetail() {
      this.detailVisible = false
      this.currentRow = null
    },
    setSelectedRows(rows) {
      this.selectedRows = Array.isArray(rows) ? rows : []
    },
    clearSelectedRows() {
      this.selectedRows = []
    },
    isAuditable(row) {
      return row?.status === 'auditing'
    },
    async auditRows(ids, action, reviewRemark = '') {
      const requestFn = action === 'approve' ? approveTradePublish : rejectTradePublish
      this.auditLoading = true
      this.auditAction = action

      try {
        for (const id of ids) {
          await requestFn(id, reviewRemark ? { reviewRemark } : {})
        }
        this.clearSelectedRows()
        await this.fetchData()
      } finally {
        this.auditLoading = false
        this.auditAction = ''
      }
    },
    async deleteById(id) {
      await deleteTradePublish(id)

      if (this.tableData.length === 1 && this.pagination.currentPage > 1) {
        this.pagination.currentPage -= 1
      }

      await this.fetchData()
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
      this.currentRow = null
      this.clearSelectedRows()
      this.auditLoading = false
      this.auditAction = ''
    }
  }
})
