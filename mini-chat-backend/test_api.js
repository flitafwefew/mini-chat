const axios = require('axios');

async function testAPI() {
  try {
    console.log('🔍 测试登录API...');
    const loginResponse = await axios.post('http://127.0.0.1:3002/api/v1/user/login', {
      account: 'user001',
      password: '123456'
    });
    
    console.log('✅ 登录成功:', loginResponse.data);
    const token = loginResponse.data.data.token;
    
    console.log('🔍 测试好友添加API...');
    try {
      const friendResponse = await axios.post('http://127.0.0.1:3002/api/v1/friend/add', {
        friendId: 'user002'
      }, {
        headers: {
          'x-token': token
        }
      });
      
      console.log('✅ 好友添加成功:', friendResponse.data);
    } catch (friendError) {
      console.log('❌ 好友添加失败:', friendError.response?.status, friendError.response?.data);
    }
    
    console.log('🔍 测试群聊创建API...');
    try {
      const groupResponse = await axios.post('http://127.0.0.1:3002/api/v1/chat-list/groups', {
        name: '测试群聊',
        description: '这是一个测试群聊',
        member_ids: ['user002', 'user003']
      }, {
        headers: {
          'x-token': token
        }
      });
      
      console.log('✅ 群聊创建成功:', groupResponse.data);
    } catch (groupError) {
      console.log('❌ 群聊创建失败:', groupError.response?.status, groupError.response?.data);
    }
    
  } catch (error) {
    console.log('❌ 测试失败:', error.message);
  }
}

testAPI();
