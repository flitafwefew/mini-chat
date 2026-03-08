const sequelize = require('./config/db');

async function checkSchema() {
  try {
    const [results, metadata] = await sequelize.query("DESCRIBE users");
    console.log('Table users schema:');
    results.forEach(row => {
      console.log(`${row.Field}: ${row.Type} (Null: ${row.Null}, Key: ${row.Key}, Default: ${row.Default})`);
    });
  } catch (error) {
    console.error('Failed to describe users table:', error);
  } finally {
    await sequelize.close();
  }
}

checkSchema();
