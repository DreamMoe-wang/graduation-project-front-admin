<template>
    <div class="layout-container">
        <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
            <div class="logo">
                <img :src="sidebarLogo" :alt="compactPlatformName" class="logo-image">
                <span v-if="!sidebarCollapsed" class="logo-text">{{ compactPlatformName }}</span>
            </div>

            <nav class="menu">
                <template v-for="item in normalizedMenus" :key="item.id || item.path">
                    <div v-if="item.children && item.children.length > 0" class="menu-group">
                        <el-dropdown
                            v-if="sidebarCollapsed"
                            trigger="click"
                            placement="right-start"
                            popper-class="collapsed-submenu-popper"
                            @command="handleCollapsedMenuCommand"
                        >
                            <div class="menu-item group-title" :class="{ active: isMenuActive(item) }">
                                <el-icon class="icon" :size="20">
                                    <component :is="item.icon || 'Menu'" />
                                </el-icon>
                                <span class="menu-name">{{ item.name }}</span>
                            </div>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item
                                        v-for="child in item.children"
                                        :key="child.id || child.path"
                                        :command="child.path"
                                        :class="{ 'collapsed-submenu-item-active': isPathActive(child.path) }"
                                    >
                                        {{ child.name }}
                                    </el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>

                        <div
                            v-else
                            class="menu-item group-title"
                            :class="{ active: isMenuActive(item) }"
                            @click="toggleGroup(item.path)"
                        >
                            <el-icon class="icon" :size="20">
                                <component :is="item.icon || 'Menu'" />
                            </el-icon>
                            <span class="menu-name">{{ item.name }}</span>
                            <el-icon class="arrow" :class="{ rotated: expandedGroups.includes(item.path) }">
                                <ArrowRight />
                            </el-icon>
                        </div>

                        <div v-show="expandedGroups.includes(item.path)" class="submenu">
                            <router-link
                                v-for="child in item.children"
                                :key="child.id || child.path"
                                :to="child.path"
                                :class="['menu-item', 'submenu-item', { active: isPathActive(child.path) }]"
                            >
                                <el-icon class="icon" :size="18">
                                    <component :is="child.icon || 'Document'" />
                                </el-icon>
                                <span class="menu-name">{{ child.name }}</span>
                            </router-link>
                        </div>
                    </div>

                    <router-link
                        v-else
                        :to="item.path"
                        :class="['menu-item', { active: isPathActive(item.path) }]"
                    >
                        <el-icon class="icon" :size="20">
                            <component :is="item.icon || 'Document'" />
                        </el-icon>
                        <span v-if="!sidebarCollapsed" class="menu-name">{{ item.name }}</span>
                    </router-link>
                </template>

                <el-empty
                    v-if="!normalizedMenus.length"
                    :description="t('layout.menuEmpty')"
                    :image-size="72"
                    class="menu-empty"
                />
            </nav>
        </aside>

        <div class="main-container" :class="{ collapsed: sidebarCollapsed }">
            <header class="header">
                <el-button class="toggle-btn" @click="toggleSidebar" link>
                    <el-icon :size="20">
                        <Fold v-if="!sidebarCollapsed" />
                        <Expand v-else />
                    </el-icon>
                </el-button>

                <div class="header-right">
                    <el-dropdown
                        trigger="click"
                        placement="bottom-end"
                        popper-class="notification-popper"
                        @visible-change="handleNotificationDropdownVisible"
                    >
                        <div class="notification-entry">
                            <el-badge
                                :is-dot="totalNotificationCount > 0"
                                :hidden="totalNotificationCount === 0"
                            >
                                <el-button class="notification-btn" circle link>
                                    <el-icon :size="18">
                                        <Bell />
                                    </el-icon>
                                </el-button>
                            </el-badge>
                        </div>
                        <template #dropdown>
                            <el-dropdown-menu class="notification-menu">
                                <el-dropdown-item class="notification-panel-header" disabled>
                                    <div class="notification-header-wrap">
                                        <div class="notification-header-left">
                                            <el-icon class="notification-header-icon"><Promotion /></el-icon>
                                            <span>{{ t('layout.notifications') }}</span>
                                        </div>
                                    </div>
                                </el-dropdown-item>

                                <template v-if="notificationLoading">
                                    <el-dropdown-item class="notification-empty" disabled>
                                        {{ t('layout.loadingNotifications') }}
                                    </el-dropdown-item>
                                </template>
                                <template v-else>
                                    <el-dropdown-item
                                        v-for="session in unreadSessions"
                                        :key="`session-${session.id}`"
                                        class="notification-row"
                                        @click="openChatBySession(session)"
                                    >
                                        <div class="notification-row-dot" />
                                        <div class="notification-row-main">
                                            <div class="notification-row-title">
                                                {{ t('layout.messageNotice') }} · {{ getSessionLabel(session) }} ({{ session.unread }})
                                            </div>
                                            <div class="notification-row-desc">{{ getSessionPreview(session) }}</div>
                                            <div class="notification-row-time">{{ session.time || t('layout.justNow') }}</div>
                                        </div>
                                        <div class="notification-row-arrow">></div>
                                    </el-dropdown-item>

                                    <el-dropdown-item
                                        v-for="notice in visibleRecentNotices"
                                        :key="`notice-${getNoticeId(notice)}`"
                                        class="notification-row"
                                        @click="openPublicNoticeDialog(notice)"
                                    >
                                        <div class="notification-row-dot announcement" />
                                        <div class="notification-row-main">
                                            <div class="notification-row-title">{{ getNoticeTitle(notice) }}</div>
                                            <div class="notification-row-desc">{{ getNoticeSummary(notice) }}</div>
                                            <div class="notification-row-time">{{ getNoticeTime(notice) || t('layout.systemNotice') }}</div>
                                        </div>
                                        <div class="notification-row-arrow">></div>
                                    </el-dropdown-item>

                                    <el-dropdown-item v-if="!unreadSessions.length && !visibleRecentNotices.length" class="notification-empty" disabled>
                                        {{ t('layout.noNotifications') }}
                                    </el-dropdown-item>

                                    <el-dropdown-item class="notification-refresh" divided @click="refreshNotifications">
                                        {{ t('layout.refreshNotifications') }}
                                    </el-dropdown-item>
                                </template>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>

                    <el-popover
                        v-model:visible="quickSettingVisible"
                        trigger="click"
                        placement="bottom-end"
                        :width="320"
                        popper-class="quick-setting-popper"
                        @show="handleQuickSettingShow"
                        @hide="handleQuickSettingHide"
                    >
                        <template #reference>
                            <div class="quick-setting-entry">
                                <el-button class="quick-setting-btn" circle link>
                                    <el-icon :size="18">
                                        <Operation />
                                    </el-icon>
                                </el-button>
                            </div>
                        </template>

                        <div class="quick-setting-panel">
                            <div class="quick-setting-title">界面调节</div>

                            <div class="quick-setting-group">
                                <div class="quick-setting-label">{{ t('setting.themeColor') }}</div>
                                <div class="quick-setting-color">
                                    <el-color-picker v-model="quickSettingForm.themeColor" @change="handleQuickSettingChange" />
                                    <el-input v-model="quickSettingForm.themeColor" class="quick-setting-input" @input="handleQuickSettingChange" />
                                </div>
                            </div>

                            <div class="quick-setting-group">
                                <div class="quick-setting-label">{{ t('setting.themeMode') }}</div>
                                <el-radio-group v-model="quickSettingForm.themeMode" size="small" @change="handleQuickSettingChange">
                                    <el-radio-button
                                        v-for="item in themeModeOptions"
                                        :key="item.value"
                                        :label="item.value"
                                    >
                                        {{ item.label }}
                                    </el-radio-button>
                                </el-radio-group>
                            </div>

                            <div class="quick-setting-group">
                                <div class="quick-setting-label">{{ t('setting.fontSize') }}</div>
                                <el-radio-group v-model="quickSettingForm.fontSize" size="small" @change="handleQuickSettingChange">
                                    <el-radio-button
                                        v-for="item in fontSizeOptions"
                                        :key="item.value"
                                        :label="item.value"
                                    >
                                        {{ item.label }}
                                    </el-radio-button>
                                </el-radio-group>
                            </div>

                            <div class="quick-setting-actions">
                                <el-button size="small" @click="applyDefaultQuickSettings">{{ t('setting.defaults') }}</el-button>
                                <el-button size="small" @click="resetQuickSettings">{{ t('setting.reset') }}</el-button>
                                <el-button size="small" type="primary" :loading="quickSettingSaving" @click="saveQuickSettings">
                                    {{ t('setting.save') }}
                                </el-button>
                            </div>
                        </div>
                    </el-popover>

                    <el-dropdown trigger="click" @command="handleCommand">
                        <div class="user-entry">
                            <el-avatar :size="32" :src="currentUser?.avatar">
                                {{ displayInitial }}
                            </el-avatar>
                            <span class="username">{{ displayName }}</span>
                            <el-icon class="user-arrow">
                                <ArrowDown />
                            </el-icon>
                        </div>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item command="profile">{{ t('layout.profile') }}</el-dropdown-item>
                                <el-dropdown-item command="logout">{{ t('layout.logout') }}</el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </div>
            </header>

            <TagsView />

            <main class="content">
                <router-view />
            </main>
        </div>

        <el-dialog
            v-model="noticeDialogVisible"
            title="公告详情"
            width="640px"
            destroy-on-close
            class="notice-detail-dialog"
        >
            <template #header>
                <div class="notice-detail-header">
                    <div class="notice-detail-badges">
                        <span class="notice-detail-mark">公告详情</span>
                        <span class="notice-detail-chip">系统公告</span>
                    </div>
                    <div class="notice-detail-heading">
                        <div class="notice-detail-heading-title">{{ activeNotice?.title || '公告详情' }}</div>
                        <div class="notice-detail-heading-subtitle">请及时查看公告内容与发布时间</div>
                    </div>
                    <div v-if="activeNotice" class="notice-detail-meta">
                        <span class="notice-dialog-time">{{ activeNotice.time || t('layout.justNow') }}</span>
                        <span class="notice-detail-meta-separator" />
                        <span class="notice-detail-source">管理后台</span>
                    </div>
                </div>
            </template>
            <div v-loading="noticeDetailLoading" class="notice-dialog-body">
                <template v-if="activeNotice">
                    <section class="notice-detail-panel">
                        <div class="notice-dialog-content">{{ activeNotice.content }}</div>
                    </section>
                </template>
                <el-empty v-else :description="t('layout.noNotifications')" :image-size="56" />
            </div>
        </el-dialog>
    </div>
</template>

<script>
import TagsView from '@/components/TagsView.vue'
import { useAuthStore } from '@/stores/auth'
import { FONT_SIZE_OPTIONS, THEME_MODE_OPTIONS, useSystemSettingStore } from '@/stores/systemSetting'
import { ElNotification } from 'element-plus'
import { ArrowDown, Bell, Fold, Expand, ArrowRight, Promotion, Operation } from '@element-plus/icons-vue'
import { getChatSessions } from '@/api/chat'
import { getPublicNoticeDetail, getPublicNoticePage } from '@/api/notice'
import sidebarLogo from '@/assets/login-logo.jpg'

const NOTICE_HIDDEN_NOTICE_STORAGE_KEY = 'front-admin-hidden-notices'

function normalizeMenuTree(menus = []) {
    return (menus || [])
        .filter(item => item && item.menuType !== 3 && item.visible !== 0 && item.status !== 0 && item.path)
        .map(item => {
            const normalizedPath = item.path === '/role' ? '/user' : item.path

            return {
                id: item.id,
                path: normalizedPath,
                name: normalizedPath === '/user' ? '用户管理' : item.name,
                icon: normalizedPath === '/user' ? 'User' : item.icon,
                routeName: normalizedPath === '/user' ? 'UserManage' : item.routeName,
                children: normalizeMenuTree(item.children || [])
            }
        })
        .filter((item, index, list) => list.findIndex(current => current.path === item.path) === index)
}

function collectExpandedGroups(menus, currentPath, groups = []) {
    for (const item of menus) {
        if (!item.children || !item.children.length) continue

        const childMatched = item.children.some(child => currentPath === child.path || currentPath.startsWith(`${child.path}/`))
        if (childMatched) {
            groups.push(item.path)
        }

        collectExpandedGroups(item.children, currentPath, groups)
    }

    return groups
}

function collectMenuPaths(menus = [], paths = []) {
    for (const item of menus || []) {
        if (!item) continue

        if (item.path) {
            paths.push(item.path)
        }

        if (Array.isArray(item.children) && item.children.length) {
            collectMenuPaths(item.children, paths)
        }
    }

    return paths
}

function safeLocalStorage() {
    if (typeof window === 'undefined') {
        return null
    }

    return window.localStorage
}

function getHiddenNoticeStorageKey(userId) {
    return `${NOTICE_HIDDEN_NOTICE_STORAGE_KEY}:${userId ?? 'anonymous'}`
}

function readHiddenNoticeSignatures(userId) {
    const storage = safeLocalStorage()
    if (!storage) return []

    const key = getHiddenNoticeStorageKey(userId)
    const value = storage.getItem(key)
    if (!value) return []

    try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed)
            ? parsed.filter(item => typeof item === 'string' && item)
            : []
    } catch (error) {
        storage.removeItem(key)
        return []
    }
}

function writeHiddenNoticeSignatures(userId, signatures) {
    const storage = safeLocalStorage()
    if (!storage) return

    const normalizedSignatures = Array.from(new Set(
        (signatures || []).filter(item => typeof item === 'string' && item)
    )).slice(-50)
    const key = getHiddenNoticeStorageKey(userId)

    if (normalizedSignatures.length) {
        storage.setItem(key, JSON.stringify(normalizedSignatures))
        return
    }

    storage.removeItem(key)
}

export default {
    name: 'BasicLayout',
    components: {
        TagsView,
        Bell,
        Promotion,
        Operation,
        Fold,
        Expand,
        ArrowRight,
        ArrowDown
    },
    data() {
        return {
            sidebarCollapsed: false,
            sidebarLogo,
            expandedGroups: [],
            notificationTimer: null,
            notificationPollInterval: 30000,
            notificationLoading: false,
            notificationDropdownVisible: false,
            unreadSessions: [],
            recentNotices: [],
            unreadMessageCount: 0,
            lastUnreadMessageCount: 0,
            lastNoticeSignature: '',
            hiddenNoticeSignatures: [],
            quickSettingVisible: false,
            quickSettingSaving: false,
            noticeDialogVisible: false,
            noticeDetailLoading: false,
            activeNotice: null,
            quickSettingForm: {
                themeColor: '#5B66F3',
                themeMode: 'light',
                fontSize: 'medium'
            },
            themeModeOptions: THEME_MODE_OPTIONS,
            fontSizeOptions: FONT_SIZE_OPTIONS
        }
    },
    computed: {
        authStore() {
            return useAuthStore()
        },
        systemSettingStore() {
            return useSystemSettingStore()
        },
        currentUser() {
            return this.authStore.currentUser
        },
        notificationStorageUserId() {
            return this.currentUser?.userId ?? this.currentUser?.id ?? 'anonymous'
        },
        displayName() {
            return this.authStore.displayName
        },
        displayInitial() {
            return this.displayName ? this.displayName.charAt(0) : 'A'
        },
        platformName() {
            return this.systemSettingStore.settings.platformName
        },
        compactPlatformName() {
            const source = String(this.platformName || '').trim()
            if (!source) return '同城任务'

            return source
                .replace(/后台管理系统$/u, '')
                .replace(/管理系统$/u, '')
                .replace(/后台$/u, '')
                .trim() || '同城任务'
        },
        normalizedMenus() {
            const translate = this.systemSettingStore.translateByPath
            return normalizeMenuTree(this.authStore.currentMenus).map(item => this.translateMenuNode(item, translate))
        },
        menuPaths() {
            return collectMenuPaths(this.normalizedMenus, [])
        },
        canViewChat() {
            return this.menuPaths.includes('/chat')
        },
        canViewNotice() {
            return this.menuPaths.includes('/notice')
        },
        visibleRecentNotices() {
            return this.recentNotices.filter(notice => {
                const signature = this.buildNoticeSignature(notice)
                if (!signature) return true
                return !this.hiddenNoticeSignatures.includes(signature)
            })
        },
        hasUnreadNotices() {
            return this.visibleRecentNotices.length > 0
        },
        totalNotificationCount() {
            return Number(this.unreadMessageCount || 0) + Number(this.visibleRecentNotices.length || 0)
        }
    },
    watch: {
        notificationStorageUserId: {
            handler() {
                this.restoreHiddenNoticeSignatures()
            },
            immediate: true
        },
        '$route.path': {
            handler(path) {
                this.syncExpandedGroups(path)
            },
            immediate: true
        },
        normalizedMenus: {
            handler() {
                this.syncExpandedGroups(this.$route.path)
                this.fetchNotifications({ silent: true })
            },
            deep: true
        }
    },
    mounted() {
        this.fetchNotifications().finally(() => {
            this.startNotificationPolling()
        })
    },
    beforeUnmount() {
        this.stopNotificationPolling()
    },
    methods: {
        t(key, vars) {
            return this.systemSettingStore.t(key, vars)
        },
        translateMenuNode(item, translate) {
            return {
                ...item,
                name: translate(item.path, item.name),
                children: Array.isArray(item.children)
                    ? item.children.map(child => this.translateMenuNode(child, translate))
                    : []
            }
        },
        syncQuickSettingForm() {
            const current = this.systemSettingStore.settings || {}
            this.quickSettingForm = {
                themeColor: current.themeColor || '#5B66F3',
                themeMode: current.themeMode || 'light',
                fontSize: current.fontSize || 'medium'
            }
        },
        handleQuickSettingShow() {
            this.syncQuickSettingForm()
        },
        handleQuickSettingHide() {
            this.systemSettingStore.applySettings(this.systemSettingStore.settings)
            this.syncQuickSettingForm()
        },
        handleQuickSettingChange() {
            this.systemSettingStore.previewSettings(this.quickSettingForm)
        },
        applyDefaultQuickSettings() {
            this.quickSettingForm = {
                themeColor: '#5B66F3',
                themeMode: 'light',
                fontSize: 'medium'
            }
            this.handleQuickSettingChange()
        },
        resetQuickSettings() {
            this.systemSettingStore.applySettings(this.systemSettingStore.settings)
            this.syncQuickSettingForm()
        },
        async saveQuickSettings() {
            this.quickSettingSaving = true

            try {
                await this.systemSettingStore.saveSettings({
                    ...this.systemSettingStore.settings,
                    ...this.quickSettingForm
                })
                this.$message.success(this.t('setting.saved'))
                this.quickSettingVisible = false
            } catch (error) {
                console.error('Save quick settings failed:', error)
            } finally {
                this.quickSettingSaving = false
            }
        },
        isPathActive(path) {
            const currentPath = this.$route?.path || ''
            if (!path) return false
            if (path === '/') return currentPath === '/'
            return currentPath === path
        },
        isMenuActive(menu) {
            if (!menu) return false
            if (this.isPathActive(menu.path)) return true
            if (!Array.isArray(menu.children) || !menu.children.length) return false
            return menu.children.some(item => this.isMenuActive(item))
        },
        handleCollapsedMenuCommand(path) {
            if (!path || this.$route.path === path) return
            this.$router.push(path)
        },
        toggleSidebar() {
            this.sidebarCollapsed = !this.sidebarCollapsed
        },
        toggleGroup(path) {
            const index = this.expandedGroups.indexOf(path)
            if (index > -1) {
                this.expandedGroups.splice(index, 1)
            } else {
                this.expandedGroups.push(path)
            }
        },
        syncExpandedGroups(currentPath) {
            const nextGroups = collectExpandedGroups(this.normalizedMenus, currentPath, [])
            this.expandedGroups = Array.from(new Set(nextGroups))
        },
        getSessionLabel(session = {}) {
            return session.name || session.nickname || session.username || this.t('layout.newMessages')
        },
        getSessionPreview(session = {}) {
            return session.lastMessage || session.content || this.t('layout.newMessageHint')
        },
        getNoticeId(notice = {}) {
            return notice.id || notice.noticeId || notice.uuid || notice.createTime || Date.now()
        },
        getNoticeTitle(notice = {}) {
            return notice.title || notice.noticeTitle || notice.name || this.t('layout.systemNotice')
        },
        getNoticeTime(notice = {}) {
            return notice.publishTime || notice.createTime || notice.updateTime || ''
        },
        getNoticeSummary(notice = {}) {
            return notice.summary || notice.content || notice.noticeContent || notice.description || this.t('layout.noticeHint')
        },
        extractNoticeList(payload) {
            if (Array.isArray(payload)) return payload
            if (Array.isArray(payload?.records)) return payload.records
            if (Array.isArray(payload?.list)) return payload.list
            if (Array.isArray(payload?.items)) return payload.items
            return []
        },
        buildNoticeSignature(notice) {
            if (!notice) return ''
            return `${this.getNoticeId(notice)}-${this.getNoticeTime(notice)}`
        },
        restoreHiddenNoticeSignatures() {
            this.hiddenNoticeSignatures = readHiddenNoticeSignatures(this.notificationStorageUserId)
        },
        dismissNoticeFromDropdown(notice) {
            const signature = this.buildNoticeSignature(notice)
            if (!signature) return

            if (this.hiddenNoticeSignatures.includes(signature)) {
                return
            }

            this.hiddenNoticeSignatures = [...this.hiddenNoticeSignatures, signature].slice(-50)
            writeHiddenNoticeSignatures(this.notificationStorageUserId, this.hiddenNoticeSignatures)
        },
        async fetchNotifications(options = {}) {
            const { silent = false, withPopup = false } = options

            if (!this.canViewChat) {
                this.unreadSessions = []
                this.unreadMessageCount = 0
            }

            if (!silent) {
                this.notificationLoading = true
            }

            try {
                const [sessionsResult, noticesResult] = await Promise.allSettled([
                    this.canViewChat ? getChatSessions(undefined, { silent: true }) : Promise.resolve([]),
                    getPublicNoticePage({ pageNum: 1, pageSize: 5 }, { silent: true })
                ])

                const sessions = sessionsResult.status === 'fulfilled' && Array.isArray(sessionsResult.value)
                    ? sessionsResult.value
                    : []
                const unreadSessions = sessions
                    .map(item => ({
                        ...item,
                        unread: Number(item?.unread || 0)
                    }))
                    .filter(item => item.unread > 0)
                    .slice(0, 5)
                const unreadMessageCount = unreadSessions.reduce((sum, item) => sum + Number(item.unread || 0), 0)

                const notices = noticesResult.status === 'fulfilled'
                    ? this.extractNoticeList(noticesResult.value).slice(0, 5)
                    : []
                const latestNoticeSignature = this.buildNoticeSignature(notices[0])

                if (sessionsResult.status === 'rejected') {
                    console.error('Get unread chat notifications failed:', sessionsResult.reason)
                }

                if (noticesResult.status === 'rejected') {
                    console.error('Get notice notifications failed:', noticesResult.reason)
                }

                if (withPopup && !this.notificationDropdownVisible) {
                    if (unreadMessageCount > this.lastUnreadMessageCount) {
                        ElNotification({
                            title: this.t('layout.newMessagePopup'),
                            message: this.t('layout.unreadMessageCount', { count: unreadMessageCount }),
                            type: 'info',
                            duration: 3600
                        })
                    }

                    if (latestNoticeSignature && this.lastNoticeSignature && latestNoticeSignature !== this.lastNoticeSignature) {
                        ElNotification({
                            title: this.t('layout.noticePopup'),
                            message: this.getNoticeTitle(notices[0]),
                            type: 'success',
                            duration: 4200
                        })
                    }
                }

                this.unreadSessions = unreadSessions
                this.unreadMessageCount = unreadMessageCount
                this.recentNotices = notices
                this.lastUnreadMessageCount = unreadMessageCount
                this.lastNoticeSignature = latestNoticeSignature
            } catch (error) {
                console.error('Get notifications failed:', error)
            } finally {
                this.notificationLoading = false
            }
        },
        startNotificationPolling() {
            this.stopNotificationPolling()
            this.notificationTimer = setInterval(() => {
                this.fetchNotifications({ silent: true, withPopup: true })
            }, this.notificationPollInterval)
        },
        stopNotificationPolling() {
            if (!this.notificationTimer) return
            clearInterval(this.notificationTimer)
            this.notificationTimer = null
        },
        async handleNotificationDropdownVisible(visible) {
            this.notificationDropdownVisible = visible
            if (!visible) return

            await this.fetchNotifications({ silent: true })
        },
        async refreshNotifications() {
            await this.fetchNotifications()
            this.$message.success(this.t('layout.notificationRefreshed'))
        },
        openChatBySession(session) {
            if (!this.canViewChat) return

            this.$router.push({
                path: '/chat',
                query: session?.orderId
                    ? {
                        orderId: session.orderId,
                        ...(session?.tradeId ? { tradeId: session.tradeId } : {})
                    }
                    : (session?.tradeId ? { tradeId: session.tradeId } : {})
            })
        },
        async openPublicNoticeDialog(notice) {
            this.dismissNoticeFromDropdown(notice)
            this.noticeDialogVisible = true
            this.noticeDetailLoading = true
            this.activeNotice = {
                title: this.getNoticeTitle(notice),
                time: this.getNoticeTime(notice),
                content: this.getNoticeSummary(notice)
            }

            const sourceId = notice?.id || notice?.noticeId
            if (!sourceId) {
                this.noticeDetailLoading = false
                return
            }

            try {
                const detail = await getPublicNoticeDetail(sourceId, { silent: true })
                this.activeNotice = {
                    title: detail?.title || detail?.noticeTitle || detail?.name || this.getNoticeTitle(notice),
                    time: detail?.publishTime || detail?.createTime || detail?.updateTime || this.getNoticeTime(notice),
                    content: detail?.content || detail?.noticeContent || detail?.description || this.getNoticeSummary(notice)
                }
            } catch (error) {
                console.error('Get public notice detail failed:', error)
            } finally {
                this.noticeDetailLoading = false
            }
        },
        async handleCommand(command) {
            if (command === 'profile') {
                this.$router.push('/profile')
                return
            }

            if (command !== 'logout') return

            try {
                await this.$confirm(this.t('layout.confirmLogout'), this.t('layout.prompt'), {
                    confirmButtonText: 'OK',
                    cancelButtonText: 'Cancel',
                    type: 'warning'
                })

                this.authStore.logout()
                this.$router.replace('/login')
                this.$message.success(this.t('layout.logout'))
            } catch (error) {
                if (error !== 'cancel') {
                    console.error('Logout failed:', error)
                }
            }
        }
    }
}
</script>

<style scoped>
.layout-container {
    display: flex;
    height: 100vh;
    overflow: hidden;
    background: var(--app-shell-bg);
    color: var(--app-text);
}

.sidebar {
    width: 240px;
    background: linear-gradient(180deg, var(--app-sidebar-start) 0%, var(--app-sidebar-end) 100%);
    transition: width 0.3s ease;
    display: flex;
    flex-direction: column;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
}

.sidebar.collapsed {
    width: 64px;
}

.logo {
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: white;
    font-size: 1.25rem;
    font-weight: 700;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    background: var(--app-logo-bg);
    padding: 0 12px;
}

.logo-image {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    object-fit: cover;
    flex-shrink: 0;
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.22);
}

.logo-text {
    white-space: nowrap;
}

.menu {
    padding: 8px 0;
    overflow-y: auto;
    flex: 1;
}

.menu-empty {
    margin-top: 48px;
}

.menu::-webkit-scrollbar {
    width: 4px;
}

.menu::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
}

.menu-item {
    display: flex;
    align-items: center;
    padding: 14px 24px;
    margin: 4px 8px;
    color: var(--app-sidebar-text);
    text-decoration: none;
    transition: all 0.3s ease;
    cursor: pointer;
    border-radius: 8px;
    position: relative;
}

.menu-item:hover {
    background: rgba(255, 255, 255, 0.08);
    color: var(--app-sidebar-text-active);
    transform: translateX(4px);
}

.menu-item.active {
    background: linear-gradient(90deg, rgba(var(--app-theme-color-rgb), 0.42) 0%, rgba(var(--app-theme-color-rgb), 0.14) 100%);
    color: var(--app-sidebar-text-active);
    font-weight: 600;
}

.menu-item.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 60%;
    background: var(--app-theme-color);
    border-radius: 0 2px 2px 0;
}

.icon {
    margin-right: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: margin 0.3s;
    color: currentColor;
}

.menu-name {
    white-space: nowrap;
    opacity: 1;
    transition: opacity 0.3s;
    flex: 1;
}

.group-title {
    justify-content: space-between;
}

.group-title .arrow {
    transition: transform 0.3s;
}

.group-title .arrow.rotated {
    transform: rotate(90deg);
}

.submenu {
    padding-left: 20px;
}

.submenu-item {
    padding-left: 44px;
    font-size: 0.95rem;
}

.submenu-item .icon {
    font-size: 1.1rem;
}

:deep(.collapsed-submenu-popper .el-dropdown-menu__item.collapsed-submenu-item-active) {
    color: var(--el-color-primary);
    font-weight: 600;
    background: rgba(var(--app-theme-color-rgb), 0.08);
}

.sidebar.collapsed .menu-item {
    justify-content: center;
    padding: 14px;
    margin: 4px 8px;
}

.sidebar.collapsed .logo {
    gap: 0;
    padding: 0;
}

.sidebar.collapsed .logo-image {
    width: 34px;
    height: 34px;
}

.sidebar.collapsed .icon {
    margin-right: 0;
}

.sidebar.collapsed .menu-name {
    display: none;
}

.sidebar.collapsed .menu-item.active::before {
    height: 60%;
    left: 50%;
    transform: translateX(-50%) translateY(-50%);
    width: 60%;
    border-radius: 2px;
    background: linear-gradient(160deg, var(--app-theme-color) 0%, var(--app-theme-color-dark) 100%);
    z-index: 0;
}

.sidebar.collapsed .menu-item.active .icon {
    color: #fff;
    position: relative;
    z-index: 1;
}

.main-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.header {
    height: 64px;
    background: var(--app-header-bg);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    z-index: 10;
    border-bottom: 1px solid var(--app-border);
}

.toggle-btn {
    padding: 4px 8px;
    border-radius: 4px;
    transition: background 0.3s;
    color: var(--app-text);
}

.toggle-btn:hover {
    background: rgba(var(--app-theme-color-rgb), 0.08);
}

.header-right {
    display: flex;
    align-items: center;
    gap: 12px;
}

.notification-entry {
    display: flex;
    align-items: center;
    cursor: pointer;
}

.quick-setting-entry {
    display: flex;
    align-items: center;
    cursor: pointer;
}

.notification-btn {
    width: 34px;
    height: 34px;
    border-radius: 999px;
    color: var(--app-theme-color);
}

.notification-btn:hover {
    background: rgba(var(--app-theme-color-rgb), 0.08);
}

.quick-setting-btn {
    width: 34px;
    height: 34px;
    border-radius: 999px;
    color: var(--app-theme-color);
}

.quick-setting-btn:hover {
    background: rgba(var(--app-theme-color-rgb), 0.08);
}

:deep(.quick-setting-popper.el-popper) {
    border: none;
    border-radius: 20px;
    padding: 0;
    overflow: hidden;
    box-shadow: 0 18px 36px rgba(32, 45, 85, 0.18);
}

.quick-setting-panel {
    width: 320px;
    background: var(--app-surface);
    padding: 18px;
}

.quick-setting-title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--app-text);
    margin-bottom: 14px;
}

.quick-setting-group + .quick-setting-group {
    margin-top: 14px;
}

.quick-setting-label {
    font-size: 0.88rem;
    color: var(--app-text-secondary);
    margin-bottom: 8px;
}

.quick-setting-color {
    display: flex;
    align-items: center;
    gap: 10px;
}

.quick-setting-input {
    flex: 1;
}

.quick-setting-actions {
    margin-top: 18px;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    flex-wrap: wrap;
}

:deep(.notification-popper.el-popper) {
    border: none;
    border-radius: 22px;
    box-shadow: 0 18px 36px rgba(32, 45, 85, 0.22);
    overflow: hidden;
    padding: 0;
}

:deep(.notification-menu) {
    width: 400px;
    padding: 0;
    border: none;
    background: var(--app-surface);
}

:deep(.notification-menu .el-dropdown-menu__item) {
    white-space: normal;
}

:deep(.notification-panel-header) {
    background: var(--app-surface-soft);
    padding: 0;
    cursor: default;
}

:deep(.notification-panel-header.is-disabled) {
    color: var(--app-text);
}

.notification-header-wrap {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 20px 16px;
}

.notification-header-left {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 18px;
    font-weight: 800;
}

.notification-header-icon {
    color: var(--app-theme-color);
    font-size: 18px;
}

:deep(.notification-row) {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px 20px;
    line-height: 1.4;
    border-top: 1px solid var(--app-border);
}

:deep(.notification-row:hover) {
    background: rgba(var(--app-theme-color-rgb), 0.06);
}

.notification-row-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    margin-top: 8px;
    background: var(--app-theme-color);
    flex-shrink: 0;
}

.notification-row-dot.announcement {
    background: var(--app-theme-color-dark);
}

.notification-row-main {
    flex: 1;
    min-width: 0;
}

.notification-row-title {
    color: var(--app-text);
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 4px;
}

.notification-row-desc {
    color: var(--app-text-secondary);
    font-size: 14px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.notification-row-time {
    margin-top: 6px;
    color: var(--app-text-secondary);
    font-size: 13px;
}

.notification-row-arrow {
    color: var(--app-text-secondary);
    font-size: 18px;
    line-height: 1;
    margin-top: 6px;
}

:deep(.notification-empty) {
    justify-content: center;
    color: var(--app-text-secondary);
    border-top: 1px solid var(--app-border);
    padding: 18px 20px;
    cursor: default;
}

:deep(.notification-empty.is-disabled) {
    color: var(--app-text-secondary);
}

:deep(.notification-refresh) {
    display: flex;
    justify-content: center;
    padding: 12px 20px;
    color: var(--app-theme-color);
    font-weight: 600;
}

:deep(.notice-detail-dialog .el-dialog) {
    border-radius: 28px;
    overflow: hidden;
    background: var(--app-surface);
    box-shadow: 0 28px 60px rgba(24, 36, 68, 0.24);
}

:deep(.notice-detail-dialog .el-dialog__header) {
    margin: 0;
    padding: 0;
}

:deep(.notice-detail-dialog .el-dialog__body) {
    padding: 0 0 28px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(var(--app-theme-color-rgb), 0.03) 100%);
}

:deep(.notice-detail-dialog .el-dialog__headerbtn) {
    top: 18px;
    right: 18px;
    width: 36px;
    height: 36px;
    border-radius: 999px;
    background: rgba(var(--app-theme-color-rgb), 0.08);
    transition: background 0.2s ease, transform 0.2s ease;
}

:deep(.notice-detail-dialog .el-dialog__headerbtn:hover) {
    background: rgba(var(--app-theme-color-rgb), 0.16);
    transform: rotate(90deg);
}

:deep(.notice-detail-dialog .el-dialog__close) {
    color: var(--app-text-secondary);
    font-size: 18px;
}

.notice-detail-header {
    position: relative;
    overflow: hidden;
    padding: 26px 28px 24px;
    background:
        radial-gradient(circle at top right, rgba(var(--app-theme-color-rgb), 0.2) 0%, rgba(var(--app-theme-color-rgb), 0) 42%),
        linear-gradient(135deg, rgba(var(--app-theme-color-rgb), 0.18) 0%, rgba(var(--app-theme-color-rgb), 0.05) 58%, rgba(255, 255, 255, 0.98) 100%);
    border-bottom: 1px solid rgba(var(--app-theme-color-rgb), 0.12);
}

.notice-detail-header::after {
    content: '';
    position: absolute;
    right: -26px;
    top: -30px;
    width: 148px;
    height: 148px;
    border-radius: 50%;
    background: rgba(var(--app-theme-color-rgb), 0.08);
}

.notice-detail-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 6px 14px;
    border-radius: 999px;
    background: rgba(14, 22, 38, 0.82);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
}

.notice-detail-badges {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

.notice-detail-heading {
    position: relative;
    z-index: 1;
    margin-top: 18px;
}

.notice-detail-heading-title {
    color: var(--app-text);
    font-size: 1.95rem;
    font-weight: 800;
    letter-spacing: -0.03em;
}

.notice-detail-heading-subtitle {
    margin-top: 8px;
    color: var(--app-text-secondary);
    font-size: 0.95rem;
}

.notice-dialog-body {
    padding: 20px 28px 0;
    min-height: 200px;
}

.notice-detail-chip {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    padding: 7px 12px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.74);
    color: var(--app-theme-color-dark);
    box-shadow: 0 10px 24px rgba(var(--app-theme-color-rgb), 0.12);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
}

.notice-detail-meta {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 16px;
}

.notice-dialog-time,
.notice-detail-source {
    display: inline-flex;
    align-items: center;
    min-height: 34px;
    padding: 0 14px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.8);
    color: var(--app-text-secondary);
    border: 1px solid rgba(var(--app-theme-color-rgb), 0.08);
    font-size: 0.86rem;
    font-weight: 600;
}

.notice-detail-meta-separator {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(var(--app-theme-color-rgb), 0.38);
}

.notice-detail-panel {
    margin-top: 18px;
    padding: 22px 24px;
    border-radius: 22px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(var(--app-theme-color-rgb), 0.03) 100%);
    border: 1px solid var(--app-border);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.notice-dialog-content {
    color: var(--app-text);
    line-height: 1.95;
    white-space: pre-wrap;
    word-break: break-word;
    min-height: 140px;
    font-size: 0.98rem;
}

.notice-dialog-content::first-letter {
    color: var(--app-theme-color-dark);
    font-size: 1.14em;
    font-weight: 700;
}

.user-entry {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    padding: 6px 10px;
    border-radius: 999px;
    transition: background 0.3s ease;
}

.user-entry:hover {
    background: rgba(var(--app-theme-color-rgb), 0.08);
}

.username {
    color: var(--app-text);
    font-size: 0.95rem;
}

.user-arrow {
    color: var(--app-text-secondary);
}

.content {
    flex: 1;
    overflow-y: auto;
    background: var(--app-content-bg);
    padding: 24px;
}

.content::-webkit-scrollbar {
    width: 6px;
}

.content::-webkit-scrollbar-thumb {
    background: rgba(var(--app-theme-color-rgb), 0.28);
    border-radius: 3px;
}

@media (max-width: 768px) {
    .notice-detail-header {
        padding: 20px 20px 18px;
    }

    .notice-dialog-body {
        padding: 18px 18px 0;
    }

    .notice-detail-panel {
        padding: 18px;
        border-radius: 20px;
    }

    .notice-detail-heading-title {
        font-size: 1.5rem;
    }
}
</style>
