import { createRouter, createWebHistory } from 'vue-router'
import BasicLayout from '@/layouts/BasicLayout.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: BasicLayout,
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
        path: 'user',
        name: 'UserManage',
        component: () => import('@/views/user/UserManage.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'role',
        name: 'RoleManage',
        component: () => import('@/views/role/RoleManage.vue'),
        meta: { title: '角色管理' }
      },
      {
        path: 'menu',
        name: 'MenuManage',
        component: () => import('@/views/menu/MenuManage.vue'),
        meta: { title: '菜单管理' }
      },
      {
        path: 'dict',
        name: 'DictManage',
        component: () => import('@/views/dict/DictManage.vue'),
        meta: { title: '字典管理' }
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

export default router
