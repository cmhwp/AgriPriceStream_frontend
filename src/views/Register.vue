<template>
  <div class="register-container">
    <div class="system-title">
      <h1>农产品价格追踪系统</h1>
    </div>
    <a-card title="用户注册" class="register-card">
      <a-form
        :model="registerForm"
        :rules="rules"
        @finish="handleSubmit"
        @finishFailed="onFinishFailed"
        layout="vertical"
      >
        <a-form-item name="username" label="用户名">
          <a-input v-model:value="registerForm.username" placeholder="请输入用户名" />
        </a-form-item>

        <a-form-item name="password" label="密码">
          <a-input-password v-model:value="registerForm.password" placeholder="请输入密码" />
        </a-form-item>

        <a-form-item name="confirmPassword" label="确认密码">
          <a-input-password
            v-model:value="registerForm.confirmPassword"
            placeholder="请再次输入密码"
          />
        </a-form-item>

        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="loading" block> 注册 </a-button>
        </a-form-item>

        <div class="register-form-footer">
          <router-link to="/auth/login">已有账号？前往登录</router-link>
        </div>
      </a-form>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { message } from 'ant-design-vue'
import type { UserCreate } from '@/types'

interface RegisterFormState {
  username: string
  password: string
  confirmPassword: string
}

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)

const registerForm = reactive<RegisterFormState>({
  username: '',
  password: '',
  confirmPassword: '',
})

const validateConfirmPassword = async (_rule: any, value: string) => {
  if (value !== registerForm.password) {
    throw new Error('两次输入的密码不一致')
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名至少3个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

const handleSubmit = async () => {
  loading.value = true
  try {
    const userData: UserCreate = {
      username: registerForm.username,
      password: registerForm.password,
    }

    const success = await userStore.register(userData)

    if (success) {
      message.success('注册成功，请登录')
      router.push('/auth/login')
    } else {
      message.error('注册失败，请稍后再试')
    }
  } catch (error: any) {
    console.error('注册失败:', error)
    if (error.response?.data?.message) {
      message.error(error.response.data.message)
    } else {
      message.error('注册失败，可能用户名已存在')
    }
  } finally {
    loading.value = false
  }
}

const onFinishFailed = (errorInfo: any) => {
  console.log('Failed:', errorInfo)
  message.error('表单验证失败，请检查输入')
}
</script>

<style scoped>
.register-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
}

.system-title {
  text-align: center;
  margin-bottom: 24px;
}

.system-title h1 {
  color: #1890ff;
  font-size: 28px;
}

.register-card {
  width: 400px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.register-form-footer {
  text-align: center;
  margin-top: 16px;
}
</style>
