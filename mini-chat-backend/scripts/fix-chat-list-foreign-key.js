const { Sequelize } = require('sequelize');
const path = require('path');

// 加载环境变量
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// 数据库配置
const sequelize = new Sequelize(
  process.env.DB_NAME || 'mini_chat',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '123456',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false
  }
);

async function fixChatListForeignKey() {
  try {
    console.log('🔧 开始修复 chat_list 表的外键约束...\n');
    
    const dbName = process.env.DB_NAME || 'mini_chat';
    
    // 1. 检查并删除不合适的外键约束
    const [constraints] = await sequelize.query(`
      SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = '${dbName}' 
      AND TABLE_NAME = 'chat_list'
      AND REFERENCED_TABLE_NAME IS NOT NULL
      AND COLUMN_NAME = 'from_id'
    `);
    
    if (constraints.length > 0) {
      console.log(`📋 找到 ${constraints.length} 个 from_id 的外键约束:`);
      constraints.forEach(c => {
        console.log(`   - ${c.CONSTRAINT_NAME}: ${c.COLUMN_NAME} -> ${c.REFERENCED_TABLE_NAME}.${c.REFERENCED_COLUMN_NAME}`);
      });
      
      // 删除这些外键约束
      for (const constraint of constraints) {
        try {
          await sequelize.query(`
            ALTER TABLE chat_list 
            DROP FOREIGN KEY ${constraint.CONSTRAINT_NAME}
          `);
          console.log(`✅ 已删除外键约束: ${constraint.CONSTRAINT_NAME}`);
        } catch (error) {
          console.warn(`⚠️  删除外键约束 ${constraint.CONSTRAINT_NAME} 时出错:`, error.message);
        }
      }
    } else {
      console.log('✅ 没有找到 from_id 的外键约束，无需修复');
    }
    
    // 2. 检查 chat_list 表中的数据一致性
    console.log('\n🔍 检查 chat_list 表的数据一致性...');
    
    // 获取所有有效的用户ID
    const [users] = await sequelize.query(`
      SELECT id FROM users
    `);
    const validUserIds = users.map(u => u.id);
    console.log(`   有效用户数: ${validUserIds.length}`);
    
    // 获取所有有效的群组ID
    const [groups] = await sequelize.query(`
      SELECT id FROM chat_group
    `);
    const validGroupIds = groups.map(g => g.id);
    console.log(`   有效群组数: ${validGroupIds.length}`);
    
    // 检查无效的 chat_list 记录
    const userIdsStr = validUserIds.length > 0 
      ? validUserIds.map(id => `'${id.replace(/'/g, "''")}'`).join(',')
      : "'__none__'";
    
    const groupIdsStr = validGroupIds.length > 0 
      ? validGroupIds.map(id => `'${id.replace(/'/g, "''")}'`).join(',')
      : "'__none__'";
    
    const [invalidPrivateChats] = await sequelize.query(`
      SELECT COUNT(*) as count FROM chat_list 
      WHERE (type = 'private' OR type IS NULL) 
      AND from_id NOT IN (${userIdsStr})
    `);
    
    const [invalidGroupChats] = await sequelize.query(`
      SELECT COUNT(*) as count FROM chat_list 
      WHERE type = 'group' 
      AND from_id NOT IN (${groupIdsStr})
    `);
    
    const invalidPrivateCount = invalidPrivateChats[0]?.count || 0;
    const invalidGroupCount = invalidGroupChats[0]?.count || 0;
    
    if (invalidPrivateCount > 0 || invalidGroupCount > 0) {
      console.log(`\n⚠️  发现无效的 chat_list 记录:`);
      console.log(`   - 无效私聊记录: ${invalidPrivateCount} 条`);
      console.log(`   - 无效群聊记录: ${invalidGroupCount} 条`);
      
      // 清理无效记录
      if (invalidPrivateCount > 0) {
        await sequelize.query(`
          DELETE FROM chat_list 
          WHERE (type = 'private' OR type IS NULL) 
          AND from_id NOT IN (${userIdsStr})
        `);
        console.log(`✅ 已清理 ${invalidPrivateCount} 条无效私聊记录`);
      }
      
      if (invalidGroupCount > 0) {
        await sequelize.query(`
          DELETE FROM chat_list 
          WHERE type = 'group' 
          AND from_id NOT IN (${groupIdsStr})
        `);
        console.log(`✅ 已清理 ${invalidGroupCount} 条无效群聊记录`);
      }
    } else {
      console.log('✅ chat_list 表数据一致，无需清理');
    }
    
    console.log('\n✅ 修复完成！');
    
  } catch (error) {
    console.error('❌ 修复过程中出错:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

// 运行修复
fixChatListForeignKey();

