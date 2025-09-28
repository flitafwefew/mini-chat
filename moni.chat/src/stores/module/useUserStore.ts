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
        async getUserMap(forceRefresh = false) {
            console.log('🔄 getUserMap 开始执行, forceRefresh:', forceRefresh)
            
            try {
                // 如果强制刷新，先清空现有数据
                if (forceRefresh) {
                    this.userMap = {}
                    console.log('🧹 强制刷新用户映射，清空现有数据')
                }
                
                console.log('📡 开始调用 getUserMap API...')
                const res = await listMap() as UserMapResponse
                console.log('📥 getUserMap API response:', res)
                
                if (res && res.code === 200) {
                    this.userMap = res.data;
                    console.log('✅ userMap updated, 用户数量:', Object.keys(this.userMap).length)
                    
                    // 检查头像数据
                    const avatarCount = Object.values(this.userMap).filter(user => 
                        user.avatar && user.avatar.includes('dicebear.com')
                    ).length
                    console.log(`🎭 包含卡通头像的用户: ${avatarCount}/${Object.keys(this.userMap).length}`)
                } else {
                    console.error('❌ getUserMap failed:', res?.msg || 'Unknown error')
                }
            } catch (error) {
                console.error('💥 getUserMap API call failed:', error)
                this.userMap = {}
            }
        }
    }
})