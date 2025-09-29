<template>
    <div class="login-page">
        <div class="shell">
            <div class="container a-container" :class="{ 'is-txl': !isLogin }">
                <form class="form" id="a-form">
                    <h2 class="form_title title">创建账号</h2>
                    <input type="text" class="form_input" v-model="registerForm.userName" placeholder="Name">
                    <input type="text" class="form_input" v-model="registerForm.email" placeholder="Email">
                    <div class="verify-code">
                        <input type="text" class="form_input" v-model="registerForm.emailCode" placeholder="验证码">
                        <button type="button" class="form_button button send-code-btn" :disabled="countdown > 0"
                            @click="sendVerifyCode">
                            {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
                        </button>
                    </div>
                    <input type="password" class="form_input" v-model="registerForm.password" placeholder="Password">
                    <input type="password" class="form_input" v-model="registerForm.confirmPassword"
                        placeholder="Confirm Password">
                    <input type="text" class="form_input" v-model="registerForm.phone" placeholder="Phone (Optional)">
                    <button class="form_button button submit">SIGN UP</button>
                </form>
            </div>

            <div class="container b-container" :class="{ 'is-txl': isLogin, 'is-z': isLogin }">
                <form class="form" id="b-form">
                    <h2 class="form_title title">登入账号</h2>
                    <input type="text" class="form_input" v-model="loginForm.userName" placeholder="Username">
                    <input type="text" class="form_input" v-model="loginForm.password" placeholder="Password">
                    <a class="form_link">忘记密码？</a>
                    <button class="form_button button submit">SIGN IN</button>
                </form>
            </div>

            <div class="switch" :class="{ 'is-txr': isLogin, 'is-gx': isAnimating }" id="switch-cnt">
                <div class="switch_circle" :class="{ 'is-txr': isLogin }"></div>
                <div class="switch_circle switch_circle-t" :class="{ 'is-txr': isLogin }"></div>
                <div class="switch_container" :class="{ 'is-hidden': isLogin }" id="switch-c1">
                    <h2 class="switch_title title" style="letter-spacing: 0;">Welcome Back！</h2>
                    <p class="switch_description description">已经有账号了嘛，去登入账号来进入奇妙世界吧！！！</p>
                    <button class="switch_button button switch-btn">SIGN IN</button>
                </div>

                <div class="switch_container" :class="{ 'is-hidden': !isLogin }" id="switch-c2">
                    <h2 class="switch_title title" style="letter-spacing: 0;">Hello Friend！</h2>
                    <p class="switch_description description">去注册一个账号，成为尊贵的粉丝会员，让我们踏入奇妙的旅途！</p>
                    <button class="switch_button button switch-btn">SIGN UP</button>
                </div>
            </div>
        </div>
    </div>
    <div class="MobileLoginPage">
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
                    <span @click="handleLogin" class="btn">
                        <span>Login</span>
                    </span>
                </form>
            </div>
            <div class="box " style="height: 500px;" v-if="!isLogin">
                <form autocomplete="off">
                    <h2>Register</h2>
                    <div class="inputBox">
                        <input type="text" v-model="registerForm.userName" required>
                        <span>UserName</span>
                        <i></i>
                    </div>
                    <div class="inputBox">
                        <input type="email" v-model="registerForm.email" required>
                        <span>Email</span>
                        <i></i>
                    </div>
                    <div class="inputBox">
                        <input type="password" v-model="registerForm.password" required>
                        <span>Password</span>
                        <i></i>
                    </div>
                    <div class="inputBox">
                        <input type="text" v-model="registerForm.phone">
                        <span>Phone (Optional)</span>
                        <i></i>
                    </div>
                    <div class="links">
                        <a href="#"></a>
                        <a href="#" @click="handleSwitch">{{ isLogin ? 'Register' : 'Login' }}</a>
                    </div>
                    <span @click="handleRegister" class="btn">
                        <span>Register</span>
                    </span>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { login, register } from '@/api/login'
import { ElMessage } from 'element-plus'
import type { LoginResponse, RegisterResponse } from '@/types/login'
import { useUserStore } from '@/stores/module/useUserStore'
// import MobileLogin from '@/components/MobileLogin.vue'
const router = useRouter()
const isLogin = ref(true)
const isAnimating = ref(false)
const countdown = ref(0)

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
    confirmPassword: '',
    phone: ''
})

// 存储事件监听器引用，用于清理
const eventListeners: Array<{ element: Element; event: string; handler: EventListener }> = []

// 存储定时器引用，用于清理
const timers: Array<number> = []

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
    console.log('🚀 handleLogin函数被调用')
    console.log('📱 当前设备类型:', window.innerWidth <= 700 ? '移动端' : '桌面端')
    console.log('📝 登录表单数据:', loginForm.value)
    
    if (!loginForm.value.userName || !loginForm.value.password) {
        console.log('❌ 用户名或密码为空')
        ElMessage.error('请输入用户名和密码')
        return
    }

    console.log('🔐 开始登录:', { account: loginForm.value.userName })

    try {
        // 检测移动端环境
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        console.log('📱 移动端检测结果:', isMobile);
        
        let res: LoginResponse;
        
        if (isMobile) {
            // 移动端直接使用fetch API，和调试页面完全相同的逻辑
            console.log('📱 使用移动端直接连接方式');
            console.log('📡 请求URL: http://10.33.9.159:3002/api/v1/user/login');
            console.log('📡 请求数据:', { account: loginForm.value.userName, password: loginForm.value.password });
            
            const response = await fetch('http://10.33.9.159:3002/api/v1/user/login', {
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
        
        console.log('📝 登录响应:', res)
        console.log('📝 响应类型:', typeof res)
        console.log('📝 响应结构:', JSON.stringify(res, null, 2))
        
        // 检查响应是否有效
        if (!res) {
            console.error('❌ 登录响应为空')
            ElMessage.error('登录失败，服务器无响应')
            return
        }
        
        // 检查响应格式
        if (typeof res.code === 'undefined') {
            console.error('❌ 登录响应格式错误，缺少code字段:', res)
            ElMessage.error('登录失败，响应格式错误')
            return
        }
        
        if (res.code === 200) {
            // 检查必要的数据字段
            if (!res.data || !res.data.token || !res.data.user) {
                console.error('❌ 登录成功但数据不完整:', res.data)
                ElMessage.error('登录失败，用户数据不完整')
                return
            }
            
            // 存储token和用户信息
            localStorage.setItem('x-token', res.data.token)
            localStorage.setItem('user', JSON.stringify(res.data.user))
            
            const userStore = useUserStore()
            userStore.setToken(res.data.token)
            userStore.setUser(res.data.user)
            
            console.log('✅ 用户信息已存储:', res.data.user)
            console.log('✅ Token已存储:', res.data.token.substring(0, 20) + '...')
            
            // 获取用户映射，确保头像数据可用（失败不影响登录）
            try {
                await userStore.getUserMap()
                console.log('✅ 用户映射获取成功')
            } catch (error) {
                console.warn('获取用户映射失败，但不影响登录:', error)
            }
            
            ElMessage.success('登录成功')
            console.log('🚀 准备跳转到聊天页面')
            
            // 直接跳转，不使用Vue Router
            console.log('🔄 直接跳转到主应用...');
            window.location.href = '/';
        } else {
            console.error('❌ 登录失败:', res.msg, '状态码:', res.code)
            ElMessage.error(res.msg || '登录失败')
        }
    } catch (error: any) {
        console.error('❌ 登录异常:', error)
        console.error('❌ 错误类型:', typeof error)
        console.error('❌ 错误详情:', JSON.stringify(error, null, 2))
        
        // 处理不同类型的错误
        if (error && typeof error === 'object' && error.code && error.msg) {
            // 这是后端返回的标准错误格式
            console.error('❌ 后端错误:', error.msg)
            ElMessage.error(error.msg || '登录失败')
        } else if (error && typeof error === 'string') {
            // 这是网络错误或其他字符串错误
            console.error('❌ 网络错误:', error)
            ElMessage.error(error || '登录失败，请检查网络连接')
        } else {
            // 其他未知错误
            console.error('❌ 未知错误:', error)
            ElMessage.error('登录失败，请稍后重试')
        }
    }
}

// 处理注册
const handleRegister = async () => {
    // 表单验证
    if (!registerForm.value.userName || !registerForm.value.email ||
        !registerForm.value.password || !registerForm.value.confirmPassword) {
        ElMessage.error('请填写所有必填项')
        return
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(registerForm.value.email)) {
        ElMessage.error('请输入正确的邮箱格式')
        return
    }

    // 验证密码
    if (registerForm.value.password !== registerForm.value.confirmPassword) {
        ElMessage.error('两次输入的密码不一致')
        return
    }

    try {
        const res = await register({
            account: registerForm.value.userName,
            name: registerForm.value.userName,
            email: registerForm.value.email,
            password: registerForm.value.password,
            phone: registerForm.value.phone || ''
        }) as RegisterResponse

        if (res.code === 200) {
            ElMessage.success('注册成功')
            // 清空表单
            registerForm.value = {
                userName: '',
                email: '',
                emailCode: '',
                password: '',
                confirmPassword: '',
                phone: ''
            }
            // 切换到登录页面
            isLogin.value = true
        } else {
            ElMessage.error(res.msg || '注册失败')
        }
    } catch (error: any) {
        ElMessage.error(error.message || '注册失败，请稍后重试')
    }
}

// 发送验证码 (暂时禁用，因为后端没有对应API)
const sendVerifyCode = async () => {
    ElMessage.warning('验证码功能暂时不可用，请直接注册')
    return
    
    // 以下代码暂时注释，等后端实现验证码API后再启用
    /*
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
        const res = await getCode({ email: registerForm.value.email }) as CodeResponese
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
    */
}

onMounted(() => {
    // 添加按钮点击事件 - 桌面端
    const allButtons = document.querySelectorAll('.submit')
    allButtons.forEach(button => {
        const handler = (e: Event) => {
            e.preventDefault()
            if (isLogin.value) {
                handleLogin()
            } else {
                handleRegister()
            }
        }
        button.addEventListener('click', handler)
        eventListeners.push({ element: button, event: 'click', handler })
    })

    // 手机端按钮已经在模板中绑定了@click事件，不需要重复绑定
    // 注释掉重复的事件绑定，避免冲突
    /*
    const mobileButtons = document.querySelectorAll('.btn')
    mobileButtons.forEach(button => {
        const handler = (e: Event) => {
            e.preventDefault()
            if (isLogin.value) {
                handleLogin()
            } else {
                handleRegister()
            }
        }
        button.addEventListener('click', handler)
        eventListeners.push({ element: button, event: 'click', handler })
    })
    */

    const switchBtn = document.querySelectorAll('.switch-btn')
    switchBtn.forEach(button => {
        button.addEventListener('click', handleSwitch)
        eventListeners.push({ element: button, event: 'click', handler: handleSwitch })
    })
})

// 清理事件监听器和定时器
onUnmounted(() => {
    // 清理事件监听器
    eventListeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler)
    })
    eventListeners.length = 0
    
    // 清理所有定时器
    timers.forEach(timer => {
        clearTimeout(timer)
        clearInterval(timer)
    })
    timers.length = 0
})
</script>

<style scoped lang="scss">
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    user-select: none;
}

.login-page {
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    // background-image: linear-gradient(90deg, #e0c3fc, #8ec5fc 100%);
    background-size: cover;
    background-position: center;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-repeat: no-repeat;

    .MobileLogin {
        display: none;
    }

    @media screen and (max-width: 700px) {
        .MobileLogin {
            display: flex;

        }
    }

    @media screen and (min-width: 700px) {
        // position: absolute;
        // top: 0%;
        // left: 0%;

    }
}

body {
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 12px;
    background-color: #ecf0f3;
    color: #a0a5a8;
}

.shell {
    // position: relative;
    width: 1000px;
    min-width: 1000px;
    min-height: 600px;
    height: 600px;
    padding: 25px;
    background-color: #ecf0f3;
    box-shadow: 10px 10px 10px #d1d9e6, -10px -10px 10px #f9f9f9;
    border-radius: 12px;
    overflow: hidden;
    margin: 0 auto;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

}

@media (max-width: 1200px) {

    .shell {
        transform: scale(0.7);
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
}

@media (max-width: 1000px) {
    .shell {
        position: absolute;
        top: 0%;
        left: 0%;
        transform: translate(-50%, -50%);
        transform: scale(0.6);
    }
}

@media (max-width: 800px) {
    .shell {
        position: absolute;
        top: 0%;
        left: 0%;
        transform: translate(-50%, -50%);
        transform: scale(0.5);
    }
}

@media (max-width: 700px) {
    .shell {
        display: none;
    }

}

.container {
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    top: 0;
    width: 600px;
    height: 100%;
    padding: 25px;
    background-color: #ecf0f3;
    transition: 1.25s;
}

.form {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    width: 100%;
    height: 100%;
    padding: 20px 0;
}

.form_title {
    margin-bottom: 20px;
}

.form_span {
    margin-top: 30px;
    margin-bottom: 12px;
    color: #666666;
}

.iconfont {
    margin: 0 5px;
    border: rgba(0, 0, 0, 0.5) 2px solid;
    border-radius: 50%;
    font-size: 25px;
    padding: 3px;
    opacity: 0.5;
    transition: 0.1s;
}

.iconfont:hover {
    opacity: 1;
    transition: 0.15s;
    cursor: pointer;
}

.form_input {
    width: 350px;
    height: 40px;
    margin: 4px 0;
    padding-left: 25px;
    font-size: 13px;
    letter-spacing: 0.15px;
    border: none;
    outline: none;
    background-color: #ecf0f3;
    transition: 0.25s ease;
    border-radius: 8px;
    box-shadow: inset 2px 2px 4px #d1d9e6, inset -2px -2px 4px #f9f9f9;
    color: #666666;
}

.form_input:focus {
    box-shadow: inset 4px 4px 4px #d1d9e6, inset -4px -4px 4px #f9f9f9;
}

.form_link {
    color: #666666;
    font-size: 15px;
    margin-top: 25px;
    border-bottom: 1px solid #a0a5a8;
    line-height: 2;
}

.title {
    font-size: 34px;
    font-weight: 700;
    line-height: 3;
    color: #666666;
    letter-spacing: 10px;
}

.description {
    color: #666666;
    font-size: 14px;
    letter-spacing: 0.25px;
    text-align: center;
    line-height: 1.6;
}

.button {
    width: 180px;
    height: 50px;
    border-radius: 25px;
    margin-top: 50px;
    font-weight: 700;
    font-size: 14px;
    letter-spacing: 1.15px;
    background-color: #4B70E2;
    color: #f9f9f9;
    box-shadow: 8px 8px 16px #d1d9e6, -8px -8px 16px #f9f9f9;
    border: none;
    outline: none;
    cursor: pointer;
}

.a-container {
    z-index: 100;
    margin-left: 400px;
    right: 0;
    left: auto;
}

.b-container {
    left: 0;
    z-index: 0;
}

.switch {
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 400px;
    padding: 50px;
    z-index: 200;
    transition: 1.25s;
    background-color: #ecf0f3;
    overflow: hidden;
    box-shadow: 4px 4px 10px #d1d9e6, -4px -4px 10px #d1d9e6;
}

.switch_circle {
    position: absolute;
    width: 500px;
    height: 500px;
    border-radius: 50%;
    background-color: #ecf0f3;
    box-shadow: inset 8px 8px 12px #b8bec7, inset -8px -8px 12px #fff;
    bottom: -60%;
    left: -60%;
    transition: 1.25s;
}

.switch_circle-t {
    top: -30%;
    left: 60%;
    width: 300px;
    height: 300px;
}

.switch_container {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    position: absolute;
    width: 400px;
    padding: 50px 55px;
    transition: 1.25s;
}

.switch_button {
    cursor: pointer;
}

.switch_button:hover,
.submit:hover {
    box-shadow: 6px 6px 10px #d1d9e6, -6px -6px 10px #f9f9f9;
    transform: scale(0.985);
    transition: 0.25s;
}

.switch_button:active,
.switch_button:focus {
    box-shadow: 2px 2px 6px #d1d9e6, -2px -2px 6px #f9f9f9;
    transform: scale(0.97);
    transition: 0.25s;
}

.is-txr {
    left: calc(100% - 400px);
    transition: 1.25s;
    transform-origin: left;
}

.is-txl {
    left: 0;
    transition: 1.25s;
    transform-origin: right;
}

.is-z {
    z-index: 200;
    transition: 1.25s;
}

.is-hidden {
    visibility: hidden;
    opacity: 0;
    position: absolute;
    transition: 1.25s;
}

.is-gx {
    animation: is-gx 1.25s;
}

@keyframes is-gx {

    0%,
    10%,
    100% {
        width: 400px;
    }

    30%,
    50% {
        width: 500px;
    }
}

.verify-code {
    display: flex;
    gap: 10px;
    width: 350px;
    margin: 4px 0;
}

.verify-code .form_input {
    flex: 1;
    margin: 0;
}

.send-code-btn {
    width: 120px;
    height: 40px;
    margin: 0;
    font-size: 12px;
    padding: 0;
}

.send-code-btn:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');

.MobileLoginPage {
    display: flex;

    @media screen and (min-width: 700px) {
        display: none;
    }
    
    /* 确保在移动端正确显示 */
    @media screen and (max-width: 700px) {
        display: flex !important;
    }

    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-family: 'Poppins', sans-serif;

    .box {
        position: relative;
        width: 380px;
        height: 420px;
        background: #e9e9e9;
        border-radius: 8px;
        overflow: hidden;

        .submit {
            display: flex;
            justify-content: center;
        }

        .btn {
            position: absolute;
            height: 50px;
            width: 80px;
            display: flex;
            background: #0090F0;
            border: #ffffff 1px solid;
            border-radius: 10px;
            justify-content: center;
            align-items: center;
            text-align: center;
            bottom: 0%;
            z-index: 20;
            left: 50%;
            transform: translate(-50%, -50%);
            cursor: pointer;
            
            &:hover {
                background: #007acc;
            }
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

        .getCode {
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