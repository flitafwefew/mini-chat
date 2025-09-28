const { Sequelize } = require('sequelize');
require('dotenv').config();

// 数据库连接配置
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'mysql',
  logging: false, // 关闭SQL日志
});

// 定义Friend模型
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
  remark: {
    type: Sequelize.STRING,
    allowNull: true
  },
  status: {
    type: Sequelize.STRING,
    allowNull: true
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

async function fixFriendStatus() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 将所有status为1的好友关系更新为'accepted'
    const result = await Friend.update(
      { status: 'accepted' },
      { where: { status: '1' } }
    );

    console.log(`更新了 ${result[0]} 条好友关系的状态`);

    // 检查更新结果
    const acceptedCount = await Friend.count({
      where: { status: 'accepted' }
    });
    
    const pendingCount = await Friend.count({
      where: { status: 'pending' }
    });

    console.log(`\n状态统计:`);
    console.log(`  accepted: ${acceptedCount} 条`);
    console.log(`  pending: ${pendingCount} 条`);

    // 显示前5条好友关系
    console.log('\n前5条好友关系:');
    const friends = await Friend.findAll({
      limit: 5,
      order: [['create_time', 'DESC']]
    });
    
    friends.forEach(friend => {
      console.log(`  ${friend.user_id} -> ${friend.friend_id} (${friend.status})`);
    });

  } catch (error) {
    console.error('修复好友状态时出错:', error);
  } finally {
    await sequelize.close();
    console.log('\n数据库连接已关闭');
  }
}

// 运行脚本
fixFriendStatus();
