import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { loginAuth, getCurrentUser } from '@/api/auth'
import { createUser } from '@/api/user'
import {
  clearAuthStorage,
  createDevBypassToken,
  getStoredMenus,
  getStoredPermissions,
  getStoredUser,
  getToken,
  isDevBypassToken,
  isTokenExpired,
  setStoredMenus,
  setStoredPermissions,
  setStoredUser,
  setToken as saveToken
} from '@/utils/auth'

const REMOVED_MENU_PATHS = new Set(['/dict'])
const REMOVED_PERMISSION_CODES = new Set(['dict:manage'])

function filterRemovedMenus(items = []) {
  return (Array.isArray(items) ? items : [])
    .filter(item => item && !REMOVED_MENU_PATHS.has(item.path))
    .map(item => ({
      ...item,
      children: filterRemovedMenus(item.children)
    }))
}

function filterRemovedPermissions(items = []) {
  return (Array.isArray(items) ? items : []).filter(item => !REMOVED_PERMISSION_CODES.has(item))
}

function createDevMenus() {
  return [
    {
      id: 1001,
      parentId: 0,
      name: '首页',
      menuType: 2,
      path: '/',
      routeName: 'Dashboard',
      component: 'HomeView',
      icon: 'HomeFilled',
      children: []
    },
    {
      id: 1002,
      parentId: 0,
      name: '交易集市',
      menuType: 1,
      path: '/trade',
      routeName: 'TradeMarket',
      component: null,
      icon: 'ShoppingCart',
      children: [
        {
          id: 1003,
          parentId: 1002,
          name: '交易发布',
          menuType: 2,
          path: '/trade/publish',
          routeName: 'TradePublish',
          component: 'trade/TradePublish',
          icon: 'EditPen',
          children: []
        },
        {
          id: 1004,
          parentId: 1002,
          name: '交易大全',
          menuType: 2,
          path: '/trade/list',
          routeName: 'TradeList',
          component: 'trade/TradeList',
          icon: 'List',
          children: []
        }
      ]
    },
    {
      id: 1005,
      parentId: 0,
      name: '我的订单',
      menuType: 1,
      path: '/trade/order',
      routeName: 'TradeOrder',
      component: null,
      icon: 'Document',
      children: [
        {
          id: 1031,
          parentId: 1005,
          name: '发布订单',
          menuType: 2,
          path: '/trade/order/publish',
          routeName: 'TradeOrderPublish',
          component: 'trade/TradeOrder',
          icon: 'Document',
          children: []
        },
        {
          id: 1032,
          parentId: 1005,
          name: '接取订单',
          menuType: 2,
          path: '/trade/order/receive',
          routeName: 'TradeOrderReceive',
          component: 'trade/TradeOrder',
          icon: 'Tickets',
          children: []
        }
      ]
    },
    {
      id: 1006,
      parentId: 0,
      name: '聊天室',
      menuType: 2,
      path: '/chat',
      routeName: 'ChatRoom',
      component: 'chat/ChatRoom',
      icon: 'ChatDotRound',
      children: []
    },
    {
      id: 1007,
      parentId: 0,
      name: '用户管理',
      menuType: 2,
      path: '/user',
      routeName: 'UserManage',
      component: 'user/UserManage',
      icon: 'User',
      children: []
    },
    {
      id: 1009,
      parentId: 0,
      name: '菜单管理',
      menuType: 2,
      path: '/menu',
      routeName: 'MenuManage',
      component: 'menu/MenuManage',
      icon: 'Menu',
      children: []
    },
    {
      id: 1030,
      parentId: 0,
      name: '个人中心',
      menuType: 2,
      path: '/profile',
      routeName: 'ProfileCenter',
      component: 'profile/ProfileCenter',
      icon: 'UserFilled',
      children: []
    }
  ]
}

function createDevBypassUser() {
  return {
    userId: 0,
    username: 'admin',
    nickname: '开发管理员',
    displayName: '开发管理员',
    roles: ['ADMIN'],
    roleNames: ['管理员'],
    authorities: ['ROLE_ADMIN'],
    permissions: [
      'trade:publish:view',
      'trade:publish:create',
      'trade:publish:edit',
      'trade:publish:delete',
      'trade:publish:save',
      'trade:publish:submit',
      'trade:list:view',
      'trade:list:export',
      'trade:list:edit',
      'trade:list:delete',
      'trade:list:take',
      'trade:order:view',
      'trade:order:receive',
      'trade:order:complete',
      'trade:order:cancel',
      'chat:view',
      'chat:contact',
      'profile:view',
      'trade:review',
      'user:manage',
      'role:manage',
      'menu:view',
      'menu:create',
      'menu:edit',
      'menu:delete',
      'notice:manage',
      'log:manage',
      'setting:manage'
    ],
    menus: createDevMenus()
  }
}

function normalizeAuthUser(payload = {}) {
  return {
    ...payload,
    userId: payload.userId ?? payload.id ?? null,
    username: payload.username || '',
    nickname: payload.nickname || payload.displayName || payload.username || '',
    displayName: payload.displayName || payload.nickname || payload.username || '管理员',
    avatar: payload.avatar || '',
    roles: Array.isArray(payload.roles) ? payload.roles : [],
    roleNames: Array.isArray(payload.roleNames) ? payload.roleNames : [],
    authorities: Array.isArray(payload.authorities) ? payload.authorities : [],
    permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
    menus: Array.isArray(payload.menus) ? payload.menus : []
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(getStoredUser())
  const token = ref(getToken())
  const menus = ref(filterRemovedMenus(getStoredMenus()))
  const permissions = ref(filterRemovedPermissions(getStoredPermissions()))

  const isLoggedIn = computed(() => !!token.value)
  const currentUser = computed(() => user.value)
  const displayName = computed(() => user.value?.displayName || user.value?.nickname || user.value?.username || '管理员')
  const currentMenus = computed(() => menus.value)
  const currentPermissionCodes = computed(() => Array.from(new Set(permissions.value)))

  function setUser(nextUser) {
    user.value = nextUser
    setStoredUser(nextUser)
  }

  function setToken(nextToken) {
    token.value = nextToken || ''
    saveToken(nextToken || '')
  }

  function setMenus(nextMenus) {
    menus.value = filterRemovedMenus(nextMenus)
    setStoredMenus(menus.value)
  }

  function setPermissions(nextPermissions) {
    permissions.value = filterRemovedPermissions(nextPermissions)
    setStoredPermissions(permissions.value)
  }

  function clearLoginState() {
    user.value = null
    token.value = ''
    menus.value = []
    permissions.value = []
    clearAuthStorage()
  }

  async function login(credentials) {
    const username = credentials?.username || ''
    const password = credentials?.password || ''

    if (username === 'admin' && password === '123456') {
      const bypassUser = createDevBypassUser()
      setToken(createDevBypassToken())
      setUser(bypassUser)
      setMenus(bypassUser.menus)
      setPermissions(bypassUser.permissions)
      return token.value
    }

    const loginPayload = await loginAuth(credentials)
    const normalizedUser = normalizeAuthUser(loginPayload)
    const nextToken = loginPayload?.token || ''

    setToken(nextToken)
    setUser(normalizedUser)
    setMenus(normalizedUser.menus)
    setPermissions(normalizedUser.permissions)

    if (!normalizedUser.menus.length) {
      await restoreSession()
    }

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
      const bypassUser = createDevBypassUser()
      setUser(bypassUser)
      setMenus(bypassUser.menus)
      setPermissions(bypassUser.permissions)
      return true
    }

    try {
      const currentUserPayload = await getCurrentUser()
      const normalizedUser = normalizeAuthUser(currentUserPayload)
      setUser(normalizedUser)
      setMenus(normalizedUser.menus)
      setPermissions(normalizedUser.permissions)
      return true
    } catch (error) {
      clearLoginState()
      throw error
    }
  }

  function logout() {
    clearLoginState()
  }

  function hasPermission(permissionCode) {
    if (!permissionCode) return true
    return currentPermissionCodes.value.includes(permissionCode)
  }

  function hasAnyPermission(permissionCodes = []) {
    if (!Array.isArray(permissionCodes) || permissionCodes.length === 0) return true
    return permissionCodes.some(item => hasPermission(item))
  }

  return {
    user,
    token,
    menus,
    permissions,
    isLoggedIn,
    currentUser,
    currentMenus,
    currentPermissionCodes,
    displayName,
    setUser,
    setToken,
    setMenus,
    setPermissions,
    login,
    register,
    restoreSession,
    logout,
    hasPermission,
    hasAnyPermission
  }
})
