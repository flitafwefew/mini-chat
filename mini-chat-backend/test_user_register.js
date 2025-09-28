const axios = require('axios');

async function testUserRegister() {
  try {
    console.log('开始测试用户注册...\n');

    // 测试用户注册 - 使用随机账号名避免重复
    const randomId = Math.floor(Math.random() * 10000);
    const registerResponse = await axios.post('http://localhost:3002/api/v1/user/register', {
      account: `testuser${randomId}`,
      name: `测试用户${randomId}`,
      password: '123456',
      email: `testuser${randomId}@example.com`,
      phone: `13800138${String(randomId).padStart(3, '0')}`
    });

    console.log('用户注册API响应:');
    console.log('状态码:', registerResponse.status);
    console.log('响应数据:', JSON.stringify(registerResponse.data, null, 2));

    if (registerResponse.data.code === 200) {
      console.log('\n✅ 用户注册成功！');
      console.log('用户ID:', registerResponse.data.data.user.id);
      console.log('用户账号:', registerResponse.data.data.user.account);
      console.log('用户名:', registerResponse.data.data.user.name);
      console.log('Token:', registerResponse.data.data.token.substring(0, 20) + '...');
    }

  } catch (error) {
    console.error('测试用户注册时出错:', error.response?.data || error.message);
    
    if (error.response?.data?.code === 400 && error.response?.data?.msg === '用户已存在') {
      console.log('\nℹ️ 用户已存在，这是正常的，说明注册功能工作正常');
    }
  }
}

// 运行测试
testUserRegister();
