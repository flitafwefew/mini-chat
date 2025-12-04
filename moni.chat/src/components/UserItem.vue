<template>
    <div class="user-item">
        <div class="main-right-header" @click="showProfileEdit = true">
            <div v-if="userStore.user?.avatar && !avatarLoadFailed" class="main-right-header-left">
                <img :src="userStore.user?.avatar" class="avatar" alt="" @error="handleAvatarError">
            </div>
            <div v-else class="main-right-header-left">
                <Avatar :name="userStore.user?.name || ''" :size="40" />
            </div>
            <div v-if="userStore.user" class="main-right-header-right">
                <p>{{ userStore.user.name }}</p>
            </div>
        </div>

        <div class="action-buttons">
            <button class="icon-btn add-friend" @click.stop="emit('toggle-add-friend')" title="添加好友">
                <svg viewBox="0 0 1024 1024" width="26" height="26" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M480 160a160 160 0 1 1 0 320 160 160 0 0 1 0-320zm0 64a96 96 0 1 0 0 192 96 96 0 0 0 0-192zm288 288a96 96 0 1 1 0 192 96 96 0 0 1 0-192zm0-64a160 160 0 1 1 0 320 160 160 0 0 1 0-320zM480 512c141.12 0 256 114.88 256 256v32H224v-32c0-141.12 114.88-256 256-256zM224 448a96 96 0 1 1 0 192 96 96 0 0 1 0-192zm0-64a160 160 0 1 1 0 320 160 160 0 0 1 0-320zm256 192c-92.224 0-169.6 58.88-199.872 140.928L288 704l-.128 32h384v-32l-.128-12.672C641.728 634.88 564.288 576 480 576zm288 96h64v96h96v64h-96v96h-64v-96h-96v-64h96v-96z"
                        fill="currentColor" />
                </svg>
            </button>
            <button class="icon-btn logout" @click.stop="handleLogout" title="退出登录">
                <svg viewBox="0 0 1024 1024" width="26" height="26" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M960.512 539.712l-144.768 144.832-48.256-48.256 60.224-60.288H512V512h325.76l-70.272-70.272 48.256-48.256 144.768 144.768-0.704 0.768 0.704 0.704zM704 192a64 64 0 0 0-64-64H192a64 64 0 0 0-64 64v640a64 64 0 0 0 64 64h448a64 64 0 0 0 64-64v-64h64v64a128 128 0 0 1-128 128H192a128 128 0 0 1-128-128V192a128 128 0 0 1 128-128h448a128 128 0 0 1 128 128v128h-64V192z"
                        fill="currentColor" />
                </svg>
            </button>
        </div>
    </div>
    
    <!-- 个人资料编辑弹窗 -->
    <ProfileEdit 
        v-model="showProfileEdit" 
        @success="handleProfileUpdate"
    />
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/module/useUserStore'
import { ref } from 'vue'
import Avatar from './Avatar.vue'
import ProfileEdit from './ProfileEdit.vue'
import type { UserInfo } from '@/types/login'

const emit = defineEmits(['toggle-add-friend'])
const userStore = useUserStore()
const showProfileEdit = ref(false)
const avatarLoadFailed = ref(false)

// 处理头像加载错误
const handleAvatarError = () => {
    avatarLoadFailed.value = true
}

const handleLogout = () => {
    userStore.logout()
}
const handleProfileUpdate = (user: UserInfo) => {
    // 个人资料更新成功后的处理
    console.log('个人资料更新成功:', user)
}
</script>

<style scoped lang="scss">
.user-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 10px;
}

.main-right-header {
    flex: 1;
    display: flex;
    align-items: center;
    cursor: pointer;
    justify-content: space-around;

    .main-right-header-left {
        flex: 1;

        .avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            margin-right: 10px
        }
    }

    .main-right-header-right {
        flex: 1;
    }
}

.action-buttons {
    display: flex;
    gap: 8px;

    .icon-btn {
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #1a1a1a;
        background: #fff;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
        transition: transform 0.2s, box-shadow 0.2s;

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.16);
        }
    }

    .add-friend {
        color: #1b84ff;
    }

    .logout {
        color: #f44336;
    }
}
</style>