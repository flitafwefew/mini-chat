const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:3002';

// 要注销的测试用户
const usersToDelete = [
  { account: 'alice', password: '123456' },
  { account: 'charlie', password: '123456' },
  { account: 'diana', password: '123456' },
  { account: 'eve', password: '123456' }
];

// 登录获取token
async function loginUser(account, password) {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/user/login`, {
      account,
      password
    });
    
    if (response.data.code === 0) {
      console.log(`✅ ${account} 登录成功`);
      return response.data.data.token;
    } else {
      console.log(`❌ ${account} 登录失败: ${response.data.msg}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ ${account} 登录失败: ${error.message}`);
    return null;
  }
}

// 注销用户
async function deleteUser(token, account) {
  try {
    const response = await axios.delete(`${BASE_URL}/api/v1/user/delete`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.data.code === 0) {
      console.log(`✅ ${account} 注销成功`);
      return true;
    } else {
      console.log(`❌ ${account} 注销失败: ${response.data.msg}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${account} 注销失败: ${error.response?.data?.msg || error.message}`);
    return false;
  }
}

// 主函数
async function main() {
  console.log('🗑️ 开始注销测试用户...\n');
  
  const results = {
    success: [],
    failed: []
  };
  
  for (const user of usersToDelete) {
    console.log(`📝 正在处理用户: ${user.account}`);
    
    // 先登录获取token
    const token = await loginUser(user.account, user.password);
    
    if (token) {
      // 注销用户
      const success = await deleteUser(token, user.account);
      
      if (success) {
        results.success.push(user.account);
      } else {
        results.failed.push(user.account);
      }
    } else {
      console.log(`❌ 无法登录 ${user.account}，跳过注销`);
      results.failed.push(user.account);
    }
    
    console.log(''); // 空行分隔
  }
  
  // 输出结果
  console.log('📊 注销结果总结:');
  console.log(`成功注销: ${results.success.length} 个用户`);
  console.log(`注销失败: ${results.failed.length} 个用户`);
  
  if (results.success.length > 0) {
    console.log('\n✅ 成功注销的用户:');
    results.success.forEach(account => {
      console.log(`  - ${account}`);
    });
  }
  
  if (results.failed.length > 0) {
    console.log('\n❌ 注销失败的用户:');
    results.failed.forEach(account => {
      console.log(`  - ${account}`);
    });
  }
  
  console.log('\n🎉 注销操作完成!');
}

// 运行脚本
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 脚本执行出错:', error.message);
    process.exit(1);
  });
}

module.exports = { main, usersToDelete };
