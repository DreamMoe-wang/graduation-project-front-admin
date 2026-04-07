/**
 * 侧边栏菜单配置
 */
export default [
  {
    path: '/',
    name: '首页',
    icon: 'HomeFilled'
  },
  {
    path: '/trade',
    name: '交易集市',
    icon: 'ShoppingCart',
    children: [
      {
        path: '/trade/publish',
        name: '交易发布',
        icon: 'EditPen'
      },
      {
        path: '/trade/list',
        name: '交易大全',
        icon: 'List'
      },
      {
        path: '/trade/order',
        name: '订单大全',
        icon: 'Document'
      }
    ]
  },
  {
    path: '/chat',
    name: '聊天室',
    icon: 'ChatDotRound'
  },
  {
    path: '/user',
    name: '用户管理',
    icon: 'User'
  },
  {
    path: '/menu',
    name: '菜单管理',
    icon: 'Menu'
  },
  {
    path: '/notice',
    name: '通知公告',
    icon: 'Bell'
  },
  {
    path: '/log',
    name: '日志管理',
    icon: 'Notebook'
  },
  {
    path: '/setting',
    name: '系统设置',
    icon: 'Setting'
  }
]
