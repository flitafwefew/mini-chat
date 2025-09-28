# Mini Chat 前后端联调项目

这是一个基于 Vue 3 + Node.js + MySQL 的实时聊天应用，支持用户注册、登录、实时消息发送、WebSocket 通信等功能。

## 项目结构

```
33333/
├── mini-chat-backend/          # 后端服务
│   ├── config/                 # 配置文件
│   │   ├── db.js              # 数据库配置
│   │   └── ws.js              # WebSocket配置
│   ├── controllers/            # 控制器
│   │   ├── authController.js   # 认证控制器
│   │   └── messageController.js # 消息控制器
│   ├── middleware/             # 中间件
│   │   └── auth.js            # JWT认证中间件
│   ├── models/                 # 数据模型
│   │   ├── User.js            # 用户模型
│   │   ├── Message.js         # 消息模型
│   │   ├── ChatGroup.js       # 群组模型
│   │   ├── ChatList.js        # 聊天列表模型
│   │   └── Friend.js          # 好友模型
│   ├── routes/                 # 路由
│   │   ├── user.js            # 用户路由
│   │   └── message.js         # 消息路由
│   ├── aql/                   # 数据库文件
│   │   └── minichat.sql       # 数据库结构
│   ├── server.js              # 服务器入口
│   ├── app.js                 # 应用配置
│   ├── start.bat              # Windows启动脚本
│   ├── start.sh               # Linux/Mac启动脚本
│   └── package.json           # 依赖配置
└── moni.chat/                 # 前端应用
    ├── src/
    │   ├── api/               # API接口
    │   ├── components/        # 组件
    │   ├── stores/            # 状态管理
    │   ├── types/             # 类型定义
    │   ├── utils/             # 工具函数
    │   └── views/             # 页面
    ├── vite.config.ts         # Vite配置
    └── package.json           # 依赖配置
```

## 技术栈

### 后端
- **Node.js** - 运行环境
- **Express** - Web框架
- **Sequelize** - ORM数据库操作
- **MySQL** - 数据库
- **WebSocket** - 实时通信
- **JWT** - 身份认证
- **bcryptjs** - 密码加密

### 前端
- **Vue 3** - 前端框架
- **TypeScript** - 类型支持
- **Vite** - 构建工具
- **Element Plus** - UI组件库
- **Pinia** - 状态管理
- **Axios** - HTTP客户端

## 功能特性

### 用户功能
- ✅ 用户注册/登录
- ✅ JWT身份认证
- ✅ 用户信息管理
- ✅ 在线状态管理

### 聊天功能
- ✅ 实时消息发送/接收
- ✅ 聊天记录存储
- ✅ 聊天列表管理
- ✅ 消息状态管理（已发送/已读）
- ✅ 正在输入状态显示

### 技术特性
- ✅ WebSocket实时通信
- ✅ 数据库持久化存储
- ✅ 前后端类型安全
- ✅ 错误处理和重连机制
- ✅ 心跳保活机制

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- MySQL >= 8.0
- npm 或 yarn

### 1. 数据库准备

1. 创建MySQL数据库：
```sql
CREATE DATABASE mini_chat CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
```

2. 导入数据库结构：
```bash
mysql -u root -p mini_chat < mini-chat-backend/aql/minichat.sql
```

### 2. 后端启动

```bash
cd mini-chat-backend

# 安装依赖
npm install

# 方式1: 使用启动脚本（推荐）
# Windows
start.bat

# Linux/Mac
chmod +x start.sh
./start.sh

# 方式2: 手动启动
npm run dev
```

后端服务将在 `http://localhost:3000` 启动

### 3. 前端启动

```bash
cd moni.chat

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端应用将在 `http://localhost:5173` 启动

## API接口

### 用户相关
- `POST /api/v1/user/register` - 用户注册
- `POST /api/v1/user/login` - 用户登录
- `POST /api/v1/user/logout` - 用户登出
- `GET /api/v1/user/info` - 获取用户信息
- `PUT /api/v1/user/info` - 更新用户信息

### 消息相关
- `POST /api/v1/message/send` - 发送消息
- `GET /api/v1/message/list` - 获取聊天记录
- `GET /api/v1/message/chat-list` - 获取聊天列表
- `POST /api/v1/message/mark-read` - 标记消息已读

### WebSocket
- 连接地址: `ws://localhost:3000/ws?token={jwt_token}`
- 支持消息类型: `chat`, `typing`, `ping`

## 环境变量

### 后端环境变量
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=mini_chat
DB_USER=root
DB_PASSWORD=123456
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=development
```

### 前端环境变量
```env
VITE_HTTP_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

## 数据库表结构

### 主要表
- `user` - 用户表
- `message` - 消息表
- `chat_list` - 聊天列表
- `friend` - 好友关系表
- `chat_group` - 群组表
- `chat_group_member` - 群成员表

## 开发说明

### 后端开发
1. 模型定义在 `models/` 目录
2. 控制器在 `controllers/` 目录
3. 路由在 `routes/` 目录
4. 中间件在 `middleware/` 目录

### 前端开发
1. API接口在 `src/api/` 目录
2. 组件在 `src/components/` 目录
3. 状态管理在 `src/stores/` 目录
4. 类型定义在 `src/types/` 目录

## 部署说明

### 生产环境部署
1. 修改环境变量为生产环境配置
2. 构建前端项目: `npm run build`
3. 使用PM2等工具管理Node.js进程
4. 配置Nginx反向代理
5. 配置SSL证书（HTTPS）

## 常见问题

### 1. 数据库连接失败
- 检查MySQL服务是否启动
- 确认数据库配置信息正确
- 检查数据库用户权限

### 2. WebSocket连接失败
- 检查后端服务是否启动
- 确认JWT token是否有效
- 检查防火墙设置

### 3. 前端API调用失败
- 检查后端服务地址配置
- 确认CORS设置正确
- 检查网络连接

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License
