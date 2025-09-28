const { Sequelize } = require('sequelize');
require('dotenv').config();

// 数据库连接配置
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'mysql',
  logging: false,
});

// 定义模型
const User = sequelize.define('user', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
    allowNull: false
  },
  account: {
    type: Sequelize.STRING,
    allowNull: false
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  portrait: {
    type: Sequelize.STRING,
    allowNull: true
  }
}, {
  tableName: 'user',
  timestamps: false
});

const ChatGroup = sequelize.define('chat_group', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
    allowNull: false
  },
  user_id: {
    type: Sequelize.STRING,
    allowNull: false
  },
  owner_user_id: {
    type: Sequelize.STRING,
    allowNull: false
  },
  portrait: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  name: {
    type: Sequelize.STRING,
    allowNull: true
  },
  notice: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  member_num: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  create_time: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  },
  update_time: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  },
  chat_group_number: {
    type: Sequelize.STRING,
    allowNull: false
  }
}, {
  tableName: 'chat_group',
  timestamps: false
});

const UserChatGroups = sequelize.define('user_chat_groups', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
    allowNull: false
  },
  user_id: {
    type: Sequelize.STRING,
    allowNull: false
  },
  group_id: {
    type: Sequelize.STRING,
    allowNull: false
  },
  role: {
    type: Sequelize.STRING,
    defaultValue: 'member'
  },
  join_time: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  tableName: 'user_chat_groups',
  timestamps: false
});

const ChatList = sequelize.define('chat_list', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
    allowNull: false
  },
  user_id: {
    type: Sequelize.STRING,
    allowNull: false
  },
  from_id: {
    type: Sequelize.STRING,
    allowNull: true
  },
  chat_id: {
    type: Sequelize.STRING,
    allowNull: false
  },
  type: {
    type: Sequelize.STRING,
    allowNull: false
  },
  is_top: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  unread_num: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  last_msg_content: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  last_message_id: {
    type: Sequelize.STRING,
    allowNull: true
  },
  create_time: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  },
  update_time: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  tableName: 'chat_list',
  timestamps: false
});

async function createGroupWithAllUsers() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 获取所有用户
    const users = await User.findAll();
    console.log(`找到 ${users.length} 个用户:`);
    users.forEach(user => {
      console.log(`  ${user.id} - ${user.name} (${user.account})`);
    });

    if (users.length === 0) {
      console.log('没有找到用户，请先创建用户');
      return;
    }

    // 创建群组
    const groupId = `group_${Date.now()}`;
    const groupNumber = `G${Date.now()}`;
    const group = await ChatGroup.create({
      id: groupId,
      user_id: users[0].id, // 创建者
      owner_user_id: users[0].id, // 群主
      name: '全员群组',
      notice: '包含所有用户的群组',
      portrait: null,
      member_num: users.length,
      chat_group_number: groupNumber
    });

    console.log(`\n创建群组成功: ${group.name} (${groupId})`);

    // 将所有用户添加到群组
    const userChatGroups = [];
    const chatLists = [];

    for (const user of users) {
      // 添加到群组成员表
      userChatGroups.push({
        id: `ucg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: user.id,
        group_id: groupId,
        role: user.id === users[0].id ? 'admin' : 'member', // 第一个用户设为管理员
        join_time: new Date()
      });

      // 添加到聊天列表
      chatLists.push({
        id: `cl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: user.id,
        from_id: groupId, // 群组ID作为from_id
        chat_id: groupId,
        type: 'group',
        is_top: false,
        unread_num: 0,
        last_msg_content: null,
        last_message_id: null,
        unread_count: 0,
        status: 'active',
        create_time: new Date(),
        update_time: new Date()
      });
    }

    // 批量插入群组成员关系
    await UserChatGroups.bulkCreate(userChatGroups);
    console.log(`\n添加了 ${userChatGroups.length} 个用户到群组`);

    // 批量插入聊天列表
    await ChatList.bulkCreate(chatLists);
    console.log(`\n为 ${chatLists.length} 个用户创建了群组聊天列表`);

    // 验证结果
    const groupMembers = await UserChatGroups.findAll({
      where: { group_id: groupId }
    });

    console.log('\n群组成员列表:');
    for (const member of groupMembers) {
      const user = await User.findByPk(member.user_id);
      console.log(`  ${user ? user.name : 'Unknown'} (${user ? user.account : 'Unknown'}) - ${member.role}`);
    }

    const groupChatLists = await ChatList.findAll({
      where: { chat_id: groupId, type: 'group' }
    });

    console.log(`\n群组聊天列表记录数: ${groupChatLists.length}`);

  } catch (error) {
    console.error('创建群组时出错:', error);
  } finally {
    await sequelize.close();
    console.log('\n数据库连接已关闭');
  }
}

// 运行脚本
createGroupWithAllUsers();
