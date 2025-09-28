const { PrivateChatRoom, User, Message } = require('../models/associations');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

// 创建或获取私聊房间
const createOrGetPrivateChatRoom = async (req, res) => {
  try {
    const { target_user_id } = req.body;
    const current_user_id = req.user.userId;
    
    if (!target_user_id) {
      return res.status(400).json({
        code: 400,
        msg: '缺少目标用户ID',
        data: null
      });
    }
    
    if (current_user_id === target_user_id) {
      return res.status(400).json({
        code: 400,
        msg: '不能与自己创建私聊',
        data: null
      });
    }
    
    // 检查目标用户是否存在
    const targetUser = await User.findByPk(target_user_id);
    if (!targetUser) {
      return res.status(404).json({
        code: 404,
        msg: '目标用户不存在',
        data: null
      });
    }
    
    // 查找是否已存在私聊房间（双向查找）
    let room = await PrivateChatRoom.findOne({
      where: {
        [Op.or]: [
          { user1_id: current_user_id, user2_id: target_user_id },
          { user1_id: target_user_id, user2_id: current_user_id }
        ]
      },
      include: [
        {
          model: User,
          as: 'user1',
          attributes: ['id', 'name', 'portrait', 'is_online']
        },
        {
          model: User,
          as: 'user2',
          attributes: ['id', 'name', 'portrait', 'is_online']
        }
      ]
    });
    
    // 如果房间不存在，创建新房间
    if (!room) {
      const roomId = uuidv4();
      const now = new Date();
      
      room = await PrivateChatRoom.create({
        id: roomId,
        user1_id: current_user_id,
        user2_id: target_user_id,
        create_time: now,
        update_time: now
      });
      
      // 重新查询以获取关联的用户信息
      room = await PrivateChatRoom.findByPk(roomId, {
        include: [
          {
            model: User,
            as: 'user1',
            attributes: ['id', 'name', 'portrait', 'is_online']
          },
          {
            model: User,
            as: 'user2',
            attributes: ['id', 'name', 'portrait', 'is_online']
          }
        ]
      });
    }
    
    // 确定当前用户是user1还是user2
    const isUser1 = room.user1_id === current_user_id;
    const otherUser = isUser1 ? room.user2 : room.user1;
    const unreadCount = isUser1 ? room.user1_unread_count : room.user2_unread_count;
    
    res.json({
      code: 0,
      msg: '获取成功',
      data: {
        roomId: room.id,
        otherUser: {
          id: otherUser.id,
          name: otherUser.name,
          portrait: otherUser.portrait,
          isOnline: otherUser.is_online
        },
        unreadCount,
        lastMessage: room.last_message_content,
        lastMessageTime: room.last_message_time,
        createTime: room.create_time
      }
    });
  } catch (error) {
    console.error('创建或获取私聊房间错误:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器错误',
      data: null
    });
  }
};

// 获取用户的私聊房间列表
const getPrivateChatRooms = async (req, res) => {
  try {
    const current_user_id = req.user.userId;
    
    const rooms = await PrivateChatRoom.findAll({
      where: {
        [Op.or]: [
          { user1_id: current_user_id },
          { user2_id: current_user_id }
        ],
        is_active: true
      },
      order: [['update_time', 'DESC']],
      include: [
        {
          model: User,
          as: 'user1',
          attributes: ['id', 'name', 'portrait', 'is_online']
        },
        {
          model: User,
          as: 'user2',
          attributes: ['id', 'name', 'portrait', 'is_online']
        }
      ]
    });
    
    // 格式化数据
    const formattedRooms = rooms.map(room => {
      const isUser1 = room.user1_id === current_user_id;
      const otherUser = isUser1 ? room.user2 : room.user1;
      const unreadCount = isUser1 ? room.user1_unread_count : room.user2_unread_count;
      
      return {
        roomId: room.id,
        otherUser: {
          id: otherUser.id,
          name: otherUser.name,
          portrait: otherUser.portrait,
          isOnline: otherUser.is_online
        },
        unreadCount,
        lastMessage: room.last_message_content,
        lastMessageTime: room.last_message_time,
        createTime: room.create_time,
        updateTime: room.update_time
      };
    });
    
    res.json({
      code: 0,
      msg: '获取成功',
      data: formattedRooms
    });
  } catch (error) {
    console.error('获取私聊房间列表错误:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器错误',
      data: null
    });
  }
};

// 获取私聊房间的聊天记录
const getPrivateChatMessages = async (req, res) => {
  try {
    const { room_id } = req.params;
    const { index = 0, num = 30 } = req.query;
    const current_user_id = req.user.userId;
    
    // 验证用户是否有权限访问该房间
    const room = await PrivateChatRoom.findOne({
      where: {
        id: room_id,
        [Op.or]: [
          { user1_id: current_user_id },
          { user2_id: current_user_id }
        ]
      }
    });
    
    if (!room) {
      return res.status(403).json({
        code: 403,
        msg: '无权访问该私聊房间',
        data: null
      });
    }
    
    const offset = parseInt(index);
    const limit = parseInt(num);
    
    // 获取聊天记录
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { from_id: room.user1_id, to_id: room.user2_id },
          { from_id: room.user2_id, to_id: room.user1_id }
        ]
      },
      order: [['create_time', 'DESC']],
      limit: limit,
      offset: offset,
      include: [
        {
          model: User,
          as: 'fromUser',
          attributes: ['id', 'name', 'portrait']
        }
      ]
    });
    
    // 标记消息为已读
    const isUser1 = room.user1_id === current_user_id;
    const otherUserId = isUser1 ? room.user2_id : room.user1_id;
    
    await Message.update(
      { status: 'read' },
      {
        where: {
          from_id: otherUserId,
          to_id: current_user_id,
          status: 'sent'
        }
      }
    );
    
    // 清空未读消息数
    if (isUser1) {
      await room.update({ user1_unread_count: 0 });
    } else {
      await room.update({ user2_unread_count: 0 });
    }
    
    // 转换数据格式
    const formattedMessages = messages.reverse().map(msg => ({
      id: msg.id,
      fromId: msg.from_id,
      toId: msg.to_id,
      fromInfo: {
        id: msg.fromUser?.id || msg.from_id,
        name: msg.fromUser?.name || '未知用户',
        avatar: msg.fromUser?.portrait || null,
        type: 'user',
        badge: null
      },
      message: msg.msg_content,
      referenceMsg: null,
      atUser: null,
      isShowTime: msg.is_show_time || false,
      type: msg.type || 'text',
      source: msg.source || 'web',
      createTime: msg.create_time,
      updateTime: msg.update_time
    }));
    
    res.json({
      code: 0,
      msg: '获取成功',
      data: formattedMessages
    });
  } catch (error) {
    console.error('获取私聊消息错误:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器错误',
      data: null
    });
  }
};

// 发送私聊消息
const sendPrivateMessage = async (req, res) => {
  try {
    const { room_id, msg_content, type = 'text', source = 'web' } = req.body;
    const current_user_id = req.user.userId;
    
    if (!room_id || !msg_content) {
      return res.status(400).json({
        code: 400,
        msg: '缺少必要参数',
        data: null
      });
    }
    
    // 验证用户是否有权限在该房间发送消息
    const room = await PrivateChatRoom.findOne({
      where: {
        id: room_id,
        [Op.or]: [
          { user1_id: current_user_id },
          { user2_id: current_user_id }
        ]
      }
    });
    
    if (!room) {
      return res.status(403).json({
        code: 403,
        msg: '无权在该房间发送消息',
        data: null
      });
    }
    
    const messageId = uuidv4();
    const now = new Date();
    
    // 确定接收者ID
    const to_user_id = room.user1_id === current_user_id ? room.user2_id : room.user1_id;
    
    // 创建消息
    const message = await Message.create({
      id: messageId,
      from_id: current_user_id,
      to_id: to_user_id,
      msg_content,
      type,
      source,
      status: 'sent',
      create_time: now,
      update_time: now
    });
    
    // 更新房间信息
    const isUser1 = room.user1_id === current_user_id;
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
    const sender = await User.findByPk(current_user_id, {
      attributes: ['id', 'name', 'portrait']
    });
    
    res.json({
      code: 0,
      msg: '发送成功',
      data: {
        id: message.id,
        fromId: message.from_id,
        toId: message.to_id,
        fromInfo: {
          id: sender?.id || message.from_id,
          name: sender?.name || '未知用户',
          avatar: sender?.portrait || null,
          type: 'user',
          badge: null
        },
        message: msg_content,
        referenceMsg: null,
        atUser: null,
        isShowTime: false,
        type: message.type,
        source: message.source,
        createTime: message.create_time,
        updateTime: message.update_time
      }
    });
  } catch (error) {
    console.error('发送私聊消息错误:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器错误',
      data: null
    });
  }
};

// 删除私聊房间
const deletePrivateChatRoom = async (req, res) => {
  try {
    const { room_id } = req.params;
    const current_user_id = req.user.userId;
    
    const room = await PrivateChatRoom.findOne({
      where: {
        id: room_id,
        [Op.or]: [
          { user1_id: current_user_id },
          { user2_id: current_user_id }
        ]
      }
    });
    
    if (!room) {
      return res.status(404).json({
        code: 404,
        msg: '私聊房间不存在',
        data: null
      });
    }
    
    // 软删除（设置为不活跃）
    await room.update({ is_active: false });
    
    res.json({
      code: 0,
      msg: '删除成功',
      data: null
    });
  } catch (error) {
    console.error('删除私聊房间错误:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器错误',
      data: null
    });
  }
};

module.exports = {
  createOrGetPrivateChatRoom,
  getPrivateChatRooms,
  getPrivateChatMessages,
  sendPrivateMessage,
  deletePrivateChatRoom
};
