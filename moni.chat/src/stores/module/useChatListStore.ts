import { defineStore } from 'pinia'
import type { ChatListItem } from '@/types/chatList'
import { group, privateList,create } from '@/api/chatList'
import { ElMessage } from 'element-plus'
import { useMessageStore } from './useMessageStore'
import { useUserStore } from './useUserStore'
import { read } from '@/api/chatList'

export const useChatListStore = defineStore('chatList', {
    state: () => ({
        chatList: [] as ChatListItem[],
    }),
    actions: {
        async fetchAllChats() {
            try {
                // 先获取用户映射，确保头像数据可用
                const userStore = useUserStore()
                await userStore.getUserMap()
                console.log('fetchAllChats - userMap after getUserMap:', userStore.userMap)
                
                // 获取群聊列表
                const groupRes = await group()
                console.log('群聊列表响应:', groupRes)
                // 获取私聊列表
                const privateRes = await privateList()
                console.log('私聊列表响应:', privateRes)

                if (groupRes.code === 0 && privateRes.code === 0) {
                    const groupChats = Array.isArray(groupRes.data) ? groupRes.data : [groupRes.data]
                    const privateChats = Array.isArray(privateRes.data) ? privateRes.data : [privateRes.data]
                    // console.log('privateChats',privateChats)

                    // 合并两个列表
                    this.chatList = [...groupChats, ...privateChats]

                    // 如果有群聊，自动设置第一个群聊的targetId
                    const messageStore = useMessageStore()
                    if (groupChats.length > 0 && messageStore.targetId === '') {
                        messageStore.setChatName(groupChats[0].targetInfo.name)
                        messageStore.setTargetId(groupChats[0].targetId)
                        messageStore.source = groupChats[0].type
                        await read({targetId:groupChats[0].targetId})
                    }
                } else {
                    console.error('API响应错误:', { groupRes, privateRes })
                    ElMessage.error(`获取聊天列表失败: 群聊${groupRes.code}, 私聊${privateRes.code}`)
                }
            } catch (error: any) {
                ElMessage.error(error.message || '获取聊天列表失败')
            }
        },
        async readChat(targetId: string) {
            await read({targetId:targetId})
            this.chatList.forEach(chat => {
                if (chat.targetId === targetId) {
                    chat.unreadCount = 0
                }
            })
        },
        async createChat(targetId: string,name:string) {
            const res = await create({"targetId":targetId})
            if (res.code === 0) {
                const messageStore = useMessageStore()
                messageStore.setTargetId(targetId)
                messageStore.setChatName(name)
                this.fetchAllChats()
            }
            this.readChat(targetId)
        }
    },
    getters: {
        groupChats: (state) => state.chatList
            .filter(chat => chat.type === 'group')
            .sort((a, b) => new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime()),
        privateChats: (state) => state.chatList
            .filter(chat => chat.type === 'user')
            .sort((a, b) => new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime()),
        
    }
    
})