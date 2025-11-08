/**
 * 数据库连接测试脚本
 * 用于诊断数据库连接问题
 */

require('dotenv').config();
const sequelize = require('./config/db');
const { User, Friend } = require('./models/associations');
const { Op } = require('sequelize');

async function testDatabaseConnection() {
  console.log('='.repeat(80));
  console.log('开始测试数据库连接...');
  console.log('='.repeat(80));
  
  // 1. 测试基本连接
  console.log('\n1. 测试数据库基本连接...');
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败');
    console.error('错误名称:', error.name);
    console.error('错误消息:', error.message);
    if (error.original) {
      console.error('原始错误代码:', error.original.code);
      console.error('SQL状态:', error.original.sqlState);
    }
    console.error('\n请检查：');
    console.error('1. MySQL 服务是否正在运行');
    console.error('2. 数据库配置是否正确（config/db.js 或 .env 文件）');
    console.error('3. 数据库用户是否有权限');
    console.error('4. 数据库名称是否存在');
    process.exit(1);
  }

  // 2. 测试模型加载
  console.log('\n2. 测试模型加载...');
  if (!User) {
    console.error('❌ User 模型未加载');
    process.exit(1);
  }
  if (!Friend) {
    console.error('❌ Friend 模型未加载');
    process.exit(1);
  }
  console.log('✅ 模型加载成功');

  // 3. 测试简单查询
  console.log('\n3. 测试简单查询...');
  try {
    const userCount = await User.count();
    console.log(`✅ User 表查询成功，共有 ${userCount} 个用户`);
  } catch (error) {
    console.error('❌ User 表查询失败');
    console.error('错误:', error.message);
    process.exit(1);
  }

  try {
    const friendCount = await Friend.count();
    console.log(`✅ Friend 表查询成功，共有 ${friendCount} 条好友关系`);
  } catch (error) {
    console.error('❌ Friend 表查询失败');
    console.error('错误:', error.message);
    process.exit(1);
  }

  // 4. 测试搜索查询（模拟搜索操作）
  console.log('\n4. 测试搜索查询...');
  try {
    const testUsers = await User.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: '%test%' } },
          { account: { [Op.like]: '%test%' } }
        ]
      },
      limit: 5,
      attributes: ['id', 'account', 'name']
    });
    console.log(`✅ 搜索查询成功，找到 ${testUsers.length} 个测试用户`);
  } catch (error) {
    console.error('❌ 搜索查询失败');
    console.error('错误:', error.message);
    console.error('错误堆栈:', error.stack);
    process.exit(1);
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ 所有测试通过！数据库连接正常。');
  console.log('='.repeat(80));
  
  await sequelize.close();
  process.exit(0);
}

// 运行测试
testDatabaseConnection().catch(error => {
  console.error('\n❌ 测试过程中发生未预期的错误:');
  console.error(error);
  process.exit(1);
});

