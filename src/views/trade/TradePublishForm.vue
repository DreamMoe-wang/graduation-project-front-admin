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

        <el-form-item label="委托人" prop="clientName">
          <el-input v-model="formData.clientName" placeholder="请输入委托人姓名" />
        </el-form-item>

        <el-form-item label="委托人电话" prop="clientPhone">
          <el-input v-model="formData.clientPhone" placeholder="请输入联系方式" maxlength="11" />
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
          v-permission="['trade:publish:save', 'trade:publish:view']"
          :loading="submitLoading && pendingAction === 'draft'"
          @click="handleSaveDraft"
        >
          保存
        </el-button>
        <el-button
          type="primary"
          v-permission="['trade:publish:submit', 'trade:publish:view']"
          :loading="submitLoading && pendingAction === 'auditing'"
          @click="handleSubmitAudit"
        >
          确认
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useTradePublishEditorStore } from '@/stores/tradePublishEditor'
import { emitCloseTag } from '@/utils/tags'

const formRules = {
  title: [
    { required: true, message: '请输入交易标题', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  clientName: [
    { required: true, message: '请输入委托人姓名', trigger: 'blur' }
  ],
  clientPhone: [
    { required: true, message: '请输入委托人电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  amount: [
    { required: true, message: '请输入交易金额', trigger: 'blur' }
  ]
}

export default {
  name: 'TradePublishForm',
  setup() {
    const store = useTradePublishEditorStore()
    const route = useRoute()
    const router = useRouter()
    const formRef = ref(null)
    const pendingAction = ref('')
    const { loading, submitLoading, isEdit, formData } = storeToRefs(store)

    const loadPage = async () => {
      const id = route.params.id

      try {
        if (id) {
          await store.initEdit(id)
        } else {
          store.initCreate()
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
      handleCancel,
      handleSaveDraft,
      handleSubmitAudit
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

.action-bar {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 8px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }

  .trade-form {
    max-width: 100%;
  }
}
</style>
