# 私聊功能 API 文档

## 概述

私聊功能允许用户之间进行一对一的实时聊天。系统使用私聊房间（PrivateChatRoom）来管理私聊会话，支持消息存储、未读消息计数、实时消息推送等功能。

## 功能特性

- ✅ 创建或获取私聊房间
- ✅ 发送私聊消息
- ✅ 获取私聊消息历史
- ✅ 获取私聊房间列表
- ✅ 用户搜索和推荐
- ✅ WebSocket 实时消息推送
- ✅ 未读消息计数
- ✅ 消息已读状态管理

## API 接口

### 1. 私聊房间管理

#### 创建或获取私聊房间
```http
POST /api/v1/private-chat/room/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "target_user_id": "目标用户ID"
}
```

**响应示例：**
```json
{
  "code": 0,
  "msg": "获取成功",
  "data": {
    "roomId": "房间ID",
    "otherUser": {
      "id": "用户ID",
      "name": "用户名",
      "portrait": "头像URL",
      "isOnline": true
    },
    "unreadCount": 0,
    "lastMessage": "最后一条消息",
    "lastMessageTime": "2024-01-01T00:00:00.000Z",
    "createTime": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 获取私聊房间列表
```http
GET /api/v1/private-chat/rooms
Authorization: Bearer <token>
```

**响应示例：**
```json
{
  "code": 0,
  "msg": "获取成功",
  "data": [
    {
      "roomId": "房间ID",
      "otherUser": {
        "id": "用户ID",
        "name": "用户名",
        "portrait": "头像URL",
        "isOnline": true
      },
      "unreadCount": 2,
      "lastMessage": "最后一条消息",
      "lastMessageTime": "2024-01-01T00:00:00.000Z",
      "createTime": "2024-01-01T00:00:00.000Z",
      "updateTime": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### 删除私聊房间
```http
DELETE /api/v1/private-chat/room/{room_id}
Authorization: Bearer <token>
```

### 2. 私聊消息管理

#### 发送私聊消息
```http
POST /api/v1/private-chat/room/{room_id}/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "msg_content": "消息内容",
  "type": "text",
  "source": "web"
}
```

**消息类型：**
- `text`: 文本消息
- `image`: 图片消息
- `file`: 文件消息
- `voice`: 语音消息

#### 获取私聊消息历史
```http
GET /api/v1/private-chat/room/{room_id}/messages?index=0&num=30
Authorization: Bearer <token>
```

**查询参数：**
- `index`: 分页偏移量（默认：0）
- `num`: 每页数量（默认：30）

### 3. 用户搜索

#### 搜索用户
```http
GET /api/v1/user-search/search?keyword=搜索关键词&page=1&limit=20
Authorization: Bearer <token>
```

**查询参数：**
- `keyword`: 搜索关键词（支持用户名、账号、邮箱）
- `page`: 页码（默认：1）
- `limit`: 每页数量（默认：20）

#### 获取推荐用户
```http
GET /api/v1/user-search/recommended?limit=10
Authorization: Bearer <token>
```

#### 获取用户详情
```http
GET /api/v1/user-search/{user_id}
Authorization: Bearer <token>
```

## WebSocket 实时通信

### 连接
```javascript
const ws = new WebSocket('ws://localhost:3002?token=YOUR_TOKEN');
```

### 认证
```javascript
ws.send(JSON.stringify({
  type: 'auth',
  userId: 'USER_ID'
}));
```

### 发送私聊消息
```javascript
ws.send(JSON.stringify({
  type: 'private_message',
  room_id: 'ROOM_ID',
  msg_content: '消息内容',
  type: 'text',
  source: 'web'
}));
```

### 接收消息
```javascript
ws.on('message', (data) => {
  const message = JSON.parse(data);
  if (message.type === 'private_message') {
    console.log('收到私聊消息:', message.message);
  }
});
```

## 数据库表结构

### private_chat_room 表
```sql
CREATE TABLE private_chat_room (
  id VARCHAR(64) PRIMARY KEY COMMENT '私聊房间ID',
  user1_id VARCHAR(64) NOT NULL COMMENT '用户1的ID',
  user2_id VARCHAR(64) NOT NULL COMMENT '用户2的ID',
  last_message_id VARCHAR(64) COMMENT '最后一条消息ID',
  last_message_content TEXT COMMENT '最后一条消息内容',
  last_message_time DATETIME(3) COMMENT '最后一条消息时间',
  user1_unread_count INT DEFAULT 0 COMMENT '用户1未读消息数',
  user2_unread_count INT DEFAULT 0 COMMENT '用户2未读消息数',
  is_active BOOLEAN DEFAULT TRUE COMMENT '房间是否活跃',
  create_time DATETIME(3) NOT NULL COMMENT '创建时间',
  update_time DATETIME(3) NOT NULL COMMENT '更新时间',
  UNIQUE KEY unique_user_pair (user1_id, user2_id),
  KEY idx_user1_id (user1_id),
  KEY idx_user2_id (user2_id),
  KEY idx_update_time (update_time)
);
```

## 使用示例

### 前端集成示例

```javascript
// 1. 创建私聊房间
async function createPrivateChat(targetUserId) {
  const response = await fetch('/api/v1/private-chat/room/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ target_user_id: targetUserId })
  });
  return await response.json();
}

// 2. 发送私聊消息
async function sendPrivateMessage(roomId, message) {
  const response = await fetch(`/api/v1/private-chat/room/${roomId}/send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      msg_content: message,
      type: 'text',
      source: 'web'
    })
  });
  return await response.json();
}

// 3. 获取私聊消息
async function getPrivateMessages(roomId, index = 0, num = 30) {
  const response = await fetch(`/api/v1/private-chat/room/${roomId}/messages?index=${index}&num=${num}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
}

// 4. WebSocket 实时通信
const ws = new WebSocket(`ws://localhost:3002?token=${token}`);

ws.onopen = () => {
  // 认证
  ws.send(JSON.stringify({
    type: 'auth',
    userId: currentUserId
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'private_message') {
    // 处理私聊消息
    displayMessage(message);
  }
};

// 发送私聊消息
function sendPrivateMessageViaWS(roomId, content) {
  ws.send(JSON.stringify({
    type: 'private_message',
    room_id: roomId,
    msg_content: content,
    type: 'text',
    source: 'web'
  }));
}
```

## 错误码

| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 注意事项

1. 私聊房间是双向的，两个用户之间只会有一个房间
2. 消息发送后会自动更新房间的最后消息信息
3. 未读消息计数会在消息发送时自动增加
4. 用户查看消息后会自动标记为已读并清空未读计数
5. WebSocket 连接需要先进行认证才能发送消息
6. 私聊房间支持软删除（设置为不活跃状态）
