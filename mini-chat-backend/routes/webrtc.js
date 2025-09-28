const express = require('express');
const router = express.Router();
const webrtcController = require('../controllers/webrtcController');
const authMiddleware = require('../middleware/auth');

// 所有路由都需要身份验证
router.use(authMiddleware);

// WebRTC文件传输相关路由
router.post('/offer', webrtcController.sendOffer);
router.post('/answer', webrtcController.sendAnswer);
router.post('/candidate', webrtcController.sendCandidate);
router.post('/cancel', webrtcController.cancelTransfer);
router.post('/invite', webrtcController.inviteTransfer);
router.post('/accept', webrtcController.acceptTransfer);

module.exports = router;
