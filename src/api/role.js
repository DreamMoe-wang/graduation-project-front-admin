import request from '@/utils/request'

function normalizePageQuery(params = {}) {
  const normalized = { ...params }

  if (normalized.pageNum == null && normalized.currentPage != null) {
    normalized.pageNum = normalized.currentPage
  }

  delete normalized.currentPage

  return normalized
}

export function getRolePage(params, config = {}) {
  return request({
    ...config,
    url: '/role/page',
    method: 'get',
    params: normalizePageQuery(params)
  })
}

export function getRoleDetail(id, config = {}) {
  return request({
    ...config,
    url: `/role/${id}`,
    method: 'get'
  })
}

export function createRole(data = {}, config = {}) {
  return request({
    ...config,
    url: '/role',
    method: 'post',
    data
  })
}

export function updateRole(id, data = {}, config = {}) {
  return request({
    ...config,
    url: `/role/${id}`,
    method: 'put',
    data
  })
}

export function deleteRole(id, config = {}) {
  return request({
    ...config,
    url: `/role/${id}`,
    method: 'delete'
  })
}
