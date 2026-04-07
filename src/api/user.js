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

export function getUserDetail(id, config = {}) {
  return request({
    ...config,
    url: `/user/${id}`,
    method: 'get'
  })
}

export function getCurrentUserProfile() {
  return request({
    url: '/user/profile/current',
    method: 'get'
  })
}

export function updateCurrentUserProfile(data) {
  return request({
    url: '/user/profile/current',
    method: 'put',
    data
  })
}

export function getUserPage(params, config = {}) {
  return request({
    ...config,
    url: '/user/page',
    method: 'get',
    params: normalizePageQuery(params)
  })
}

export function getUserList(config = {}) {
  return request({
    ...config,
    url: '/user/list',
    method: 'get'
  })
}

export function createUser(data, config = {}) {
  return request({
    ...config,
    url: '/user',
    method: 'post',
    data
  })
}

export function updateUser(id, data, config = {}) {
  return request({
    ...config,
    url: `/user/${id}`,
    method: 'put',
    data
  })
}

export function deleteUser(id, config = {}) {
  return request({
    ...config,
    url: `/user/${id}`,
    method: 'delete'
  })
}
