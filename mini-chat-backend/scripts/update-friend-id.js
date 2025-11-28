const sequelize = require('../config/db');

async function run() {
  console.log('🚀 开始执行 ALTER TABLE friend ...');
  try {
    await sequelize.query('ALTER TABLE friend MODIFY COLUMN id VARCHAR(255) NOT NULL;');
    console.log('✅ friend.id 已修改为 VARCHAR(255) NOT NULL');
  } catch (error) {
    console.error('❌ 修改失败:', error);
  } finally {
    await sequelize.close();
    console.log('🔚 操作完成，数据库连接已关闭');
  }
}

run();

