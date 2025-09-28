// WebRTC文件传输相关功能
const { User } = require('../models/associations');

// 存储WebRTC连接信息
const connections = new Map();

// 发送offer
const sendOffer = async (req, res) => {
  try {
    const { userId } = req.user;
    const { targetId, offer } = req.body;

    if (!targetId || !offer) {
      return res.status(400).json({
        code: 400,
        message: '参数不完整'
      });
    }

    // 存储offer信息
    const connectionId = `${userId}-${targetId}`;
    connections.set(connectionId, {
      from: userId,
      to: targetId,
      offer: offer,
      type: 'file-transfer'
    });

    res.json({
      code: 200,
      message: 'Offer发送成功',
      data: { connectionId }
    });
  } catch (error) {
    console.error('发送offer失败:', error);
    res.status(500).json({
      code: 500,
      message: '发送失败',
      error: error.message
    });
  }
};

// 发送answer
const sendAnswer = async (req, res) => {
  try {
    const { userId } = req.user;
    const { targetId, answer } = req.body;

    if (!targetId || !answer) {
      return res.status(400).json({
        code: 400,
        message: '参数不完整'
      });
    }

    const connectionId = `${targetId}-${userId}`;
    const connection = connections.get(connectionId);
    
    if (!connection) {
      return res.status(404).json({
        code: 404,
        message: '连接不存在'
      });
    }

    connection.answer = answer;
    connections.set(connectionId, connection);

    res.json({
      code: 200,
      message: 'Answer发送成功'
    });
  } catch (error) {
    console.error('发送answer失败:', error);
    res.status(500).json({
      code: 500,
      message: '发送失败',
      error: error.message
    });
  }
};

// 发送candidate
const sendCandidate = async (req, res) => {
  try {
    const { userId } = req.user;
    const { targetId, candidate } = req.body;

    if (!targetId || !candidate) {
      return res.status(400).json({
        code: 400,
        message: '参数不完整'
      });
    }

    const connectionId = `${targetId}-${userId}`;
    const connection = connections.get(connectionId);
    
    if (!connection) {
      return res.status(404).json({
        code: 404,
        message: '连接不存在'
      });
    }

    if (!connection.candidates) {
      connection.candidates = [];
    }
    connection.candidates.push(candidate);
    connections.set(connectionId, connection);

    res.json({
      code: 200,
      message: 'Candidate发送成功'
    });
  } catch (error) {
    console.error('发送candidate失败:', error);
    res.status(500).json({
      code: 500,
      message: '发送失败',
      error: error.message
    });
  }
};

// 取消文件传输
const cancelTransfer = async (req, res) => {
  try {
    const { userId } = req.user;
    const { targetId } = req.body;

    if (!targetId) {
      return res.status(400).json({
        code: 400,
        message: '目标用户ID不能为空'
      });
    }

    const connectionId = `${userId}-${targetId}`;
    connections.delete(connectionId);

    console.log(`用户 ${userId} 取消向用户 ${targetId} 的文件传输`);

    res.json({
      code: 200,
      message: '取消成功'
    });
  } catch (error) {
    console.error('取消传输失败:', error);
    res.status(500).json({
      code: 500,
      message: '取消失败',
      error: error.message
    });
  }
};

// 邀请文件传输
const inviteTransfer = async (req, res) => {
  try {
    const { userId } = req.user;
    const { targetId, fileName, fileSize } = req.body;

    if (!targetId || !fileName) {
      return res.status(400).json({
        code: 400,
        message: '参数不完整'
      });
    }

    // 这里可以通过WebSocket发送邀请通知
    res.json({
      code: 200,
      message: '邀请发送成功',
      data: {
        from: userId,
        to: targetId,
        fileName,
        fileSize
      }
    });
  } catch (error) {
    console.error('发送邀请失败:', error);
    res.status(500).json({
      code: 500,
      message: '发送失败',
      error: error.message
    });
  }
};

// 接受文件传输
const acceptTransfer = async (req, res) => {
  try {
    const { userId } = req.user;
    const { targetId } = req.body;

    res.json({
      code: 200,
      message: '接受成功'
    });
  } catch (error) {
    console.error('接受传输失败:', error);
    res.status(500).json({
      code: 500,
      message: '接受失败',
      error: error.message
    });
  }
};

module.exports = {
  sendOffer,
  sendAnswer,
  sendCandidate,
  cancelTransfer,
  inviteTransfer,
  acceptTransfer
};
