const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const sequelize = require('./config/db');
const { Op } = require('sequelize');
require('dotenv').config();

// 设置默认环境变量（如果未设置）
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

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

// 添加请求日志中间件（仅记录API请求）
app.use('/api', (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// 静态文件服务 - 提供头像等静态资源
app.use(express.static('public'));

// 路由
app.use('/api/v1/user', require('./routes/user'));
app.use('/v1/message', require('./routes/message'));
app.use('/api/v1/chat-list', require('./routes/chatList'));
app.use('/api/v1/chat-group', require('./routes/chatGroup'));
app.use('/api/v1/file', require('./routes/fileRoutes'));
app.use('/api/v1/private-chat', require('./routes/privateChat'));
app.use('/api/v1/user-search', require('./routes/userSearch'));
app.use('/api/v1/call', require('./routes/videoCall'));
app.use('/api/v1/webrtc', require('./routes/webrtc'));
app.use('/api/v1/friend', require('./routes/friend'))

// 使用统一的WebSocket处理
const { handleWebSocket, getOnlineUsers } = require('./config/ws');

// 将onlineUsers传递给videoCallController（保持向后兼容）
const videoCallController = require('./controllers/videoCallController');
videoCallController.setUserConnections(getOnlineUsers());

// 使用config/ws.js中的WebSocket处理
handleWebSocket(wss);

/* 以下函数已迁移到 config/ws.js，保留仅作为备份
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
      const onlineUsers = getOnlineUsers();
      const receiverWs = onlineUsers.get(String(to_user_id));
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
    const onlineUsers = getOnlineUsers();
    groupMembers.forEach(member => {
      const memberWs = onlineUsers.get(String(member.user_id));
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
        const onlineUsers = getOnlineUsers();
        const memberWs = onlineUsers.get(String(member.user_id));
        if (memberWs && memberWs.readyState === WebSocket.OPEN) {
          memberWs.send(JSON.stringify(messageData));
        }
      }
    } else {
      // 私聊：发送给接收者
      await updateChatList(from_id, to_id, msg_content, 'private', messageId);
      await updateChatList(to_id, from_id, msg_content, 'private', messageId);
      
      // 发送给接收者
      const onlineUsers = getOnlineUsers();
      const targetWs = onlineUsers.get(String(to_id));
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
    const onlineUsers = getOnlineUsers();
    const targetWs = onlineUsers.get(String(targetId));
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
*/

// 添加错误处理中间件（必须在所有路由之后）
app.use((err, req, res, next) => {
  // 详细错误日志
  console.error('='.repeat(80));
  console.error('服务器错误发生时间:', new Date().toISOString());
  console.error('请求路径:', req.method, req.originalUrl);
  console.error('请求头:', JSON.stringify(req.headers, null, 2));
  console.error('请求体:', JSON.stringify(req.body, null, 2));
  console.error('错误消息:', err.message);
  console.error('错误名称:', err.name);
  console.error('错误堆栈:', err.stack);
  console.error('='.repeat(80));
  
  // 根据环境返回不同的错误信息
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    code: 500,
    msg: '服务器内部错误',
    data: null,
    // 开发环境返回详细错误信息
    ...(isDevelopment && {
      error: {
        message: err.message,
        name: err.name,
        stack: err.stack
      }
    })
  });
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('='.repeat(80));
  console.error('未捕获的异常:', new Date().toISOString());
  console.error('错误消息:', error.message);
  console.error('错误名称:', error.name);
  console.error('错误堆栈:', error.stack);
  console.error('='.repeat(80));
  // 不要立即退出，让服务器继续运行
});

// 处理未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('='.repeat(80));
  console.error('未处理的 Promise 拒绝:', new Date().toISOString());
  console.error('拒绝原因:', reason);
  if (reason instanceof Error) {
    console.error('错误消息:', reason.message);
    console.error('错误堆栈:', reason.stack);
  }
  console.error('Promise:', promise);
  console.error('='.repeat(80));
});

// 测试数据库连接
sequelize.authenticate()
  .then(() => {
    console.log('数据库连接成功');
  })
  .catch((error) => {
    console.error('='.repeat(80));
    console.error('数据库连接失败:', new Date().toISOString());
    console.error('错误消息:', error.message);
    console.error('错误名称:', error.name);
    console.error('错误堆栈:', error.stack);
    console.error('='.repeat(80));
  });

// 同步数据库并启动服务
// 使用 alter: true 来修改已存在的表结构（仅开发环境）
const syncOptions = process.env.NODE_ENV === 'production' ? {} : { alter: true };

// 在同步之前清理无效数据
async function cleanInvalidData() {
  try {
    const dbName = process.env.DB_NAME || 'mini_chat';
    const { Message, ChatList, User, Friend, UserChatGroup } = require('./models/associations');
    
    // 检查表是否存在 - 使用更安全的方式
    let tableNames = [];
    try {
      const [tables] = await sequelize.query(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '${dbName}' AND TABLE_NAME IN ('users', 'message', 'chat_list', 'friend', 'user_chat_groups')`
      );
      tableNames = tables.map(t => t.TABLE_NAME);
    } catch (error) {
      console.warn('检查表存在性时出错，跳过数据清理:', error.message);
      return; // 如果检查表失败，直接返回，让同步继续
    }
    
    const usersExists = tableNames.includes('users');
    
    if (!usersExists) {
      console.log('users 表尚未创建，跳过数据清理');
      return;
    }
    
    // 获取所有有效的用户ID
    let validUserIds = [];
    try {
      validUserIds = await User.findAll({
        attributes: ['id'],
        raw: true
      }).then(users => users.map(u => u.id));
    } catch (error) {
      console.warn('获取用户列表时出错，跳过数据清理:', error.message);
      return; // 如果查询用户失败，直接返回
    }
    
    if (validUserIds.length === 0) {
      console.log('没有有效用户，清空所有相关表数据');
      // 如果没有有效用户，清空所有相关表
      try {
        if (tableNames.includes('message')) {
          await Message.destroy({ where: {}, truncate: false });
        }
        if (tableNames.includes('chat_list')) {
          await ChatList.destroy({ where: {}, truncate: false });
        }
        if (tableNames.includes('friend')) {
          await Friend.destroy({ where: {}, truncate: false });
        }
        if (tableNames.includes('user_chat_groups')) {
          await UserChatGroup.destroy({ where: {}, truncate: false });
        }
      } catch (error) {
        console.warn('清空表数据时出错:', error.message);
      }
      return;
    }
    
    let totalCleaned = 0;
    
    // 清理 message 表中的无效数据
    if (tableNames.includes('message')) {
      try {
        // 获取有效的群组ID
        let validGroupIds = [];
        try {
          const ChatGroup = require('./models/ChatGroup');
          const [groupTables] = await sequelize.query(
            `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '${dbName}' AND TABLE_NAME = 'chat_group'`
          );
          
          if (groupTables && groupTables.length > 0) {
            validGroupIds = await ChatGroup.findAll({
              attributes: ['id'],
              raw: true
            }).then(groups => groups.map(g => g.id));
          }
        } catch (error) {
          console.warn('获取群组列表时出错:', error.message);
        }
        
        // 使用原始 SQL 来精确控制删除逻辑
        // 只删除以下消息：
        // 1. from_id 不在有效用户ID中的消息（发送者无效）
        // 2. 私聊消息（to_id 不以 group_ 开头）且 to_id 不在有效用户ID中
        // 3. 群聊消息（to_id 以 group_ 开头）但群组ID无效
        let deletedMessages = 0;
        
        if (validUserIds.length > 0 || validGroupIds.length > 0) {
          const conditions = [];
          
          // 条件1: from_id 不在有效用户ID中（所有消息的发送者都必须是有效用户）
          if (validUserIds.length > 0) {
            const userIdsStr = validUserIds.map(id => `'${id.replace(/'/g, "''")}'`).join(',');
            conditions.push(`from_id NOT IN (${userIdsStr})`);
          } else {
            // 如果没有有效用户，删除所有消息
            conditions.push('1=1');
          }
          
          // 条件2: 私聊消息（to_id 不以 group_ 开头）且 to_id 不在有效用户ID中
          if (validUserIds.length > 0) {
            const userIdsStr = validUserIds.map(id => `'${id.replace(/'/g, "''")}'`).join(',');
            conditions.push(`(to_id NOT LIKE 'group_%' AND to_id NOT IN (${userIdsStr}))`);
          }
          
          // 条件3: 群聊消息（to_id 以 group_ 开头）但群组ID无效
          if (validGroupIds.length > 0) {
            const groupIdsStr = validGroupIds.map(id => `'${id.replace(/'/g, "''")}'`).join(',');
            // 使用 SUBSTRING 提取 group_ 后面的群组ID
            conditions.push(`(to_id LIKE 'group_%' AND SUBSTRING(to_id, 7) NOT IN (${groupIdsStr}))`);
          } else {
            // 如果没有有效群组，删除所有群聊消息
            conditions.push(`to_id LIKE 'group_%'`);
          }
          
          const whereClause = conditions.join(' OR ');
          const [result] = await sequelize.query(`
            DELETE FROM message WHERE ${whereClause}
          `);
          deletedMessages = result.affectedRows || 0;
        } else {
          // 如果既没有有效用户也没有有效群组，删除所有消息
          const [result] = await sequelize.query(`DELETE FROM message`);
          deletedMessages = result.affectedRows || 0;
        }
        
        if (deletedMessages > 0) {
          console.log(`已清理 ${deletedMessages} 条无效消息记录`);
          totalCleaned += deletedMessages;
        }
      } catch (error) {
        console.warn('清理 message 表时出错:', error.message);
      }
    }
    
    // 清理 chat_list 表中的无效数据
    if (tableNames.includes('chat_list')) {
      try {
        // 临时禁用外键检查，以便更彻底地清理数据
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        
        try {
          // 清理 user_id 无效的记录
          const deletedChatList1 = await ChatList.destroy({
            where: {
              user_id: { [Op.notIn]: validUserIds }
            }
          });
          
          // 获取有效的群组ID
          let validGroupIds = [];
          try {
            const ChatGroup = require('./models/ChatGroup');
            // 检查 chat_group 表是否存在
            const [groupTables] = await sequelize.query(
              `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '${dbName}' AND TABLE_NAME = 'chat_group'`
            );
            
            if (groupTables && groupTables.length > 0) {
              validGroupIds = await ChatGroup.findAll({
                attributes: ['id'],
                raw: true
              }).then(groups => groups.map(g => g.id));
            }
          } catch (error) {
            console.warn('获取群组列表时出错:', error.message);
          }
          
          // 使用原始 SQL 清理所有 from_id 无效的记录
          // 根据 type 字段区分：private 类型的 from_id 必须在有效用户ID中，group 类型的 from_id 必须在有效群组ID中
          let deletedChatList2 = 0;
          if (validUserIds.length > 0 || validGroupIds.length > 0) {
            const conditions = [];
            
            // 清理私聊记录：type='private' 或 type 为 NULL，但 from_id 不在有效用户ID中
            if (validUserIds.length > 0) {
              const userIdsStr = validUserIds.map(id => `'${id}'`).join(',');
              conditions.push(`(type = 'private' OR type IS NULL) AND from_id NOT IN (${userIdsStr})`);
            } else {
              // 如果没有有效用户，删除所有私聊记录
              conditions.push(`(type = 'private' OR type IS NULL)`);
            }
            
            // 清理群聊记录：type='group'，但 from_id 不在有效群组ID中
            if (validGroupIds.length > 0) {
              const groupIdsStr = validGroupIds.map(id => `'${id}'`).join(',');
              conditions.push(`type = 'group' AND from_id NOT IN (${groupIdsStr})`);
            } else {
              // 如果没有有效群组，删除所有群聊记录
              conditions.push(`type = 'group'`);
            }
            
            // 执行删除
            if (conditions.length > 0) {
              const deleteSql = `DELETE FROM chat_list WHERE ${conditions.join(' OR ')}`;
              const [result] = await sequelize.query(deleteSql);
              deletedChatList2 = result.affectedRows || 0;
            }
          } else {
            // 如果既没有有效用户也没有有效群组，删除所有记录
            const [result] = await sequelize.query('DELETE FROM chat_list');
            deletedChatList2 = result.affectedRows || 0;
          }
          
          const deletedChatList = deletedChatList1 + deletedChatList2;
          if (deletedChatList > 0) {
            console.log(`已清理 ${deletedChatList} 条无效聊天列表记录`);
            totalCleaned += deletedChatList;
          }
        } finally {
          // 重新启用外键检查
          await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        }
      } catch (error) {
        console.warn('清理 chat_list 表时出错:', error.message);
        // 确保重新启用外键检查
        try {
          await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        } catch (e) {
          console.warn('重新启用外键检查时出错:', e.message);
        }
      }
    }
    
    // 清理 friend 表中的无效数据
    if (tableNames.includes('friend')) {
      try {
        const deletedFriends = await Friend.destroy({
          where: {
            [Op.or]: [
              { user_id: { [Op.notIn]: validUserIds } },
              { friend_id: { [Op.notIn]: validUserIds } }
            ]
          }
        });
        if (deletedFriends > 0) {
          console.log(`已清理 ${deletedFriends} 条无效好友记录`);
          totalCleaned += deletedFriends;
        }
      } catch (error) {
        console.warn('清理 friend 表时出错:', error.message);
      }
    }
    
    // 清理 user_chat_groups 表中的无效数据
    if (tableNames.includes('user_chat_groups')) {
      try {
        const deletedUserChatGroups = await UserChatGroup.destroy({
          where: {
            user_id: { [Op.notIn]: validUserIds }
          }
        });
        if (deletedUserChatGroups > 0) {
          console.log(`已清理 ${deletedUserChatGroups} 条无效用户群组记录`);
          totalCleaned += deletedUserChatGroups;
        }
      } catch (error) {
        console.warn('清理 user_chat_groups 表时出错:', error.message);
      }
    }
    
    if (totalCleaned > 0) {
      console.log(`总共清理了 ${totalCleaned} 条无效记录`);
    } else {
      console.log('数据检查完成，未发现无效记录');
    }
  } catch (error) {
    console.warn('清理无效数据时出错:', error.message);
    console.warn('错误堆栈:', error.stack);
    // 不抛出错误，允许继续同步
  }
}

// 先清理无效数据，再同步
cleanInvalidData().then(async () => {
  // 在同步之前临时禁用外键检查，避免外键约束导致的同步失败
  try {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await sequelize.sync(syncOptions);
    // 同步完成后重新启用外键检查
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  } catch (error) {
    // 确保即使同步失败也重新启用外键检查
    try {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    } catch (e) {
      console.warn('重新启用外键检查时出错:', e.message);
    }
    throw error; // 重新抛出错误以便在 catch 中处理
  }
}).then(() => {
  const port = 3002;
  server.listen(port, '0.0.0.0', () => {
    console.log(`后端服务运行在 http://0.0.0.0:${port}`);
    console.log('环境变量 NODE_ENV:', process.env.NODE_ENV || '未设置');
  }).on('error', (err) => {
    console.error('='.repeat(80));
    console.error('服务器启动失败:', new Date().toISOString());
    if (err.code === 'EADDRINUSE') {
      console.error(`端口 ${port} 已被占用，请检查是否有其他服务在使用该端口`);
    } else {
      console.error('错误消息:', err.message);
      console.error('错误代码:', err.code);
      console.error('错误堆栈:', err.stack);
    }
    console.error('='.repeat(80));
  });
}).catch((error) => {
  console.error('='.repeat(80));
  console.error('数据库同步失败:', new Date().toISOString());
  console.error('错误消息:', error.message);
  console.error('错误名称:', error.name);
  console.error('错误堆栈:', error.stack);
  console.error('='.repeat(80));
});