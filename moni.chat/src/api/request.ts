import axios from 'axios'
import { ElMessage } from 'element-plus'

// 检测移动端环境的函数
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 获取服务URL的函数
function getServiceUrl() {
  const isMobile = isMobileDevice();
  return import.meta.env.VITE_API_BASE_URL || (isMobile ? 'http://10.33.9.159:3002' : (import.meta.env.DEV ? '/api' : 'http://10.33.9.159:3002'));
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
