const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getOnlineUsers } = require('../config/ws');
const { WebSocket } = require('ws');

// 文件传输相关路由
router.post('/offer', auth, (req, res) => {
  // 处理WebRTC offer，转发给接收方
  const { userId } = req.body; // targetId
  const fromUserId = req.user.userId;
  const { desc } = req.body;
  
  if (!userId) {
    return res.status(400).json({
      code: 400,
      msg: '目标用户ID不能为空',
      data: null
    });
  }
  
  // 通过WebSocket发送offer给接收方
  const onlineUsers = getOnlineUsers();
  const userIdStr = String(userId);
  console.log(`🔍 [offer] 查找用户 ${userIdStr} (原始类型: ${typeof userId})`);
  console.log(`🔍 [offer] 在线用户列表:`, Array.from(onlineUsers.keys()));
  
  const targetWs = onlineUsers.get(userIdStr);
  console.log(`🔍 [offer] 找到的WebSocket:`, targetWs ? `存在，状态: ${targetWs.readyState} (OPEN=${WebSocket.OPEN})` : '不存在');
  if (targetWs && targetWs.readyState === WebSocket.OPEN) {
    targetWs.send(JSON.stringify({
      type: 'file',
      content: {
        type: 'offer',
        userId: fromUserId,
        fromId: fromUserId,
        desc: desc
      }
    }));
    console.log(`用户 ${fromUserId} 向用户 ${userId} 发送文件传输 offer`);
  } else {
    console.log(`用户 ${userId} 不在线，无法发送 offer`);
  }
  
  res.json({
    code: 200,
    msg: 'Offer处理成功',
    data: null
  });
});

router.post('/answer', auth, (req, res) => {
  // 处理WebRTC answer，转发给发送方
  const { userId } = req.body; // targetId
  const fromUserId = req.user.userId;
  const { desc } = req.body;
  
  if (!userId) {
    return res.status(400).json({
      code: 400,
      msg: '目标用户ID不能为空',
      data: null
    });
  }
  
  if (!desc) {
    console.error('❌ [answer] desc为空，无法处理');
    return res.status(400).json({
      code: 400,
      msg: 'Answer描述不能为空',
      data: null
    });
  }
  
  // 验证desc格式
  if (!desc.type || !desc.sdp) {
    console.error('❌ [answer] desc格式不正确:', desc);
    return res.status(400).json({
      code: 400,
      msg: 'Answer描述格式错误',
      data: null
    });
  }
  
  console.log(`📥 [answer] 用户 ${fromUserId} 发送answer到用户 ${userId}`);
  console.log(`📥 [answer] desc类型: ${desc.type}, sdp长度: ${desc.sdp ? desc.sdp.length : 0}`);
  
  // 通过WebSocket发送answer给发送方
  const onlineUsers = getOnlineUsers();
  const userIdStr = String(userId);
  console.log(`🔍 [answer] 查找用户 ${userIdStr} (原始类型: ${typeof userId})`);
  console.log(`🔍 [answer] 在线用户列表:`, Array.from(onlineUsers.keys()));
  
  const targetWs = onlineUsers.get(userIdStr);
  console.log(`🔍 [answer] 找到的WebSocket:`, targetWs ? `存在，状态: ${targetWs.readyState} (OPEN=${WebSocket.OPEN})` : '不存在');
  if (targetWs && targetWs.readyState === WebSocket.OPEN) {
    const message = {
      type: 'file',
      content: {
        type: 'answer',
        userId: fromUserId,
        fromId: fromUserId,
        desc: desc
      }
    };
    console.log(`📤 [answer] 发送消息到用户 ${userId}:`, JSON.stringify(message).substring(0, 200) + '...');
    targetWs.send(JSON.stringify(message));
    console.log(`✅ 用户 ${fromUserId} 向用户 ${userId} 发送文件传输 answer 成功`);
  } else {
    console.error(`❌ 用户 ${userId} 不在线，无法发送 answer`);
    return res.status(400).json({
      code: 400,
      msg: '目标用户不在线',
      data: null
    });
  }
  
  res.json({
    code: 200,
    msg: 'Answer处理成功',
    data: null
  });
});

router.post('/candidate', auth, (req, res) => {
  // 处理WebRTC candidate，转发给接收方
  const { userId } = req.body; // targetId
  const fromUserId = req.user.userId;
  const { candidate: candidateData } = req.body;
  
  if (!userId) {
    return res.status(400).json({
      code: 400,
      msg: '目标用户ID不能为空',
      data: null
    });
  }
  
  // 通过WebSocket发送candidate给接收方
  const onlineUsers = getOnlineUsers();
  const userIdStr = String(userId);
  
  const targetWs = onlineUsers.get(userIdStr);
  if (targetWs && targetWs.readyState === WebSocket.OPEN) {
    targetWs.send(JSON.stringify({
      type: 'file',
      content: {
        type: 'candidate',
        userId: fromUserId,
        fromId: fromUserId,
        candidate: candidateData
      }
    }));
  }
  
  res.json({
    code: 200,
    msg: 'Candidate处理成功',
    data: null
  });
});

router.post('/cancel', auth, (req, res) => {
  // 处理文件传输取消
  const { userId } = req.body; // targetId
  const fromUserId = req.user.userId;
  
  if (!userId) {
    return res.status(400).json({
      code: 400,
      msg: '目标用户ID不能为空',
      data: null
    });
  }
  
  console.log(`用户 ${fromUserId} 取消向用户 ${userId} 的文件传输`);
  
  // 通过WebSocket通知对方取消
  const onlineUsers = getOnlineUsers();
  const targetWs = onlineUsers.get(userId);
  if (targetWs && targetWs.readyState === WebSocket.OPEN) {
    targetWs.send(JSON.stringify({
      type: 'file',
      content: {
        type: 'cancel',
        userId: fromUserId,
        fromId: fromUserId
      }
    }));
  }
  
  res.json({
    code: 200,
    msg: '文件传输已取消',
    data: null
  });
});

router.post('/invite', auth, (req, res) => {
  // 处理文件传输邀请，通过WebSocket发送给接收方
  const { userId, fileInfo } = req.body; // userId是目标用户ID
  const fromUserId = req.user.userId;
  
  if (!userId || !fileInfo) {
    return res.status(400).json({
      code: 400,
      msg: '参数不完整',
      data: null
    });
  }
  
  console.log(`用户 ${fromUserId} 向用户 ${userId} 发送文件传输邀请: ${fileInfo.name}`);
  
  // 通过WebSocket发送邀请给接收方
  const onlineUsers = getOnlineUsers();
  const userIdStr = String(userId);
  console.log(`🔍 [invite] 查找用户 ${userIdStr} (原始类型: ${typeof userId})`);
  console.log(`🔍 [invite] 在线用户总数: ${onlineUsers.size}`);
  console.log(`🔍 [invite] 在线用户列表:`, Array.from(onlineUsers.keys()));
  
  // 遍历检查所有用户
  console.log(`🔍 [invite] 详细检查:`);
  for (const [key, value] of onlineUsers.entries()) {
    console.log(`  - 用户ID: ${key} (类型: ${typeof key}), WebSocket状态: ${value.readyState} (OPEN=${WebSocket.OPEN})`);
  }
  
  const targetWs = onlineUsers.get(userIdStr);
  console.log(`🔍 [invite] 找到的WebSocket:`, targetWs ? `存在，状态: ${targetWs.readyState} (OPEN=${WebSocket.OPEN})` : '不存在');
  if (targetWs && targetWs.readyState === WebSocket.OPEN) {
    targetWs.send(JSON.stringify({
      type: 'file',
      content: {
        type: 'invite',
        userId: userId,
        fromId: fromUserId,
        fileInfo: {
          name: fileInfo.name,
          size: fileInfo.size
        }
      }
    }));
    console.log(`文件传输邀请已通过WebSocket发送给用户 ${userId}`);
  } else {
    console.log(`用户 ${userId} 不在线，无法发送文件传输邀请`);
  }
  
  res.json({
    code: 200,
    msg: '邀请发送成功',
    data: null
  });
});

router.post('/accept', auth, (req, res) => {
  // 处理文件传输接受，通知发送方
  const { userId } = req.body; // targetId (发送方的ID)
  const fromUserId = req.user.userId;
  
  if (!userId) {
    return res.status(400).json({
      code: 400,
      msg: '目标用户ID不能为空',
      data: null
    });
  }
  
  console.log(`用户 ${fromUserId} 接受来自用户 ${userId} 的文件传输`);
  
  // 通过WebSocket发送accept给发送方
  const onlineUsers = getOnlineUsers();
  const userIdStr = String(userId);
  console.log(`🔍 [accept] 查找用户 ${userIdStr} (原始类型: ${typeof userId})`);
  console.log(`🔍 [accept] 在线用户列表:`, Array.from(onlineUsers.keys()));
  
  const targetWs = onlineUsers.get(userIdStr);
  console.log(`🔍 [accept] 找到的WebSocket:`, targetWs ? `存在，状态: ${targetWs.readyState} (OPEN=${WebSocket.OPEN})` : '不存在');
  if (targetWs && targetWs.readyState === WebSocket.OPEN) {
    targetWs.send(JSON.stringify({
      type: 'file',
      content: {
        type: 'accept',
        userId: fromUserId,
        fromId: fromUserId
      }
    }));
    console.log(`文件传输接受通知已通过WebSocket发送给用户 ${userId}`);
  } else {
    console.log(`用户 ${userId} 不在线，无法发送接受通知`);
  }
  
  res.json({
    code: 200,
    msg: '文件传输已接受',
    data: null
  });
});

module.exports = router;
