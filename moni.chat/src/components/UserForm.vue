<template>
  <div class="user-form">
    <div class="form-header">
      <h3>{{ isEdit ? '编辑用户' : '添加用户' }}</h3>
      <button @click="$emit('close')" class="btn btn-close">
        <i class="icon-close"></i>
      </button>
    </div>
    
    <form @submit.prevent="handleSubmit" class="form-content">
      <div class="form-group">
        <label for="name">姓名 *</label>
        <input
          id="name"
          v-model="formData.name"
          type="text"
          required
          placeholder="请输入姓名"
          class="form-input"
        />
      </div>
      
      <div class="form-group">
        <label for="email">邮箱 *</label>
        <input
          id="email"
          v-model="formData.email"
          type="email"
          required
          placeholder="请输入邮箱"
          class="form-input"
        />
      </div>
      
      <div class="form-group">
        <label for="phone">电话</label>
        <input
          id="phone"
          v-model="formData.phone"
          type="tel"
          placeholder="请输入电话"
          class="form-input"
        />
      </div>
      
      <div class="form-group">
        <label for="role">角色 *</label>
        <select
          id="role"
          v-model="formData.role"
          required
          class="form-select"
        >
          <option value="">请选择角色</option>
          <option value="admin">管理员</option>
          <option value="user">普通用户</option>
          <option value="guest">访客</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="avatar">头像URL</label>
        <input
          id="avatar"
          v-model="formData.avatar"
          type="url"
          placeholder="请输入头像URL"
          class="form-input"
        />
      </div>
      
      <div class="form-group">
        <label for="description">描述</label>
        <textarea
          id="description"
          v-model="formData.description"
          placeholder="请输入用户描述"
          rows="3"
          class="form-textarea"
        ></textarea>
      </div>
      
      <div class="form-actions">
        <button type="button" @click="$emit('close')" class="btn btn-secondary">
          取消
        </button>
        <button type="submit" :disabled="loading" class="btn btn-primary">
          <i v-if="loading" class="icon-loading"></i>
          {{ loading ? '保存中...' : (isEdit ? '更新' : '创建') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script>
export default {
  name: 'UserForm',
  props: {
    user: {
      type: Object,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['submit', 'close'],
  data() {
    return {
      formData: {
        name: '',
        email: '',
        phone: '',
        role: '',
        avatar: '',
        description: ''
      }
    }
  },
  computed: {
    isEdit() {
      return !!this.user
    }
  },
  watch: {
    user: {
      handler(newUser) {
        if (newUser) {
          this.formData = { ...newUser }
        } else {
          this.resetForm()
        }
      },
      immediate: true
    }
  },
  methods: {
    handleSubmit() {
      this.$emit('submit', { ...this.formData })
    },
    resetForm() {
      this.formData = {
        name: '',
        email: '',
        phone: '',
        role: '',
        avatar: '',
        description: ''
      }
    }
  }
}
</script>

<style scoped>
.user-form {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.form-header h3 {
  margin: 0;
  color: #333;
}

.form-content {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 30px;
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

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #1890ff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #40a9ff;
}

.btn-secondary {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #d9d9d9;
}

.btn-secondary:hover {
  background: #e6f7ff;
  border-color: #91d5ff;
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
.icon-loading::before { content: '⏳'; }
</style>


