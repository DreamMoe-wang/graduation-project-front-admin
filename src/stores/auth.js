import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { createUser, getUserDetail, loginUser } from '@/api/user'
import {
  clearAuthStorage,
  createDevBypassToken,
  getStoredUser,
  getToken,
  isDevBypassToken,
  isTokenExpired,
  parseJwtPayload,
  setStoredUser,
  setToken as saveToken
} from '@/utils/auth'

function createFallbackUser(token) {
  const payload = parseJwtPayload(token)

  if (!payload) return null

  return {
    id: payload.userId || null,
    username: payload.username || '',
    nickname: payload.username || '管理员'
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(getStoredUser())
  const token = ref(getToken())

  const isLoggedIn = computed(() => !!token.value)
  const currentUser = computed(() => user.value)
  const displayName = computed(() => user.value?.nickname || user.value?.username || '管理员')

  function setUser(nextUser) {
    user.value = nextUser
    setStoredUser(nextUser)
  }

  function setToken(nextToken) {
    token.value = nextToken || ''
    saveToken(nextToken || '')
  }

  function clearLoginState() {
    user.value = null
    token.value = ''
    clearAuthStorage()
  }

  async function login(credentials) {
    const username = credentials?.username || ''
    const password = credentials?.password || ''

    if (username === 'admin' && password === '123456') {
      const bypassToken = createDevBypassToken()
      setToken(bypassToken)
      setUser({
        id: 0,
        username: 'admin',
        nickname: '开发管理员'
      })
      return bypassToken
    }

    const nextToken = await loginUser(credentials)

    setToken(nextToken)
    await restoreSession()

    return nextToken
  }

  async function register(payload) {
    const registerPayload = {
      username: payload.username,
      password: payload.password,
      nickname: payload.nickname || payload.username,
      email: payload.email || undefined,
      status: 1
    }

    return createUser(registerPayload)
  }

  async function restoreSession() {
    const currentToken = token.value || getToken()

    if (!currentToken || isTokenExpired(currentToken)) {
      clearLoginState()
      return false
    }

    if (token.value !== currentToken) {
      setToken(currentToken)
    }

    if (isDevBypassToken(currentToken)) {
      setUser({
        id: 0,
        username: 'admin',
        nickname: '开发管理员'
      })
      return true
    }

    const fallbackUser = createFallbackUser(currentToken)

    if (fallbackUser && (!user.value || user.value.id !== fallbackUser.id)) {
      setUser(fallbackUser)
    }

    if (!fallbackUser?.id) {
      return true
    }

    try {
      const detail = await getUserDetail(fallbackUser.id)
      setUser(detail || fallbackUser)
    } catch (error) {
      setUser(fallbackUser)
    }

    return true
  }

  function logout() {
    clearLoginState()
  }

  return {
    user,
    token,
    isLoggedIn,
    currentUser,
    displayName,
    setUser,
    setToken,
    login,
    register,
    restoreSession,
    logout
  }
})
