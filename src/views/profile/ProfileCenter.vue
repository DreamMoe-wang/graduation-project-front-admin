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
            <div class="meta-item">
              <span class="meta-label">钱包余额</span>
              <span class="meta-value">{{ walletBalanceText }}</span>
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

              <el-col :xs="24" :md="24">
                <el-form-item label="定位区域" prop="areaName">
                  <div class="location-row">
                    <el-input
                      :model-value="locationText"
                      placeholder="点击右侧按钮定位，或使用地图选点手动确认"
                      readonly
                    />
                    <el-button
                      type="primary"
                      plain
                      :loading="locating"
                      @click="handleLocate"
                    >
                      {{ locating ? '定位中...' : '定位' }}
                    </el-button>
                    <el-button plain @click="locationPickerVisible = true">地图选点</el-button>
                  </div>
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

    <BaiduLocationPicker
      v-model="locationPickerVisible"
      :initial-location="profile"
      @confirm="handleLocationPicked"
    />
  </div>
</template>

<script>
import { Plus } from '@element-plus/icons-vue'
import BaiduLocationPicker from '@/components/BaiduLocationPicker.vue'
import { locateByIp, reverseGeocodeLocation } from '@/api/location'
import { uploadOssFile } from '@/api/oss'
import { getCurrentUserProfile, updateCurrentUserProfile } from '@/api/user'
import { useAuthStore } from '@/stores/auth'
import { formatCurrency } from '@/utils/format'

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
    walletBalance: 0,
    roleNames: []
  }
}

function shouldSkipIpLocate() {
  if (typeof window === 'undefined') return false
  const hostname = window.location.hostname
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

export default {
  name: 'ProfileCenter',
  components: {
    Plus,
    BaiduLocationPicker
  },
  data() {
    return {
      loading: false,
      saving: false,
      uploadingAvatar: false,
      locating: false,
      locationPickerVisible: false,
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
    },
    walletBalanceText() {
      return formatCurrency(this.profile.walletBalance || 0)
    },
    locationText() {
      const summary = [this.profile.cityName, this.profile.areaName].filter(Boolean).join(' ')
      if (!summary && !this.profile.address) {
        return ''
      }
      return [summary, this.profile.address].filter(Boolean).join(' · ')
    }
  },
  mounted() {
    this.fetchProfile()
  },
  methods: {
    applyProfile(data) {
      this.profile = {
        ...createDefaultProfile(),
        ...data,
        gender: typeof data?.gender === 'number' ? data.gender : 0
      }
      this.originalProfile = JSON.parse(JSON.stringify(this.profile))
    },
    async fetchProfile() {
      this.loading = true

      try {
        const data = await getCurrentUserProfile()
        this.applyProfile(data)
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
    async handleLocate() {
      this.locating = true

      try {
        const position = await this.getBrowserPosition()
        const location = await reverseGeocodeLocation({
          latitude: position.latitude,
          longitude: position.longitude
        }, { silent: true })
        this.applyLocationResult(location, false)
      } catch (error) {
        if (shouldSkipIpLocate()) {
          this.$message.error(error?.message || '定位失败，请稍后重试')
          console.error('Locate failed:', error)
        } else {
          try {
            const fallbackLocation = await locateByIp({ silent: true })
            this.applyLocationResult(fallbackLocation, true)
          } catch (fallbackError) {
            this.$message.error(error?.message || fallbackError?.message || '定位失败，请稍后重试')
            console.error('Locate failed:', error, fallbackError)
          }
        }
      } finally {
        this.locating = false
      }
    },
    getBrowserPosition() {
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
    },
    applyLocationResult(location, byIp = false) {
      this.profile.cityName = location?.cityName || this.profile.cityName
      this.profile.areaName = location?.areaName || this.profile.areaName
      this.profile.address = location?.address || this.profile.address

      const locationLabel = [location?.cityName, location?.areaName].filter(Boolean).join(' ') || '当前位置'
      this.$message.success(byIp ? `已根据本机 IP 定位：${locationLabel}` : `已根据浏览器定位：${locationLabel}`)
    },
    handleLocationPicked(location) {
      this.profile.cityName = location?.cityName || ''
      this.profile.areaName = location?.areaName || ''
      this.profile.address = location?.address || ''
      this.$message.success(`已手动确认位置：${location?.address || '当前位置'}`)
    },
    syncAuthUserProfile() {
      const currentUser = this.authStore.currentUser || {}
      const nextDisplayName = this.profile.displayName
        || this.profile.nickname
        || currentUser.displayName
        || currentUser.nickname
        || currentUser.username
        || ''

      this.authStore.setUser({
        ...currentUser,
        nickname: this.profile.nickname,
        displayName: nextDisplayName,
        avatar: this.profile.avatar,
        phone: this.profile.phone,
        email: this.profile.email
      })
    },
    handleSave() {
      this.$refs.formRef?.validate(async valid => {
        if (!valid) return

        this.saving = true

        try {
          const updatedProfile = await updateCurrentUserProfile({
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

          this.applyProfile(updatedProfile)
          this.syncAuthUserProfile()
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
  background: var(--app-surface);
  box-shadow: var(--app-card-shadow);
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
  color: var(--app-text);
  margin-bottom: 6px;
}

.summary-info p {
  color: var(--app-text-secondary);
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
  border-bottom: 1px solid var(--app-border);
}

.meta-label {
  color: var(--app-text-secondary);
}

.meta-value {
  color: var(--app-text);
  font-weight: 500;
  text-align: right;
}

.card-header {
  margin-bottom: 24px;
}

.card-header h3 {
  font-size: 22px;
  color: var(--app-text);
  margin-bottom: 8px;
}

.card-header p {
  color: var(--app-text-secondary);
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
  border: 1px dashed var(--app-border);
  background: linear-gradient(135deg, var(--app-surface-soft), var(--app-surface));
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s ease;
}

.upload-panel:hover {
  border-color: var(--app-theme-color);
  box-shadow: 0 0 0 4px rgba(var(--app-theme-color-rgb), 0.12);
}

.upload-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-icon {
  font-size: 28px;
  color: var(--app-text-secondary);
}

.upload-meta {
  color: var(--app-text-secondary);
  font-size: 13px;
  line-height: 1.7;
}

.location-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
}

.location-row .el-input {
  flex: 1;
}

@media (max-width: 768px) {
  .location-row {
    flex-direction: column;
    align-items: stretch;
  }

  .avatar-uploader {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
