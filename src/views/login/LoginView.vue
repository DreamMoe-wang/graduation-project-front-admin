<template>
  <div class="login-page">
    <div class="login-background">
      <div class="bg-grid" />
      <div class="bg-glow glow-top" />
      <div class="bg-glow glow-bottom" />
    </div>

    <div class="login-container">
      <div class="brand-block">
        <div class="brand-logo">
          <img :src="loginLogo" alt="logo" class="logo-image">
        </div>
        <h1 class="brand-title">同城任务</h1>
        <p class="brand-subtitle">高性能同城任务后台管理平台</p>
      </div>

      <el-card class="auth-card" shadow="never">
        <div class="card-header">
          <h2>{{ isRegisterMode ? '创建账号' : '欢迎回来' }}</h2>
          <p>{{ isRegisterMode ? '注册您的账户以开始使用' : '登录您的账户以继续' }}</p>
        </div>

        <el-form
          v-if="!isRegisterMode"
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          label-position="top"
          class="auth-form"
        >
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="loginForm.username"
              :prefix-icon="User"
              placeholder="请输入用户名"
              size="large"
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="loginForm.password"
              :prefix-icon="Lock"
              type="password"
              show-password
              placeholder="请输入密码"
              size="large"
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <el-button
            type="primary"
            size="large"
            class="submit-button"
            :loading="loginLoading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form>

        <el-form
          v-else
          ref="registerFormRef"
          :model="registerForm"
          :rules="registerRules"
          label-position="top"
          class="auth-form"
        >
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="registerForm.username"
              :prefix-icon="User"
              placeholder="请输入用户名"
              size="large"
            />
          </el-form-item>

          <el-form-item label="昵称" prop="nickname">
            <el-input
              v-model="registerForm.nickname"
              :prefix-icon="UserFilled"
              placeholder="请输入昵称"
              size="large"
            />
          </el-form-item>

          <el-form-item label="邮箱" prop="email">
            <el-input
              v-model="registerForm.email"
              :prefix-icon="Message"
              placeholder="请输入邮箱"
              size="large"
            />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="registerForm.password"
              :prefix-icon="Lock"
              type="password"
              show-password
              placeholder="请输入密码"
              size="large"
            />
          </el-form-item>

          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="registerForm.confirmPassword"
              :prefix-icon="CircleCheck"
              type="password"
              show-password
              placeholder="请再次输入密码"
              size="large"
              @keyup.enter="handleRegister"
            />
          </el-form-item>

          <el-button
            type="primary"
            size="large"
            class="submit-button"
            :loading="registerLoading"
            @click="handleRegister"
          >
            注册
          </el-button>
        </el-form>

        <div class="switch-row">
          <span>{{ isRegisterMode ? '已经有账户？' : '还没有账户？' }}</span>
          <button type="button" class="switch-link" @click="toggleMode">
            {{ isRegisterMode ? '登录' : '注册' }}
          </button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import {
  CircleCheck,
  Lock,
  Message,
  User,
  UserFilled
} from '@element-plus/icons-vue'
import loginLogo from '@/assets/login-logo.jpg'
import { useAuthStore } from '@/stores/auth'

function createLoginForm() {
  return {
    username: '',
    password: ''
  }
}

function createRegisterForm() {
  return {
    username: '',
    nickname: '',
    email: '',
    password: '',
    confirmPassword: ''
  }
}

export default {
  name: 'LoginView',
  components: {
    User,
    UserFilled,
    Lock,
    Message,
    CircleCheck
  },
  data() {
    const validateConfirmPassword = (_, value, callback) => {
      if (!value) {
        callback(new Error('请再次输入密码'))
        return
      }

      if (value !== this.registerForm.password) {
        callback(new Error('两次输入的密码不一致'))
        return
      }

      callback()
    }

    return {
      loginLogo,
      mode: 'login',
      loginLoading: false,
      registerLoading: false,
      loginForm: createLoginForm(),
      registerForm: createRegisterForm(),
      loginRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' }
        ]
      },
      registerRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 20, message: '用户名长度必须在 3-20 之间', trigger: 'blur' }
        ],
        nickname: [
          { required: true, message: '请输入昵称', trigger: 'blur' }
        ],
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, max: 100, message: '密码长度必须在 6-100 之间', trigger: 'blur' }
        ],
        confirmPassword: [
          { validator: validateConfirmPassword, trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    isRegisterMode() {
      return this.mode === 'register'
    }
  },
  methods: {
    authStore() {
      return useAuthStore()
    },
    toggleMode() {
      this.mode = this.isRegisterMode ? 'login' : 'register'

      this.$nextTick(() => {
        this.$refs.loginFormRef?.clearValidate()
        this.$refs.registerFormRef?.clearValidate()
      })
    },
    handleLogin() {
      this.$refs.loginFormRef?.validate(async valid => {
        if (!valid) return

        this.loginLoading = true

        try {
          await this.authStore().login(this.loginForm)
          this.$message.success('登录成功')
          this.$router.replace('/')
        } catch (error) {
          console.error('登录失败:', error)
        } finally {
          this.loginLoading = false
        }
      })
    },
    handleRegister() {
      this.$refs.registerFormRef?.validate(async valid => {
        if (!valid) return

        this.registerLoading = true

        try {
          await this.authStore().register(this.registerForm)
          this.$message.success('注册成功，请登录')

          this.loginForm.username = this.registerForm.username
          this.loginForm.password = this.registerForm.password
          this.registerForm = createRegisterForm()
          this.mode = 'login'
        } catch (error) {
          console.error('注册失败:', error)
        } finally {
          this.registerLoading = false
        }
      })
    }
  }
}
</script>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  --el-bg-color: #ffffff;
  --el-bg-color-overlay: #ffffff;
  --el-card-bg-color: rgba(255, 255, 255, 0.9);
  --el-fill-color-blank: rgba(255, 255, 255, 0.96);
  --el-fill-color-light: rgba(255, 255, 255, 0.96);
  --el-fill-color-lighter: rgba(255, 255, 255, 0.96);
  --el-fill-color-extra-light: rgba(255, 255, 255, 0.96);
  --el-border-color-light: rgba(15, 23, 42, 0.08);
  --el-border-color: rgba(15, 23, 42, 0.12);
  --el-text-color-primary: #111827;
  --el-text-color-regular: #374151;
  --el-text-color-secondary: #6b7280;
  --el-text-color-placeholder: #94a3b8;
  background: linear-gradient(180deg, #f9fcfc 0%, #f2f8f8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.login-background {
  position: absolute;
  inset: 0;
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(33, 180, 168, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(33, 180, 168, 0.08) 1px, transparent 1px);
  background-size: 80px 80px;
}

.bg-glow {
  position: absolute;
  border-radius: 999px;
  filter: blur(80px);
  opacity: 0.55;
}

.glow-top {
  width: 520px;
  height: 220px;
  background: rgba(52, 211, 153, 0.18);
  left: 50%;
  top: 6%;
  transform: translateX(-50%);
}

.glow-bottom {
  width: 440px;
  height: 180px;
  background: rgba(14, 165, 233, 0.12);
  left: 50%;
  bottom: 8%;
  transform: translateX(-50%);
}

.login-container {
  position: relative;
  z-index: 1;
  width: min(520px, 100%);
}

.brand-block {
  text-align: center;
  margin-bottom: 34px;
}

.brand-logo {
  width: 76px;
  height: 76px;
  border-radius: 22px;
  margin: 0 auto 18px;
  background: rgba(255, 255, 255, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.18);
  overflow: hidden;
  padding: 0;
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.brand-title {
  font-size: 44px;
  line-height: 1.1;
  color: #0f766e;
  margin-bottom: 10px;
  letter-spacing: 0.03em;
}

.brand-subtitle {
  color: #6b7280;
  font-size: 16px;
}

.auth-card {
  border: none;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12);
  padding: 10px 8px;
}

.card-header {
  text-align: center;
  margin-bottom: 28px;
}

.card-header h2 {
  font-size: 28px;
  color: #111827;
  margin-bottom: 10px;
}

.card-header p {
  color: #6b7280;
  font-size: 16px;
}

.auth-form {
  padding: 0 18px;
}

.auth-form :deep(.el-form-item__label) {
  font-weight: 600;
  color: #374151;
}

.auth-form :deep(.el-input__wrapper) {
  min-height: 52px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.08) inset;
}

.auth-form :deep(.el-input__inner) {
  color: #111827;
}

.auth-form :deep(.el-input__prefix),
.auth-form :deep(.el-input__suffix) {
  color: #6b7280;
}

.auth-form :deep(.el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 1px #2dd4bf inset,
    0 0 0 4px rgba(45, 212, 191, 0.12);
}

.submit-button {
  width: 100%;
  height: 50px;
  border-radius: 16px;
  margin-top: 10px;
  background: linear-gradient(90deg, #22c1b5 0%, #0f9f9a 100%);
  border: none;
  font-size: 17px;
  font-weight: 600;
  box-shadow: 0 12px 24px rgba(15, 159, 154, 0.24);
}

.submit-button:hover {
  background: linear-gradient(90deg, #1eb2a7 0%, #0d908c 100%);
}

.switch-row {
  margin-top: 26px;
  text-align: center;
  color: #6b7280;
  font-size: 16px;
}

.switch-link {
  margin-left: 8px;
  border: none;
  background: transparent;
  color: #0f9f9a;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.switch-link:hover {
  color: #0c8783;
}

@media (max-width: 600px) {
  .login-page {
    padding: 16px;
  }

  .brand-title {
    font-size: 34px;
  }

  .brand-subtitle {
    font-size: 14px;
  }

  .auth-form {
    padding: 0 6px;
  }
}
</style>
