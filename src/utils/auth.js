const TOKEN_KEY = 'admin-token'
const USER_KEY = 'admin-user'
const MENU_KEY = 'admin-menus'
const PERMISSION_KEY = 'admin-permissions'
const DEV_BYPASS_TOKEN = '__DEV_BYPASS_TOKEN__'
const DEV_BYPASS_PREFIX = `${DEV_BYPASS_TOKEN}:`
const DEV_BYPASS_TTL_MS = 2 * 60 * 60 * 1000

function safeLocalStorage() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}

export function getToken() {
  return safeLocalStorage()?.getItem(TOKEN_KEY) || ''
}

export function setToken(token) {
  const storage = safeLocalStorage()

  if (!storage) return

  if (token) {
    storage.setItem(TOKEN_KEY, token)
  } else {
    storage.removeItem(TOKEN_KEY)
  }
}

export function getStoredUser() {
  const storage = safeLocalStorage()

  if (!storage) return null

  const value = storage.getItem(USER_KEY)

  if (!value) return null

  try {
    return JSON.parse(value)
  } catch (error) {
    storage.removeItem(USER_KEY)
    return null
  }
}

export function setStoredUser(user) {
  const storage = safeLocalStorage()

  if (!storage) return

  if (user) {
    storage.setItem(USER_KEY, JSON.stringify(user))
  } else {
    storage.removeItem(USER_KEY)
  }
}

export function clearAuthStorage() {
  const storage = safeLocalStorage()

  if (!storage) return

  storage.removeItem(TOKEN_KEY)
  storage.removeItem(USER_KEY)
  storage.removeItem(MENU_KEY)
  storage.removeItem(PERMISSION_KEY)
}

export function getStoredMenus() {
  const storage = safeLocalStorage()

  if (!storage) return []

  const value = storage.getItem(MENU_KEY)

  if (!value) return []

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    storage.removeItem(MENU_KEY)
    return []
  }
}

export function setStoredMenus(menus) {
  const storage = safeLocalStorage()

  if (!storage) return

  if (Array.isArray(menus) && menus.length) {
    storage.setItem(MENU_KEY, JSON.stringify(menus))
  } else {
    storage.removeItem(MENU_KEY)
  }
}

export function getStoredPermissions() {
  const storage = safeLocalStorage()

  if (!storage) return []

  const value = storage.getItem(PERMISSION_KEY)

  if (!value) return []

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    storage.removeItem(PERMISSION_KEY)
    return []
  }
}

export function setStoredPermissions(permissions) {
  const storage = safeLocalStorage()

  if (!storage) return

  if (Array.isArray(permissions) && permissions.length) {
    storage.setItem(PERMISSION_KEY, JSON.stringify(permissions))
  } else {
    storage.removeItem(PERMISSION_KEY)
  }
}

export function createDevBypassToken() {
  return `${DEV_BYPASS_PREFIX}${Date.now() + DEV_BYPASS_TTL_MS}`
}

export function isDevBypassToken(token) {
  return token === DEV_BYPASS_TOKEN
    || (typeof token === 'string' && token.startsWith(DEV_BYPASS_PREFIX))
}

function getDevBypassExpireAt(token) {
  if (typeof token !== 'string') return 0
  if (token === DEV_BYPASS_TOKEN) return 0
  if (!token.startsWith(DEV_BYPASS_PREFIX)) return 0

  const expireAt = Number(token.slice(DEV_BYPASS_PREFIX.length))
  return Number.isFinite(expireAt) ? expireAt : 0
}

function decodeBase64Url(value) {
  if (!value) return ''

  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')

  try {
    return decodeURIComponent(
      atob(padded)
        .split('')
        .map(char => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    )
  } catch (error) {
    return ''
  }
}

export function parseJwtPayload(token) {
  if (!token) return null

  if (isDevBypassToken(token)) {
    const exp = getDevBypassExpireAt(token)
    return {
      userId: 0,
      username: 'admin',
      exp
    }
  }

  const pureToken = token.startsWith('Bearer ') ? token.slice(7) : token
  const parts = pureToken.split('.')

  if (parts.length < 2) return null

  try {
    return JSON.parse(decodeBase64Url(parts[1]))
  } catch (error) {
    return null
  }
}

export function isTokenExpired(token) {
  if (typeof token === 'string' && isDevBypassToken(token)) {
    return getDevBypassExpireAt(token) <= Date.now()
  }

  const payload = typeof token === 'string' ? parseJwtPayload(token) : token

  if (!payload?.exp) return false

  return Number(payload.exp) <= Date.now()
}
