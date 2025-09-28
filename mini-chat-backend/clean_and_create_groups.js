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
  tableName: 'users',
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

const Friend = sequelize.define('friend', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
    allowNull: false
  },
  user_id: {
    type: Sequelize.STRING,
    allowNull: false
  },
  friend_id: {
    type: Sequelize.STRING,
    allowNull: false
  },
  status: {
    type: Sequelize.STRING,
    defaultValue: 'active'
  },
  create_time: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  tableName: 'friend',
  timestamps: false
});

async function cleanAndCreateGroups() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 1. 清理旧的群组数据
    console.log('\n🧹 开始清理旧的群组数据...');
    
    // 删除所有群组成员关系
    const deletedUserChatGroups = await UserChatGroups.destroy({
      where: {},
      force: true
    });
    console.log(`   删除了 ${deletedUserChatGroups} 条群组成员关系记录`);

    // 删除所有群组聊天列表
    const deletedGroupChatLists = await ChatList.destroy({
      where: { type: 'group' },
      force: true
    });
    console.log(`   删除了 ${deletedGroupChatLists} 条群组聊天列表记录`);

    // 删除所有群组
    const deletedGroups = await ChatGroup.destroy({
      where: {},
      force: true
    });
    console.log(`   删除了 ${deletedGroups} 个群组`);

    console.log('✅ 旧群组数据清理完成');

    // 2. 获取所有用户
    console.log('\n👥 获取所有用户...');
    const users = await User.findAll();
    console.log(`   找到 ${users.length} 个用户:`);
    users.forEach(user => {
      console.log(`     ${user.id} - ${user.name} (${user.account})`);
    });

    if (users.length === 0) {
      console.log('❌ 没有找到用户，请先创建用户');
      return;
    }

    // 3. 创建两个新群组
    console.log('\n🏗️ 开始创建新群组...');
    
    const groups = [];
    for (let i = 1; i <= 2; i++) {
      const groupId = `group_${Date.now()}_${i}`;
      const groupNumber = `G${Date.now()}_${i}`;
      
      const group = await ChatGroup.create({
        id: groupId,
        user_id: users[0].id, // 创建者
        owner_user_id: users[0].id, // 群主
        name: '屎袋烧黏团',
        notice: `这是第${i}个屎袋烧黏团群组`,
        portrait: null,
        member_num: users.length,
        chat_group_number: groupNumber
      });

      groups.push(group);
      console.log(`   ✅ 创建群组 ${i}: ${group.name} (${groupId})`);
    }

    // 4. 将所有用户添加到两个群组
    console.log('\n👥 将所有用户添加到群组...');
    
    for (const group of groups) {
      const userChatGroups = [];
      const chatLists = [];

      for (const user of users) {
        // 添加到群组成员表
        userChatGroups.push({
          id: `ucg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: user.id,
          group_id: group.id,
          role: user.id === users[0].id ? 'admin' : 'member',
          join_time: new Date()
        });

        // 添加到聊天列表
        chatLists.push({
          id: `cl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: user.id,
          from_id: group.id,
          chat_id: group.id,
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
      console.log(`   ✅ 群组 ${group.id}: 添加了 ${userChatGroups.length} 个用户`);

      // 批量插入聊天列表
      await ChatList.bulkCreate(chatLists);
      console.log(`   ✅ 群组 ${group.id}: 创建了 ${chatLists.length} 个聊天列表记录`);
    }

    // 5. 检查好友关系
    console.log('\n🤝 检查好友关系...');
    const friendRelations = await Friend.findAll();
    console.log(`   当前好友关系数量: ${friendRelations.length}`);
    
    if (friendRelations.length === 0) {
      console.log('   ⚠️ 没有好友关系，这可能是私聊不显示好友的原因');
      console.log('   💡 建议运行 batch_register_users.js 来建立好友关系');
    } else {
      console.log('   ✅ 好友关系存在');
    }

    // 6. 验证结果
    console.log('\n📊 验证结果...');
    
    for (const group of groups) {
      const groupMembers = await UserChatGroups.findAll({
        where: { group_id: group.id }
      });
      
      console.log(`\n   群组: ${group.name} (${group.id})`);
      console.log(`   成员数量: ${groupMembers.length}`);
      
      const groupChatLists = await ChatList.findAll({
        where: { chat_id: group.id, type: 'group' }
      });
      console.log(`   聊天列表记录: ${groupChatLists.length}`);
    }

    console.log('\n🎉 群组创建和用户添加完成！');
    console.log('\n📝 总结:');
    console.log(`   - 清理了旧的群组数据`);
    console.log(`   - 创建了 2 个新群组: "屎袋烧黏团"`);
    console.log(`   - 每个群组包含 ${users.length} 个用户`);
    console.log(`   - 好友关系数量: ${friendRelations.length}`);

  } catch (error) {
    console.error('❌ 操作失败:', error);
  } finally {
    await sequelize.close();
    console.log('\n🔌 数据库连接已关闭');
  }
}

// 运行脚本
cleanAndCreateGroups();
