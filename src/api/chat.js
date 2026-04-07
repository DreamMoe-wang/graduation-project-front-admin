import request from '@/utils/request'

export function getChatSessions(params, config = {}) {
  return request({
    ...config,
    url: '/chat/sessions',
    method: 'get',
    params
  })
}

export function openTradeChatSession(tradeId) {
  return request({
    url: `/chat/trade/${tradeId}/session`,
    method: 'post'
  })
}

export function openOrderChatSession(orderId) {
  return request({
    url: `/chat/order/${orderId}/session`,
    method: 'post'
  })
}

export function getChatMessages(sessionId) {
  return request({
    url: `/chat/sessions/${sessionId}/messages`,
    method: 'get'
  })
}

export function sendChatMessage(sessionId, data) {
  return request({
    url: `/chat/sessions/${sessionId}/messages`,
    method: 'post',
    data
  })
}

export function markChatSessionRead(sessionId) {
  return request({
    url: `/chat/sessions/${sessionId}/read`,
    method: 'post'
  })
}

export function deleteChatSession(sessionId) {
  return request({
    url: `/chat/sessions/${sessionId}`,
    method: 'delete'
  })
}
