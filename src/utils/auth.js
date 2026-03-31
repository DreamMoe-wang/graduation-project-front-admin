const TOKEN_KEY = 'admin-token'
const USER_KEY = 'admin-user'
const DEV_BYPASS_TOKEN = '__DEV_BYPASS_TOKEN__'

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
}

export function createDevBypassToken() {
  return DEV_BYPASS_TOKEN
}

export function isDevBypassToken(token) {
  return token === DEV_BYPASS_TOKEN
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
    return {
      userId: 0,
      username: 'admin',
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000
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
    return false
  }

  const payload = typeof token === 'string' ? parseJwtPayload(token) : token

  if (!payload?.exp) return false

  return Number(payload.exp) <= Date.now()
}
