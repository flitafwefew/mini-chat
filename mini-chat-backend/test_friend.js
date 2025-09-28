const axios = require('axios');

async function testFriendAPI() {
  try {
    console.log('=== 测试好友API ===');
    
    // 1. 登录获取token
    console.log('1. 登录用户1...');
    const login1 = await axios.post('http://127.0.0.1:3002/api/v1/user/login', {
      account: 'user001',
      password: '123456'
    });
    const token1 = login1.data.data.token;
    const user1Id = login1.data.data.user.id;
    console.log('用户1 ID:', user1Id);
    
    // 2. 登录用户2
    console.log('2. 登录用户2...');
    const login2 = await axios.post('http://127.0.0.1:3002/api/v1/user/login', {
      account: 'user002',
      password: '123456'
    });
    const user2Id = login2.data.data.user.id;
    console.log('用户2 ID:', user2Id);
    
    // 3. 测试获取好友列表
    console.log('3. 测试获取好友列表...');
    const friendList = await axios.get('http://127.0.0.1:3002/api/v1/friend/list', {
      headers: { 'x-token': token1 }
    });
    console.log('好友列表:', friendList.data);
    
    // 4. 测试添加好友
    console.log('4. 测试添加好友...');
    const addFriend = await axios.post('http://127.0.0.1:3002/api/v1/friend/add', {
      friendId: user2Id
    }, {
      headers: { 'x-token': token1 }
    });
    console.log('添加好友结果:', addFriend.data);
    
    // 5. 再次获取好友列表
    console.log('5. 再次获取好友列表...');
    const friendList2 = await axios.get('http://127.0.0.1:3002/api/v1/friend/list', {
      headers: { 'x-token': token1 }
    });
    console.log('更新后的好友列表:', friendList2.data);
    
  } catch (error) {
    console.log('错误:', error.response?.status, error.response?.data || error.message);
  }
}

testFriendAPI();
