require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('ws');
const sequelize = require('./config/db');
const userRoutes = require('./routes/user');
const messageRoutes = require('./routes/message');
const fileRoutes = require('./routes/fileRoutes');
const friendRoutes = require('./routes/friend');
const chatListRoutes = require('./routes/chatList');
const chatGroupRoutes = require('./routes/chatGroup');
const privateChatRoutes = require('./routes/privateChat');
const fileUploadRoutes = require('./routes/fileUpload');
const webrtcRoutes = require('./routes/webrtc');
const videoCallRoutes = require('./routes/videoCall');
const { handleWebSocket } = require('./config/ws');

const app = express();
const server = http.createServer(app);
const wss = new Server({ server }); // 绑定WebSocket到HTTP服务器

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static('uploads'));

// 路由
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/message', messageRoutes);
app.use('/api/v1/file', fileRoutes);
app.use('/api/v1/friend', friendRoutes);
app.use('/api/v1/chat-list', chatListRoutes);
app.use('/api/v1/chat-group', chatGroupRoutes);
app.use('/api/v1/private-chat', privateChatRoutes);
app.use('/api/v1/common', fileUploadRoutes);
app.use('/api/v1/file', webrtcRoutes);
app.use('/api/v1/call', videoCallRoutes);

// 连接数据库并启动服务
sequelize.sync({ force: false }) // 不自动同步表结构
  .then(() => {
    console.log('数据库连接成功');
    server.listen(3002, '0.0.0.0', () => {
      console.log(`后端服务运行在 http://0.0.0.0:3002`);
    });
    // 初始化WebSocket
    handleWebSocket(wss);
  })
  .catch(err => console.error('数据库连接失败:', err));
