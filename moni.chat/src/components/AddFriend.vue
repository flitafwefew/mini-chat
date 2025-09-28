<template>
  <div class="add-friend">
    <div class="search-section">
      <div class="search-input">
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索用户账号或昵称"
          @keyup.enter="handleSearch"
        />
        <button @click="handleSearch" :disabled="!searchKeyword.trim()">
          搜索
        </button>
      </div>
    </div>

    <div class="search-results" v-if="searchResults.length > 0">
      <h3>搜索结果</h3>
      <div class="user-list">
        <div
          v-for="user in searchResults"
          :key="user.id"
          class="user-item"
        >
          <div class="user-info">
            <img :src="user.portrait || '/default-avatar.png'" :alt="user.name" class="avatar" />
            <div class="user-details">
              <div class="name">{{ user.name }}</div>
              <div class="account">账号: {{ user.account }}</div>
              <div class="signature" v-if="user.signature">{{ user.signature }}</div>
            </div>
          </div>
          <button
            @click="handleAddFriend(user.id)"
            :disabled="addingFriend === user.id"
            class="add-btn"
          >
            {{ addingFriend === user.id ? '添加中...' : '添加好友' }}
          </button>
        </div>
      </div>
    </div>

    <div class="no-results" v-if="searched && searchResults.length === 0">
      <p>未找到相关用户</p>
    </div>

    <div class="message" v-if="message" :class="{ error: isError }">
      {{ message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { searchUsers, addFriend, type SearchUser } from '@/api/friend'

const searchKeyword = ref('')
const searchResults = ref<SearchUser[]>([])
const searched = ref(false)
const addingFriend = ref<string | null>(null)
const message = ref('')
const isError = ref(false)

const handleSearch = async () => {
  if (!searchKeyword.value.trim()) return

  try {
    const response = await searchUsers(searchKeyword.value.trim())
    searchResults.value = response.data
    searched.value = true
    message.value = ''
  } catch (error: any) {
    console.error('搜索用户失败:', error)
    message.value = error.response?.data?.message || '搜索失败'
    isError.value = true
    searchResults.value = []
    searched.value = true
  }
}

const handleAddFriend = async (friendId: string) => {
  addingFriend.value = friendId
  
  try {
    await addFriend(friendId)
    message.value = '添加好友成功'
    isError.value = false
    
    // 从搜索结果中移除已添加的好友
    searchResults.value = searchResults.value.filter(user => user.id !== friendId)
  } catch (error: any) {
    console.error('添加好友失败:', error)
    message.value = error.response?.data?.message || '添加好友失败'
    isError.value = true
  } finally {
    addingFriend.value = null
  }
}
</script>

<style scoped>
.add-friend {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.search-section {
  margin-bottom: 20px;
}

.search-input {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-input input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.search-input button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.search-input button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.search-results h3 {
  margin-bottom: 15px;
  color: #333;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.name {
  font-weight: bold;
  color: #333;
}

.account {
  font-size: 12px;
  color: #666;
}

.signature {
  font-size: 12px;
  color: #888;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.add-btn {
  padding: 8px 16px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.add-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.no-results {
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
