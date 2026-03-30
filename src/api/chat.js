import request from '@/utils/request'

export function getChatSessions(params) {
  return request({
    url: '/chat/sessions',
    method: 'get',
    params
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
