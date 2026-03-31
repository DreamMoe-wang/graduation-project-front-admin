import { defineStore } from 'pinia'
import {
  getChatMessages,
  getChatSessions,
  markChatSessionRead,
  sendChatMessage
} from '@/api/chat'

export const useChatStore = defineStore('chat', {
  state: () => ({
    searchKeyword: '',
    currentSessionId: null,
    messageInput: '',
    sessionList: [],
    messageList: [],
    loadingSessions: false,
    loadingMessages: false,
    sending: false
  }),
  getters: {
    currentSession(state) {
      return state.sessionList.find(item => item.id === state.currentSessionId) || null
    }
  },
  actions: {
    setSearchKeyword(keyword) {
      this.searchKeyword = keyword
    },
    setMessageInput(value) {
      this.messageInput = value
    },
    async fetchSessions(preserveSelection = true) {
      this.loadingSessions = true

      try {
        const keyword = this.searchKeyword.trim()
        const sessions = await getChatSessions(keyword ? { keyword } : {})
        this.sessionList = Array.isArray(sessions) ? sessions : []

        if (!this.sessionList.length) {
          this.currentSessionId = null
          this.messageList = []
          return
        }

        const hasCurrentSession = preserveSelection
          && this.currentSessionId != null
          && this.sessionList.some(item => item.id === this.currentSessionId)

        if (!hasCurrentSession) {
          await this.selectSession(this.sessionList[0])
        }
      } catch (error) {
        this.sessionList = []
        this.currentSessionId = null
        this.messageList = []
        throw error
      } finally {
        this.loadingSessions = false
      }
    },
    async selectSession(session) {
      if (!session) return

      this.currentSessionId = session.id

      if (session.unread > 0) {
        await markChatSessionRead(session.id)
        session.unread = 0
      }

      await this.fetchMessages(session.id)
    },
    async fetchMessages(sessionId = this.currentSessionId) {
      if (!sessionId) return

      this.loadingMessages = true

      try {
        const messages = await getChatMessages(sessionId)
        this.messageList = Array.isArray(messages) ? messages : []
      } catch (error) {
        this.messageList = []
        throw error
      } finally {
        this.loadingMessages = false
      }
    },
    async sendCurrentMessage() {
      const content = this.messageInput.trim()

      if (!content || !this.currentSessionId) return false

      this.sending = true

      try {
        await sendChatMessage(this.currentSessionId, { content })
        this.messageInput = ''

        await Promise.all([
          this.fetchMessages(this.currentSessionId),
          this.fetchSessions(true)
        ])

        return true
      } finally {
        this.sending = false
      }
    },
    async refreshCurrentSession() {
      if (!this.currentSessionId) return

      await Promise.all([
        this.fetchMessages(this.currentSessionId),
        this.fetchSessions(true)
      ])
    }
  }
})
