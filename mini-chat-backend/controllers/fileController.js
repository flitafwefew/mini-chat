const upload = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

// 上传图片
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: 400,
        message: '没有上传文件'
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      code: 200,
      message: '上传成功',
      data: {
        url: fileUrl,
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('上传图片失败:', error);
    res.status(500).json({
      code: 500,
      message: '上传失败',
      error: error.message
    });
  }
};

// 上传文件
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: 400,
        message: '没有上传文件'
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      code: 200,
      message: '上传成功',
      data: {
        url: fileUrl,
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('上传文件失败:', error);
    res.status(500).json({
      code: 500,
      message: '上传失败',
      error: error.message
    });
  }
};

// 获取文件
const getFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        code: 404,
        message: '文件不存在'
      });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('获取文件失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取文件失败',
      error: error.message
    });
  }
};

// 删除文件
const deleteFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除文件失败:', error);
    res.status(500).json({
      code: 500,
      message: '删除失败',
      error: error.message
    });
  }
};

module.exports = {
  uploadImage,
  uploadFile,
  getFile,
  deleteFile
};
