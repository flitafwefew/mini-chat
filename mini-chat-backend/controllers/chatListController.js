const { ChatList, User, Message, ChatGroup, UserChatGroup } = require('../models/associations');
const { Op } = require('sequelize');

// 获取聊天列表
const getChatList = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // 获取用户的聊天列表
    const chatLists = await ChatList.findAll({
      where: { user_id: userId },
      order: [['update_time', 'DESC']]
    });

    const chatListWithDetails = await Promise.all(
      chatLists.map(async (chat) => {
        let chatInfo = null;
        let lastMessage = null;
        let unreadCount = 0;

        if (chat.type === 'private') {
          // 私聊：获取对方用户信息
          const otherUserId = chat.from_id;
          const otherUser = await User.findByPk(otherUserId, {
            attributes: ['id', 'account', 'name', 'portrait', 'sex', 'signature', 'is_online']
          });
          
          if (otherUser) {
            chatInfo = {
              id: otherUser.id,
              account: otherUser.account,
              name: otherUser.name,
              avatar: otherUser.portrait, // 统一使用avatar字段
              portrait: otherUser.portrait, // 保持向后兼容
              sex: otherUser.sex,
              signature: otherUser.signature,
              is_online: otherUser.is_online,
              type: 'user' // 统一使用user类型
            };
          }
        } else if (chat.type === 'group') {
          // 群聊：获取群组信息
          const group = await ChatGroup.findByPk(chat.from_id, {
            include: [{
              model: User,
              as: 'members',
              attributes: ['id', 'account', 'name', 'portrait'],
              through: {
                attributes: [],
                where: {},
                required: false
              }
            }]
          });
          
          if (group) {
            chatInfo = {
              id: group.id,
              name: group.name,
              description: group.description,
              avatar: group.avatar,
              member_count: group.members ? group.members.length : 0,
              type: 'group'
            };
          }
        }

        // 获取最后一条消息
        if (chat.last_message_id) {
          lastMessage = await Message.findByPk(chat.last_message_id, {
            attributes: ['id', 'msg_content', 'type', 'create_time', 'from_id'],
            include: [{
              model: User,
              as: 'fromUser',
              attributes: ['name']
            }]
          });
        }

        // 计算未读消息数
        unreadCount = chat.unread_num || 0;

        return {
          id: chat.id,
          chat_id: chat.from_id,
          type: chat.type,
          chat_info: chatInfo,
          last_message: lastMessage,
          unread_count: unreadCount,
          update_time: chat.update_time,
          create_time: chat.create_time
        };
      })
    );

    // 过滤掉无效的聊天记录
    const validChatList = chatListWithDetails.filter(chat => chat.chat_info);

    res.json({
      code: 200,
      msg: '获取聊天列表成功',
      data: validChatList
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

// 创建或更新聊天记录
const createOrUpdateChat = async (req, res) => {
  try {
    const { chat_id, chat_type, last_message_id, unread_count } = req.body;
    const userId = req.user.userId;

    // 查找是否已存在聊天记录
    let chatRecord = await ChatList.findOne({
      where: {
        user_id: userId,
        from_id: chat_id,
        type: chat_type
      }
    });

    if (chatRecord) {
      // 更新现有记录
      await chatRecord.update({
        last_message_id: last_message_id || chatRecord.last_message_id,
        unread_num: unread_count !== undefined ? unread_count : chatRecord.unread_num,
        update_time: new Date()
      });
    } else {
      // 创建新记录
      chatRecord = await ChatList.create({
        id: `${userId}_${chat_id}_${Date.now()}`, // 生成唯一ID
        user_id: userId,
        from_id: chat_id,
        type: chat_type,
        last_message_id: last_message_id,
        unread_num: unread_count || 0,
        create_time: new Date(),
        update_time: new Date()
      });
    }

    res.json({
      code: 200,
      msg: '操作成功',
      data: chatRecord
    });
  } catch (error) {
    console.error('创建或更新聊天记录错误:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器错误',
      data: null
    });
  }
};

// 清除未读消息数
const clearUnreadCount = async (req, res) => {
  try {
    const { chat_id, chat_type } = req.params;
    const userId = req.user.userId;

    const chatRecord = await ChatList.findOne({
      where: {
        user_id: userId,
        from_id: chat_id,
        type: chat_type
      }
    });

    if (chatRecord) {
      await chatRecord.update({
        unread_num: 0,
        update_time: new Date()
      });

      res.json({
        code: 200,
        msg: '清除未读消息成功',
        data: null
      });
    } else {
      res.status(404).json({
        code: 404,
        msg: '聊天记录不存在',
        data: null
      });
    }
  } catch (error) {
    console.error('清除未读消息数错误:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器错误',
      data: null
    });
  }
};

// 删除聊天记录
const deleteChat = async (req, res) => {
  try {
    const { chat_id, chat_type } = req.params;
    const userId = req.user.userId;

    const chatRecord = await ChatList.findOne({
      where: {
        user_id: userId,
        from_id: chat_id,
        type: chat_type
      }
    });

    if (chatRecord) {
      await chatRecord.destroy();
      res.json({
        code: 200,
        msg: '删除聊天记录成功',
        data: null
      });
    } else {
      res.status(404).json({
        code: 404,
        msg: '聊天记录不存在',
        data: null
      });
    }
  } catch (error) {
    console.error('删除聊天记录错误:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器错误',
      data: null
    });
  }
};

// 获取群组列表
const getGroupList = async (req, res) => {
  try {
    const userId = req.user.userId;

    // 获取用户加入的群组
    const userGroups = await UserChatGroup.findAll({
      where: { user_id: userId },
      include: [{
        model: ChatGroup,
        as: 'group',
        include: [{
          model: User,
          as: 'members',
          attributes: ['id', 'account', 'name', 'portrait'],
          through: { attributes: [] }
        }]
      }]
    });

    const groups = userGroups.map(ug => ({
      id: ug.group.id,
      name: ug.group.name,
      description: ug.group.description,
      avatar: ug.group.avatar,
      member_count: ug.group.members ? ug.group.members.length : 0,
      create_time: ug.group.create_time,
      update_time: ug.group.update_time
    }));

    res.json({
      code: 200,
      msg: '获取群组列表成功',
      data: groups
    });
  } catch (error) {
    console.error('获取群组列表错误:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器错误',
      data: null
    });
  }
};

// 创建群组
const createGroup = async (req, res) => {
  try {
    const { name, description, avatar, member_ids } = req.body;
    const userId = req.user.userId;

    if (!name) {
      return res.status(400).json({
        code: 400,
        msg: '群名称不能为空',
        data: null
      });
    }

    // 创建群组
    const groupId = `group_${Date.now()}`;
    const group = await ChatGroup.create({
      id: groupId,
      name,
      notice: description || '',
      avatar: avatar || null,
      user_id: userId,
      owner_user_id: userId,
      chat_group_number: `group_${Date.now()}`,
      member_num: 1 + (member_ids ? member_ids.length : 0),
      create_time: new Date(),
      update_time: new Date()
    });

    // 添加群主到群组
    await UserChatGroup.create({
      user_id: userId,
      group_id: group.id,
      role: 'admin',
      join_time: new Date()
    });

    // 添加其他成员到群组
    if (member_ids && member_ids.length > 0) {
      const memberPromises = member_ids.map(memberId => 
        UserChatGroup.create({
          user_id: memberId,
          group_id: group.id,
          role: 'member',
          join_time: new Date()
        })
      );
      await Promise.all(memberPromises);
    }

    // 为所有成员创建聊天记录
    const allMemberIds = [userId, ...(member_ids || [])];
    const chatPromises = allMemberIds.map(memberId => {
      const chatId = `${memberId}_${group.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return ChatList.create({
        id: chatId, // 生成唯一ID
        user_id: memberId,
        from_id: group.id,
        type: 'group',
        unread_num: 0,
        create_time: new Date(),
        update_time: new Date()
      });
    });
    await Promise.all(chatPromises);

    res.json({
      code: 200,
      msg: '创建群组成功',
      data: {
        id: group.id,
        name: group.name,
        description: group.description,
        avatar: group.avatar,
        member_count: allMemberIds.length
      }
    });
  } catch (error) {
    console.error('创建群组错误:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器错误',
      data: null
    });
  }
};

// 加入群组
const joinGroup = async (req, res) => {
  try {
    const { group_id } = req.body;
    const userId = req.user.userId;

    // 检查群组是否存在
    const group = await ChatGroup.findByPk(group_id);
    if (!group) {
      return res.status(404).json({
        code: 404,
        msg: '群组不存在',
        data: null
      });
    }

    // 检查用户是否已在群组中
    const existingMember = await UserChatGroup.findOne({
      where: { user_id: userId, group_id: group_id }
    });

    if (existingMember) {
      return res.status(400).json({
        code: 400,
        msg: '用户已在群组中',
        data: null
      });
    }

    // 添加用户到群组
    await UserChatGroup.create({
      user_id: userId,
      group_id: group_id,
      role: 'member',
      join_time: new Date()
    });

    // 为用户创建聊天记录
    await ChatList.create({
      user_id: userId,
      from_id: group_id,
      type: 'group',
      unread_num: 0,
      create_time: new Date(),
      update_time: new Date()
    });

    res.json({
      code: 200,
      msg: '加入群组成功',
      data: null
    });
  } catch (error) {
    console.error('加入群组错误:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器错误',
      data: null
    });
  }
};

// 退出群组
const leaveGroup = async (req, res) => {
  try {
    const { group_id } = req.params;
    const userId = req.user.userId;

    // 删除用户群组关系
    await UserChatGroup.destroy({
      where: { user_id: userId, group_id: group_id }
    });

    // 删除聊天记录
    await ChatList.destroy({
      where: { 
        user_id: userId, 
        from_id: group_id, 
        type: 'group' 
      }
    });

    res.json({
      code: 200,
      msg: '退出群组成功',
      data: null
    });
  } catch (error) {
    console.error('退出群组错误:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器错误',
      data: null
    });
  }
};

// 获取群成员列表
const getGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.userId;

    // 检查用户是否在群组中
    const userInGroup = await UserChatGroup.findOne({
      where: { 
        user_id: userId,
        group_id: groupId
      }
    });

    if (!userInGroup) {
      return res.status(403).json({
        code: 403,
        msg: '您不在该群组中',
        data: null
      });
    }

    // 获取群组成员
    const userGroups = await UserChatGroup.findAll({
      where: { group_id: groupId },
      attributes: ['user_id']
    });

    if (userGroups.length === 0) {
      return res.json({
        code: 200,
        msg: '获取群成员成功',
        data: []
      });
    }

    const userIds = userGroups.map(ug => ug.user_id);
    const members = await User.findAll({
      where: { 
        id: {
          [Op.in]: userIds
        }
      },
      attributes: ['id', 'account', 'name', 'portrait']
    });

    // 为每个成员添加avatar字段，保持一致性
    const membersWithAvatar = members.map(member => ({
      ...member.toJSON(),
      avatar: member.portrait,
      type: 'user'
    }));

    res.json({
      code: 200,
      msg: '获取群成员成功',
      data: membersWithAvatar
    });
  } catch (error) {
    console.error('获取群成员错误:', error);
    console.error('错误详情:', {
      message: error.message,
      stack: error.stack,
      groupId: req.params.groupId,
      userId: req.user?.userId
    });
    res.status(500).json({
      code: 500,
      msg: '服务器错误',
      data: null
    });
  }
};

// 获取群聊列表（兼容前端API）
const getGroupChatList = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // 获取用户的群聊列表
    const chatLists = await ChatList.findAll({
      where: { 
        user_id: userId,
        type: 'group'
      },
      order: [['update_time', 'DESC']]
    });

    const groupChats = await Promise.all(
      chatLists.map(async (chat) => {
        // 获取群组信息
        const group = await ChatGroup.findByPk(chat.from_id);
        
        // 单独获取群组成员
        let members = [];
        if (group) {
          try {
            const userGroups = await UserChatGroup.findAll({
              where: { group_id: group.id },
              attributes: ['user_id']
            });
            
            if (userGroups.length > 0) {
              const userIds = userGroups.map(ug => ug.user_id);
              const users = await User.findAll({
                where: { id: userIds },
                attributes: ['id', 'account', 'name', 'portrait']
              });
              members = users;
            }
          } catch (memberError) {
            console.error('获取群成员失败:', memberError);
            members = [];
          }
        }
        
        if (!group) return null;

        // 获取最后一条消息
        let lastMessage = null;
        if (chat.last_message_id) {
          lastMessage = await Message.findByPk(chat.last_message_id, {
            attributes: ['id', 'msg_content', 'type', 'create_time', 'from_id'],
            include: [{
              model: User,
              as: 'fromUser',
              attributes: ['name']
            }]
          });
        }

        return {
          id: chat.id,
          targetId: group.id,
          type: 'group',
          targetInfo: {
            id: group.id,
            name: group.name,
            avatar: group.portrait,
            type: 'group'
          },
          lastMessage: lastMessage ? {
            id: lastMessage.id,
            fromId: lastMessage.from_id,
            toId: group.id,
            fromInfo: lastMessage.fromUser,
            message: lastMessage.msg_content,
            referenceMsg: null,
            atUser: null,
            isShowTime: false,
            type: lastMessage.type,
            source: 'group',
            createTime: lastMessage.create_time,
            updateTime: lastMessage.create_time
          } : null,
          unreadCount: chat.unread_num || 0,
          createTime: chat.create_time,
          updateTime: chat.update_time
        };
      })
    );

    // 过滤掉无效的群聊记录
    const validGroupChats = groupChats.filter(chat => chat !== null);

    res.json({
      code: 0,
      msg: '获取群聊列表成功',
      data: validGroupChats
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

// 获取私聊列表（兼容前端API）
const getPrivateChatList = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // 获取用户的所有好友
    const { Friend } = require('../models/associations');
    const friends = await Friend.findAll({
      where: { 
        user_id: userId,
        status: 'accepted'
      },
      include: [{
        model: User,
        as: 'friendUser',
        attributes: ['id', 'account', 'name', 'portrait', 'sex', 'signature', 'is_online']
      }]
    });

    // 获取已有的私聊记录
    const chatLists = await ChatList.findAll({
      where: { 
        user_id: userId,
        type: 'user'
      },
      order: [['update_time', 'DESC']]
    });

    // 创建私聊记录映射
    const chatMap = new Map();
    chatLists.forEach(chat => {
      chatMap.set(chat.from_id, chat);
    });

    const privateChats = await Promise.all(
      friends.map(async (friend) => {
        const otherUser = friend.friendUser;
        if (!otherUser) return null;

        // 检查是否有私聊记录
        const existingChat = chatMap.get(otherUser.id);
        
        let lastMessage = null;
        let unreadNum = 0;
        let updateTime = new Date().toISOString(); // 默认使用当前时间

        if (existingChat) {
          // 有私聊记录，获取最后一条消息
          if (existingChat.last_message_id) {
            lastMessage = await Message.findByPk(existingChat.last_message_id, {
              attributes: ['id', 'msg_content', 'type', 'create_time', 'from_id'],
              include: [{
                model: User,
                as: 'fromUser',
                attributes: ['name']
              }]
            });
          }
          unreadNum = existingChat.unread_num || 0;
          updateTime = existingChat.update_time || new Date().toISOString();
        }

        return {
          id: existingChat ? existingChat.id : `temp_${otherUser.id}`,
          targetId: otherUser.id,
          type: 'user',
          targetInfo: {
            id: otherUser.id,
            name: otherUser.name,
            avatar: otherUser.portrait,
            type: 'user'
          },
          lastMessage: lastMessage ? {
            id: lastMessage.id,
            fromId: lastMessage.from_id,
            toId: otherUser.id,
            fromInfo: lastMessage.fromUser,
            message: lastMessage.msg_content,
            referenceMsg: null,
            atUser: null,
            isShowTime: false,
            type: lastMessage.type,
            source: 'user',
            createTime: lastMessage.create_time,
            updateTime: lastMessage.create_time
          } : null,
          unreadCount: unreadNum,
          createTime: existingChat ? existingChat.create_time : new Date().toISOString(),
          updateTime: updateTime
        };
      })
    );

    // 过滤掉无效的私聊记录并按更新时间排序
    const validPrivateChats = privateChats
      .filter(chat => chat !== null)
      .sort((a, b) => new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime());

    res.json({
      code: 0,
      msg: '获取私聊列表成功',
      data: validPrivateChats
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
    const { targetId } = req.body;
    const userId = req.user.userId;

    if (!targetId) {
      return res.status(400).json({
        code: 400,
        msg: 'targetId不能为空',
        data: null
      });
    }

    // 查找聊天记录
    const chatRecord = await ChatList.findOne({
      where: {
        user_id: userId,
        from_id: targetId
      }
    });

    if (chatRecord) {
      // 清除未读消息数
      await chatRecord.update({
        unread_num: 0,
        update_time: new Date()
      });

      res.json({
        code: 0,
        msg: '标记已读成功',
        data: null
      });
    } else {
      res.status(404).json({
        code: 404,
        msg: '聊天记录不存在',
        data: null
      });
    }
  } catch (error) {
    console.error('标记已读错误:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器错误',
      data: null
    });
  }
};

module.exports = {
  getChatList,
  getGroupChatList,
  getPrivateChatList,
  createOrUpdateChat,
  clearUnreadCount,
  deleteChat,
  getGroupList,
  createGroup,
  joinGroup,
  leaveGroup,
  markAsRead,
  getGroupMembers
};
