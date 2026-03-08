# Mini-Chat 项目配置与说明

本项目是一个功能齐全的即时通讯（IM）系统，包含前端单页面应用、后端 API 服务以及集成的 AI 助手。

## 📸 界面展示

### 1. 登录与注册
![登录界面](https://img2.imgtp.com/2026/03/08/login.png)
*图 1：登录界面。提供用户名密码输入、忘记密码跳转及注册新账号入口。*

### 2. 聊天主界面
![聊天界面](https://img2.imgtp.com/2026/03/08/chat.png)
*图 2：聊天核心窗口。左侧为消息列表（支持群聊与私聊），中间为对话区域，右侧为群成员/个人详情，支持 AI 助手实时互动。*

---

## 🛠️ 技术栈清单

### 前端 (moni.chat)
- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **语言**: TypeScript
- **状态管理**: Pinia
- **路由**: Vue Router
- **实时通信**: WebSocket / Socket.io
- **核心组件**:
  - `ChatPage.vue`: 聊天主视图
  - `LoginPage.vue`: 身份验证页面
  - `AI助手`: 集成豆包（Doubao）AI 模型提供的智能对话能力

### 后端 (mini-chat-backend)
- **运行环境**: Node.js
- **Web 框架**: Express
- **数据库 ORM**: Sequelize
- **功能模块**:
  - **用户系统**: 登录、注册、个人信息编辑
  - **好友/群组**: 加好友、创建群聊、成员管理
  - **消息系统**: 私聊、群聊消息存储与转发
  - **文件处理**: 头像上传、附件传输
  - **AI 集成**: 对接火山引擎（Ark）提供的 AI 能力（`aiService.js`）

---

## 🚀 快速启动方案

### 1. 环境准备
确保已安装 Node.js (v16+) 和相应的数据库环境。

### 2. 后端配置 (`mini-chat-backend`)
1. 进入目录: `cd mini-chat-backend`
2. 安装依赖: `npm install`
3. 配置环境变量: 修改 `.env` 或 `db.js` 中的数据库连接信息。
4. 初始化数据库: 支持自动迁移（Migrations）。
5. 启动服务: `npm start` 或 `node server.js`

### 3. 前端配置 (`moni.chat`)
1. 进入目录: `cd moni.chat`
2. 安装依赖: `npm install`
3. 启动开发服务器: `npm run dev`
4. 访问地址: `http://localhost:5173`

---

## 🤖 AI 助手配置说明

后端调用了豆包 AI 服务，配置位于 `mini-chat-backend/services/aiService.js`:
- **API 地址**: `https://ark.cn-beijing.volces.com/api/v3/chat/completions`
- **模型端点**: `ep-20251028174429-d7w5j` (Doubao)
- **主要功能**: 自动回复用户提问，支持上下文关联。

---

## 📂 项目结构概览

```
mini-chat/
├── mini-chat-backend/      # 后端逻辑
│   ├── controllers/        # 业务逻辑控制器
│   ├── models/             # 数据库模型 (User, Message, etc.)
│   ├── routes/             # API 路由
│   └── services/           # AI 及第三方服务
└── moni.chat/              # 前端 Vue 应用
    ├── src/
    │   ├── api/            # 接口请求封装
    │   ├── components/     # UI 复用组件
    │   └── view/           # 页面视图 (ChatPage, LoginPage)
```

---

*说明：本文档根据项目实际代码结构及提供的界面截图自动生成。*
