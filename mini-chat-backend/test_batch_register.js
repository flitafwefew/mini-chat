const { batchRegisterUsers } = require('./batch_register_users');

// 测试批量注册脚本
async function testBatchRegister() {
  console.log('🧪 开始测试批量注册脚本...\n');
  
  try {
    const results = await batchRegisterUsers();
    
    console.log('\n🎉 测试完成!');
    console.log('='.repeat(50));
    console.log('📋 测试结果总结:');
    console.log(`✅ 成功注册用户: ${results.success.length}`);
    console.log(`❌ 注册失败用户: ${results.failed.length}`);
    console.log(`📊 总用户数: ${results.total}`);
    console.log(`🎯 成功率: ${((results.success.length / results.total) * 100).toFixed(1)}%`);
    
    if (results.success.length > 0) {
      console.log('\n👥 成功注册的用户:');
      results.success.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.account}) - ID: ${user.id}`);
      });
    }
    
    if (results.failed.length > 0) {
      console.log('\n❌ 注册失败的用户:');
      results.failed.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.account}) - 错误: ${user.error}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
  }
}

// 运行测试
if (require.main === module) {
  testBatchRegister();
}

module.exports = { testBatchRegister };

