const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api/v1';

// 测试用户token（需要先登录获取）
const USER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTAwMiIsImFjY291bnQiOiJib2IiLCJpYXQiOjE3NTg0MzQ5NDYsImV4cCI6MTc1OTAzOTc0Nn0.2kAwhhS3BvXk4_b68fB_8__bze-SJNtu2Cd8cIZfm0g';

const headers = {
  'x-token': USER_TOKEN,
  'Content-Type': 'application/json'
};

async function testNewFeatures() {
  console.log('🚀 测试新功能...\n');

  try {
    // 1. 测试创建群聊
    console.log('1. 测试创建群聊...');
    const createGroupResponse = await axios.post(`${BASE_URL}/chat-list/groups`, {
      name: '测试群聊',
      description: '这是一个测试群聊',
      member_ids: ['user-001'] // 添加其他用户到群聊
    }, { headers });
    
    console.log('✅ 创建群聊成功:', createGroupResponse.data);
    const groupId = createGroupResponse.data.data.id;

    // 2. 测试发送好友申请
    console.log('\n2. 测试发送好友申请...');
    const sendRequestResponse = await axios.post(`${BASE_URL}/friend/request`, {
      friendId: 'user-001',
      message: '你好，我想加你为好友'
    }, { headers });
    
    console.log('✅ 发送好友申请成功:', sendRequestResponse.data);

    // 3. 测试获取好友申请列表
    console.log('\n3. 测试获取好友申请列表...');
    const requestsResponse = await axios.get(`${BASE_URL}/friend/requests`, { headers });
    
    console.log('✅ 获取好友申请列表成功:', requestsResponse.data);

    // 4. 测试直接添加好友（用于测试）
    console.log('\n4. 测试直接添加好友...');
    const addFriendResponse = await axios.post(`${BASE_URL}/friend/add`, {
      friendId: 'user-001'
    }, { headers });
    
    console.log('✅ 添加好友成功:', addFriendResponse.data);

    // 5. 测试获取好友列表
    console.log('\n5. 测试获取好友列表...');
    const friendListResponse = await axios.get(`${BASE_URL}/friend/list`, { headers });
    
    console.log('✅ 获取好友列表成功:', friendListResponse.data);

    // 6. 测试获取群聊列表
    console.log('\n6. 测试获取群聊列表...');
    const groupListResponse = await axios.get(`${BASE_URL}/chat-list/list/group`, { headers });
    
    console.log('✅ 获取群聊列表成功:', groupListResponse.data);

    // 7. 测试文件上传
    console.log('\n7. 测试文件上传...');
    const FormData = require('form-data');
    const fs = require('fs');
    
    // 创建一个测试文件
    const testFilePath = './test-image.txt';
    fs.writeFileSync(testFilePath, '这是一个测试文件');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    
    const uploadResponse = await axios.post(`${BASE_URL}/common/uploadFile`, formData, {
      headers: {
        ...formData.getHeaders(),
        'x-token': USER_TOKEN
      }
    });
    
    console.log('✅ 文件上传成功:', uploadResponse.data);
    
    // 清理测试文件
    fs.unlinkSync(testFilePath);

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

// 运行测试
testNewFeatures();
