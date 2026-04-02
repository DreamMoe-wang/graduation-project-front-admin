import request from '@/utils/request'

function normalizeTradeQuery(params = {}) {
  const normalized = { ...params }

  if (normalized.pageNum == null && normalized.currentPage != null) {
    normalized.pageNum = normalized.currentPage
  }

  if (Array.isArray(normalized.dateRange)) {
    const [startDate, endDate] = normalized.dateRange
    normalized.startDate = startDate
    normalized.endDate = endDate
    delete normalized.dateRange
  }

  delete normalized.currentPage

  return normalized
}

export function getTradePublishPage(params) {
  return request({
    url: '/trade/publish/page',
    method: 'get',
    params: normalizeTradeQuery(params)
  })
}

export function getTradePublishDetail(id) {
  return request({
    url: `/trade/publish/${id}`,
    method: 'get'
  })
}

export function createTradePublish(data) {
  return request({
    url: '/trade/publish',
    method: 'post',
    data
  })
}

export function updateTradePublish(id, data) {
  return request({
    url: `/trade/publish/${id}`,
    method: 'put',
    data
  })
}

export function approveTradePublish(id, data = {}) {
  return request({
    url: `/trade/publish/${id}/approve`,
    method: 'post',
    data
  })
}

export function rejectTradePublish(id, data = {}) {
  return request({
    url: `/trade/publish/${id}/reject`,
    method: 'post',
    data
  })
}

export function deleteTradePublish(id) {
  return request({
    url: `/trade/publish/${id}`,
    method: 'delete'
  })
}
