<template>
  <div class="avatar-test">
    <h3>头像测试组件</h3>
    <div class="test-section">
      <h4>当前用户头像:</h4>
      <div class="avatar-container">
        <img v-if="userStore.user?.avatar" :src="userStore.user?.avatar" class="test-avatar" alt="">
        <Avatar v-else :name="userStore.user?.name || ''" :size="60" />
      </div>
      <p>用户信息: {{ userStore.user?.name }} ({{ userStore.user?.id }})</p>
      <p>portrait字段: {{ userStore.user?.portrait || '无头像' }}</p>
      <p>avatar字段: {{ userStore.user?.avatar || '无头像' }}</p>
    </div>
    
    <div class="test-section">
      <h4>用户映射数据:</h4>
      <p>用户映射数量: {{ Object.keys(userStore.userMap).length }}</p>
      <div v-for="(user, userId) in userStore.userMap" :key="userId" class="user-item">
        <div class="avatar-container">
          <img v-if="user.avatar" :src="user.avatar" class="test-avatar" alt="">
          <Avatar v-else :name="user.name" :size="40" />
        </div>
        <div class="user-info">
          <p><strong>{{ user.name }}</strong> ({{ userId }})</p>
          <p>头像: {{ user.avatar || '无头像' }}</p>
        </div>
      </div>
    </div>
    
    <div class="test-section">
      <button @click="refreshUserMap" :disabled="loading">刷新用户映射</button>
      <button @click="debugData">调试数据</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/stores/module/useUserStore'
import Avatar from './Avatar.vue'

const userStore = useUserStore()
const loading = ref(false)

const refreshUserMap = async () => {
  loading.value = true
  try {
    console.log('=== 手动刷新用户映射 ===')
    console.log('调用前 userMap:', userStore.userMap)
    await userStore.getUserMap(true)
    console.log('调用后 userMap:', userStore.userMap)
    console.log('用户映射已刷新')
  } catch (error) {
    console.error('刷新用户映射失败:', error)
  } finally {
    loading.value = false
  }
}

const debugData = () => {
  console.log('=== 调试用户数据 ===')
  console.log('当前用户:', userStore.user)
  console.log('用户映射:', userStore.userMap)
  console.log('用户映射数量:', Object.keys(userStore.userMap).length)
  
  // 检查头像数据
  const usersWithAvatars = Object.values(userStore.userMap).filter(user => user.avatar)
  console.log('有头像的用户数量:', usersWithAvatars.length)
  console.log('有头像的用户:', usersWithAvatars)
}
</script>

<style scoped>
.avatar-test {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.avatar-container {
  display: inline-block;
  margin-right: 15px;
}

.test-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ddd;
}

.user-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 5px;
}

.user-info {
  flex: 1;
}

.user-info p {
  margin: 5px 0;
  font-size: 14px;
}

button {
  margin-right: 10px;
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
