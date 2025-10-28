import Http from '@/utils/axios'
import type { ChatListResponse, ReadMessageParams, DeleteChatParams } from '@/types/chatList'

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
    
    console.log('📡 移动端API请求:', fullUrl, defaultOptions);
    
    const response = await fetch(fullUrl, defaultOptions);
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }
    
    return response.json();
};

// 获取群聊列表
export const group = async () => {
    if (isMobileDevice()) {
        return mobileFetch('/api/v1/chat-list/group');
    }
    return Http.get<ChatListResponse>('/api/v1/chat-list/group');
};

// 获取私聊列表
export const privateList = async () => {
    if (isMobileDevice()) {
        return mobileFetch('/api/v1/chat-list/list/private');
    }
    return Http.get<ChatListResponse>('/api/v1/chat-list/list/private');
};

// 获取群成员列表
export const getGroupMembers = async (groupId: string) => {
    if (isMobileDevice()) {
        return mobileFetch(`/api/v1/chat-list/groups/${groupId}/members`);
    }
    return Http.get(`/api/v1/chat-list/groups/${groupId}/members`);
};

// 创建聊天
export const create = async (param: {targetId: string}) => {
    if (isMobileDevice()) {
        return mobileFetch('/api/v1/chat-list/create', {
            method: 'POST',
            body: JSON.stringify(param)
        });
    }
    return Http.post<ChatListResponse>('/api/v1/chat-list/create', param);
};

// 标记已读
export const read = async (param: ReadMessageParams) => {
    if (isMobileDevice()) {
        return mobileFetch('/api/v1/chat-list/read', {
            method: 'POST',
            body: JSON.stringify(param)
        });
    }
    return Http.post<ChatListResponse>('/api/v1/chat-list/read', param);
};

// 删除聊天
export const deleteList = async (param: DeleteChatParams) => {
    if (isMobileDevice()) {
        return mobileFetch('/api/v1/chat-list/delete', {
            method: 'POST',
            body: JSON.stringify(param)
        });
    }
    return Http.post<ChatListResponse>('/api/v1/chat-list/delete', param);
}; 