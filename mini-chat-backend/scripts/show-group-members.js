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

async function showGroupMembers() {
  try {
    console.log('📋 群聊成员列表\n');
    console.log('='.repeat(80));
    
    // 获取所有群组
    const [groups] = await sequelize.query(`
      SELECT id, name, owner_user_id, member_num, create_time
      FROM chat_group
      ORDER BY create_time DESC
    `);
    
    if (groups.length === 0) {
      console.log('❌ 没有找到群组');
      return;
    }
    
    console.log(`\n📊 共找到 ${groups.length} 个群组\n`);
    
    for (const group of groups) {
      console.log(`\n🏷️  群组: ${group.name}`);
      console.log(`   ID: ${group.id}`);
      console.log(`   群主ID: ${group.owner_user_id}`);
      console.log(`   成员数: ${group.member_num}`);
      console.log(`   创建时间: ${group.create_time}`);
      console.log(`\n   👥 成员列表:`);
      
      // 检查表结构
      const [columns] = await sequelize.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'user_chat_groups'
        AND COLUMN_NAME IN ('role', 'join_time')
      `, {
        replacements: [process.env.DB_NAME || 'mini_chat']
      });
      
      const hasRole = columns.some(col => col.COLUMN_NAME === 'role');
      const hasJoinTime = columns.some(col => col.COLUMN_NAME === 'join_time');
      
      // 构建查询字段
      let selectFields = ['u.id', 'u.account', 'u.name', 'u.portrait'];
      if (hasRole) selectFields.push('ucg.role');
      if (hasJoinTime) selectFields.push('ucg.join_time');
      
      // 获取群成员
      const [members] = await sequelize.query(`
        SELECT 
          ${selectFields.join(', ')}
        FROM user_chat_groups ucg
        INNER JOIN users u ON ucg.user_id = u.id
        WHERE ucg.group_id = ?
        ${hasJoinTime ? 'ORDER BY ucg.join_time ASC, u.name ASC' : 'ORDER BY u.name ASC'}
      `, {
        replacements: [group.id]
      });
      
      if (members.length === 0) {
        console.log(`   ⚠️  该群组没有成员`);
      } else {
        members.forEach((member, index) => {
          let roleLabel = '👤 成员';
          if (hasRole && member.role === 'admin') {
            roleLabel = '👑 群主';
          } else if (member.id === group.owner_user_id) {
            roleLabel = '👑 群主';
          }
          console.log(`   ${index + 1}. ${member.name || member.account} (${member.account}) - ${roleLabel}`);
        });
      }
      
      console.log(`\n${'─'.repeat(80)}`);
    }
    
    // 统计信息
    const [totalMembers] = await sequelize.query(`
      SELECT COUNT(*) as count FROM user_chat_groups
    `);
    
    // 检查是否有 role 字段
    const [checkColumns] = await sequelize.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'user_chat_groups'
      AND COLUMN_NAME = 'role'
    `, {
      replacements: [process.env.DB_NAME || 'mini_chat']
    });
    
    const hasRole = checkColumns.length > 0;
    let totalAdmins = 0;
    
    if (hasRole) {
      const [admins] = await sequelize.query(`
        SELECT COUNT(*) as count FROM user_chat_groups WHERE role = 'admin'
      `);
      totalAdmins = admins[0].count;
    } else {
      // 如果没有 role 字段，通过群主ID统计
      const uniqueOwners = new Set(groups.map(g => g.owner_user_id));
      totalAdmins = uniqueOwners.size;
    }
    
    console.log(`\n📊 统计信息:`);
    console.log(`   - 群组总数: ${groups.length}`);
    console.log(`   - 群成员关联总数: ${totalMembers[0].count}`);
    console.log(`   - 群主数量: ${totalAdmins}`);
    console.log(`   - 普通成员数: ${totalMembers[0].count - totalAdmins}`);
    
    console.log(`\n✅ 显示完成！\n`);
    
  } catch (error) {
    console.error('❌ 显示过程中出错:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

// 运行显示
showGroupMembers();

