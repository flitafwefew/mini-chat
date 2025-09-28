const { Server } = require('ws');
const jwt = require('jsonwebtoken');
const { User, Message, ChatList } = require('../models/associations');
const { v4: uuidv4 } = require('uuid');

// 存储在线用户
const onlineUsers = new Map();

const handleWebSocket = (wss) => {
  wss.on('connection', (ws, req) => {
    console.log('新的WebSocket连接');
    
    // 从查询参数获取token
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    
    let userId = null;
    
    // 验证token
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        userId = decoded.userId;
        onlineUsers.set(userId, ws);
        
        // 更新用户在线状态
        User.update(
          { is_online: true, last_opt_time: new Date() },
          { where: { id: userId } }
        );
        
        console.log(`用户 ${userId} 已上线`);
      } catch (error) {
        console.error('Token验证失败:', error);
        ws.close(1008, 'Invalid token');
        return;
      }
    }
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data);
        console.log('收到消息:', message);
        
        // 处理不同类型的消息
        switch (message.type) {
          case 'chat':
            await handleChatMessage(message, ws, userId);
            break;
          case 'typing':
            handleTypingMessage(message, ws, userId);
            break;
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
          default:
            console.log('未知消息类型:', message.type);
        }
      } catch (error) {
        console.error('处理消息失败:', error);
      }
    });
    
    ws.on('close', () => {
      if (userId) {
        onlineUsers.delete(userId);
        
        // 更新用户离线状态
        User.update(
          { is_online: false },
          { where: { id: userId } }
        );
        
        console.log(`用户 ${userId} 已离线`);
      }
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket错误:', error);
    });
  });
};

// 处理聊天消息
const handleChatMessage = async (message, ws, fromUserId) => {
  try {
    const { to_id, msg_content, type = 'text' } = message;
    
    if (!fromUserId || !to_id || !msg_content) {
      ws.send(JSON.stringify({
        type: 'error',
        message: '消息参数不完整'
      }));
      return;
    }
    
    const messageId = uuidv4();
    const now = new Date();
    
    // 保存消息到数据库
    const savedMessage = await Message.create({
      id: messageId,
      from_id: fromUserId,
      to_id,
      msg_content,
      type,
      source: 'websocket',
      status: 'sent',
      create_time: now,
      update_time: now
    });
    
    // 更新聊天列表
    await updateChatList(fromUserId, to_id, msg_content, type);
    await updateChatList(to_id, fromUserId, msg_content, type);
    
    // 发送消息给接收方
    const targetWs = onlineUsers.get(to_id);
    if (targetWs && targetWs.readyState === Server.OPEN) {
      targetWs.send(JSON.stringify({
        type: 'message',
        data: {
          id: savedMessage.id,
          from_id: savedMessage.from_id,
          to_id: savedMessage.to_id,
          msg_content: savedMessage.msg_content,
          type: savedMessage.type,
          create_time: savedMessage.create_time
        }
      }));
    }
    
    // 确认消息已发送
    ws.send(JSON.stringify({
      type: 'message_sent',
      data: {
        id: savedMessage.id,
        status: 'sent'
      }
    }));
    
  } catch (error) {
    console.error('处理聊天消息失败:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: '发送消息失败'
    }));
  }
};

// 处理正在输入消息
const handleTypingMessage = (message, ws, fromUserId) => {
  const { to_id, is_typing } = message;
  
  if (!to_id) return;
  
  const targetWs = onlineUsers.get(to_id);
  if (targetWs && targetWs.readyState === Server.OPEN) {
    targetWs.send(JSON.stringify({
      type: 'typing',
      data: {
        from_id: fromUserId,
        is_typing
      }
    }));
  }
};

// 更新聊天列表
const updateChatList = async (userId, fromId, lastMsgContent, type) => {
  try {
    const existingChat = await ChatList.findOne({
      where: { user_id: userId, from_id: fromId }
    });

    const now = new Date();
    
    if (existingChat) {
      await existingChat.update({
        last_msg_content: lastMsgContent,
        type,
        update_time: now,
        unread_num: userId !== fromId ? existingChat.unread_num + 1 : 0
      });
    } else {
      await ChatList.create({
        id: uuidv4(),
        user_id: userId,
        from_id: fromId,
        last_msg_content: lastMsgContent,
        type,
        unread_num: userId !== fromId ? 1 : 0,
        create_time: now,
        update_time: now
      });
    }
  } catch (error) {
    console.error('更新聊天列表失败:', error);
  }
};

module.exports = { handleWebSocket };