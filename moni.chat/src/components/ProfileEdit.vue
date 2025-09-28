<template>
  <el-dialog
    v-model="visible"
    title="编辑个人资料"
    width="500px"
    :before-close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="80px"
      @submit.prevent="handleSubmit"
    >
      <el-form-item label="用户名" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="请输入用户名"
          maxlength="20"
          show-word-limit
        />
      </el-form-item>
      
      <el-form-item label="邮箱" prop="email">
        <el-input
          v-model="formData.email"
          placeholder="请输入邮箱"
          type="email"
        />
      </el-form-item>
      
      <el-form-item label="电话" prop="phone">
        <el-input
          v-model="formData.phone"
          placeholder="请输入电话"
          maxlength="20"
        />
      </el-form-item>
      
      <el-form-item label="个性签名" prop="signature">
        <el-input
          v-model="formData.signature"
          type="textarea"
          placeholder="请输入个性签名"
          :rows="3"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>
      
      <el-form-item label="头像" prop="portrait">
        <el-input
          v-model="formData.portrait"
          placeholder="请输入头像URL"
          type="url"
        />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          保存
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { updateUserInfo } from '@/api/login'
import { useUserStore } from '@/stores/module/useUserStore'
import type { UserInfo } from '@/types/login'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': [user: UserInfo]
}>()

const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const formData = ref({
  name: '',
  email: '',
  phone: '',
  signature: '',
  portrait: ''
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

// 监听弹窗打开，初始化表单数据
watch(visible, (newVal) => {
  if (newVal && userStore.user) {
    formData.value = {
      name: userStore.user.name || '',
      email: userStore.user.email || '',
      phone: userStore.user.phone || '',
      signature: userStore.user.signature || '',
      portrait: userStore.user.portrait || ''
    }
  }
})

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    const response = await updateUserInfo(formData.value)
    
    if (response.code === 200) {
      // 更新用户信息到store
      userStore.setUser(response.data)
      localStorage.setItem('user', JSON.stringify(response.data))
      
      ElMessage.success('个人资料更新成功')
      emit('success', response.data)
      handleClose()
    } else {
      ElMessage.error(response.msg || '更新失败')
    }
  } catch (error: any) {
    console.error('更新用户信息失败:', error)
    ElMessage.error('更新失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  visible.value = false
  formRef.value?.resetFields()
}
</script>

<style scoped lang="scss">
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
