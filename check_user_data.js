const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'mysql',
  logging: false
});

async function checkUsers() {
  try {
    console.log('🔍 检查所有用户...');
    const users = await sequelize.query('SELECT id, account, name FROM users ORDER BY account', {
      type: Sequelize.QueryTypes.SELECT
    });
    
    console.log('📋 所有用户列表:');
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.account}) - ID: ${user.id}`);
    });
    
    console.log('\n🔍 检查好友关系...');
    const friends = await sequelize.query('SELECT user_id, friend_id, status FROM friend WHERE status = "accepted"', {
      type: Sequelize.QueryTypes.SELECT
    });
    
    console.log('👥 好友关系:');
    friends.forEach(friend => {
      console.log(`  用户 ${friend.user_id} -> 好友 ${friend.friend_id}`);
    });
    
    console.log('\n🔍 检查群组成员关系...');
    const groups = await sequelize.query('SELECT user_id, group_id FROM user_chat_groups', {
      type: Sequelize.QueryTypes.SELECT
    });
    
    console.log('👥 群组成员关系:');
    groups.forEach(group => {
      console.log(`  用户 ${group.user_id} -> 群组 ${group.group_id}`);
    });
    
    console.log('\n🔍 检查聊天列表...');
    const chatLists = await sequelize.query('SELECT user_id, from_id, type FROM chat_list', {
      type: Sequelize.QueryTypes.SELECT
    });
    
    console.log('💬 聊天列表:');
    chatLists.forEach(chat => {
      console.log(`  用户 ${chat.user_id} -> ${chat.type}: ${chat.from_id}`);
    });
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

checkUsers();
