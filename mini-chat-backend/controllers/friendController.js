const { User, Friend, ChatGroup, UserChatGroup } = require('../models/associations');
const { Op } = require('sequelize');
const { sendSuccess, sendError } = require('../utils/response');
const sequelize = require('../config/db');

// 发送好友申请
const sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.user;
    const { friendId, message } = req.body;

    if (!friendId) {
      return res.status(400).json({
        code: 400,
        message: '好友ID不能为空',
        data: []
      });
    }

    if (userId === friendId) {
      return res.status(400).json({
        code: 400,
        message: '不能添加自己为好友',
        data: []
      });
    }

    // 检查好友是否存在
    const friend = await User.findByPk(friendId);
    if (!friend) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        data: []
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
        message: '已经是好友关系',
        data: []
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
        message: '已经发送过好友申请',
        data: []
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
      data: [],
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
        message: '好友ID不能为空',
        data: []
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
        message: '未找到待处理的好友申请',
        data: []
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
      data: [],
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
        message: '好友ID不能为空',
        data: []
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
        message: '未找到待处理的好友申请',
        data: []
      });
    }

    // 删除好友申请
    await friendRequest.destroy();

    res.json({
      code: 200,
      message: '拒绝好友申请成功',
      data: []
    });
  } catch (error) {
    console.error('拒绝好友申请失败:', error);
    res.status(500).json({
      code: 500,
      message: '拒绝好友申请失败',
      data: [],
      error: error.message
    });
  }
};

// 获取好友申请列表
const getFriendRequests = async (req, res) => {
  try {
    const { userId } = req.user;
    console.log('=== 获取好友申请列表开始 ===');
    console.log('userId:', userId);

    if (!userId) {
      return res.status(400).json({
        code: 400,
        message: '用户ID不能为空',
        data: []
      });
    }

    // 先检查 User 和 Friend 模型是否正确加载
    if (!User || !Friend) {
      console.error('模型未正确加载:', { User: !!User, Friend: !!Friend });
      throw new Error('数据库模型未正确加载');
    }

    console.log('开始查询好友申请，条件:', { friend_id: userId, status: 'pending' });
    const startTime = Date.now();

    // 先查询好友申请记录
    const requests = await Friend.findAll({
      where: {
        friend_id: userId,
        status: 'pending'
      },
      order: [['create_time', 'DESC']],
      limit: 50,
      raw: false // 确保返回 Sequelize 实例，以便使用关联
    });

    const queryTime = Date.now() - startTime;
    console.log(`查询好友申请耗时: ${queryTime}ms`);
    console.log('查询到的好友申请数量:', requests.length);

    if (requests.length === 0) {
      console.log('没有待处理的好友申请');
      return res.json({
        code: 200,
        message: '获取好友申请列表成功',
        data: []
      });
    }

    // 获取所有申请发送者的 user_id
    const senderIds = [...new Set(requests.map(r => r.user_id))];
    console.log('申请发送者IDs:', senderIds);

    // 批量查询用户信息
    const users = await User.findAll({
      where: {
        id: {
          [Op.in]: senderIds
        }
      },
      attributes: ['id', 'account', 'name', 'portrait', 'sex', 'signature'],
      raw: true
    });

    console.log('查询到用户数量:', users.length);
    
    // 创建用户ID到用户信息的映射
    const userMap = {};
    users.forEach(user => {
      userMap[user.id] = user;
    });

    // 组装返回数据
    const requestList = requests
      .map(request => {
        const sender = userMap[request.user_id];
        if (!sender) {
          console.warn('申请发送者不存在:', request.user_id);
          return null;
        }
        return {
          id: request.id,
          userId: sender.id,
          account: sender.account || '',
          name: sender.name || '',
          portrait: sender.portrait || '',
          avatar: sender.portrait || '', // 统一使用avatar字段
          sex: sender.sex || '',
          signature: sender.signature || '',
          message: request.remark || '',
          createTime: request.create_time
        };
      })
      .filter(item => item !== null); // 过滤掉 null 值

    console.log('处理后的申请列表数量:', requestList.length);
    console.log('=== 获取好友申请列表完成 ===');

    res.json({
      code: 200,
      message: '获取好友申请列表成功',
      data: requestList
    });
  } catch (error) {
    console.error('=== 获取好友申请列表失败 ===');
    console.error('错误名称:', error.name);
    console.error('错误消息:', error.message);
    console.error('错误堆栈:', error.stack);
    
    // 如果是 Sequelize 错误，输出更多信息
    if (error.name === 'SequelizeDatabaseError' || error.name === 'SequelizeValidationError') {
      console.error('Sequelize 错误详情:', {
        name: error.name,
        message: error.message,
        original: error.original
      });
    }

    res.status(500).json({
      code: 500,
      message: '获取好友申请列表失败',
      data: [],
      error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误',
      errorName: error.name
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
        message: '好友ID不能为空',
        data: []
      });
    }

    if (userId === friendId) {
      return res.status(400).json({
        code: 400,
        message: '不能添加自己为好友',
        data: []
      });
    }

    // 检查好友是否存在
    const friend = await User.findByPk(friendId);
    if (!friend) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        data: []
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
        message: '已经是好友关系',
        data: []
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
      data: [],
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
        message: '好友ID不能为空',
        data: []
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
      message: '删除好友成功',
      data: []
    });
  } catch (error) {
    console.error('删除好友失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除好友失败',
      data: [],
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
      data: [],
      error: error.message
    });
  }
};

// 搜索用户（用于添加好友）
const searchUsers = async (req, res) => {
  // 确保响应函数，防止重复发送
  let responseSent = false;
  const sendResponse = (code, message, data = []) => {
    if (responseSent || res.headersSent) {
      return;
    }
    responseSent = true;
    try {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(code).json({ code, message, data });
    } catch (err) {
      console.error('发送响应失败:', err);
      if (!res.finished) {
        try {
          res.status(code).end(JSON.stringify({ code, message, data }));
        } catch (e) {
          res.end();
        }
      }
    }
  };

  try {
    console.log('=== 搜索用户开始 ===');
    console.log('req.user:', req.user ? '存在' : '不存在');
    console.log('req.query:', req.query);

    // 验证 req.user 是否存在
    if (!req.user) {
      console.error('req.user 不存在');
      return sendResponse(401, '用户未认证或认证信息无效', []);
    }

    // 尝试多种方式获取 userId
    const userId = req.user.userId || req.user.user_id || req.user.id;

    // 验证 userId
    if (!userId) {
      console.error('userId 不存在');
      return sendResponse(401, '用户未认证或认证信息无效', []);
    }

    const { keyword } = req.query;

    // 验证 keyword
    if (!keyword || typeof keyword !== 'string' || keyword.trim() === '') {
      return sendResponse(400, '搜索关键词不能为空', []);
    }

    // 检查模型是否正确加载
    if (!User || !Friend) {
      console.error('模型未正确加载:', { User: !!User, Friend: !!Friend });
      return sendResponse(500, '服务器配置错误', []);
    }

    // 检查数据库连接状态
    try {
      await sequelize.authenticate();
      console.log('数据库连接正常');
    } catch (dbConnError) {
      console.error('数据库连接失败:', dbConnError.message);
      console.error('连接错误详情:', {
        name: dbConnError.name,
        code: dbConnError.original?.code,
        sqlState: dbConnError.original?.sqlState
      });
      return sendResponse(500, `数据库连接失败: ${dbConnError.message || '无法连接到数据库'}`, []);
    }

    const trimmedKeyword = keyword.trim();
    console.log('搜索关键词:', trimmedKeyword, 'userId:', userId);
    
    // 执行数据库查询
    let friendIds = [];
    let users = [];
    
    try {
      // 先测试一下能否查询到所有用户（用于调试）
      const allUsersCount = await User.count();
      console.log('数据库中总用户数:', allUsersCount);
      
      // 测试精确匹配查询
      const exactMatch = await User.findOne({
        where: {
          [Op.or]: [
            { account: trimmedKeyword },
            { name: trimmedKeyword }
          ]
        },
        attributes: ['id', 'account', 'name']
      });
      console.log('精确匹配结果:', exactMatch ? { id: exactMatch.id, account: exactMatch.account, name: exactMatch.name } : '未找到');
      
      // 并行查询好友列表和用户列表
      const [friendResults, userResults] = await Promise.allSettled([
        Friend.findAll({
          where: { user_id: userId },
          attributes: ['friend_id'],
          raw: true
        }),
        User.findAll({
          where: {
            id: { [Op.ne]: userId },
            [Op.or]: [
              sequelize.where(
                sequelize.fn('LOWER', sequelize.col('name')),
                'LIKE',
                `%${trimmedKeyword.toLowerCase()}%`
              ),
              sequelize.where(
                sequelize.fn('LOWER', sequelize.col('account')),
                'LIKE',
                `%${trimmedKeyword.toLowerCase()}%`
              )
            ]
          },
          attributes: ['id', 'account', 'name', 'portrait', 'sex', 'signature', 'is_online'],
          limit: 20,
          raw: false
        })
      ]);

      // 处理好友查询结果
      if (friendResults.status === 'fulfilled') {
        friendIds = friendResults.value || [];
      } else {
        console.error('好友查询失败:', friendResults.reason);
        friendIds = [];
      }

      // 处理用户查询结果
      if (userResults.status === 'fulfilled') {
        users = userResults.value || [];
        console.log(`用户查询成功，找到 ${users.length} 个用户`);
        if (users.length > 0) {
          console.log('找到的用户列表:');
          users.forEach((user, index) => {
            const userData = user.get ? user.get({ plain: true }) : (user.toJSON ? user.toJSON() : user);
            console.log(`  ${index + 1}. ID: ${userData.id}, Account: ${userData.account}, Name: ${userData.name}`);
          });
        } else {
          console.log('未找到匹配的用户，尝试查看所有用户...');
          // 调试：查看前5个用户
          const sampleUsers = await User.findAll({
            attributes: ['id', 'account', 'name'],
            limit: 5,
            raw: true
          });
          console.log('数据库中的示例用户:', sampleUsers);
        }
      } else {
        console.error('用户查询失败:', userResults.reason);
        console.error('错误堆栈:', userResults.reason?.stack);
        return sendResponse(500, `搜索失败: ${userResults.reason?.message || '数据库查询错误'}`, []);
      }
    } catch (dbError) {
      console.error('数据库查询异常:', dbError);
      console.error('错误堆栈:', dbError.stack);
      return sendResponse(500, `数据库查询失败: ${dbError.message || '未知错误'}`, []);
    }

    console.log(`找到 ${friendIds.length} 个好友，${users.length} 个用户`);

    // 构建好友ID集合
    const friendIdSet = new Set(friendIds.map(f => f.friend_id));

    // 格式化用户数据
    const formattedUsers = [];
    for (const user of users) {
      try {
        const userData = user.get ? user.get({ plain: true }) : (user.toJSON ? user.toJSON() : user);
        formattedUsers.push({
          id: userData.id || '',
          account: userData.account || '',
          name: userData.name || '',
          portrait: userData.portrait || '',
          avatar: userData.portrait || userData.avatar || '',
          sex: userData.sex || '',
          signature: userData.signature || '',
          is_online: userData.is_online || false,
          isFriend: friendIdSet.has(userData.id)
        });
      } catch (mapError) {
        console.error('映射用户数据错误:', mapError);
        // 跳过这个用户，继续处理下一个
      }
    }

    console.log('=== 搜索用户结束，返回', formattedUsers.length, '个用户 ===');
    
    // 发送成功响应
    return sendResponse(200, '搜索用户成功', formattedUsers);
    
  } catch (error) {
    console.error('=== 搜索用户异常 ===');
    console.error('错误:', error.name, error.message);
    console.error('堆栈:', error.stack);
    
    // 确保发送错误响应
    return sendResponse(500, `搜索用户失败: ${error.message || '未知错误'}`, []);
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
      data: [],
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
      data: [],
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
        message: '群组ID不能为空',
        data: []
      });
    }

    // 检查群组是否存在
    const group = await ChatGroup.findByPk(groupId);
    if (!group) {
      return res.status(404).json({
        code: 404,
        message: '群组不存在',
        data: []
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
        message: '您不是该群组的成员',
        data: []
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
        message: '群组成员不足，无法添加好友',
        data: []
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
      data: []
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
