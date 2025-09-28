import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MessageRecord, SendMessageParams, MessageStatus } from '@/types/message'
import { recall, send } from '@/api/message'
import { useUserStore } from './useUserStore'
export const useMessageStore = defineStore('message', () => {
    const targetId = ref('')
    const messages = ref<MessageRecord[]>([])
    const loading = ref(false)
    const chatName = ref('')
    const source = ref('')
    // 获取最新消息
    const latestMessage = computed(() => {
        if (messages.value.length === 0) return null
        return messages.value[messages.value.length - 1]
    })
    async function sendMessage(message: SendMessageParams) {
        const userStore = useUserStore()
        const currentUserId = userStore.user?.id || ''
        
        // 创建临时消息，状态为发送中
        const tempMessage: MessageRecord = {
            id: `temp_${Date.now()}`,
            fromId: currentUserId,
            toId: message.targetId,
            fromInfo: {
                id: currentUserId,
                name: userStore.user?.name || '',
                avatar: userStore.user?.avatar || null,
                type: 'user',
                badge: null
            },
            message: message.msgContent,
            referenceMsg: null,
            atUser: null,
            isShowTime: false,
            type: message.type,
            source: message.source,
            status: 'sending',
            createTime: new Date().toISOString(),
            updateTime: new Date().toISOString()
        }
        
        // 先添加临时消息到列表
        messages.value.push(tempMessage)
        
        try {
            const res = await send(message)
            if (res.code === 0) {
                // 发送成功，更新消息状态
                const messageIndex = messages.value.findIndex(msg => msg.id === tempMessage.id)
                if (messageIndex !== -1) {
                    messages.value[messageIndex] = {
                        ...res.data,
                        status: 'sent'
                    }
                }
            } else {
                // 发送失败，更新消息状态
                const messageIndex = messages.value.findIndex(msg => msg.id === tempMessage.id)
                if (messageIndex !== -1) {
                    messages.value[messageIndex].status = 'failed'
                }
            }
        } catch (error) {
            // 发送失败，更新消息状态
            const messageIndex = messages.value.findIndex(msg => msg.id === tempMessage.id)
            if (messageIndex !== -1) {
                messages.value[messageIndex].status = 'failed'
            }
            console.error('发送消息失败:', error);
            throw error
        }
    }
    function setTargetId(id: string) {
        targetId.value = id
    }

    function setChatName(name: string) {
        chatName.value = name
    }

    function getChatName(_id: string) {
        return chatName.value
    }

    function setMessages(list: MessageRecord[]) {
        messages.value = list.sort((a, b) =>
            new Date(a.createTime).getTime() - new Date(b.createTime).getTime()
        )
    }

    function addMessage(message: MessageRecord) {
        messages.value.push(message)
    }

    function appendMessage(message: MessageRecord) {
        messages.value.push(message)
    }

    function prependMessages(list: MessageRecord[]) {
        const sortedList = list.sort((a, b) =>
            new Date(a.createTime).getTime() - new Date(b.createTime).getTime()
        )
        messages.value = [...sortedList, ...messages.value]
    }

    function clearMessages() {
        messages.value = []
        targetId.value = ''
        source.value = ''
    }

    // 获取消息文本内容
    function getMessageText(message: MessageRecord): string {
        if (!message) return ''

        if (message.type === 'emoji') return '[表情]'

        if (Array.isArray(message.message)) {
            return message.message.map(item => {
                if (item.type === 'text') return item.content
                if (item.type === 'at') {
                    try {
                        return '@' + JSON.parse(item.content).name
                    } catch {
                        return '@用户'
                    }
                }
                return ''
            }).join('')
        }

        if (typeof message.message === 'string') {
            try {
                const messageArr = JSON.parse(message.message)
                if (Array.isArray(messageArr)) {
                    return messageArr.map(item => item.content || '').join('')
                }
                return message.message
            } catch {
                return message.message
            }
        }

        return ''
    }

    function removeMessage(msgId: string) {
        messages.value = messages.value.filter(msg => msg.id !== msgId)
    }

    async function recallMessage(msgId: string) {
        try {
            const res = await recall({ msgId })
            if ((res as any).code === 0) {
                removeMessage(msgId)
                return true
            }
            return false
        } catch (error) {
            return false
        }
    }

    // 更新消息状态
    function updateMessageStatus(msgId: string, status: MessageStatus) {
        const messageIndex = messages.value.findIndex(msg => msg.id === msgId)
        if (messageIndex !== -1) {
            messages.value[messageIndex].status = status
        }
    }

    // 重发失败的消息
    async function resendMessage(msgId: string) {
        const messageIndex = messages.value.findIndex(msg => msg.id === msgId)
        if (messageIndex !== -1) {
            const message = messages.value[messageIndex]
            if (message.status === 'failed') {
                // 更新状态为发送中
                message.status = 'sending'
                
                try {
                    const params: SendMessageParams = {
                        msgContent: typeof message.message === 'string' ? message.message : JSON.stringify(message.message),
                        targetId: message.toId,
                        type: message.type,
                        source: message.source
                    }
                    
                    const res = await send(params)
                    if (res.code === 0) {
                        // 发送成功，更新消息
                        messages.value[messageIndex] = {
                            ...res.data,
                            status: 'sent'
                        }
                        return true
                    } else {
                        message.status = 'failed'
                        return false
                    }
                } catch (error) {
                    message.status = 'failed'
                    return false
                }
            }
        }
        return false
    }

    return {
        targetId,
        messages,
        loading,
        latestMessage,
        chatName,
        source,
        setTargetId,
        setChatName,
        getChatName,
        setMessages,
        addMessage,
        appendMessage,
        prependMessages,
        clearMessages,
        getMessageText,
        sendMessage,
        removeMessage,
        recallMessage,
        updateMessageStatus,
        resendMessage
    }
})