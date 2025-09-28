import axios, { type InternalAxiosRequestConfig, type AxiosResponse, AxiosHeaders } from 'axios';
import { useGlobalStore } from '@/stores/module/useGlobalStore.js';
import router from '@/router';
import { ElMessage } from 'element-plus';
const SERVICE_URL = import.meta.env.VITE_HTTP_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:3002');
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

  static send<T>(config: InternalAxiosRequestConfig, _loading?: boolean, isBlob?: boolean): Promise<T> {
    const configs: InternalAxiosRequestConfig = Object.assign(
      {
        timeout: 30000,
        headers: new AxiosHeaders(),
      },
      config
    );
    return axios(configs)
      .then((res) => {
        if (isBlob) {
          return res as unknown as T; // 处理 Blob 类型
        }
        return res.data as T;
      })
      .catch((error) => {
        throw error;
      });
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