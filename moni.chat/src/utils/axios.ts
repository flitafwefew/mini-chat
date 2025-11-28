import axios, { type InternalAxiosRequestConfig, type AxiosResponse, AxiosHeaders } from 'axios';
import { useGlobalStore } from '@/stores/module/useGlobalStore.js';
import router from '@/router';
import { ElMessage } from 'element-plus';
// 检测移动端环境的函数（改进版，更准确）
function isMobileDevice() {
  // 方法1: 检测 userAgent（包含常见移动设备标识）
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(userAgent);
  
  // 方法2: 检测触摸屏支持（移动设备通常有触摸屏）
  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0;
  
  // 方法3: 检测屏幕尺寸（作为辅助判断）
  const isSmallScreen = window.innerWidth <= 768 || window.screen.width <= 768;
  
  // 综合判断：如果是移动端 UA 或者（有触摸屏且屏幕较小），则认为是移动端
  const isMobile = isMobileUA || (hasTouchScreen && isSmallScreen);
  
  // 排除平板（如果需要区分手机和平板，可以单独处理）
  // const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent);
  
  return isMobile;
}

// 根据运行环境解析后端地址
function getServiceUrl() {
  // 1. 优先使用 .env 中显式配置
  if (import.meta.env.VITE_HTTP_URL) {
    return import.meta.env.VITE_HTTP_URL;
  }

  const hostname = window.location.hostname || 'localhost';
  const protocol = window.location.protocol || 'http:';
  const isMobile = isMobileDevice();

  // 2. 本地开发：桌面端继续走 Vite 代理（/api），移动端直连 3002
  if (import.meta.env.DEV) {
    return isMobile
      ? `${protocol}//${hostname}:3002`
      : '/api';
  }

  // 3. 生产环境默认使用当前页面的 origin
  const port = window.location.port ? `:${window.location.port}` : '';
  return `${protocol}//${hostname}${port}`;
}

const SERVICE_URL = getServiceUrl();
export { SERVICE_URL };

// 请求拦截器
axios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.headers = config.headers || new AxiosHeaders();
  config.headers.set('x-token', localStorage.getItem('x-token'));
  return config;
});

// 响应拦截器
axios.interceptors.response.use(
  (response: AxiosResponse) => {
    const globalStore = useGlobalStore();
    if (response.data.code === 401) {
      globalStore.setGlobalDialog(true, '认证失效', '您的登录过期，请重新登录');
      ElMessage.error('认证失效，请重新登录');
      localStorage.removeItem('x-token');
      router.push('/login');
    }
    if (response.data.code === 403) {
      globalStore.setGlobalDialog(true, '请求失败', '您的账号已在其它地方登录，请重新登录');
      ElMessage.error('您的账号已在其它地方登录，请重新登录');
      localStorage.removeItem('x-token');
      router.push('/login');
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.data) {
      // 如果后端返回了标准格式的错误响应，直接返回
      if (error.response.data.code && error.response.data.msg) {
        return Promise.resolve(error.response);
      }
      return Promise.reject(error.response.data);
    } else {
      return Promise.reject(error.message);
    }
  }
);

export default class Http {

  // 重试配置
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1秒

  // 带重试机制的请求方法
  private static async sendWithRetry<T>(config: InternalAxiosRequestConfig, _loading?: boolean, isBlob?: boolean): Promise<T> {
    let lastError: any;
    
    // 检测移动端环境（只检测一次）
    const isMobile = isMobileDevice();
    if (process.env.NODE_ENV === 'development') {
      const userAgent = navigator.userAgent || '';
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const screenWidth = window.innerWidth;
      console.log('📱 移动端检测详情:', {
        结果: isMobile,
        userAgent: userAgent.substring(0, 50) + '...',
        触摸屏支持: hasTouch,
        屏幕宽度: screenWidth,
        maxTouchPoints: navigator.maxTouchPoints
      });
    } else {
      console.log('📱 移动端检测结果:', isMobile);
    }
    
    for (let attempt = 1; attempt <= Http.MAX_RETRIES; attempt++) {
      try {
        console.log(`🔄 网络请求尝试 ${attempt}/${Http.MAX_RETRIES}:`, config.url);
        
        const configs: InternalAxiosRequestConfig = Object.assign(
          {
            timeout: isMobile ? 15000 : 10000, // 移动端使用适中的超时时间
            headers: new AxiosHeaders(),
            // 添加更多网络优化配置
            validateStatus: (status: number) => status < 500, // 只对5xx错误重试
            maxRedirects: 5,
            // 添加移动端优化
            withCredentials: false,
            // 移动端特殊配置
            ...(isMobile && {
              // 移动端网络优化
              maxContentLength: 50 * 1024 * 1024, // 50MB
              maxBodyLength: 50 * 1024 * 1024, // 50MB
              // 禁用某些可能导致移动端问题的功能
              decompress: true
            })
          },
          config
        );

        // 移动端特殊处理
        if (isMobile) {
          console.log('📱 应用移动端优化配置');
          // 添加移动端特定的请求头
          configs.headers?.set('X-Requested-With', 'XMLHttpRequest');
          configs.headers?.set('X-Mobile-Client', 'true');
          configs.headers?.set('User-Agent', navigator.userAgent);
          // 移动端网络优化
          configs.headers?.set('Connection', 'keep-alive');
          configs.headers?.set('Cache-Control', 'no-cache');
        }

        const response = await axios(configs);
        
        if (isBlob) {
          return response as unknown as T;
        }
        return response.data as T;
        
      } catch (error: any) {
        lastError = error;
        console.warn(`⚠️ 网络请求失败 (尝试 ${attempt}/${Http.MAX_RETRIES}):`, error.message);
        
        // 移动端特殊错误处理
        if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
          console.log('📱 检测到移动端网络错误，尝试特殊处理');
          // 移动端网络错误等待时间稍长
          await new Promise(resolve => setTimeout(resolve, Http.RETRY_DELAY * attempt * 1.5));
        } else {
          // 等待后重试
          await new Promise(resolve => setTimeout(resolve, Http.RETRY_DELAY * attempt));
        }
        
        // 如果是最后一次尝试，直接抛出错误
        if (attempt === Http.MAX_RETRIES) {
          break;
        }
      }
    }
    
    throw lastError;
  }

  static send<T>(config: InternalAxiosRequestConfig, _loading?: boolean, isBlob?: boolean): Promise<T> {
    return Http.sendWithRetry<T>(config, _loading, isBlob);
  }

  static post<T>(url: string, params: Record<string, any> = {}, loading?: boolean): Promise<T> {
    const config: InternalAxiosRequestConfig = {
      method: 'post',
      url: SERVICE_URL + url,
      data: params,
      headers: new AxiosHeaders(),
    };
    return Http.send<T>(config, loading);
  }

  static formData<T>(url: string, params: Record<string, any> = {}, loading?: boolean): Promise<T> {
    const headers = new AxiosHeaders();
    headers.set('Content-Type', 'application/x-www-form-urlencoded');
    const config: InternalAxiosRequestConfig = {
      method: 'post',
      url: SERVICE_URL + url,
      data: params,
      headers,
    };
    return Http.send<T>(config, loading);
  }

  static delete<T>(url: string, params: Record<string, any> = {}, loading?: boolean): Promise<T> {
    const config: InternalAxiosRequestConfig = {
      method: 'delete',
      url: SERVICE_URL + url,
      data: params,
      headers: new AxiosHeaders(),
    };
    return Http.send<T>(config, loading);
  }

  static put<T>(url: string, params: Record<string, any> = {}, loading?: boolean): Promise<T> {
    const config: InternalAxiosRequestConfig = {
      method: 'put',
      url: SERVICE_URL + url,
      data: params,
      headers: new AxiosHeaders(),
    };
    return Http.send<T>(config, loading);
  }

  static download<T>(url: string, params: Record<string, any> = {}, loading?: boolean): Promise<T> {
    const config: InternalAxiosRequestConfig = {
      responseType: 'blob',
      method: 'post',
      url: SERVICE_URL + url,
      data: params,
      headers: new AxiosHeaders(),
    };
    const isBlob = true;
    return Http.send<T>(config, loading, isBlob);
  }

  static get<T>(url: string, params: Record<string, any> = {}, loading?: boolean): Promise<T> {
    const urlParams: string[] = [];
    Object.keys(params).forEach((key) => {
      urlParams.push(`${key}=${encodeURIComponent(params[key])}`);
    });

    const fullUrl = urlParams.length ? `${SERVICE_URL + url}?${urlParams.join('&')}` : SERVICE_URL + url;
    console.log('📡 Http.get:', fullUrl)
    
    const config: InternalAxiosRequestConfig = {
      url: fullUrl,
      params: {
        randomTime: new Date().getTime(),
      },
      headers: new AxiosHeaders(),
    };
    return Http.send<T>(config, loading);
  }

  static get2<T>(url: string, params: Record<string, any> = {}, loading?: boolean): Promise<T> {
    const config: InternalAxiosRequestConfig = {
      method: 'post',
      url: SERVICE_URL + url,
      data: params,
      params: {
        randomTime: new Date().getTime(),
      },
      headers: new AxiosHeaders(),
    };
    return Http.send<T>(config, loading);
  }

  static post2<T>(url: string, params: Record<string, any> = {}, loading?: boolean): Promise<T> {
    const headers = new AxiosHeaders();
    headers.set('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8');
    const config: InternalAxiosRequestConfig = {
      method: 'post',
      url: SERVICE_URL + url,
      headers,
      data: params,
    };
    return Http.send<T>(config, loading);
  }
}