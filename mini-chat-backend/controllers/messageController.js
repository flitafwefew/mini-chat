const { Message, ChatList, User, ChatGroup } = require('../models/associations');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

// 发送消息
const sendMessage = async (req, res) => {
  try {
    // 支持前端参数名称和后端参数名称
    const { 
      to_id, 
      targetId, 
      msg_content, 
      msgContent, 
      type = 'text', 
      source = 'web', 
      file_url, 
      file_name, 
      file_size 
    } = req.body;
    
    const from_id = req.user.userId;
    
    // 使用前端参数名称或后端参数名称
    const toId = to_id || targetId;
    const messageContent = msg_content || msgContent;
    
    if (!toId || (!messageContent && !file_url)) {
      return res.status(400).json({
        code: 400,
        msg: '缺少必要参数',
        data: null
      });
    }

    // 根据消息类型处理内容
    let finalMessageContent = messageContent;
    if (type === 'image' && file_url) {
      finalMessageContent = JSON.stringify({
        type: 'image',
        url: file_url,
        filename: file_name || 'image',
        size: file_size || 0
      });
    } else if (type === 'file' && file_url) {
      finalMessageContent = JSON.stringify({
        type: 'file',
        url: file_url,
        filename: file_name || 'file',
        size: file_size || 0
      });
    }
    
    const messageId = uuidv4();
    const now = new Date();
    
    // 创建消息
    const message = await Message.create({
      id: messageId,
      from_id,
      to_id: toId,
      msg_content: finalMessageContent,
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

    // 判断是群聊还是私聊
    const isGroupChat = toId.startsWith('group_');
    const chatType = isGroupChat ? 'group' : 'private';
    
    if (isGroupChat) {
      // 群聊：更新所有群成员的聊天列表
      const groupId = toId.replace('group_', '');
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
        await updateChatList(member.user_id, groupId, finalMessageContent, 'group', messageId);
      }
    } else {
      // 私聊：更新双方的聊天列表
      await updateChatList(from_id, toId, finalMessageContent, 'private', messageId);
      await updateChatList(toId, from_id, finalMessageContent, 'private', messageId);
    }

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
        message: messageContent,
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
    console.error('发送消息错误:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器错误',
      data: null
    });
  }
};

// 获取聊天记录
const getMessages = async (req, res) => {
  try {
    const { targetId, index = 0, num = 30 } = req.query;
    const from_id = req.user.userId;
    
    console.log('获取消息参数:', { targetId, index, num, from_id });
    console.log('req.query:', req.query);
    
    if (!targetId) {
      return res.status(400).json({
        code: 400,
        msg: '缺少targetId参数',
        data: null
      });
    }
    
    const offset = parseInt(index);
    const limit = parseInt(num);
    
    let whereCondition;
    
    // 判断是群聊还是私聊
    if (targetId.startsWith('group_')) {
      // 群聊消息
      whereCondition = {
        to_id: targetId
      };
    } else {
      // 私聊消息
      whereCondition = {
        [Op.or]: [
          { from_id, to_id: targetId },
          { from_id: targetId, to_id: from_id }
        ]
      };
    }
    
    const messages = await Message.findAll({
      where: whereCondition,
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

    // 标记消息为已读（仅私聊）
    if (!targetId.startsWith('group_')) {
      await Message.update(
        { status: 'read' },
        {
          where: {
            from_id: targetId,
            to_id: from_id,
            status: 'sent'
          }
        }
      );
    }

    // 转换数据格式以匹配前端期望的格式
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
    console.error('获取消息错误:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器错误',
      data: null
    });
  }
};

// 获取聊天列表
const getChatList = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const chatList = await ChatList.findAll({
      where: { user_id: userId },
      order: [['update_time', 'DESC']],
      include: [
        {
          model: User,
          as: 'fromUser',
          attributes: ['id', 'name', 'portrait', 'is_online']
        }
      ]
    });

    res.json({
      code: 200,
      msg: '获取成功',
      data: chatList
    });
  } catch (error) {
    console.error('获取聊天列表错误:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器错误',
      data: null
    });
  }
};

// 更新聊天列表
const updateChatList = async (userId, fromId, lastMsgContent, type, messageId = null) => {
  try {
    const existingChat = await ChatList.findOne({
      where: { user_id: userId, from_id: fromId }
    });

    const now = new Date();
    
    if (existingChat) {
      await existingChat.update({
        last_msg_content: lastMsgContent,
        last_message_id: messageId,
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
        last_message_id: messageId,
        type,
        unread_num: userId !== fromId ? 1 : 0,
        create_time: now,
        update_time: now
      });
    }
  } catch (error) {
    console.error('更新聊天列表错误:', error);
  }
};

// 获取群聊列表
const getGroupChatList = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const chatList = await ChatList.findAll({
      where: { 
        user_id: userId,
        type: 'group'
      },
      order: [['update_time', 'DESC']],
      include: [
        {
          model: ChatGroup,
          as: 'groupInfo',
          attributes: ['id', 'name', 'portrait', 'notice', 'member_num']
        }
      ]
    });

    // 转换数据格式以匹配前端期望的格式
    const formattedData = chatList.map(chat => ({
      id: chat.id,
      targetId: chat.from_id,
      type: 'group',
      lastMsgContent: chat.last_msg_content,
      unreadNum: chat.unread_num,
      isTop: chat.is_top,
      updateTime: chat.update_time,
      createTime: chat.create_time,
      targetInfo: {
        id: chat.groupInfo?.id || chat.from_id,
        name: chat.groupInfo?.name || '未知群聊',
        portrait: chat.groupInfo?.portrait || null,
        avatar: chat.groupInfo?.portrait || null, // 统一使用avatar字段
        notice: chat.groupInfo?.notice || '',
        memberNum: chat.groupInfo?.member_num || 0
      }
    }));

    res.json({
      code: 0,
      msg: '获取成功',
      data: formattedData
    });
  } catch (error) {
    console.error('获取群聊列表错误:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器错误',
      data: null
    });
  }
};

// 获取私聊列表
const getPrivateChatList = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const chatList = await ChatList.findAll({
      where: { 
        user_id: userId,
        type: 'user'
      },
      order: [['update_time', 'DESC']],
      include: [
        {
          model: User,
          as: 'fromUser',
          attributes: ['id', 'name', 'portrait', 'is_online']
        }
      ]
    });

    // 转换数据格式以匹配前端期望的格式
    const formattedData = chatList.map(chat => ({
      id: chat.id,
      targetId: chat.from_id,
      type: 'user',
      lastMsgContent: chat.last_msg_content,
      unreadNum: chat.unread_num,
      isTop: chat.is_top,
      updateTime: chat.update_time,
      createTime: chat.create_time,
      targetInfo: {
        id: chat.fromUser?.id || chat.from_id,
        name: chat.fromUser?.name || '未知用户',
        portrait: chat.fromUser?.portrait || null,
        avatar: chat.fromUser?.portrait || null, // 统一使用avatar字段
        isOnline: chat.fromUser?.is_online || false
      }
    }));

    res.json({
      code: 0,
      msg: '获取成功',
      data: formattedData
    });
  } catch (error) {
    console.error('获取私聊列表错误:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器错误',
      data: null
    });
  }
};

// 标记消息为已读
const markAsRead = async (req, res) => {
  try {
    const { from_id } = req.body;
    const to_id = req.user.userId;
    
    await Message.update(
      { status: 'read' },
      {
        where: {
          from_id,
          to_id,
          status: 'sent'
        }
      }
    );

    // 清空未读消息数
    await ChatList.update(
      { unread_num: 0 },
      {
        where: {
          user_id: to_id,
          from_id
        }
      }
    );

    res.json({
      code: 200,
      msg: '标记成功',
      data: null
    });
  } catch (error) {
    console.error('标记已读错误:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器错误',
      data: null
    });
  }
};

// 发送群聊消息
const sendGroupMessage = async (req, res) => {
  try {
    const { group_id, msg_content, type = 'text', source = 'web' } = req.body;
    const from_id = req.user.userId;
    
    if (!group_id || !msg_content) {
      return res.status(400).json({
        code: 400,
        msg: '缺少必要参数',
        data: null
      });
    }
    
    // 检查用户是否在群组中
    const userInGroup = await UserChatGroup.findOne({
      where: { user_id: from_id, group_id: group_id }
    });
    
    if (!userInGroup) {
      return res.status(403).json({
        code: 403,
        msg: '您不在该群组中',
        data: null
      });
    }
    
    const messageId = uuidv4();
    const now = new Date();
    const to_id = `group_${group_id}`;
    
    // 创建消息
    const message = await Message.create({
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

    // 获取群组所有成员并更新他们的聊天列表
    const groupMembers = await UserChatGroup.findAll({
      where: { group_id: group_id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id']
      }]
    });

    // 为每个群成员更新聊天列表
    for (const member of groupMembers) {
      await updateChatList(member.user_id, group_id, msg_content, 'group', messageId);
    }

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
        message: messageContent,
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
    console.error('发送群聊消息错误:', error);
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
    const { to_user_id, msg_content, type = 'text', source = 'web' } = req.body;
    const from_id = req.user.userId;
    
    if (!to_user_id || !msg_content) {
      return res.status(400).json({
        code: 400,
        msg: '缺少必要参数',
        data: null
      });
    }
    
    // 检查对方用户是否存在
    const toUser = await User.findByPk(to_user_id);
    if (!toUser) {
      return res.status(404).json({
        code: 404,
        msg: '目标用户不存在',
        data: null
      });
    }
    
    const messageId = uuidv4();
    const now = new Date();
    
    // 创建消息
    const message = await Message.create({
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

    // 获取发送者信息
    const sender = await User.findByPk(from_id, {
      attributes: ['id', 'name', 'portrait']
    });

    // 更新双方的聊天列表
    await updateChatList(from_id, to_user_id, msg_content, 'private', messageId);
    await updateChatList(to_user_id, from_id, msg_content, 'private', messageId);

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
        message: messageContent,
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

module.exports = {
  sendMessage,
  sendGroupMessage,
  sendPrivateMessage,
  getMessages,
  getChatList,
  getGroupChatList,
  getPrivateChatList,
  markAsRead
};
