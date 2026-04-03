import { defineStore } from 'pinia'
import { deleteTradePublish } from '@/api/tradePublish'
import {
  exportTradeList,
  getTradeListDetail,
  getTradeListPage,
  receiveTradeList
} from '@/api/tradeList'
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
    minAmount: '',
    maxAmount: '',
    dateRange: []
  }
}

function createDefaultPagination() {
  return createPaginationState()
}

export const useTradeListStore = defineStore('tradeList', {
  state: () => ({
    searchForm: createDefaultSearchForm(),
    tableData: [],
    loading: false,
    pagination: createDefaultPagination(),
    detailVisible: false,
    currentRow: null
  }),
  actions: {
    async fetchData() {
      this.loading = true

      try {
        const pageData = await getTradeListPage({
          ...this.searchForm,
          status: 'published',
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
      this.currentRow = await getTradeListDetail(id)
      this.detailVisible = true
    },
    closeDetail() {
      this.detailVisible = false
      this.currentRow = null
    },
    async deleteById(id) {
      await deleteTradePublish(id)

      if (this.tableData.length === 1 && this.pagination.currentPage > 1) {
        this.pagination.currentPage -= 1
      }

      await this.fetchData()
    },
    async exportData() {
      return exportTradeList(this.searchForm)
    },
    async receiveById(id) {
      await receiveTradeList(id)
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
    }
  }
})
