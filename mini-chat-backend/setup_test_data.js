const { User, ChatGroup, Message, ChatList, Friend } = require('./models/associations');
const { Op } = require('sequelize');

async function setupTestData() {
  try {
    console.log('开始设置测试数据...');

    // 获取所有用户
    const users = await User.findAll();
    console.log(`找到 ${users.length} 个用户`);

    if (users.length < 3) {
      console.log('用户数量不足，无法创建群聊');
      return;
    }

    // 创建群聊
    const now = new Date();
    const group = await ChatGroup.create({
      id: `group_${Date.now()}`,
      user_id: users[0].id,
      owner_user_id: users[0].id,
      name: '这是个群聊',
      notice: '欢迎来到群聊！',
      member_num: users.length,
      chat_group_number: '456645',
      create_time: now,
      update_time: now
    });
    console.log('创建群聊成功:', group.name);

    // 为所有用户创建聊天列表项（群聊）
    for (const user of users) {
      await ChatList.create({
        id: `chatlist_${user.id}_${group.id}_${Date.now()}`,
        user_id: user.id,
        from_id: group.id,
        type: 'group',
        last_msg_content: '欢迎来到群聊！',
        unread_num: 0,
        status: 'active',
        create_time: now,
        update_time: now
      });
    }
    console.log('创建群聊聊天列表成功');

    // 创建一些测试消息
    const testMessages = [
      { from_id: users[0].id, content: '5', time: '星期二 11:26' },
      { from_id: users[0].id, content: '7', time: '星期二 11:26' },
      { from_id: users[0].id, content: '9', time: '星期二 11:26' },
      { from_id: users[1].id, content: '1', time: '星期二 11:46' },
      { from_id: users[0].id, content: '5564564', time: '星期二 12:17' }
    ];

    for (const msg of testMessages) {
      const msgTime = new Date();
      await Message.create({
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        from_id: msg.from_id,
        to_id: group.id,
        type: 'group',
        msg_content: msg.content,
        status: 'sent',
        source: 'text',
        create_time: msgTime,
        update_time: msgTime
      });
    }
    console.log('创建测试消息成功');

    // 创建一些私聊关系
    const privateChats = [
      { user1: users[0], user2: users[1], lastMsg: '[未接通]' },
      { user1: users[0], user2: users[2], lastMsg: '你好' },
      { user1: users[0], user2: users[3], lastMsg: '在吗？' }
    ];

    for (const chat of privateChats) {
      // 创建好友关系
      const friendTime = new Date();
      await Friend.bulkCreate([
        { 
          id: `friend_${chat.user1.id}_${chat.user2.id}_${Date.now()}`,
          user_id: chat.user1.id, 
          friend_id: chat.user2.id, 
          status: 'accepted',
          create_time: friendTime,
          update_time: friendTime
        },
        { 
          id: `friend_${chat.user2.id}_${chat.user1.id}_${Date.now() + 1}`,
          user_id: chat.user2.id, 
          friend_id: chat.user1.id, 
          status: 'accepted',
          create_time: friendTime,
          update_time: friendTime
        }
      ]);

      // 创建私聊聊天列表
      const chatTime = new Date();
      await ChatList.bulkCreate([
        {
          id: `chatlist_${chat.user1.id}_${chat.user2.id}_${Date.now()}`,
          user_id: chat.user1.id,
          from_id: chat.user2.id,
          type: 'private',
          last_msg_content: chat.lastMsg,
          unread_num: 0,
          status: 'active',
          create_time: chatTime,
          update_time: chatTime
        },
        {
          id: `chatlist_${chat.user2.id}_${chat.user1.id}_${Date.now() + 1}`,
          user_id: chat.user2.id,
          from_id: chat.user1.id,
          type: 'private',
          last_msg_content: chat.lastMsg,
          unread_num: 0,
          status: 'active',
          create_time: chatTime,
          update_time: chatTime
        }
      ]);
    }
    console.log('创建私聊关系成功');

    // 更新群聊的最后消息
    const lastMessage = await Message.findOne({
      where: { to_id: group.id },
      order: [['create_time', 'DESC']]
    });

    if (lastMessage) {
      await ChatList.update(
        { last_msg_content: lastMessage.msg_content },
        { where: { from_id: group.id } }
      );
    }

    console.log('测试数据设置完成！');
    console.log('群聊ID:', group.id);
    console.log('群聊名称:', group.name);
    console.log('群聊编号:', group.chat_group_number);

  } catch (error) {
    console.error('设置测试数据失败:', error);
  }
}

// 运行脚本
setupTestData().then(() => {
  console.log('脚本执行完成');
  process.exit(0);
}).catch(error => {
  console.error('脚本执行失败:', error);
  process.exit(1);
});
