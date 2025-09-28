<template>
  <div class="user-list">
    <div class="list-header">
      <h3>用户列表</h3>
      <button @click="$emit('add-user')" class="btn btn-primary">
        <i class="icon-plus"></i> 添加用户
      </button>
    </div>
    
    <div class="list-content">
      <div v-if="loading" class="loading">
        <i class="icon-loading"></i> 加载中...
      </div>
      
      <div v-else-if="error" class="error">
        <i class="icon-error"></i> {{ error }}
      </div>
      
      <div v-else-if="users.length === 0" class="empty">
        <i class="icon-empty"></i> 暂无用户数据
      </div>
      
      <div v-else class="user-grid">
        <div 
          v-for="user in users" 
          :key="user.id" 
          class="user-card"
          @click="$emit('view-user', user)"
        >
          <div class="user-avatar">
            <img :src="user.avatar || '/default-avatar.png'" :alt="user.name" />
          </div>
          <div class="user-info">
            <h4>{{ user.name }}</h4>
            <p>{{ user.email }}</p>
            <span class="user-role">{{ user.role }}</span>
          </div>
          <div class="user-actions">
            <button @click.stop="$emit('edit-user', user)" class="btn btn-sm">
              <i class="icon-edit"></i>
            </button>
            <button @click.stop="$emit('delete-user', user)" class="btn btn-sm btn-danger">
              <i class="icon-delete"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UserList',
  props: {
    users: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: ''
    }
  },
  emits: ['add-user', 'view-user', 'edit-user', 'delete-user']
}
</script>

<style scoped>
.user-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.list-header h3 {
  margin: 0;
  color: #333;
}

.list-content {
  padding: 20px;
}

.loading, .error, .empty {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.user-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.user-card {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-card:hover {
  border-color: #1890ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
}

.user-avatar img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.user-info {
  flex: 1;
}

.user-info h4 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 16px;
}

.user-info p {
  margin: 0 0 5px 0;
  color: #666;
  font-size: 14px;
}

.user-role {
  background: #f0f0f0;
  color: #666;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.user-actions {
  display: flex;
  gap: 5px;
}

.btn {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #1890ff;
  color: white;
}

.btn-primary:hover {
  background: #40a9ff;
}

.btn-sm {
  padding: 6px 8px;
  font-size: 12px;
}

.btn-danger {
  background: #ff4d4f;
  color: white;
}

.btn-danger:hover {
  background: #ff7875;
}

.icon-plus::before { content: '+'; }
.icon-edit::before { content: '✏️'; }
.icon-delete::before { content: '🗑️'; }
.icon-loading::before { content: '⏳'; }
.icon-error::before { content: '❌'; }
.icon-empty::before { content: '📭'; }
</style>


