const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const sequelize = require('../config/db');
const fs = require('fs');

async function dump(table) {
  try {
    await sequelize.authenticate();
    console.log('Sequelize: 连接成功');
    const dbName = process.env.DB_NAME || (sequelize.config && sequelize.config.database) || '';
    let fullTable = table;
    if (!table.includes('.') && dbName) fullTable = dbName + '.' + table;
    const parts = fullTable.split('.');
    const escaped = parts.map(p => '`' + p.replace(/`/g, '') + '`').join('.');
    const sql = 'SELECT * FROM ' + escaped + ' LIMIT 1000';
    const [rows] = await sequelize.query(sql, { raw: true });
    const out = JSON.stringify(rows, null, 2);
    const file = path.join(__dirname, `${table}.json`);
    fs.writeFileSync(file, out, 'utf8');
    console.log(`已导出 ${rows.length} 行到 ${file}`);
  } catch (e) {
    console.error('导出失败:', e && e.message ? e.message : e);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

const table = process.argv[2] || 'friend';
dump(table);
