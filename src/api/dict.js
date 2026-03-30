import request from '@/utils/request'

function normalizePageQuery(params = {}) {
  const normalized = { ...params }

  if (normalized.pageNum == null && normalized.currentPage != null) {
    normalized.pageNum = normalized.currentPage
  }

  delete normalized.currentPage

  return normalized
}

export function getDictPage(params) {
  return request({
    url: '/dict/page',
    method: 'get',
    params: normalizePageQuery(params)
  })
}

export function getDictDetail(id) {
  return request({
    url: `/dict/${id}`,
    method: 'get'
  })
}

export function createDict(data = {}) {
  return request({
    url: '/dict',
    method: 'post',
    data
  })
}

export function updateDict(id, data = {}) {
  return request({
    url: `/dict/${id}`,
    method: 'put',
    data
  })
}

export function deleteDict(id) {
  return request({
    url: `/dict/${id}`,
    method: 'delete'
  })
}
