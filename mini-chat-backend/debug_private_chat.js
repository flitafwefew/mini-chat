const { Sequelize } = require('sequelize');
require('dotenv').config();

// 数据库连接配置
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'mysql',
  logging: console.log, // 启用SQL日志
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
    defaultValue: 'accepted'
  },
  create_time: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  tableName: 'friend',
  timestamps: false
});

// 设置关联
Friend.belongsTo(User, { 
  foreignKey: 'friend_id', 
  as: 'friendUser' 
});

async function debugPrivateChat() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    const userId = '01c87d08-4d05-4eb9-b0ca-92bc9ca235a9'; // Bob的用户ID
    
    console.log(`\n🔍 调试用户 ${userId} 的私聊列表...`);

    // 1. 检查用户是否存在
    const user = await User.findByPk(userId);
    console.log(`\n👤 用户信息:`, user ? `${user.name} (${user.account})` : '用户不存在');

    // 2. 检查好友关系
    const friends = await Friend.findAll({
      where: { 
        user_id: userId,
        status: 'accepted'
      },
      include: [{
        model: User,
        as: 'friendUser',
        attributes: ['id', 'account', 'name', 'portrait', 'is_online']
      }]
    });

    console.log(`\n🤝 找到 ${friends.length} 个好友:`);
    friends.forEach((friend, index) => {
      const friendUser = friend.friendUser;
      console.log(`  ${index + 1}. ${friendUser ? friendUser.name : 'Unknown'} (${friendUser ? friendUser.account : 'Unknown'}) - ID: ${friend.friend_id}`);
    });

    // 3. 检查是否有私聊记录
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

    const chatLists = await ChatList.findAll({
      where: { 
        user_id: userId,
        type: 'user'
      },
      order: [['update_time', 'DESC']]
    });

    console.log(`\n💬 找到 ${chatLists.length} 条私聊记录:`);
    chatLists.forEach((chat, index) => {
      console.log(`  ${index + 1}. 与用户 ${chat.from_id} 的聊天 - 最后消息: ${chat.last_msg_content || '无'}`);
    });

    // 4. 模拟私聊列表生成逻辑
    console.log(`\n🔄 模拟私聊列表生成...`);
    
    const chatMap = new Map();
    chatLists.forEach(chat => {
      chatMap.set(chat.from_id, chat);
    });

    const privateChats = [];
    for (const friend of friends) {
      const otherUser = friend.friendUser;
      if (!otherUser) continue;

      const existingChat = chatMap.get(otherUser.id);
      
      const chatItem = {
        id: existingChat ? existingChat.id : `temp_${otherUser.id}`,
        targetId: otherUser.id,
        type: 'user',
        targetInfo: {
          id: otherUser.id,
          name: otherUser.name,
          avatar: otherUser.portrait,
          type: 'user'
        },
        lastMessage: existingChat ? {
          message: existingChat.last_msg_content || '无消息',
          createTime: existingChat.update_time
        } : null,
        unreadCount: existingChat ? (existingChat.unread_num || 0) : 0,
        createTime: existingChat ? existingChat.create_time : new Date().toISOString(),
        updateTime: existingChat ? existingChat.update_time : new Date().toISOString()
      };

      privateChats.push(chatItem);
    }

    console.log(`\n📋 生成的私聊列表 (${privateChats.length} 项):`);
    privateChats.forEach((chat, index) => {
      console.log(`  ${index + 1}. ${chat.targetInfo.name} - 未读: ${chat.unreadCount} - 最后消息: ${chat.lastMessage ? chat.lastMessage.message : '无'}`);
    });

    if (privateChats.length === 0) {
      console.log(`\n❌ 私聊列表为空的原因分析:`);
      console.log(`   - 好友数量: ${friends.length}`);
      console.log(`   - 私聊记录数量: ${chatLists.length}`);
      console.log(`   - 可能原因: 好友关系存在但私聊记录为空`);
    }

  } catch (error) {
    console.error('❌ 调试失败:', error);
  } finally {
    await sequelize.close();
    console.log('\n🔌 数据库连接已关闭');
  }
}

// 运行调试
debugPrivateChat();
