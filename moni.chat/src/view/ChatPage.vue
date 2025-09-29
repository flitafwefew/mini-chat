<template>
    <div @click="handleOutsideClick">
        <div class="header">
            <div class="header-left">
                <div class="header-left-title">
                    <p>消息列表</p>
                </div>
            </div>
            <div class="header-center">
                <div class="header-center-avatar" @click="toggleChatList($event)">
                    <img v-if="userStore.user?.avatar" :src="userStore.user?.avatar" class="avatar" alt="">
                    <Avatar v-else :name="userStore.user?.name || ''" :size="40" />
                </div>
                <div class="header-center-title">
                    <ChatName />
                </div>
                <div class="online-people" @click="toggleGroupList($event)">
                    <svg t="1742050496528" class="icon" viewBox="0 0 1024 1024" version="1.1"
                        xmlns="http://www.w3.org/2000/svg" p-id="16462" width="40" height="40">
                        <path
                            d="M690.338 661.474c-41.498-18.374-103.937-65.868-195.163-82.197 23.332-24.985 40.564-63.996 58.672-110.231 10.528-26.786 8.425-49.62 8.425-82.185 0-24.002 4.507-62.528-1.502-83.71-20.073-71.577-71.002-91.29-130.507-91.29-59.583 0-110.473 19.828-130.557 91.452-5.848 21.24-1.355 59.627-1.355 83.548 0 32.623-1.764 55.56 8.787 82.359 18.247 46.477 35.683 85.444 58.865 110.347-90.428 16.525-148.928 63.73-190.16 82.047-85.32 38.11-83.219 79.828-83.219 79.828v70.698l685.644-0.128v-70.57c0-0.001-2.262-41.88-87.93-79.968zM659.56 227.805h271.187v59.352H659.56v-59.352z m0 129.96h165.782v60.375H659.56v-60.375z"
                            fill="#1296DB" p-id="16463"></path>
                        <path d="M659.56 487.725h237.417V548.1H659.56v-60.375z" fill="#1296DB" p-id="16464"></path>
                    </svg>
                </div>
            </div>
            <div class="header-right">
                <UserItem />
            </div>
        </div>
        <div class="main">
            <div class="main-left">
                <ChatList></ChatList>
            </div>
            <div class="main-center" ref="mainCenterRef">
                <!-- 修改 v-if 为 v-show -->
                <ChatList class="mobile-chat-list"
                    :style="showChatList? 'transform: translateX(0%);' : 'transform: translateX(-100%);'" />
                <GroupList class="mobile-group-list"
                    :style="showGroupList? 'transform: translateX(140%);' : 'transform: translateX(200%);'" />
                <Message></Message>
            </div>
            <div class="main-right">
                <GroupList></GroupList>
            </div>
        </div>

        <!-- 用户信息编辑弹窗 -->
        <UserInfo v-model="userStore.showUserInfo" />
        
        <!-- 临时头像测试组件 -->
        <AvatarTest />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount,watch } from 'vue'
// import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/module/useUserStore'
// import { logout } from '@/api/login'
// import { ElMessage } from 'element-plus'
// import type { ApiResponse } from '@/types/common'
import UserInfo from '@/components/UserInfo.vue'
import ChatList from '@/components/ChatList.vue'
import Message from '@/components/Message.vue'
import ChatName from '@/components/ChatName.vue'
import UserItem from '@/components/UserItem.vue'
import GroupList from '@/components/GroupList.vue'
import Avatar from '@/components/Avatar.vue'
import { useSwipe } from '@vueuse/core'
// 调试用户映射数据的工具函数
const debugUserMap = (userStore: any) => {
    console.log('🔍 === 用户映射调试信息 ===')
    console.log('用户映射数据:', userStore.userMap)
    console.log('用户映射键数量:', Object.keys(userStore.userMap).length)
    
    // 检查每个用户的头像数据
    Object.entries(userStore.userMap).forEach(([userId, userData]: [string, any]) => {
        console.log(`👤 用户 ${userId} (${userData.name}):`, {
            avatar: userData.avatar,
            hasAvatar: !!userData.avatar,
            isCartoonAvatar: userData.avatar && userData.avatar.includes('dicebear.com')
        })
    })
    
    // 统计头像数据
    const totalUsers = Object.keys(userStore.userMap).length
    const usersWithAvatar = Object.values(userStore.userMap).filter((user: any) => user.avatar).length
    const usersWithCartoonAvatar = Object.values(userStore.userMap).filter((user: any) => 
        user.avatar && user.avatar.includes('dicebear.com')
    ).length
    
    console.log('📊 === 头像统计 ===')
    console.log(`总用户数: ${totalUsers}`)
    console.log(`有头像的用户: ${usersWithAvatar}`)
    console.log(`有卡通头像的用户: ${usersWithCartoonAvatar}`)
}
import AvatarTest from '@/components/AvatarTest.vue'

// const router = useRouter()
const userStore = useUserStore()
// const showUserInfo = ref(false)
// const showSidebars = ref(true)
const showChatList = ref(false)
const showGroupList = ref(false)
const mainCenterRef = ref(null)

const toggleChatList = (event: MouseEvent) => {
    event.stopPropagation(); // 阻止事件冒泡
    showChatList.value = !showChatList.value;
    showGroupList.value = false;
    console.log('toggleChatList 被触发，showChatList:', showChatList.value);
};

const handleOutsideClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    const avatar = document.querySelector('.header-center-avatar') as HTMLElement
    const chatList = document.querySelector('.main-left') as HTMLElement
    const groupList = document.querySelector('.mobile-group-list') as HTMLElement

    if (showChatList.value && !chatList.contains(target) && target!== avatar) {
        showChatList.value = false
        console.log('showChatList 被设置为 false', showChatList.value)
    }
    if (showGroupList.value && !groupList.contains(target) && target!== avatar) {
        showGroupList.value = false
        console.log('showGroupList 被设置为 false', showGroupList.value)
    }
}

const toggleGroupList = (event: MouseEvent) => {
    event.stopPropagation() // 阻止事件冒泡
    showGroupList.value = !showGroupList.value;
    showChatList.value = false;
    console.log('toggleGroupList 被触发，showGroupList:', showGroupList.value)
}

const { direction } = useSwipe(mainCenterRef, {
    threshold: 50, // 划动阈值
});

onMounted(async () => {
    console.log('🚀 ChatPage mounted, 开始加载用户映射...')
    console.log('👤 当前用户状态:', { 
        user: userStore.user, 
        token: userStore.token,
        hasUserMap: Object.keys(userStore.userMap).length > 0
    })
    
    try {
        await userStore.getUserMap(true)
        console.log('✅ 用户映射加载完成')
        debugUserMap(userStore)
    } catch (error) {
        console.error('❌ 用户映射加载失败:', error)
    }
    
    const handleSwipe = () => {
        if (window.innerWidth < 700) {
            if (direction.value === 'right') {
                toggleChatList(new MouseEvent('click'));
            } else if (direction.value === 'left') {
                toggleGroupList(new MouseEvent('click'));
            }
        }
    };
    // direction.value = null;
    watch(direction, handleSwipe);
});

onBeforeUnmount(() => {
    // 移除事件监听
    // 这里不需要额外移除，因为 watch 会自动处理
});
</script>

<style scoped lang="scss">
// 定义一个变量来存储列宽设置
$column-layout: 1fr 3fr 1fr;

.header {
    width: 100%;
    height: 70px;
    display: grid;
    // 使用变量设置列宽
    grid-template-columns: $column-layout;
    align-items: center;
    justify-content: center;
    gap: 5px;
    grid-template-areas: "left center right";

    // background-color: #9b2525;
    .header-left {
        grid-area: left;
        border: #ffffff 3px solid;
        width: 234px;
        height: 100%;
        border-radius: 5px;
        display: flex;
        font-family: 'PingFang SC';
        justify-content: center;
        align-items: center;
        font-size: 19px;
        font-weight: 550;
        color: black;
        background: #EDF5FE;
    }

    .header-center {
        grid-area: center;
        border: #ffffff 3px solid;
        width: 100%;
        border-radius: 5px;
        display: flex;
        align-items: center;
        height: 100%;
        background: #EFF5FD;

        @media screen and (max-width: 700px) {
            border: none;
            justify-content: space-between;

            .header-center-avatar {
                margin-left: 1vh;
                cursor: pointer;
                
                .avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    object-fit: cover;
                }
            }

            .online-people {
                margin-right: 1vh;
                cursor: pointer;
            }
        }

        @media screen and (min-width: 700px) {
            justify-content: center;

            .header-center-avatar {
                display: none;
            }

            .online-people {
                display: none;
            }
        }
    }

    .header-right {
        color: #000;
        grid-area: right;
        width: 100%;
        border: #ffffff 3px solid;
        border-radius: 5px;
        display: flex;
        justify-content: space-around;
        align-items: center;
        height: 100%;
        background: #EFF5FD;
    }

    .toggle-btn {
        display: none;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
    }
}

.main {
    width: 100%;
    height: calc(100vh - 200px);
    display: grid;
    grid-template-columns: $column-layout;
    grid-template-areas: "left center right";
    gap: 5px;

    // background-color: #000;
    .main-left {
        border-radius: 5px;
        border: #ffffff 3px solid;
        margin-top: 5px;
        grid-area: left;
        background: #EDF5FE;
        transition: transform 0.3s ease;
        z-index: 100;
    }
    .main-center {
        grid-area: center;
        border: #ffffff 3px solid;
        margin-top: 5px;
        border-radius: 5px;
        background: #E8F0FB;

        @media screen and (min-width: 700px) {
            .mobile-chat-list{
                display: none;
            }
            .mobile-group-list{
                display: none;
            }
        }

        @media screen and (max-width: 700px) {
            margin-top: 0;
            border: none;
            .mobile-chat-list {
                transition: all 0.5s ease;
                position: absolute;
                z-index: 100; 
                opacity: 1;
                display: block;
                transform: translateX(-100%);
                width: 70%;
                .slide-in {
                    opacity: 0;
                    transform: translateX(0%);
                }
                .slide-out {
                    opacity: 1;
                    z-index: 100;
                    transform: translateX(-100%);
                }
            }
            .mobile-group-list{
                transition: all 0.5s ease;
                position: absolute;
                top:70px;
                z-index: 110; // 确保 GroupList 在 ChatList 之上
                opacity: 1;
                display: block;
                border-radius: 20px;
                transform: translateX(120%);
                width: 50%;
                height: 100%;
                .slide-in {
                    opacity: 0;
                    transform: translateX(20%);
                }
                .slide-out {
                    opacity: 1;
                    z-index: 101;
                    transform: translateX(100%);
                }
            }

        }
    }

    .main-right {
        margin-top: 5px;
        border: #ffffff 3px solid;
        border-radius: 5px;
        grid-area: right;
        background: #EDF5FE;
    }
}

@media (max-width: 700px) {
    .header {
        grid-template-columns: 1fr;
        grid-template-areas: "center";

        .toggle-btn {
            display: block;
        }

        .header-left,
        .header-right {
            display: none;
        }

        .main-center {
            height: 100vh;
            width: 100%;
        }

        &.show-sidebars .header-left,
        &.show-sidebars .header-right {
            display: flex;
        }
    }

    .main {
        grid-template-columns: 1fr;
        grid-template-areas: "center";

        .main-left,
        .main-right {
            display: none;
        }

        &.show-sidebars .main-left,
        &.show-sidebars .main-right {
            display: block;
            z-index: 999;
        }
        .main-left {
            position: absolute;
            top: 70px; // 调整到合适的位置
            left: 0;
            width: 70%; // 调整宽度
            height: calc(100vh - 70px); // 调整高度
            box-shadow: 2px 0 5px rgba(0, 0, 0, 0.2); // 添加阴影效果
        }
        .main-right {
            position: absolute;
            top: 70px; // 调整到合适的位置
            right: 0;
            width: 30%; // 调整宽度
            height: calc(100vh - 70px); // 调整高度
            box-shadow: -2px 0 5px rgba(0, 0, 0, 0.2); // 添加阴影效果
        }

        .main-center {
            height: 100vh;
        }
    }
}
</style>