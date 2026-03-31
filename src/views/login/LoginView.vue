<template>
    <div class="login-page">
        <div class="login-background">
            <div class="bg-orb orb-1"></div>
            <div class="bg-orb orb-2"></div>
            <div class="bg-grid"></div>
        </div>

        <div class="login-shell">
            <section class="brand-panel">
                <div class="brand-badge">Front Admin</div>
                <h1 class="brand-title">同城任务后台管理系统</h1>
                <p class="brand-subtitle">
                    登录后可统一管理交易发布、订单流转、聊天室与系统配置。
                </p>

                <div class="brand-cards">
                    <div class="brand-card">
                        <div class="card-label">默认账号</div>
                        <div class="card-value">admin</div>
                    </div>
                    <div class="brand-card">
                        <div class="card-label">默认密码</div>
                        <div class="card-value">admin123</div>
                    </div>
                </div>
            </section>

            <section class="form-panel">
                <el-card class="login-card" shadow="never">
                    <div class="card-header">
                        <h2>欢迎登录</h2>
                        <p>请输入管理员账号信息</p>
                    </div>

                    <el-form
                        ref="formRef"
                        :model="form"
                        :rules="rules"
                        label-position="top"
                        class="login-form"
                    >
                        <el-form-item label="用户名" prop="username">
                            <el-input
                                v-model="form.username"
                                :prefix-icon="User"
                                placeholder="请输入用户名"
                                size="large"
                                @keyup.enter="handleLogin"
                            />
                        </el-form-item>

                        <el-form-item label="密码" prop="password">
                            <el-input
                                v-model="form.password"
                                :prefix-icon="Lock"
                                type="password"
                                show-password
                                placeholder="请输入密码"
                                size="large"
                                @keyup.enter="handleLogin"
                            />
                        </el-form-item>

                        <div class="helper-row">
                            <button type="button" class="fill-default" @click="fillDefaultAccount">
                                一键填入默认账号
                            </button>
                        </div>

                        <el-button
                            type="primary"
                            size="large"
                            class="login-button"
                            :loading="loading"
                            @click="handleLogin"
                        >
                            登录系统
                        </el-button>
                    </el-form>
                </el-card>
            </section>
        </div>
    </div>
</template>

<script>
import { Lock, User } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

export default {
    name: 'LoginView',
    components: {
        User,
        Lock
    },
    data() {
        return {
            loading: false,
            form: {
                username: '',
                password: ''
            },
            rules: {
                username: [
                    { required: true, message: '请输入用户名', trigger: 'blur' }
                ],
                password: [
                    { required: true, message: '请输入密码', trigger: 'blur' }
                ]
            }
        }
    },
    methods: {
        authStore() {
            return useAuthStore()
        },
        fillDefaultAccount() {
            this.form.username = 'admin'
            this.form.password = 'admin123'
        },
        handleLogin() {
            this.$refs.formRef.validate(async valid => {
                if (!valid) return

                this.loading = true

                try {
                    await this.authStore().login(this.form)
                    this.$message.success('登录成功')

                    const redirect = typeof this.$route.query.redirect === 'string'
                        ? this.$route.query.redirect
                        : '/'

                    this.$router.replace(redirect === '/login' ? '/' : redirect)
                } catch (error) {
                    console.error('登录失败:', error)
                } finally {
                    this.loading = false
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
    background:
        radial-gradient(circle at top left, rgba(102, 126, 234, 0.28), transparent 32%),
        radial-gradient(circle at bottom right, rgba(45, 49, 66, 0.24), transparent 28%),
        linear-gradient(135deg, #101426 0%, #18203a 45%, #0f172a 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px;
}

.login-background {
    position: absolute;
    inset: 0;
}

.bg-orb {
    position: absolute;
    border-radius: 999px;
    filter: blur(12px);
    opacity: 0.6;
}

.orb-1 {
    width: 280px;
    height: 280px;
    background: rgba(102, 126, 234, 0.22);
    top: 8%;
    left: 10%;
}

.orb-2 {
    width: 320px;
    height: 320px;
    background: rgba(40, 180, 133, 0.14);
    right: 6%;
    bottom: 10%;
}

.bg-grid {
    position: absolute;
    inset: 0;
    background-image:
        linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
    background-size: 28px 28px;
    mask-image: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.85), transparent);
}

.login-shell {
    position: relative;
    z-index: 1;
    width: min(1120px, 100%);
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    border-radius: 28px;
    overflow: hidden;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.25);
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(14px);
    border: 1px solid rgba(255, 255, 255, 0.12);
}

.brand-panel {
    padding: 56px 52px;
    color: #f7f9ff;
    display: flex;
    flex-direction: column;
    justify-content: center;
    background: linear-gradient(160deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
}

.brand-badge {
    align-self: flex-start;
    padding: 8px 14px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.12);
    font-size: 12px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 22px;
}

.brand-title {
    font-size: 40px;
    line-height: 1.2;
    margin-bottom: 18px;
}

.brand-subtitle {
    font-size: 16px;
    line-height: 1.8;
    color: rgba(247, 249, 255, 0.8);
    max-width: 420px;
}

.brand-cards {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    margin-top: 36px;
}

.brand-card {
    padding: 18px 20px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.card-label {
    font-size: 13px;
    color: rgba(247, 249, 255, 0.72);
    margin-bottom: 8px;
}

.card-value {
    font-size: 20px;
    font-weight: 700;
}

.form-panel {
    padding: 28px;
    background: rgba(248, 250, 255, 0.94);
    display: flex;
    align-items: center;
    justify-content: center;
}

.login-card {
    width: 100%;
    max-width: 420px;
    border: none;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.92);
}

.card-header {
    margin-bottom: 28px;
}

.card-header h2 {
    font-size: 28px;
    color: #18203a;
    margin-bottom: 10px;
}

.card-header p {
    color: #667085;
    line-height: 1.6;
}

.login-form :deep(.el-form-item__label) {
    font-weight: 600;
    color: #344054;
}

.helper-row {
    display: flex;
    justify-content: flex-end;
    margin-top: -4px;
    margin-bottom: 18px;
}

.fill-default {
    border: none;
    background: transparent;
    color: #667eea;
    cursor: pointer;
    font-size: 13px;
    padding: 0;
}

.fill-default:hover {
    color: #4a5dc6;
}

.login-button {
    width: 100%;
    height: 46px;
    border-radius: 14px;
    font-weight: 600;
}

@media (max-width: 900px) {
    .login-shell {
        grid-template-columns: 1fr;
    }

    .brand-panel {
        padding: 40px 28px 28px;
    }

    .brand-title {
        font-size: 32px;
    }

    .form-panel {
        padding: 0 18px 18px;
    }
}

@media (max-width: 600px) {
    .login-page {
        padding: 16px;
    }

    .brand-cards {
        grid-template-columns: 1fr;
    }

    .brand-title {
        font-size: 28px;
    }
}
</style>
