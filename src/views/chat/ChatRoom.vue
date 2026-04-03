<template>
    <div class="chat-room">
        <el-card class="chat-card">
            <div class="chat-container">
                <div class="chat-sidebar">
                    <div class="search-box">
                        <el-input
                            v-model="searchKeyword"
                            placeholder="搜索聊天记录"
                            :prefix-icon="Search"
                            size="default"
                            clearable
                        />
                    </div>

                    <div class="session-list" v-loading="loadingSessions" @scroll="closeSessionMenu">
                        <template v-if="sessionList.length">
                            <div
                                v-for="item in sessionList"
                                :key="item.id"
                                class="session-item"
                                :class="{ active: currentSessionId === item.id }"
                                @click="selectSession(item)"
                                @contextmenu.prevent="openSessionMenu($event, item)"
                            >
                                <el-avatar :size="48" :src="item.avatar" class="avatar">
                                    {{ getDisplayInitial(item.name) }}
                                </el-avatar>
                                <div class="session-info">
                                    <div class="session-header">
                                        <div class="session-title-row">
                                            <span class="session-name">{{ item.name }}</span>
                                            <el-tag
                                                v-if="item.tradeTitle || item.tradeId"
                                                size="small"
                                                type="info"
                                                effect="plain"
                                                class="session-trade-tag"
                                            >
                                                {{ item.tradeTitle || `交易#${item.tradeId}` }}
                                            </el-tag>
                                        </div>
                                        <span class="session-time">{{ item.time }}</span>
                                    </div>
                                    <div class="session-last-msg">{{ item.lastMessage }}</div>
                                </div>
                                <el-badge
                                    v-if="item.unread > 0"
                                    :value="item.unread"
                                    :hidden="item.unread === 0"
                                    class="unread-badge"
                                />
                            </div>
                        </template>
                        <el-empty v-else description="暂无会话" />
                    </div>

                    <div
                        v-if="sessionMenuVisible"
                        class="session-context-menu"
                        :style="sessionMenuStyle"
                    >
                        <button
                            class="session-context-action"
                            type="button"
                            :disabled="deletingSession"
                            @click.stop="handleDeleteSession"
                        >
                            {{ deletingSession ? '删除中...' : '删除会话' }}
                        </button>
                    </div>
                </div>

                <div class="chat-main">
                    <div v-if="currentSession" class="chat-content">
                        <div class="chat-header">
                            <div class="chat-user-info">
                                <el-avatar :size="40" :src="currentSession.avatar">
                                    {{ getDisplayInitial(currentSession.name) }}
                                </el-avatar>
                                <div class="user-detail">
                                    <div class="user-name">{{ currentSession.name }}</div>
                                    <div class="user-status">在线</div>
                                </div>
                            </div>
                            <div class="chat-actions">
                                <el-button circle @click="refreshCurrentSession">
                                    <el-icon>
                                        <RefreshRight />
                                    </el-icon>
                                </el-button>
                            </div>
                        </div>

                        <div class="message-list" ref="messageListRef" v-loading="loadingMessages">
                            <template v-if="messageList.length">
                                <div v-for="msg in messageList" :key="msg.id" class="message-item" :class="msg.type">
                                    <el-avatar
                                        v-if="msg.type === 'received'"
                                        :size="36"
                                        :src="currentSession.avatar"
                                        class="message-avatar"
                                    >
                                        {{ getDisplayInitial(currentSession.name) }}
                                    </el-avatar>
                                    <div class="message-body">
                                        <div class="message-sender" v-if="msg.type === 'received'">
                                            {{ currentSession.name }}
                                        </div>
                                        <div class="message-bubble">
                                            {{ msg.content }}
                                        </div>
                                        <div class="message-time">{{ msg.time }}</div>
                                    </div>
                                    <el-avatar v-if="msg.type === 'sent'" :size="36" class="message-avatar">
                                        我
                                    </el-avatar>
                                </div>
                            </template>
                            <el-empty v-else description="暂无聊天记录" />
                        </div>

                        <div class="input-area">
                            <el-input
                                v-model="messageInput"
                                type="textarea"
                                :rows="3"
                                placeholder="输入消息..."
                                @keydown.enter.exact.prevent="sendMessage"
                            />
                            <div class="input-actions">
                                <div class="left-actions">
                                    <el-button text @click="showPlaceholderMessage('图片')">
                                        <el-icon>
                                            <Picture />
                                        </el-icon>
                                    </el-button>
                                    <el-button text @click="showPlaceholderMessage('文件')">
                                        <el-icon>
                                            <FolderOpened />
                                        </el-icon>
                                    </el-button>
                                </div>
                                <el-button type="primary" :loading="sending" @click="sendMessage">发送</el-button>
                            </div>
                        </div>
                    </div>
                    <el-empty v-else description="请选择一个会话开始聊天" />
                </div>
            </div>
        </el-card>
    </div>
</template>

<script>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { FolderOpened, Picture, RefreshRight, Search } from '@element-plus/icons-vue'
import { getToken } from '@/utils/auth'
import { useChatStore } from '@/stores/chat'

export default {
    name: 'ChatRoom',
    components: {
        Search,
        RefreshRight,
        Picture,
        FolderOpened
    },
    setup() {
        const store = useChatStore()
        const route = useRoute()
        const messageListRef = ref(null)
        const {
            searchKeyword,
            currentSessionId,
            messageInput,
            sessionList,
            messageList,
            loadingSessions,
            loadingMessages,
            sending: storeSending,
            currentSession
        } = storeToRefs(store)

        const wsSending = ref(false)
        const wsConnected = ref(false)
        const sending = computed(() => storeSending.value || wsSending.value)
        const pendingAcks = new Map()

        const sessionMenuVisible = ref(false)
        const sessionMenuPosition = ref({ x: 0, y: 0 })
        const sessionMenuTarget = ref(null)
        const deletingSession = ref(false)
        const sessionMenuStyle = computed(() => ({
            left: `${sessionMenuPosition.value.x}px`,
            top: `${sessionMenuPosition.value.y}px`
        }))

        let searchTimer = null
        let reconnectTimer = null
        let heartbeatTimer = null
        let reconnectAttempts = 0
        let manualClose = false
        let chatSocket = null

        const closeSessionMenu = () => {
            sessionMenuVisible.value = false
            sessionMenuTarget.value = null
        }

        const openSessionMenu = (event, item) => {
            if (!item) return

            const menuWidth = 148
            const menuHeight = 44
            const viewportWidth = window.innerWidth || 0
            const viewportHeight = window.innerHeight || 0

            sessionMenuPosition.value = {
                x: Math.min(event.clientX, Math.max(0, viewportWidth - menuWidth - 8)),
                y: Math.min(event.clientY, Math.max(0, viewportHeight - menuHeight - 8))
            }
            sessionMenuTarget.value = item
            sessionMenuVisible.value = true
        }

        const handleDeleteSession = async () => {
            const target = sessionMenuTarget.value
            if (!target || deletingSession.value) return

            try {
                await ElMessageBox.confirm(
                    `确定删除与“${target.name}”的会话吗？`,
                    '提示',
                    {
                        confirmButtonText: '确定',
                        cancelButtonText: '取消',
                        type: 'warning'
                    }
                )

                deletingSession.value = true
                await store.deleteSession(target.id)
                ElMessage.success('会话已删除')
            } catch (error) {
                if (error !== 'cancel' && error !== 'close') {
                    console.error('Delete chat session failed:', error)
                }
            } finally {
                deletingSession.value = false
                closeSessionMenu()
            }
        }

        const handleGlobalClick = event => {
            if (!sessionMenuVisible.value) return
            const contextMenu = event.target?.closest?.('.session-context-menu')
            if (!contextMenu) {
                closeSessionMenu()
            }
        }

        const scrollToBottom = () => {
            const container = messageListRef.value

            if (container) {
                container.scrollTop = container.scrollHeight
            }
        }

        const getDisplayInitial = name => (name ? name.charAt(0) : '?')

        const buildChatSocketUrl = () => {
            if (typeof window === 'undefined') return ''

            const token = getToken()
            if (!token) return ''

            const configuredBase = process.env.VUE_APP_BASE_API
                || (process.env.NODE_ENV === 'development' ? 'http://localhost:9090/api' : '/api')
            const httpBase = configuredBase.startsWith('http')
                ? configuredBase
                : `${window.location.origin}${configuredBase}`
            const wsBase = httpBase.replace(/^http/i, 'ws').replace(/\/$/, '')

            return `${wsBase}/ws/chat?token=${encodeURIComponent(token)}`
        }

        const settlePendingAck = (clientMessageId, success) => {
            if (!clientMessageId) return

            const pending = pendingAcks.get(clientMessageId)
            if (!pending) return

            clearTimeout(pending.timeout)
            pending.resolve(success)
            pendingAcks.delete(clientMessageId)
        }

        const clearPendingAcks = success => {
            pendingAcks.forEach(item => {
                clearTimeout(item.timeout)
                item.resolve(success)
            })
            pendingAcks.clear()
        }

        const stopHeartbeat = () => {
            if (heartbeatTimer) {
                clearInterval(heartbeatTimer)
                heartbeatTimer = null
            }
        }

        const startHeartbeat = () => {
            stopHeartbeat()
            heartbeatTimer = setInterval(() => {
                if (!chatSocket || chatSocket.readyState !== WebSocket.OPEN) return
                chatSocket.send(JSON.stringify({ type: 'ping' }))
            }, 25000)
        }

        const scheduleReconnect = () => {
            if (manualClose) return

            if (reconnectTimer) {
                clearTimeout(reconnectTimer)
            }

            const delay = Math.min(15000, 1000 * Math.pow(2, reconnectAttempts))
            reconnectAttempts += 1
            reconnectTimer = setTimeout(() => {
                connectWebSocket()
            }, delay)
        }

        const handleRealtimeUpdate = async sessionId => {
            try {
                const tasks = [store.fetchSessions(true, { silent: true })]
                if (currentSessionId.value && Number(currentSessionId.value) === Number(sessionId)) {
                    tasks.push(store.fetchMessages(currentSessionId.value))
                }
                await Promise.all(tasks)
            } catch (error) {
                console.error('Realtime chat refresh failed:', error)
            }
        }

        const handleSocketMessage = payload => {
            let data = null
            try {
                data = JSON.parse(payload)
            } catch (error) {
                return
            }

            const type = data?.type
            const clientMessageId = data?.clientMessageId

            if (type === 'send_ack') {
                settlePendingAck(clientMessageId, true)
                return
            }

            if (type === 'error') {
                settlePendingAck(clientMessageId, false)
                ElMessage.error(data?.message || '消息发送失败')
                return
            }

            if (type === 'session_updated') {
                handleRealtimeUpdate(data?.sessionId)
            }
        }

        const connectWebSocket = () => {
            if (typeof window === 'undefined') return

            if (chatSocket && (chatSocket.readyState === WebSocket.OPEN || chatSocket.readyState === WebSocket.CONNECTING)) {
                return
            }

            const wsUrl = buildChatSocketUrl()
            if (!wsUrl) return

            const socket = new WebSocket(wsUrl)
            chatSocket = socket

            socket.onopen = () => {
                wsConnected.value = true
                reconnectAttempts = 0
                startHeartbeat()
            }

            socket.onmessage = event => {
                handleSocketMessage(event.data)
            }

            socket.onclose = () => {
                wsConnected.value = false
                stopHeartbeat()
                clearPendingAcks(false)
                if (chatSocket === socket) {
                    chatSocket = null
                }
                scheduleReconnect()
            }

            socket.onerror = () => {
                // close event will handle reconnect
            }
        }

        const disconnectWebSocket = () => {
            manualClose = true
            wsConnected.value = false
            stopHeartbeat()
            clearPendingAcks(false)

            if (reconnectTimer) {
                clearTimeout(reconnectTimer)
                reconnectTimer = null
            }

            if (chatSocket) {
                try {
                    chatSocket.close()
                } catch (error) {
                    console.error('Close chat websocket failed:', error)
                } finally {
                    chatSocket = null
                }
            }
        }

        const sendByWebSocket = async (sessionId, content) => {
            if (!chatSocket || chatSocket.readyState !== WebSocket.OPEN || !wsConnected.value) {
                return false
            }

            const clientMessageId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
            const ackPromise = new Promise(resolve => {
                const timeout = setTimeout(() => {
                    pendingAcks.delete(clientMessageId)
                    resolve(false)
                }, 6000)
                pendingAcks.set(clientMessageId, { resolve, timeout })
            })

            try {
                chatSocket.send(JSON.stringify({
                    type: 'send',
                    sessionId,
                    content,
                    clientMessageId
                }))
            } catch (error) {
                settlePendingAck(clientMessageId, false)
                return false
            }

            return ackPromise
        }

        const fetchSessions = async preserveSelection => {
            try {
                await store.fetchSessions(preserveSelection)
            } catch (error) {
                console.error('Fetch chat sessions failed:', error)
            }
        }

        const selectSession = async session => {
            closeSessionMenu()
            try {
                await store.selectSession(session)
            } catch (error) {
                console.error('Switch chat session failed:', error)
            }
        }

        const sendMessage = async () => {
            const content = (messageInput.value || '').trim()
            const sessionId = currentSessionId.value
            if (!content || !sessionId) return

            wsSending.value = true
            try {
                const canUseWs = chatSocket && chatSocket.readyState === WebSocket.OPEN && wsConnected.value
                if (canUseWs) {
                    const sentByWs = await sendByWebSocket(sessionId, content)
                    if (sentByWs) {
                        messageInput.value = ''
                        await handleRealtimeUpdate(sessionId)
                    } else {
                        ElMessage.error('实时发送失败，请重试')
                    }
                    return
                }

                await store.sendCurrentMessage()
            } catch (error) {
                console.error('Send chat message failed:', error)
            } finally {
                wsSending.value = false
            }
        }

        const refreshCurrentSession = async () => {
            try {
                await store.refreshCurrentSession()
            } catch (error) {
                console.error('Refresh chat session failed:', error)
            }
        }

        const scheduleSessionSearch = () => {
            if (searchTimer) {
                clearTimeout(searchTimer)
            }

            searchTimer = setTimeout(() => {
                fetchSessions(true)
            }, 300)
        }

        const showPlaceholderMessage = type => {
            ElMessage.info(`${type}消息功能暂未接入后端接口`)
        }

        watch(searchKeyword, () => {
            scheduleSessionSearch()
        })

        watch(
            messageList,
            () => {
                nextTick(() => {
                    scrollToBottom()
                })
            },
            { deep: true }
        )

        onMounted(() => {
            manualClose = false
            connectWebSocket()
            window.addEventListener('click', handleGlobalClick)
            window.addEventListener('resize', closeSessionMenu)

            const tradeId = route.query.tradeId
            if (tradeId) {
                store.openTradeSessionByTradeId(tradeId).catch(error => {
                    console.error('Open trade chat session failed:', error)
                })
                return
            }

            fetchSessions(false)
        })

        watch(
            () => route.query.tradeId,
            async tradeId => {
                if (!tradeId) return

                try {
                    await store.openTradeSessionByTradeId(tradeId)
                } catch (error) {
                    console.error('Open trade chat session failed:', error)
                }
            }
        )

        onBeforeUnmount(() => {
            if (searchTimer) {
                clearTimeout(searchTimer)
                searchTimer = null
            }
            window.removeEventListener('click', handleGlobalClick)
            window.removeEventListener('resize', closeSessionMenu)
            disconnectWebSocket()
        })

        return {
            messageListRef,
            searchKeyword,
            currentSessionId,
            messageInput,
            sessionList,
            messageList,
            loadingSessions,
            loadingMessages,
            sending,
            wsConnected,
            currentSession,
            sessionMenuVisible,
            sessionMenuStyle,
            deletingSession,
            closeSessionMenu,
            openSessionMenu,
            handleDeleteSession,
            selectSession,
            sendMessage,
            refreshCurrentSession,
            getDisplayInitial,
            showPlaceholderMessage
        }
    }
}
</script>

<style scoped>
.chat-room {
    padding: 20px;
}

.chat-card {
    height: calc(100vh - 220px);
}

.chat-container {
    display: flex;
    height: 100%;
}

.chat-sidebar {
    width: 320px;
    border-right: 1px solid #eee;
    display: flex;
    flex-direction: column;
    position: relative;
}

.search-box {
    padding: 16px;
    border-bottom: 1px solid #eee;
}

.session-list {
    flex: 1;
    overflow-y: auto;
}

.session-item {
    display: flex;
    align-items: flex-start;
    padding: 16px;
    cursor: pointer;
    transition: background 0.3s;
    position: relative;
}

.session-item:hover {
    background: #f5f5f5;
}

.session-item.active {
    background: #e6f7ff;
}

.avatar {
    margin-right: 12px;
    flex-shrink: 0;
}

.session-info {
    flex: 1;
    min-width: 0;
}

.session-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
    gap: 8px;
}

.session-title-row {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
}

.session-name {
    font-weight: 500;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.session-trade-tag {
    flex-shrink: 0;
}

.session-time {
    font-size: 12px;
    color: #999;
    flex-shrink: 0;
}

.session-last-msg {
    font-size: 13px;
    color: #666;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.unread-badge {
    position: absolute;
    top: 16px;
    right: 16px;
}

.session-context-menu {
    position: fixed;
    z-index: 3000;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 6px;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.18);
}

.session-context-action {
    min-width: 132px;
    padding: 8px 12px;
    border: none;
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    text-align: left;
    color: #ef4444;
    font-size: 13px;
}

.session-context-action:hover {
    background: #fef2f2;
}

.session-context-action:disabled {
    color: #9ca3af;
    cursor: not-allowed;
}

.chat-main {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.chat-content {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #eee;
}

.chat-user-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.user-name {
    font-weight: 500;
    color: #333;
}

.user-status {
    font-size: 12px;
    color: #67c23a;
}

.message-list {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    background: #f5f5f5;
}

.message-item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 16px;
}

.message-item.sent {
    flex-direction: row-reverse;
}

.message-item.sent .message-body {
    align-items: flex-end;
}

.message-avatar {
    flex-shrink: 0;
}

.message-body {
    max-width: 60%;
    display: flex;
    flex-direction: column;
    margin: 0 12px;
}

.message-sender {
    font-size: 12px;
    color: #999;
    margin-bottom: 4px;
}

.message-bubble {
    background: white;
    padding: 12px 16px;
    border-radius: 8px;
    word-wrap: break-word;
}

.message-item.sent .message-bubble {
    background: #409eff;
    color: white;
}

.message-time {
    font-size: 11px;
    color: #999;
    margin-top: 4px;
}

.input-area {
    border-top: 1px solid #eee;
    padding: 16px 20px;
    background: white;
}

.input-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
}

.left-actions {
    display: flex;
    gap: 8px;
}
</style>
