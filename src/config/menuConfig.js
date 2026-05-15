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
    path: '/qualification',
    name: '资格认证',
    icon: 'Medal'
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
      }
    ]
  },
  {
    path: '/trade/order',
    name: '我的订单',
    icon: 'Document',
    children: [
      {
        path: '/trade/order/publish',
        name: '发布订单',
        icon: 'Document'
      },
      {
        path: '/trade/order/receive',
        name: '接取订单',
        icon: 'Tickets'
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
    path: '/trade/category',
    name: '??????',
    icon: 'PriceTag'
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
