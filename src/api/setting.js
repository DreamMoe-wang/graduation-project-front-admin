import request from '@/utils/request'

export function getSettingDetail(config = {}) {
  return request({
    ...config,
    url: '/setting/detail',
    method: 'get'
  })
}

export function updateSettingDetail(data, config = {}) {
  return request({
    ...config,
    url: '/setting/detail',
    method: 'put',
    data
  })
}
