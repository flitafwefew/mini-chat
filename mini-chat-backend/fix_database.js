const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'mini_chat',
    charset: 'utf8mb4'
  });

  try {
    console.log('开始修复数据库...');

    // 1. 检查并添加 sender_id 字段
    console.log('检查 message 表结构...');
    const [columns] = await connection.execute('DESCRIBE message');
    const hasSenderId = columns.some(col => col.Field === 'sender_id');
    
    if (!hasSenderId) {
      console.log('添加 sender_id 字段...');
      await connection.execute('ALTER TABLE message ADD COLUMN sender_id VARCHAR(64) NULL COMMENT "发送者ID"');
      console.log('sender_id 字段添加成功');
    } else {
      console.log('sender_id 字段已存在');
    }

    // 2. 修复字符集问题 - 统一所有表的字符集
    console.log('修复字符集问题...');
    
    const tables = ['user', 'message', 'chat_list', 'chat_group', 'friend', 'user_chat_groups'];
    
    for (const table of tables) {
      console.log(`修复表 ${table} 的字符集...`);
      await connection.execute(`ALTER TABLE ${table} CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    }
    
    console.log('字符集修复完成');

    // 3. 验证修复结果
    console.log('验证修复结果...');
    const [messageColumns] = await connection.execute('DESCRIBE message');
    console.log('message 表字段:', messageColumns.map(col => col.Field));
    
    console.log('数据库修复完成！');
    
  } catch (error) {
    console.error('修复数据库时出错:', error);
  } finally {
    await connection.end();
  }
}

fixDatabase();