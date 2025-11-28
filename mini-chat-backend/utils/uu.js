// mini-chat-backend/scripts/extend-friend-id.js
const sequelize = require('../config/db');
// mini-chat-backend/scripts/show-friend-table.js

async function run() {
  try {
    const [rows] = await sequelize.query('SHOW CREATE TABLE friend;');
    console.log(rows[0]['Create Table']);
  } catch (err) {
    console.error('查询失败:', err);
  } finally {
    await sequelize.close();
  }
}

run();
async function run() {
  try {
    await sequelize.query(`
      ALTER TABLE friend
      MODIFY COLUMN id VARCHAR(500) NOT NULL PRIMARY KEY
    `);
    console.log('✅ friend.id 长度已修改为 VARCHAR(128)');
  } catch (err) {
    console.error('❌ 修改失败:', err);
  } finally {
    await sequelize.close();
  }
}

run();
