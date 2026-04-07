import request from '@/utils/request'

function normalizePageQuery(params = {}) {
  const normalized = { ...params }

  if (normalized.pageNum == null && normalized.currentPage != null) {
    normalized.pageNum = normalized.currentPage
  }

  delete normalized.currentPage

  return normalized
}

export function getMenuPage(params) {
  return request({
    url: '/menu/page',
    method: 'get',
    params: normalizePageQuery(params)
  })
}

export function getMenuTree(config = {}) {
  return request({
    ...config,
    url: '/menu/tree',
    method: 'get'
  })
}

export function getMenuDetail(id) {
  return request({
    url: `/menu/${id}`,
    method: 'get'
  })
}

export function createMenu(data = {}) {
  return request({
    url: '/menu',
    method: 'post',
    data
  })
}

export function updateMenu(id, data = {}) {
  return request({
    url: `/menu/${id}`,
    method: 'put',
    data
  })
}

export function deleteMenu(id) {
  return request({
    url: `/menu/${id}`,
    method: 'delete'
  })
}
