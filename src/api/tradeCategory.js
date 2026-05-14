import request from '@/utils/request'

export function getTradeCategoryList() {
  return request({
    url: '/trade/categories',
    method: 'get'
  })
}

export function getTradeCategoryManageList() {
  return request({
    url: '/trade/category/manage',
    method: 'get'
  })
}

export function createTradeCategory(data = {}) {
  return request({
    url: '/trade/category/manage',
    method: 'post',
    data
  })
}

export function updateTradeCategory(id, data = {}) {
  return request({
    url: `/trade/category/manage/${id}`,
    method: 'put',
    data
  })
}

export function deleteTradeCategory(id) {
  return request({
    url: `/trade/category/manage/${id}`,
    method: 'delete'
  })
}
