const axios = require('axios');

async function testAvatarConsistency() {
  console.log('🔍 测试头像一致性修复...\n');
  
  try {
    // 测试用户映射API
    console.log('1. 测试用户映射API...');
    const userMapResponse = await axios.get('http://localhost:3002/api/v1/user/list/map');
    
    if (userMapResponse.data.code === 200) {
      console.log('✅ 用户映射API正常');
      const userMap = userMapResponse.data.data;
      const userIds = Object.keys(userMap);
      
      console.log(`📊 找到 ${userIds.length} 个用户`);
      
      // 检查每个用户的头像字段
      let hasAvatarField = 0;
      let hasPortraitField = 0;
      let avatarPortraitMatch = 0;
      
      userIds.forEach(userId => {
        const user = userMap[userId];
        if (user.avatar !== undefined) hasAvatarField++;
        if (user.portrait !== undefined) hasPortraitField++;
        if (user.avatar === user.portrait) avatarPortraitMatch++;
        
        console.log(`👤 ${user.name}:`);
        console.log(`   - avatar: ${user.avatar ? '✅' : '❌'}`);
        console.log(`   - portrait: ${user.portrait ? '✅' : '❌'}`);
        console.log(`   - type: ${user.type || '❌'}`);
        console.log(`   - 字段一致: ${user.avatar === user.portrait ? '✅' : '❌'}`);
      });
      
      console.log(`\n📈 统计结果:`);
      console.log(`   - 有avatar字段的用户: ${hasAvatarField}/${userIds.length}`);
      console.log(`   - 有portrait字段的用户: ${hasPortraitField}/${userIds.length}`);
      console.log(`   - avatar和portrait一致的用户: ${avatarPortraitMatch}/${userIds.length}`);
      
      if (hasAvatarField === userIds.length && hasPortraitField === userIds.length && avatarPortraitMatch === userIds.length) {
        console.log('✅ 所有用户都有完整的头像字段且一致');
      } else {
        console.log('❌ 部分用户缺少头像字段或不一致');
      }
      
    } else {
      console.log('❌ 用户映射API返回错误:', userMapResponse.data.msg);
    }
    
    // 测试群成员API
    console.log('\n2. 测试群成员API...');
    try {
      // 先登录获取token
      const loginResponse = await axios.post('http://localhost:3002/api/v1/user/login', {
        account: 'alice',
        password: '123456'
      });
      
      const token = loginResponse.data.data.token;
      
      // 获取群成员列表
      const groupMembersResponse = await axios.get('http://localhost:3002/api/v1/chatList/groups/group_1/members', {
        headers: {
          'x-token': token
        }
      });
      
      if (groupMembersResponse.data.code === 200) {
        console.log('✅ 群成员API正常');
        const members = groupMembersResponse.data.data;
        
        console.log(`📊 找到 ${members.length} 个群成员`);
        
        let membersWithAvatar = 0;
        let membersWithPortrait = 0;
        let membersConsistent = 0;
        
        members.forEach(member => {
          if (member.avatar !== undefined) membersWithAvatar++;
          if (member.portrait !== undefined) membersWithPortrait++;
          if (member.avatar === member.portrait) membersConsistent++;
          
          console.log(`👤 ${member.name}:`);
          console.log(`   - avatar: ${member.avatar ? '✅' : '❌'}`);
          console.log(`   - portrait: ${member.portrait ? '✅' : '❌'}`);
          console.log(`   - type: ${member.type || '❌'}`);
        });
        
        console.log(`\n📈 群成员统计:`);
        console.log(`   - 有avatar字段的成员: ${membersWithAvatar}/${members.length}`);
        console.log(`   - 有portrait字段的成员: ${membersWithPortrait}/${members.length}`);
        console.log(`   - avatar和portrait一致的成员: ${membersConsistent}/${members.length}`);
        
      } else {
        console.log('❌ 群成员API返回错误:', groupMembersResponse.data.msg);
      }
      
    } catch (groupError) {
      console.log('❌ 群成员API测试失败:', groupError.message);
    }
    
  } catch (error) {
    console.log('❌ 测试失败:', error.message);
    console.log('   请确保后端服务正在运行 (http://localhost:3002)');
  }
  
  console.log('\n📝 修复说明:');
  console.log('1. 后端API现在同时返回avatar和portrait字段');
  console.log('2. 前端组件统一使用avatar字段');
  console.log('3. 如果没有头像，会显示基于名字生成的默认头像');
  console.log('4. 群成员API也添加了avatar字段映射');
  console.log('\n🔄 请重启后端服务以使更改生效');
}

testAvatarConsistency().catch(console.error);
