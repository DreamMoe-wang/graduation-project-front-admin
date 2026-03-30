import request from '@/utils/request'

export function getSettingDetail() {
  return request({
    url: '/setting/detail',
    method: 'get'
  })
}

export function updateSettingDetail(data) {
  return request({
    url: '/setting/detail',
    method: 'put',
    data
  })
}
