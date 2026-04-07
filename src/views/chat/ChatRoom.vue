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
                                    <el-avatar v-if="msg.type === 'sent'" :size="36" :src="myAvatar" class="message-avatar">
                                        {{ getDisplayInitial(myDisplayName) }}
                                    </el-avatar>
                                </div>
                            </template>
                            <el-empty v-else description="暂无聊天记录" />
                        </div>

                        <div class="input-area">
                            <div class="composer-panel" :class="{ resizing: resizingEditor }" :style="{ '--editor-height': `${editorHeight}px` }">
                                <el-input
                                    v-model="messageInput"
                                    type="textarea"
                                    :rows="4"
                                    resize="none"
                                    placeholder="输入消息..."
                                    class="composer-editor"
                                    @keydown.enter.exact.prevent="sendMessage"
                                />
                                <div class="composer-resizer" @mousedown.prevent="startResizeEditor">
                                    <span class="resizer-grip" />
                                </div>

                                <div class="composer-footer">
                                    <div class="toolbar-left">
                                        <el-button text class="tool-btn" @click="showPlaceholderMessage('表情')">
                                            <el-icon><Sunny /></el-icon>
                                        </el-button>
                                        <el-button text class="tool-btn" @click="showPlaceholderMessage('图片')">
                                            <el-icon><Picture /></el-icon>
                                        </el-button>
                                        <el-button text class="tool-btn" @click="showPlaceholderMessage('文件')">
                                            <el-icon><FolderOpened /></el-icon>
                                        </el-button>
                                    </div>

                                    <div class="input-actions">
                                        <el-button class="close-btn" @click="messageInput = ''">关闭</el-button>
                                        <div class="send-wrap">
                                            <el-button type="primary" :loading="sending" :disabled="!canSend" @click="sendMessage">
                                                发送
                                            </el-button>
                                            <el-dropdown trigger="click">
                                                <el-button type="primary" class="send-more">
                                                    <el-icon><ArrowDown /></el-icon>
                                                </el-button>
                                                <template #dropdown>
                                                    <el-dropdown-menu>
                                                        <el-dropdown-item @click="showPlaceholderMessage('按 Enter 发送')">
                                                            按 Enter 发送
                                                        </el-dropdown-item>
                                                        <el-dropdown-item @click="showPlaceholderMessage('按 Ctrl+Enter 发送')">
                                                            按 Ctrl+Enter 发送
                                                        </el-dropdown-item>
                                                    </el-dropdown-menu>
                                                </template>
                                            </el-dropdown>
                                        </div>
                                    </div>
                                </div>
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
import {
    ArrowDown,
    FolderOpened,
    Picture,
    RefreshRight,
    Search,
    Sunny
} from '@element-plus/icons-vue'
import { getToken } from '@/utils/auth'
import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'

export default {
    name: 'ChatRoom',
    components: {
        Search,
        RefreshRight,
        Picture,
        FolderOpened,
        Sunny,
        ArrowDown
    },
    setup() {
        const store = useChatStore()
        const authStore = useAuthStore()
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
        const { currentUser, displayName } = storeToRefs(authStore)

        const wsSending = ref(false)
        const wsConnected = ref(false)
        const sending = computed(() => storeSending.value || wsSending.value)
        const canSend = computed(() => Boolean((messageInput.value || '').trim() && currentSessionId.value))
        const myAvatar = computed(() => currentUser.value?.avatar || '')
        const myDisplayName = computed(
            () => displayName.value || currentUser.value?.nickname || currentUser.value?.username || '我'
        )
        const editorHeight = ref(84)
        const resizingEditor = ref(false)
        const resizeStartY = ref(0)
        const resizeStartHeight = ref(84)
        const minEditorHeight = 64
        const maxEditorHeight = 220
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

        const onResizeEditorMove = event => {
            if (!resizingEditor.value) return

            const delta = event.clientY - resizeStartY.value
            const nextHeight = resizeStartHeight.value + delta
            editorHeight.value = Math.min(maxEditorHeight, Math.max(minEditorHeight, nextHeight))
        }

        const stopResizeEditor = () => {
            if (!resizingEditor.value) return

            resizingEditor.value = false
            window.removeEventListener('mousemove', onResizeEditorMove)
            window.removeEventListener('mouseup', stopResizeEditor)
        }

        const startResizeEditor = event => {
            resizingEditor.value = true
            resizeStartY.value = event.clientY
            resizeStartHeight.value = editorHeight.value
            window.addEventListener('mousemove', onResizeEditorMove)
            window.addEventListener('mouseup', stopResizeEditor)
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

        const openSessionFromRoute = async () => {
            const orderId = route.query.orderId
            if (orderId) {
                try {
                    await store.openOrderSessionByOrderId(orderId)
                    return true
                } catch (error) {
                    console.error('Open order chat session failed:', error)
                    return false
                }
            }

            const tradeId = route.query.tradeId
            if (tradeId) {
                try {
                    await store.openTradeSessionByTradeId(tradeId)
                    return true
                } catch (error) {
                    console.error('Open trade chat session failed:', error)
                    return false
                }
            }

            return false
        }

        onMounted(() => {
            manualClose = false
            connectWebSocket()
            window.addEventListener('click', handleGlobalClick)
            window.addEventListener('resize', closeSessionMenu)

            openSessionFromRoute().then(opened => {
                if (!opened) {
                    fetchSessions(false)
                }
            })
        })

        watch(
            () => [route.query.orderId, route.query.tradeId],
            async ([orderId, tradeId], [prevOrderId, prevTradeId]) => {
                if (orderId === prevOrderId && tradeId === prevTradeId) return

                if (orderId) {
                    try {
                        await store.openOrderSessionByOrderId(orderId)
                    } catch (error) {
                        console.error('Open order chat session failed:', error)
                    }
                    return
                }

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
            stopResizeEditor()
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
            canSend,
            wsConnected,
            currentSession,
            myAvatar,
            myDisplayName,
            editorHeight,
            resizingEditor,
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
            showPlaceholderMessage,
            startResizeEditor
        }
    }
}
</script>

<style scoped>
.chat-room {
    height: 100%;
    padding: 0;
    margin: -8px -10px 0 -10px;
}

.chat-card {
    height: calc(100vh - 168px);
    border: none;
    border-radius: 18px;
    overflow: hidden;
    background: var(--app-surface);
    box-shadow: var(--app-card-shadow);
}

.chat-card :deep(.el-card__body) {
    padding: 0;
    height: 100%;
}

.chat-container {
    display: flex;
    height: 100%;
    background: linear-gradient(180deg, var(--app-surface-soft) 0%, var(--app-surface) 100%);
}

.chat-sidebar {
    width: 336px;
    border-right: 1px solid var(--app-border);
    display: flex;
    flex-direction: column;
    position: relative;
    background: linear-gradient(180deg, rgba(var(--app-theme-color-rgb), 0.06) 0%, var(--app-surface) 100%);
}

.search-box {
    padding: 16px 16px 14px;
    border-bottom: 1px solid var(--app-border);
}

.session-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
}

.session-list :deep(.el-empty__description p),
.chat-main :deep(.el-empty__description p) {
    color: var(--app-text-secondary);
}

.session-item {
    display: flex;
    align-items: flex-start;
    padding: 14px 16px;
    margin: 0 8px 6px;
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.24s ease, box-shadow 0.24s ease, transform 0.24s ease;
    position: relative;
}

.session-item:hover {
    background: rgba(var(--app-theme-color-rgb), 0.08);
    transform: translateY(-1px);
}

.session-item.active {
    background: linear-gradient(135deg, rgba(var(--app-theme-color-rgb), 0.18) 0%, rgba(var(--app-theme-color-rgb), 0.1) 100%);
    box-shadow: 0 8px 16px rgba(var(--app-theme-color-rgb), 0.18);
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
    font-weight: 600;
    color: var(--app-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.session-trade-tag {
    flex-shrink: 0;
}

.session-time {
    font-size: 12px;
    color: var(--app-text-secondary);
    flex-shrink: 0;
}

.session-last-msg {
    font-size: 13px;
    color: var(--app-text-secondary);
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
    background: var(--app-surface);
    border: 1px solid var(--app-border);
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
    background: rgba(239, 68, 68, 0.08);
}

.session-context-action:disabled {
    color: #9ca3af;
    cursor: not-allowed;
}

.chat-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--app-surface);
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
    padding: 14px 18px;
    border-bottom: 1px solid var(--app-border);
    background: var(--app-surface);
}

.chat-user-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.user-name {
    font-weight: 600;
    color: var(--app-text);
}

.user-status {
    font-size: 12px;
    color: #22c55e;
}

.message-list {
    flex: 1;
    overflow-y: auto;
    padding: 18px 20px;
    background:
        radial-gradient(circle at 10% 10%, rgba(var(--app-theme-color-rgb), 0.12), transparent 42%),
        radial-gradient(circle at 94% 88%, rgba(var(--app-theme-color-rgb), 0.08), transparent 40%),
        var(--app-surface-soft);
}

.message-item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 18px;
}

.message-item.sent {
    justify-content: flex-end;
}

.message-item.sent .message-body {
    align-items: flex-end;
    margin: 0 12px 0 0;
}

.message-avatar {
    flex-shrink: 0;
    box-shadow: 0 6px 16px rgba(30, 41, 59, 0.14);
}

.message-body {
    max-width: 60%;
    display: flex;
    flex-direction: column;
    margin: 0 0 0 12px;
}

.message-sender {
    font-size: 12px;
    color: var(--app-text-secondary);
    margin-bottom: 4px;
}

.message-bubble {
    background: var(--app-surface);
    padding: 11px 14px;
    border-radius: 14px;
    border: 1px solid var(--app-border);
    box-shadow: 0 6px 18px rgba(30, 41, 59, 0.06);
    word-wrap: break-word;
    line-height: 1.55;
    color: var(--app-text);
}

.message-item.sent .message-bubble {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: #fff;
    border: none;
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.24);
}

.message-item.sent .message-time {
    text-align: right;
}

.message-time {
    font-size: 11px;
    color: var(--app-text-secondary);
    margin-top: 4px;
}

.input-area {
    border-top: none;
    padding: 10px 14px 14px;
    background: transparent;
}

.composer-panel {
    --editor-height: 84px;
    background: var(--app-surface);
    border: 1px solid var(--app-border);
    border-radius: 14px;
    box-shadow: 0 10px 26px rgba(15, 23, 42, 0.12);
    padding: 8px 12px 10px;
}

.composer-panel.resizing {
    user-select: none;
}

.toolbar-left {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
}

.tool-btn {
    color: var(--app-text-secondary);
    padding: 4px 6px;
}

.tool-btn:hover {
    color: var(--app-text);
}

.composer-editor :deep(.el-textarea__inner) {
    height: var(--editor-height) !important;
    min-height: var(--editor-height) !important;
    max-height: var(--editor-height) !important;
    resize: none !important;
    border: none;
    box-shadow: none;
    background: transparent;
    color: var(--app-text);
    padding: 2px 0 8px;
    line-height: 1.6;
    overflow-y: auto;
}

.composer-editor :deep(.el-textarea__inner:focus) {
    box-shadow: none;
}

.composer-resizer {
    height: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: ns-resize;
    margin-top: 1px;
}

.resizer-grip {
    width: 46px;
    height: 4px;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.38);
    transition: background 0.2s ease;
}

.composer-resizer:hover .resizer-grip,
.composer-panel.resizing .resizer-grip {
    background: rgba(148, 163, 184, 0.68);
}

.composer-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
}

.input-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-top: 0;
    gap: 10px;
}

.close-btn {
    min-width: 98px;
}

.send-wrap {
    display: inline-flex;
    align-items: stretch;
}

.send-wrap .el-button {
    border-radius: 0;
}

.send-wrap .el-button:first-child {
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;
}

.send-wrap .send-more {
    width: 40px;
    padding: 0;
    border-left: 1px solid rgba(255, 255, 255, 0.45);
}

.send-wrap .el-button:last-child {
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;
}

@media (max-width: 1200px) {
    .chat-room {
        margin: -6px -8px 0 -8px;
    }

    .chat-card {
        height: calc(100vh - 156px);
    }

    .chat-sidebar {
        width: 300px;
    }

    .message-body {
        max-width: 74%;
    }

    .composer-panel {
        --editor-height: 80px;
    }
}

@media (max-width: 900px) {
    .chat-room {
        margin: 0;
    }

    .chat-card {
        height: calc(100vh - 154px);
        border-radius: 14px;
    }

    .chat-container {
        flex-direction: column;
    }

    .chat-sidebar {
        width: 100%;
        max-height: 36%;
        border-right: none;
        border-bottom: 1px solid var(--app-border);
    }

    .message-list {
        padding: 14px;
    }

    .message-body {
        max-width: 82%;
    }

    .composer-panel {
        --editor-height: 72px;
    }
}
</style>
