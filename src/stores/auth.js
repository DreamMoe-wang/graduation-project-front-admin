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
        },
        {
          id: 1005,
          parentId: 1002,
          name: '订单大全',
          menuType: 2,
          path: '/trade/order',
          routeName: 'TradeOrder',
          component: 'trade/TradeOrder',
          icon: 'Document',
          children: []
        },
        {
          id: 1014,
          parentId: 1002,
          name: '交易审核',
          menuType: 3,
          path: null,
          routeName: null,
          component: null,
          icon: null,
          permissionCode: 'trade:review',
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
      id: 1008,
      parentId: 0,
      name: '角色管理',
      menuType: 2,
      path: '/role',
      routeName: 'RoleManage',
      component: 'role/RoleManage',
      icon: 'Avatar',
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
      id: 1010,
      parentId: 0,
      name: '字典管理',
      menuType: 2,
      path: '/dict',
      routeName: 'DictManage',
      component: 'dict/DictManage',
      icon: 'Collection',
      children: []
    },
    {
      id: 1011,
      parentId: 0,
      name: '通知公告',
      menuType: 2,
      path: '/notice',
      routeName: 'NoticeManage',
      component: 'notice/NoticeManage',
      icon: 'Bell',
      children: []
    },
    {
      id: 1012,
      parentId: 0,
      name: '日志管理',
      menuType: 2,
      path: '/log',
      routeName: 'LogManage',
      component: 'log/LogManage',
      icon: 'Notebook',
      children: []
    },
    {
      id: 1013,
      parentId: 0,
      name: '系统设置',
      menuType: 2,
      path: '/setting',
      routeName: 'SystemSetting',
      component: 'setting/SystemSetting',
      icon: 'Setting',
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
      'trade:order:view',
      'trade:order:receive',
      'trade:order:complete',
      'trade:order:cancel',
      'trade:review',
      'chat:view',
      'chat:contact',
      'user:manage',
      'role:manage',
      'menu:manage',
      'dict:manage',
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
  const menus = ref(getStoredMenus())
  const permissions = ref(getStoredPermissions())

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
    menus.value = Array.isArray(nextMenus) ? nextMenus : []
    setStoredMenus(menus.value)
  }

  function setPermissions(nextPermissions) {
    permissions.value = Array.isArray(nextPermissions) ? nextPermissions : []
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
      const bypassToken = createDevBypassToken()
      const bypassUser = createDevBypassUser()
      setToken(bypassToken)
      setUser(bypassUser)
      setMenus(bypassUser.menus)
      setPermissions(bypassUser.permissions)
      return bypassToken
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
