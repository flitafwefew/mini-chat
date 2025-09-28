const mysql = require('mysql2/promise');
const config = require('./config/db.js');

async function checkUsers() {
  try {
    const connection = await mysql.createConnection(config);
    console.log('🔍 正在查询数据库中的用户...');
    
    const [users] = await connection.execute('SELECT id, name, email, created_at FROM users ORDER BY created_at DESC');
    
    if (users.length === 0) {
      console.log('❌ 数据库中没有用户数据');
    } else {
      console.log(`✅ 找到 ${users.length} 个用户:`);
      console.log('┌─────┬─────────────┬─────────────────────────┬─────────────────────┐');
      console.log('│ ID  │ 用户名      │ 邮箱                    │ 创建时间            │');
      console.log('├─────┼─────────────┼─────────────────────────┼─────────────────────┤');
      
      users.forEach(user => {
        const id = user.id.toString().padEnd(3);
        const name = (user.name || 'N/A').padEnd(11);
        const email = (user.email || 'N/A').padEnd(23);
        const createdAt = user.created_at ? new Date(user.created_at).toLocaleString('zh-CN') : 'N/A';
        console.log(`│ ${id} │ ${name} │ ${email} │ ${createdAt.padEnd(19)} │`);
      });
      
      console.log('└─────┴─────────────┴─────────────────────────┴─────────────────────┘');
    }
    
    await connection.end();
  } catch (error) {
    console.error('❌ 查询用户失败:', error.message);
  }
}

checkUsers();
