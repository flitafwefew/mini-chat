const { User } = require('./models/associations');
const sequelize = require('./config/db');

async function testQuery() {
  try {
    await sequelize.authenticate();
    console.log('Connection established.');
    
    console.log('Testing getOnlineUsers...');
    const onlineUsers = await User.findAll({
      where: { 
        status: 'active',
        is_online: true 
      },
      attributes: ['id', 'account', 'name', 'portrait', 'sex', 'signature', 'last_opt_time'],
      order: [['last_opt_time', 'DESC']]
    });
    console.log('Online users found:', onlineUsers.length);

    console.log('Testing getUserListMap...');
    const users = await User.findAll({
      where: { status: 'active' },
      attributes: ['id', 'account', 'name', 'portrait', 'sex', 'signature', 'is_online']
    });
    console.log('User map found:', users.length);
  } catch (error) {
    console.error('Query failed:', error);
  } finally {
    await sequelize.close();
  }
}

testQuery();
