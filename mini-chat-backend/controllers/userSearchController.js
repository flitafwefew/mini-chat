const { User, PrivateChatRoom } = require('../models/associations');
const { Op } = require('sequelize');

// 搜索用户
const searchUsers = async (req, res) => {
  try {
    const { keyword, page = 1, limit = 20 } = req.query;
    const current_user_id = req.user.userId;
    
    if (!keyword || keyword.trim().length === 0) {
      return res.status(400).json({
        code: 400,
        msg: '请输入搜索关键词',
        data: null
      });
    }
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // 搜索用户（排除自己）
    const users = await User.findAll({
      where: {
        id: {
          [Op.ne]: current_user_id // 排除自己
        },
        [Op.or]: [
          { name: { [Op.like]: `%${keyword}%` } },
          { account: { [Op.like]: `%${keyword}%` } },
          { email: { [Op.like]: `%${keyword}%` } }
        ]
      },
      attributes: ['id', 'name', 'account', 'portrait', 'is_online', 'signature'],
      limit: parseInt(limit),
      offset: offset,
      order: [['name', 'ASC']]
    });
    
    // 检查每个用户是否已有私聊房间
    const usersWithChatStatus = await Promise.all(
      users.map(async (user) => {
        const existingRoom = await PrivateChatRoom.findOne({
          where: {
            [Op.or]: [
              { user1_id: current_user_id, user2_id: user.id },
              { user1_id: user.id, user2_id: current_user_id }
            ],
            is_active: true
          }
        });
        
        return {
          id: user.id,
          name: user.name,
          account: user.account,
          portrait: user.portrait,
          avatar: user.portrait, // 统一使用avatar字段
          isOnline: user.is_online,
          signature: user.signature,
          hasPrivateChat: !!existingRoom,
          roomId: existingRoom?.id || null
        };
      })
    );
    
    res.json({
      code: 0,
      msg: '搜索成功',
      data: {
        users: usersWithChatStatus,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: usersWithChatStatus.length
        }
      }
    });
  } catch (error) {
    console.error('搜索用户错误:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器错误',
      data: null
    });
  }
};

// 获取推荐用户（在线用户、最近活跃用户等）
const getRecommendedUsers = async (req, res) => {
  try {
    const current_user_id = req.user.userId;
    const { limit = 10 } = req.query;
    
    // 获取在线用户
    const onlineUsers = await User.findAll({
      where: {
        id: {
          [Op.ne]: current_user_id
        },
        is_online: true
      },
      attributes: ['id', 'name', 'account', 'portrait', 'is_online', 'signature'],
      limit: parseInt(limit),
      order: [['last_opt_time', 'DESC']]
    });
    
    // 检查每个用户是否已有私聊房间
    const usersWithChatStatus = await Promise.all(
      onlineUsers.map(async (user) => {
        const existingRoom = await PrivateChatRoom.findOne({
          where: {
            [Op.or]: [
              { user1_id: current_user_id, user2_id: user.id },
              { user1_id: user.id, user2_id: current_user_id }
            ],
            is_active: true
          }
        });
        
        return {
          id: user.id,
          name: user.name,
          account: user.account,
          portrait: user.portrait,
          avatar: user.portrait, // 统一使用avatar字段
          isOnline: user.is_online,
          signature: user.signature,
          hasPrivateChat: !!existingRoom,
          roomId: existingRoom?.id || null
        };
      })
    );
    
    res.json({
      code: 0,
      msg: '获取成功',
      data: usersWithChatStatus
    });
  } catch (error) {
    console.error('获取推荐用户错误:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器错误',
      data: null
    });
  }
};

// 获取用户详情
const getUserDetails = async (req, res) => {
  try {
    const { user_id } = req.params;
    const current_user_id = req.user.userId;
    
    if (user_id === current_user_id) {
      return res.status(400).json({
        code: 400,
        msg: '不能查看自己的详情',
        data: null
      });
    }
    
    const user = await User.findByPk(user_id, {
      attributes: ['id', 'name', 'account', 'portrait', 'is_online', 'signature', 'sex', 'birthday', 'create_time']
    });
    
    if (!user) {
      return res.status(404).json({
        code: 404,
        msg: '用户不存在',
        data: null
      });
    }
    
    // 检查是否已有私聊房间
    const existingRoom = await PrivateChatRoom.findOne({
      where: {
        [Op.or]: [
          { user1_id: current_user_id, user2_id: user_id },
          { user1_id: user_id, user2_id: current_user_id }
        ],
        is_active: true
      }
    });
    
    res.json({
      code: 0,
      msg: '获取成功',
      data: {
        id: user.id,
        name: user.name,
        account: user.account,
        portrait: user.portrait,
        isOnline: user.is_online,
        signature: user.signature,
        sex: user.sex,
        birthday: user.birthday,
        createTime: user.create_time,
        hasPrivateChat: !!existingRoom,
        roomId: existingRoom?.id || null
      }
    });
  } catch (error) {
    console.error('获取用户详情错误:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器错误',
      data: null
    });
  }
};

module.exports = {
  searchUsers,
  getRecommendedUsers,
  getUserDetails
};
