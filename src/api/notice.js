import request from '@/utils/request'

function normalizePageQuery(params = {}) {
  const normalized = { ...params }

  if (normalized.pageNum == null && normalized.currentPage != null) {
    normalized.pageNum = normalized.currentPage
  }

  delete normalized.currentPage

  return normalized
}

export function getNoticePage(params, config = {}) {
  return request({
    ...config,
    url: '/notice/page',
    method: 'get',
    params: normalizePageQuery(params)
  })
}

export function getNoticeDetail(id) {
  return request({
    url: `/notice/${id}`,
    method: 'get'
  })
}

export function getPublicNoticePage(params, config = {}) {
  return request({
    ...config,
    url: '/notice/public/page',
    method: 'get',
    params: normalizePageQuery(params)
  })
}

export function getPublicNoticeDetail(id, config = {}) {
  return request({
    ...config,
    url: `/notice/public/${id}`,
    method: 'get'
  })
}

export function createNotice(data = {}) {
  return request({
    url: '/notice',
    method: 'post',
    data
  })
}

export function updateNotice(id, data = {}) {
  return request({
    url: `/notice/${id}`,
    method: 'put',
    data
  })
}

export function deleteNotice(id) {
  return request({
    url: `/notice/${id}`,
    method: 'delete'
  })
}
