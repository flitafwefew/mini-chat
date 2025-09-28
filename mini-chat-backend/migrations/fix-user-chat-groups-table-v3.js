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
    
    // 检查表结构
    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'mini_chat'}' 
      AND TABLE_NAME = 'user_chat_groups'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('当前表结构:', columns);
    
    // 检查是否有主键
    const primaryKey = columns.find(col => col.COLUMN_KEY === 'PRI');
    if (!primaryKey) {
      // 添加主键
      await sequelize.query(`
        ALTER TABLE user_chat_groups 
        ADD COLUMN id VARCHAR(64) PRIMARY KEY FIRST
      `);
      console.log('✅ id 主键字段添加成功');
    } else {
      console.log('ℹ️ 主键已存在:', primaryKey.COLUMN_NAME);
    }
    
    // 检查是否有重复的字段，如果有则删除多余的
    const groupIdColumns = columns.filter(col => col.COLUMN_NAME.includes('group_id'));
    if (groupIdColumns.length > 1) {
      console.log('发现重复的 group_id 字段，清理中...');
      // 保留 group_id，删除 chat_group_id
      if (groupIdColumns.find(col => col.COLUMN_NAME === 'chat_group_id')) {
        await sequelize.query(`
          ALTER TABLE user_chat_groups 
          DROP COLUMN chat_group_id
        `);
        console.log('✅ 删除了重复的 chat_group_id 字段');
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
