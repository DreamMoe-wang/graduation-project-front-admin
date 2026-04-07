import { defineStore } from 'pinia'
import {
  createTradePublish,
  getTradePublishDetail,
  updateTradePublish
} from '@/api/tradePublish'

function createDefaultFormData() {
  return {
    id: null,
    title: '',
    clientName: '',
    clientPhone: '',
    amount: 0,
    location: '',
    cityName: '',
    areaName: '',
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

export const useTradePublishEditorStore = defineStore('tradePublishEditor', {
  state: () => ({
    loading: false,
    submitLoading: false,
    isEdit: false,
    currentId: null,
    formData: createDefaultFormData()
  }),
  actions: {
    initCreate() {
      this.isEdit = false
      this.currentId = null
      this.formData = createDefaultFormData()
    },
    async initEdit(id) {
      if (!id) {
        this.initCreate()
        return
      }

      this.loading = true
      this.isEdit = true
      this.currentId = Number(id)

      try {
        const detail = await getTradePublishDetail(id)
        this.formData = normalizeFormData(detail)
      } finally {
        this.loading = false
      }
    },
    async submitWithStatus(status) {
      this.submitLoading = true

      try {
        const payload = {
          ...this.formData,
          amount: Number(this.formData.amount || 0),
          status
        }

        if (this.isEdit && this.currentId) {
          await updateTradePublish(this.currentId, payload)
          return 'edit'
        }

        await createTradePublish(payload)
        return 'create'
      } finally {
        this.submitLoading = false
      }
    },
    resetState() {
      this.loading = false
      this.submitLoading = false
      this.isEdit = false
      this.currentId = null
      this.formData = createDefaultFormData()
    }
  }
})
