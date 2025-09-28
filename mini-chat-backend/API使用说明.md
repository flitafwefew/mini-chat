# 聊天应用 API 使用说明

## 已修复的问题

### 1. 数据库字符集冲突
- 修复了群聊查询中的字符集冲突错误
- 简化了数据库查询，避免复杂的关联查询

### 2. WebRTC 取消传输
- 修复了取消文件传输时 userId 为空的问题
- 添加了参数验证

## 新增功能

### 1. 群聊功能

#### 创建群聊
```http
POST /api/v1/chat-list/groups
Content-Type: application/json
x-token: {用户token}

{
  "name": "群聊名称",
  "description": "群聊描述",
  "avatar": "群聊头像URL（可选）",
  "member_ids": ["user-001", "user-002"] // 要添加的成员ID列表
}
```

#### 获取群聊列表
```http
GET /api/v1/chat-list/list/group
x-token: {用户token}
```

### 2. 好友功能

#### 发送好友申请
```http
POST /api/v1/friend/request
Content-Type: application/json
x-token: {用户token}

{
  "friendId": "要添加的好友ID",
  "message": "申请消息（可选）"
}
```

#### 接受好友申请
```http
POST /api/v1/friend/accept
Content-Type: application/json
x-token: {用户token}

{
  "friendId": "申请者ID"
}
```

#### 拒绝好友申请
```http
POST /api/v1/friend/reject
Content-Type: application/json
x-token: {用户token}

{
  "friendId": "申请者ID"
}
```

#### 获取好友申请列表
```http
GET /api/v1/friend/requests
x-token: {用户token}
```

#### 直接添加好友（用于测试）
```http
POST /api/v1/friend/add
Content-Type: application/json
x-token: {用户token}

{
  "friendId": "要添加的好友ID"
}
```

#### 获取好友列表
```http
GET /api/v1/friend/list
x-token: {用户token}
```

### 3. 文件上传功能

#### 上传图片
```http
POST /api/v1/common/uploadImage
Content-Type: multipart/form-data
x-token: {用户token}

file: {图片文件}
```

#### 上传文件
```http
POST /api/v1/common/uploadFile
Content-Type: multipart/form-data
x-token: {用户token}

file: {文件}
```

#### 获取文件
```http
GET /api/v1/common/{filename}
```

### 4. WebRTC 文件传输

#### 发送文件传输邀请
```http
POST /api/v1/file/invite
Content-Type: application/json
x-token: {用户token}

{
  "targetId": "目标用户ID",
  "fileName": "文件名",
  "fileSize": 文件大小
}
```

#### 接受文件传输
```http
POST /api/v1/file/accept
Content-Type: application/json
x-token: {用户token}

{
  "targetId": "发送者ID"
}
```

#### 取消文件传输
```http
POST /api/v1/file/cancel
Content-Type: application/json
x-token: {用户token}

{
  "targetId": "目标用户ID"
}
```

### 5. 视频通话功能

#### 发送视频通话邀请
```http
POST /api/v1/call/invite
Content-Type: application/json
x-token: {用户token}

{
  "targetId": "目标用户ID"
}
```

#### 接受视频通话
```http
POST /api/v1/call/accept
Content-Type: application/json
x-token: {用户token}

{
  "targetId": "发起者ID"
}
```

#### 挂断通话
```http
POST /api/v1/call/hangup
Content-Type: application/json
x-token: {用户token}

{
  "targetId": "对方用户ID"
}
```

## 前端使用方法

### 1. 创建群聊
在前端页面中，可以添加一个"创建群聊"按钮，点击后弹出对话框让用户输入群聊名称和选择成员。

### 2. 添加好友
- 添加"搜索用户"功能，通过用户ID或用户名搜索
- 添加"发送好友申请"功能
- 添加"好友申请列表"页面，显示待处理的好友申请
- 添加"接受/拒绝"按钮

### 3. 文件传输
- 在聊天界面添加文件上传按钮
- 支持拖拽上传文件
- 显示文件传输进度

### 4. 视频通话
- 在聊天界面添加视频通话按钮
- 支持接受/拒绝通话邀请
- 显示通话界面

## 测试

运行测试脚本：
```bash
cd mini-chat-backend
node test-new-features.js
```

## 注意事项

1. 所有API都需要在请求头中包含 `x-token` 进行身份验证
2. 文件上传需要设置正确的 `Content-Type: multipart/form-data`
3. WebRTC 功能需要前端配合实现
4. 群聊创建后会自动为所有成员创建聊天记录
5. 好友申请需要对方接受才能建立好友关系
