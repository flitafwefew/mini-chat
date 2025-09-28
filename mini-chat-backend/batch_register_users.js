const axios = require('axios');

// 用户数据配置
const usersData = [
  {
    account: 'user001',
    name: '张三',
    password: '123456',
    email: 'zhangsan@example.com',
    phone: '13800138001'
  },
  {
    account: 'user002',
    name: '李四',
    password: '123456',
    email: 'lisi@example.com',
    phone: '13800138002'
  },
  {
    account: 'user003',
    name: '王五',
    password: '123456',
    email: 'wangwu@example.com',
    phone: '13800138003'
  },
  {
    account: 'user004',
    name: '赵六',
    password: '123456',
    email: 'zhaoliu@example.com',
    phone: '13800138004'
  },
  {
    account: 'user005',
    name: '钱七',
    password: '123456',
    email: 'qianqi@example.com',
    phone: '13800138005'
  },
  {
    account: 'user006',
    name: '孙八',
    password: '123456',
    email: 'sunba@example.com',
    phone: '13800138006'
  },
  {
    account: 'user007',
    name: '周九',
    password: '123456',
    email: 'zhoujiu@example.com',
    phone: '13800138007'
  },
  {
    account: 'user008',
    name: '吴十',
    password: '123456',
    email: 'wushi@example.com',
    phone: '13800138008'
  },
  {
    account: 'user009',
    name: '郑十一',
    password: '123456',
    email: 'zhengshiyi@example.com',
    phone: '13800138009'
  },
  {
    account: 'user010',
    name: '王十二',
    password: '123456',
    email: 'wangshier@example.com',
    phone: '13800138010'
  },
  {
    account: 'user011',
    name: '刘十三',
    password: '123456',
    email: 'liushisan@example.com',
    phone: '13800138011'
  },
  {
    account: 'user012',
    name: '陈十四',
    password: '123456',
    email: 'chenshisi@example.com',
    phone: '13800138012'
  },
  {
    account: 'user013',
    name: '杨十五',
    password: '123456',
    email: 'yangshiwu@example.com',
    phone: '13800138013'
  },
  {
    account: 'user014',
    name: '黄十六',
    password: '123456',
    email: 'huangshiliu@example.com',
    phone: '13800138014'
  },
  {
    account: 'user015',
    name: '林十七',
    password: '123456',
    email: 'linshiqi@example.com',
    phone: '13800138015'
  }
];

// 批量注册用户函数
async function batchRegisterUsers() {
  console.log('🚀 开始批量注册用户...\n');
  
  const results = {
    success: [],
    failed: [],
    total: usersData.length
  };

  for (let i = 0; i < usersData.length; i++) {
    const userData = usersData[i];
    console.log(`📝 正在注册第 ${i + 1}/${usersData.length} 个用户: ${userData.name} (${userData.account})`);
    
    try {
      const response = await axios.post('http://127.0.0.1:3002/api/v1/user/register', userData);
      
      if (response.data.code === 200) {
        console.log(`✅ 用户 ${userData.name} 注册成功!`);
        console.log(`   - 用户ID: ${response.data.data.user.id}`);
        console.log(`   - 账号: ${response.data.data.user.account}`);
        console.log(`   - 邮箱: ${response.data.data.user.email}`);
        
        results.success.push({
          ...userData,
          id: response.data.data.user.id,
          token: response.data.data.token
        });
      } else {
        console.log(`❌ 用户 ${userData.name} 注册失败: ${response.data.msg}`);
        results.failed.push({
          ...userData,
          error: response.data.msg
        });
      }
    } catch (error) {
      const errorMsg = error.response?.data?.msg || error.message;
      console.log(`❌ 用户 ${userData.name} 注册失败: ${errorMsg}`);
      
      results.failed.push({
        ...userData,
        error: errorMsg
      });
    }
    
    console.log(''); // 空行分隔
  }

  // 为用户之间建立好友关系
  if (results.success.length > 1) {
    console.log('🤝 开始为用户建立好友关系...\n');
    await establishFriendRelationships(results.success);
    
    // 创建群聊并添加所有用户
    console.log('👥 开始创建群聊...\n');
    await createGroupChat(results.success);
  }

  // 输出总结
  console.log('📊 批量注册结果总结:');
  console.log(`总用户数: ${results.total}`);
  console.log(`成功注册: ${results.success.length}`);
  console.log(`注册失败: ${results.failed.length}`);
  console.log(`成功率: ${((results.success.length / results.total) * 100).toFixed(1)}%\n`);

  if (results.success.length > 0) {
    console.log('✅ 成功注册的用户:');
    results.success.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.account}) - ID: ${user.id}`);
    });
    console.log('');
  }

  if (results.failed.length > 0) {
    console.log('❌ 注册失败的用户:');
    results.failed.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.account}) - 错误: ${user.error}`);
    });
    console.log('');
  }

  // 生成登录测试信息
  if (results.success.length > 0) {
    console.log('🔑 测试登录信息 (密码都是: 123456):');
    results.success.slice(0, 5).forEach((user, index) => {
      console.log(`  ${index + 1}. 账号: ${user.account}, 密码: 123456`);
    });
    if (results.success.length > 5) {
      console.log(`  ... 还有 ${results.success.length - 5} 个用户`);
    }
  }

  return results;
}

// 建立好友关系函数
async function establishFriendRelationships(users) {
  console.log('🤝 开始建立好友关系...\n');
  
  const friendResults = {
    success: 0,
    failed: 0,
    total: 0
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
            'Authorization': `Bearer ${user1.token}`
          }
        });
        
        if (response.data.code === 200) {
          console.log(`✅ ${user1.name} 和 ${user2.name} 成为好友!`);
          friendResults.success++;
        } else {
          console.log(`❌ 建立好友关系失败: ${response.data.message}`);
          friendResults.failed++;
        }
      } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        console.log(`❌ 建立好友关系失败: ${errorMsg}`);
        friendResults.failed++;
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

  return friendResults;
}

// 创建群聊并添加所有用户
async function createGroupChat(users) {
  console.log('👥 开始创建群聊...\n');
  
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
      name: '测试群聊',
      description: '这是一个测试群聊，包含所有注册用户',
      member_ids: memberIds
    }, {
      headers: {
        'Authorization': `Bearer ${groupOwner.token}`
      }
    });
    
    if (response.data.code === 200) {
      const groupData = response.data.data;
      console.log(`✅ 群聊创建成功!`);
      console.log(`   - 群ID: ${groupData.id}`);
      console.log(`   - 群名称: ${groupData.name}`);
      console.log(`   - 成员数量: ${groupData.member_count}`);
      
      console.log('\n👥 群成员列表:');
      users.forEach((user, index) => {
        const role = index === 0 ? '群主' : '成员';
        console.log(`   ${index + 1}. ${user.name} (${user.account}) - ${role}`);
      });
      
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

// 检查服务器是否运行
async function checkServerStatus() {
  try {
    console.log('🔍 检查服务器状态...');
    // 使用127.0.0.1而不是localhost来避免IPv6问题
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

// 主函数
async function main() {
  console.log('='.repeat(50));
  console.log('🎯 Mini Chat 批量用户注册工具');
  console.log('='.repeat(50));
  console.log('');

  // 检查服务器状态
  const serverRunning = await checkServerStatus();
  if (!serverRunning) {
    process.exit(1);
  }

  // 开始批量注册
  await batchRegisterUsers();
  
  console.log('='.repeat(50));
  console.log('🎉 批量注册完成!');
  console.log('='.repeat(50));
}

// 运行脚本
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 脚本执行出错:', error.message);
    process.exit(1);
  });
}

module.exports = {
  batchRegisterUsers,
  establishFriendRelationships,
  createGroupChat,
  usersData
};




