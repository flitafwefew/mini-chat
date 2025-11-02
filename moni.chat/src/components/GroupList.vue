<template>
    <div>
        <div class="group-list">
            <!-- 群成员列表 -->
            <div class="group-list-title">
                <svg t="1742184828584" class="icon" viewBox="0 0 1024 1024" version="1.1"
                    xmlns="http://www.w3.org/2000/svg" p-id="5179" width="33" height="33">
                    <path
                        d="M748.07488 534.688c72.64-60.928 144.192-120.992 215.808-180.96 13.056-10.944 29.184-12.8 42.24-5.28 13.44 7.68 21.088 22.304 16.96 37.664-2.112 7.872-7.2 16.32-13.44 21.568a46438.4 46438.4 0 0 1-242.464 203.712c-16.64 13.92-37.6 11.936-51.68-4.64a13666.24 13666.24 0 0 1-100.288-119.552c-14.912-18.016-13.344-38.784 2.976-52.544 15.232-12.864 37.568-9.472 52.256 8l69.632 82.88c2.4 2.848 4.928 5.632 8 9.152zM142.05888 321.792a160.512 160.512 0 1 0 321.024 0 160.512 160.512 0 0 0-321.024 0zM533.80288 862.304c47.296 0 81.792-45.6 68.064-90.88-38.912-128.384-158.208-221.856-299.328-221.856-141.12 0-260.384 93.472-299.296 221.888-13.728 45.248 20.768 90.88 68.064 90.88h462.496v-0.032z"
                        fill="#1296db" p-id="5180"></path>
                </svg>:
                {{ groupMembers.length }}
            </div>
            <div v-if="loading" class="loading-text">加载中...</div>
            <div v-else-if="groupMembers.length === 0" class="no-members">暂无群成员</div>
            <div v-else class="group-list-item" v-for="(member, index) in groupMembers" :key="index">
                <div class="group-list-item-avatar">
                    <img v-if="userStore.userMap[member.id]?.avatar" :src="userStore.userMap[member.id]?.avatar || ''" alt="">
                    <Avatar v-else :name="member.name" :size="31" />
                    <!-- 在线状态小绿原点 -->
                    <div v-if="isMemberOnline(member.id)" class="online-dot"></div>
                </div>
                <div class="group-list-item-name">
                    {{ member.name }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { onlineWeb } from '@/api/user'
import { getGroupMembers } from '@/api/chatList'
import { useUserStore } from '@/stores/module/useUserStore'
import { useMessageStore } from '@/stores/module/useMessageStore'
import Avatar from '@/components/Avatar.vue'
import EventBus from '@/utils/eventBus'

const userStore = useUserStore()
const messageStore = useMessageStore()

// 群成员相关状态
const groupMembers = ref<any[]>([])
const loading = ref(false)
const onlineUserIds = ref<string[]>([])

// 检查群成员是否在线
const isMemberOnline = (memberId: string) => {
    return onlineUserIds.value.includes(memberId)
}

// 获取群成员列表
const fetchGroupMembers = async (groupId: string) => {
    if (!groupId || groupId.startsWith('user-')) {
        groupMembers.value = []
        return
    }
    
    loading.value = true
    try {
        const response = await getGroupMembers(groupId) as any
        if (response.code === 200) {
            groupMembers.value = response.data || []
        } else {
            console.error('获取群成员失败:', response.msg)
            groupMembers.value = []
        }
    } catch (error) {
        console.error('获取群成员失败:', error)
        groupMembers.value = []
    } finally {
        loading.value = false
    }
}

// 更新在线用户状态
const updateOnlineStatus = async () => {
    try {
        const res = await onlineWeb() as any
        if (res.code === 0) {
            onlineUserIds.value = res.data || []
        }
    } catch (error) {
        console.error('获取在线用户列表失败', error)
    }
}

// 处理接收到的 WebSocket 通知
const handleWsNotify = (data: any) => {
    if (data.type === 'notify') {
        const { type, content } = data.content
        const userInfo = JSON.parse(content)
        
        if (type === 'web-online') {
            if (!onlineUserIds.value.includes(userInfo.id)) {
                onlineUserIds.value.push(userInfo.id)
            }
        } else if (type === 'web-offline') {
            const index = onlineUserIds.value.indexOf(userInfo.id)
            if (index > -1) {
                onlineUserIds.value.splice(index, 1)
            }
        }
    }
}

// 监听当前选中的群聊变化
watch(() => messageStore.targetId, (newTargetId) => {
    if (newTargetId && newTargetId.startsWith('group_')) {
        fetchGroupMembers(newTargetId)
    } else {
        groupMembers.value = []
    }
}, { immediate: true })

onMounted(() => {
    EventBus.on('on-receive-msg', handleWsNotify)
    updateOnlineStatus()
})

onUnmounted(() => {
    EventBus.off('on-receive-msg', handleWsNotify)
})
</script>

<style scoped lang="scss">
.group-list {
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;

    @media screen and (max-width: 700px) {
        height: 100%;
        max-height: 600px;
        background: #fff;
        // border:#24E68A 3px solid;
    }

    @media screen and (min-width: 700px) {
        justify-content: center;
    }

    .group-list-title {
        display: flex;
        height: 20px;
        width: 130px;

        align-items: center;
        margin-bottom: 10px;
        border-bottom: #e2e1e1 1px solid;

        @media screen and (max-width: 700px) {
            padding: 15px;
            justify-content: center;
        }

        @media screen and (min-width: 700px) {
            margin-top: 15px;
            margin-left: 15px;
        }
    }

    .group-list-item {
        display: flex;
        width: 100%;
        height: 40px;
        border-radius: 5px;
        transition: all 0.3s ease;
        padding-top: 5px;
        border-bottom: 1px solid #fff;
        padding-left: 10px;
        align-items: center;
        position: relative;

        &:hover {
            background-color: #fff;
            cursor: pointer;
        }

        img {
            width: 30px;
        }

        .online-status {
            color: #24E68A;
            margin-left: 10px;
        }

        .offline-status {
            color: red;
            margin-left: 10px;
        }

        .group-list-item-avatar {
            position: relative;

            .online-dot {
                position: absolute;
                bottom: 0;
                right: 0;
                width: 10px;
                height: 10px;
                background-color: #24E68A;
                border-radius: 50%;
            }
            img {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                object-fit: cover;
            }
        }

        .group-list-item-name {
            margin-left: 10px;
        }
    }

    .loading-text, .no-members {
        text-align: center;
        padding: 20px;
        color: #999;
        font-size: 14px;
    }
}
</style>