const axios = require('axios');

async function testFrontendAvatarIssue() {
  try {
    console.log('🔍 测试前端头像显示问题...');
    
    // 登录获取token
    const loginResponse = await axios.post('http://localhost:3002/api/v1/user/login', {
      account: 'alice',
      password: '123456'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功');
    
    // 1. 获取用户映射（前端userStore.userMap的来源）
    console.log('\n1. 获取用户映射...');
    const userMapResponse = await axios.get('http://localhost:3002/api/v1/user/list/map', {
      headers: { 'x-token': token }
    });
    
    const userMap = userMapResponse.data.data;
    console.log(`📊 用户映射包含 ${Object.keys(userMap).length} 个用户`);
    
    // 2. 获取私聊列表（前端chatListStore.privateChats的来源）
    console.log('\n2. 获取私聊列表...');
    const privateChatResponse = await axios.get('http://localhost:3002/api/v1/chat-list/list/private', {
      headers: { 'x-token': token }
    });
    
    const privateChats = privateChatResponse.data.data;
    console.log(`📊 私聊列表包含 ${privateChats.length} 个私聊`);
    
    // 3. 获取群成员（前端groupMembers的来源）
    console.log('\n3. 获取群成员...');
    const groupMembersResponse = await axios.get('http://localhost:3002/api/v1/chat-list/groups/group_1758619896527/members', {
      headers: { 'x-token': token }
    });
    
    const groupMembers = groupMembersResponse.data.data;
    console.log(`📊 群成员包含 ${groupMembers.length} 个成员`);
    
    // 4. 分析前端头像显示逻辑
    console.log('\n4. 分析前端头像显示逻辑...');
    console.log('='.repeat(60));
    
    // 检查私聊列表中的用户是否在userMap中
    console.log('\n👤 私聊列表头像显示分析:');
    privateChats.slice(0, 3).forEach(chat => {
      const targetId = chat.targetId;
      const userInMap = userMap[targetId];
      const hasAvatarInMap = userInMap?.avatar;
      const hasAvatarInChat = chat.targetInfo?.avatar || chat.targetInfo?.portrait;
      
      console.log(`\n   用户: ${chat.targetInfo.name} (ID: ${targetId})`);
      console.log(`   userMap中有头像: ${hasAvatarInMap ? '✅' : '❌'}`);
      console.log(`   chat.targetInfo中有头像: ${hasAvatarInChat ? '✅' : '❌'}`);
      
      if (hasAvatarInMap && hasAvatarInChat) {
        const isSame = hasAvatarInMap === hasAvatarInChat;
        console.log(`   头像是否一致: ${isSame ? '✅ 一致' : '❌ 不一致'}`);
      }
    });
    
    // 检查群成员头像显示
    console.log('\n👥 群成员头像显示分析:');
    groupMembers.slice(0, 3).forEach(member => {
      const memberId = member.id;
      const userInMap = userMap[memberId];
      const hasAvatarInMap = userInMap?.avatar;
      const hasAvatarInMember = member.avatar || member.portrait;
      
      console.log(`\n   用户: ${member.name} (ID: ${memberId})`);
      console.log(`   userMap中有头像: ${hasAvatarInMap ? '✅' : '❌'}`);
      console.log(`   member中有头像: ${hasAvatarInMember ? '✅' : '❌'}`);
      
      if (hasAvatarInMap && hasAvatarInMember) {
        const isSame = hasAvatarInMap === hasAvatarInMember;
        console.log(`   头像是否一致: ${isSame ? '✅ 一致' : '❌ 不一致'}`);
      }
    });
    
    // 5. 找出问题
    console.log('\n5. 问题分析:');
    console.log('='.repeat(60));
    
    let privateChatAvatarIssues = 0;
    let groupMemberAvatarIssues = 0;
    
    // 检查私聊列表问题
    privateChats.forEach(chat => {
      const targetId = chat.targetId;
      const userInMap = userMap[targetId];
      if (!userInMap?.avatar) {
        privateChatAvatarIssues++;
        console.log(`❌ 私聊用户 ${chat.targetInfo.name} 在userMap中没有头像`);
      }
    });
    
    // 检查群成员问题
    groupMembers.forEach(member => {
      const memberId = member.id;
      const userInMap = userMap[memberId];
      if (!userInMap?.avatar) {
        groupMemberAvatarIssues++;
        console.log(`❌ 群成员 ${member.name} 在userMap中没有头像`);
      }
    });
    
    console.log(`\n📊 统计结果:`);
    console.log(`   私聊列表头像问题: ${privateChatAvatarIssues}/${privateChats.length}`);
    console.log(`   群成员头像问题: ${groupMemberAvatarIssues}/${groupMembers.length}`);
    
    if (privateChatAvatarIssues === 0 && groupMemberAvatarIssues === 0) {
      console.log('\n🎉 所有用户都在userMap中有头像，问题可能在前端逻辑！');
    } else {
      console.log('\n⚠️ 发现用户映射问题，需要修复！');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

testFrontendAvatarIssue();
