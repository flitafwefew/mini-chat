const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixRoleColumn() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('检查 user_chat_groups 表结构...');
    
    // 检查表是否存在 role 列
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' 
      AND TABLE_NAME = 'user_chat_groups' 
      AND COLUMN_NAME = 'role'
    `);
    
    if (columns.length === 0) {
      console.log('添加 role 列...');
      await connection.execute(`
        ALTER TABLE user_chat_groups 
        ADD COLUMN role ENUM('admin', 'member') DEFAULT 'member' NOT NULL
      `);
      console.log('role 列添加成功');
    } else {
      console.log('role 列已存在');
    }
    
    // 检查表是否存在 join_time 列
    const [joinTimeColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' 
      AND TABLE_NAME = 'user_chat_groups' 
      AND COLUMN_NAME = 'join_time'
    `);
    
    if (joinTimeColumns.length === 0) {
      console.log('添加 join_time 列...');
      await connection.execute(`
        ALTER TABLE user_chat_groups 
        ADD COLUMN join_time DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
      `);
      console.log('join_time 列添加成功');
    } else {
      console.log('join_time 列已存在');
    }
    
    console.log('数据库表结构修复完成');
    
  } catch (error) {
    console.error('修复数据库表结构时出错:', error);
  } finally {
    await connection.end();
  }
}

fixRoleColumn();
