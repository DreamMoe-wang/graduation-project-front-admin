<template>
  <div class="qualification-form-page" v-loading="loading">
    <el-card class="form-card">
      <div class="page-header">
        <div>
          <h2 class="page-title">{{ isEdit ? '修改认证信息' : '发起认证' }}</h2>
          <p class="page-subtitle">
            保存后保留为草稿，提交审核后管理员会进行审核。毕设演示场景下只需上传一张认证图片即可。
          </p>
        </div>
        <div class="status-hint">
          <span class="hint-label">当前状态</span>
          <div class="hint-tags">
            <el-tag :type="currentStatusType">{{ currentStatusText }}</el-tag>
            <el-tag v-if="showReviewRemark" type="warning">可根据审核说明修改后重提</el-tag>
          </div>
        </div>
      </div>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="110px"
        class="qualification-form"
      >
        <div class="form-section">
          <div class="section-title">身份信息</div>
          <el-row :gutter="18">
            <el-col :xs="24" :md="12">
              <el-form-item label="申请人" prop="applicantName">
                <el-input v-model="formData.applicantName" placeholder="请输入申请人名称" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item label="联系电话" prop="contactPhone">
                <el-input v-model="formData.contactPhone" placeholder="请输入手机号" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item label="真实姓名" prop="realName">
                <el-input v-model="formData.realName" placeholder="请输入真实姓名" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item label="身份证号" prop="idCardNo">
                <el-input v-model="formData.idCardNo" placeholder="请输入身份证号" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <div class="form-section">
          <div class="section-title">资格信息</div>
          <el-row :gutter="18">
            <el-col :xs="24" :md="8">
              <el-form-item label="资格类型" prop="qualificationType">
                <el-input v-model="formData.qualificationType" placeholder="例如：家教、维修、搬运" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="8">
              <el-form-item label="资格编号" prop="qualificationNo">
                <el-input v-model="formData.qualificationNo" placeholder="请输入证书编号或备案号" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="8">
              <el-form-item label="发证机构" prop="qualificationOrg">
                <el-input v-model="formData.qualificationOrg" placeholder="请输入发证机构" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <div class="form-section">
          <div class="section-title">证明材料</div>
          <el-row :gutter="18">
            <el-col :xs="24" :md="12">
              <el-form-item label="认证图片" prop="idCardFrontUrl">
                <div class="upload-block">
                  <el-upload
                    list-type="picture-card"
                    :limit="1"
                    :file-list="idCardFileList"
                    :http-request="handleSingleImageUpload"
                    :before-upload="beforeImageUpload"
                    :on-preview="handlePreviewImage"
                    :on-remove="handleClearSingleImage"
                    accept="image/*"
                  >
                    <el-icon><Plus /></el-icon>
                  </el-upload>
                  <p class="upload-tip">只需上传一张图片，系统会自动作为认证图片保存。</p>
                </div>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="补充证明">
            <div class="upload-block full-width">
              <el-upload
                list-type="picture-card"
                :file-list="qualificationProofFileList"
                :http-request="handleProofUpload"
                :before-upload="beforeImageUpload"
                :on-preview="handlePreviewImage"
                :on-remove="handleRemoveProofImage"
                accept="image/*"
                multiple
              >
                <el-icon><Plus /></el-icon>
              </el-upload>
              <p class="upload-tip">补充证明为选填，如无特殊需要可不上传。</p>
            </div>
          </el-form-item>
        </div>

        <div class="form-section">
          <div class="section-title">补充说明</div>
          <el-form-item label="说明描述" prop="description">
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="5"
              maxlength="500"
              show-word-limit
              placeholder="补充你的服务经验、证书说明或其他审核参考信息"
            />
          </el-form-item>
          <el-form-item v-if="showReviewRemark" label="审核说明">
            <el-input :model-value="formData.reviewRemark || '-'" type="textarea" :rows="3" disabled />
          </el-form-item>
        </div>
      </el-form>

      <div class="action-bar">
        <el-button @click="handleCancel">取消</el-button>
        <el-button
          type="info"
          v-permission="'qualification:save'"
          :loading="submitLoading && pendingAction === 'draft'"
          @click="handleSaveDraft"
        >
          保存草稿
        </el-button>
        <el-button
          type="primary"
          v-permission="'qualification:submit'"
          :loading="submitLoading && pendingAction === 'auditing'"
          @click="handleSubmitAudit"
        >
          提交审核
        </el-button>
      </div>
    </el-card>

    <el-dialog v-model="previewVisible" title="图片预览" width="720px">
      <img v-if="previewImageUrl" :src="previewImageUrl" alt="qualification" class="preview-image">
    </el-dialog>
  </div>
</template>

<script>
import { Plus } from '@element-plus/icons-vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { uploadOssFile } from '@/api/oss'
import { getCurrentQualification } from '@/api/qualification'
import { useAuthStore } from '@/stores/auth'
import { useQualificationEditorStore } from '@/stores/qualificationEditor'
import {
  getQualificationStatusText,
  getQualificationStatusType
} from '@/config/statusConfig'
import { emitCloseTag } from '@/utils/tags'

const formRules = {
  applicantName: [
    { required: true, message: '请输入申请人名称', trigger: 'blur' },
    { max: 50, message: '长度不能超过 50 个字符', trigger: 'blur' }
  ],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { min: 2, max: 30, message: '长度应为 2 到 30 个字符', trigger: 'blur' }
  ],
  idCardNo: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { min: 15, max: 18, message: '身份证号长度不正确', trigger: 'blur' }
  ],
  qualificationType: [
    { required: true, message: '请输入资格类型', trigger: 'blur' }
  ],
  qualificationNo: [
    { required: true, message: '请输入资格编号', trigger: 'blur' }
  ],
  qualificationOrg: [
    { required: true, message: '请输入发证机构', trigger: 'blur' }
  ],
  idCardFrontUrl: [
    { required: true, message: '请上传认证图片', trigger: 'change' }
  ],
  description: [
    { max: 500, message: '说明不能超过 500 个字符', trigger: 'blur' }
  ]
}

export default {
  name: 'QualificationForm',
  components: {
    Plus
  },
  setup() {
    const authStore = useAuthStore()
    const store = useQualificationEditorStore()
    const route = useRoute()
    const router = useRouter()
    const formRef = ref(null)
    const pendingAction = ref('')
    const previewVisible = ref(false)
    const previewImageUrl = ref('')
    const { loading, submitLoading, isEdit, formData } = storeToRefs(store)

    const idCardFileList = computed(() => (formData.value.idCardFrontUrl
      ? [{ name: 'qualification-image', url: formData.value.idCardFrontUrl }]
      : []))

    const qualificationProofFileList = computed(() => (formData.value.qualificationImageUrls || []).map((url, index) => ({
      name: `qualification-proof-${index + 1}`,
      url
    })))

    const currentStatusType = computed(() => getQualificationStatusType(formData.value.status))
    const currentStatusText = computed(() => getQualificationStatusText(formData.value.status))
    const showReviewRemark = computed(() => !!formData.value.reviewRemark)

    const fillDefaultProfile = () => {
      formData.value.applicantName = formData.value.applicantName || authStore.displayName
      formData.value.contactPhone = formData.value.contactPhone || authStore.currentUser?.phone || ''
    }

    const loadPage = async () => {
      const id = route.params.id

      try {
        if (id) {
          await store.initEdit(id)
          return
        }

        store.initCreate()
        fillDefaultProfile()
      } catch (error) {
        console.error('Init qualification form failed:', error)
      }
    }

    const closeCurrentTagAndBack = async () => {
      const currentPath = route.path
      await router.push('/qualification')
      emitCloseTag(currentPath)
    }

    const validateForm = async () => {
      await formRef.value?.validate()
    }

    const submitByStatus = async status => {
      pendingAction.value = status

      try {
        await validateForm()
        await store.submitWithStatus(status)
        ElMessage.success(status === 'draft' ? '已保存为草稿' : '已提交审核')
        await closeCurrentTagAndBack()
      } catch (error) {
        if (error?.message) {
          console.error('Submit qualification failed:', error)
        }
      } finally {
        pendingAction.value = ''
      }
    }

    const handleCancel = () => {
      closeCurrentTagAndBack()
    }

    const handleSaveDraft = () => {
      submitByStatus('draft')
    }

    const handleSubmitAudit = () => {
      submitByStatus('auditing')
    }

    const beforeImageUpload = file => {
      const isImage = file.type.startsWith('image/')
      const isLt5M = file.size / 1024 / 1024 < 5

      if (!isImage) {
        ElMessage.error('只能上传图片文件')
      }
      if (!isLt5M) {
        ElMessage.error('图片大小不能超过 5MB')
      }

      return isImage && isLt5M
    }

    const handleSingleImageUpload = async options => {
      try {
        const result = await uploadOssFile(options.file, 'qualification')
        const imageUrl = result?.url || ''
        if (!imageUrl) {
          return
        }

        formData.value.idCardFrontUrl = imageUrl
        formData.value.idCardBackUrl = imageUrl

        if (!Array.isArray(formData.value.qualificationImageUrls) || !formData.value.qualificationImageUrls.length) {
          formData.value.qualificationImageUrls = [imageUrl]
        }

        ElMessage.success('图片上传成功')
      } catch (error) {
        console.error('Upload qualification image failed:', error)
      }
    }

    const handleProofUpload = async options => {
      try {
        const result = await uploadOssFile(options.file, 'qualification')
        const imageUrl = result?.url || ''
        if (imageUrl) {
          formData.value.qualificationImageUrls = [
            ...(formData.value.qualificationImageUrls || []).filter(Boolean),
            imageUrl
          ]
          ElMessage.success('补充证明上传成功')
        }
      } catch (error) {
        console.error('Upload qualification proof failed:', error)
      }
    }

    const handleClearSingleImage = () => {
      const currentImageUrl = formData.value.idCardFrontUrl
      formData.value.idCardFrontUrl = ''
      formData.value.idCardBackUrl = ''

      if (currentImageUrl && Array.isArray(formData.value.qualificationImageUrls)) {
        formData.value.qualificationImageUrls = formData.value.qualificationImageUrls.filter(url => url !== currentImageUrl)
      }
    }

    const handleRemoveProofImage = file => {
      formData.value.qualificationImageUrls = (formData.value.qualificationImageUrls || [])
        .filter(url => url !== file.url)
    }

    const handlePreviewImage = file => {
      previewImageUrl.value = file.url
      previewVisible.value = true
    }

    onMounted(async () => {
      await loadPage()
    })

    watch(
      () => route.params.id,
      async () => {
        await loadPage()
      }
    )

    onUnmounted(() => {
      store.resetState()
    })

    return {
      formRef,
      formRules,
      loading,
      submitLoading,
      isEdit,
      formData,
      pendingAction,
      previewVisible,
      previewImageUrl,
      idCardFileList,
      qualificationProofFileList,
      currentStatusType,
      currentStatusText,
      showReviewRemark,
      handleCancel,
      handleSaveDraft,
      handleSubmitAudit,
      beforeImageUpload,
      handleSingleImageUpload,
      handleProofUpload,
      handleClearSingleImage,
      handleRemoveProofImage,
      handlePreviewImage
    }
  }
}
</script>

<style scoped>
.qualification-form-page {
  padding: 10px;
}

.form-card {
  border-radius: 14px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 28px;
}

.page-title {
  font-size: 24px;
  color: #1f2937;
  margin-bottom: 8px;
}

.page-subtitle {
  color: #6b7280;
  line-height: 1.7;
}

.status-hint {
  min-width: 220px;
  padding: 16px 18px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
}

.hint-label {
  display: block;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 10px;
}

.hint-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.qualification-form {
  max-width: 920px;
}

.form-section + .form-section {
  margin-top: 12px;
}

.section-title {
  margin-bottom: 18px;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.upload-block {
  width: 100%;
}

.full-width {
  width: 100%;
}

.upload-tip {
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 13px;
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 8px;
}

.preview-image {
  display: block;
  width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }

  .qualification-form {
    max-width: 100%;
  }
}
</style>
