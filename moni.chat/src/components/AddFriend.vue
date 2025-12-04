<template>
    <div class="add-friend">
        <!-- 搜索用户部分 -->
        <div class="search-section">
            <div class="search-title">添加好友</div>
            <div class="search-input-wrapper">
                <input 
                    v-model="searchKeyword" 
                    @input="handleSearchInput"
                    @keyup.enter="handleSearch"
                    type="text" 
                    placeholder="搜索用户账号或昵称" 
                    class="search-input"
                />
                <button @click="handleSearch" class="search-btn">搜索</button>
            </div>
        </div>

        <!-- 搜索结果 -->
        <div v-if="searchResults.length > 0" class="search-results">
            <div class="results-title">搜索结果</div>
            <div 
                v-for="user in searchResults" 
                :key="user.id" 
                class="user-item"
            >
                <div class="user-avatar">
                    <img v-if="(user.avatar || user.portrait) && !avatarLoadFailed[user.id]" 
                         :src="user.avatar || user.portrait" 
                         alt=""
                         @error="handleAvatarError(user.id)" />
                    <Avatar v-else :name="user.name" :size="40" />
                    <div v-if="user.is_online" class="online-dot"></div>
                </div>
                <div class="user-info">
                    <div class="user-name">{{ user.name }}</div>
                    <div class="user-account">账号: {{ user.account }}</div>
                    <div v-if="user.signature" class="user-signature">{{ user.signature }}</div>
                </div>
                <div class="user-actions">
                    <button 
                        v-if="!user.isFriend"
                        @click="handleSendRequest(user.id)" 
                        :disabled="sendingRequestId === user.id"
                        class="add-btn"
                    >
                        {{ sendingRequestId === user.id ? '发送中...' : '添加' }}
                    </button>
                    <button 
                        v-else
                        disabled
                        class="add-btn friend-btn"
                    >
                        已是好友
                    </button>
                </div>
            </div>
        </div>

        <!-- 空状态 -->
        <div v-if="hasSearched && searchResults.length === 0" class="empty-state">
            <div class="empty-text">未找到相关用户</div>
        </div>

        <!-- 好友申请列表 -->
        <div class="requests-section">
            <div class="requests-header">
                <div class="requests-title">好友申请</div>
                <button @click="refreshRequests" class="refresh-btn" :disabled="loadingRequests">
                    {{ loadingRequests ? '刷新中...' : '刷新' }}
                </button>
            </div>
            <div v-if="loadingRequests" class="loading-text">加载中...</div>
            <div v-else-if="friendRequests.length === 0" class="empty-requests">
                暂无好友申请
            </div>
            <div v-else class="requests-list">
                <div 
                    v-for="request in friendRequests" 
                    :key="request.id" 
                    class="request-item"
                >
                    <div class="request-avatar">
                        <img v-if="(request.avatar || request.portrait) && !avatarLoadFailed[request.userId]" 
                             :src="request.avatar || request.portrait" 
                             alt=""
                             @error="handleAvatarError(request.userId)" />
                        <Avatar v-else :name="request.name" :size="40" />
                    </div>
                    <div class="request-info">
                        <div class="request-name">{{ request.name }}</div>
                        <div class="request-account">账号: {{ request.account }}</div>
                        <div v-if="request.message" class="request-message">验证消息: {{ request.message }}</div>
                        <div class="request-time">{{ formatTime(request.createTime) }}</div>
                    </div>
                    <div class="request-actions">
                        <button 
                            @click="handleAcceptRequest(request.userId)" 
                            :disabled="processingRequestId === request.userId"
                            class="accept-btn"
                        >
                            接受
                        </button>
                        <button 
                            @click="handleRejectRequest(request.userId)" 
                            :disabled="processingRequestId === request.userId"
                            class="reject-btn"
                        >
                            拒绝
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import Avatar from '@/components/Avatar.vue'
import { 
    searchUsers, 
    sendFriendRequest, 
    getFriendRequests, 
    acceptFriendRequest, 
    rejectFriendRequest,
    type SearchUser,
    type FriendRequest
} from '@/api/friend'
import { formatTime } from '@/utils/date'

// 搜索相关
const searchKeyword = ref('')
const searchResults = ref<SearchUser[]>([])
const hasSearched = ref(false)
const sendingRequestId = ref<string | null>(null)

// 好友申请相关
const friendRequests = ref<FriendRequest[]>([])
const loadingRequests = ref(false)
const processingRequestId = ref<string | null>(null)

// 跟踪头像加载失败的状态
const avatarLoadFailed = ref<Record<string, boolean>>({})

// 处理头像加载错误
const handleAvatarError = (userId: string) => {
    avatarLoadFailed.value[userId] = true
}

// 搜索输入处理（防抖）
let searchTimer: ReturnType<typeof setTimeout> | null = null
const handleSearchInput = () => {
    if (searchTimer) {
        clearTimeout(searchTimer)
    }
    searchTimer = setTimeout(() => {
        if (searchKeyword.value.trim()) {
            handleSearch()
        } else {
            searchResults.value = []
            hasSearched.value = false
        }
    }, 500)
}

// 执行搜索
const handleSearch = async () => {
    const keyword = searchKeyword.value.trim()
    if (!keyword) {
        ElMessage.warning('请输入搜索关键词')
        return
    }

    try {
        console.log('开始搜索用户，关键词:', keyword)
        const response = await searchUsers(keyword) as any
        console.log('搜索响应完整数据:', JSON.stringify(response, null, 2))
        
        // 检查响应格式
        if (!response) {
            console.error('响应为空')
            ElMessage.error('搜索失败：服务器未返回数据')
            searchResults.value = []
            hasSearched.value = true
            return
        }
        
        // 兼容不同的响应格式
        if (response.code === 200 || response.code === 0) {
            // 确保 data 是数组
            const users = Array.isArray(response.data) 
                ? response.data 
                : (response.data?.users || [])
            
            console.log('解析后的搜索结果:', users)
            searchResults.value = users
            hasSearched.value = true
            
            if (users.length === 0) {
                console.log('未找到匹配的用户')
            }
        } else {
            console.error('搜索失败，响应码:', response.code, '消息:', response.message || response.msg)
            ElMessage.error(response?.message || response?.msg || '搜索失败')
            searchResults.value = []
            hasSearched.value = true
        }
    } catch (error: any) {
        console.error('搜索用户失败:', error)
        console.error('错误详情:', {
            message: error.message,
            code: error.code,
            response: error.response,
            data: error.response?.data
        })
        // 正确处理超时错误和其他网络错误
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
            ElMessage.error('请求超时，请检查网络连接或后端服务是否正常运行')
        } else if (error.response?.data?.message) {
            ElMessage.error(error.response.data.message)
        } else {
            ElMessage.error(error.message || '搜索失败')
        }
        searchResults.value = []
        hasSearched.value = true
    }
}

// 发送好友申请
const handleSendRequest = async (userId: string) => {
    if (sendingRequestId.value === userId) return

    sendingRequestId.value = userId
    try {
        const response = await sendFriendRequest(userId) as any
        if (response.code === 200) {
            ElMessage.success('好友申请发送成功')
            // 从搜索结果中移除已发送申请的用户
            searchResults.value = searchResults.value.filter(u => u.id !== userId)
        } else {
            ElMessage.error(response.message || '发送申请失败666')
        }
    } catch (error: any) {
        console.error('发送好友申请失败:', error)
        // 正确处理超时错误和其他网络错误
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
            ElMessage.error('请求超时，请稍后重试')
        } else if (error.response?.data?.message) {
            ElMessage.error(error.response.data.message)
        } else {
            ElMessage.error(error.message || '发送申请失败')
        }
    } finally {
        sendingRequestId.value = null
    }
}

// 获取好友申请列表
const fetchFriendRequests = async () => {
    loadingRequests.value = true
    try {
        const response = await getFriendRequests() as any
        if (response.code === 200) {
            friendRequests.value = response.data || []
        } else {
            ElMessage.error(response.message || '获取申请列表失败')
        }
    } catch (error: any) {
        console.error('获取好友申请列表失败:', error)
        // 正确处理超时错误和其他网络错误
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
            ElMessage.error('请求超时，请检查网络连接或后端服务是否正常运行')
        } else if (error.response?.data?.message) {
            ElMessage.error(error.response.data.message)
        } else {
            ElMessage.error(error.message || '获取申请列表失败')
        }
    } finally {
        loadingRequests.value = false
    }
}

// 接受好友申请
const handleAcceptRequest = async (userId: string) => {
    if (processingRequestId.value === userId) return

    processingRequestId.value = userId
    try {
        const response = await acceptFriendRequest(userId) as any
        if (response.code === 200) {
            ElMessage.success('已接受好友申请')
            // 从列表中移除
            friendRequests.value = friendRequests.value.filter((r: FriendRequest) => r.userId !== userId)
        } else {
            ElMessage.error(response.message || '接受申请失败')
        }
    } catch (error: any) {
        console.error('接受好友申请失败:', error)
        // 正确处理超时错误和其他网络错误
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
            ElMessage.error('请求超时，请稍后重试')
        } else if (error.response?.data?.message) {
            ElMessage.error(error.response.data.message)
        } else {
            ElMessage.error(error.message || '接受申请失败')
        }
    } finally {
        processingRequestId.value = null
    }
}

// 拒绝好友申请
const handleRejectRequest = async (userId: string) => {
    if (processingRequestId.value === userId) return

    processingRequestId.value = userId
    try {
        const response = await rejectFriendRequest(userId) as any
        if (response.code === 200) {
            ElMessage.success('已拒绝好友申请')
            // 从列表中移除
            friendRequests.value = friendRequests.value.filter((r: FriendRequest) => r.userId !== userId)
        } else {
            ElMessage.error(response.message || '拒绝申请失败')
        }
    } catch (error: any) {
        console.error('拒绝好友申请失败:', error)
        // 正确处理超时错误和其他网络错误
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
            ElMessage.error('请求超时，请稍后重试')
        } else if (error.response?.data?.message) {
            ElMessage.error(error.response.data.message)
        } else {
            ElMessage.error(error.message || '拒绝申请失败')
        }
    } finally {
        processingRequestId.value = null
    }
}

// 刷新申请列表
const refreshRequests = () => {
    fetchFriendRequests()
}

onMounted(() => {
    fetchFriendRequests()
})
</script>

<style scoped lang="scss">
.add-friend {
    padding: 20px;
    height: 100%;
    background: #EDF5FE;

    .search-section {
        margin-bottom: 30px;

        .search-title {
            font-size: 18px;
            font-weight: 600;
            color: #333;
            margin-bottom: 15px;
        }

        .search-input-wrapper {
            display:flex;
            gap: 10px;
            margin-bottom: 20px;
            margin-left:-20px;
            width: 20px;

            .search-input {
                height: 40px;
                width: 150px;
                flex: 1;
                border: 2px solid #ddd;
                border-radius: 8px;
                font-size: 14px;
                outline: none;
                transition: border-color 0.3s;

                &:focus {
                    border-color: #1296DB;
                }
            }

            .search-btn {
                white-space: nowrap;
                height: 40px;
                padding: 10px 10px;
                background: #1296DB;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 10px;
                transition: background 0.3s;
                margin-left: -10px;
                &:hover {
                    background: #0d7bb8;
                }

                &:active {
                    background: #0a5d8a;
                }
            }
        }
    }

    .search-results {
        margin-bottom: 30px;

        .results-title {
            font-size: 16px;
            font-weight: 600;
            color: #333;
            margin-bottom: 15px;
        }

        .user-item {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 15px;
            background: white;
            border-radius: 8px;
            margin-bottom: 10px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

            .user-avatar {
                position: relative;
                flex-shrink: 0;

                img {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    object-fit: cover;
                }

                .online-dot {
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    width: 12px;
                    height: 12px;
                    background: #4CAF50;
                    border: 2px solid white;
                    border-radius: 50%;
                }
            }

            .user-info {
                flex: 1;
                min-width: 0;

                .user-name {
                    font-size: 16px;
                    font-weight: 600;
                    color: #333;
                    margin-bottom: 5px;
                }

                .user-account {
                    font-size: 12px;
                    color: #999;
                    margin-bottom: 5px;
                }

                .user-signature {
                    font-size: 12px;
                    color: #666;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            }

            .user-actions {
                flex-shrink: 0;

                .add-btn {
                    padding: 8px 20px;
                    background: #1296DB;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: background 0.3s;

                    &:hover:not(:disabled) {
                        background: #0d7bb8;
                    }

                    &:disabled {
                        background: #ccc;
                        cursor: not-allowed;
                    }

                    &.friend-btn {
                        background: #4CAF50;
                        color: white;
                        cursor: default;

                        &:disabled {
                            background: #4CAF50;
                            opacity: 0.8;
                        }
                    }
                }
            }
        }
    }

    .empty-state {
        text-align: center;
        padding: 40px 20px;
        color: #999;

        .empty-text {
            font-size: 14px;
        }
    }

    .requests-section {
        .requests-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;

            .requests-title {
                font-size: 18px;
                font-weight: 600;
                color: #333;
            }

            .refresh-btn {
                padding: 6px 15px;
                background: #f0f0f0;
                color: #333;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                transition: background 0.3s;

                &:hover:not(:disabled) {
                    background: #e0e0e0;
                }

                &:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
            }
        }

        .loading-text {
            text-align: center;
            padding: 20px;
            color: #999;
            font-size: 14px;
        }

        .empty-requests {
            text-align: center;
            padding: 40px 20px;
            color: #999;
            font-size: 14px;
        }

        .requests-list {
            .request-item {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 15px;
                background: white;
                border-radius: 8px;
                margin-bottom: 10px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

                .request-avatar {
                    flex-shrink: 0;

                    img {
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        object-fit: cover;
                    }
                }

                .request-info {
                    flex: 1;
                    min-width: 0;

                    .request-name {
                        font-size: 16px;
                        font-weight: 600;
                        color: #333;
                        margin-bottom: 5px;
                    }

                    .request-account {
                        font-size: 12px;
                        color: #999;
                        margin-bottom: 5px;
                    }

                    .request-message {
                        font-size: 12px;
                        color: #666;
                        margin-bottom: 5px;
                    }

                    .request-time {
                        font-size: 11px;
                        color: #999;
                    }
                }

                .request-actions {
                    display: flex;
                    gap: 10px;
                    flex-shrink: 0;

                    .accept-btn {
                        padding: 8px 20px;
                        background: #4CAF50;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                        transition: background 0.3s;

                        &:hover:not(:disabled) {
                            background: #45a049;
                        }

                        &:disabled {
                            background: #ccc;
                            cursor: not-allowed;
                        }
                    }

                    .reject-btn {
                        padding: 8px 20px;
                        background: #f44336;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                        transition: background 0.3s;

                        &:hover:not(:disabled) {
                            background: #da190b;
                        }

                        &:disabled {
                            background: #ccc;
                            cursor: not-allowed;
                        }
                    }
                }
            }
        }
    }
}
</style>

