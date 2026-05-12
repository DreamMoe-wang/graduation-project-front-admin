import request from '@/utils/request'

export function reverseGeocodeLocation(params, config = {}) {
  return request({
    ...config,
    url: '/location/reverse-geocode',
    method: 'get',
    params
  })
}

export function locateByIp(config = {}) {
  return request({
    ...config,
    url: '/location/ip',
    method: 'get'
  })
}

export function getLocationConfig(config = {}) {
  return request({
    ...config,
    url: '/location/config',
    method: 'get'
  })
}
