<template>
  <div class="home-container">
    <div class="ambient-layer ambient-layer-a" />
    <div class="ambient-layer ambient-layer-b" />
    <div class="ambient-grid" />

    <section class="hero-shell" v-loading="loading">
      <div class="hero-panel">
        <div class="hero-copy">
          <span class="hero-kicker">Dashboard Overview</span>
          <h1 class="hero-title">你好</h1>
          <p class="hero-subtitle">欢迎来到 Vue3 管理后台系统，这里集中查看系统动态、业务概览与未读提醒。</p>

          <div class="hero-actions">
            <div class="hero-chip">
              <span class="hero-chip-dot" />
              系统运行中
            </div>
            <div class="hero-chip soft">
              今日已同步最新统计数据
            </div>
          </div>
        </div>

        <div class="calendar-compact" aria-hidden="true">
          <div class="calendar-summary">
            <div class="calendar-summary-top">
              <div class="calendar-month">{{ currentMonthLabel }}</div>
              <div class="calendar-week">{{ todayWeekLabel }}</div>
            </div>
            <div class="calendar-number">{{ todayNumber }}</div>
            <div class="calendar-caption">今日日期</div>
          </div>

          <div class="calendar-mini">
            <div class="weekday-row">
              <span v-for="day in weekDays" :key="day" class="weekday-cell">{{ day }}</span>
            </div>
            <div class="date-grid">
              <div
                v-for="item in miniCalendarCells"
                :key="`${item.dateKey}-${item.day}`"
                class="date-cell"
                :class="{ muted: !item.currentMonth, today: item.isToday }"
              >
                {{ item.day }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="stats-grid">
        <article
          v-for="item in statCards"
          :key="item.key"
          class="stat-card"
          :class="`theme-${item.theme}`"
        >
          <div class="stat-glow" />
          <div class="stat-top">
            <div class="stat-icon-wrap">
              <div class="stat-icon-shadow" />
              <div class="stat-icon-face">
                <el-icon class="stat-icon"><component :is="item.icon" /></el-icon>
              </div>
            </div>
            <span class="stat-tag">{{ item.tag }}</span>
          </div>
          <div class="stat-value">{{ item.value }}</div>
          <div class="stat-label">{{ item.label }}</div>
          <div class="stat-desc">{{ item.desc }}</div>
        </article>
      </div>
    </section>

    <section class="notice-shell">
      <div class="notice-board">
        <div class="notice-board-header">
          <div class="notice-board-heading">
            <span class="notice-kicker">Message Center</span>
            <h2 class="notice-board-title">公告栏</h2>
            <p class="notice-board-meta">集中展示未读聊天消息与管理员公告，便于快速进入处理流程。</p>
          </div>
          <div class="notice-board-side">
            <div class="notice-pill">实时提醒</div>
            <div class="notice-pill subtle">{{ boardItems.length }} 条内容</div>
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
    </section>

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
import {
  Bell,
  ChatDotRound,
  DataAnalysis,
  Document,
  Money,
  TrendCharts,
  UserFilled
} from '@element-plus/icons-vue'
import { getDashboardOverview } from '@/api/dashboard'
import { getChatSessions } from '@/api/chat'
import { getPublicNoticeDetail, getPublicNoticePage } from '@/api/notice'
import { useAuthStore } from '@/stores/auth'
import { formatCurrency } from '@/utils/format'

function createCalendarCells(baseDate = new Date()) {
  const year = baseDate.getFullYear()
  const month = baseDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const firstWeekDay = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()
  const cells = []

  for (let i = 0; i < 35; i++) {
    let day
    let currentMonth = true
    let cellDate

    if (i < firstWeekDay) {
      day = prevMonthDays - firstWeekDay + i + 1
      currentMonth = false
      cellDate = new Date(year, month - 1, day)
    } else if (i >= firstWeekDay + daysInMonth) {
      day = i - firstWeekDay - daysInMonth + 1
      currentMonth = false
      cellDate = new Date(year, month + 1, day)
    } else {
      day = i - firstWeekDay + 1
      cellDate = new Date(year, month, day)
    }

    const today = new Date()
    const isToday =
      cellDate.getFullYear() === today.getFullYear() &&
      cellDate.getMonth() === today.getMonth() &&
      cellDate.getDate() === today.getDate()

    cells.push({
      day,
      currentMonth,
      isToday,
      dateKey: `${cellDate.getFullYear()}-${cellDate.getMonth() + 1}-${cellDate.getDate()}`
    })
  }

  return cells
}

export default {
  name: 'HomeView',
  components: {
    Bell,
    ChatDotRound,
    DataAnalysis,
    Document,
    Money,
    TrendCharts,
    UserFilled
  },
  data() {
    return {
      loading: false,
      boardLoading: false,
      noticeDialogVisible: false,
      noticeDetailLoading: false,
      activeNotice: null,
      weekDays: ['日', '一', '二', '三', '四', '五', '六'],
      overview: {
        visitCount: 0,
        userCount: 0,
        orderCount: 0,
        salesAmount: 0,
        publishOrderCount: 0,
        receiveOrderCount: 0,
        publishAmount: 0,
        receiveAmount: 0
      },
      boardItems: []
    }
  },
  computed: {
    authStore() {
      return useAuthStore()
    },
    isAdminDashboard() {
      return this.authStore.hasPermission('user:manage')
    },
    today() {
      return new Date()
    },
    miniCalendarCells() {
      return createCalendarCells(this.today)
    },
    todayNumber() {
      return this.today.getDate()
    },
    todayWeekLabel() {
      return `星期${this.weekDays[this.today.getDay()]}`
    },
    currentMonthLabel() {
      return `${this.today.getFullYear()} 年 ${this.today.getMonth() + 1} 月`
    },
    statCards() {
      if (this.isAdminDashboard) {
        return [
          {
            key: 'visit',
            icon: 'TrendCharts',
            label: '访问量',
            value: this.overview.visitCount,
            tag: 'Traffic',
            desc: '查看平台当前累计发布与访问热度表现。',
            theme: 'ocean'
          },
          {
            key: 'user',
            icon: 'UserFilled',
            label: '用户数量',
            value: this.overview.userCount,
            tag: 'Users',
            desc: '查看当前平台沉淀用户规模与整体活跃基数。',
            theme: 'violet'
          },
          {
            key: 'order',
            icon: 'Document',
            label: '订单数量',
            value: this.overview.orderCount,
            tag: 'Orders',
            desc: '快速了解平台全部订单的流转数量。',
            theme: 'cyan'
          },
          {
            key: 'sales',
            icon: 'Money',
            label: '销售额',
            value: this.formatAmount(this.overview.salesAmount),
            tag: 'Revenue',
            desc: '汇总全平台已完成订单带来的成交金额。',
            theme: 'gold'
          }
        ]
      }

      return [
        {
          key: 'publish-order',
          icon: 'TrendCharts',
          label: '发布订单数',
          value: this.overview.publishOrderCount,
          tag: 'Publish Orders',
          desc: '统计当前账号作为发布方产生的订单数量。',
          theme: 'ocean'
        },
        {
          key: 'receive-order',
          icon: 'UserFilled',
          label: '接单订单数',
          value: this.overview.receiveOrderCount,
          tag: 'Receive Orders',
          desc: '统计当前账号作为接单方参与的订单数量。',
          theme: 'violet'
        },
        {
          key: 'publish-amount',
          icon: 'Document',
          label: '发布金额',
          value: this.formatAmount(this.overview.publishAmount),
          tag: 'Publish Revenue',
          desc: '统计当前账号作为发布方对应的成交金额。',
          theme: 'cyan'
        },
        {
          key: 'receive-amount',
          icon: 'Money',
          label: '接单金额',
          value: this.formatAmount(this.overview.receiveAmount),
          tag: 'Receive Revenue',
          desc: '统计当前账号作为接单方对应的成交金额。',
          theme: 'gold'
        }
      ]
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
          salesAmount: Number(data?.salesAmount || 0),
          publishOrderCount: Number(data?.publishOrderCount || 0),
          receiveOrderCount: Number(data?.receiveOrderCount || 0),
          publishAmount: Number(data?.publishAmount || 0),
          receiveAmount: Number(data?.receiveAmount || 0)
        }
      } catch (error) {
        this.overview = {
          visitCount: 0,
          userCount: 0,
          orderCount: 0,
          salesAmount: 0,
          publishOrderCount: 0,
          receiveOrderCount: 0,
          publishAmount: 0,
          receiveAmount: 0
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
  position: relative;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow: hidden;
  padding: 4px;
  background:
    radial-gradient(circle at 12% 18%, rgba(117, 156, 255, 0.24) 0%, rgba(117, 156, 255, 0) 32%),
    radial-gradient(circle at 86% 12%, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0) 28%),
    radial-gradient(circle at 78% 82%, rgba(33, 212, 253, 0.16) 0%, rgba(33, 212, 253, 0) 28%),
    linear-gradient(135deg, #edf4ff 0%, #eef2ff 36%, #f8fbff 100%);
  border-radius: 28px;
}

.ambient-layer {
  position: absolute;
  border-radius: 50%;
  filter: blur(10px);
  pointer-events: none;
}

.ambient-layer-a {
  top: 70px;
  right: -90px;
  width: 240px;
  height: 240px;
  background: radial-gradient(circle, rgba(106, 124, 255, 0.32) 0%, rgba(106, 124, 255, 0) 70%);
}

.ambient-layer-b {
  left: -80px;
  bottom: 40px;
  width: 220px;
  height: 220px;
  background: radial-gradient(circle, rgba(76, 214, 255, 0.26) 0%, rgba(76, 214, 255, 0) 72%);
}

.ambient-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.28) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.28) 1px, transparent 1px);
  background-size: 36px 36px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.32), transparent 78%);
}

.hero-shell,
.notice-shell {
  position: relative;
  z-index: 1;
}

.hero-panel,
.notice-board {
  position: relative;
  overflow: hidden;
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.56), rgba(255, 255, 255, 0.2));
  box-shadow:
    0 24px 80px rgba(99, 102, 241, 0.12),
    0 10px 28px rgba(15, 23, 42, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.hero-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.9fr);
  gap: 22px;
  padding: 26px 28px;
  margin-bottom: 20px;
}

.hero-kicker,
.notice-kicker {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(21, 31, 61, 0.08);
  color: #51607e;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-title {
  margin: 16px 0 10px;
  color: #172554;
  font-size: clamp(2.7rem, 5vw, 4.2rem);
  line-height: 0.95;
  font-weight: 900;
  letter-spacing: -0.06em;
}

.hero-subtitle {
  max-width: 560px;
  margin: 0;
  color: #5a6886;
  font-size: 1rem;
  line-height: 1.85;
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 22px;
}

.hero-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 0 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.54);
  border: 1px solid rgba(255, 255, 255, 0.78);
  color: #22304d;
  box-shadow: 0 12px 24px rgba(66, 84, 140, 0.1);
  font-size: 13px;
  font-weight: 600;
}

.hero-chip.soft {
  background: rgba(99, 102, 241, 0.08);
  border-color: rgba(99, 102, 241, 0.14);
}

.hero-chip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #32d583;
  box-shadow: 0 0 0 6px rgba(50, 213, 131, 0.16);
}

.calendar-compact {
  display: grid;
  grid-template-columns: 112px 1fr;
  gap: 14px;
  align-items: stretch;
}

.calendar-summary,
.calendar-mini {
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.56), rgba(255, 255, 255, 0.2));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.78);
}

.calendar-summary {
  padding: 16px 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.calendar-summary-top {
  color: #60708e;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.6;
}

.calendar-number {
  color: #172554;
  font-size: 3.3rem;
  line-height: 1;
  font-weight: 900;
  letter-spacing: -0.06em;
}

.calendar-caption {
  color: #5f6f8e;
  font-size: 13px;
  font-weight: 700;
}

.calendar-mini {
  padding: 12px;
}

.weekday-row {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
  margin-bottom: 8px;
}

.weekday-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 26px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.42);
  color: #51607e;
  font-size: 12px;
  font-weight: 700;
}

.date-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
}

.date-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.3);
  color: #25385a;
  font-size: 13px;
  font-weight: 700;
}

.date-cell.muted {
  opacity: 0.4;
}

.date-cell.today {
  background: linear-gradient(145deg, rgba(105, 127, 255, 0.18), rgba(255, 255, 255, 0.48));
  border: 1px solid rgba(98, 114, 255, 0.24);
  color: #3150dd;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 18px;
}

.stat-card {
  position: relative;
  overflow: hidden;
  min-height: 220px;
  padding: 20px 20px 22px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.56);
  background: linear-gradient(155deg, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0.18));
  box-shadow:
    0 24px 40px rgba(87, 101, 158, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(16px);
  transition: transform 0.28s ease, box-shadow 0.28s ease;
}

.stat-card:hover {
  transform: translateY(-6px);
  box-shadow:
    0 30px 55px rgba(87, 101, 158, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.78);
}

.stat-glow {
  position: absolute;
  inset: -20% auto auto -10%;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  opacity: 0.85;
  filter: blur(18px);
}

.theme-ocean .stat-glow {
  background: radial-gradient(circle, rgba(95, 137, 255, 0.36), rgba(95, 137, 255, 0));
}

.theme-violet .stat-glow {
  background: radial-gradient(circle, rgba(137, 92, 255, 0.28), rgba(137, 92, 255, 0));
}

.theme-cyan .stat-glow {
  background: radial-gradient(circle, rgba(63, 212, 255, 0.28), rgba(63, 212, 255, 0));
}

.theme-gold .stat-glow {
  background: radial-gradient(circle, rgba(255, 196, 87, 0.28), rgba(255, 196, 87, 0));
}

.stat-top {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.stat-icon-wrap {
  position: relative;
  width: 68px;
  height: 68px;
}

.stat-icon-shadow {
  position: absolute;
  inset: 10px 8px 0 8px;
  border-radius: 20px;
  background: rgba(71, 89, 156, 0.18);
  filter: blur(8px);
}

.stat-icon-face {
  position: absolute;
  inset: 0;
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.5)),
    linear-gradient(135deg, rgba(113, 134, 255, 0.28), rgba(80, 214, 255, 0.12));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.85),
    0 18px 26px rgba(94, 108, 170, 0.14);
}

.stat-icon {
  font-size: 30px;
  color: #3450dd;
  filter: drop-shadow(0 10px 14px rgba(52, 80, 221, 0.18));
}

.stat-tag {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.74);
  color: #4e5d7c;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.stat-value,
.stat-label,
.stat-desc {
  position: relative;
  z-index: 1;
}

.stat-value {
  margin-top: 26px;
  color: #18284d;
  font-size: clamp(2rem, 3vw, 2.7rem);
  font-weight: 900;
  letter-spacing: -0.05em;
}

.stat-label {
  margin-top: 8px;
  color: #354666;
  font-size: 1rem;
  font-weight: 700;
}

.stat-desc {
  margin-top: 14px;
  color: #66748f;
  font-size: 0.9rem;
  line-height: 1.75;
}

.notice-board {
  padding: 0;
}

.notice-board-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 24px 24px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.42);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.06));
}

.notice-board-title {
  margin: 14px 0 0;
  color: #1b2a50;
  font-size: 1.8rem;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.notice-board-meta {
  margin: 10px 0 0;
  color: #67748f;
  font-size: 0.94rem;
  line-height: 1.8;
}

.notice-board-side {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.notice-pill {
  display: inline-flex;
  align-items: center;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.1);
  color: #234ed8;
  border: 1px solid rgba(37, 99, 235, 0.12);
  font-size: 13px;
  font-weight: 700;
}

.notice-pill.subtle {
  background: rgba(255, 255, 255, 0.5);
  color: #53617d;
  border-color: rgba(255, 255, 255, 0.76);
}

.notice-list {
  padding: 8px 0;
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
  padding: 16px 24px;
  transition: background 0.2s ease, transform 0.2s ease;
}

.notice-item:hover {
  background: rgba(255, 255, 255, 0.26);
  transform: translateX(4px);
}

.notice-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 8px;
  flex-shrink: 0;
  box-shadow: 0 0 0 5px rgba(255, 255, 255, 0.42);
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
  font-weight: 700;
}

.notice-item-title {
  font-size: 1rem;
  color: #203152;
  font-weight: 800;
  margin-bottom: 4px;
}

.notice-item-summary {
  font-size: 0.92rem;
  color: #5e6e89;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notice-item-time {
  margin-top: 6px;
  font-size: 0.82rem;
  color: #7a879e;
}

.notice-item-arrow {
  color: #7c87a0;
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

@media (max-width: 1080px) {
  .hero-panel {
    grid-template-columns: 1fr;
  }

  .calendar-compact {
    grid-template-columns: 112px 1fr;
  }
}

@media (max-width: 768px) {
  .home-container {
    gap: 18px;
  }

  .hero-panel,
  .notice-board-header {
    padding: 22px 18px 18px;
  }

  .hero-panel {
    grid-template-columns: 1fr;
  }

  .calendar-compact {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .notice-board-header {
    flex-direction: column;
  }

  .notice-board-side {
    justify-content: flex-start;
  }

  .notice-item {
    padding: 14px 18px;
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
