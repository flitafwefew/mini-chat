const User = require('./models/User');

// 随机头像生成器
class RandomAvatarGenerator {
  constructor() {
    // 预定义的头像颜色组合
    this.colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2',
      '#A9DFBF', '#F9E79F', '#D5A6BD', '#A3E4D7', '#FADBD8'
    ];
    
    // 预定义的表情符号
    this.emojis = [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
      '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
      '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
      '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
      '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
      '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓'
    ];
  }

  // 生成随机头像URL (使用DiceBear API)
  generateAvatarUrl(name) {
    const styles = ['avataaars', 'personas', 'micah', 'adventurer', 'big-smile'];
    const style = styles[Math.floor(Math.random() * styles.length)];
    
    // 使用名字作为种子确保同一用户总是生成相同的头像
    const seed = this.stringToSeed(name);
    
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=${this.getRandomColor()}&size=100`;
  }

  // 生成基于名字的默认头像 (SVG)
  generateDefaultAvatar(name) {
    const firstChar = name.charAt(0).toUpperCase();
    const bgColor = this.getRandomColor();
    const textColor = this.getContrastColor(bgColor);
    
    return `data:image/svg+xml;base64,${Buffer.from(`
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="${bgColor}" rx="50"/>
        <text x="50" y="50" font-family="Arial, sans-serif" font-size="40" 
              font-weight="bold" text-anchor="middle" dy=".3em" fill="${textColor}">
          ${firstChar}
        </text>
      </svg>
    `).toString('base64')}`;
  }

  // 生成表情符号头像
  generateEmojiAvatar(name) {
    const emoji = this.emojis[Math.floor(Math.random() * this.emojis.length)];
    const bgColor = this.getRandomColor();
    
    return `data:image/svg+xml;base64,${Buffer.from(`
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="${bgColor}" rx="50"/>
        <text x="50" y="50" font-size="50" text-anchor="middle" dy=".3em">
          ${emoji}
        </text>
      </svg>
    `).toString('base64')}`;
  }

  // 获取随机颜色
  getRandomColor() {
    return this.colors[Math.floor(Math.random() * this.colors.length)];
  }

  // 获取对比色
  getContrastColor(hexColor) {
    // 简单的对比色计算
    const color = hexColor.replace('#', '');
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
  }

  // 字符串转种子
  stringToSeed(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString();
  }

  // 随机选择头像类型
  generateRandomAvatar(name) {
    const types = ['dicebear', 'default', 'emoji'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    switch (type) {
      case 'dicebear':
        return this.generateAvatarUrl(name);
      case 'default':
        return this.generateDefaultAvatar(name);
      case 'emoji':
        return this.generateEmojiAvatar(name);
      default:
        return this.generateDefaultAvatar(name);
    }
  }
}

async function generateRandomAvatars() {
  try {
    console.log('🎨 开始为所有用户生成随机头像...');
    
    const users = await User.findAll({
      attributes: ['id', 'name', 'portrait']
    });
    
    const generator = new RandomAvatarGenerator();
    let updatedCount = 0;
    
    console.log(`📊 找到 ${users.length} 个用户`);
    console.log('='.repeat(60));
    
    for (const user of users) {
      const newAvatar = generator.generateRandomAvatar(user.name);
      
      await user.update({
        portrait: newAvatar,
        update_time: new Date()
      });
      
      console.log(`✅ ${user.name}: 头像已更新`);
      updatedCount++;
    }
    
    console.log('='.repeat(60));
    console.log(`🎉 成功为 ${updatedCount} 个用户生成随机头像!`);
    console.log('💡 头像类型包括: DiceBear风格、默认字母头像、表情符号头像');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 生成头像失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  generateRandomAvatars();
}

module.exports = { RandomAvatarGenerator, generateRandomAvatars };
