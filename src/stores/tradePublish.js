import { defineStore } from 'pinia'
import {
  createTradePublish,
  deleteTradePublish,
  getTradePublishDetail,
  getTradePublishPage,
  updateTradePublish
} from '@/api/tradePublish'

function createDefaultSearchForm() {
  return {
    title: '',
    status: ''
  }
}

function createDefaultPagination() {
  return {
    currentPage: 1,
    pageSize: 10,
    total: 0
  }
}

function createDefaultFormData() {
  return {
    id: null,
    title: '',
    clientName: '',
    clientPhone: '',
    workerName: '',
    workerPhone: '',
    amount: 0,
    status: 'draft',
    description: ''
  }
}

function normalizeFormData(data = {}) {
  return {
    ...createDefaultFormData(),
    ...data,
    amount: data.amount != null ? Number(data.amount) : 0
  }
}

export const useTradePublishStore = defineStore('tradePublish', {
  state: () => ({
    searchForm: createDefaultSearchForm(),
    tableData: [],
    loading: false,
    pagination: createDefaultPagination(),
    dialogVisible: false,
    detailVisible: false,
    dialogTitle: '',
    isEdit: false,
    submitLoading: false,
    currentRow: null,
    formData: createDefaultFormData()
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
    openCreateDialog() {
      this.dialogTitle = '发布交易'
      this.isEdit = false
      this.formData = createDefaultFormData()
      this.dialogVisible = true
    },
    async openEditDialogById(id) {
      if (!id) return

      this.dialogTitle = '编辑交易'
      this.isEdit = true
      const detail = await getTradePublishDetail(id)
      this.formData = normalizeFormData(detail)
      this.dialogVisible = true
    },
    async openDetail(id) {
      this.currentRow = await getTradePublishDetail(id)
      this.detailVisible = true
    },
    closeDetail() {
      this.detailVisible = false
      this.currentRow = null
    },
    closeDialog() {
      this.dialogVisible = false
      this.formData = createDefaultFormData()
      this.isEdit = false
      this.dialogTitle = ''
    },
    async submitForm() {
      this.submitLoading = true

      try {
        const { id, ...rest } = this.formData
        const payload = {
          ...rest,
          amount: Number(rest.amount || 0)
        }

        const mode = this.isEdit && id ? 'edit' : 'create'

        if (mode === 'edit') {
          await updateTradePublish(id, payload)
        } else {
          await createTradePublish(payload)
        }

        this.dialogVisible = false
        this.formData = createDefaultFormData()
        this.isEdit = false
        this.dialogTitle = ''
        await this.fetchData()

        return mode
      } finally {
        this.submitLoading = false
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
      this.pagination.pageSize = pageSize
      this.pagination.currentPage = 1
      await this.fetchData()
    },
    async setCurrentPage(page) {
      this.pagination.currentPage = page
      await this.fetchData()
    },
    resetTransientState() {
      this.dialogVisible = false
      this.detailVisible = false
      this.dialogTitle = ''
      this.isEdit = false
      this.submitLoading = false
      this.currentRow = null
      this.formData = createDefaultFormData()
    }
  }
})
