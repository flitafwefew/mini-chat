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
    
    console.log('📡 移动端文件API请求:', fullUrl, defaultOptions);
    
    const response = await fetch(fullUrl, defaultOptions);
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }
    
    return response.json();
};

export const offer = async (param: any) => {
    if (isMobileDevice()) {
        return mobileFetch('/api/v1/file/offer', {
            method: 'POST',
            body: JSON.stringify(param)
        });
    }
    return Http.post('/api/v1/file/offer', param);
};//发送WebRTC中的offer，发起文件传输

export const answer = async (param: any) => {
    if (isMobileDevice()) {
        return mobileFetch('/api/v1/file/answer', {
            method: 'POST',
            body: JSON.stringify(param)
        });
    }
    return Http.post('/api/v1/file/answer', param);
};//发送WebRTC中的answer，响应offer

export const candidate = async (param: any) => {
    if (isMobileDevice()) {
        return mobileFetch('/api/v1/file/candidate', {
            method: 'POST',
            body: JSON.stringify(param)
        });
    }
    return Http.post('/api/v1/file/candidate', param);
};//发送WebRTC中的candidate，用于建立网络连接的候选地址信息

export const cancel = async (param: any) => {
    if (isMobileDevice()) {
        return mobileFetch('/api/v1/file/cancel', {
            method: 'POST',
            body: JSON.stringify(param)
        });
    }
    return Http.post('/api/v1/file/cancel', param);
};

export const invite = async (param: any) => {
    if (isMobileDevice()) {
        return mobileFetch('/api/v1/file/invite', {
            method: 'POST',
            body: JSON.stringify(param)
        });
    }
    return Http.post('/api/v1/file/invite', param);
};

export const accept = async (param: any) => {
    if (isMobileDevice()) {
        return mobileFetch('/api/v1/file/accept', {
            method: 'POST',
            body: JSON.stringify(param)
        });
    }
    return Http.post('/api/v1/file/accept', param);
};

export const upload = async (param: any) => {
    if (isMobileDevice()) {
        // 文件上传需要 FormData，特殊处理
        const formData = param instanceof FormData ? param : new FormData();
        if (!(param instanceof FormData)) {
            Object.keys(param).forEach(key => {
                formData.append(key, param[key]);
            });
        }
        
        const token = localStorage.getItem('x-token') || localStorage.getItem('token');
        const fullUrl = `${getServiceUrl()}/api/v1/common/uploadImage`;
        
        const response = await fetch(fullUrl, {
            method: 'POST',
            headers: {
                ...(token && { 'x-token': token }),
            },
            body: formData
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }
        
        return response.json();
    }
    return Http.post('/api/v1/common/uploadImage', param);
};