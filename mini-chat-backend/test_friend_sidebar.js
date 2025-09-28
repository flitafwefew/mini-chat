const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

// 测试用户信息
const testUsers = [
  {
    account: 'alice',
    password: '123456',
    name: 'Alice',
    portrait: 'https://via.placeholder.com/50x50/FF6B6B/FFFFFF?text=A'
  },
  {
    account: 'bob',
    password: '123456', 
    name: 'Bob',
    portrait: 'https://via.placeholder.com/50x50/4ECDC4/FFFFFF?text=B'
  },
  {
    account: 'charlie',
    password: '123456',
    name: 'Charlie', 
    portrait: 'https://via.placeholder.com/50x50/45B7D1/FFFFFF?text=C'
  }
];

let userTokens = {};

// 登录用户
async function loginUser(user) {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/user/login`, {
      account: user.account,
      password: user.password
    });
    
    if (response.data.code === 200) {
      userTokens[user.account] = response.data.data.token;
      console.log(`✅ ${user.name} 登录成功`);
      return response.data.data.user;
    } else {
      console.log(`❌ ${user.name} 登录失败:`, response.data.message);
      return null;
    }
  } catch (error) {
    console.log(`❌ ${user.name} 登录失败:`, error.message);
    return null;
  }
}

// 添加好友
async function addFriend(fromUser, toUser) {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/friend/add`, {
      friendId: toUser.id
    }, {
      headers: {
        'x-token': userTokens[fromUser.account]
      }
    });
    
    if (response.data.code === 200) {
      console.log(`✅ ${fromUser.name} 添加 ${toUser.name} 为好友成功`);
      return true;
    } else {
      console.log(`❌ ${fromUser.name} 添加 ${toUser.name} 为好友失败:`, response.data.message);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${fromUser.name} 添加 ${toUser.name} 为好友失败:`, error.message);
    return false;
  }
}

// 获取好友列表（用于右边栏）
async function getFriendsForSidebar(user) {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/friend/sidebar`, {
      headers: {
        'x-token': userTokens[user.account]
      }
    });
    
    if (response.data.code === 200) {
      console.log(`✅ ${user.name} 获取好友列表成功:`);
      console.log(`   好友数量: ${response.data.data.total}`);
      response.data.data.friends.forEach((friend, index) => {
        console.log(`   ${index + 1}. ${friend.name} (${friend.account}) - ${friend.is_online ? '在线' : '离线'}`);
        if (friend.is_concern) {
          console.log(`      ⭐ 特别关心`);
        }
        if (friend.remark && friend.remark !== friend.name) {
          console.log(`      备注: ${friend.remark}`);
        }
      });
      return response.data.data;
    } else {
      console.log(`❌ ${user.name} 获取好友列表失败:`, response.data.message);
      return null;
    }
  } catch (error) {
    console.log(`❌ ${user.name} 获取好友列表失败:`, error.message);
    return null;
  }
}

// 主测试函数
async function testFriendSidebar() {
  console.log('🚀 开始测试好友列表功能...\n');
  
  // 1. 登录所有测试用户
  console.log('1. 登录测试用户...');
  const users = {};
  for (const user of testUsers) {
    const userData = await loginUser(user);
    if (userData) {
      users[user.account] = userData;
    }
  }
  
  if (Object.keys(users).length < 2) {
    console.log('❌ 需要至少2个用户才能测试好友功能');
    return;
  }
  
  console.log('\n2. 建立好友关系...');
  // 2. 建立好友关系
  const userList = Object.values(users);
  for (let i = 0; i < userList.length; i++) {
    for (let j = i + 1; j < userList.length; j++) {
      await addFriend(userList[i], userList[j]);
    }
  }
  
  console.log('\n3. 测试获取好友列表...');
  // 3. 测试获取好友列表
  for (const user of userList) {
    await getFriendsForSidebar(user);
    console.log(''); // 空行分隔
  }
  
  console.log('✅ 好友列表功能测试完成！');
}

// 运行测试
testFriendSidebar().catch(console.error);
