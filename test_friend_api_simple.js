const axios = require('axios');

async function testFriendAPI() {
  try {
    console.log('测试好友列表API...');
    
    // 先登录获取token
    const loginResponse = await axios.post('http://localhost:3002/api/v1/user/login', {
      account: 'user001',
      password: '123456'
    });
    
    console.log('登录响应:', loginResponse.data);
    const token = loginResponse.data.data.token;
    
    // 测试好友列表API
    const friendListResponse = await axios.get('http://localhost:3002/api/v1/friend/list', {
      headers: {
        'x-token': token
      }
    });
    
    console.log('好友列表响应:', friendListResponse.data);
    
  } catch (error) {
    console.error('测试失败:', error.response?.data || error.message);
  }
}

testFriendAPI();
