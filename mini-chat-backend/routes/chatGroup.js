const express = require('express');
const router = express.Router();
const { ChatGroup } = require('../models/associations');

// 获取所有聊天组
router.get('/', async (req, res) => {
  try {
    const groups = await ChatGroup.findAll({
      include: [{
        model: require('../models/User'),
        as: 'users',
        through: {
          attributes: [],
          where: {},
          required: false
        }
      }]
    });
    res.json({
      code: 200,
      msg: '获取聊天组列表成功',
      data: groups
    });
  } catch (error) {
    console.error('获取聊天组失败:', error);
    res.status(500).json({
      code: 500,
      msg: '获取聊天组失败',
      data: null
    });
  }
});

// 创建聊天组
router.post('/', async (req, res) => {
  try {
    const { name, description, userIds } = req.body;
    
    const group = await ChatGroup.create({
      id: `group_${Date.now()}`,
      name,
      notice: description || '',
      user_id: req.user?.id || 'user-001',
      owner_user_id: req.user?.id || 'user-001',
      chat_group_number: `group_${Date.now()}`,
      create_time: new Date(),
      update_time: new Date(),
      member_num: 1
    });
    
    // 添加用户到组
    if (userIds && userIds.length > 0) {
      await group.setUsers(userIds);
    }
    
    res.json({
      code: 200,
      msg: '创建聊天组成功',
      data: group
    });
  } catch (error) {
    console.error('创建聊天组失败:', error);
    res.status(500).json({
      code: 500,
      msg: '创建聊天组失败',
      data: null
    });
  }
});

// 获取特定聊天组
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const group = await ChatGroup.findByPk(id, {
      include: [{
        model: require('../models/User'),
        as: 'users',
        through: {
          attributes: [],
          where: {},
          required: false
        }
      }]
    });
    
    if (!group) {
      return res.status(404).json({
        code: 404,
        msg: '聊天组不存在',
        data: null
      });
    }
    
    res.json({
      code: 200,
      msg: '获取聊天组成功',
      data: group
    });
  } catch (error) {
    console.error('获取聊天组失败:', error);
    res.status(500).json({
      code: 500,
      msg: '获取聊天组失败',
      data: null
    });
  }
});

// 更新聊天组
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    const group = await ChatGroup.findByPk(id);
    if (!group) {
      return res.status(404).json({
        code: 404,
        msg: '聊天组不存在',
        data: null
      });
    }
    
    await group.update({ 
      name, 
      notice: description || group.notice,
      update_time: new Date()
    });
    
    res.json({
      code: 200,
      msg: '更新聊天组成功',
      data: group
    });
  } catch (error) {
    console.error('更新聊天组失败:', error);
    res.status(500).json({
      code: 500,
      msg: '更新聊天组失败',
      data: null
    });
  }
});

// 删除聊天组
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const group = await ChatGroup.findByPk(id);
    if (!group) {
      return res.status(404).json({
        code: 404,
        msg: '聊天组不存在',
        data: null
      });
    }
    
    await group.destroy();
    
    res.json({
      code: 200,
      msg: '删除聊天组成功',
      data: null
    });
  } catch (error) {
    console.error('删除聊天组失败:', error);
    res.status(500).json({
      code: 500,
      msg: '删除聊天组失败',
      data: null
    });
  }
});

// 标记聊天为已读
router.post('/read', async (req, res) => {
  try {
    const { targetId } = req.body;
    
    if (!targetId) {
      return res.status(400).json({
        code: 400,
        msg: '缺少targetId参数',
        data: null
      });
    }
    
    // 这里可以添加标记已读的逻辑
    // 比如更新数据库中的未读消息数等
    // 目前先返回成功响应
    
    res.json({
      code: 0,
      msg: '标记已读成功',
      data: null
    });
  } catch (error) {
    console.error('标记已读失败:', error);
    res.status(500).json({
      code: 500,
      msg: '标记已读失败',
      data: null
    });
  }
});

// 获取群聊列表
router.get('/group-list', async (req, res) => {
  try {
    const groups = await ChatGroup.findAll({
      include: [{
        model: require('../models/User'),
        as: 'users',
        through: {
          attributes: [],
          where: {},
          required: false
        }
      }]
    });
    
    // 转换为前端期望的格式
    const chatList = groups.map(group => ({
      id: group.id,
      userId: group.user_id,
      targetId: group.id,
      targetInfo: {
        id: group.id,
        name: group.name,
        avatar: group.portrait || '/default-avatar.png',
        type: 'group',
        badge: []
      },
      unreadCount: 0,
      lastMessage: {
        id: null,
        fromId: null,
        toId: null,
        fromInfo: null,
        message: null,
        referenceMsg: null,
        atUser: null,
        isShowTime: false,
        type: null,
        source: null,
        createTime: null,
        updateTime: null
      },
      type: 'group',
      createTime: group.create_time,
      updateTime: group.update_time
    }));
    
    res.json({
      code: 0,
      msg: '获取群聊列表成功',
      data: chatList
    });
  } catch (error) {
    console.error('获取群聊列表失败:', error);
    res.status(500).json({
      code: 500,
      msg: '获取群聊列表失败',
      data: null
    });
  }
});

// 获取私聊列表
router.get('/private-list', async (req, res) => {
  try {
    // 这里应该从数据库获取私聊列表
    // 目前先返回空数组
    res.json({
      code: 0,
      msg: '获取私聊列表成功',
      data: []
    });
  } catch (error) {
    console.error('获取私聊列表失败:', error);
    res.status(500).json({
      code: 500,
      msg: '获取私聊列表失败',
      data: null
    });
  }
});

// 创建聊天
router.post('/create', async (req, res) => {
  try {
    const { targetId } = req.body;
    
    if (!targetId) {
      return res.status(400).json({
        code: 400,
        msg: '缺少targetId参数',
        data: null
      });
    }
    
    // 这里可以添加创建聊天的逻辑
    // 目前先返回成功响应
    
    res.json({
      code: 0,
      msg: '创建聊天成功',
      data: null
    });
  } catch (error) {
    console.error('创建聊天失败:', error);
    res.status(500).json({
      code: 500,
      msg: '创建聊天失败',
      data: null
    });
  }
});

// 删除聊天
router.post('/delete', async (req, res) => {
  try {
    const { chatId } = req.body;
    
    if (!chatId) {
      return res.status(400).json({
        code: 400,
        msg: '缺少chatId参数',
        data: null
      });
    }
    
    // 这里可以添加删除聊天的逻辑
    // 目前先返回成功响应
    
    res.json({
      code: 0,
      msg: '删除聊天成功',
      data: null
    });
  } catch (error) {
    console.error('删除聊天失败:', error);
    res.status(500).json({
      code: 500,
      msg: '删除聊天失败',
      data: null
    });
  }
});

module.exports = router;
