const sequelize = require('./config/db');

async function fixDatabaseComprehensive() {
  try {
    console.log('开始全面修复数据库...');
    
    // 1. 确保所有表都有正确的字符集
    const tables = ['user', 'message', 'chat_list', 'chat_group', 'friend', 'user_chat_groups'];
    
    for (const table of tables) {
      try {
        // 转换表字符集
        await sequelize.query(`
          ALTER TABLE ${table} CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        `);
        console.log(`✅ 已修复 ${table} 表的字符集`);
        
        // 转换所有VARCHAR和TEXT字段的字符集
        const [columns] = await sequelize.query(`
          SELECT COLUMN_NAME, DATA_TYPE 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = 'mini_chat' 
          AND TABLE_NAME = '${table}' 
          AND (DATA_TYPE = 'varchar' OR DATA_TYPE = 'text' OR DATA_TYPE = 'longtext' OR DATA_TYPE = 'mediumtext')
        `);
        
        for (const column of columns) {
          try {
            await sequelize.query(`
              ALTER TABLE ${table} 
              MODIFY COLUMN ${column.COLUMN_NAME} ${column.DATA_TYPE} 
              CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
            `);
            console.log(`  ✅ 已修复 ${table}.${column.COLUMN_NAME} 字段字符集`);
          } catch (error) {
            if (error.message.includes('Duplicate column name') || error.message.includes('already exists')) {
              console.log(`  ℹ️ ${table}.${column.COLUMN_NAME} 字段字符集已正确`);
            } else {
              console.log(`  ⚠️ ${table}.${column.COLUMN_NAME} 字段字符集修复失败: ${error.message}`);
            }
          }
        }
      } catch (error) {
        console.log(`⚠️ 修复 ${table} 表时出错: ${error.message}`);
      }
    }
    
    // 2. 检查并修复索引
    try {
      // 为message表的sender_id字段添加索引
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_message_sender_id ON message(sender_id)
      `);
      console.log('✅ 已为 message.sender_id 添加索引');
    } catch (error) {
      if (error.message.includes('Duplicate key name')) {
        console.log('ℹ️ message.sender_id 索引已存在');
      } else {
        console.log(`⚠️ 添加索引失败: ${error.message}`);
      }
    }
    
    // 3. 验证修复结果
    console.log('\n验证修复结果...');
    for (const table of tables) {
      try {
        const [result] = await sequelize.query(`
          SELECT TABLE_COLLATION 
          FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_SCHEMA = 'mini_chat' AND TABLE_NAME = '${table}'
        `);
        console.log(`${table} 表字符集: ${result[0]?.TABLE_COLLATION || '未知'}`);
      } catch (error) {
        console.log(`${table} 表验证失败: ${error.message}`);
      }
    }
    
    console.log('\n🎉 数据库全面修复完成！');
  } catch (error) {
    console.error('❌ 数据库修复失败:', error);
  } finally {
    await sequelize.close();
  }
}

fixDatabaseComprehensive();
