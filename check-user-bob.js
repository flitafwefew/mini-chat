const { User } = require('./models');

async function checkUserBob() {
    try {
        console.log('正在检查用户 bob...');
        
        const user = await User.findOne({
            where: { username: 'bob' }
        });
        
        if (user) {
            console.log('找到用户 bob:');
            console.log('ID:', user.id);
            console.log('用户名:', user.username);
            console.log('邮箱:', user.email);
            console.log('创建时间:', user.createdAt);
            console.log('更新时间:', user.updatedAt);
        } else {
            console.log('用户 bob 不存在');
            
            // 检查所有用户
            const allUsers = await User.findAll({
                attributes: ['id', 'username', 'email']
            });
            
            console.log('\n数据库中的所有用户:');
            if (allUsers.length === 0) {
                console.log('数据库中没有用户');
            } else {
                allUsers.forEach(user => {
                    console.log(`- ID: ${user.id}, 用户名: ${user.username}, 邮箱: ${user.email}`);
                });
            }
        }
        
        process.exit(0);
    } catch (error) {
        console.error('检查用户时出错:', error);
        process.exit(1);
    }
}

checkUserBob();
