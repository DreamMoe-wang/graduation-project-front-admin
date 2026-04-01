import request from '@/utils/request'

export function loginAuth(data) {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  })
}

export function getCurrentUser() {
  return request({
    url: '/auth/me',
    method: 'get'
  })
}

export function getCurrentMenus() {
  return request({
    url: '/auth/menus',
    method: 'get'
  })
}
