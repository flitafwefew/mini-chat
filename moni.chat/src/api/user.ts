import Http from '@/utils/axios'

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
    
    console.log('📡 移动端用户API请求:', fullUrl, defaultOptions);
    
    const response = await fetch(fullUrl, defaultOptions);
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }
    
    return response.json();
};

export const list = async () => {
    if (isMobileDevice()) {
        return mobileFetch('/api/v1/user/list');
    }
    return Http.get('/api/v1/user/list');
};

export const listMap = async () => {
    console.log('🌐 调用 listMap API...')
    if (isMobileDevice()) {
        return mobileFetch('/api/v1/user/list/map');
    }
    return Http.get('/api/v1/user/list/map');//获取所有用户信息
}

export const onlineWeb = async () => {
    if (isMobileDevice()) {
        return mobileFetch('/api/v1/user/online/web');
    }
    return Http.get('/api/v1/user/online/web');
};

export const update = async (param: any) => {
    if (isMobileDevice()) {
        return mobileFetch('/api/v1/user/update', {
            method: 'POST',
            body: JSON.stringify(param)
        });
    }
    return Http.post('/api/v1/user/update', param);
};