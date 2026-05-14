import { defineStore } from 'pinia'
import {
  createQualification,
  getQualificationDetail,
  normalizeQualificationRecord,
  updateQualification
} from '@/api/qualification'

function createDefaultFormData() {
  return {
    id: null,
    applicantName: '',
    contactPhone: '',
    realName: '',
    idCardNo: '',
    qualificationType: '',
    qualificationNo: '',
    qualificationOrg: '',
    cityName: '',
    areaName: '',
    address: '',
    idCardFrontUrl: '',
    idCardBackUrl: '',
    qualificationImageUrls: [],
    description: '',
    status: 'draft',
    reviewRemark: '',
    createTime: '',
    updateTime: ''
  }
}

function normalizeFormData(data = {}) {
  return {
    ...createDefaultFormData(),
    ...normalizeQualificationRecord(data)
  }
}

export const useQualificationEditorStore = defineStore('qualificationEditor', {
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
        const detail = await getQualificationDetail(id)
        this.formData = normalizeFormData(detail)
      } finally {
        this.loading = false
      }
    },
    async submitWithStatus(status) {
      this.submitLoading = true

      try {
        const payload = {
          applicantName: this.formData.applicantName,
          contactPhone: this.formData.contactPhone,
          realName: this.formData.realName,
          idCardNo: this.formData.idCardNo,
          qualificationType: this.formData.qualificationType,
          qualificationNo: this.formData.qualificationNo,
          qualificationOrg: this.formData.qualificationOrg,
          cityName: this.formData.cityName,
          areaName: this.formData.areaName,
          address: this.formData.address,
          idCardFrontUrl: this.formData.idCardFrontUrl,
          idCardBackUrl: this.formData.idCardFrontUrl || this.formData.idCardBackUrl,
          qualificationImageUrls: Array.isArray(this.formData.qualificationImageUrls)
            ? this.formData.qualificationImageUrls.filter(Boolean)
            : [],
          description: this.formData.description,
          status
        }

        if (this.isEdit && this.currentId) {
          await updateQualification(this.currentId, payload)
          return 'edit'
        }

        await createQualification(payload)
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
