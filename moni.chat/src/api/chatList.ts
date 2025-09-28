import Http from '@/utils/axios'
import type { ChatListResponse, ReadMessageParams, DeleteChatParams } from '@/types/chatList'

// 获取群聊列表
export const group = () => Http.get<ChatListResponse>('/api/v1/chat-list/group')

// 获取私聊列表
export const privateList = () => Http.get<ChatListResponse>('/api/v1/chat-list/list/private')

// 获取群成员列表
export const getGroupMembers = (groupId: string) => Http.get(`/api/v1/chat-list/groups/${groupId}/members`)

// 创建聊天
export const create = (param: {targetId: string}) => Http.post<ChatListResponse>('/api/v1/chat-list/create', param)

// 标记已读
export const read = (param: ReadMessageParams) => Http.post<ChatListResponse>('/api/v1/chat-list/read', param)

// 删除聊天
export const deleteList = (param: DeleteChatParams) => Http.post<ChatListResponse>('/api/v1/chat-list/delete', param) 