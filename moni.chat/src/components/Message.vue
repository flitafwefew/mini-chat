<template>
    <div class="message-container">
        <div class="message-list" ref="messageList" @scroll="handleScroll">
            <div v-if="messageStore.loading" class="loading-more">
                加载更多...
            </div>
            <div v-for="message in messageStore.messages" :key="message.id" class="message-item">
                <!-- 时间显示 -->
                <div v-if="message.isShowTime" class="message-time">
                    {{ formatTime(message.createTime) }}
                </div>
                <!-- 消息内容 -->
                <div v-if="message.type === 'text' || message.type === 'emoji' || message.type === 'call'" class="message-content" :class="{ 'message-self': isSelf(message.fromId) }">
                    <div class="message-avatar" >
                        <img v-if="userStore.userMap[message.fromId]?.avatar" :src="userStore.userMap[message.fromId]?.avatar || ''" alt="avatar" class="avatar">
                        <Avatar v-else :name="message.fromInfo.name" :size="40" />
                    </div>
                    <div class="message-body" @contextmenu.prevent="showContextMenu($event, message)">
                        <div class="message-name">{{ message.fromInfo.name }}</div>
                        <div class="message-text" v-if="message.type === 'text'">
                            <template v-if="Array.isArray(message.message)">
                                <template v-for="(item, idx) in message.message" :key="idx">
                                    <span v-if="item.type === 'text'">{{ item.content }}</span>
                                    <span v-else-if="item.type === 'at'" class="at-user">
                                        @{{ JSON.parse(item.content).name }}
                                    </span>
                                </template>
                            </template>
                            <template v-else>
                                <template v-if="typeof message.message === 'string'">
                                    <template v-if="isJsonString(message.message)">
                                        {{ parseMessageContent(message.message) }}
                                    </template>
                                    <template v-else>
                                        {{ message.message }}
                                    </template>
                                </template>
                            </template>
                        </div>
                        <div class="message-emoji" v-else-if="message.type === 'emoji'">
                            <img :src="message.message as string" alt="emoji" class="emoji-img" />
                        </div>
                        <div class="message-text" v-else-if="message.type === 'call'">
                            <div v-if="message.message !== '0'&&typeof(message.message)==='string'" class="call-content">
                                <span>[通话时长：{{formattedTime(message.message)}}]</span>
                            </div>
                            <div v-else class="call-content">
                                <span>[未接通]</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else-if="message.type === 'recall'" class="message-recall">
                    {{ message.fromInfo.name }}撤回了一条消息
                </div>
            </div>
        </div>
        <div v-if="showMenu" class="context-menu" :style="menuStyle">
            <div v-if="canRecall" class="menu-item" @click="handleRecall">撤回</div>
        </div>
        <InputFile />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch, onBeforeUnmount } from 'vue'
import { record } from '@/api/message'
import type { RecordParams, MessageRecord } from '@/types/message'
import { ElMessage } from 'element-plus'
import { formatTime } from '@/utils/date'
import Avatar from '@/components/Avatar.vue'
import { useUserStore } from '@/stores/module/useUserStore'
import { useMessageStore } from '@/stores/module/useMessageStore'
import InputFile from '@/components/InputFile.vue'
import EventBus from '@/utils/eventBus'
import { formatTimingTime } from '@/utils/date';

// import { CircleClose } from '@element-plus/icons-vue'

const messageList = ref<HTMLElement | null>(null)
const userStore = useUserStore()
const messageStore = useMessageStore()
const currentPage = ref(0)
const isLoadingMore = ref(false)
const hasMore = ref(true)

// 判断是否是自己发送的消息
const isSelf = (fromId: string) => {
    return fromId === userStore.user?.id?.toString()
}

// 滚动到底部
const scrollToBottom = async () => {
    await nextTick()
    requestAnimationFrame(() => {
        if (messageList.value) {
            const scrollHeight = messageList.value.scrollHeight
            messageList.value.scrollTop = scrollHeight

            // 双重检查确保滚动到底部
            setTimeout(() => {
                if (messageList.value) {
                    messageList.value.scrollTop = messageList.value.scrollHeight
                }
            }, 100)
        }
    })
}

// 处理滚动事件
const handleScroll = async () => {
    if (!messageList.value || isLoadingMore.value || !hasMore.value) return

    const { scrollTop } = messageList.value
    // 当滚动到顶部时加载更多消息
    if (scrollTop < 50) {
        isLoadingMore.value = true
        const oldHeight = messageList.value.scrollHeight
        await loadMoreMessages()
        // 保持滚动位置
        await nextTick()
        if (messageList.value) {
            const newHeight = messageList.value.scrollHeight
            messageList.value.scrollTop = newHeight - oldHeight
        }
        isLoadingMore.value = false
    }
}

// 加载更多消息
const loadMoreMessages = async () => {
    if (!messageStore.targetId) return
    try {
        messageStore.loading = true
        const params: RecordParams = {
            index: currentPage.value + 1,
            num: 10,
            targetId: messageStore.targetId
        }
        const res = await record(params)
        if (res.code === 0) {
            if (res.data.length === 0) {
                hasMore.value = false
                return
            }
            currentPage.value++
            // 将新消息添加到列表前面
            messageStore.prependMessages(res.data)
        } else {
            ElMessage.error(res.msg || '获取消息记录失败')
        }
    } catch (error: any) {
        ElMessage.error(error.message || '获取消息记录失败')
    } finally {
        messageStore.loading = false
    }
}

// 获取消息记录
const fetchMessages = async () => {
    if (!messageStore.targetId) return

    try {
        messageStore.loading = true
        currentPage.value = 0
        hasMore.value = true
        const params: RecordParams = {
            index: 0,
            num: 30,
            targetId: messageStore.targetId
        }
        const res = await record(params)
        if (res.code === 0) {
            messageStore.setMessages(res.data)
            await scrollToBottom()
        } else {
            ElMessage.error(res.msg || '获取消息记录失败')
        }
    } catch (error: any) {
        ElMessage.error(error.message || '获取消息记录失败')
    } finally {
        messageStore.loading = false
    }
}
const formattedTime = (time: string) => {
    return formatTimingTime(Number(time))
}
// 检查字符串是否为JSON格式
const isJsonString = (str: string): boolean => {
    try {
        JSON.parse(str)
        return true
    } catch (e) {
        return false
    }
}

// 解析消息内容
const parseMessageContent = (messageStr: string): string => {
    try {
        const messageArr = JSON.parse(messageStr)
        if (Array.isArray(messageArr) && messageArr.length > 0) {
            return messageArr.map(item => item.content || '').join('')
        }
        return messageStr
    } catch (e) {
        return messageStr
    }
}

// 处理新消息
const handleNewMessage = (content: any) => {
    console.log('content', content)
    if (!messageStore.targetId) return

    // 检查消息是否属于当前聊天
    if (content.fromId === messageStore.targetId || content.toId === messageStore.targetId) {
        const newMessage: MessageRecord = {
            id: content.id,
            fromId: content.fromId,
            toId: content.toId,
            fromInfo: content.fromInfo,
            message: content.message,
            referenceMsg: content.referenceMsg,
            atUser: content.atUser,
            isShowTime: true, // 新消息总是显示时间
            type: content.type,
            source: content.source,
            createTime: content.createTime,
            updateTime: content.updateTime
        }
        console.log('newMessage', newMessage)
        // 添加消息到列表
        if(content.toId === useUserStore().user?.id.toString()){
            messageStore.appendMessage(newMessage)
            
        }
        // 滚动到底部
        scrollToBottom()
    }
}

// 监听targetId变化
watch(() => messageStore.targetId, (newId) => {
    if (messageStore.targetId === '') messageStore.clearMessages()
    if (newId) {
        fetchMessages()
    }
})

onMounted(async () => {
    if (messageStore.targetId) {
        await fetchMessages()
    }
    // 初始化时滚动到底部
    scrollToBottom()

    // 监听新消息
    try {
        EventBus.on('on-receive-msg', handleNewMessage)
    } catch (error) {
        console.log('error', error)
    }
})

onBeforeUnmount(() => {
    // 移除事件监听
    EventBus.off('on-receive-msg', handleNewMessage)
})
const showMenu = ref(false)
const menuStyle = ref({
    top: '0px',
    left: '0px'
})
const selectedMessage = ref<MessageRecord | null>(null)
const canRecall = ref(false)

// 显示右键菜单
const showContextMenu = (event: MouseEvent, message: MessageRecord) => {
    // 只能撤回自己的消息且在2分钟内
    const canRecallMessage = isSelf(message.fromId) && 
        (Date.now() - new Date(message.createTime).getTime() <= 2 * 60 * 1000)

    if (!canRecallMessage) return

    event.preventDefault()
    showMenu.value = true
    canRecall.value = true
    selectedMessage.value = message
    menuStyle.value = {
        top: `${event.clientY}px`,
        left: `${event.clientX}px`
    }
}

// 处理撤回消息
const handleRecall = async () => {
    if (!selectedMessage.value) return
    const success = await messageStore.recallMessage(selectedMessage.value.id)
    if (success) {
        ElMessage.success('消息已撤回')
    } else {
        ElMessage.error('撤回失败')
    }
    showMenu.value = false
}

// 点击其他地方关闭菜单
const closeMenu = () => {
    showMenu.value = false
    selectedMessage.value = null
    canRecall.value = false
}

onMounted(() => {
    document.addEventListener('click', closeMenu)
})

onBeforeUnmount(() => {
    document.removeEventListener('click', closeMenu)
})
</script>

<style scoped lang="scss">
.message-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: #f5f5f5;
    box-sizing: border-box;
    position: relative;
}
.message-list {
    padding: 20px;
    overflow-y: auto;
    height: calc(100vh - 300px);
    @media screen and (max-width: 700px) {
        padding: 15px;
    }
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
}

.loading-more {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    font-size: 12px;
    padding: 10px 0;

    .loading {
        margin-right: 5px;
        animation: rotating 2s linear infinite;
    }
}

@keyframes rotating {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.message-item {
    margin-bottom: 20px;
}

.message-time {
    text-align: center;
    margin: 20px 0;
    color: #999;
    font-size: 12px;
}

.message-content {
    display: flex;
    margin-bottom: 20px;
    align-items: flex-start;

    &.message-self {
        flex-direction: row-reverse;

        .message-body {
            margin-right: 12px;
            margin-left: 12px;
            align-items: flex-end;

            .message-name {
                text-align: right;
            }

            .message-text {
                background-color: #95ec69;
                border-radius: 0 4px 4px 4px;
            }
        }
    }
}

.message-avatar {
    // margin-right: 12px;
    img {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
    }
}

.message-body {
    max-width: 60%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.message-name {
    font-size: 12px;
    color: #999;
    margin-bottom: 4px;
}

.message-text {
    background-color: #fff;
    padding: 10px 15px;
    border-radius: 4px 0 4px 4px;
    font-size: 14px;
    line-height: 1.5;
    word-break: break-all;

    .at-user {
        color: #1890ff;
        cursor: pointer;
    }
}

.message-emoji {
    .emoji-img {
        max-width: 200px;
        max-height: 200px;
        border-radius: 4px;
    }
}
.context-menu {
    position: fixed;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 4px 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 1000;

    .menu-item {
        padding: 8px 16px;
        cursor: pointer;
        font-size: 14px;
        color: #333;

        &:hover {
            background-color: #f5f5f5;
        }
    }
}
.message-recall {
    text-align: center;
    color: #999;
    font-size: 12px;
    margin: 10px 0;
}
@media (max-width: 700px){
    .message-list{
        height: calc(100vh - 160px);
    }
}
</style>