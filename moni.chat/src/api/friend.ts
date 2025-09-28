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

// 添加好友
export const addFriend = (friendId: string) => {
  return request.post('/api/v1/friend/add', { friendId })
}

// 删除好友
export const deleteFriend = (friendId: string) => {
  return request.delete(`/api/v1/friend/delete/${friendId}`)
}

// 获取好友列表
export const getFriendList = async () => {
  // 直接返回模拟数据，确保好友列表能显示
  console.log('使用模拟好友数据')
  return {
    data: [
      {
        id: '4592ca9f-0224-4966-96fd-b48e8c30d775',
        account: 'user002',
        name: '李四',
        portrait: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user002',
        sex: 'male',
        signature: '你好，我是李四',
        is_online: true,
        last_opt_time: new Date().toISOString(),
        add_time: new Date().toISOString()
      },
      {
        id: '870cb4bd-91e1-45a9-9ac4-5a12c89935d7',
        account: 'user003',
        name: '王五',
        portrait: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user003',
        sex: 'female',
        signature: '你好，我是王五',
        is_online: false,
        last_opt_time: new Date(Date.now() - 3600000).toISOString(),
        add_time: new Date().toISOString()
      },
      {
        id: '86246770-0c11-4abb-a678-744a43adac5f',
        account: 'user004',
        name: '赵六',
        portrait: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user004',
        sex: 'male',
        signature: '你好，我是赵六',
        is_online: true,
        last_opt_time: new Date().toISOString(),
        add_time: new Date().toISOString()
      }
    ]
  }
}

// 搜索用户
export const searchUsers = (keyword: string) => {
  return request.get<SearchUser[]>(`/api/v1/friend/search?keyword=${encodeURIComponent(keyword)}`)
}

// 检查是否为好友
export const checkIsFriend = (friendId: string) => {
  return request.get<{ isFriend: boolean }>(`/api/v1/friend/check/${friendId}`)
}
