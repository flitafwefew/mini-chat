import request from './request'

// 好友相关API接口
export interface Friend {
  id: string
  account: string
  name: string
  portrait: string
  sex: string
  signature: string
  is_online: boolean
  last_opt_time: string
  add_time: string
}

export interface SearchUser {
  id: string
  account: string
  name: string
  portrait: string
  sex: string
  signature: string
  is_online: boolean
}

export interface FriendRequest {
  id: string
  userId: string
  account: string
  name: string
  portrait?: string
  avatar?: string
  signature?: string
  message?: string
  createTime?: string
}

export interface CommonResponse<T = any> {
  code: number
  message: string
  data: T
}

// 添加好友（直接添加）
export const addFriend = (friendId: string) => {
  return request.post<CommonResponse>('/v1/friend/add', { friendId })
}

// 删除好友
export const deleteFriend = (friendId: string) => {
  return request.delete<CommonResponse>(`/v1/friend/delete/${friendId}`)
}

// 获取好友列表
export const getFriendList = () => {
  return request.get<CommonResponse<Friend[]>>('/v1/friend/list')
}

// 搜索用户
export const searchUsers = (keyword: string) => {
  return request.get<CommonResponse<SearchUser[]>>(`/v1/friend/search?keyword=${encodeURIComponent(keyword)}`)
}

// 检查是否为好友
export const checkIsFriend = (friendId: string) => {
  return request.get<CommonResponse<{ isFriend: boolean }>>(`/v1/friend/check/${friendId}`)
}

// 发送好友申请
export const sendFriendRequest = (friendId: string, message = '') => {
  return request.post<CommonResponse>(`/v1/friend/request`, { friendId, message })
}

// 获取好友申请列表
export const getFriendRequests = () => {
  return request.get<CommonResponse<FriendRequest[]>>('/v1/friend/requests')
}

// 接受好友申请
export const acceptFriendRequest = (friendId: string) => {
  return request.post<CommonResponse>('/v1/friend/accept', { friendId })
}

// 拒绝好友申请
export const rejectFriendRequest = (friendId: string) => {
  return request.post<CommonResponse>('/v1/friend/reject', { friendId })
}
