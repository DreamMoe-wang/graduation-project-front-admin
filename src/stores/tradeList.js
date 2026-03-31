import { defineStore } from 'pinia'
import { deleteTradePublish } from '@/api/tradePublish'
import { exportTradeList, getTradeListDetail, getTradeListPage } from '@/api/tradeList'

function createDefaultSearchForm() {
  return {
    status: '',
    minAmount: '',
    maxAmount: '',
    dateRange: []
  }
}

function createDefaultPagination() {
  return {
    currentPage: 1,
    pageSize: 10,
    total: 0
  }
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
          pageNum: this.pagination.currentPage,
          pageSize: this.pagination.pageSize
        })

        this.tableData = pageData?.records || []
        this.pagination.total = Number(pageData?.total || 0)
      } catch (error) {
        this.tableData = []
        this.pagination.total = 0
        throw error
      } finally {
        this.loading = false
      }
    },
    async search() {
      this.pagination.currentPage = 1
      await this.fetchData()
    },
    async resetSearch() {
      this.searchForm = createDefaultSearchForm()
      this.pagination.currentPage = 1
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
    async setPageSize(pageSize) {
      this.pagination.pageSize = pageSize
      this.pagination.currentPage = 1
      await this.fetchData()
    },
    async setCurrentPage(page) {
      this.pagination.currentPage = page
      await this.fetchData()
    },
    resetTransientState() {
      this.detailVisible = false
      this.currentRow = null
    }
  }
})
