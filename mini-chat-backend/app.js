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
const userSearchRoutes = require('./routes/userSearch');
const { handleWebSocket } = require('./config/ws');

const app = express();
const server = http.createServer(app);
const wss = new Server({ server }); // 绑定WebSocket到HTTP服务器

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 确保所有 JSON 响应都设置正确的 Content-Type
app.use((req, res, next) => {
  // 保存原始的 json 方法
  const originalJson = res.json;
  
  // 重写 json 方法，确保设置 Content-Type 并验证响应格式
  res.json = function(data) {
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      
      // 验证响应格式，确保包含必要的字段
      if (data && typeof data === 'object') {
        // 如果响应没有 code 字段，添加默认值
        if (!data.hasOwnProperty('code')) {
          data.code = res.statusCode || 200;
        }
        // 如果响应没有 message 字段，添加默认值
        if (!data.hasOwnProperty('message') && !data.hasOwnProperty('msg')) {
          data.message = '操作成功';
        }
        // 统一 msg 为 message
        if (data.msg && !data.message) {
          data.message = data.msg;
          delete data.msg;
        }
        // 确保 data 字段存在
        if (!data.hasOwnProperty('data')) {
          data.data = [];
        }
        // 确保 data 不是 null
        if (data.data === null || data.data === undefined) {
          data.data = [];
        }
      }
    }
    return originalJson.call(this, data);
  };
  
  next();
});

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
app.use('/api/v1/user-search', userSearchRoutes);

// 404 处理（必须在错误处理之前）
app.use((req, res) => {
  // 确保设置正确的 Content-Type
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    data: []
  });
});

// 全局错误处理中间件（必须是最后一个中间件，需要4个参数）
app.use((err, req, res, next) => {
  console.error('=== 全局错误处理 ===');
  console.error('错误名称:', err.name);
  console.error('错误消息:', err.message);
  console.error('错误堆栈:', err.stack);
  console.error('请求路径:', req.method, req.originalUrl);
  console.error('请求查询参数:', req.query);
  console.error('请求体:', req.body);
  console.error('响应头是否已发送:', res.headersSent);
  
  // 检查响应是否已经发送，避免重复发送
  if (res.headersSent) {
    console.error('⚠️ 警告：响应已发送，无法发送错误响应');
    // 即使响应头已发送，也尝试结束响应（如果可能）
    if (!res.finished) {
      res.end();
    }
    return;
  }
  
  // 确保返回包含 data 字段的响应，避免前端收到空 data
  // 使用 try-catch 确保即使 JSON 序列化失败也能发送响应
  try {
    // 确保设置正确的 Content-Type
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    // 确定错误代码
    const errorCode = err.status || err.statusCode || 500;
    
    // 确定错误消息
    let errorMessage = '服务器内部错误';
    if (err.message) {
      errorMessage = err.message;
    } else if (err.name === 'ValidationError') {
      errorMessage = '数据验证失败';
    } else if (err.name === 'SequelizeDatabaseError') {
      errorMessage = '数据库操作失败';
    } else if (err.name === 'SequelizeValidationError') {
      errorMessage = '数据验证失败';
    }
    
    const errorResponse = {
      code: errorCode,
      message: errorMessage,
      data: [] // 确保 data 字段始终存在，避免前端访问 undefined
    };
    
    // 仅在开发环境添加详细错误信息
    if (process.env.NODE_ENV === 'development') {
      errorResponse.error = err.message;
      errorResponse.errorName = err.name;
      if (err.stack) {
        errorResponse.stack = err.stack.split('\n').slice(0, 5); // 只保留前5行堆栈
      }
    }
    
    console.error('发送错误响应:', JSON.stringify(errorResponse, null, 2));
    
    // 确保响应是有效的 JSON
    const jsonString = JSON.stringify(errorResponse);
    if (!jsonString || jsonString === 'null' || jsonString === 'undefined') {
      throw new Error('响应序列化失败');
    }
    
    res.status(errorCode).json(errorResponse);
  } catch (jsonError) {
    console.error('JSON 序列化失败:', jsonError);
    // 如果 JSON 序列化失败，发送最基本的响应
    try {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      const fallbackResponse = {
        code: 500,
        message: '服务器内部错误',
        data: []
      };
      res.status(500).json(fallbackResponse);
    } catch (finalError) {
      console.error('最终响应发送失败:', finalError);
      // 如果连这个都失败了，尝试发送纯文本
      if (!res.finished) {
        res.status(500).end('{"code":500,"message":"服务器内部错误","data":[]}');
      }
    }
  }
});

// 连接数据库并启动服务
// 先测试数据库连接
sequelize.authenticate()
  .then(() => {
    console.log('✅ 数据库连接测试成功');
    // 然后同步表结构
    return sequelize.sync({ force: false });
  })
  .then(() => {
    console.log('✅ 数据库表结构同步完成');
    server.listen(3002, '0.0.0.0', () => {
      console.log(`✅ 后端服务运行在 http://0.0.0.0:3002`);
    });
    // 初始化WebSocket
    handleWebSocket(wss);
  })
  .catch(err => {
    console.error('❌ 数据库连接失败:', err.message);
    console.error('错误详情:', {
      name: err.name,
      message: err.message,
      code: err.original?.code,
      sqlState: err.original?.sqlState
    });
    console.error('请检查：');
    console.error('1. MySQL 服务是否正在运行');
    console.error('2. 数据库配置是否正确（config/db.js）');
    console.error('3. 数据库用户是否有权限');
    console.error('4. 数据库名称是否存在');
    process.exit(1); // 数据库连接失败时退出程序
  });
