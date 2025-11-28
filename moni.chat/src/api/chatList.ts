import Http from '@/utils/axios'
import type { ChatListResponse, ReadMessageParams, DeleteChatParams } from '@/types/chatList'

// 检测移动端环境（改进版，更准确）
const isMobileDevice = () => {
    // 方法1: 检测 userAgent（包含常见移动设备标识）
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(userAgent);
    
    // 方法2: 检测触摸屏支持（移动设备通常有触摸屏）
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0;
    
    // 方法3: 检测屏幕尺寸（作为辅助判断）
    const isSmallScreen = window.innerWidth <= 768 || window.screen.width <= 768;
    
    // 综合判断：如果是移动端 UA 或者（有触摸屏且屏幕较小），则认为是移动端
    return isMobileUA || (hasTouchScreen && isSmallScreen);
};

// 获取服务URL
const getServiceUrl = () => {
    return isMobileDevice() ? 'http://10.33.100.78:3002' : 'http://10.33.100.78:3002';
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