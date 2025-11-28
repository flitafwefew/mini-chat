import axios from 'axios'
import { ElMessage } from 'element-plus'

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
  return isMobileUA || (hasTouchScreen && isSmallScreen);
}

// 获取服务URL的函数
function getServiceUrl() {
  const isMobile = isMobileDevice();
  return import.meta.env.VITE_API_BASE_URL || (isMobile ? 'http://192.168.185.224:3002' : (import.meta.env.DEV ? '/api' : 'http://192.168.185.224:3002'));
}

// 创建axios实例
const request = axios.create({
  baseURL: getServiceUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 添加token - 修复token获取问题
    const token = localStorage.getItem('x-token') || localStorage.getItem('token')
    if (token) {
      config.headers['x-token'] = token
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      if (status === 401) {
        // token过期，清除本地存储并跳转到登录页
        localStorage.removeItem('x-token')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      } else {
        ElMessage.error(data?.msg || '请求失败')
      }
    } else {
      ElMessage.error('网络错误')
    }
    return Promise.reject(error)
  }
)

export default request
