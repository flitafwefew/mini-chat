const { Server } = require('ws');
const jwt = require('jsonwebtoken');
const { User, Message, ChatList } = require('../models/associations');
const { v4: uuidv4 } = require('uuid');
const { isAIMessage, getAIResponse, getAIUserId } = require('../services/aiService');
const { Op } = require('sequelize');

// 存储在线用户
const onlineUsers = new Map();

// 导出onlineUsers供其他模块使用
const getOnlineUsers = () => onlineUsers;

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
    
    // 检查是否是发送给AI的消息，如果是则异步处理AI回复
    if (isAIMessage(to_id) && type === 'text') {
      handleAIResponseWS(to_id, fromUserId, msg_content).catch(error => {
        console.error('AI自动回复失败:', error);
      });
    }
    
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

// AI自动回复处理函数（WebSocket版本）
const handleAIResponseWS = async (aiUserId, userUserId, userMessage) => {
  try {
    console.log(`[WebSocket] 收到用户 ${userUserId} 发给AI的消息: ${userMessage}`);
    
    // 解析消息内容（前端可能发送JSON格式的消息）
    let parsedMessage = userMessage;
    try {
      const parsed = JSON.parse(userMessage);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].content) {
        // 前端格式: [{"type":"text","content":"消息内容"}]
        parsedMessage = parsed[0].content;
        console.log(`[WebSocket] 解析后的消息内容: ${parsedMessage}`);
      }
    } catch (e) {
      // 如果解析失败，使用原始消息
      parsedMessage = userMessage;
    }
    
    // 获取最近的对话历史（最多5条）用于上下文
    const recentMessages = await Message.findAll({
      where: {
        [Op.or]: [
          { from_id: userUserId, to_id: aiUserId },
          { from_id: aiUserId, to_id: userUserId }
        ]
      },
      order: [['create_time', 'DESC']],
      limit: 5
    });

    // 构建对话历史（从旧到新）
    const conversationHistory = recentMessages
      .reverse()
      .slice(0, -1) // 排除最后一条（当前消息）
      .map(msg => {
        // 同样解析历史消息
        let content = msg.msg_content;
        try {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].content) {
            content = parsed[0].content;
          }
        } catch (e) {
          // 使用原始内容
        }
        return {
          role: msg.from_id === userUserId ? 'user' : 'assistant',
          content: content
        };
      });

    // 调用AI服务获取回复
    const aiReply = await getAIResponse(parsedMessage, conversationHistory);
    
    console.log(`[WebSocket] AI回复: ${aiReply}`);
    
    // 创建AI回复消息
    const messageId = uuidv4();
    const now = new Date();
    
    const aiMessage = await Message.create({
      id: messageId,
      from_id: aiUserId,
      to_id: userUserId,
      msg_content: aiReply,
      type: 'text',
      source: 'ai',
      status: 'sent',
      create_time: now,
      update_time: now
    });

    // 更新双方的聊天列表
    await updateChatList(aiUserId, userUserId, aiReply, 'private');
    await updateChatList(userUserId, aiUserId, aiReply, 'private');
    
    // 通过WebSocket发送AI回复给用户
    const userWs = onlineUsers.get(userUserId);
    if (userWs && userWs.readyState === 1) { // 1 = OPEN
      userWs.send(JSON.stringify({
        type: 'message',
        data: {
          id: aiMessage.id,
          from_id: aiMessage.from_id,
          to_id: aiMessage.to_id,
          msg_content: aiMessage.msg_content,
          type: aiMessage.type,
          source: aiMessage.source,
          create_time: aiMessage.create_time
        }
      }));
    }
    
    console.log('[WebSocket] AI回复消息已保存并发送');
    
    return aiMessage;
  } catch (error) {
    console.error('[WebSocket] 处理AI回复时出错:', error);
    throw error;
  }
};

module.exports = { handleWebSocket, getOnlineUsers };