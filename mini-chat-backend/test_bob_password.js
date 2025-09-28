const bcrypt = require('bcryptjs');

// bob用户的加密密码
const hashedPassword = '$2a$10$T2TFvKACtQS8pia/eMjZ3OeCnKpAp0t9/8IoTMkaQn2yQaqH6DnKS';

// 常见的测试密码
const testPasswords = [
  '123456',
  'password',
  'bob',
  'bob123',
  '123456789',
  'admin',
  'test',
  'user',
  '123',
  '000000',
  '111111',
  '888888',
  '666666',
  'qwerty',
  'abc123',
  'password123',
  '12345678',
  'qwerty123',
  'admin123',
  'root'
];

console.log('🔍 正在测试bob用户的密码...\n');

async function testBobPasswords() {
  for (const password of testPasswords) {
    try {
      const isValid = await bcrypt.compare(password, hashedPassword);
      if (isValid) {
        console.log(`✅ 找到正确密码: "${password}"`);
        console.log(`📝 bob用户登录信息:`);
        console.log(`   用户名: bob`);
        console.log(`   密码: ${password}`);
        console.log(`   显示名: 鲍勃`);
        return password;
      }
    } catch (error) {
      console.log(`❌ 测试密码 "${password}" 时出错:`, error.message);
    }
  }
  
  console.log('❌ 未找到匹配的密码');
  console.log('💡 建议: 可能需要重置bob用户的密码');
  return null;
}

testBobPasswords().then(result => {
  if (result) {
    console.log('\n🎉 现在您可以使用以下信息登录bob用户:');
    console.log(`用户名: bob`);
    console.log(`密码: ${result}`);
  } else {
    console.log('\n🔧 需要重置bob用户的密码');
  }
});
