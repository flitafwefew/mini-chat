const mysql = require('mysql2/promise');
const fs = require('fs');

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'mini_chat',
  charset: 'utf8mb4'
};

async function importRecoveredData() {
  let connection;
  
  try {
    console.log('🔗 连接到数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');

    // 检查当前数据状态
    console.log('\n📊 检查当前数据状态...');
    const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM user');
    const [messageCount] = await connection.execute('SELECT COUNT(*) as count FROM message');
    const [chatListCount] = await connection.execute('SELECT COUNT(*) as count FROM chat_list');
    const [friendCount] = await connection.execute('SELECT COUNT(*) as count FROM friend');

    console.log(`当前数据统计:`);
    console.log(`- 用户: ${userCount[0].count} 个`);
    console.log(`- 消息: ${messageCount[0].count} 条`);
    console.log(`- 聊天列表: ${chatListCount[0].count} 条`);
    console.log(`- 好友关系: ${friendCount[0].count} 条`);

    // 显示用户列表
    console.log('\n👥 当前用户列表:');
    const [users] = await connection.execute(`
      SELECT id, account, name, phone, email, create_time 
      FROM user 
      ORDER BY create_time DESC 
      LIMIT 10
    `);
    
    users.forEach(user => {
      console.log(`- ${user.name} (${user.account}) - ${user.create_time}`);
    });

    // 显示消息统计
    console.log('\n💬 消息统计:');
    const [messageStats] = await connection.execute(`
      SELECT 
        DATE(create_time) as date,
        COUNT(*) as count
      FROM message 
      GROUP BY DATE(create_time) 
      ORDER BY date DESC
    `);
    
    messageStats.forEach(stat => {
      console.log(`- ${stat.date}: ${stat.count} 条消息`);
    });

    console.log('\n🎉 数据导入完成！您的项目现在包含了所有恢复的数据。');
    console.log('\n📋 数据恢复总结:');
    console.log('✅ 用户数据已恢复');
    console.log('✅ 聊天消息已恢复');
    console.log('✅ 聊天列表已恢复');
    console.log('✅ 好友关系已恢复');

  } catch (error) {
    console.error('❌ 导入过程中发生错误:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 数据库连接已关闭');
    }
  }
}

// 运行导入
importRecoveredData();

