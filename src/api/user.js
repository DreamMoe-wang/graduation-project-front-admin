import request from '@/utils/request'

function normalizePageQuery(params = {}) {
  const normalized = { ...params }

  if (normalized.pageNum == null && normalized.currentPage != null) {
    normalized.pageNum = normalized.currentPage
  }

  delete normalized.currentPage

  return normalized
}

export function loginUser(data = {}) {
  const { username, password } = data
  const formData = new URLSearchParams()

  formData.append('username', username || '')
  formData.append('password', password || '')

  return request({
    url: '/user/login',
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: formData
  })
}

export function getUserDetail(id) {
  return request({
    url: `/user/${id}`,
    method: 'get'
  })
}

export function getUserPage(params) {
  return request({
    url: '/user/page',
    method: 'get',
    params: normalizePageQuery(params)
  })
}

export function getUserList() {
  return request({
    url: '/user/list',
    method: 'get'
  })
}

export function createUser(data) {
  return request({
    url: '/user',
    method: 'post',
    data
  })
}

export function updateUser(id, data) {
  return request({
    url: `/user/${id}`,
    method: 'put',
    data
  })
}

export function deleteUser(id) {
  return request({
    url: `/user/${id}`,
    method: 'delete'
  })
}
