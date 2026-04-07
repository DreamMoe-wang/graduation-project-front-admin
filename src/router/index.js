import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import BasicLayout from '@/layouts/BasicLayout.vue'
import { pinia } from '@/stores'
import { useAuthStore } from '@/stores/auth'
import { isTokenExpired } from '@/utils/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/LoginView.vue'),
    meta: { title: '登录', public: true }
  },
  {
    path: '/',
    name: 'Home',
    component: BasicLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/HomeView.vue'),
        meta: { title: '首页', affix: true }
      },
      {
        path: 'trade/publish',
        name: 'TradePublish',
        component: () => import('@/views/trade/TradePublish.vue'),
        meta: { title: '交易发布' }
      },
      {
        path: 'trade/publish/create',
        name: 'TradePublishCreate',
        component: () => import('@/views/trade/TradePublishForm.vue'),
        meta: { title: '创建交易', menuPath: '/trade/publish' }
      },
      {
        path: 'trade/publish/edit/:id',
        name: 'TradePublishEdit',
        component: () => import('@/views/trade/TradePublishForm.vue'),
        meta: { title: '编辑交易', menuPath: '/trade/publish' }
      },
      {
        path: 'trade/list',
        name: 'TradeList',
        component: () => import('@/views/trade/TradeList.vue'),
        meta: { title: '交易大全' }
      },
      {
        path: 'trade/order',
        name: 'TradeOrder',
        component: () => import('@/views/trade/TradeOrder.vue'),
        meta: { title: '订单大全' }
      },
      {
        path: 'chat',
        name: 'ChatRoom',
        component: () => import('@/views/chat/ChatRoom.vue'),
        meta: { title: '聊天室' }
      },
      {
        path: 'profile',
        name: 'ProfileCenter',
        component: () => import('@/views/profile/ProfileCenter.vue'),
        meta: { title: '个人中心' }
      },
      {
        path: 'user',
        name: 'UserManage',
        component: () => import('@/views/user/UserManage.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'role',
        name: 'RoleManage',
        redirect: '/user',
        meta: { title: '用户管理', menuPath: '/user' }
      },
      {
        path: 'menu',
        name: 'MenuManage',
        component: () => import('@/views/menu/MenuManage.vue'),
        meta: { title: '菜单管理' }
      },
      {
        path: 'notice',
        name: 'NoticeManage',
        component: () => import('@/views/notice/NoticeManage.vue'),
        meta: { title: '通知公告' }
      },
      {
        path: 'log',
        name: 'LogManage',
        component: () => import('@/views/log/LogManage.vue'),
        meta: { title: '日志管理' }
      },
      {
        path: 'setting',
        name: 'SystemSetting',
        component: () => import('@/views/setting/SystemSetting.vue'),
        meta: { title: '系统设置' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

function normalizeAccessiblePath(path = '') {
  return path === '/role' ? '/user' : path
}

function collectAccessibleMenuPaths(menus = [], result = []) {
  for (const item of menus || []) {
    if (!item) continue

    const hasChildren = Array.isArray(item.children) && item.children.length > 0
    const normalizedPath = normalizeAccessiblePath(item.path)
    const isPageMenu = item.menuType === 2 && normalizedPath

    if (isPageMenu) {
      result.push(normalizedPath)
    }

    if (hasChildren) {
      collectAccessibleMenuPaths(item.children, result)
    }
  }

  return result
}

function resolveRedirectPath(allowedPaths = []) {
  if (allowedPaths.includes('/')) {
    return '/'
  }

  return allowedPaths[0] || '/'
}

router.beforeEach(async to => {
  const authStore = useAuthStore(pinia)
  const isPublicPage = !!to.meta.public

  if (authStore.token && isTokenExpired(authStore.token)) {
    authStore.logout()
  }

  if (authStore.token && !authStore.user) {
    await authStore.restoreSession()
  }

  if (isPublicPage) {
    if (authStore.isLoggedIn) {
      const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : '/'
      return redirect === '/login' ? '/' : redirect
    }

    return true
  }

  if (!authStore.isLoggedIn) {
    return {
      path: '/login',
      query: {
        redirect: to.fullPath
      }
    }
  }

  const allowedPaths = Array.from(new Set(collectAccessibleMenuPaths(authStore.currentMenus)))
  const targetMenuPath = typeof to.meta.menuPath === 'string' ? to.meta.menuPath : to.path
  const requiredMenuPath = normalizeAccessiblePath(targetMenuPath)

  if (requiredMenuPath && !allowedPaths.includes(requiredMenuPath)) {
    const redirectPath = resolveRedirectPath(allowedPaths)

    if (to.path !== redirectPath) {
      ElMessage.warning('你当前没有访问该页面的权限')
      return redirectPath
    }
  }

  return true
})

export default router
