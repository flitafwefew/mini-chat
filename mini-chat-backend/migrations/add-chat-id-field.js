const { Sequelize } = require('sequelize');

// 数据库配置
const sequelize = new Sequelize(
  process.env.DB_NAME || 'mini_chat',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '123456',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql'
  }
);

async function addChatIdField() {
  try {
    console.log('开始添加 chat_id 字段...');
    
    // 检查字段是否已存在
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'mini_chat'}' 
      AND TABLE_NAME = 'chat_list' 
      AND COLUMN_NAME = 'chat_id'
    `);
    
    if (results.length === 0) {
      // 添加 chat_id 字段
      await sequelize.query(`
        ALTER TABLE chat_list 
        ADD COLUMN chat_id VARCHAR(64) NULL COMMENT '聊天目标ID' 
        AFTER type
      `);
      console.log('✅ chat_id 字段添加成功');
    } else {
      console.log('ℹ️ chat_id 字段已存在');
    }
    
    // 检查 last_message_id 字段
    const [messageIdResults] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'mini_chat'}' 
      AND TABLE_NAME = 'chat_list' 
      AND COLUMN_NAME = 'last_message_id'
    `);
    
    if (messageIdResults.length === 0) {
      // 添加 last_message_id 字段
      await sequelize.query(`
        ALTER TABLE chat_list 
        ADD COLUMN last_message_id VARCHAR(64) NULL COMMENT '最后一条消息ID' 
        AFTER chat_id
      `);
      console.log('✅ last_message_id 字段添加成功');
    } else {
      console.log('ℹ️ last_message_id 字段已存在');
    }
    
    // 检查 unread_count 字段
    const [unreadCountResults] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'mini_chat'}' 
      AND TABLE_NAME = 'chat_list' 
      AND COLUMN_NAME = 'unread_count'
    `);
    
    if (unreadCountResults.length === 0) {
      // 添加 unread_count 字段
      await sequelize.query(`
        ALTER TABLE chat_list 
        ADD COLUMN unread_count INT NULL DEFAULT 0 COMMENT '未读消息数量' 
        AFTER last_message_id
      `);
      console.log('✅ unread_count 字段添加成功');
    } else {
      console.log('ℹ️ unread_count 字段已存在');
    }
    
    // 检查 status 字段
    const [statusResults] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'mini_chat'}' 
      AND TABLE_NAME = 'chat_list' 
      AND COLUMN_NAME = 'status'
    `);
    
    if (statusResults.length === 0) {
      // 添加 status 字段
      await sequelize.query(`
        ALTER TABLE chat_list 
        ADD COLUMN status VARCHAR(500) NULL COMMENT '状态' 
        AFTER unread_count
      `);
      console.log('✅ status 字段添加成功');
    } else {
      console.log('ℹ️ status 字段已存在');
    }
    
    console.log('🎉 数据库字段更新完成！');
    
  } catch (error) {
    console.error('❌ 数据库字段更新失败:', error.message);
  } finally {
    await sequelize.close();
  }
}

// 运行迁移
addChatIdField();
