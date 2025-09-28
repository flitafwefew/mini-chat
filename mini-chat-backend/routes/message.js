const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');

// 消息相关路由
router.post('/send', auth, messageController.sendMessage);
router.post('/send/group', auth, messageController.sendGroupMessage);
router.post('/send/private', auth, messageController.sendPrivateMessage);
router.get('/list', auth, messageController.getMessages);
router.get('/chat-list', auth, messageController.getChatList);
router.get('/group-list', auth, messageController.getGroupChatList);
router.get('/private-list', auth, messageController.getPrivateChatList);
router.post('/mark-read', auth, messageController.markAsRead);

module.exports = router;