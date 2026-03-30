import request from '@/utils/request'

function normalizePageQuery(params = {}) {
  const normalized = { ...params }

  if (normalized.pageNum == null && normalized.currentPage != null) {
    normalized.pageNum = normalized.currentPage
  }

  delete normalized.currentPage

  return normalized
}

export function getLogPage(params) {
  return request({
    url: '/log/page',
    method: 'get',
    params: normalizePageQuery(params)
  })
}

export function getLogDetail(id) {
  return request({
    url: `/log/${id}`,
    method: 'get'
  })
}

export function deleteLog(id) {
  return request({
    url: `/log/${id}`,
    method: 'delete'
  })
}

export function cleanLog() {
  return request({
    url: '/log/clean',
    method: 'delete'
  })
}
