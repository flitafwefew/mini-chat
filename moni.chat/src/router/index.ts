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

router.beforeEach(async (to, _from, next) => {
  let token = window.localStorage.getItem('x-token')
  let user = window.localStorage.getItem('user')
  const userStore = useUserStore()
  
  if (token) {
    ws.connect(token)
    userStore.setToken(token)
    userStore.setUser(JSON.parse(user as string))
    
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
  }
  if (!token && to.path !== '/login') {
    next({ path: '/login' })
    return
  }
  if ((token && to.path === '/login') || !to.matched.length) {
    next({ path: '/' })
    return
  }
  
  next()
})

export default router