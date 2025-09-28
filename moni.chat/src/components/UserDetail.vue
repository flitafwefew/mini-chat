<template>
  <div class="user-detail">
    <div class="detail-header">
      <h3>用户详情</h3>
      <button @click="$emit('close')" class="btn btn-close">
        <i class="icon-close"></i>
      </button>
    </div>
    
    <div v-if="loading" class="loading">
      <i class="icon-loading"></i> 加载中...
    </div>
    
    <div v-else-if="error" class="error">
      <i class="icon-error"></i> {{ error }}
    </div>
    
    <div v-else-if="user" class="detail-content">
      <div class="user-profile">
        <div class="user-avatar">
          <img :src="user.avatar || '/default-avatar.png'" :alt="user.name" />
        </div>
        <div class="user-basic">
          <h2>{{ user.name }}</h2>
          <p class="user-email">{{ user.email }}</p>
          <span class="user-role">{{ getRoleText(user.role) }}</span>
        </div>
      </div>
      
      <div class="user-info-grid">
        <div class="info-item">
          <label>用户ID</label>
          <span>{{ user.id }}</span>
        </div>
        
        <div class="info-item">
          <label>姓名</label>
          <span>{{ user.name }}</span>
        </div>
        
        <div class="info-item">
          <label>邮箱</label>
          <span>{{ user.email }}</span>
        </div>
        
        <div class="info-item">
          <label>电话</label>
          <span>{{ user.phone || '未设置' }}</span>
        </div>
        
        <div class="info-item">
          <label>角色</label>
          <span class="role-badge" :class="'role-' + user.role">
            {{ getRoleText(user.role) }}
          </span>
        </div>
        
        <div class="info-item">
          <label>创建时间</label>
          <span>{{ formatDate(user.createdAt) }}</span>
        </div>
        
        <div class="info-item">
          <label>最后更新</label>
          <span>{{ formatDate(user.updatedAt) }}</span>
        </div>
        
        <div class="info-item full-width" v-if="user.description">
          <label>描述</label>
          <p class="description">{{ user.description }}</p>
        </div>
      </div>
      
      <div class="detail-actions">
        <button @click="$emit('edit', user)" class="btn btn-primary">
          <i class="icon-edit"></i> 编辑用户
        </button>
        <button @click="$emit('delete', user)" class="btn btn-danger">
          <i class="icon-delete"></i> 删除用户
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UserDetail',
  props: {
    user: {
      type: Object,
      default: null
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
  emits: ['close', 'edit', 'delete'],
  methods: {
    getRoleText(role) {
      const roleMap = {
        admin: '管理员',
        user: '普通用户',
        guest: '访客'
      }
      return roleMap[role] || role
    },
    formatDate(dateString) {
      if (!dateString) return '未知'
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
.user-detail {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-header h3 {
  margin: 0;
  color: #333;
}

.detail-content {
  padding: 20px;
}

.loading, .error {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.error {
  color: #ff4d4f;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.user-avatar img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #f0f0f0;
}

.user-basic h2 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 24px;
}

.user-email {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 16px;
}

.user-role {
  background: #1890ff;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.user-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-item label {
  font-weight: 500;
  color: #666;
  font-size: 14px;
}

.info-item span {
  color: #333;
  font-size: 16px;
}

.description {
  margin: 0;
  color: #333;
  line-height: 1.6;
  background: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  border-left: 3px solid #1890ff;
}

.role-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  width: fit-content;
}

.role-admin {
  background: #ff4d4f;
  color: white;
}

.role-user {
  background: #1890ff;
  color: white;
}

.role-guest {
  background: #52c41a;
  color: white;
}

.detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-primary {
  background: #1890ff;
  color: white;
}

.btn-primary:hover {
  background: #40a9ff;
}

.btn-danger {
  background: #ff4d4f;
  color: white;
}

.btn-danger:hover {
  background: #ff7875;
}

.btn-close {
  background: none;
  border: none;
  font-size: 18px;
  color: #999;
  cursor: pointer;
  padding: 5px;
}

.btn-close:hover {
  color: #666;
}

.icon-close::before { content: '×'; }
.icon-edit::before { content: '✏️'; }
.icon-delete::before { content: '🗑️'; }
.icon-loading::before { content: '⏳'; }
.icon-error::before { content: '❌'; }
</style>


