<template>
    <div class="chat-list">
        <!-- 群聊部分 -->
        <div class="chat-section">
            <div class="section-title">群聊</div>
            <div v-for="chat in chatListStore.groupChats" :key="chat.id" class="chat-item"
                :class="{ active: messageStore.targetId === chat.targetId }" @click="handleChatClick(chat)">
                <div class="chat-avatar">
                    <img v-if="getUserAvatar(chat.targetId)" :src="getUserAvatar(chat.targetId)" class="avatar" alt="">
                    <Avatar v-else :name="chat.targetInfo.name" :size="40" />
                    <div v-if="chat.unreadCount > 0" class="unread-badge">
                        {{ chat.unreadCount > 99 ? '99+' : chat.unreadCount }}
                    </div>
                </div>
                <div class="chat-info">
                    <div class="chat-header">
                        <span class="chat-name">{{ chat.targetInfo.name }}</span>
                        <span class="chat-time">{{ formatTime(chat.updateTime) }}</span>
                    </div>
                    <div v-if="chat.lastMessage && chat.lastMessage.type === 'emoji'" class="chat-message">
                        [emoji]
                    </div>
                    <div v-else class="chat-message" :title="getLatestMessage(chat.targetId)">
                        {{ getLatestMessage(chat.targetId) }}
                    </div>
                </div>
            </div>
        </div>

        <!-- 私聊部分 -->
        <div class="chat-section">
            <div class="section-title">私聊</div>
            <div v-for="chat in chatListStore.privateChats" :key="chat.id" class="chat-item"
                :class="{ active: messageStore.targetId === chat.targetId }" @click="handleChatClick(chat)">
                <div class="chat-avatar">
                    <img v-if="getUserAvatar(chat.targetId)" :src="getUserAvatar(chat.targetId)" alt="">
                    <Avatar v-else :name="chat.targetInfo.name" :size="40" />
                    <div v-if="chat.unreadCount > 0" class="unread-badge">
                        {{ chat.unreadCount > 99 ? '99+' : chat.unreadCount }}
                    </div>
                </div>
                <div class="chat-info">
                    <div class="chat-header">
                        <span class="chat-name">
                            {{ chat.targetInfo.name }}
                            <span v-if="isAIUser(chat.targetId)" class="ai-badge" title="AI助手">🤖</span>
                        </span>
                        <span class="chat-time">{{ formatTime(chat.updateTime) }}</span>
                    </div>
                    <div v-if="chat.lastMessage && chat.lastMessage.type === 'emoji'" class="chat-message">
                        [动画表情]
                    </div>
                    <div v-else-if="chat.lastMessage && chat.lastMessage.type === 'text'" class="chat-message"
                        :title="getLatestMessage(chat.targetId)">
                        {{ getLatestMessage(chat.targetId) }}
                    </div>
                    <div v-else-if="chat.lastMessage && chat.lastMessage.type === 'call'" class="chat-message">
                        {{ getLatestMessage(chat.targetId) }}
                    </div>
                </div>
            </div>
        </div>

        <div v-if="chatListStore.chatList.length === 0" class="empty-list">
            <el-empty description="暂无聊天消息" />
        </div>
        <div class="logout" @click="handleLogout">
            <span>
                <svg t="1742137731845" class="icon" viewBox="0 0 1024 1024" version="1.1"
                    xmlns="http://www.w3.org/2000/svg" p-id="4543" width="37" height="37">
                    <path
                        d="M814 65.9H265.7c-80.5 0-146 65.5-146 146V320c0 19.9 16.1 36 36 36s36-16.1 36-36V211.9c0-40.8 33.2-74 74-74H814c40.8 0 74 33.2 74 74v602.6c0 40.8-33.2 74-74 74H265.7c-40.8 0-74-33.2-74-74V704.2c0-19.9-16.1-36-36-36s-36 16.1-36 36v110.3c0 80.5 65.5 146 146 146H814c80.5 0 146-65.5 146-146V211.9c0-80.5-65.5-146-146-146z"
                        p-id="4544" fill="#8a8a8a"></path>
                    <path
                        d="M549.7 680.5c-13.5 14.6-12.6 37.4 2 50.9 6.9 6.4 15.7 9.6 24.4 9.6 9.7 0 19.4-3.9 26.5-11.6l177.4-192c6.5-7 9.6-15.9 9.5-24.8 0.1-8.8-3.1-17.7-9.5-24.8l-177.4-192c-13.5-14.6-36.3-15.5-50.9-2-14.6 13.5-15.5 36.3-2 50.9l121.6 131.6H100c-19.9 0-36 16.1-36 36s16.1 36 36 36h571.8L549.7 680.5z"
                        p-id="4545" fill="#8a8a8a"></path>
                </svg>
            </span>
            <span>
                退出登录
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import type { ChatListItem } from '@/types/chatList'
import type { MessageInfo } from '@/types/chatList'
import { formatTime } from '@/utils/date'
import Avatar from '@/components/Avatar.vue'
import { useMessageStore } from '@/stores/module/useMessageStore'
import { useChatListStore } from '@/stores/module/useChatListStore'
import EventBus from '@/utils/eventBus'
import { useUserStore } from '@/stores/module/useUserStore'

const chatListStore = useChatListStore()
const messageStore = useMessageStore()
const userStore = useUserStore()

// 处理新消息更新聊天列表
const handleNewMessage = (content: any) => {
    let targetChat = null;
    console.log('content:chatList', content)
    // 根据消息类型和发送对象找到对应的聊天
    if (content.source === 'group') {
        // 群聊消息，根据toId（群ID）查找
        targetChat = chatListStore.chatList.find(chat =>
            chat.type === 'group' && chat.targetId === content.toId
        );
    } else {
        // 私聊消息，需要根据发送者和接收者判断
        const currentUserId = userStore.user?.id.toString();
        console.log('currentUserId', currentUserId)
        // 如果我是发送者
        if (content.fromId === currentUserId) {
            targetChat = chatListStore.chatList.find(chat =>
                chat.type === 'user' && chat.targetId === content.toId
            );
        }
        // 如果我是接收者
        else if (content.toId === currentUserId) {
            targetChat = chatListStore.chatList.find(chat =>
                chat.type === 'user' && chat.targetId === content.fromId
            );
        }

        // 如果没有找到对应的聊天，可能需要创建新的聊天
        if (!targetChat && content.toId === currentUserId) {
            // 当收到新的私聊消息但没有对应的聊天时，刷新聊天列表
            chatListStore.fetchAllChats();
            return;
        }
    }

    // 如果找到对应的聊天
    if (targetChat) {
        // 如果不是当前聊天，增加未读消息数
        if (targetChat.targetId !== messageStore.targetId) {
            targetChat.unreadCount = (targetChat.unreadCount || 0) + 1;
        }
        chatListStore.readChat(targetChat.targetId)
        // 更新最后一条消息
        targetChat.lastMessage = {
            id: content.id,
            fromId: content.fromId,
            toId: content.toId,
            fromInfo: content.fromInfo,
            message: content.message,
            referenceMsg: content.referenceMsg,
            atUser: content.atUser,
            isShowTime: false,
            type: content.type,
            source: content.source,
            createTime: content.createTime,
            updateTime: content.updateTime
        } as MessageInfo;
        targetChat.updateTime = content.createTime;

        // 重新排序聊天列表
        chatListStore.chatList.sort((a, b) =>
            new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime()
        );
    }
}

// 点击聊天项
const handleChatClick = (chat: ChatListItem) => {
    messageStore.setTargetId(chat.targetId)
    messageStore.setChatName(chat.targetInfo.name)
    messageStore.source = chat.type
    chatListStore.readChat(chat.targetId)
}

// 获取最新消息内容
const getLatestMessage = (targetId: string): string => {
    const chat = chatListStore.chatList.find(item => item.targetId === targetId)
    if (!chat?.lastMessage||!chat?.lastMessage.message) return '暂无消息'
    if (chat.lastMessage.type === 'call') {
        if (chat.lastMessage.message === '0') return '[未接通]';
        else return '[语音通话]';
    }
    try {
        if (typeof chat.lastMessage.message === 'string') {
            const messageObj = JSON.parse(chat.lastMessage.message)
            if (Array.isArray(messageObj)) {
                return messageObj.map(item => item.content || '').join('')
            }
            return chat.lastMessage.message
        }
        return JSON.stringify(chat.lastMessage)
    } catch {
        return chat.lastMessage.toString()
    }
}
const handleLogout = ()=>{
    userStore.logout()
}

// 获取用户头像，处理头像URL无法访问的情况
const getUserAvatar = (targetId: string): string | null => {
    const userInfo = userStore.userMap[targetId]
    
    // 特别调试 AI 助手
    if (targetId === 'ai_assistant_001') {
        console.log('🤖 AI助手头像调试:')
        console.log('  - targetId:', targetId)
        console.log('  - userInfo:', userInfo)
        console.log('  - avatar:', userInfo?.avatar)
    }
    
    if (!userInfo?.avatar) return null
    
    // 检查头像URL是否有效
    const avatarUrl = userInfo.avatar
    console.log('检查头像URL:', avatarUrl)
    
    // 如果是dicebear.com的URL，直接返回（让浏览器处理加载失败）
    if (avatarUrl.includes('dicebear.com')) {
        return avatarUrl
    }
    
    return avatarUrl
}

// 判断是否是AI用户
const isAIUser = (targetId: string): boolean => {
    return targetId === 'ai_assistant_001'
}
onMounted(async () => {
    // 强制刷新用户映射，确保获取最新头像
    await userStore.getUserMap(true)
    console.log('✅ 用户映射已刷新，包含用户:', Object.keys(userStore.userMap).length)
    console.log('🤖 AI助手数据:', userStore.userMap['ai_assistant_001'])
    
    chatListStore.fetchAllChats()
    // 监听新消息
    EventBus.on('on-receive-msg', handleNewMessage)
})
onBeforeUnmount(() => {
    // 移除事件监听
    EventBus.off('on-receive-msg', handleNewMessage)
})
</script>

<style scoped lang="scss">
.chat-list {
    width: 100%;
    height: 100%;
    /* 确保高度为固定值或有最大高度限制，超出部分显示滚动条 */
    max-height: 800px;
    overflow-y: auto;
    background: #fff;
    border-radius: 8px;
    padding: 10px 0;

    @media screen and (max-width: 700px) {
        max-height: 100%;
    }

    .chat-section {
        margin-bottom: 20px;

        &:last-child {
            margin-bottom: 0;
        }

        .section-title {
            padding: 0 15px;
            font-size: 14px;
            color: #909399;
            margin-bottom: 10px;
            font-weight: 500;
        }
    }

    .active {
        background-color: #0090F0;
    }

    .chat-item {
        display: flex;
        align-items: center;
        padding: 12px;
        cursor: pointer;
        transition: background-color 0.3s;
        border-bottom: 1px solid #f0f0f0;

        &:hover:not(.active) {
            background-color: #f5f5f5;
        }

        &.active {
            border-radius: 8px;

            .chat-name {
                color: #fff !important;
            }

            .chat-time {
                color: #fff !important;
            }

            .chat-message {
                color: #fff !important;
            }
        }

        .chat-avatar {
            position: relative;
            margin-right: 12px;

            img {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                object-fit: cover;
            }

            .unread-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background-color: #f56c6c;
                color: white;
                border-radius: 10px;
                padding: 0 6px;
                font-size: 12px;
                min-width: 16px;
                height: 16px;
                line-height: 16px;
                text-align: center;
            }
        }

        .chat-info {
            flex: 1;
            min-width: 100px;

            .chat-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 4px;

                .chat-name {
                    font-weight: 500;
                    font-size: 14px;
                    color: #333;
                    text-overflow: ellipsis;
                    overflow: hidden;
                    white-space: nowrap;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    
                    .ai-badge {
                        font-size: 16px;
                        line-height: 1;
                        animation: aiPulse 2s ease-in-out infinite;
                    }
                }

                .chat-time {
                    font-size: 12px;
                    color: #999;
                }
            }

            .chat-message {
                font-size: 13px;
                width: 150px;
                color: #666;
                padding-top: 5px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        }

        .chat-badge {
            min-width: 18px;
            height: 18px;
            padding: 0 6px;
            background-color: #ff4d4f;
            border-radius: 9px;
            color: white;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-left: 8px;
        }
    }

    .empty-list {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    /* 自定义滚动条样式 */
    &::-webkit-scrollbar {
        width: 6px;
    }
    &::-webkit-scrollbar-thumb {
        background-color: #dcdfe6;
        border-radius: 3px;
    }
    &::-webkit-scrollbar-track {
        background-color: transparent;
    }
    .logout{
        display: none;
        @media screen and (max-width: 700px) {
            bottom: 60px;
            width: 100%;
            height: 50px;
            position: absolute;
            display: flex;
            background: #f6f6f7;
            align-items: center;
            justify-content: center;
            margin-top: 10px;
            margin-bottom: 10px;
            border-top: 1px solid #e0e0e0;
            // border-radius: 15px;
            cursor: pointer;
            span{
                padding-left: 20px;
                padding-right: 25px;
                padding-top: 15px;
                font-weight: 500;
                font-size: 17px;
            }
        }
    }
}

@keyframes aiPulse {
    0%, 100% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.7;
        transform: scale(1.1);
    }
}
</style>