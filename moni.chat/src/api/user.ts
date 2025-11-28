import Http from '@/utils/axios'

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
    const token =localStorage.getItem('x-token') || localStorage.getItem('token');
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