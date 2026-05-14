export const TRADE_STATUS_OPTIONS = [
  { label: '草稿', value: 'draft' },
  { label: '审核中', value: 'auditing' },
  { label: '已发布', value: 'published' },
  { label: '未通过', value: 'rejected' },
  { label: '交易中', value: 'trading' },
  { label: '交易结束', value: 'completed' }
]

export const TRADE_STATUS_TYPE_MAP = {
  draft: 'info',
  auditing: 'warning',
  published: 'primary',
  rejected: 'danger',
  trading: 'success',
  completed: ''
}

export const TRADE_STATUS_TEXT_MAP = TRADE_STATUS_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item.label
  return acc
}, {})

export const ORDER_STATUS_OPTIONS = [
  { label: '待确认', value: 'pending' },
  { label: '进行中', value: 'progress' },
  { label: '待委托方确认', value: 'confirm_pending' },
  { label: '待支付', value: 'pay_pending' },
  { label: '已完成', value: 'success' },
  { label: '已取消', value: 'cancel' }
]

export const ORDER_STATUS_TYPE_MAP = {
  pending: 'warning',
  progress: 'primary',
  confirm_pending: 'warning',
  pay_pending: 'danger',
  success: 'success',
  cancel: 'info'
}

export const ORDER_STATUS_TEXT_MAP = ORDER_STATUS_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item.label
  return acc
}, {})

export const QUALIFICATION_STATUS_OPTIONS = [
  { label: '草稿', value: 'draft' },
  { label: '审核中', value: 'auditing' },
  { label: '已通过', value: 'approved' },
  { label: '未通过', value: 'rejected' }
]

export const QUALIFICATION_STATUS_TYPE_MAP = {
  draft: 'info',
  auditing: 'warning',
  approved: 'success',
  rejected: 'danger'
}

export const QUALIFICATION_STATUS_TEXT_MAP = QUALIFICATION_STATUS_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item.label
  return acc
}, {})

export function getTradeStatusType(status) {
  return TRADE_STATUS_TYPE_MAP[status] || 'info'
}

export function getTradeStatusText(status) {
  return TRADE_STATUS_TEXT_MAP[status] || status
}

export function getOrderStatusType(status) {
  return ORDER_STATUS_TYPE_MAP[status] || ''
}

export function getOrderStatusText(status) {
  return ORDER_STATUS_TEXT_MAP[status] || status
}

export function getQualificationStatusType(status) {
  return QUALIFICATION_STATUS_TYPE_MAP[status] || 'info'
}

export function getQualificationStatusText(status) {
  return QUALIFICATION_STATUS_TEXT_MAP[status] || status || '未认证'
}
