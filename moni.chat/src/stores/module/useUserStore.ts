import { defineStore } from 'pinia'
import type { UserInfo } from '@/types/login'
// import { logout } from '@/api/login'
// import { group } from '@/api/chatList'
import ws from '@/utils/ws'
import { listMap } from '@/api/user'
import type { UserMapResponse, UserMap } from '@/types/user'
import { ElMessage } from 'element-plus'
import router from '@/router'
export const useUserStore = defineStore('user', {
    state: () => ({
        user: null as UserInfo | null,
        token: '',
        chatList: [] as any[],
        userMap: {} as UserMap,
        showUserInfo: false,
    }),
    actions: {
        setUser(user: UserInfo) {
            this.user = user
        },
        setToken(token: string) {
            this.token = token
        },
        async logout() {
            this.user = null
            this.token = ''
            ws.disConnect()
            ElMessage.success('退出成功')
            router.push('/login')
            localStorage.removeItem('user')
            localStorage.removeItem('x-token')
        },
        clearUser() {
            this.user = null
            this.token = ''
        },
        async getUserMap() {
            try {
                const res = await listMap() as UserMapResponse
                console.log('getUserMap API response:', res)
                if (res.code === 200) {
                    this.userMap = res.data;
                    console.log('userMap updated:', this.userMap)
                } else {
                    console.error('getUserMap failed:', res.msg)
                }
            } catch (error) {
                console.error('getUserMap API call failed:', error)
                // 设置一个空的用户映射，避免页面崩溃
                this.userMap = {}
            }
        }
    }
})