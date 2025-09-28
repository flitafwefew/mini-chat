// 用户信息
export interface UserInfo {
    id: string
    name: string
    avatar: string | null
    type: string
    badge: string[] | null
}

// 发送消息参数
export interface SendMessageParams {
    msgContent: string
    targetId: string
    type: string
    source: string
    referenceMsgId?: string
}

// 发送消息响应
export interface SendMessageResponse {
    code: number
    msg: string
    data: MessageRecord
}

// 消息内容项
export interface MessageContent {
    type: 'text' | 'at' | 'emoji' | 'image' | 'file' | 'video' | 'audio' | 'location' | 'system'
    content: string
    url?: string
    filename?: string
    size?: number
    duration?: number
    width?: number
    height?: number
    latitude?: number
    longitude?: number
    address?: string
}

// 消息状态
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

// 消息记录
export interface MessageRecord {
    id: string
    fromId: string
    toId: string
    fromInfo: UserInfo
    message: string | MessageContent[]
    referenceMsg: any | null
    atUser: any | null
    isShowTime: boolean
    type: string
    source: string
    status?: MessageStatus
    createTime: string
    updateTime: string
}

// 获取消息记录参数
export interface RecordParams {
    index: number
    num: number
    targetId: string
}

// API响应
export interface MessageResponse {
    code: number
    msg: string
    data: MessageRecord[]
}