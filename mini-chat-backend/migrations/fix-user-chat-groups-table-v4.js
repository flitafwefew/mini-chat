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
    
    // 检查外键约束
    const [constraints] = await sequelize.query(`
      SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'mini_chat'}' 
      AND TABLE_NAME = 'user_chat_groups'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    console.log('外键约束:', constraints);
    
    // 删除外键约束
    for (const constraint of constraints) {
      try {
        await sequelize.query(`
          ALTER TABLE user_chat_groups 
          DROP FOREIGN KEY ${constraint.CONSTRAINT_NAME}
        `);
        console.log(`✅ 删除了外键约束: ${constraint.CONSTRAINT_NAME}`);
      } catch (error) {
        console.log(`ℹ️ 外键约束 ${constraint.CONSTRAINT_NAME} 可能不存在或已删除`);
      }
    }
    
    // 重新创建表结构
    console.log('重新创建 user_chat_groups 表...');
    
    // 删除现有表
    await sequelize.query(`DROP TABLE IF EXISTS user_chat_groups`);
    
    // 创建新表
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
    console.log('✅ user_chat_groups 表重新创建成功');
    
    // 添加测试数据
    console.log('添加测试数据到 user_chat_groups 表...');
    await sequelize.query(`
      INSERT INTO user_chat_groups (id, user_id, group_id) VALUES
      ('ucg_001', 'user-001', 'group_1758430505132'),
      ('ucg_002', 'user-002', 'group_1758430505132'),
      ('ucg_003', 'user-003', 'group_1758430505132')
    `);
    console.log('✅ 测试数据添加成功');
    
    console.log('🎉 user_chat_groups 表结构修复完成！');
    
  } catch (error) {
    console.error('❌ 数据库表结构修复失败:', error.message);
  } finally {
    await sequelize.close();
  }
}

// 运行修复脚本
fixUserChatGroupsTable();
