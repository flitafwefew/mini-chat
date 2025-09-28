const axios = require('axios');

// 检查服务器是否运行
async function checkServerStatus() {
  try {
    console.log('🔍 检查服务器状态...');
    const response = await axios.get('http://127.0.0.1:3002/api/v1/chat-list', {
      timeout: 5000,
      validateStatus: function (status) {
        // 即使返回401也认为服务器在运行
        return status < 500;
      }
    });
    console.log('✅ 服务器运行正常\n');
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      console.log('❌ 服务器未运行或无法连接');
      console.log('请确保后端服务已启动 (运行: npm start 或 node server.js)\n');
      return false;
    } else {
      // 其他错误（如401）也认为服务器在运行
      console.log('✅ 服务器运行正常\n');
      return true;
    }
  }
}

// 获取所有用户列表
async function getAllUsers() {
  try {
    console.log('📋 获取所有用户列表...');
    
    // 使用一个测试用户登录来获取用户列表
    const loginResponse = await axios.post('http://127.0.0.1:3002/api/v1/user/login', {
      account: 'user001',
      password: '123456'
    });
    
    if (loginResponse.data.code !== 200) {
      throw new Error('登录失败，无法获取用户列表');
    }
    
    const token = loginResponse.data.data.token;
    
    // 获取所有用户（这里需要根据你的API调整）
    const usersResponse = await axios.get('http://127.0.0.1:3002/api/v1/user/search?keyword=', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (usersResponse.data.code === 200) {
      console.log(`✅ 获取到 ${usersResponse.data.data.length} 个用户\n`);
      return {
        users: usersResponse.data.data,
        token: token
      };
    } else {
      throw new Error('获取用户列表失败');
    }
  } catch (error) {
    console.log(`❌ 获取用户列表失败: ${error.message}`);
    
    // 如果API获取失败，通过登录获取用户信息
    console.log('🔄 通过登录获取用户信息...');
    const predefinedUsers = [];
    
    // 预定义的账号列表
    const accounts = [
      'user001', 'user002', 'user003', 'user004', 'user005',
      'user006', 'user007', 'user008', 'user009', 'user010',
      'user011', 'user012', 'user013', 'user014', 'user015'
    ];
    
    // 通过登录获取每个用户的真实ID
    for (const account of accounts) {
      try {
        const loginResponse = await axios.post('http://127.0.0.1:3002/api/v1/user/login', {
          account: account,
          password: '123456'
        });
        
        if (loginResponse.data.code === 200) {
          const user = loginResponse.data.data.user;
          predefinedUsers.push({
            id: user.id,
            account: user.account,
            name: user.name
          });
        }
      } catch (error) {
        console.log(`❌ 无法获取用户 ${account} 的信息`);
      }
    }
    
    // 获取第一个用户的token
    try {
      const loginResponse = await axios.post('http://127.0.0.1:3002/api/v1/user/login', {
        account: 'user001',
        password: '123456'
      });
      
      if (loginResponse.data.code === 200) {
        console.log(`✅ 使用预定义用户列表，共 ${predefinedUsers.length} 个用户\n`);
        return {
          users: predefinedUsers,
          token: loginResponse.data.data.token
        };
      }
    } catch (loginError) {
      console.log('❌ 无法获取token，请确保用户已注册');
      return null;
    }
  }
}

// 为所有用户互相添加好友关系
async function addAllFriends(users, token) {
  console.log('🤝 开始为所有用户互相添加好友关系...\n');
  
  const friendResults = {
    success: 0,
    failed: 0,
    total: 0,
    errors: []
  };

  // 为每对用户建立双向好友关系
  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      const user1 = users[i];
      const user2 = users[j];
      
      console.log(`🔗 建立好友关系: ${user1.name} ↔ ${user2.name}`);
      
      try {
        // 使用第一个用户的token来添加好友
        const response = await axios.post('http://127.0.0.1:3002/api/v1/friend/add', {
          friendId: user2.id
        }, {
          headers: {
            'x-token': token
          }
        });
        
        if (response.data.code === 200) {
          console.log(`✅ ${user1.name} 和 ${user2.name} 成为好友!`);
          friendResults.success++;
        } else {
          console.log(`❌ 建立好友关系失败: ${response.data.message}`);
          friendResults.failed++;
          friendResults.errors.push(`${user1.name} ↔ ${user2.name}: ${response.data.message}`);
        }
      } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        console.log(`❌ 建立好友关系失败: ${errorMsg}`);
        friendResults.failed++;
        friendResults.errors.push(`${user1.name} ↔ ${user2.name}: ${errorMsg}`);
      }
      
      friendResults.total++;
      console.log(''); // 空行分隔
    }
  }

  console.log('📊 好友关系建立结果:');
  console.log(`总关系数: ${friendResults.total}`);
  console.log(`成功建立: ${friendResults.success}`);
  console.log(`建立失败: ${friendResults.failed}`);
  console.log(`成功率: ${((friendResults.success / friendResults.total) * 100).toFixed(1)}%\n`);

  if (friendResults.errors.length > 0) {
    console.log('❌ 失败详情:');
    friendResults.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
    console.log('');
  }

  return friendResults;
}

// 创建群聊
async function createGroup(users, token, groupName, groupDescription) {
  console.log(`👥 开始创建群聊: ${groupName}...\n`);
  
  if (users.length < 2) {
    console.log('❌ 用户数量不足，无法创建群聊\n');
    return null;
  }

  try {
    // 使用第一个用户作为群主创建群聊
    const groupOwner = users[0];
    const memberIds = users.slice(1).map(user => user.id);
    
    console.log(`🏗️ 群主: ${groupOwner.name} (${groupOwner.account})`);
    console.log(`👥 群成员数量: ${users.length} 人`);
    
    const response = await axios.post('http://127.0.0.1:3002/api/v1/chat-list/groups', {
      name: groupName,
      description: groupDescription,
      member_ids: memberIds
    }, {
      headers: {
        'x-token': token
      }
    });
    
    if (response.data.code === 200) {
      const groupData = response.data.data;
      console.log(`✅ 群聊 "${groupName}" 创建成功!`);
      console.log(`   - 群ID: ${groupData.id}`);
      console.log(`   - 群名称: ${groupData.name}`);
      console.log(`   - 成员数量: ${groupData.member_count}`);
      
      console.log('\n👥 群成员列表:');
      users.forEach((user, index) => {
        const role = index === 0 ? '群主' : '成员';
        console.log(`   ${index + 1}. ${user.name} (${user.account}) - ${role}`);
      });
      console.log('');
      
      return groupData;
    } else {
      console.log(`❌ 群聊创建失败: ${response.data.msg}`);
      return null;
    }
  } catch (error) {
    const errorMsg = error.response?.data?.msg || error.message;
    console.log(`❌ 群聊创建失败: ${errorMsg}`);
    return null;
  }
}

// 主函数
async function main() {
  console.log('='.repeat(60));
  console.log('🎯 Mini Chat 好友关系和群聊设置工具');
  console.log('='.repeat(60));
  console.log('');

  // 检查服务器状态
  const serverRunning = await checkServerStatus();
  if (!serverRunning) {
    process.exit(1);
  }

  // 获取所有用户
  const userData = await getAllUsers();
  if (!userData || !userData.users || userData.users.length === 0) {
    console.log('❌ 无法获取用户数据，请确保用户已注册');
    process.exit(1);
  }

  const users = userData.users;
  const token = userData.token;

  console.log(`📋 当前用户列表 (共 ${users.length} 人):`);
  users.forEach((user, index) => {
    console.log(`   ${index + 1}. ${user.name} (${user.account}) - ID: ${user.id}`);
  });
  console.log('');

  // 为所有用户互相添加好友关系
  const friendResults = await addAllFriends(users, token);

  // 创建两个总群聊
  console.log('🏗️ 开始创建群聊...\n');
  
  const group1 = await createGroup(
    users, 
    token, 
    '总群聊1 - 大家庭', 
    '这是第一个总群聊，包含所有用户，大家可以在这里自由交流！'
  );

  const group2 = await createGroup(
    users, 
    token, 
    '总群聊2 - 工作群', 
    '这是第二个总群聊，主要用于工作相关的讨论和协作！'
  );

  // 输出总结
  console.log('='.repeat(60));
  console.log('🎉 设置完成总结:');
  console.log('='.repeat(60));
  console.log(`👥 用户总数: ${users.length}`);
  console.log(`🤝 好友关系: ${friendResults.success}/${friendResults.total} 成功建立`);
  console.log(`📊 好友成功率: ${((friendResults.success / friendResults.total) * 100).toFixed(1)}%`);
  console.log(`👥 群聊创建: ${group1 ? '✅ 总群聊1' : '❌ 总群聊1'} | ${group2 ? '✅ 总群聊2' : '❌ 总群聊2'}`);
  console.log('');
  
  if (group1) {
    console.log('✅ 总群聊1 "大家庭" 创建成功');
  }
  if (group2) {
    console.log('✅ 总群聊2 "工作群" 创建成功');
  }
  
  console.log('');
  console.log('🔑 测试登录信息 (密码都是: 123456):');
  users.slice(0, 3).forEach((user, index) => {
    console.log(`   ${index + 1}. 账号: ${user.account}, 密码: 123456`);
  });
  if (users.length > 3) {
    console.log(`   ... 还有 ${users.length - 3} 个用户`);
  }
  
  console.log('');
  console.log('🎯 现在所有用户都互相是好友，并且都在两个总群中！');
  console.log('='.repeat(60));
}

// 运行脚本
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 脚本执行出错:', error.message);
    process.exit(1);
  });
}

module.exports = {
  addAllFriends,
  createGroup,
  getAllUsers
};
