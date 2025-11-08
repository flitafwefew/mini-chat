const { Sequelize } = require('sequelize');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

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

async function restoreGroupMembers() {
  try {
    console.log('🔄 开始恢复群成员...\n');
    
    const dbName = process.env.DB_NAME || 'mini_chat';
    
    // 1. 检查表是否存在
    const [groupTables] = await sequelize.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '${dbName}' AND TABLE_NAME = 'chat_group'`
    );
    
    if (groupTables.length === 0) {
      console.log('❌ chat_group 表不存在，无法恢复');
      return;
    }
    
    const [chatListTables] = await sequelize.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '${dbName}' AND TABLE_NAME = 'chat_list'`
    );
    
    if (chatListTables.length === 0) {
      console.log('❌ chat_list 表不存在，无法恢复');
      return;
    }
    
    const [userGroupTables] = await sequelize.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '${dbName}' AND TABLE_NAME = 'user_chat_groups'`
    );
    
    if (userGroupTables.length === 0) {
      console.log('❌ user_chat_groups 表不存在，无法恢复');
      return;
    }
    
    // 2. 从 chat_list 中获取所有群聊记录，推断群成员关系
    console.log('🔍 从聊天记录中查找群成员关系...');
    const [groupChats] = await sequelize.query(`
      SELECT DISTINCT
        cl.user_id,
        cl.from_id as group_id,
        cg.name as group_name,
        cg.owner_user_id
      FROM chat_list cl
      INNER JOIN chat_group cg ON cl.from_id = cg.id
      WHERE cl.type = 'group'
    `);
    
    if (groupChats.length === 0) {
      console.log('✅ 没有找到群聊记录，无需恢复群成员');
      await sequelize.close();
      return;
    }
    
    console.log(`📋 找到 ${groupChats.length} 条群聊记录，开始恢复群成员...\n`);
    
    // 3. 临时禁用外键检查
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    let restoredCount = 0;
    let skippedCount = 0;
    const now = new Date();
    
    try {
      for (const chat of groupChats) {
        try {
          // 检查是否已存在该成员关系
          const [existing] = await sequelize.query(`
            SELECT * FROM user_chat_groups 
            WHERE user_id = ? AND group_id = ?
            LIMIT 1
          `, {
            replacements: [chat.user_id, chat.group_id]
          });
          
          if (existing.length > 0) {
            skippedCount++;
            continue;
          }
          
          // 确定角色：如果是群主，则为 admin，否则为 member
          const role = chat.user_id === chat.owner_user_id ? 'admin' : 'member';
          
          // 检查表结构，确定需要插入的字段
          const [columns] = await sequelize.query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = '${dbName}' 
            AND TABLE_NAME = 'user_chat_groups'
            ORDER BY ORDINAL_POSITION
          `);
          
          const columnNames = columns.map(col => col.COLUMN_NAME);
          const hasId = columnNames.includes('id');
          const hasRole = columnNames.includes('role');
          const hasJoinTime = columnNames.includes('join_time');
          
          // 构建插入语句
          let insertFields = ['user_id', 'group_id'];
          let insertValues = [chat.user_id, chat.group_id];
          
          if (hasId) {
            insertFields.unshift('id');
            insertValues.unshift(uuidv4());
          }
          
          if (hasRole) {
            insertFields.push('role');
            insertValues.push(role);
          }
          
          if (hasJoinTime) {
            insertFields.push('join_time');
            insertValues.push(now);
          }
          
          if (columnNames.includes('create_time')) {
            insertFields.push('create_time');
            insertValues.push(now);
          }
          
          if (columnNames.includes('update_time')) {
            insertFields.push('update_time');
            insertValues.push(now);
          }
          
          const placeholders = insertValues.map(() => '?').join(', ');
          const fieldsStr = insertFields.join(', ');
          
          // 插入群成员关系
          await sequelize.query(`
            INSERT INTO user_chat_groups (${fieldsStr})
            VALUES (${placeholders})
          `, {
            replacements: insertValues
          });
          
          restoredCount++;
          if (restoredCount % 10 === 0) {
            console.log(`   已恢复 ${restoredCount} 条群成员记录...`);
          }
        } catch (error) {
          console.warn(`   ⚠️  恢复用户 ${chat.user_id} 到群组 "${chat.group_name}" 时出错:`, error.message);
        }
      }
    } finally {
      // 重新启用外键检查
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    }
    
    console.log(`\n✅ 恢复完成！`);
    console.log(`   - 新增群成员记录: ${restoredCount} 条`);
    console.log(`   - 已存在的记录: ${skippedCount} 条`);
    
    // 4. 更新群组的成员数
    console.log('\n🔄 更新群组成员数...');
    const [groups] = await sequelize.query(`
      SELECT id, name FROM chat_group
    `);
    
    for (const group of groups) {
      const [memberCount] = await sequelize.query(`
        SELECT COUNT(*) as count FROM user_chat_groups WHERE group_id = ?
      `, {
        replacements: [group.id]
      });
      
      await sequelize.query(`
        UPDATE chat_group SET member_num = ? WHERE id = ?
      `, {
        replacements: [memberCount[0].count, group.id]
      });
      
      console.log(`   - ${group.name}: ${memberCount[0].count} 人`);
    }
    
    // 5. 验证恢复结果
    const [finalCount] = await sequelize.query(
      "SELECT COUNT(*) as count FROM user_chat_groups"
    );
    console.log(`\n📊 当前群成员关联总数: ${finalCount[0].count}`);
    
  } catch (error) {
    console.error('❌ 恢复过程中出错:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

// 运行恢复
restoreGroupMembers();

