const express = require('express');
const router = express.Router();
const privateChatController = require('../controllers/privateChatController');
const auth = require('../middleware/auth');

// 私聊房间相关路由
router.post('/room/create', auth, privateChatController.createOrGetPrivateChatRoom);
router.get('/rooms', auth, privateChatController.getPrivateChatRooms);
router.get('/room/:room_id/messages', auth, privateChatController.getPrivateChatMessages);
router.post('/room/:room_id/send', auth, privateChatController.sendPrivateMessage);
router.delete('/room/:room_id', auth, privateChatController.deletePrivateChatRoom);

module.exports = router;
