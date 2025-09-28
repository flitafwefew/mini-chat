const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const token = req.header('x-token');
    
    if (!token) {
      return res.status(401).json({
        code: 401,
        msg: '未提供认证令牌',
        data: null
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        msg: '认证令牌已过期',
        data: null
      });
    }
    
    return res.status(401).json({
      code: 401,
      msg: '无效的认证令牌',
      data: null
    });
  }
};

module.exports = auth;
