<template>
    <div class="MobileLoginPage">
        <div class="box" v-if="isLogin">
            <form>
                <h2>Sign in</h2>
                <div class="inputBox">
                    <input type="text" v-model="loginForm.userName" required>
                    <span>UserName</span>
                    <i></i>
                </div>
                <div class="inputBox">
                    <input type="text" v-model="loginForm.password" required>
                    <span>Password</span>
                    <i></i>
                </div>
                <div class="links">
                    <a href="#">Forgot Password ?</a>
                    <a href="#" @click="handleSwitch">{{ isLogin ? 'Register' : 'Login' }}</a>
                </div>
                <input type="submit" @click="handleLogin" value="Login">
            </form>
        </div>
        <div class="box " style="height: 500px;" v-if="!isLogin">
            <form autocomplete="off">
                <h2>Register</h2>
                <div class="inputBox">
                    <input type="text" v-model="registerForm.email" required>
                    <span>UserName</span>
                    <i></i>
                </div>
                <div class="inputBox">
                    <input type="text" v-model="registerForm.userName" required>
                    <span>Password</span>
                    <i></i>
                </div>
                <div class="inputBox">
                    <input type="text" v-model="registerForm.password" required>
                    <span>code</span> 
                    <button type="button" class="getCode" :disabled="countdown > 0"
                            @click="sendVerifyCode">
                            {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
                        </button>
                    <i></i>
                </div>
                <div class="links">
                    <a href="#"></a>
                    <a href="#" @click="handleSwitch">{{ isLogin ? 'Register' : 'Login' }}</a>
                </div>
                <input type="submit" width="" class="submit" @click="handleLogin" value="Register">
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { login, getCode } from '@/api/login'
import { ElMessage } from 'element-plus'
import type { LoginResponse, CodeResponse } from '@/types/login'
import { useUserStore } from '@/stores/module/useUserStore'
const router = useRouter()
const isLogin = ref(true)
const isAnimating = ref(false)
const countdown = ref(0)

// 存储定时器引用，用于清理
const timers: Array<number> = []

// 表单数据
const loginForm = ref({
    userName: '',
    password: ''
})

const registerForm = ref({
    userName: '',
    email: '',
    emailCode: '',
    password: '',
    confirmPassword: ''
})

// 切换登录/注册
const handleSwitch = () => {
    isAnimating.value = true
    const timer = setTimeout(() => {
        isAnimating.value = false
    }, 1500)
    timers.push(timer)
    isLogin.value = !isLogin.value
}

// 处理登录
const handleLogin = async () => {
    if (!loginForm.value.userName || !loginForm.value.password) {
        ElMessage.error('请输入用户名和密码')
        return
    }

    try {
        console.log('🔐 开始登录，用户名:', loginForm.value.userName);
        
        // 检测移动端环境
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        console.log('📱 移动端检测结果:', isMobile);
        
        let res: LoginResponse;
        
        if (isMobile) {
            // 移动端直接使用fetch API，和调试页面完全相同的逻辑
            console.log('📱 使用移动端直接连接方式');
            console.log('📡 请求URL: http://10.34.39.65:3002/api/v1/user/login');
            console.log('📡 请求数据:', { account: loginForm.value.userName, password: loginForm.value.password });

            const response = await fetch('http://10.34.39.65:3002/api/v1/user/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    account: loginForm.value.userName,
                    password: loginForm.value.password
                })
            });
            
            console.log('📡 响应状态:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ 响应错误:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
            }
            
            res = await response.json();
            console.log('📡 响应数据:', res);
        } else {
            // 桌面端使用原有的Http类
            console.log('🖥️ 使用桌面端Http类');
            res = await login({
                account: loginForm.value.userName,
                password: loginForm.value.password
            }) as LoginResponse;
        }
        
        console.log('📥 登录响应:', res);
        if (res.code === 200) {
            // 存储token和用户信息（和调试页面完全相同）
            localStorage.setItem('x-token', res.data.token)
            localStorage.setItem('user', JSON.stringify(res.data.user))
            console.log('✅ Token和用户信息已存储');
            
            // 更新store状态
            const userStore = useUserStore()
            userStore.setToken(res.data.token)
            userStore.setUser(res.data.user)
            console.log('✅ Store状态已更新');
            
            ElMessage.success('登录成功')
            console.log('🚀 准备跳转到聊天页面')
            
            // 检查localStorage中的数据
            const storedToken = localStorage.getItem('x-token');
            const storedUser = localStorage.getItem('user');
            console.log('🔍 存储验证 - Token:', !!storedToken, 'User:', !!storedUser);
            
            // 直接跳转，不使用Vue Router
            console.log('🔄 直接跳转到主应用...');
            window.location.href = '/';
            
        } else {
            console.error('❌ 登录失败，响应码:', res.code, '错误信息:', res.msg);
            ElMessage.error(res.msg || '登录失败')
        }
    } catch (error: any) {
        console.error('❌ 登录失败:', error);
        
        // 简化错误处理
        let errorMessage = '登录失败，请稍后重试';
        
        if (error && typeof error === 'object') {
            if (error.code && error.msg) {
                errorMessage = error.msg;
            } else if (error.message) {
                errorMessage = error.message;
            }
        } else if (typeof error === 'string') {
            errorMessage = error;
        }
        
        ElMessage.error(errorMessage);
    }
}

// 处理注册功能已移除

// 发送验证码
const sendVerifyCode = async () => {
    if (!registerForm.value.email) {
        ElMessage.error('请输入邮箱')
        return
    }
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(registerForm.value.email)) {
        ElMessage.error('请输入正确的邮箱格式')
        return
    }

    try {
        const res = await getCode({ email: registerForm.value.email }) as CodeResponse
        if (res.code === 0) {
            ElMessage.success('验证码已发送')
            // 开始倒计时
            countdown.value = 60
            const timer = setInterval(() => {
                countdown.value--
                if (countdown.value <= 0) {
                    clearInterval(timer)
                    // 从数组中移除已完成的定时器
                    const index = timers.indexOf(timer)
                    if (index > -1) {
                        timers.splice(index, 1)
                    }
                }
            }, 1000)
            timers.push(timer)
        } else {
            ElMessage.error(res.msg || '发送验证码失败')
        }
    } catch (error: any) {
        ElMessage.error(error.message || '发送验证码失败，请重试')
    }
}

// 清理定时器
onUnmounted(() => {
    timers.forEach(timer => {
        clearTimeout(timer)
        clearInterval(timer)
    })
    timers.length = 0
})
</script>

<style scoped lang="scss">
.MobileLoginPage {
    display: flex;

    @media screen and (min-width: 700px) {
        display: none;
    }
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');

    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: 'Poppins', sans-serif;
    }

    body {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        flex-direction: column;
        background: #fefeff;
    }

    .box {
        position: relative;
        width: 380px;
        height: 420px;
        background: #e9e9e9;
        border-radius: 8px;
        overflow: hidden;
        .submit{
            display: flex;
            justify-content: center;
            
        }
    }

    .box::before {
        content: '';
        z-index: 1;
        position: absolute;
        top: -50%;
        left: -50%;
        width: 380px;
        height: 420px;
        transform-origin: bottom right;
        background: linear-gradient(0deg, transparent, #45f3ff, #45f3ff);
        animation: animate 6s linear infinite;
    }

    .box::after {
        content: '';
        z-index: 1;
        position: absolute;
        top: -50%;
        left: -50%;
        width: 380px;
        height: 420px;
        transform-origin: bottom right;
        background: linear-gradient(0deg, transparent, #45f3ff, #45f3ff);
        animation: animate 6s linear infinite;
        animation-delay: -3s;
    }

    @keyframes animate {
        0% {
            transform: rotate(0deg);
        }

        100% {
            transform: rotate(360deg);
        }
    }

    form {
        position: absolute;
        inset: 2px;
        background: #ECF0F3;
        color: #ffffff;
        //阴影
        box-shadow: 2px 10px 5px rgba(255, 255, 255, 0.2); // 添加阴影效果
        padding: 50px 40px;
        border-radius: 8px;
        z-index: 2;
        display: flex;
        flex-direction: column;
    }

    h2 {
        color: #0090F0;
        font-weight: 500;
        text-align: center;
        letter-spacing: 0.1em;
    }

    .inputBox {
        position: relative;
        width: 300px;
        margin-top: 35px;
        .getCode{
            position: absolute;
            color: #ffffff;
            left: 0;
            top: 55px;
            background: #0090F0;
            z-index: 1000;
            border-radius: 10px;
            height: 30px;   
            width: 100px;
        }
    }

    .inputBox input {
        position: relative;
        width: 100%;
        padding: 20px 10px 10px;
        background: transparent;
        outline: none;
        box-shadow: none;
        border: none;
        color: #f1efef;
        font-size: 1em;
        letter-spacing: 0.05em;
        transition: 0.5s;
        z-index: 10;
    }

    .inputBox span {
        position: absolute;
        left: 0;
        padding: 20px 0px 10px;
        pointer-events: none;
        font-size: 1em;
        color: #8f8f8f;
        letter-spacing: 0.05em;
        transition: 0.5s;
    }

    .inputBox input:valid~span,
    .inputBox input:focus~span {
        color: #0090F0;
        transform: translateX(0px) translateY(-34px);
        font-size: 0.75em;
    }

    .inputBox i {
        position: absolute;
        left: 0;
        bottom: 0;
        width: 100%;
        height: 2px;
        background: #0090F0;
        border-radius: 4px;
        overflow: hidden;
        transition: 0.5s;
        pointer-events: none;
        z-index: 9;
    }

    .inputBox input:valid~i,
    .inputBox input:focus~i {
        height: 44px;
    }

    .links {
        display: flex;
        justify-content: space-between;
    }

    .links a {
        margin: 10px 0;
        font-size: 0.75em;
        color: #8f8f8f;
        text-decoration: beige;
    }

    .links a:hover,
    .links a:nth-child(2) {
        color: #0090F0;
    }

    input[type="submit"] {
        border: none;
        outline: none;
        padding: 11px 25px;
        background: #0090F0;
        cursor: pointer;
        border-radius: 4px;
        font-weight: 600;
        width: 100px;
        margin-top: 10px;
        margin-left: 100px;
    }

    input[type="submit"]:active {
        opacity: 0.8;
    }
}
</style>