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

async function checkAndRestoreGroupChats() {
  try {
    console.log('🔍 开始检查群聊数据...\n');
    
    const dbName = process.env.DB_NAME || 'mini_chat';
    
    // 1. 检查 chat_group 表是否存在以及有多少群组
    const [groupTables] = await sequelize.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '${dbName}' AND TABLE_NAME = 'chat_group'`
    );
    
    if (groupTables.length === 0) {
      console.log('❌ chat_group 表不存在');
      return;
    }
    
    const [groups] = await sequelize.query('SELECT COUNT(*) as count FROM chat_group');
    const groupCount = groups[0].count;
    console.log(`✅ chat_group 表存在，共有 ${groupCount} 个群组`);
    
    if (groupCount > 0) {
      const [groupList] = await sequelize.query('SELECT id, name, member_num FROM chat_group LIMIT 10');
      console.log('📋 群组列表（前10个）:');
      groupList.forEach(group => {
        console.log(`   - ${group.name} (ID: ${group.id}, 成员数: ${group.member_num})`);
      });
      if (groupCount > 10) {
        console.log(`   ... 还有 ${groupCount - 10} 个群组`);
      }
    }
    
    // 2. 检查 chat_list 表中有多少群聊记录
    const [chatListTables] = await sequelize.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '${dbName}' AND TABLE_NAME = 'chat_list'`
    );
    
    if (chatListTables.length === 0) {
      console.log('\n❌ chat_list 表不存在');
      return;
    }
    
    const [groupChatList] = await sequelize.query(
      "SELECT COUNT(*) as count FROM chat_list WHERE type = 'group'"
    );
    const groupChatCount = groupChatList[0].count;
    console.log(`\n✅ chat_list 表存在，共有 ${groupChatCount} 条群聊记录`);
    
    // 3. 检查 user_chat_groups 表
    const [userGroupTables] = await sequelize.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '${dbName}' AND TABLE_NAME = 'user_chat_groups'`
    );
    
    if (userGroupTables.length === 0) {
      console.log('\n❌ user_chat_groups 表不存在');
      return;
    }
    
    const [userGroups] = await sequelize.query('SELECT COUNT(*) as count FROM user_chat_groups');
    const userGroupCount = userGroups[0].count;
    console.log(`✅ user_chat_groups 表存在，共有 ${userGroupCount} 条用户群组关联记录`);
    
    // 4. 检查是否有群组存在但没有对应的 chat_list 记录
    if (groupCount > 0 && userGroupCount > 0) {
      console.log('\n🔍 检查缺失的群聊记录...');
      
      const [missingChats] = await sequelize.query(`
        SELECT 
          ucg.user_id,
          ucg.group_id,
          cg.name as group_name
        FROM user_chat_groups ucg
        INNER JOIN chat_group cg ON ucg.group_id = cg.id
        LEFT JOIN chat_list cl ON cl.user_id = ucg.user_id 
          AND cl.from_id = ucg.group_id 
          AND cl.type = 'group'
        WHERE cl.id IS NULL
        LIMIT 20
      `);
      
      if (missingChats.length > 0) {
        console.log(`\n⚠️  发现 ${missingChats.length} 条缺失的群聊记录（仅显示前20条）:`);
        missingChats.forEach((item, index) => {
          console.log(`   ${index + 1}. 用户 ${item.user_id} 的群聊 "${item.group_name}" (群组ID: ${item.group_id})`);
        });
        
        // 询问是否恢复
        console.log('\n💡 可以运行恢复脚本来重建这些群聊记录');
        console.log('   运行命令: node mini-chat-backend/scripts/restore-group-chats.js');
      } else {
        console.log('✅ 所有群聊记录都存在');
      }
    }
    
    // 5. 统计信息
    console.log('\n📊 数据统计:');
    console.log(`   - 群组数量: ${groupCount}`);
    console.log(`   - 用户群组关联数: ${userGroupCount}`);
    console.log(`   - 群聊记录数: ${groupChatCount}`);
    if (groupCount > 0 && userGroupCount > 0) {
      const expectedChats = userGroupCount;
      const missingCount = expectedChats - groupChatCount;
      if (missingCount > 0) {
        console.log(`   - 缺失记录数: ${missingCount}`);
      } else {
        console.log(`   - 缺失记录数: 0 ✅`);
      }
    }
    
  } catch (error) {
    console.error('❌ 检查过程中出错:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

// 运行检查
checkAndRestoreGroupChats();

