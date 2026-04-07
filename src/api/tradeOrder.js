import request from '@/utils/request'

function normalizeOrderQuery(params = {}) {
  const normalized = { ...params }

  if (normalized.pageNum == null && normalized.currentPage != null) {
    normalized.pageNum = normalized.currentPage
  }

  delete normalized.currentPage

  return normalized
}

export function getTradeOrderStats() {
  return request({
    url: '/trade/order/stats',
    method: 'get'
  })
}

export function getTradeOrderPage(params) {
  return request({
    url: '/trade/order/page',
    method: 'get',
    params: normalizeOrderQuery(params)
  })
}

export function getTradeOrderDetail(id) {
  return request({
    url: `/trade/order/${id}`,
    method: 'get'
  })
}

export function receiveTradeOrder(id) {
  return request({
    url: `/trade/order/${id}/receive`,
    method: 'post'
  })
}

export function completeTradeOrder(id) {
  return request({
    url: `/trade/order/${id}/complete`,
    method: 'post'
  })
}

export function payTradeOrder(id) {
  return request({
    url: `/trade/order/${id}/pay`,
    method: 'post'
  })
}

export function cancelTradeOrder(id) {
  return request({
    url: `/trade/order/${id}/cancel`,
    method: 'post'
  })
}
