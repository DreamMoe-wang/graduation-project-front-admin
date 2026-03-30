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

export function getTradeListPage(params) {
  return request({
    url: '/trade/list/page',
    method: 'get',
    params: normalizeTradeQuery(params)
  })
}

export function getTradeListDetail(id) {
  return request({
    url: `/trade/list/${id}`,
    method: 'get'
  })
}

export function exportTradeList(params) {
  return request({
    url: '/trade/list/export',
    method: 'get',
    params: normalizeTradeQuery(params)
  })
}
