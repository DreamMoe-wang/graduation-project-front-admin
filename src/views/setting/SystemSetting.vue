<template>
    <div class="system-setting">
        <el-card class="page-card">
            <div class="page-header">
                <div>
                    <h2 class="page-title">{{ t('setting.title') }}</h2>
                    <p class="page-subtitle">这里保留平台基础信息设置，界面调节已经移动到顶部铃铛右侧的快捷入口。</p>
                </div>
                <div class="page-actions">
                    <el-button @click="resetSavedSettings">{{ t('setting.reset') }}</el-button>
                    <el-button type="warning" plain @click="applyDefaults">{{ t('setting.defaults') }}</el-button>
                    <el-button type="primary" :loading="saving" @click="handleSave">{{ t('setting.save') }}</el-button>
                </div>
            </div>

            <div class="setting-layout">
                <el-card class="setting-section" shadow="never">
                    <template #header>
                        <div class="section-title">{{ t('setting.section.base') }}</div>
                    </template>
                    <el-form :model="form" label-width="110px">
                        <el-form-item :label="t('setting.platformName')">
                            <el-input v-model="form.platformName" @input="applyPreview" />
                        </el-form-item>
                        <el-form-item :label="t('setting.supportEmail')">
                            <el-input v-model="form.supportEmail" />
                        </el-form-item>
                        <el-form-item :label="t('setting.servicePhone')">
                            <el-input v-model="form.servicePhone" />
                        </el-form-item>
                        <el-form-item :label="t('setting.version')">
                            <el-input v-model="form.version" />
                        </el-form-item>
                        <el-form-item :label="t('setting.allowRegister')">
                            <el-switch v-model="form.allowRegister" />
                        </el-form-item>
                        <el-form-item :label="t('setting.maintenanceMode')">
                            <el-switch v-model="form.maintenanceMode" />
                        </el-form-item>
                    </el-form>
                </el-card>

                <el-card class="helper-card" shadow="never">
                    <div class="helper-badge">快捷入口</div>
                    <h3 class="helper-title">界面调节已迁移到顶部</h3>
                    <p class="helper-text">
                        现在可以直接在右上角通知铃铛旁边调整主题颜色、明暗模式和字体大小，修改后会即时预览并可一键保存。
                    </p>
                    <div class="helper-list">
                        <span>主题颜色</span>
                        <span>明亮 / 暗黑模式</span>
                        <span>字体大小</span>
                    </div>
                </el-card>
            </div>
        </el-card>
    </div>
</template>

<script>
import { DEFAULT_SYSTEM_SETTING, useSystemSettingStore } from '@/stores/systemSetting'

function cloneSettings(settings = {}) {
    return JSON.parse(JSON.stringify(settings))
}

export default {
    name: 'SystemSetting',
    data() {
        return {
            saving: false,
            form: cloneSettings(DEFAULT_SYSTEM_SETTING),
            savedSnapshot: cloneSettings(DEFAULT_SYSTEM_SETTING)
        }
    },
    computed: {
        systemSettingStore() {
            return useSystemSettingStore()
        }
    },
    async mounted() {
        try {
            const settings = await this.systemSettingStore.syncRemote({ silent: true })
            this.form = cloneSettings(settings)
            this.savedSnapshot = cloneSettings(settings)
        } catch (error) {
            this.form = cloneSettings(this.systemSettingStore.settings)
            this.savedSnapshot = cloneSettings(this.systemSettingStore.settings)
            console.error('Load system settings page failed:', error)
        }
    },
    beforeUnmount() {
        this.systemSettingStore.applySettings(this.savedSnapshot)
    },
    methods: {
        t(key, vars) {
            return this.systemSettingStore.t(key, vars)
        },
        applyPreview() {
            this.systemSettingStore.previewSettings(this.form)
        },
        resetSavedSettings() {
            this.form = cloneSettings(this.savedSnapshot)
            this.systemSettingStore.applySettings(this.savedSnapshot)
        },
        applyDefaults() {
            this.form = cloneSettings({
                ...DEFAULT_SYSTEM_SETTING,
                themeColor: this.savedSnapshot.themeColor,
                themeMode: this.savedSnapshot.themeMode,
                fontSize: this.savedSnapshot.fontSize
            })
            this.applyPreview()
        },
        async handleSave() {
            this.saving = true

            try {
                const nextSettings = await this.systemSettingStore.saveSettings({
                    ...this.systemSettingStore.settings,
                    ...this.form
                })
                this.form = cloneSettings(nextSettings)
                this.savedSnapshot = cloneSettings(nextSettings)
                this.$message.success(this.t('setting.saved'))
            } catch (error) {
                console.error('Save system settings failed:', error)
            } finally {
                this.saving = false
            }
        }
    }
}
</script>

<style scoped>
.system-setting {
    min-height: 100%;
}

.page-card {
    border-radius: 18px;
    border: none;
    background: var(--app-surface);
    box-shadow: var(--app-card-shadow);
}

.page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
}

.page-title {
    margin: 0;
    font-size: 1.6rem;
    color: var(--app-text);
    font-weight: 700;
}

.page-subtitle {
    margin: 8px 0 0;
    color: var(--app-text-secondary);
    font-size: 0.96rem;
    line-height: 1.7;
}

.page-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
    flex-wrap: wrap;
}

.setting-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.8fr);
    gap: 22px;
}

.setting-section,
.helper-card {
    border-radius: 16px;
    border: 1px solid var(--app-border);
    background: var(--app-surface);
}

.section-title {
    font-size: 1.02rem;
    font-weight: 700;
    color: var(--app-text);
}

.helper-card {
    padding: 24px;
    background:
        radial-gradient(circle at top right, rgba(var(--app-theme-color-rgb), 0.16), transparent 42%),
        linear-gradient(135deg, var(--app-surface-soft), var(--app-surface));
}

.helper-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 28px;
    padding: 0 12px;
    border-radius: 999px;
    background: rgba(var(--app-theme-color-rgb), 0.12);
    color: var(--app-theme-color);
    font-size: 0.82rem;
    font-weight: 700;
}

.helper-title {
    margin: 18px 0 10px;
    font-size: 1.35rem;
    color: var(--app-text);
    font-weight: 800;
}

.helper-text {
    color: var(--app-text-secondary);
    line-height: 1.8;
    margin-bottom: 18px;
}

.helper-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    color: var(--app-text);
    font-weight: 600;
}

@media (max-width: 1080px) {
    .setting-layout {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .page-header {
        flex-direction: column;
    }
}
</style>
