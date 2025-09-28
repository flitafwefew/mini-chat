const { User, Friend, ChatGroup, UserChatGroup } = require('../models/associations');
const { Op } = require('sequelize');

// 发送好友申请
const sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.user;
    const { friendId, message } = req.body;

    if (!friendId) {
      return res.status(400).json({
        code: 400,
        message: '好友ID不能为空'
      });
    }

    if (userId === friendId) {
      return res.status(400).json({
        code: 400,
        message: '不能添加自己为好友'
      });
    }

    // 检查好友是否存在
    const friend = await User.findByPk(friendId);
    if (!friend) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    // 检查是否已经是好友
    const existingFriend = await Friend.findOne({
      where: {
        [Op.or]: [
          { user_id: userId, friend_id: friendId },
          { user_id: friendId, friend_id: userId }
        ]
      }
    });

    if (existingFriend) {
      return res.status(400).json({
        code: 400,
        message: '已经是好友关系'
      });
    }

    // 检查是否已经发送过申请
    const existingRequest = await Friend.findOne({
      where: {
        user_id: userId,
        friend_id: friendId,
        status: 'pending'
      }
    });

    if (existingRequest) {
      return res.status(400).json({
        code: 400,
        message: '已经发送过好友申请'
      });
    }

    // 创建好友申请
    await Friend.create({
      id: `friend_${Date.now()}_${userId}_${friendId}`,
      user_id: userId,
      friend_id: friendId,
      status: 'pending',
      remark: message || '',
      create_time: new Date(),
      update_time: new Date()
    });

    res.json({
      code: 200,
      message: '好友申请发送成功',
      data: {
        friendId: friendId,
        friendName: friend.name,
        friendPortrait: friend.portrait
      }
    });
  } catch (error) {
    console.error('发送好友申请失败:', error);
    res.status(500).json({
      code: 500,
      message: '发送好友申请失败',
      error: error.message
    });
  }
};

// 接受好友申请
const acceptFriendRequest = async (req, res) => {
  try {
    const { userId } = req.user;
    const { friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({
        code: 400,
        message: '好友ID不能为空'
      });
    }

    // 查找待处理的好友申请
    const friendRequest = await Friend.findOne({
      where: {
        user_id: friendId,
        friend_id: userId,
        status: 'pending'
      }
    });

    if (!friendRequest) {
      return res.status(404).json({
        code: 404,
        message: '未找到待处理的好友申请'
      });
    }

    // 更新申请状态为已接受
    await friendRequest.update({
      status: 'accepted',
      update_time: new Date()
    });

    // 创建反向好友关系
    await Friend.create({
      id: `friend_${Date.now()}_${userId}_${friendId}`,
      user_id: userId,
      friend_id: friendId,
      status: 'accepted',
      create_time: new Date(),
      update_time: new Date()
    });

    // 获取好友信息
    const friend = await User.findByPk(friendId);

    res.json({
      code: 200,
      message: '接受好友申请成功',
      data: {
        friendId: friendId,
        friendName: friend.name,
        friendPortrait: friend.portrait
      }
    });
  } catch (error) {
    console.error('接受好友申请失败:', error);
    res.status(500).json({
      code: 500,
      message: '接受好友申请失败',
      error: error.message
    });
  }
};

// 拒绝好友申请
const rejectFriendRequest = async (req, res) => {
  try {
    const { userId } = req.user;
    const { friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({
        code: 400,
        message: '好友ID不能为空'
      });
    }

    // 查找待处理的好友申请
    const friendRequest = await Friend.findOne({
      where: {
        user_id: friendId,
        friend_id: userId,
        status: 'pending'
      }
    });

    if (!friendRequest) {
      return res.status(404).json({
        code: 404,
        message: '未找到待处理的好友申请'
      });
    }

    // 删除好友申请
    await friendRequest.destroy();

    res.json({
      code: 200,
      message: '拒绝好友申请成功'
    });
  } catch (error) {
    console.error('拒绝好友申请失败:', error);
    res.status(500).json({
      code: 500,
      message: '拒绝好友申请失败',
      error: error.message
    });
  }
};

// 获取好友申请列表
const getFriendRequests = async (req, res) => {
  try {
    const { userId } = req.user;

    const requests = await Friend.findAll({
      where: {
        friend_id: userId,
        status: 'pending'
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'account', 'name', 'portrait', 'sex', 'signature']
      }],
      order: [['create_time', 'DESC']]
    });

    const requestList = requests.map(request => ({
      id: request.id,
      userId: request.user.id,
      account: request.user.account,
      name: request.user.name,
      portrait: request.user.portrait,
      avatar: request.user.portrait, // 统一使用avatar字段
      sex: request.user.sex,
      signature: request.user.signature,
      message: request.remark,
      createTime: request.create_time
    }));

    res.json({
      code: 200,
      message: '获取好友申请列表成功',
      data: requestList
    });
  } catch (error) {
    console.error('获取好友申请列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取好友申请列表失败',
      error: error.message
    });
  }
};

// 添加好友（直接添加，用于测试）
const addFriend = async (req, res) => {
  try {
    const { userId } = req.user;
    const { friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({
        code: 400,
        message: '好友ID不能为空'
      });
    }

    if (userId === friendId) {
      return res.status(400).json({
        code: 400,
        message: '不能添加自己为好友'
      });
    }

    // 检查好友是否存在
    const friend = await User.findByPk(friendId);
    if (!friend) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    // 检查是否已经是好友
    const existingFriend = await Friend.findOne({
      where: {
        [Op.or]: [
          { user_id: userId, friend_id: friendId },
          { user_id: friendId, friend_id: userId }
        ]
      }
    });

    if (existingFriend) {
      return res.status(400).json({
        code: 400,
        message: '已经是好友关系'
      });
    }

    // 创建好友关系（双向）
    await Friend.bulkCreate([
      { 
        id: `friend_${Date.now()}_${userId}_${friendId}`,
        user_id: userId, 
        friend_id: friendId, 
        status: 'accepted',
        create_time: new Date(),
        update_time: new Date()
      },
      { 
        id: `friend_${Date.now()}_${friendId}_${userId}`,
        user_id: friendId, 
        friend_id: userId, 
        status: 'accepted',
        create_time: new Date(),
        update_time: new Date()
      }
    ]);

    res.json({
      code: 200,
      message: '添加好友成功',
      data: {
        friendId: friendId,
        friendName: friend.name,
        friendPortrait: friend.portrait
      }
    });
  } catch (error) {
    console.error('添加好友失败:', error);
    res.status(500).json({
      code: 500,
      message: '添加好友失败',
      error: error.message
    });
  }
};

// 删除好友
const deleteFriend = async (req, res) => {
  try {
    const { userId } = req.user;
    const { friendId } = req.params;

    if (!friendId) {
      return res.status(400).json({
        code: 400,
        message: '好友ID不能为空'
      });
    }

    // 删除双向好友关系
    await Friend.destroy({
      where: {
        [Op.or]: [
          { user_id: userId, friend_id: friendId },
          { user_id: friendId, friend_id: userId }
        ]
      }
    });

    res.json({
      code: 200,
      message: '删除好友成功'
    });
  } catch (error) {
    console.error('删除好友失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除好友失败',
      error: error.message
    });
  }
};

// 获取好友列表
const getFriendList = async (req, res) => {
  try {
    const { userId } = req.user;

    const friends = await Friend.findAll({
      where: { user_id: userId },
      include: [{
        model: User,
        as: 'friendUser',
        attributes: ['id', 'account', 'name', 'portrait', 'sex', 'signature', 'is_online', 'last_opt_time']
      }],
      order: [['create_time', 'DESC']]
    });

    const friendList = friends.map(friend => ({
      id: friend.friendUser.id,
      account: friend.friendUser.account,
      name: friend.friendUser.name,
      portrait: friend.friendUser.portrait,
      avatar: friend.friendUser.portrait, // 统一使用avatar字段
      sex: friend.friendUser.sex,
      signature: friend.friendUser.signature,
      is_online: friend.friendUser.is_online,
      last_opt_time: friend.friendUser.last_opt_time,
      add_time: friend.create_time
    }));

    res.json({
      code: 200,
      message: '获取好友列表成功',
      data: friendList
    });
  } catch (error) {
    console.error('获取好友列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取好友列表失败',
      error: error.message
    });
  }
};

// 搜索用户（用于添加好友）
const searchUsers = async (req, res) => {
  try {
    const { userId } = req.user;
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({
        code: 400,
        message: '搜索关键词不能为空'
      });
    }

    // 搜索用户（排除自己和已经是好友的用户）
    const friendIds = await Friend.findAll({
      where: { user_id: userId },
      attributes: ['friend_id']
    });
    const friendIdList = friendIds.map(f => f.friend_id);

    const users = await User.findAll({
      where: {
        id: { [Op.ne]: userId },
        id: { [Op.notIn]: friendIdList },
        [Op.or]: [
          { name: { [Op.like]: `%${keyword}%` } },
          { account: { [Op.like]: `%${keyword}%` } }
        ],
        status: 'active'
      },
      attributes: ['id', 'account', 'name', 'portrait', 'sex', 'signature', 'is_online'],
      limit: 20
    });

    // 统一字段名，将portrait映射为avatar
    const formattedUsers = users.map(user => ({
      ...user.toJSON(),
      avatar: user.portrait
    }));

    res.json({
      code: 200,
      message: '搜索用户成功',
      data: formattedUsers
    });
  } catch (error) {
    console.error('搜索用户失败:', error);
    res.status(500).json({
      code: 500,
      message: '搜索用户失败',
      error: error.message
    });
  }
};

// 检查是否为好友
const checkIsFriend = async (req, res) => {
  try {
    const { userId } = req.user;
    const { friendId } = req.params;

    const friend = await Friend.findOne({
      where: {
        user_id: userId,
        friend_id: friendId
      }
    });

    res.json({
      code: 200,
      message: '检查好友关系成功',
      data: {
        isFriend: !!friend
      }
    });
  } catch (error) {
    console.error('检查好友关系失败:', error);
    res.status(500).json({
      code: 500,
      message: '检查好友关系失败',
      error: error.message
    });
  }
};

// 获取好友列表（用于右边栏显示）
const getFriendsForSidebar = async (req, res) => {
  try {
    const { userId } = req.user;

    const friends = await Friend.findAll({
      where: { 
        user_id: userId,
        status: 'accepted' // 只获取已接受的好友
      },
      include: [{
        model: User,
        as: 'friendUser',
        attributes: ['id', 'account', 'name', 'portrait', 'sex', 'signature', 'is_online', 'last_opt_time']
      }],
      order: [
        ['is_concern', 'DESC'], // 特别关心的好友排在前面
        ['create_time', 'DESC']
      ]
    });

    const friendList = friends.map(friend => ({
      id: friend.friendUser.id,
      account: friend.friendUser.account,
      name: friend.friendUser.name,
      portrait: friend.friendUser.portrait,
      avatar: friend.friendUser.portrait, // 统一使用avatar字段
      sex: friend.friendUser.sex,
      signature: friend.friendUser.signature,
      is_online: friend.friendUser.is_online,
      last_opt_time: friend.friendUser.last_opt_time,
      remark: friend.remark || friend.friendUser.name, // 使用备注或用户名
      is_concern: friend.is_concern, // 是否特别关心
      add_time: friend.create_time
    }));

    res.json({
      code: 200,
      message: '获取好友列表成功',
      data: {
        friends: friendList,
        total: friendList.length
      }
    });
  } catch (error) {
    console.error('获取好友列表失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取好友列表失败',
      error: error.message
    });
  }
};

// 批量添加群成员为好友
const addGroupMembersAsFriends = async (req, res) => {
  try {
    const { userId } = req.user;
    const { groupId } = req.params;

    if (!groupId) {
      return res.status(400).json({
        code: 400,
        message: '群组ID不能为空'
      });
    }

    // 检查群组是否存在
    const group = await ChatGroup.findByPk(groupId);
    if (!group) {
      return res.status(404).json({
        code: 404,
        message: '群组不存在'
      });
    }

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
        message: '您不是该群组的成员'
      });
    }

    // 获取群组所有成员
    const groupMembers = await UserChatGroup.findAll({
      where: { group_id: groupId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'account', 'name', 'portrait']
      }]
    });

    if (groupMembers.length <= 1) {
      return res.status(400).json({
        code: 400,
        message: '群组成员不足，无法添加好友'
      });
    }

    // 获取当前用户的所有好友ID
    const existingFriends = await Friend.findAll({
      where: {
        [Op.or]: [
          { user_id: userId },
          { friend_id: userId }
        ]
      }
    });

    const friendIds = new Set();
    existingFriends.forEach(friend => {
      if (friend.user_id === userId) {
        friendIds.add(friend.friend_id);
      } else {
        friendIds.add(friend.user_id);
      }
    });

    // 准备批量添加的好友数据
    const friendsToAdd = [];
    const addedFriends = [];
    const alreadyFriends = [];

    for (const member of groupMembers) {
      const memberId = member.user_id;
      
      // 跳过自己
      if (memberId === userId) {
        continue;
      }

      // 检查是否已经是好友
      if (friendIds.has(memberId)) {
        alreadyFriends.push({
          id: member.user.id,
          account: member.user.account,
          name: member.user.name,
          portrait: member.user.portrait,
          avatar: member.user.portrait // 统一使用avatar字段
        });
        continue;
      }

      // 添加到待添加列表
      friendsToAdd.push({
        user_id: userId,
        friend_id: memberId,
        status: 'accepted',
        create_time: new Date(),
        update_time: new Date()
      });

      addedFriends.push({
        id: member.user.id,
        account: member.user.account,
        name: member.user.name,
        portrait: member.user.portrait
      });
    }

    // 批量创建好友关系
    if (friendsToAdd.length > 0) {
      await Friend.bulkCreate(friendsToAdd);
    }

    res.json({
      code: 200,
      message: '批量添加好友成功',
      data: {
        added_count: addedFriends.length,
        already_friends_count: alreadyFriends.length,
        added_friends: addedFriends,
        already_friends: alreadyFriends
      }
    });

  } catch (error) {
    console.error('批量添加群成员为好友错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误',
      data: null
    });
  }
};

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendRequests,
  addFriend,
  deleteFriend,
  getFriendList,
  searchUsers,
  checkIsFriend,
  getFriendsForSidebar,
  addGroupMembersAsFriends
};
