<template>
    <div class="chat-room">
        <el-card class="chat-card">
            <div class="chat-container">
                <!-- 左侧会话列表 -->
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
                    <div class="session-list" v-loading="loadingSessions">
                        <template v-if="sessionList.length">
                            <div
                                v-for="item in sessionList"
                                :key="item.id"
                                class="session-item"
                                :class="{ active: currentSessionId === item.id }"
                                @click="selectSession(item)"
                            >
                                <el-avatar :size="48" :src="item.avatar" class="avatar">
                                    {{ getDisplayInitial(item.name) }}
                                </el-avatar>
                                <div class="session-info">
                                    <div class="session-header">
                                        <span class="session-name">{{ item.name }}</span>
                                        <span class="session-time">{{ item.time }}</span>
                                    </div>
                                    <div class="session-last-msg">
                                        {{ item.lastMessage }}
                                    </div>
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
                </div>

                <!-- 右侧聊天区域 -->
                <div class="chat-main">
                    <div v-if="currentSession" class="chat-content">
                        <!-- 聊天头部 -->
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

                        <!-- 消息列表 -->
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

                        <!-- 输入区域 -->
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
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { FolderOpened, Picture, RefreshRight, Search } from '@element-plus/icons-vue'
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
            sending,
            currentSession
        } = storeToRefs(store)

        let searchTimer = null

        const scrollToBottom = () => {
            const container = messageListRef.value

            if (container) {
                container.scrollTop = container.scrollHeight
            }
        }

        const getDisplayInitial = name => (name ? name.charAt(0) : '?')

        const fetchSessions = async preserveSelection => {
            try {
                await store.fetchSessions(preserveSelection)
            } catch (error) {
                console.error('获取会话列表失败:', error)
            }
        }

        const selectSession = async session => {
            try {
                await store.selectSession(session)
            } catch (error) {
                console.error('切换会话失败:', error)
            }
        }

        const sendMessage = async () => {
            try {
                await store.sendCurrentMessage()
            } catch (error) {
                console.error('发送消息失败:', error)
            }
        }

        const refreshCurrentSession = async () => {
            try {
                await store.refreshCurrentSession()
            } catch (error) {
                console.error('刷新会话失败:', error)
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
            const tradeId = route.query.tradeId

            if (tradeId) {
                store.openTradeSessionByTradeId(tradeId).catch(error => {
                    console.error('打开交易私聊会话失败:', error)
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
                    console.error('打开交易私聊会话失败:', error)
                }
            }
        )

        onBeforeUnmount(() => {
            if (searchTimer) {
                clearTimeout(searchTimer)
                searchTimer = null
            }
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
            currentSession,
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
}

.session-name {
    font-weight: 500;
    color: #333;
}

.session-time {
    font-size: 12px;
    color: #999;
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
