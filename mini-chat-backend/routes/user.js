const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// 用户认证路由
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', auth, authController.logout);

// 用户信息路由
router.get('/info', auth, authController.getUserInfo);
router.put('/info', auth, authController.updateUserInfo);

// 用户列表路由
router.get('/list', authController.getUserList);
router.get('/list/map', authController.getUserListMap);
router.get('/online/web', authController.getOnlineUsers);

// 用户更新路由
router.post('/update', auth, authController.updateUser);

module.exports = router;