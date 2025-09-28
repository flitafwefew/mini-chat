const { Sequelize } = require('sequelize');
require('dotenv').config();

// 数据库连接配置
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'mysql',
  logging: false,
});

// 定义模型
const User = sequelize.define('user', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
    allowNull: false
  },
  account: {
    type: Sequelize.STRING,
    allowNull: false
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  portrait: {
    type: Sequelize.STRING,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: false
});

const Friend = sequelize.define('friend', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
    allowNull: false
  },
  user_id: {
    type: Sequelize.STRING,
    allowNull: false
  },
  friend_id: {
    type: Sequelize.STRING,
    allowNull: false
  },
  status: {
    type: Sequelize.STRING,
    defaultValue: 'accepted'
  },
  create_time: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  },
  update_time: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  tableName: 'friend',
  timestamps: false
});

// 设置关联
Friend.belongsTo(User, { 
  foreignKey: 'friend_id', 
  as: 'friendUser' 
});

async function addFriendsForBob() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 获取Bob的用户ID
    const bob = await User.findOne({ where: { account: 'bob' } });
    if (!bob) {
      console.log('❌ 找不到Bob用户');
      return;
    }
    console.log(`👤 找到Bob用户: ${bob.name} (${bob.id})`);

    // 获取所有其他用户
    const { Op } = require('sequelize');
    const otherUsers = await User.findAll({
      where: {
        id: { [Op.ne]: bob.id }
      }
    });
    console.log(`👥 找到 ${otherUsers.length} 个其他用户`);

    // 为Bob创建好友关系
    const friendRelations = [];
    for (const user of otherUsers) {
      // Bob -> 其他用户
      friendRelations.push({
        id: `friend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: bob.id,
        friend_id: user.id,
        status: 'accepted',
        create_time: new Date(),
        update_time: new Date()
      });

      // 其他用户 -> Bob
      friendRelations.push({
        id: `friend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: user.id,
        friend_id: bob.id,
        status: 'accepted',
        create_time: new Date(),
        update_time: new Date()
      });
    }

    // 批量插入好友关系
    await Friend.bulkCreate(friendRelations);
    console.log(`✅ 为Bob创建了 ${friendRelations.length} 条好友关系`);

    // 验证结果
    const bobFriends = await Friend.findAll({
      where: { 
        user_id: bob.id,
        status: 'accepted'
      },
      include: [{
        model: User,
        as: 'friendUser',
        attributes: ['id', 'name', 'account']
      }]
    });

    console.log(`\n🤝 Bob的好友列表 (${bobFriends.length} 个):`);
    bobFriends.forEach((friend, index) => {
      const friendUser = friend.friendUser;
      console.log(`  ${index + 1}. ${friendUser ? friendUser.name : 'Unknown'} (${friendUser ? friendUser.account : 'Unknown'})`);
    });

    console.log('\n🎉 Bob的好友关系创建完成！');

  } catch (error) {
    console.error('❌ 操作失败:', error);
  } finally {
    await sequelize.close();
    console.log('\n🔌 数据库连接已关闭');
  }
}

// 运行脚本
addFriendsForBob();
