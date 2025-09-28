// 检查群聊用户信息的脚本
import axios from 'axios';

// 配置基础URL
const BASE_URL = 'http://localhost:3002';

// 注册用户
async function register() {
    try {
        console.log('正在注册测试用户...');
        const response = await axios.post(`${BASE_URL}/api/v1/user/register`, {
            account: 'testuser',
            name: '测试用户',
            password: '123456',
            email: 'test@example.com',
            phone: '13800138000'
        });
        return response.data;
    } catch (error) {
        console.error('注册失败:', error.response?.data?.msg || error.message);
        return null;
    }
}

// 登录获取token
async function login() {
    try {
        // 先尝试注册用户
        const registerResponse = await register();
        if (registerResponse && registerResponse.code === 0) {
            console.log('✅ 用户注册成功！');
        } else if (registerResponse && registerResponse.code !== 0) {
            console.log('用户可能已存在，继续尝试登录...');
        }
        
        // 尝试登录
        const accounts = [
            { account: 'testuser', password: '123456' },
            { account: 'admin', password: '123456' },
            { account: 'test', password: '123456' },
            { account: 'user', password: '123456' }
        ];
        
        for (const creds of accounts) {
            try {
                console.log(`尝试登录: ${creds.account}`);
                const response = await axios.post(`${BASE_URL}/api/v1/user/login`, creds);
                if (response.data && response.data.code === 0) {
                    console.log(`登录成功: ${creds.account}`);
                    return response.data;
                }
            } catch (err) {
                console.log(`登录失败: ${creds.account} - ${err.response?.data?.msg || err.message}`);
            }
        }
        
        console.log('所有登录尝试都失败了');
        return null;
    } catch (error) {
        console.error('登录失败:', error.message);
        return null;
    }
}

// 获取用户列表
async function getUserList(token) {
    try {
        const response = await axios.get(`${BASE_URL}/api/v1/user/list/map`, {
            headers: {
                'x-token': token
            }
        });
        return response.data;
    } catch (error) {
        console.error('获取用户列表失败:', error.message);
        return null;
    }
}

// 获取在线用户列表
async function getOnlineUsers(token) {
    try {
        const response = await axios.get(`${BASE_URL}/api/v1/user/online/web`, {
            headers: {
                'x-token': token
            }
        });
        return response.data;
    } catch (error) {
        console.error('获取在线用户列表失败:', error.message);
        return null;
    }
}

// 获取群聊列表
async function getGroupChats(token) {
    try {
        const response = await axios.get(`${BASE_URL}/api/v1/chat-list/group`, {
            headers: {
                'x-token': token
            }
        });
        return response.data;
    } catch (error) {
        console.error('获取群聊列表失败:', error.message);
        return null;
    }
}

// 主函数
async function main() {
    console.log('🔍 正在检查群聊用户信息...\n');
    
    // 先登录获取token
    console.log('🔐 正在登录...');
    const loginResponse = await login();
    if (!loginResponse || loginResponse.code !== 0) {
        console.log('❌ 登录失败，无法获取用户信息');
        return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ 登录成功！\n');
    
    // 获取用户列表
    const userMapResponse = await getUserList(token);
    if (!userMapResponse || userMapResponse.code !== 0) {
        console.log('❌ 无法获取用户列表');
        return;
    }
    
    const userMap = userMapResponse.data;
    const users = Object.values(userMap);
    
    console.log(`📊 总用户数: ${users.length}`);
    console.log('👥 用户列表:');
    users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.name} (ID: ${user.id})`);
        if (user.avatar) {
            console.log(`     头像: ${user.avatar}`);
        }
        if (user.badge && user.badge.length > 0) {
            console.log(`     徽章: ${user.badge.join(', ')}`);
        }
        console.log(`     类型: ${user.type}`);
    });
    
    // 获取在线用户
    const onlineResponse = await getOnlineUsers(token);
    if (onlineResponse && onlineResponse.code === 0) {
        const onlineUserIds = onlineResponse.data;
        const onlineUsers = users.filter(user => onlineUserIds.includes(user.id));
        
        console.log(`\n🟢 在线用户数: ${onlineUsers.length}`);
        console.log('在线用户:');
        onlineUsers.forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.name} (ID: ${user.id})`);
        });
    }
    
    // 获取群聊列表
    const groupResponse = await getGroupChats(token);
    if (groupResponse && groupResponse.code === 0) {
        const groupChats = Array.isArray(groupResponse.data) ? groupResponse.data : [groupResponse.data];
        
        console.log(`\n💬 群聊数量: ${groupChats.length}`);
        groupChats.forEach((chat, index) => {
            console.log(`  ${index + 1}. ${chat.targetInfo.name} (ID: ${chat.targetId})`);
            console.log(`     类型: ${chat.type}`);
            console.log(`     未读消息: ${chat.unreadCount}`);
            if (chat.lastMessage) {
                console.log(`     最后消息: ${chat.lastMessage.message || '[emoji]'}`);
            }
        });
    }
    
    console.log('\n✅ 检查完成！');
}

// 运行脚本
main().catch(console.error);
