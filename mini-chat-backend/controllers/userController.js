// controllers/userController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 登录
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(400).json({ code: 400, msg: '用户名或密码错误' });

    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ code: 400, msg: '用户名或密码错误' });

    // 生成JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'mini-chat-secret',
      { expiresIn: '24h' }
    );

    // 更新在线状态
    user.online = true;
    await user.save();

    res.json({
      code: 200,
      msg: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          type: user.type
        }
      }
    });
  } catch (err) {
    res.status(500).json({ code: 500, msg: '服务器错误', error: err.message });
  }
};

// 注册、获取用户列表等接口类似，此处省略