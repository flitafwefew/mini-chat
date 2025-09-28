const { sequelize } = require('./mini-chat-backend/models/associations');
const { Friend, User } = require('./mini-chat-backend/models/associations');
const crypto = require('crypto');

async function createTestFriends() {
  try {
    console.log('开始创建测试好友关系...');
    
    // 获取所有用户
    const users = await User.findAll({
      attributes: ['id', 'account', 'name']
    });
    
    console.log('找到用户:', users.map(u => ({ id: u.id, account: u.account, name: u.name })));
    
    if (users.length < 2) {
      console.log('用户数量不足，无法创建好友关系');
      return;
    }
    
    // 为每个用户添加其他用户为好友
    for (let i = 0; i < users.length; i++) {
      for (let j = 0; j < users.length; j++) {
        if (i !== j) {
          const userId = users[i].id;
          const friendId = users[j].id;
          
          // 检查是否已经是好友
          const existingFriend = await Friend.findOne({
            where: {
              user_id: userId,
              friend_id: friendId
            }
          });
          
          if (!existingFriend) {
            const now = new Date();
            await Friend.create({
              id: crypto.randomUUID(),
              user_id: userId,
              friend_id: friendId,
              status: 'accepted',
              remark: users[j].name || users[j].account,
              create_time: now,
              update_time: now
            });
            console.log(`添加好友关系: ${users[i].account} -> ${users[j].account}`);
          } else {
            console.log(`好友关系已存在: ${users[i].account} -> ${users[j].account}`);
          }
        }
      }
    }
    
    // 验证好友关系
    console.log('\n验证好友关系:');
    const allFriends = await Friend.findAll({
      include: [{
        model: User,
        as: 'friendUser',
        attributes: ['account', 'name']
      }],
      include: [{
        model: User,
        as: 'user',
        attributes: ['account', 'name']
      }]
    });
    
    console.log('所有好友关系:', allFriends.map(f => ({
      user: f.user?.account || f.user_id,
      friend: f.friendUser?.account || f.friend_id,
      status: f.status
    })));
    
    console.log('测试好友关系创建完成！');
    
  } catch (error) {
    console.error('创建好友关系时出错:', error);
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

createTestFriends();
