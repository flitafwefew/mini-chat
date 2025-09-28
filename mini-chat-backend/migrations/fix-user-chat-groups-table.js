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

async function fixUserChatGroupsTable() {
  try {
    console.log('开始修复 user_chat_groups 表结构...');
    
    // 检查表是否存在
    const [tables] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'mini_chat'}' 
      AND TABLE_NAME = 'user_chat_groups'
    `);
    
    if (tables.length === 0) {
      // 创建 user_chat_groups 表
      await sequelize.query(`
        CREATE TABLE user_chat_groups (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL COMMENT '用户ID',
          group_id VARCHAR(64) NOT NULL COMMENT '群组ID',
          create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
          update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
          INDEX idx_user_id (user_id),
          INDEX idx_group_id (group_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户群组关联表'
      `);
      console.log('✅ user_chat_groups 表创建成功');
    } else {
      // 检查 group_id 字段是否存在
      const [columns] = await sequelize.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'mini_chat'}' 
        AND TABLE_NAME = 'user_chat_groups' 
        AND COLUMN_NAME = 'group_id'
      `);
      
      if (columns.length === 0) {
        // 添加 group_id 字段
        await sequelize.query(`
          ALTER TABLE user_chat_groups 
          ADD COLUMN group_id VARCHAR(64) NOT NULL COMMENT '群组ID' 
          AFTER user_id
        `);
        console.log('✅ group_id 字段添加成功');
        
        // 添加索引
        await sequelize.query(`
          ALTER TABLE user_chat_groups 
          ADD INDEX idx_group_id (group_id)
        `);
        console.log('✅ group_id 索引添加成功');
      } else {
        console.log('ℹ️ group_id 字段已存在');
      }
    }
    
    // 检查 user_chat_groups 表是否有数据，如果没有则添加一些测试数据
    const [count] = await sequelize.query(`
      SELECT COUNT(*) as count FROM user_chat_groups
    `);
    
    if (count[0].count === 0) {
      console.log('添加测试数据到 user_chat_groups 表...');
      
      // 添加测试数据
      await sequelize.query(`
        INSERT INTO user_chat_groups (id, user_id, group_id) VALUES
        ('ucg_001', 'user-001', 'group_1758430505132'),
        ('ucg_002', 'user-002', 'group_1758430505132'),
        ('ucg_003', 'user-003', 'group_1758430505132')
      `);
      console.log('✅ 测试数据添加成功');
    } else {
      console.log('ℹ️ user_chat_groups 表已有数据');
    }
    
    console.log('🎉 user_chat_groups 表结构修复完成！');
    
  } catch (error) {
    console.error('❌ 数据库表结构修复失败:', error.message);
  } finally {
    await sequelize.close();
  }
}

// 运行修复脚本
fixUserChatGroupsTable();
