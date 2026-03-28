<template>
    <div class="chat-room">
        <div class="page-header">
            <h2>聊天室</h2>
            <p>与任务发布者/服务提供者在线沟通</p>
        </div>

        <el-card class="chat-card">
            <div class="chat-container">
                <!-- 左侧会话列表 -->
                <div class="chat-sidebar">
                    <div class="search-box">
                        <el-input v-model="searchKeyword" placeholder="搜索聊天记录" prefix-icon="Search" size="default"
                            clearable />
                    </div>
                    <div class="session-list">
                        <div v-for="item in sessionList" :key="item.id" class="session-item"
                            :class="{ active: currentSessionId === item.id }" @click="selectSession(item)">
                            <el-avatar :size="48" :src="item.avatar" class="avatar">
                                {{ item.name.charAt(0) }}
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
                            <el-badge v-if="item.unread > 0" :value="item.unread" :hidden="item.unread === 0"
                                class="unread-badge" />
                        </div>
                    </div>
                </div>

                <!-- 右侧聊天区域 -->
                <div class="chat-main">
                    <div v-if="currentSession" class="chat-content">
                        <!-- 聊天头部 -->
                        <div class="chat-header">
                            <div class="chat-user-info">
                                <el-avatar :size="40" :src="currentSession.avatar">
                                    {{ currentSession.name.charAt(0) }}
                                </el-avatar>
                                <div class="user-detail">
                                    <div class="user-name">{{ currentSession.name }}</div>
                                    <div class="user-status">在线</div>
                                </div>
                            </div>
                            <div class="chat-actions">
                                <el-button circle icon="More" />
                            </div>
                        </div>

                        <!-- 消息列表 -->
                        <div class="message-list" ref="messageListRef">
                            <div v-for="msg in messageList" :key="msg.id" class="message-item" :class="msg.type">
                                <el-avatar v-if="msg.type === 'received'" :size="36" :src="currentSession.avatar"
                                    class="message-avatar">
                                    {{ currentSession.name.charAt(0) }}
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
                        </div>

                        <!-- 输入区域 -->
                        <div class="input-area">
                            <el-input v-model="messageInput" type="textarea" :rows="3" placeholder="输入消息..."
                                @keydown.enter.exact.prevent="sendMessage" />
                            <div class="input-actions">
                                <div class="left-actions">
                                    <el-button text icon="Picture" />
                                    <el-button text icon="Folder" />
                                </div>
                                <el-button type="primary" @click="sendMessage">发送</el-button>
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
export default {
    name: 'ChatRoom',
    data() {
        return {
            searchKeyword: '',
            currentSessionId: null,
            messageInput: '',
            sessionList: [
                {
                    id: 1,
                    name: '张三',
                    avatar: '',
                    lastMessage: '好的，我一会儿就到',
                    time: '10:30',
                    unread: 2
                },
                {
                    id: 2,
                    name: '李四',
                    avatar: '',
                    lastMessage: '这个任务我可以接',
                    time: '09:15',
                    unread: 0
                },
                {
                    id: 3,
                    name: '王五',
                    avatar: '',
                    lastMessage: '谢谢，已经解决了',
                    time: '昨天',
                    unread: 0
                }
            ],
            messageList: [
                { id: 1, type: 'received', content: '你好，请问这个任务还可以接吗？', time: '10:25' },
                { id: 2, type: 'sent', content: '可以的，你什么时候方便？', time: '10:26' },
                { id: 3, type: 'received', content: '我下午 2 点以后都可以', time: '10:28' },
                { id: 4, type: 'sent', content: '好的，那就下午 2 点见', time: '10:29' },
                { id: 5, type: 'received', content: '好的，我一会儿就到', time: '10:30' }
            ]
        }
    },
    computed: {
        currentSession() {
            return this.sessionList.find(item => item.id === this.currentSessionId) || null
        }
    },
    methods: {
        selectSession(session) {
            this.currentSessionId = session.id
            // 清空未读数
            session.unread = 0
        },
        sendMessage() {
            if (!this.messageInput.trim()) return

            this.messageList.push({
                id: Date.now(),
                type: 'sent',
                content: this.messageInput,
                time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
            })

            this.messageInput = ''

            // 滚动到底部
            this.$nextTick(() => {
                const container = this.$refs.messageListRef
                if (container) {
                    container.scrollTop = container.scrollHeight
                }
            })
        }
    }
}
</script>

<style scoped>
.chat-room {
    padding: 20px;
}

.page-header {
    margin-bottom: 24px;
}

.page-header h2 {
    font-size: 24px;
    color: #333;
    margin-bottom: 8px;
}

.page-header p {
    color: #666;
    font-size: 14px;
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
