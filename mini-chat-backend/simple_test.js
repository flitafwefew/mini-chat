const axios = require('axios');

async function simpleTest() {
  try {
    // 登录获取token
    const loginResponse = await axios.post('http://127.0.0.1:3002/api/v1/user/login', {
      account: 'user001',
      password: '123456'
    });
    
    const token = loginResponse.data.data.token;
    const user1Id = loginResponse.data.data.user.id;
    
    console.log('用户1 ID:', user1Id);
    
    // 获取第二个用户ID
    const loginResponse2 = await axios.post('http://127.0.0.1:3002/api/v1/user/login', {
      account: 'user002',
      password: '123456'
    });
    
    const user2Id = loginResponse2.data.data.user.id;
    console.log('用户2 ID:', user2Id);
    
    // 测试好友添加
    console.log('测试好友添加...');
    const friendResponse = await axios.post('http://127.0.0.1:3002/api/v1/friend/add', {
      friendId: user2Id
    }, {
      headers: {
        'x-token': token
      }
    });
    
    console.log('好友添加结果:', friendResponse.data);
    
  } catch (error) {
    console.log('错误:', error.response?.status, error.response?.data);
  }
}

simpleTest();
