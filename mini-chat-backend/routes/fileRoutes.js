const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// 文件传输相关路由
router.post('/offer', auth, (req, res) => {
  // 处理WebRTC offer
  res.json({
    code: 200,
    msg: 'Offer处理成功',
    data: null
  });
});

router.post('/answer', auth, (req, res) => {
  // 处理WebRTC answer
  res.json({
    code: 200,
    msg: 'Answer处理成功',
    data: null
  });
});

router.post('/candidate', auth, (req, res) => {
  // 处理WebRTC candidate
  res.json({
    code: 200,
    msg: 'Candidate处理成功',
    data: null
  });
});

router.post('/cancel', auth, (req, res) => {
  // 处理文件传输取消
  const { targetId } = req.body;
  
  if (!targetId) {
    return res.status(400).json({
      code: 400,
      msg: '目标用户ID不能为空',
      data: null
    });
  }
  
  console.log(`用户 ${req.user.userId} 取消向用户 ${targetId} 的文件传输`);
  
  // 这里可以添加更多的取消逻辑，比如：
  // 1. 通知对方用户传输已取消
  // 2. 清理WebRTC连接
  // 3. 更新传输状态等
  
  res.json({
    code: 200,
    msg: '文件传输已取消',
    data: null
  });
});

router.post('/invite', auth, (req, res) => {
  // 处理文件传输邀请
  res.json({
    code: 200,
    msg: '邀请发送成功',
    data: null
  });
});

router.post('/accept', auth, (req, res) => {
  // 处理文件传输接受
  res.json({
    code: 200,
    msg: '文件传输已接受',
    data: null
  });
});

module.exports = router;
