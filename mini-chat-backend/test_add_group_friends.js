const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api/v1';

// 测试用户信息
const testUsers = [
  { account: 'alice', password: '123456', name: 'Alice' },
  { account: 'bob', password: '123456', name: 'Bob' },
  { account: 'charlie', password: '123456', name: 'Charlie' },
  { account: 'david', password: '123456', name: 'David' }
];

let userTokens = {};
let groupId = '';

// 登录用户
async function loginUser(user) {
  try {
    const response = await axios.post(`${BASE_URL}/user/login`, {
      account: user.account,
      password: user.password
    });
    
    if (response.data.code === 200) {
      userTokens[user.account] = response.data.data.token;
      console.log(`✅ ${user.name} 登录成功`);
      return true;
    } else {
      console.log(`❌ ${user.name} 登录失败: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${user.name} 登录失败: ${error.message}`);
    return false;
  }
}

// 创建群组
async function createGroup(creatorAccount, memberAccounts) {
  try {
    const token = userTokens[creatorAccount];
    if (!token) {
      console.log(`❌ ${creatorAccount} 未登录`);
      return null;
    }

    const response = await axios.post(`${BASE_URL}/chat-list/groups`, {
      name: '测试群组',
      description: '用于测试批量添加好友的群组',
      member_ids: memberAccounts
    }, {
      headers: {
        'x-token': token
      }
    });

    if (response.data.code === 200) {
      console.log(`✅ 群组创建成功: ${response.data.data.id}`);
      return response.data.data.id;
    } else {
      console.log(`❌ 群组创建失败: ${response.data.message}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ 群组创建失败: ${error.message}`);
    return null;
  }
}

// 获取用户ID
async function getUserId(account) {
  try {
    const token = userTokens[account];
    if (!token) {
      return null;
    }

    const response = await axios.get(`${BASE_URL}/user/info`, {
      headers: {
        'x-token': token
      }
    });

    if (response.data.code === 200) {
      return response.data.data.id;
    }
    return null;
  } catch (error) {
    console.log(`❌ 获取用户ID失败: ${error.message}`);
    return null;
  }
}

// 批量添加群成员为好友
async function addGroupMembersAsFriends(account, groupId) {
  try {
    const token = userTokens[account];
    if (!token) {
      console.log(`❌ ${account} 未登录`);
      return false;
    }

    const response = await axios.post(`${BASE_URL}/friend/add-group-members/${groupId}`, {}, {
      headers: {
        'x-token': token
      }
    });

    if (response.data.code === 200) {
      console.log(`✅ ${account} 批量添加好友成功:`);
      console.log(`   - 新增好友: ${response.data.data.added_count} 人`);
      console.log(`   - 已是好友: ${response.data.data.already_friends_count} 人`);
      
      if (response.data.data.added_friends.length > 0) {
        console.log(`   - 新增的好友: ${response.data.data.added_friends.map(f => f.name).join(', ')}`);
      }
      if (response.data.data.already_friends.length > 0) {
        console.log(`   - 已是好友: ${response.data.data.already_friends.map(f => f.name).join(', ')}`);
      }
      return true;
    } else {
      console.log(`❌ ${account} 批量添加好友失败: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${account} 批量添加好友失败: ${error.message}`);
    return false;
  }
}

// 获取好友列表
async function getFriendList(account) {
  try {
    const token = userTokens[account];
    if (!token) {
      return [];
    }

    const response = await axios.get(`${BASE_URL}/friend/sidebar`, {
      headers: {
        'x-token': token
      }
    });

    if (response.data.code === 200) {
      return response.data.data || [];
    }
    return [];
  } catch (error) {
    console.log(`❌ 获取好友列表失败: ${error.message}`);
    return [];
  }
}

// 主测试函数
async function runTest() {
  console.log('🚀 开始测试批量添加群成员为好友功能...\n');

  // 1. 登录所有用户
  console.log('1. 登录测试用户...');
  const loginResults = await Promise.all(
    testUsers.map(user => loginUser(user))
  );
  
  if (loginResults.filter(Boolean).length < 2) {
    console.log('❌ 需要至少2个用户才能测试好友功能');
    return;
  }

  // 2. 获取用户ID
  console.log('\n2. 获取用户ID...');
  const userIds = {};
  for (const user of testUsers) {
    const userId = await getUserId(user.account);
    if (userId) {
      userIds[user.account] = userId;
      console.log(`✅ ${user.name} ID: ${userId}`);
    }
  }

  // 3. 创建群组
  console.log('\n3. 创建群组...');
  const memberIds = Object.values(userIds);
  groupId = await createGroup('alice', memberIds);
  
  if (!groupId) {
    console.log('❌ 群组创建失败，无法继续测试');
    return;
  }

  // 4. 等待一下让群组创建完成
  console.log('\n4. 等待群组创建完成...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 5. 测试批量添加好友
  console.log('\n5. 测试批量添加群成员为好友...');
  
  // Alice 添加群成员为好友
  await addGroupMembersAsFriends('alice', groupId);
  
  // Bob 添加群成员为好友
  await addGroupMembersAsFriends('bob', groupId);

  // 6. 验证好友关系
  console.log('\n6. 验证好友关系...');
  
  for (const user of testUsers) {
    const friends = await getFriendList(user.account);
    console.log(`📋 ${user.name} 的好友列表 (${friends.length} 人):`);
    friends.forEach(friend => {
      console.log(`   - ${friend.name} (${friend.account})`);
    });
  }

  console.log('\n✅ 测试完成！');
}

// 运行测试
runTest().catch(console.error);
