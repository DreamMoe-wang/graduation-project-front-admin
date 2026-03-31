const TOKEN_KEY = 'admin-token'
const USER_KEY = 'admin-user'

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
  const payload = typeof token === 'string' ? parseJwtPayload(token) : token

  if (!payload?.exp) return false

  return Number(payload.exp) <= Date.now()
}
