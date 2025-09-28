import Http from '@/utils/axios'
import type { MessageResponse, RecordParams, SendMessageParams, SendMessageResponse } from '@/types/message'

// 发送消息
export const send = (param: SendMessageParams) => Http.post<SendMessageResponse>('/api/v1/message/send', param);

// 获取聊天记录
export const record = (param: RecordParams) => Http.get<MessageResponse>('/api/v1/message/list', param);

// 获取聊天列表
export const getChatList = () => Http.get<{
  code: number
  msg: string
  data: Array<{
    id: string
    user_id: string
    from_id: string
    last_msg_content: string
    type: string
    unread_num: number
    is_top: boolean
    create_time: string
    update_time: string
    fromUser?: {
      id: string
      name: string
      portrait: string | null
      is_online: boolean
    }
  }>
}>('/api/v1/message/chat-list')

// 标记消息为已读
export const markAsRead = (data: { from_id: string }) => Http.post<{
  code: number
  msg: string
  data: null
}>('/api/v1/message/mark-read', data)

// 撤回消息
export const recall = (param: any) => Http.post('/api/v1/message/recall', param);