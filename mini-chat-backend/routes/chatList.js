const express = require('express');
const router = express.Router();
const chatListController = require('../controllers/chatListController');
const auth = require('../middleware/auth');

// 聊天列表相关路由
router.get('/', auth, chatListController.getChatList);
router.get('/group', auth, chatListController.getGroupChatList);
router.get('/list/private', auth, chatListController.getPrivateChatList);
router.post('/', auth, chatListController.createOrUpdateChat);
router.put('/:chat_id/:chat_type/unread', auth, chatListController.clearUnreadCount);
router.delete('/:chat_id/:chat_type', auth, chatListController.deleteChat);

// 标记消息为已读
router.post('/read', auth, chatListController.markAsRead);

// 群组相关路由
router.get('/groups', auth, chatListController.getGroupList);
router.post('/groups', auth, chatListController.createGroup);
router.post('/groups/join', auth, chatListController.joinGroup);
router.delete('/groups/:group_id', auth, chatListController.leaveGroup);
router.get('/groups/:groupId/members', auth, chatListController.getGroupMembers);

module.exports = router;
