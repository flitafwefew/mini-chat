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

async function checkGroupData() {
  try {
    console.log('🔍 检查群聊数据状态...\n');
    
    const dbName = process.env.DB_NAME || 'mini_chat';
    
    // 1. 检查群组
    const [groups] = await sequelize.query(`
      SELECT id, name, member_num, create_time 
      FROM chat_group 
      ORDER BY create_time DESC
    `);
    console.log(`📊 群组数量: ${groups.length}`);
    if (groups.length > 0) {
      console.log('群组列表:');
      groups.slice(0, 5).forEach(g => {
        console.log(`   - ${g.name} (ID: ${g.id}, 成员数: ${g.member_num})`);
      });
    }
    
    // 2. 检查群成员关联
    const [memberCount] = await sequelize.query(`
      SELECT COUNT(*) as count FROM user_chat_groups
    `);
    console.log(`\n👥 群成员关联数: ${memberCount[0].count}`);
    
    // 检查每个群组的成员数
    const [groupMembers] = await sequelize.query(`
      SELECT 
        cg.id as group_id,
        cg.name as group_name,
        COUNT(ucg.user_id) as actual_member_count,
        cg.member_num as expected_member_count
      FROM chat_group cg
      LEFT JOIN user_chat_groups ucg ON cg.id = ucg.group_id
      GROUP BY cg.id, cg.name, cg.member_num
    `);
    
    if (groupMembers.length > 0) {
      console.log('\n群组成员统计:');
      groupMembers.forEach(gm => {
        const status = gm.actual_member_count === gm.expected_member_count ? '✅' : '⚠️';
        console.log(`   ${status} ${gm.group_name}: 实际 ${gm.actual_member_count} 人, 期望 ${gm.expected_member_count} 人`);
      });
    }
    
    // 3. 检查群聊消息
    const [messageCount] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM message 
      WHERE to_id LIKE 'group_%' OR to_id IN (SELECT id FROM chat_group)
    `);
    console.log(`\n💬 群聊消息数: ${messageCount[0].count}`);
    
    // 检查每个群组的消息数
    const [groupMessages] = await sequelize.query(`
      SELECT 
        cg.id as group_id,
        cg.name as group_name,
        COUNT(m.id) as message_count
      FROM chat_group cg
      LEFT JOIN message m ON (m.to_id = cg.id OR m.to_id = CONCAT('group_', cg.id))
      GROUP BY cg.id, cg.name
      ORDER BY message_count DESC
    `);
    
    if (groupMessages.length > 0) {
      console.log('\n群组消息统计:');
      groupMessages.forEach(gm => {
        console.log(`   - ${gm.group_name}: ${gm.message_count} 条消息`);
      });
    }
    
    // 4. 检查是否有缺失的群成员
    console.log('\n🔍 检查缺失的群成员...');
    const [missingMembers] = await sequelize.query(`
      SELECT 
        cg.id as group_id,
        cg.name as group_name,
        cg.member_num as expected_count,
        COUNT(ucg.user_id) as actual_count,
        (cg.member_num - COUNT(ucg.user_id)) as missing_count
      FROM chat_group cg
      LEFT JOIN user_chat_groups ucg ON cg.id = ucg.group_id
      GROUP BY cg.id, cg.name, cg.member_num
      HAVING actual_count < expected_count
    `);
    
    if (missingMembers.length > 0) {
      console.log(`⚠️  发现 ${missingMembers.length} 个群组缺少成员:`);
      missingMembers.forEach(mm => {
        console.log(`   - ${mm.group_name}: 缺少 ${mm.missing_count} 个成员`);
      });
    } else {
      console.log('✅ 所有群组的成员数量正常');
    }
    
    // 5. 检查是否有缺失的群聊消息（通过chat_list中的last_message_id）
    console.log('\n🔍 检查群聊消息完整性...');
    const [missingMessages] = await sequelize.query(`
      SELECT 
        cl.id as chat_list_id,
        cl.user_id,
        cl.from_id as group_id,
        cl.last_message_id,
        cg.name as group_name
      FROM chat_list cl
      INNER JOIN chat_group cg ON cl.from_id = cg.id
      WHERE cl.type = 'group'
        AND cl.last_message_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM message m 
          WHERE m.id = cl.last_message_id
        )
    `);
    
    if (missingMessages.length > 0) {
      console.log(`⚠️  发现 ${missingMessages.length} 条聊天记录引用了不存在的消息`);
    } else {
      console.log('✅ 群聊消息引用正常');
    }
    
    console.log('\n✅ 检查完成！');
    
  } catch (error) {
    console.error('❌ 检查过程中出错:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

// 运行检查
checkGroupData();

