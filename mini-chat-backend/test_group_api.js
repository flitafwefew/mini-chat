const axios = require('axios');

async function testGroupAPI() {
  try {
    // 先登录获取token
    const loginResponse = await axios.post('http://localhost:3002/api/v1/user/login', {
      account: 'alice',
      password: '123456'
    });

    const token = loginResponse.data.data.token;
    console.log('登录成功，token:', token.substring(0, 20) + '...');

    // 测试获取群组列表
    const groupResponse = await axios.get('http://localhost:3002/api/v1/chat-group/list', {
      headers: {
        'x-token': token
      }
    });

    console.log('\n群组列表API响应:');
    console.log('状态码:', groupResponse.status);
    console.log('响应数据:', JSON.stringify(groupResponse.data, null, 2));

    // 测试获取聊天列表（群组）
    const chatListResponse = await axios.get('http://localhost:3002/api/v1/chat-list/list/group', {
      headers: {
        'x-token': token
      }
    });

    console.log('\n群组聊天列表API响应:');
    console.log('状态码:', chatListResponse.status);
    console.log('响应数据:', JSON.stringify(chatListResponse.data, null, 2));

  } catch (error) {
    console.error('测试API时出错:', error.response?.data || error.message);
  }
}

// 运行测试
testGroupAPI();
