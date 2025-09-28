const axios = require('axios');

async function testUserUpdate() {
  try {
    // 先登录获取token
    const loginResponse = await axios.post('http://localhost:3002/api/v1/user/login', {
      account: 'alice',
      password: '123456'
    });

    const token = loginResponse.data.data.token;
    console.log('登录成功，token:', token.substring(0, 20) + '...');

    // 测试更新用户信息
    const updateResponse = await axios.put('http://localhost:3002/api/v1/user/info', {
      name: '爱丽丝（已修改）',
      email: 'alice@example.com',
      phone: '13800138000',
      signature: '这是我的新个性签名',
      portrait: 'https://example.com/avatar.jpg'
    }, {
      headers: {
        'x-token': token
      }
    });

    console.log('\n更新用户信息API响应:');
    console.log('状态码:', updateResponse.status);
    console.log('响应数据:', JSON.stringify(updateResponse.data, null, 2));

  } catch (error) {
    console.error('测试API时出错:', error.response?.data || error.message);
  }
}

// 运行测试
testUserUpdate();
