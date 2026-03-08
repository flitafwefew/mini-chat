const { User } = require('./models/associations');
const sequelize = require('./config/db');

async function testQuery() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    const users = await User.findAll({
      where: { status: 'active' },
      attributes: ['id', 'account', 'name', 'portrait', 'sex', 'signature', 'is_online', 'create_time'],
      order: [['create_time', 'DESC']]
    });
    console.log('Query successful, found users:', users.length);
  } catch (error) {
    console.error('Query failed:', error);
  } finally {
    await sequelize.close();
  }
}

testQuery();
