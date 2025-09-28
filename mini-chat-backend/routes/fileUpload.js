const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const upload = require('../middleware/upload');
const authMiddleware = require('../middleware/auth');

// 所有路由都需要身份验证
router.use(authMiddleware);

// 上传图片
router.post('/uploadImage', upload.single('file'), fileController.uploadImage);

// 上传文件
router.post('/uploadFile', upload.single('file'), fileController.uploadFile);

// 获取文件
router.get('/:filename', fileController.getFile);

// 删除文件
router.delete('/:filename', fileController.deleteFile);

module.exports = router;
