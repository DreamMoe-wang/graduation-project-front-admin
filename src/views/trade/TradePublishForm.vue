<template>
  <div class="trade-form-page" v-loading="loading">
    <el-card class="form-card">
      <div class="page-header">
        <div>
          <h2 class="page-title">{{ isEdit ? '编辑交易' : '创建交易' }}</h2>
          <p class="page-subtitle">
            保存会写入草稿状态，确认会提交为待审核状态。
          </p>
        </div>
        <div class="status-hint">
          <span class="hint-label">状态规则</span>
          <div class="hint-tags">
            <el-tag type="info">草稿</el-tag>
            <el-tag type="warning">待审核</el-tag>
          </div>
        </div>
      </div>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        class="trade-form"
      >
        <el-form-item label="交易标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入交易标题" />
        </el-form-item>

        <el-form-item label="委托人">
          <el-input v-model="formData.clientName" disabled />
        </el-form-item>

        <el-form-item label="委托人电话" prop="clientPhone">
          <el-input v-model="formData.clientPhone" disabled />
        </el-form-item>

        <el-form-item label="位置" prop="location">
          <div class="location-row">
            <el-input
              v-model="formData.location"
              placeholder="请输入位置，或点击右侧按钮定位 / 地图选点"
              @input="handleLocationInput"
            />
            <el-button
              type="primary"
              plain
              :loading="locating"
              @click="handleLocate"
            >
              {{ locating ? '定位中...' : '定位' }}
            </el-button>
            <el-button plain @click="locationPickerVisible = true">
              地图选点
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="交易金额" prop="amount">
          <el-input-number
            v-model="formData.amount"
            :min="0"
            :precision="2"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="图片信息">
          <div class="image-upload-block">
            <el-upload
              list-type="picture-card"
              :file-list="uploadFileList"
              :http-request="handleImageUpload"
              :before-upload="beforeImageUpload"
              :on-remove="handleRemoveImage"
              :on-preview="handlePreviewImage"
              accept="image/*"
              multiple
            >
              <el-icon><Plus /></el-icon>
            </el-upload>
            <p class="upload-tip">支持多图上传，单张不超过 5MB，建议上传 JPG / PNG / WEBP。</p>
          </div>
        </el-form-item>

        <el-form-item label="备注说明" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="6"
            placeholder="请输入交易描述"
          />
        </el-form-item>
      </el-form>

      <div class="action-bar">
        <el-button @click="handleCancel">取消</el-button>
        <el-button
          type="info"
          v-permission="'trade:publish:view'"
          :loading="submitLoading && pendingAction === 'draft'"
          @click="handleSaveDraft"
        >
          保存
        </el-button>
        <el-button
          type="primary"
          v-permission="'trade:publish:view'"
          :loading="submitLoading && pendingAction === 'auditing'"
          @click="handleSubmitAudit"
        >
          确认
        </el-button>
      </div>
    </el-card>

    <el-dialog v-model="previewVisible" title="图片预览" width="720px">
      <img v-if="previewImageUrl" :src="previewImageUrl" alt="trade" class="preview-image">
    </el-dialog>

    <BaiduLocationPicker
      v-model="locationPickerVisible"
      :initial-location="formData"
      @confirm="handleLocationPicked"
    />
  </div>
</template>

<script>
import { Plus } from '@element-plus/icons-vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import BaiduLocationPicker from '@/components/BaiduLocationPicker.vue'
import { locateByIp, reverseGeocodeLocation } from '@/api/location'
import { uploadOssFile } from '@/api/oss'
import { useAuthStore } from '@/stores/auth'
import { useTradePublishEditorStore } from '@/stores/tradePublishEditor'
import { emitCloseTag } from '@/utils/tags'

function shouldSkipIpLocate() {
  if (typeof window === 'undefined') return false
  const hostname = window.location.hostname
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

const formRules = {
  title: [
    { required: true, message: '请输入交易标题', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  clientPhone: [
    { required: true, message: '当前个人信息中缺少手机号，请先前往个人中心完善', trigger: 'change' },
    { pattern: /^1[3-9]\d{9}$/, message: '当前手机号格式不正确，请先前往个人中心完善', trigger: 'change' }
  ],
  amount: [
    { required: true, message: '请输入交易金额', trigger: 'blur' }
  ],
  location: [
    { max: 255, message: '位置长度不能超过 255 个字符', trigger: 'blur' }
  ]
}

export default {
  name: 'TradePublishForm',
  components: {
    Plus,
    BaiduLocationPicker
  },
  setup() {
    const authStore = useAuthStore()
    const store = useTradePublishEditorStore()
    const route = useRoute()
    const router = useRouter()
    const formRef = ref(null)
    const pendingAction = ref('')
    const locating = ref(false)
    const previewVisible = ref(false)
    const previewImageUrl = ref('')
    const locationPickerVisible = ref(false)
    const { loading, submitLoading, isEdit, formData } = storeToRefs(store)

    const uploadFileList = computed(() => (formData.value.imageUrls || []).map((url, index) => ({
      name: `trade-image-${index + 1}`,
      url
    })))

    const loadPage = async () => {
      const id = route.params.id

      try {
        if (id) {
          await store.initEdit(id)
        } else {
          store.initCreate()
          formData.value.clientName = authStore.displayName
          formData.value.clientPhone = authStore.currentUser?.phone || ''
        }
      } catch (error) {
        console.error('初始化交易表单失败:', error)
      }
    }

    const closeCurrentTagAndBack = async () => {
      const currentPath = route.path
      await router.push('/trade/publish')
      emitCloseTag(currentPath)
    }

    const submitByStatus = status => {
      formRef.value?.validate(async valid => {
        if (!valid) return

        pendingAction.value = status

        try {
          await store.submitWithStatus(status)
          ElMessage.success(status === 'draft' ? '已保存为草稿' : '已提交为待审核')
          await closeCurrentTagAndBack()
        } catch (error) {
          console.error('提交交易失败:', error)
        } finally {
          pendingAction.value = ''
        }
      })
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

    const getBrowserPosition = () => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        return Promise.reject(new Error('当前浏览器不支持定位'))
      }

      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          position => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            })
          },
          error => {
            const errorMap = {
              1: '未授予定位权限，请允许浏览器定位',
              2: '定位结果不可用，请稍后重试',
              3: '定位超时，请检查网络后重试'
            }
            reject(new Error(errorMap[error?.code] || '浏览器定位失败，请稍后重试'))
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        )
      })
    }

    const applyLocationResult = (location, byIp = false) => {
      formData.value.cityName = location?.cityName || formData.value.cityName || ''
      formData.value.areaName = location?.areaName || formData.value.areaName || ''
      formData.value.location = location?.address || formData.value.location || ''

      const locationLabel = formData.value.location
        || [location?.cityName, location?.areaName].filter(Boolean).join(' ')
        || '当前位置'

      ElMessage.success(byIp ? `已根据本机 IP 定位：${locationLabel}` : `已根据浏览器定位：${locationLabel}`)
    }

    const handleLocate = async () => {
      locating.value = true

      try {
        const position = await getBrowserPosition()
        const location = await reverseGeocodeLocation({
          latitude: position.latitude,
          longitude: position.longitude
        }, { silent: true })
        applyLocationResult(location, false)
      } catch (error) {
        if (shouldSkipIpLocate()) {
          ElMessage.error(error?.message || '定位失败，请稍后重试')
          console.error('Trade locate failed:', error)
        } else {
          try {
            const fallbackLocation = await locateByIp({ silent: true })
            applyLocationResult(fallbackLocation, true)
          } catch (fallbackError) {
            ElMessage.error(error?.message || fallbackError?.message || '定位失败，请稍后重试')
            console.error('Trade locate failed:', error, fallbackError)
          }
        }
      } finally {
        locating.value = false
      }
    }

    const handleLocationInput = () => {
      formData.value.cityName = ''
      formData.value.areaName = ''
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

    const handleImageUpload = async options => {
      try {
        const result = await uploadOssFile(options.file, 'trade')
        const imageUrl = result?.url || ''
        if (imageUrl) {
          formData.value.imageUrls = [...(formData.value.imageUrls || []), imageUrl]
          ElMessage.success('图片上传成功')
        }
      } catch (error) {
        console.error('Trade image upload failed:', error)
      }
    }

    const handleRemoveImage = file => {
      const currentUrls = formData.value.imageUrls || []
      formData.value.imageUrls = currentUrls.filter(url => url !== file.url)
    }

    const handlePreviewImage = file => {
      previewImageUrl.value = file.url
      previewVisible.value = true
    }

    const handleLocationPicked = location => {
      formData.value.cityName = location?.cityName || ''
      formData.value.areaName = location?.areaName || ''
      formData.value.location = location?.address || ''
      ElMessage.success(`已手动确认位置：${location?.address || '当前位置'}`)
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
      locating,
      uploadFileList,
      previewVisible,
      previewImageUrl,
      locationPickerVisible,
      handleCancel,
      handleSaveDraft,
      handleSubmitAudit,
      handleLocate,
      handleLocationInput,
      beforeImageUpload,
      handleImageUpload,
      handleRemoveImage,
      handlePreviewImage,
      handleLocationPicked
    }
  }
}
</script>

<style scoped>
.trade-form-page {
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
  min-width: 180px;
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

.trade-form {
  max-width: 760px;
}

.location-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.location-row .el-input {
  flex: 1;
}

.image-upload-block {
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

  .trade-form {
    max-width: 100%;
  }

  .location-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
