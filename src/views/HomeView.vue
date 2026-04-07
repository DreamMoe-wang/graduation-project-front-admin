<template>
    <div class="home-container">
        <div class="welcome-card" v-loading="loading">
            <h1 class="welcome-text">你好</h1>
            <p class="subtitle">欢迎来到 Vue3 管理后台系统</p>

            <div class="stats-grid">
                <div class="stat-card">
                    <el-icon :size="48" class="stat-icon">
                        <TrendCharts />
                    </el-icon>
                    <div class="stat-value">{{ overview.visitCount }}</div>
                    <div class="stat-label">总访问量</div>
                </div>

                <div class="stat-card">
                    <el-icon :size="48" class="stat-icon">
                        <UserFilled />
                    </el-icon>
                    <div class="stat-value">{{ overview.userCount }}</div>
                    <div class="stat-label">用户数</div>
                </div>

                <div class="stat-card">
                    <el-icon :size="48" class="stat-icon">
                        <Document />
                    </el-icon>
                    <div class="stat-value">{{ overview.orderCount }}</div>
                    <div class="stat-label">订单数</div>
                </div>

                <div class="stat-card">
                    <el-icon :size="48" class="stat-icon">
                        <Money />
                    </el-icon>
                    <div class="stat-value">{{ formatAmount(overview.salesAmount) }}</div>
                    <div class="stat-label">销售额</div>
                </div>
            </div>
        </div>

        <div class="notice-card">
            <div class="notice-board">
                <div class="notice-board-header">
                    <div class="notice-board-heading">
                        <h2 class="notice-board-title">公告栏</h2>
                        <p class="notice-board-meta">展示未读聊天消息与管理员公告</p>
                    </div>
                </div>

                <div class="notice-list" v-loading="boardLoading">
                    <template v-if="boardItems.length">
                        <button
                            v-for="item in boardItems"
                            :key="item.id"
                            type="button"
                            class="notice-item"
                            @click="handleBoardItemClick(item)"
                        >
                            <span class="notice-dot" :class="`notice-dot-${item.type}`" />
                            <div class="notice-main">
                                <div class="notice-item-top">
                                    <el-tag
                                        size="small"
                                        effect="plain"
                                        :type="item.type === 'chat' ? 'success' : 'primary'"
                                    >
                                        {{ item.typeLabel }}
                                    </el-tag>
                                    <span v-if="item.badgeText" class="notice-item-badge">{{ item.badgeText }}</span>
                                </div>
                                <div class="notice-item-title">{{ item.title }}</div>
                                <div class="notice-item-summary">{{ item.summary }}</div>
                                <div class="notice-item-time">{{ formatBoardTime(item.time) }}</div>
                            </div>
                            <span class="notice-item-arrow">></span>
                        </button>
                    </template>

                    <el-empty v-else description="暂无未读聊天消息和公告" :image-size="56" />
                </div>
            </div>
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
                        <span class="notice-detail-time">{{ formatBoardTime(activeNotice.time) }}</span>
                        <span class="notice-detail-meta-separator" />
                        <span class="notice-detail-source">管理后台</span>
                    </div>
                </div>
            </template>
            <div v-loading="noticeDetailLoading" class="notice-detail">
                <template v-if="activeNotice">
                    <section class="notice-detail-panel">
                        <div class="notice-detail-content">{{ activeNotice.content }}</div>
                    </section>
                </template>
                <el-empty v-else description="暂无公告详情" :image-size="52" />
            </div>
        </el-dialog>
    </div>
</template>

<script>
import { getDashboardOverview } from '@/api/dashboard'
import { getChatSessions } from '@/api/chat'
import { getPublicNoticeDetail, getPublicNoticePage } from '@/api/notice'
import { formatCurrency } from '@/utils/format'

export default {
    name: 'HomeView',
    data() {
        return {
            loading: false,
            boardLoading: false,
            noticeDialogVisible: false,
            noticeDetailLoading: false,
            activeNotice: null,
            overview: {
                visitCount: 0,
                userCount: 0,
                orderCount: 0,
                salesAmount: 0
            },
            boardItems: []
        }
    },
    mounted() {
        this.fetchOverview()
        this.fetchBoardItems()
    },
    methods: {
        async fetchOverview() {
            this.loading = true

            try {
                const data = await getDashboardOverview()
                this.overview = {
                    visitCount: Number(data?.visitCount || 0),
                    userCount: Number(data?.userCount || 0),
                    orderCount: Number(data?.orderCount || 0),
                    salesAmount: Number(data?.salesAmount || 0)
                }
            } catch (error) {
                this.overview = {
                    visitCount: 0,
                    userCount: 0,
                    orderCount: 0,
                    salesAmount: 0
                }
                console.error('获取首页概览失败:', error)
            } finally {
                this.loading = false
            }
        },
        async fetchBoardItems() {
            this.boardLoading = true

            try {
                const [sessionsResult, noticeResult] = await Promise.allSettled([
                    getChatSessions(undefined, { silent: true }),
                    getPublicNoticePage({ pageNum: 1, pageSize: 5 }, { silent: true })
                ])

                const unreadChatItems = sessionsResult.status === 'fulfilled'
                    ? this.normalizeChatItems(sessionsResult.value)
                    : []
                const noticeItems = noticeResult.status === 'fulfilled'
                    ? this.normalizeNoticeItems(noticeResult.value)
                    : []

                if (sessionsResult.status === 'rejected') {
                    console.error('获取未读聊天消息失败:', sessionsResult.reason)
                }

                if (noticeResult.status === 'rejected') {
                    console.error('获取管理员公告失败:', noticeResult.reason)
                }

                this.boardItems = [...unreadChatItems, ...noticeItems].slice(0, 8)
            } catch (error) {
                this.boardItems = []
                console.error('获取公告栏数据失败:', error)
            } finally {
                this.boardLoading = false
            }
        },
        normalizeChatItems(payload) {
            const sessions = Array.isArray(payload) ? payload : []

            return sessions
                .filter(item => Number(item?.unread || 0) > 0)
                .map(item => ({
                    id: `chat-${item.id}`,
                    type: 'chat',
                    typeLabel: '未读消息',
                    title: item?.name || item?.nickname || item?.username || '聊天消息',
                    summary: item?.lastMessage || '你有新的聊天消息，请及时查看',
                    time: item?.time || '',
                    badgeText: `${Number(item?.unread || 0)} 条未读`,
                    route: {
                        path: '/chat',
                        query: item?.orderId
                            ? {
                                orderId: item.orderId,
                                ...(item?.tradeId ? { tradeId: item.tradeId } : {})
                            }
                            : (item?.tradeId ? { tradeId: item.tradeId } : {})
                    }
                }))
        },
        normalizeNoticeItems(payload) {
            const notices = this.extractNoticeList(payload)

            return notices.map(item => ({
                id: `notice-${item?.id || item?.noticeId || item?.uuid || item?.title || Date.now()}`,
                sourceId: item?.id || item?.noticeId || null,
                type: 'notice',
                typeLabel: '管理员公告',
                title: item?.title || item?.noticeTitle || item?.name || '系统公告',
                summary: item?.summary || item?.content || item?.noticeContent || item?.description || '点击查看公告详情',
                content: item?.summary || item?.content || item?.noticeContent || item?.description || '暂无公告内容',
                time: item?.publishTime || item?.createTime || item?.updateTime || '',
                badgeText: ''
            }))
        },
        extractNoticeList(payload) {
            if (Array.isArray(payload)) return payload
            if (Array.isArray(payload?.records)) return payload.records
            if (Array.isArray(payload?.list)) return payload.list
            if (Array.isArray(payload?.items)) return payload.items
            return []
        },
        async openNoticeDialog(item) {
            this.noticeDialogVisible = true
            this.noticeDetailLoading = true
            this.activeNotice = {
                title: item?.title || '系统公告',
                time: item?.time || '',
                content: item?.content || item?.summary || '暂无公告内容'
            }

            if (!item?.sourceId) {
                this.noticeDetailLoading = false
                return
            }

            try {
                const detail = await getPublicNoticeDetail(item.sourceId, { silent: true })
                this.activeNotice = {
                    title: detail?.title || detail?.noticeTitle || detail?.name || item.title || '系统公告',
                    time: detail?.publishTime || detail?.createTime || detail?.updateTime || item.time || '',
                    content: detail?.content || detail?.noticeContent || detail?.description || item.content || item.summary || '暂无公告内容'
                }
            } catch (error) {
                console.error('获取公告详情失败:', error)
            } finally {
                this.noticeDetailLoading = false
            }
        },
        handleBoardItemClick(item) {
            if (!item) return

            if (item.type === 'chat' && item.route) {
                this.$router.push(item.route)
                return
            }

            if (item.type === 'notice') {
                this.openNoticeDialog(item)
            }
        },
        formatAmount(amount) {
            return formatCurrency(amount)
        },
        formatBoardTime(value) {
            if (!value) return '刚刚更新'
            const source = String(value)
            return source.length > 19 ? source.slice(0, 19) : source
        }
    }
}
</script>

<style scoped>
.home-container {
    min-height: 100%;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.welcome-card,
.notice-card {
    background: var(--app-surface);
    border-radius: 12px;
    padding: 40px;
    box-shadow: var(--app-card-shadow);
}

.welcome-text {
    font-size: 3rem;
    color: var(--app-text);
    margin-bottom: 12px;
    font-weight: bold;
}

.subtitle {
    font-size: 1.1rem;
    color: var(--app-text-secondary);
    margin-bottom: 40px;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 24px;
}

.stat-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    padding: 24px;
    text-align: center;
    color: white;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
}

.stat-icon {
    font-size: 2.5rem;
    margin-bottom: 12px;
}

.stat-value {
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 8px;
}

.stat-label {
    font-size: 0.9rem;
    opacity: 0.9;
}

.notice-card {
    padding: 0;
    overflow: hidden;
}

.notice-board {
    border: 1px solid var(--app-border);
    border-radius: 12px;
    overflow: hidden;
    background: var(--app-surface);
}

.notice-board-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 18px 20px;
    background: linear-gradient(180deg, var(--app-surface-soft) 0%, var(--app-surface) 100%);
    border-bottom: 1px solid var(--app-border);
}

.notice-board-heading {
    min-width: 0;
}

.notice-board-title {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--app-text);
}

.notice-board-meta {
    margin: 6px 0 0;
    font-size: 0.88rem;
    color: #7d889c;
}

.notice-list {
    padding: 4px 0;
}

.notice-item {
    width: 100%;
    border: none;
    background: transparent;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    text-align: left;
    cursor: pointer;
    padding: 14px 20px;
    transition: background 0.2s ease;
}

.notice-item:hover {
    background: rgba(var(--app-theme-color-rgb), 0.06);
}

.notice-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-top: 8px;
    flex-shrink: 0;
}

.notice-dot-chat {
    background: #34c759;
}

.notice-dot-notice {
    background: #6976f6;
}

.notice-main {
    flex: 1;
    min-width: 0;
}

.notice-item-top {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
}

.notice-item-badge {
    color: #f56c6c;
    font-size: 0.82rem;
    font-weight: 600;
}

.notice-item-title {
    font-size: 1rem;
    color: var(--app-text);
    font-weight: 700;
    margin-bottom: 4px;
}

.notice-item-summary {
    font-size: 0.92rem;
    color: var(--app-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.notice-item-time {
    margin-top: 6px;
    font-size: 0.82rem;
    color: var(--app-text-secondary);
}

.notice-item-arrow {
    color: var(--app-text-secondary);
    font-size: 1rem;
    margin-top: 4px;
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

.notice-detail {
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

.notice-detail-time,
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

.notice-detail-content {
    color: var(--app-text);
    line-height: 1.95;
    white-space: pre-wrap;
    word-break: break-word;
    min-height: 140px;
    font-size: 0.98rem;
}

.notice-detail-content::first-letter {
    color: var(--app-theme-color-dark);
    font-size: 1.14em;
    font-weight: 700;
}

@media (max-width: 768px) {
    .welcome-card,
    .notice-card {
        padding: 24px;
    }

    .welcome-text {
        font-size: 2.3rem;
    }

    .notice-detail-header {
        padding: 20px 20px 18px;
    }

    .notice-detail {
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
