const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const sequelize = require('./config/db');
const { Op } = require('sequelize');
require('dotenv').config();

// 初始化模型关联
require('./models/associations');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

// 添加WebSocket服务器事件监听
wss.on('listening', () => {
  console.log('WebSocket服务器已启动，监听路径: /ws');
});

wss.on('error', (error) => {
  console.error('WebSocket服务器错误:', error);
});

// 中间件
app.use(cors());
app.use(express.json());

// 添加请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// 添加错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    code: 500,
    msg: '服务器内部错误',
    data: null
  });
});

// 路由
app.use('/api/v1/user', require('./routes/user'));
app.use('/api/v1/message', require('./routes/message'));
app.use('/api/v1/chat-list', require('./routes/chatList'));
app.use('/api/v1/chat-group', require('./routes/chatGroup'));
app.use('/api/v1/file', require('./routes/fileRoutes'));
app.use('/api/v1/private-chat', require('./routes/privateChat'));
app.use('/api/v1/user-search', require('./routes/userSearch'));
app.use('/api/v1/call', require('./routes/videoCall'));
app.use('/api/v1/webrtc', require('./routes/webrtc'));

// 存储用户连接映射
const userConnections = new Map();

// 将userConnections传递给videoCallController
const videoCallController = require('./controllers/videoCallController');
videoCallController.setUserConnections(userConnections);

// WebSocket 连接
wss.on('connection', (ws, req) => {
  console.log('WebSocket 客户端连接');
  
  // 解析 token 参数
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');
  
  if (!token) {
    ws.close(1008, 'Token required');
    return;
  }
  
  // 验证 token 并解析用户ID
  console.log('Token:', token);
  
  // 存储用户ID和连接的关系
  let userId = null;
  
  try {
    // 解析JWT token获取用户ID
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    userId = decoded.userId;
    ws.userId = userId;
    userConnections.set(userId, ws);
    console.log(`用户 ${userId} 已连接`);
  } catch (error) {
    console.error('Token验证失败:', error);
    ws.close(1008, 'Invalid token');
    return;
  }
  
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      console.log('收到消息:', message);
      
      // 处理不同类型的消息
      if (message.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
        return;
      }
      
      if (message.type === 'auth') {
        // 用户认证（已在连接时处理，这里可以忽略或用于重新认证）
        console.log(`用户 ${userId} 重新认证`);
        return;
      }
      
      if (message.type === 'chat') {
        // 处理通用聊天消息（私聊和群聊）
        await handleChatMessage(message, ws);
        return;
      }
      
      if (message.type === 'private_message') {
        // 处理私聊消息
        await handlePrivateMessage(message, ws);
        return;
      }
      
      if (message.type === 'group_message') {
        // 处理群聊消息
        await handleGroupMessage(message, ws);
        return;
      }
      
      if (message.type === 'video_call') {
        // 处理视频通话相关消息
        await handleVideoCallMessage(message, ws);
        return;
      }
      
      // 默认广播消息给所有连接的客户端
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client !== ws) {
          client.send(data);
        }
      });
    } catch (error) {
      console.error('WebSocket 消息解析错误:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket 客户端断开连接');
    if (userId) {
      userConnections.delete(userId);
      console.log(`用户 ${userId} 已断开连接`);
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket 错误:', error);
    if (userId) {
      userConnections.delete(userId);
    }
  });
});

// 处理私聊消息
async function handlePrivateMessage(message, ws) {
  try {
    const { PrivateChatRoom, Message, User } = require('./models/associations');
    const { v4: uuidv4 } = require('uuid');
    
    const { room_id, msg_content, type = 'text', source = 'web' } = message;
    const from_id = ws.userId;
    
    if (!room_id || !msg_content || !from_id) {
      ws.send(JSON.stringify({
        type: 'error',
        message: '缺少必要参数'
      }));
      return;
    }
    
    // 验证用户是否有权限在该房间发送消息
    const room = await PrivateChatRoom.findOne({
      where: {
        id: room_id,
        [Op.or]: [
          { user1_id: from_id },
          { user2_id: from_id }
        ]
      }
    });
    
    if (!room) {
      ws.send(JSON.stringify({
        type: 'error',
        message: '无权在该房间发送消息'
      }));
      return;
    }
    
    const messageId = uuidv4();
    const now = new Date();
    
    // 确定接收者ID
    const to_user_id = room.user1_id === from_id ? room.user2_id : room.user1_id;
    
    // 创建消息
    const messageRecord = await Message.create({
      id: messageId,
      from_id,
      to_id: to_user_id,
      msg_content,
      type,
      source,
      status: 'sent',
      create_time: now,
      update_time: now
    });
    
    // 更新房间信息
    const isUser1 = room.user1_id === from_id;
    const updateData = {
      last_message_id: messageId,
      last_message_content: msg_content,
      last_message_time: now,
      update_time: now
    };
    
    if (isUser1) {
      updateData.user2_unread_count = room.user2_unread_count + 1;
    } else {
      updateData.user1_unread_count = room.user1_unread_count + 1;
    }
    
    await room.update(updateData);
    
    // 获取发送者信息
    const sender = await User.findByPk(from_id, {
      attributes: ['id', 'name', 'portrait']
    });
    
    const messageData = {
      type: 'private_message',
      id: messageRecord.id,
      fromId: messageRecord.from_id,
      toId: messageRecord.to_id,
      fromInfo: {
        id: sender?.id || messageRecord.from_id,
        name: sender?.name || '未知用户',
        avatar: sender?.portrait || null,
        type: 'user',
        badge: null
      },
      message: msg_content,
      referenceMsg: null,
      atUser: null,
      isShowTime: false,
      type: messageRecord.type,
      source: messageRecord.source,
      createTime: messageRecord.create_time,
      updateTime: messageRecord.update_time,
      roomId: room_id
    };
    
    // 发送给发送者确认
    ws.send(JSON.stringify(messageData));
    
    // 发送给接收者
    const receiverWs = userConnections.get(to_user_id);
    if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
      receiverWs.send(JSON.stringify(messageData));
    }
    
  } catch (error) {
    console.error('处理私聊消息错误:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: '发送消息失败'
    }));
  }
}

// 处理群聊消息
async function handleGroupMessage(message, ws) {
  try {
    const { ChatGroup, UserChatGroup, Message, User } = require('./models/associations');
    const { v4: uuidv4 } = require('uuid');
    
    const { group_id, msg_content, type = 'text', source = 'web' } = message;
    const from_id = ws.userId;
    
    if (!group_id || !msg_content || !from_id) {
      ws.send(JSON.stringify({
        type: 'error',
        message: '缺少必要参数'
      }));
      return;
    }
    
    // 检查用户是否在群组中
    const userInGroup = await UserChatGroup.findOne({
      where: { user_id: from_id, group_id: group_id }
    });
    
    if (!userInGroup) {
      ws.send(JSON.stringify({
        type: 'error',
        message: '您不在该群组中'
      }));
      return;
    }
    
    const messageId = uuidv4();
    const now = new Date();
    const to_id = `group_${group_id}`;
    
    // 创建消息
    const messageRecord = await Message.create({
      id: messageId,
      from_id,
      to_id,
      msg_content,
      type,
      source,
      status: 'sent',
      create_time: now,
      update_time: now
    });
    
    // 获取发送者信息
    const sender = await User.findByPk(from_id, {
      attributes: ['id', 'name', 'portrait']
    });
    
    // 获取群组所有成员
    const groupMembers = await UserChatGroup.findAll({
      where: { group_id: group_id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id']
      }]
    });
    
    const messageData = {
      type: 'group_message',
      id: messageRecord.id,
      fromId: messageRecord.from_id,
      toId: messageRecord.to_id,
      fromInfo: {
        id: sender?.id || messageRecord.from_id,
        name: sender?.name || '未知用户',
        avatar: sender?.portrait || null,
        type: 'user',
        badge: null
      },
      message: msg_content,
      referenceMsg: null,
      atUser: null,
      isShowTime: false,
      type: messageRecord.type,
      source: messageRecord.source,
      createTime: messageRecord.create_time,
      updateTime: messageRecord.update_time,
      groupId: group_id
    };
    
    // 发送给所有群成员
    groupMembers.forEach(member => {
      const memberWs = userConnections.get(member.user_id);
      if (memberWs && memberWs.readyState === WebSocket.OPEN) {
        memberWs.send(JSON.stringify(messageData));
      }
    });
    
  } catch (error) {
    console.error('处理群聊消息错误:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: '发送消息失败'
    }));
  }
}

// 处理通用聊天消息
async function handleChatMessage(message, ws) {
  try {
    const { Message, User, UserChatGroup, ChatList } = require('./models/associations');
    const { v4: uuidv4 } = require('uuid');
    
    const { to_id, msg_content, messageType = 'text', source = 'websocket' } = message;
    const from_id = ws.userId;
    
    if (!to_id || !msg_content || !from_id) {
      ws.send(JSON.stringify({
        type: 'error',
        message: '消息参数不完整'
      }));
      return;
    }
    
    const messageId = uuidv4();
    const now = new Date();
    
    // 创建消息
    const messageRecord = await Message.create({
      id: messageId,
      from_id,
      to_id,
      msg_content,
      type: messageType,
      source,
      status: 'sent',
      create_time: now,
      update_time: now
    });
    
    // 获取发送者信息
    const sender = await User.findByPk(from_id, {
      attributes: ['id', 'name', 'portrait']
    });
    
    // 判断是群聊还是私聊
    const isGroupChat = to_id.startsWith('group_');
    
    const messageData = {
      type: 'message',
      data: {
        id: messageRecord.id,
        fromId: messageRecord.from_id,
        toId: messageRecord.to_id,
        fromInfo: {
          id: sender?.id || messageRecord.from_id,
          name: sender?.name || '未知用户',
          avatar: sender?.portrait || null,
          type: 'user',
          badge: null
        },
        message: msg_content,
        referenceMsg: null,
        atUser: null,
        isShowTime: false,
        type: messageRecord.type,
        source: messageRecord.source,
        createTime: messageRecord.create_time,
        updateTime: messageRecord.update_time
      }
    };
    
    if (isGroupChat) {
      // 群聊：发送给所有群成员
      const groupId = to_id.replace('group_', '');
      const groupMembers = await UserChatGroup.findAll({
        where: { group_id: groupId },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id']
        }]
      });
      
      // 为每个群成员更新聊天列表
      for (const member of groupMembers) {
        await updateChatList(member.user_id, groupId, msg_content, 'group', messageId);
        
        // 发送消息给在线的群成员
        const memberWs = userConnections.get(member.user_id);
        if (memberWs && memberWs.readyState === WebSocket.OPEN) {
          memberWs.send(JSON.stringify(messageData));
        }
      }
    } else {
      // 私聊：发送给接收者
      await updateChatList(from_id, to_id, msg_content, 'private', messageId);
      await updateChatList(to_id, from_id, msg_content, 'private', messageId);
      
      // 发送给接收者
      const targetWs = userConnections.get(to_id);
      if (targetWs && targetWs.readyState === WebSocket.OPEN) {
        targetWs.send(JSON.stringify(messageData));
      }
    }
    
    // 确认消息已发送给发送者
    ws.send(JSON.stringify({
      type: 'message_sent',
      data: {
        id: messageRecord.id,
        status: 'sent'
      }
    }));
    
  } catch (error) {
    console.error('处理聊天消息失败:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: '发送消息失败: ' + (error.message || '未知错误')
    }));
  }
}

// 更新聊天列表的辅助函数
async function updateChatList(userId, targetId, messageContent, chatType, messageId) {
  try {
    const { ChatList } = require('./models/associations');
    
    // 查找或创建聊天列表记录
    let chatList = await ChatList.findOne({
      where: {
        user_id: userId,
        from_id: targetId,
        type: chatType
      }
    });
    
    if (chatList) {
      // 更新现有记录
      await chatList.update({
        last_msg_content: messageContent,
        last_message_id: messageId,
        update_time: new Date()
      });
    } else {
      // 创建新记录
      await ChatList.create({
        id: require('uuid').v4(),
        user_id: userId,
        from_id: targetId,
        type: chatType,
        last_msg_content: messageContent,
        last_message_id: messageId,
        unread_count: 0,
        is_top: false,
        create_time: new Date(),
        update_time: new Date()
      });
    }
  } catch (error) {
    console.error('更新聊天列表失败:', error);
  }
}

// 处理视频通话消息
async function handleVideoCallMessage(message, ws) {
  try {
    const { type, targetId, fromId, data } = message;
    const senderId = ws.userId || fromId;
    
    if (!senderId || !targetId) {
      ws.send(JSON.stringify({
        type: 'error',
        message: '缺少必要参数'
      }));
      return;
    }
    
    // 构建消息数据
    const messageData = {
      type: 'video_call',
      fromId: senderId,
      targetId: targetId,
      data: data,
      timestamp: new Date().toISOString()
    };
    
    // 发送给目标用户
    const targetWs = userConnections.get(targetId);
    if (targetWs && targetWs.readyState === WebSocket.OPEN) {
      targetWs.send(JSON.stringify(messageData));
      console.log(`视频通话消息已发送给用户 ${targetId}`);
    } else {
      console.log(`用户 ${targetId} 不在线`);
      ws.send(JSON.stringify({
        type: 'error',
        message: '目标用户不在线'
      }));
    }
    
  } catch (error) {
    console.error('处理视频通话消息错误:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: '处理视频通话消息失败'
    }));
  }
}

// 同步数据库并启动服务
sequelize.sync().then(() => {
  const port = 3002;
  server.listen(port, '0.0.0.0', () => {
    console.log(`后端服务运行在 http://0.0.0.0:${port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`端口 ${port} 已被占用，请检查是否有其他服务在使用该端口`);
    } else {
      console.error('服务器启动失败:', err);
    }
  });
}).catch((error) => {
  console.error('数据库同步失败:', error);
});