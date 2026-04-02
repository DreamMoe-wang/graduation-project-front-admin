<template>
  <div class="profile-page" v-loading="loading">
    <el-row :gutter="20">
      <el-col :xs="24" :lg="8">
        <el-card class="profile-card profile-summary">
          <div class="summary-top">
            <el-avatar :size="88" :src="profile.avatar">
              {{ displayInitial }}
            </el-avatar>
            <div class="summary-info">
              <h2>{{ profile.displayName || profile.nickname || profile.username || '未命名用户' }}</h2>
              <p>{{ profile.email || '未填写邮箱' }}</p>
            </div>
          </div>

          <div class="summary-meta">
            <div class="meta-item">
              <span class="meta-label">用户名</span>
              <span class="meta-value">{{ profile.username || '-' }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">手机号</span>
              <span class="meta-value">{{ profile.phone || '-' }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="16">
        <el-card class="profile-card">
          <div class="card-header">
            <h3>个人信息中心</h3>
            <p>可以在这里维护你的昵称、联系方式和扩展资料。</p>
          </div>

          <el-form
            ref="formRef"
            :model="profile"
            :rules="rules"
            label-width="92px"
            class="profile-form"
          >
            <el-row :gutter="18">
              <el-col :xs="24" :md="12">
                <el-form-item label="用户名">
                  <el-input :model-value="profile.username" disabled />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="昵称" prop="nickname">
                  <el-input v-model="profile.nickname" placeholder="请输入昵称" />
                </el-form-item>
              </el-col>

              <el-col :xs="24" :md="12">
                <el-form-item label="性别" prop="gender">
                  <el-select v-model="profile.gender" placeholder="请选择性别">
                    <el-option label="未知" :value="0" />
                    <el-option label="男" :value="1" />
                    <el-option label="女" :value="2" />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :md="12">
                <el-form-item label="邮箱" prop="email">
                  <el-input v-model="profile.email" placeholder="请输入邮箱" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="手机号" prop="phone">
                  <el-input v-model="profile.phone" placeholder="请输入手机号" />
                </el-form-item>
              </el-col>

              <el-col :xs="24" :md="12">
                <el-form-item label="生日" prop="birthday">
                  <el-date-picker
                    v-model="profile.birthday"
                    type="date"
                    value-format="YYYY-MM-DD"
                    placeholder="请选择生日"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="头像上传" prop="avatar">
                  <div class="avatar-uploader">
                    <el-upload
                      class="avatar-upload"
                      :show-file-list="false"
                      :http-request="handleAvatarUpload"
                      :before-upload="beforeAvatarUpload"
                      accept="image/*"
                    >
                      <div class="upload-panel">
                        <img v-if="profile.avatar" :src="profile.avatar" class="upload-preview" alt="avatar">
                        <el-icon v-else class="upload-icon">
                          <Plus />
                        </el-icon>
                      </div>
                    </el-upload>
                    <div class="upload-meta">
                      <p>支持 JPG / PNG / WEBP，建议尺寸 400x400。</p>
                      <el-button text type="primary" :loading="uploadingAvatar" @click="triggerAvatarUpload">
                        {{ uploadingAvatar ? '上传中...' : '重新上传' }}
                      </el-button>
                    </div>
                  </div>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :md="12">
                <el-form-item label="城市" prop="cityName">
                  <el-input v-model="profile.cityName" placeholder="请输入城市" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="区域" prop="areaName">
                  <el-input v-model="profile.areaName" placeholder="请输入区域" />
                </el-form-item>
              </el-col>

              <el-col :xs="24">
                <el-form-item label="详细地址" prop="address">
                  <el-input v-model="profile.address" placeholder="请输入详细地址" />
                </el-form-item>
              </el-col>

              <el-col :xs="24">
                <el-form-item label="个人简介" prop="bio">
                  <el-input
                    v-model="profile.bio"
                    type="textarea"
                    :rows="5"
                    maxlength="500"
                    show-word-limit
                    placeholder="介绍一下你自己"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>

          <div class="action-bar">
            <el-button @click="handleReset">重置</el-button>
            <el-button type="primary" :loading="saving" @click="handleSave">保存资料</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { Plus } from '@element-plus/icons-vue'
import { uploadOssFile } from '@/api/oss'
import { getCurrentUserProfile, updateCurrentUserProfile } from '@/api/user'
import { useAuthStore } from '@/stores/auth'

function createDefaultProfile() {
  return {
    username: '',
    nickname: '',
    displayName: '',
    avatar: '',
    phone: '',
    email: '',
    gender: 0,
    birthday: '',
    cityName: '',
    areaName: '',
    address: '',
    bio: '',
    roleNames: []
  }
}

export default {
  name: 'ProfileCenter',
  components: {
    Plus
  },
  data() {
    return {
      loading: false,
      saving: false,
      uploadingAvatar: false,
      profile: createDefaultProfile(),
      originalProfile: createDefaultProfile(),
      rules: {
        nickname: [
          { max: 50, message: '昵称长度不能超过 50', trigger: 'blur' }
        ],
        email: [
          { type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] }
        ],
        phone: [
          { max: 20, message: '手机号长度不能超过 20', trigger: 'blur' }
        ],
        cityName: [
          { max: 50, message: '城市长度不能超过 50', trigger: 'blur' }
        ],
        areaName: [
          { max: 50, message: '区域长度不能超过 50', trigger: 'blur' }
        ],
        address: [
          { max: 255, message: '详细地址长度不能超过 255', trigger: 'blur' }
        ],
        bio: [
          { max: 500, message: '个人简介长度不能超过 500', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    authStore() {
      return useAuthStore()
    },
    displayInitial() {
      const text = this.profile.displayName || this.profile.nickname || this.profile.username || '我'
      return text.charAt(0)
    }
  },
  mounted() {
    this.fetchProfile()
  },
  methods: {
    async fetchProfile() {
      this.loading = true

      try {
        const data = await getCurrentUserProfile()
        this.profile = {
          ...createDefaultProfile(),
          ...data,
          gender: typeof data?.gender === 'number' ? data.gender : 0
        }
        this.originalProfile = JSON.parse(JSON.stringify(this.profile))
      } catch (error) {
        console.error('获取个人信息失败:', error)
      } finally {
        this.loading = false
      }
    },
    handleReset() {
      this.profile = JSON.parse(JSON.stringify(this.originalProfile))
      this.$refs.formRef?.clearValidate()
    },
    triggerAvatarUpload() {
      this.$el.querySelector('.avatar-upload input')?.click()
    },
    beforeAvatarUpload(file) {
      const isImage = file.type.startsWith('image/')
      const isLt2M = file.size / 1024 / 1024 < 2

      if (!isImage) {
        this.$message.error('只能上传图片文件')
      }
      if (!isLt2M) {
        this.$message.error('图片大小不能超过 2MB')
      }

      return isImage && isLt2M
    },
    async handleAvatarUpload(options) {
      this.uploadingAvatar = true

      try {
        const result = await uploadOssFile(options.file, 'avatar')
        this.profile.avatar = result?.url || ''
        this.$message.success('头像上传成功')
      } catch (error) {
        console.error('头像上传失败:', error)
      } finally {
        this.uploadingAvatar = false
      }
    },
    handleSave() {
      this.$refs.formRef?.validate(async valid => {
        if (!valid) return

        this.saving = true

        try {
          await updateCurrentUserProfile({
            nickname: this.profile.nickname,
            avatar: this.profile.avatar,
            phone: this.profile.phone,
            email: this.profile.email,
            gender: this.profile.gender,
            birthday: this.profile.birthday,
            cityName: this.profile.cityName,
            areaName: this.profile.areaName,
            address: this.profile.address,
            bio: this.profile.bio
          })

          await this.fetchProfile()
          await this.authStore.restoreSession()
          this.$message.success('个人信息已更新')
        } catch (error) {
          console.error('保存个人信息失败:', error)
        } finally {
          this.saving = false
        }
      })
    }
  }
}
</script>

<style scoped>
.profile-page {
  padding: 10px;
}

.profile-card {
  border-radius: 16px;
}

.profile-summary {
  margin-bottom: 20px;
}

.summary-top {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 22px;
}

.summary-info h2 {
  font-size: 24px;
  color: #1f2937;
  margin-bottom: 6px;
}

.summary-info p {
  color: #6b7280;
}

.summary-meta {
  display: grid;
  gap: 12px;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eef2f7;
}

.meta-label {
  color: #6b7280;
}

.meta-value {
  color: #111827;
  font-weight: 500;
  text-align: right;
}

.card-header {
  margin-bottom: 24px;
}

.card-header h3 {
  font-size: 22px;
  color: #1f2937;
  margin-bottom: 8px;
}

.card-header p {
  color: #6b7280;
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.avatar-uploader {
  display: flex;
  align-items: center;
  gap: 16px;
}

.upload-panel {
  width: 110px;
  height: 110px;
  border-radius: 18px;
  border: 1px dashed #cbd5e1;
  background: linear-gradient(135deg, #f8fafc, #eef6f6);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s ease;
}

.upload-panel:hover {
  border-color: #14b8a6;
  box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.08);
}

.upload-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-icon {
  font-size: 28px;
  color: #94a3b8;
}

.upload-meta {
  color: #6b7280;
  font-size: 13px;
  line-height: 1.7;
}
</style>
