import { createRouter, createWebHistory } from 'vue-router'
import ws from '@/utils/ws.ts'
import Chat from '@/view/ChatPage.vue'
import Login from '@/view/LoginPage.vue'
import { useUserStore } from '@/stores/module/useUserStore.ts'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/',
      name: 'chat',
      component: Chat,
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  let token = window.localStorage.getItem('x-token')
  let user = window.localStorage.getItem('user')
  const userStore = useUserStore()
  
  console.log('🔍 路由守卫检查:', { 
    to: to.path, 
    from: from.path,
    token: !!token, 
    user: !!user,
    matched: to.matched.length
  })
  
  if (token) {
    try {
      ws.connect(token)
      userStore.setToken(token)
      if (user) {
        try {
          userStore.setUser(JSON.parse(user))
        } catch (error) {
          console.error('解析用户信息失败:', error)
          // 清除无效的用户信息
          localStorage.removeItem('user')
          localStorage.removeItem('x-token')
          next({ path: '/login' })
          return
        }
      }
      
      // 如果用户已登录且前往聊天页面，确保用户映射已加载
      if (to.path === '/' && Object.keys(userStore.userMap).length === 0) {
        try {
          await userStore.getUserMap()
        } catch (error) {
          console.error('获取用户映射失败:', error)
          // 即使获取用户映射失败，也允许进入主页面
          // 用户映射会在组件中重试
        }
      }
    } catch (error) {
      console.error('路由守卫处理token时出错:', error)
    }
  }
  
  // 没有token且不是登录页面，重定向到登录页
  if (!token && to.path !== '/login') {
    console.log('🚫 无token，重定向到登录页')
    next({ path: '/login' })
    return
  }
  
  // 有token且在登录页面，重定向到主页
  if (token && to.path === '/login') {
    console.log('✅ 已登录，重定向到主页')
    next({ path: '/' })
    return
  }
  
  // 没有匹配的路由，重定向到主页
  if (!to.matched.length) {
    console.log('🔄 无匹配路由，重定向到主页')
    next({ path: '/' })
    return
  }
  
  console.log('✅ 路由守卫通过，继续导航')
  next()
})

export default router