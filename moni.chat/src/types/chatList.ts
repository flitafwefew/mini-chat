// 目标信息（群聊或用户）
export interface TargetInfo {
    id: string
    name: string
    avatar: string
    type: string
    badge?: string[]
}

// 消息信息
export interface MessageInfo {
    id: string | null
    fromId: string | null
    toId: string | null
    fromInfo: any | null
    message: string | null
    referenceMsg: any | null
    atUser: any | null
    isShowTime: boolean | null
    type: string | null
    source: string | null
    createTime: string | null
    updateTime: string | null
}

// 聊天列表项
export interface ChatListItem {
    id: string
    userId: string
    targetId: string
    targetInfo: TargetInfo
    unreadCount: number
    lastMessage: MessageInfo
    type: string
    createTime: string
    updateTime: string
}

// API响应
export interface ChatListResponse {
    code: number
    msg: string
    data: ChatListItem[]
}

// 创建聊天参数
export interface CreateChatParams {
    targetId: string
    type: string
}

// 标记已读参数
export interface ReadMessageParams {
    targetId: string
}

// 删除聊天参数
export interface DeleteChatParams {
    chatId: string
}