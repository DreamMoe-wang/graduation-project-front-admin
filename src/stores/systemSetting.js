import { defineStore } from 'pinia'
import { getSettingDetail, updateSettingDetail } from '@/api/setting'
import { getToken } from '@/utils/auth'

const STORAGE_KEY = 'admin-system-setting'

export const DEFAULT_SYSTEM_SETTING = {
  platformName: '同城任务',
  supportEmail: 'support@example.com',
  servicePhone: '400-800-1234',
  allowRegister: true,
  maintenanceMode: false,
  themeColor: '#5B66F3',
  themeMode: 'light',
  fontSize: 'medium',
  version: '0.1.0'
}

export const THEME_MODE_OPTIONS = [
  { value: 'light', label: '明亮模式' },
  { value: 'dark', label: '暗黑模式' }
]

export const FONT_SIZE_OPTIONS = [
  { value: 'small', label: '小号' },
  { value: 'medium', label: '中号' },
  { value: 'large', label: '大号' }
]

const FONT_SIZE_MAP = {
  small: '14px',
  medium: '16px',
  large: '18px'
}

const TEXT_MAP = {
  'layout.profile': '个人中心',
  'layout.logout': '退出登录',
  'layout.notifications': '通知中心',
  'layout.noNotifications': '暂无新通知',
  'layout.refreshNotifications': '刷新通知',
  'layout.loadingNotifications': '正在加载通知...',
  'layout.systemNotice': '系统公告',
  'layout.newMessages': '新消息',
  'layout.newMessageHint': '你有一条新消息',
  'layout.justNow': '刚刚',
  'layout.messageNotice': '消息通知',
  'layout.noticeHint': '点击查看公告详情',
  'layout.confirmLogout': '确认退出当前登录状态吗？',
  'layout.prompt': '提示',
  'layout.menuEmpty': '暂无菜单权限',
  'layout.notificationRefreshed': '通知已刷新',
  'layout.newMessagePopup': '新消息通知',
  'layout.noticePopup': '公告通知',
  'layout.unreadMessageCount': '你有 {count} 条未读消息',
  'tags.home': '首页',
  'tags.tradePublish': '交易发布',
  'tags.tradePublishCreate': '创建交易',
  'tags.tradePublishEdit': '编辑交易',
  'tags.tradeList': '交易大全',
  'tags.tradeOrder': '我的订单',
  'tags.tradeOrderPublish': '发布订单',
  'tags.tradeOrderReceive': '接取订单',
  'tags.chat': '聊天室',
  'tags.profile': '个人中心',
  'tags.user': '用户管理',
  'tags.role': '角色管理',
  'tags.menu': '菜单管理',
  'tags.notice': '通知公告',
  'tags.log': '日志管理',
  'tags.setting': '系统设置',
  'menu.home': '首页',
  'menu.trade': '交易集市',
  'menu.tradePublish': '交易发布',
  'menu.tradeList': '交易大全',
  'menu.tradeOrder': '我的订单',
  'menu.tradeOrderPublish': '发布订单',
  'menu.tradeOrderReceive': '接取订单',
  'menu.chat': '聊天室',
  'menu.user': '用户管理',
  'menu.role': '角色管理',
  'menu.menu': '菜单管理',
  'menu.notice': '通知公告',
  'menu.log': '日志管理',
  'menu.setting': '系统设置',
  'menu.profile': '个人中心',
  'setting.title': '系统设置',
  'setting.subtitle': '统一配置主题颜色、明暗模式和字体大小，并在保存后同步到后台。',
  'setting.section.base': '基础信息',
  'setting.section.appearance': '界面外观',
  'setting.section.preview': '实时预览',
  'setting.platformName': '平台名称',
  'setting.supportEmail': '支持邮箱',
  'setting.servicePhone': '客服电话',
  'setting.version': '系统版本',
  'setting.allowRegister': '允许注册',
  'setting.maintenanceMode': '维护模式',
  'setting.themeColor': '主题颜色',
  'setting.themeMode': '系统明暗度',
  'setting.fontSize': '字体大小',
  'setting.previewTitle': '设置预览',
  'setting.previewText': '主题色、字体和明暗模式会在这里即时呈现。',
  'setting.reset': '恢复保存',
  'setting.defaults': '恢复默认',
  'setting.save': '保存设置',
  'setting.saved': '系统设置已保存',
  'setting.previewBadge': '实时预览',
  'setting.previewButton': '示例按钮'
}

const PATH_TRANSLATIONS = {
  '/': 'menu.home',
  '/trade': 'menu.trade',
  '/trade/publish': 'menu.tradePublish',
  '/trade/publish/create': 'tags.tradePublishCreate',
  '/trade/publish/edit': 'tags.tradePublishEdit',
  '/trade/list': 'menu.tradeList',
  '/trade/order': 'menu.tradeOrder',
  '/trade/order/publish': 'menu.tradeOrderPublish',
  '/trade/order/receive': 'menu.tradeOrderReceive',
  '/chat': 'menu.chat',
  '/user': 'menu.user',
  '/role': 'menu.user',
  '/menu': 'menu.menu',
  '/notice': 'menu.notice',
  '/log': 'menu.log',
  '/setting': 'menu.setting',
  '/profile': 'menu.profile'
}

function safeLocalStorage() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}

function readStoredSettings() {
  const storage = safeLocalStorage()
  if (!storage) return null

  const value = storage.getItem(STORAGE_KEY)
  if (!value) return null

  try {
    return JSON.parse(value)
  } catch (error) {
    storage.removeItem(STORAGE_KEY)
    return null
  }
}

function writeStoredSettings(settings) {
  const storage = safeLocalStorage()
  if (!storage) return
  storage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

function normalizeSettings(payload = {}) {
  return {
    ...DEFAULT_SYSTEM_SETTING,
    ...payload,
    allowRegister: payload.allowRegister == null ? DEFAULT_SYSTEM_SETTING.allowRegister : Boolean(payload.allowRegister),
    maintenanceMode: payload.maintenanceMode == null ? DEFAULT_SYSTEM_SETTING.maintenanceMode : Boolean(payload.maintenanceMode),
    themeColor: payload.themeColor || DEFAULT_SYSTEM_SETTING.themeColor,
    themeMode: payload.themeMode || DEFAULT_SYSTEM_SETTING.themeMode,
    fontSize: payload.fontSize || DEFAULT_SYSTEM_SETTING.fontSize
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function hexToRgb(hex) {
  const normalized = (hex || '').replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return { r: 91, g: 102, b: 243 }
  }

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16)
  }
}

function rgbToHex({ r, g, b }) {
  const toHex = value => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function mixColor(color, target, ratio) {
  const source = hexToRgb(color)
  const mixed = {
    r: source.r + (target.r - source.r) * ratio,
    g: source.g + (target.g - source.g) * ratio,
    b: source.b + (target.b - source.b) * ratio
  }
  return rgbToHex(mixed)
}

function resolvePathKey(path = '') {
  if (!path) return ''
  if (path.startsWith('/trade/publish/edit/')) return '/trade/publish/edit'
  if (path.startsWith('/trade/publish/create')) return '/trade/publish/create'
  return path
}

function setCssVariable(name, value) {
  if (typeof document === 'undefined') return
  document.documentElement.style.setProperty(name, value)
}

export const useSystemSettingStore = defineStore('systemSetting', {
  state: () => ({
    settings: normalizeSettings(readStoredSettings() || {}),
    initialized: false
  }),
  actions: {
    t(key, vars = {}) {
      let text = TEXT_MAP[key] || key
      Object.keys(vars).forEach(name => {
        text = text.replace(`{${name}}`, vars[name])
      })
      return text
    },
    applySettings(nextSettings = this.settings) {
      const normalized = normalizeSettings(nextSettings)
      const primary = normalized.themeColor
      const primaryLight3 = mixColor(primary, { r: 255, g: 255, b: 255 }, 0.3)
      const primaryLight5 = mixColor(primary, { r: 255, g: 255, b: 255 }, 0.5)
      const primaryLight7 = mixColor(primary, { r: 255, g: 255, b: 255 }, 0.7)
      const primaryLight8 = mixColor(primary, { r: 255, g: 255, b: 255 }, 0.8)
      const primaryLight9 = mixColor(primary, { r: 255, g: 255, b: 255 }, 0.9)
      const primaryDark2 = mixColor(primary, { r: 0, g: 0, b: 0 }, 0.2)
      const rgb = hexToRgb(primary)

      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme-mode', normalized.themeMode)
        document.documentElement.setAttribute('lang', 'zh-CN')
        document.title = normalized.platformName || DEFAULT_SYSTEM_SETTING.platformName
      }

      setCssVariable('--app-font-size', FONT_SIZE_MAP[normalized.fontSize] || FONT_SIZE_MAP.medium)
      setCssVariable('--app-theme-color', primary)
      setCssVariable('--app-theme-color-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`)
      setCssVariable('--app-theme-color-light', primaryLight7)
      setCssVariable('--app-theme-color-dark', primaryDark2)
      setCssVariable('--app-sidebar-start', mixColor(primary, { r: 18, g: 24, b: 38 }, 0.78))
      setCssVariable('--app-sidebar-end', mixColor(primary, { r: 28, g: 33, b: 52 }, 0.78))
      setCssVariable('--app-logo-bg', mixColor(primary, { r: 0, g: 0, b: 0 }, 0.75))
      setCssVariable('--el-color-primary', primary)
      setCssVariable('--el-color-primary-light-3', primaryLight3)
      setCssVariable('--el-color-primary-light-5', primaryLight5)
      setCssVariable('--el-color-primary-light-7', primaryLight7)
      setCssVariable('--el-color-primary-light-8', primaryLight8)
      setCssVariable('--el-color-primary-light-9', primaryLight9)
      setCssVariable('--el-color-primary-dark-2', primaryDark2)
    },
    initialize() {
      this.settings = normalizeSettings(readStoredSettings() || this.settings)
      this.applySettings(this.settings)
      this.initialized = true
    },
    async syncRemote(options = {}) {
      const { silent = true } = options
      if (!getToken()) {
        return this.settings
      }

      const remoteSettings = await getSettingDetail({ silent })
      this.settings = normalizeSettings(remoteSettings)
      writeStoredSettings(this.settings)
      this.applySettings(this.settings)
      return this.settings
    },
    previewSettings(nextSettings) {
      this.applySettings(normalizeSettings({
        ...this.settings,
        ...nextSettings
      }))
    },
    async saveSettings(nextSettings) {
      const normalized = normalizeSettings(nextSettings)
      await updateSettingDetail(normalized)
      this.settings = normalized
      writeStoredSettings(this.settings)
      this.applySettings(this.settings)
      return this.settings
    },
    translateByPath(path, fallback = '') {
      const key = PATH_TRANSLATIONS[resolvePathKey(path)]
      return key ? this.t(key) : fallback
    }
  }
})
