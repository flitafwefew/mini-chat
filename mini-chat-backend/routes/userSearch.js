const express = require('express');
const router = express.Router();
const userSearchController = require('../controllers/userSearchController');
const auth = require('../middleware/auth');

// 用户搜索相关路由
router.get('/search', auth, userSearchController.searchUsers);
router.get('/recommended', auth, userSearchController.getRecommendedUsers);
router.get('/:user_id', auth, userSearchController.getUserDetails);

module.exports = router;
