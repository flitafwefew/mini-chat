const axios = require('axios');

async function testFriendAPI() {
  try {
    // 先登录获取token
    const loginResponse = await axios.post('http://localhost:3002/api/v1/user/login', {
      account: 'alice',
      password: '123456'
    });

    const token = loginResponse.data.data.token;
    console.log('登录成功，token:', token.substring(0, 20) + '...');

    // 测试获取好友列表
    const friendResponse = await axios.get('http://localhost:3002/api/v1/friend/list', {
      headers: {
        'x-token': token
      }
    });

    console.log('\n好友列表API响应:');
    console.log('状态码:', friendResponse.status);
    console.log('响应数据:', JSON.stringify(friendResponse.data, null, 2));

    // 测试获取侧边栏好友列表
    const sidebarResponse = await axios.get('http://localhost:3002/api/v1/friend/sidebar', {
      headers: {
        'x-token': token
      }
    });

    console.log('\n侧边栏好友列表API响应:');
    console.log('状态码:', sidebarResponse.status);
    console.log('响应数据:', JSON.stringify(sidebarResponse.data, null, 2));

  } catch (error) {
    console.error('测试API时出错:', error.response?.data || error.message);
  }
}

// 运行测试
testFriendAPI();
