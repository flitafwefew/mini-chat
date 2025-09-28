const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api/v1';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTAwMSIsImFjY291bnQiOiJhbGljZSIsImlhdCI6MTc1ODQzNDAxOSwiZXhwIjoxNzU5MDM4ODE5fQ.l4ePxSkb3kiYFZvNvYnwJFLVALkkVbqhTcm-tgK4Xno';

const headers = {
  'x-token': TOKEN,
  'Content-Type': 'application/json'
};

async function testAPIs() {
  console.log('开始测试API...\n');

  try {
    // 1. 测试获取群聊列表
    console.log('1. 测试获取群聊列表...');
    const groupListResponse = await axios.get(`${BASE_URL}/chat-list/group`, { headers });
    console.log('群聊列表:', JSON.stringify(groupListResponse.data, null, 2));
    console.log('');

    // 2. 测试获取私聊列表
    console.log('2. 测试获取私聊列表...');
    const privateListResponse = await axios.get(`${BASE_URL}/chat-list/list/private`, { headers });
    console.log('私聊列表:', JSON.stringify(privateListResponse.data, null, 2));
    console.log('');

    // 3. 测试创建群组
    console.log('3. 测试创建群组...');
    const createGroupResponse = await axios.post(`${BASE_URL}/chat-list/groups`, {
      name: '测试群组',
      description: '这是一个测试群组',
      avatar: null,
      member_ids: ['user-002', 'user-003']
    }, { headers });
    console.log('创建群组结果:', JSON.stringify(createGroupResponse.data, null, 2));
    console.log('');

    // 4. 测试发送群聊消息
    console.log('4. 测试发送群聊消息...');
    const groupId = createGroupResponse.data.data.id;
    const sendGroupMsgResponse = await axios.post(`${BASE_URL}/message/send/group`, {
      group_id: groupId,
      msg_content: '大家好，这是群聊测试消息！',
      type: 'text',
      source: 'web'
    }, { headers });
    console.log('发送群聊消息结果:', JSON.stringify(sendGroupMsgResponse.data, null, 2));
    console.log('');

    // 5. 测试发送私聊消息
    console.log('5. 测试发送私聊消息...');
    const sendPrivateMsgResponse = await axios.post(`${BASE_URL}/message/send/private`, {
      to_user_id: 'user-002',
      msg_content: '你好，这是私聊测试消息！',
      type: 'text',
      source: 'web'
    }, { headers });
    console.log('发送私聊消息结果:', JSON.stringify(sendPrivateMsgResponse.data, null, 2));
    console.log('');

    // 6. 测试获取消息历史
    console.log('6. 测试获取群聊消息历史...');
    const groupMessagesResponse = await axios.get(`${BASE_URL}/message/list?targetId=group_${groupId}&index=0&num=10`, { headers });
    console.log('群聊消息历史:', JSON.stringify(groupMessagesResponse.data, null, 2));
    console.log('');

    // 7. 测试获取私聊消息历史
    console.log('7. 测试获取私聊消息历史...');
    const privateMessagesResponse = await axios.get(`${BASE_URL}/message/list?targetId=user-002&index=0&num=10`, { headers });
    console.log('私聊消息历史:', JSON.stringify(privateMessagesResponse.data, null, 2));
    console.log('');

    console.log('所有API测试完成！');

  } catch (error) {
    console.error('API测试失败:', error.response?.data || error.message);
  }
}

// 运行测试
testAPIs();
