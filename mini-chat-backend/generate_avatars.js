const User = require('./models/User');
const ChatGroup = require('./models/ChatGroup');
const sequelize = require('./config/db');

// 头像生成服务配置 - 专门使用卡通风格
const AVATAR_SERVICES = {
  // DiceBear API - 卡通风格头像
  dicebear: {
    baseUrl: 'https://api.dicebear.com/7.x',
    // 专门选择卡通风格，类似Bob那样的头像
    styles: ['avataaars', 'personas', 'micah', 'adventurer', 'big-smile', 'lorelei', 'notionists'],
    format: 'svg'
  }
};

// 生成随机卡通头像URL
function generateAvatarUrl(name, type = 'user') {
  // 只使用DiceBear的卡通风格
  const style = AVATAR_SERVICES.dicebear.styles[Math.floor(Math.random() * AVATAR_SERVICES.dicebear.styles.length)];
  const seed = encodeURIComponent(name + Date.now());
  
  // 使用简化的参数格式，避免API返回400错误
  const params = new URLSearchParams({
    seed: seed
  });
  
  return `${AVATAR_SERVICES.dicebear.baseUrl}/${style}/${AVATAR_SERVICES.dicebear.format}?${params.toString()}`;
}

// 获取名字首字母
function getInitials(name) {
  if (!name) return 'U';
  
  // 处理中文名字
  if (/[\u4e00-\u9fa5]/.test(name)) {
    return name.slice(0, 2); // 取前两个字符
  }
  
  // 处理英文名字
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  } else {
    return name.slice(0, 2).toUpperCase();
  }
}

// 为用户生成头像
async function generateUserAvatars() {
  try {
    console.log('开始为用户生成头像...');
    
    const users = await User.findAll({
      // 重新生成所有用户的头像
      attributes: ['id', 'name', 'portrait']
    });
    
    console.log(`找到 ${users.length} 个需要生成头像的用户`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const user of users) {
      try {
        const avatarUrl = generateAvatarUrl(user.name, 'user');
        
        await User.update(
          { portrait: avatarUrl },
          { where: { id: user.id } }
        );
        
        console.log(`✓ 用户 "${user.name}" 头像生成成功: ${avatarUrl}`);
        successCount++;
        
        // 添加小延迟避免请求过快
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`✗ 用户 "${user.name}" 头像生成失败:`, error.message);
        failCount++;
      }
    }
    
    console.log(`\n用户头像生成完成:`);
    console.log(`- 成功: ${successCount} 个`);
    console.log(`- 失败: ${failCount} 个`);
    
  } catch (error) {
    console.error('生成用户头像时出错:', error);
  }
}

// 为群组生成头像
async function generateGroupAvatars() {
  try {
    console.log('\n开始为群组生成头像...');
    
    const groups = await ChatGroup.findAll({
      // 重新生成所有群组的头像
      attributes: ['id', 'name', 'portrait']
    });
    
    console.log(`找到 ${groups.length} 个需要生成头像的群组`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const group of groups) {
      try {
        const avatarUrl = generateAvatarUrl(group.name, 'group');
        
        await ChatGroup.update(
          { portrait: avatarUrl },
          { where: { id: group.id } }
        );
        
        console.log(`✓ 群组 "${group.name}" 头像生成成功: ${avatarUrl}`);
        successCount++;
        
        // 添加小延迟避免请求过快
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`✗ 群组 "${group.name}" 头像生成失败:`, error.message);
        failCount++;
      }
    }
    
    console.log(`\n群组头像生成完成:`);
    console.log(`- 成功: ${successCount} 个`);
    console.log(`- 失败: ${failCount} 个`);
    
  } catch (error) {
    console.error('生成群组头像时出错:', error);
  }
}

// 主函数
async function main() {
  try {
    console.log('🎨 开始生成卡通风格头像...\n');
    
    // 连接数据库
    await sequelize.authenticate();
    console.log('数据库连接成功\n');
    
    // 生成用户头像
    await generateUserAvatars();
    
    // 生成群组头像
    await generateGroupAvatars();
    
    console.log('\n🎉 所有头像生成完成！');
    
    // 显示结果统计
    const { Op } = require('sequelize');
    const userCount = await User.count({ where: { portrait: { [Op.ne]: null } } });
    const groupCount = await ChatGroup.count({ where: { portrait: { [Op.ne]: null } } });
    
    console.log(`\n📊 统计结果:`);
    console.log(`- 有头像的用户: ${userCount} 个`);
    console.log(`- 有头像的群组: ${groupCount} 个`);
    
  } catch (error) {
    console.error('执行过程中出错:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  generateAvatarUrl,
  generateUserAvatars,
  generateGroupAvatars,
  getInitials
};
