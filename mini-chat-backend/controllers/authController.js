const { User } = require('../models/associations');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// 用户注册
const register = async (req, res) => {
  try {
    const { account, name, password, email, phone } = req.body;
    
    // 检查用户是否已存在
    const existingUser = await User.findOne({ where: { account } });
    if (existingUser) {
      return res.status(400).json({
        code: 400,
        msg: '用户已存在',
        data: null
      });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建用户
    const userId = uuidv4();
    const user = await User.create({
      id: userId,
      account,
      name,
      password: hashedPassword,
      email,
      phone,
      create_time: new Date(),
      update_time: new Date(),
      status: 'active'
    });

    // 生成JWT token
    const token = jwt.sign(
      { userId: user.id, account: user.account },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      code: 200,
      msg: '注册成功',
      data: {
        token,
        user: {
          id: user.id,
          account: user.account,
          name: user.name,
          email: user.email,
          phone: user.phone,
          portrait: user.portrait
        }
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器错误',
      data: null
    });
  }
};

// 用户登录
const login = async (req, res) => {
  try {
    const { account, password } = req.body;
    
    // 查找用户
    const user = await User.findOne({ where: { account } });
    if (!user) {
      return res.status(400).json({
        code: 400,
        msg: '用户不存在',
        data: null
      });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({
        code: 400,
        msg: '密码错误',
        data: null
      });
    }

    // 更新在线状态
    await user.update({
      is_online: true,
      last_opt_time: new Date(),
      update_time: new Date()
    });

    // 生成JWT token
    const token = jwt.sign(
      { userId: user.id, account: user.account },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      code: 200,
      msg: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          account: user.account,
          name: user.name,
          email: user.email,
          phone: user.phone,
          portrait: user.portrait,
          is_online: user.is_online
        }
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器错误',
      data: null
    });
  }
};

// 获取用户信息
const getUserInfo = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        code: 404,
        msg: '用户不存在',
        data: null
      });
    }

    res.json({
      code: 200,
      msg: '获取成功',
      data: user
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器错误',
      data: null
    });
  }
};

// 更新用户信息
const updateUserInfo = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, email, phone, signature, portrait } = req.body;
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        code: 404,
        msg: '用户不存在',
        data: null
      });
    }

    await user.update({
      name: name || user.name,
      email: email || user.email,
      phone: phone || user.phone,
      signature: signature || user.signature,
      portrait: portrait || user.portrait,
      update_time: new Date()
    });

    res.json({
      code: 200,
      msg: '更新成功',
      data: {
        id: user.id,
        account: user.account,
        name: user.name,
        email: user.email,
        phone: user.phone,
        signature: user.signature,
        portrait: user.portrait
      }
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器错误',
      data: null
    });
  }
};

// 用户登出
const logout = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findByPk(userId);
    
    if (user) {
      await user.update({
        is_online: false,
        update_time: new Date()
      });
    }

    res.json({
      code: 200,
      msg: '登出成功',
      data: null
    });
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器错误',
      data: null
    });
  }
};

// 获取用户列表
const getUserList = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { status: 'active' },
      attributes: ['id', 'account', 'name', 'portrait', 'sex', 'signature', 'is_online', 'create_time'],
      order: [['create_time', 'DESC']]
    });

    // 统一字段名，将portrait映射为avatar
    const formattedUsers = users.map(user => ({
      ...user.toJSON(),
      avatar: user.portrait
    }));

    res.json({
      code: 200,
      msg: '获取用户列表成功',
      data: formattedUsers
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器错误',
      data: null
    });
  }
};

// 获取用户列表映射
const getUserListMap = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { status: 'active' },
      attributes: ['id', 'account', 'name', 'portrait', 'sex', 'signature', 'is_online']
    });

    const userMap = {};
    users.forEach(user => {
      userMap[user.id] = {
        id: user.id,
        account: user.account,
        name: user.name,
        avatar: user.portrait, // 统一使用avatar字段
        portrait: user.portrait, // 保持向后兼容
        sex: user.sex,
        signature: user.signature,
        is_online: user.is_online,
        type: 'user' // 添加type字段
      };
    });

    res.json({
      code: 200,
      msg: '获取用户列表映射成功',
      data: userMap
    });
  } catch (error) {
    console.error('获取用户列表映射错误:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器错误',
      data: null
    });
  }
};

// 获取在线用户
const getOnlineUsers = async (req, res) => {
  try {
    const onlineUsers = await User.findAll({
      where: { 
        status: 'active',
        is_online: true 
      },
      attributes: ['id', 'account', 'name', 'portrait', 'sex', 'signature', 'last_opt_time'],
      order: [['last_opt_time', 'DESC']]
    });

    // 统一字段名，将portrait映射为avatar
    const formattedUsers = onlineUsers.map(user => ({
      ...user.toJSON(),
      avatar: user.portrait
    }));

    res.json({
      code: 200,
      msg: '获取在线用户成功',
      data: formattedUsers
    });
  } catch (error) {
    console.error('获取在线用户错误:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器错误',
      data: null
    });
  }
};

// 更新用户信息
const updateUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updateData = req.body;
    
    // 移除不应该更新的字段
    delete updateData.id;
    delete updateData.password;
    delete updateData.create_time;
    
    updateData.update_time = new Date();
    
    await User.update(updateData, {
      where: { id: userId }
    });

    const updatedUser = await User.findByPk(userId, {
      attributes: ['id', 'account', 'name', 'portrait', 'sex', 'signature', 'phone', 'email', 'birthday']
    });

    // 统一字段名，将portrait映射为avatar
    const formattedUser = {
      ...updatedUser.toJSON(),
      avatar: updatedUser.portrait
    };

    res.json({
      code: 200,
      msg: '更新用户信息成功',
      data: formattedUser
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器错误',
      data: null
    });
  }
};

module.exports = {
  register,
  login,
  getUserInfo,
  updateUserInfo,
  logout,
  getUserList,
  getUserListMap,
  getOnlineUsers,
  updateUser
};
