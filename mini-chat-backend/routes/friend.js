const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const authMiddleware = require('../middleware/auth');

// 所有路由都需要身份验证
router.use(authMiddleware);

// 发送好友申请
router.post('/request', friendController.sendFriendRequest);

// 接受好友申请
router.post('/accept', friendController.acceptFriendRequest);

// 拒绝好友申请
router.post('/reject', friendController.rejectFriendRequest);

// 获取好友申请列表
router.get('/requests', friendController.getFriendRequests);

// 添加好友（直接添加，用于测试）
router.post('/add', friendController.addFriend);

// 删除好友
router.delete('/delete/:friendId', friendController.deleteFriend);

// 获取好友列表
router.get('/list', friendController.getFriendList);

// 搜索用户（用于添加好友）
router.get('/search', friendController.searchUsers);

// 检查是否为好友
router.get('/check/:friendId', friendController.checkIsFriend);

// 获取好友列表（用于右边栏显示）
router.get('/sidebar', friendController.getFriendsForSidebar);

// 批量添加群成员为好友
router.post('/add-group-members/:groupId', friendController.addGroupMembersAsFriends);

module.exports = router;
