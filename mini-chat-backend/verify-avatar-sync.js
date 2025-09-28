const axios = require('axios');

async function verifyAvatarSync() {
  try {
    console.log('🔍 验证群聊中用户头像同步更新...');
    
    // 登录获取token
    const loginResponse = await axios.post('http://localhost:3002/api/v1/auth/login', {
      account: 'test',
      password: '123456'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功');
    
    // 获取用户映射
    console.log('\n1. 检查用户映射API...');
    const userMapResponse = await axios.get('http://localhost:3002/api/v1/auth/user-list-map', {
      headers: { 'x-token': token }
    });
    
    const userMap = userMapResponse.data.data;
    console.log(`📊 用户映射API返回 ${Object.keys(userMap).length} 个用户`);
    
    // 显示前几个用户的头像
    const userIds = Object.keys(userMap).slice(0, 5);
    console.log('\n👤 用户映射中的头像:');
    userIds.forEach(userId => {
      const user = userMap[userId];
      const avatarType = user.avatar ? (user.avatar.includes('dicebear') ? 'DiceBear' : 
                                        user.avatar.includes('data:image') ? 'SVG' : '其他') : '无';
      console.log(`   ${user.name}: ${avatarType} 头像`);
    });
    
    // 获取群成员
    console.log('\n2. 检查群成员API...');
    const groupMembersResponse = await axios.get('http://localhost:3002/api/v1/chat-list/groups/group_1758619896527/members', {
      headers: { 'x-token': token }
    });
    
    const groupMembers = groupMembersResponse.data.data;
    console.log(`📊 群成员API返回 ${groupMembers.length} 个成员`);
    
    // 显示前几个群成员的头像
    console.log('\n👥 群成员中的头像:');
    groupMembers.slice(0, 5).forEach(member => {
      const avatarType = member.avatar ? (member.avatar.includes('dicebear') ? 'DiceBear' : 
                                          member.avatar.includes('data:image') ? 'SVG' : '其他') : '无';
      console.log(`   ${member.name}: ${avatarType} 头像`);
    });
    
    // 验证一致性
    console.log('\n3. 验证头像一致性...');
    let consistentCount = 0;
    let totalCount = 0;
    
    groupMembers.forEach(member => {
      const userInMap = userMap[member.id];
      if (userInMap) {
        totalCount++;
        if (userInMap.avatar === member.avatar) {
          consistentCount++;
        }
      }
    });
    
    console.log(`📈 一致性检查: ${consistentCount}/${totalCount} 用户头像一致`);
    
    if (consistentCount === totalCount) {
      console.log('✅ 所有用户头像在群聊和用户映射中完全一致!');
    } else {
      console.log('⚠️  部分用户头像不一致，需要检查');
    }
    
    // 检查头像类型分布
    console.log('\n4. 头像类型分布:');
    const avatarTypes = {
      dicebear: 0,
      svg: 0,
      other: 0
    };
    
    Object.values(userMap).forEach(user => {
      if (user.avatar) {
        if (user.avatar.includes('dicebear')) {
          avatarTypes.dicebear++;
        } else if (user.avatar.includes('data:image')) {
          avatarTypes.svg++;
        } else {
          avatarTypes.other++;
        }
      }
    });
    
    console.log(`   DiceBear风格: ${avatarTypes.dicebear} 个`);
    console.log(`   SVG头像: ${avatarTypes.svg} 个`);
    console.log(`   其他类型: ${avatarTypes.other} 个`);
    
    console.log('\n🎉 验证完成!');
    
  } catch (error) {
    console.error('❌ 验证失败:', error.response?.data || error.message);
    process.exit(1);
  }
}

verifyAvatarSync();
