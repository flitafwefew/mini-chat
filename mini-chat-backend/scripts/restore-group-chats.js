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

async function restoreGroupChats() {
  try {
    console.log('🔄 开始恢复群聊记录...\n');
    
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
    
    // 2. 查找缺失的群聊记录
    console.log('🔍 查找缺失的群聊记录...');
    const [missingChats] = await sequelize.query(`
      SELECT 
        ucg.user_id,
        ucg.group_id,
        cg.name as group_name,
        cg.portrait as group_portrait
      FROM user_chat_groups ucg
      INNER JOIN chat_group cg ON ucg.group_id = cg.id
      LEFT JOIN chat_list cl ON cl.user_id = ucg.user_id 
        AND cl.from_id = ucg.group_id 
        AND cl.type = 'group'
      WHERE cl.id IS NULL
    `);
    
    if (missingChats.length === 0) {
      console.log('✅ 没有缺失的群聊记录，无需恢复');
      return;
    }
    
    console.log(`📋 找到 ${missingChats.length} 条缺失的群聊记录，开始恢复...\n`);
    
    // 3. 获取每个群组的最新消息
    const groupLatestMessages = {};
    for (const chat of missingChats) {
      if (!groupLatestMessages[chat.group_id]) {
        const [messages] = await sequelize.query(`
          SELECT id, msg_content, create_time, from_id
          FROM message
          WHERE to_id = ? OR to_id = ?
          ORDER BY create_time DESC
          LIMIT 1
        `, {
          replacements: [chat.group_id, `group_${chat.group_id}`]
        });
        
        if (messages.length > 0) {
          groupLatestMessages[chat.group_id] = messages[0];
        }
      }
    }
    
    // 4. 恢复群聊记录
    // 临时禁用外键检查，因为群聊的 from_id 是群组ID，不是用户ID
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    let restoredCount = 0;
    const now = new Date();
    
    try {
      for (const chat of missingChats) {
      try {
        const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const latestMessage = groupLatestMessages[chat.group_id];
        
        await sequelize.query(`
          INSERT INTO chat_list (
            id,
            user_id,
            from_id,
            is_top,
            unread_num,
            last_msg_content,
            type,
            chat_id,
            last_message_id,
            unread_count,
            status,
            create_time,
            update_time
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, {
          replacements: [
            chatId,
            chat.user_id,
            chat.group_id,
            false,
            0,
            latestMessage ? latestMessage.msg_content : null,
            'group',
            chat.group_id,
            latestMessage ? latestMessage.id : null,
            0,
            null,
            now,
            latestMessage ? latestMessage.create_time : now
          ]
        });
        
        restoredCount++;
        if (restoredCount % 10 === 0) {
          console.log(`   已恢复 ${restoredCount}/${missingChats.length} 条记录...`);
        }
      } catch (error) {
        console.warn(`   ⚠️  恢复用户 ${chat.user_id} 的群聊 "${chat.group_name}" 时出错:`, error.message);
      }
    }
    } finally {
      // 重新启用外键检查
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    }
    
    console.log(`\n✅ 恢复完成！共恢复 ${restoredCount}/${missingChats.length} 条群聊记录`);
    
    // 5. 验证恢复结果
    const [finalCount] = await sequelize.query(
      "SELECT COUNT(*) as count FROM chat_list WHERE type = 'group'"
    );
    console.log(`\n📊 当前群聊记录总数: ${finalCount[0].count}`);
    
  } catch (error) {
    console.error('❌ 恢复过程中出错:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

// 运行恢复
restoreGroupChats();

