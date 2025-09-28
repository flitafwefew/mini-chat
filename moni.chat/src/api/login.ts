import Http from '@/utils/axios';
import type { LoginResponse, RegisterResponse, CodeResponse, UserInfo } from '@/types/login';

// 用户登录
export const login = (data: { account: string; password: string }) => 
  Http.post<LoginResponse>('/api/v1/user/login', data);

// 用户注册
export const register = (data: { 
  account: string; 
  name: string; 
  password: string; 
  email?: string; 
  phone?: string; 
}) => 
  Http.post<RegisterResponse>('/api/v1/user/register', data);

// 获取用户信息
export const getUserInfo = () => 
  Http.get<UserInfo>('/api/v1/user/info');

// 更新用户信息
export const updateUserInfo = (data: Partial<UserInfo>) => 
  Http.put<{ code: number; msg: string; data: UserInfo }>('/api/v1/user/info', data);

// 用户登出
export const logout = () => 
  Http.post<{ code: number; msg: string; data: null }>('/api/v1/user/logout');

// 获取验证码
export const getCode = (data: { email: string }) => 
  Http.post<CodeResponse>('/api/v1/user/send-code', data);