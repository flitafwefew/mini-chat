<template>
  <div class="friend-list">
    <div class="header">
      <h3>好友列表</h3>
      <div class="actions">
        <button @click="refreshFriends" :disabled="loading" class="refresh-btn">
          {{ loading ? '刷新中...' : '刷新' }}
        </button>
        <button @click="$emit('showAddFriend')" class="add-btn">
          添加好友
        </button>
      </div>
    </div>

    <div class="friends-container" v-if="!loading">
      <div v-if="friends.length === 0" class="empty-state">
        <p>暂无好友</p>
        <button @click="$emit('showAddFriend')" class="add-first-friend">
          添加第一个好友
        </button>
      </div>
      
      <div v-else class="friends-grid">
        <div
          v-for="friend in friends"
          :key="friend.id"
          class="friend-item"
          @click="handleFriendClick(friend)"
        >
          <div class="friend-avatar">
            <img v-if="friend.portrait" :src="friend.portrait" :alt="friend.name" />
            <Avatar v-else :name="friend.name" :size="50" />
            <div class="online-status" :class="{ online: friend.is_online }"></div>
          </div>
          <div class="friend-info">
            <div class="friend-name">{{ friend.name }}</div>
            <div class="friend-account">账号: {{ friend.account }}</div>
            <div class="friend-signature" v-if="friend.signature">
              {{ friend.signature }}
            </div>
            <div class="last-active" v-if="friend.last_opt_time">
              {{ formatLastActive(friend.last_opt_time) }}
            </div>
          </div>
          <div class="friend-actions">
            <button
              @click.stop="handleDeleteFriend(friend.id)"
              :disabled="deletingFriend === friend.id"
              class="delete-btn"
              title="删除好友"
            >
              {{ deletingFriend === friend.id ? '删除中...' : '删除' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="loading" v-if="loading">
      <p>加载中...</p>
    </div>

    <div class="message" v-if="message" :class="{ error: isError }">
      {{ message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getFriendList, deleteFriend, type Friend } from '@/api/friend'
import Avatar from './Avatar.vue'

const emit = defineEmits<{
  showAddFriend: []
  selectFriend: [friend: Friend]
}>()

const friends = ref<Friend[]>([])
const loading = ref(false)
const deletingFriend = ref<string | null>(null)
const message = ref('')
const isError = ref(false)

const loadFriends = async () => {
  loading.value = true
  try {
    const response = await getFriendList()
    friends.value = response.data
    message.value = ''
  } catch (error: any) {
    console.error('获取好友列表失败:', error)
    message.value = error.response?.data?.message || '获取好友列表失败'
    isError.value = true
  } finally {
    loading.value = false
  }
}

const refreshFriends = () => {
  loadFriends()
}

const handleFriendClick = (friend: Friend) => {
  emit('selectFriend', friend)
}

const handleDeleteFriend = async (friendId: string) => {
  if (!confirm('确定要删除这个好友吗？')) return

  deletingFriend.value = friendId
  try {
    await deleteFriend(friendId)
    message.value = '删除好友成功'
    isError.value = false
    
    // 从列表中移除已删除的好友
    friends.value = friends.value.filter(friend => friend.id !== friendId)
  } catch (error: any) {
    console.error('删除好友失败:', error)
    message.value = error.response?.data?.message || '删除好友失败'
    isError.value = true
  } finally {
    deletingFriend.value = null
  }
}

const formatLastActive = (lastOptTime: string) => {
  const now = new Date()
  const lastActive = new Date(lastOptTime)
  const diffMs = now.getTime() - lastActive.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) {
    return '刚刚在线'
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`
  } else if (diffHours < 24) {
    return `${diffHours}小时前`
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return lastActive.toLocaleDateString()
  }
}

onMounted(() => {
  loadFriends()
})
</script>

<style scoped>
.friend-list {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.header h3 {
  margin: 0;
  color: #333;
}

.actions {
  display: flex;
  gap: 10px;
}

.refresh-btn, .add-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.refresh-btn {
  background-color: #6c757d;
  color: white;
}

.refresh-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.add-btn {
  background-color: #007bff;
  color: white;
}

.friends-container {
  min-height: 200px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-state p {
  margin-bottom: 20px;
  font-size: 16px;
}

.add-first-friend {
  padding: 10px 20px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.friends-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.friend-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: #f9f9f9;
  cursor: pointer;
  transition: all 0.2s ease;
}

.friend-item:hover {
  background-color: #f0f0f0;
  border-color: #ddd;
}

.friend-avatar {
  position: relative;
  margin-right: 12px;
}

.friend-avatar img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.online-status {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #ccc;
  border: 2px solid white;
}

.online-status.online {
  background-color: #28a745;
}

.friend-info {
  flex: 1;
  min-width: 0;
}

.friend-name {
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.friend-account {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.friend-signature {
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.last-active {
  font-size: 11px;
  color: #999;
}

.friend-actions {
  margin-left: 10px;
}

.delete-btn {
  padding: 6px 12px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.delete-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.message {
  margin-top: 15px;
  padding: 10px;
  border-radius: 4px;
  text-align: center;
}

.message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.message:not(.error) {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}
</style>
