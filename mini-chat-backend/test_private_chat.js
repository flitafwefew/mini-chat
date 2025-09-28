const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

// 测试用户账号
const testUsers = [
  { account: 'alice', password: '123456' },
  { account: 'bob', password: '123456' }
];

let tokens = {};

// 登录用户
async function loginUser(account, password) {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/user/login`, {
      account,
      password
    });
    
    if (response.data.code === 0) {
      console.log(`✅ ${account} 登录成功`);
      return response.data.data.token;
    } else {
      console.log(`❌ ${account} 登录失败: ${response.data.msg}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ ${account} 登录失败: ${error.message}`);
    return null;
  }
}

// 创建或获取私聊房间
async function createOrGetPrivateChatRoom(token, targetUserId) {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/private-chat/room/create`, {
      target_user_id: targetUserId
    }, {
      headers: {
        'x-token': token
      }
    });
    
    if (response.data.code === 0) {
      console.log(`✅ 创建私聊房间成功: ${response.data.data.roomId}`);
      return response.data.data;
    } else {
      console.log(`❌ 创建私聊房间失败: ${response.data.msg}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ 创建私聊房间失败: ${error.message}`);
    return null;
  }
}

// 发送私聊消息
async function sendPrivateMessage(token, roomId, message) {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/private-chat/room/${roomId}/send`, {
      msg_content: message,
      type: 'text',
      source: 'web'
    }, {
      headers: {
        'x-token': token
      }
    });
    
    if (response.data.code === 0) {
      console.log(`✅ 发送消息成功: ${message}`);
      return response.data.data;
    } else {
      console.log(`❌ 发送消息失败: ${response.data.msg}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ 发送消息失败: ${error.message}`);
    return null;
  }
}

// 获取私聊消息历史
async function getPrivateChatMessages(token, roomId) {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/private-chat/room/${roomId}/messages`, {
      headers: {
        'x-token': token
      }
    });
    
    if (response.data.code === 0) {
      console.log(`✅ 获取消息历史成功，共 ${response.data.data.length} 条消息`);
      return response.data.data;
    } else {
      console.log(`❌ 获取消息历史失败: ${response.data.msg}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ 获取消息历史失败: ${error.message}`);
    return null;
  }
}

// 获取私聊房间列表
async function getPrivateChatRooms(token) {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/private-chat/rooms`, {
      headers: {
        'x-token': token
      }
    });
    
    if (response.data.code === 0) {
      console.log(`✅ 获取私聊房间列表成功，共 ${response.data.data.length} 个房间`);
      return response.data.data;
    } else {
      console.log(`❌ 获取私聊房间列表失败: ${response.data.msg}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ 获取私聊房间列表失败: ${error.message}`);
    return null;
  }
}

// 主测试函数
async function testPrivateChat() {
  console.log('🚀 开始测试私聊功能...\n');

  // 1. 登录两个用户
  console.log('1. 登录测试用户...');
  for (const user of testUsers) {
    const token = await loginUser(user.account, user.password);
    if (token) {
      tokens[user.account] = token;
    }
  }

  if (Object.keys(tokens).length < 2) {
    console.log('❌ 需要至少2个用户才能测试私聊功能');
    return;
  }

  const aliceToken = tokens['alice'];
  const bobToken = tokens['bob'];

  // 2. Alice 创建与 Bob 的私聊房间
  console.log('\n2. Alice 创建与 Bob 的私聊房间...');
  const aliceRoom = await createOrGetPrivateChatRoom(aliceToken, 'user-002');
  if (!aliceRoom) {
    console.log('❌ 无法创建私聊房间，测试终止');
    return;
  }

  // 3. Bob 获取与 Alice 的私聊房间
  console.log('\n3. Bob 获取与 Alice 的私聊房间...');
  const bobRoom = await createOrGetPrivateChatRoom(bobToken, 'user-001');
  if (!bobRoom) {
    console.log('❌ Bob 无法获取私聊房间，测试终止');
    return;
  }

  // 4. Alice 发送消息给 Bob
  console.log('\n4. Alice 发送消息给 Bob...');
  await sendPrivateMessage(aliceToken, aliceRoom.roomId, '你好 Bob，这是 Alice 发送的消息！');
  await sendPrivateMessage(aliceToken, aliceRoom.roomId, '私聊功能测试中...');

  // 5. Bob 回复消息给 Alice
  console.log('\n5. Bob 回复消息给 Alice...');
  await sendPrivateMessage(bobToken, bobRoom.roomId, '你好 Alice，我收到了你的消息！');
  await sendPrivateMessage(bobToken, bobRoom.roomId, '私聊功能工作正常！');

  // 6. 获取消息历史
  console.log('\n6. 获取消息历史...');
  const aliceMessages = await getPrivateChatMessages(aliceToken, aliceRoom.roomId);
  const bobMessages = await getPrivateChatMessages(bobToken, bobRoom.roomId);

  // 7. 获取私聊房间列表
  console.log('\n7. 获取私聊房间列表...');
  const aliceRooms = await getPrivateChatRooms(aliceToken);
  const bobRooms = await getPrivateChatRooms(bobToken);

  console.log('\n🎉 私聊功能测试完成！');
  console.log(`Alice 的房间数: ${aliceRooms ? aliceRooms.length : 0}`);
  console.log(`Bob 的房间数: ${bobRooms ? bobRooms.length : 0}`);
  console.log(`Alice 的消息数: ${aliceMessages ? aliceMessages.length : 0}`);
  console.log(`Bob 的消息数: ${bobMessages ? bobMessages.length : 0}`);
}

// 运行测试
testPrivateChat().catch(console.error);