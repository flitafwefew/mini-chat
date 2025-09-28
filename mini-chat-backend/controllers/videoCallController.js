// 视频通话相关功能
const { User } = require('../models/associations');

// 存储视频通话连接信息
const videoConnections = new Map();

// 获取WebSocket连接映射（需要从server.js导入）
let userConnections = null;

// 设置用户连接映射
const setUserConnections = (connections) => {
  userConnections = connections;
};

// 发送视频通话offer
const sendVideoOffer = async (req, res) => {
  try {
    const { userId } = req.user;
    const { targetId, offer } = req.body;

    if (!targetId || !offer) {
      return res.status(400).json({
        code: 400,
        message: '参数不完整'
      });
    }

    // 存储视频通话信息
    const callId = `call-${Date.now()}-${userId}`;
    videoConnections.set(callId, {
      from: userId,
      to: targetId,
      offer: offer,
      type: 'video-call',
      status: 'calling',
      startTime: new Date()
    });

    res.json({
      code: 200,
      message: '视频通话邀请发送成功',
      data: { callId }
    });
  } catch (error) {
    console.error('发送视频通话offer失败:', error);
    res.status(500).json({
      code: 500,
      message: '发送失败',
      error: error.message
    });
  }
};

// 发送视频通话answer
const sendVideoAnswer = async (req, res) => {
  try {
    const { userId } = req.user;
    const { callId, answer } = req.body;

    if (!callId || !answer) {
      return res.status(400).json({
        code: 400,
        message: '参数不完整'
      });
    }

    const call = videoConnections.get(callId);
    if (!call) {
      return res.status(404).json({
        code: 404,
        message: '通话不存在'
      });
    }

    call.answer = answer;
    call.status = 'connected';
    videoConnections.set(callId, call);

    res.json({
      code: 200,
      message: 'Answer发送成功'
    });
  } catch (error) {
    console.error('发送视频通话answer失败:', error);
    res.status(500).json({
      code: 500,
      message: '发送失败',
      error: error.message
    });
  }
};

// 发送视频通话candidate
const sendVideoCandidate = async (req, res) => {
  try {
    const { userId } = req.user;
    const { callId, candidate } = req.body;

    if (!callId || !candidate) {
      return res.status(400).json({
        code: 400,
        message: '参数不完整'
      });
    }

    const call = videoConnections.get(callId);
    if (!call) {
      return res.status(404).json({
        code: 404,
        message: '通话不存在'
      });
    }

    if (!call.candidates) {
      call.candidates = [];
    }
    call.candidates.push(candidate);
    videoConnections.set(callId, call);

    res.json({
      code: 200,
      message: 'Candidate发送成功'
    });
  } catch (error) {
    console.error('发送视频通话candidate失败:', error);
    res.status(500).json({
      code: 500,
      message: '发送失败',
      error: error.message
    });
  }
};

// 挂断视频通话
const hangupCall = async (req, res) => {
  try {
    const { userId } = req.user;
    const { callId } = req.body;

    if (!callId) {
      return res.status(400).json({
        code: 400,
        message: '通话ID不能为空'
      });
    }

    const call = videoConnections.get(callId);
    if (call) {
      call.status = 'ended';
      call.endTime = new Date();
      videoConnections.set(callId, call);
    }

    res.json({
      code: 200,
      message: '挂断成功'
    });
  } catch (error) {
    console.error('挂断视频通话失败:', error);
    res.status(500).json({
      code: 500,
      message: '挂断失败',
      error: error.message
    });
  }
};

// 邀请视频通话
const inviteVideoCall = async (req, res) => {
  try {
    const { userId } = req.user;
    const { targetId, onlyAudio = false } = req.body;

    if (!targetId) {
      return res.status(400).json({
        code: 400,
        message: '目标用户ID不能为空'
      });
    }

    // 检查目标用户是否存在
    const targetUser = await User.findByPk(targetId);
    if (!targetUser) {
      return res.status(404).json({
        code: 404,
        message: '目标用户不存在'
      });
    }

    // 检查是否是自己
    if (userId === targetId) {
      return res.status(400).json({
        code: 400,
        message: '不能给自己发起通话'
      });
    }

    // 存储通话邀请信息
    const callId = `call-${Date.now()}-${userId}`;
    videoConnections.set(callId, {
      from: userId,
      to: targetId,
      type: onlyAudio ? 'audio-call' : 'video-call',
      status: 'inviting',
      startTime: new Date(),
      onlyAudio: onlyAudio
    });

    // 通过WebSocket发送通话邀请通知给目标用户
    if (userConnections) {
      const targetWs = userConnections.get(targetId);
      if (targetWs && targetWs.readyState === 1) { // WebSocket.OPEN = 1
        const inviteMessage = {
          type: 'video',
          content: {
            type: 'invite',
            callId: callId,
            fromId: userId,
            targetId: targetId,
            onlyAudio: onlyAudio,
            targetName: targetUser.name,
            timestamp: new Date().toISOString()
          }
        };
        targetWs.send(JSON.stringify(inviteMessage));
        console.log(`通话邀请已通过WebSocket发送给用户 ${targetId}`);
      } else {
        console.log(`用户 ${targetId} 不在线，无法发送通话邀请`);
      }
    }

    res.json({
      code: 200,
      message: `${onlyAudio ? '语音' : '视频'}通话邀请发送成功`,
      data: {
        callId: callId,
        from: userId,
        to: targetId,
        targetName: targetUser.name,
        onlyAudio: onlyAudio
      }
    });
  } catch (error) {
    console.error('发送视频通话邀请失败:', error);
    res.status(500).json({
      code: 500,
      message: '发送失败',
      error: error.message
    });
  }
};

// 接受视频通话
const acceptVideoCall = async (req, res) => {
  try {
    const { userId } = req.user;
    const { callId } = req.body;

    if (!callId) {
      return res.status(400).json({
        code: 400,
        message: '通话ID不能为空'
      });
    }

    const call = videoConnections.get(callId);
    if (!call) {
      return res.status(404).json({
        code: 404,
        message: '通话不存在'
      });
    }

    call.status = 'accepted';
    videoConnections.set(callId, call);

    res.json({
      code: 200,
      message: '接受成功'
    });
  } catch (error) {
    console.error('接受视频通话失败:', error);
    res.status(500).json({
      code: 500,
      message: '接受失败',
      error: error.message
    });
  }
};

module.exports = {
  sendVideoOffer,
  sendVideoAnswer,
  sendVideoCandidate,
  hangupCall,
  inviteVideoCall,
  acceptVideoCall,
  setUserConnections
};
