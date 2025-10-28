import Http from '@/utils/axios'
import type { MessageResponse, RecordParams, SendMessageParams, SendMessageResponse } from '@/types/message'

// 检测移动端环境
const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// 获取服务URL
const getServiceUrl = () => {
    return isMobileDevice() ? 'http://10.33.123.133:3002' : 'http://10.33.123.133:3002';
};

// 移动端直接fetch请求
const mobileFetch = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('x-token') || localStorage.getItem('token');
    const fullUrl = `${getServiceUrl()}${url}`;
    
    const defaultOptions: RequestInit = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'x-token': token }),
            ...options.headers
        },
        ...options
    };
    
    console.log('📡 移动端消息API请求:', fullUrl, defaultOptions);
    
    const response = await fetch(fullUrl, defaultOptions);
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }
    
    return response.json();
};

// 发送消息
export const send = async (param: SendMessageParams) => {
    if (isMobileDevice()) {
        return mobileFetch('/api/v1/message/send', {
            method: 'POST',
            body: JSON.stringify(param)
        });
    }
    return Http.post<SendMessageResponse>('/api/v1/message/send', param);
};

// 获取聊天记录
export const record = async (param: RecordParams) => {
    if (isMobileDevice()) {
        const queryParams = new URLSearchParams();
        Object.entries(param).forEach(([key, value]) => {
            queryParams.append(key, value.toString());
        });
        return mobileFetch(`/api/v1/message/list?${queryParams.toString()}`);
    }
    return Http.get<MessageResponse>('/api/v1/message/list', param);
};

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