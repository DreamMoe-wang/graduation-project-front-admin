import request from '@/utils/request'

function normalizePageQuery(params = {}) {
  const normalized = { ...params }

  if (normalized.pageNum == null && normalized.currentPage != null) {
    normalized.pageNum = normalized.currentPage
  }

  delete normalized.currentPage

  return normalized
}

export function getRolePage(params) {
  return request({
    url: '/role/page',
    method: 'get',
    params: normalizePageQuery(params)
  })
}

export function getRoleDetail(id) {
  return request({
    url: `/role/${id}`,
    method: 'get'
  })
}

export function createRole(data = {}) {
  return request({
    url: '/role',
    method: 'post',
    data
  })
}

export function updateRole(id, data = {}) {
  return request({
    url: `/role/${id}`,
    method: 'put',
    data
  })
}

export function deleteRole(id) {
  return request({
    url: `/role/${id}`,
    method: 'delete'
  })
}
