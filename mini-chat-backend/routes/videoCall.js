const express = require('express');
const router = express.Router();
const videoCallController = require('../controllers/videoCallController');
const authMiddleware = require('../middleware/auth');

// 所有路由都需要身份验证
router.use(authMiddleware);

// 视频通话相关路由
router.post('/offer', videoCallController.sendVideoOffer);
router.post('/answer', videoCallController.sendVideoAnswer);
router.post('/candidate', videoCallController.sendVideoCandidate);
router.post('/hangup', videoCallController.hangupCall);
router.post('/invite', videoCallController.inviteVideoCall);
router.post('/accept', videoCallController.acceptVideoCall);

module.exports = router;
