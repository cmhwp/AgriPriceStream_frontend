<template>
  <div class="register-container">
    <div class="system-title">
      <h1>智农价格通</h1>
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
  position: relative;
  overflow: hidden;
}

.register-container::before {
  content: '';
  position: absolute;
  top: -10%;
  left: -10%;
  width: 120%;
  height: 120%;
  background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="none"/><path d="M10,30 Q50,15 90,30 T170,30" fill="none" stroke="rgba(163, 240, 255, 0.3)" stroke-width="2" /><path d="M10,40 Q50,25 90,40 T170,40" fill="none" stroke="rgba(163, 240, 255, 0.3)" stroke-width="2" /><path d="M10,50 Q50,35 90,50 T170,50" fill="none" stroke="rgba(163, 240, 255, 0.3)" stroke-width="2" /><path d="M10,60 Q50,45 90,60 T170,60" fill="none" stroke="rgba(163, 240, 255, 0.3)" stroke-width="2" /><path d="M10,70 Q50,55 90,70 T170,70" fill="none" stroke="rgba(163, 240, 255, 0.3)" stroke-width="2" /></svg>')
    repeat;
  opacity: 0.3;
  z-index: -1;
}

.system-title {
  text-align: center;
  margin-bottom: 30px;
  animation: fadeInDown 0.8s ease-out;
}

.system-title h1 {
  color: #0086e6;
  font-size: 36px;
  margin-bottom: 12px;
  text-shadow: 0 2px 4px rgba(0, 134, 230, 0.2);
  font-weight: 700;
  letter-spacing: 1px;
}

.register-card {
  width: 400px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  margin-bottom: 30px;
  overflow: hidden;
  border: none;
  animation: fadeIn 1s ease-out;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

:deep(.ant-card-head) {
  background-image: linear-gradient(135deg, #0086e6, #00c3ff);
  padding: 16px 24px;
  border-bottom: none;
}

:deep(.ant-card-head-title) {
  color: white;
  font-size: 18px;
  font-weight: 600;
}

:deep(.ant-card-body) {
  padding: 30px 24px;
}

:deep(.ant-form-item-label > label) {
  font-weight: 500;
  color: #444;
}

:deep(.ant-input),
:deep(.ant-input-password) {
  border-radius: 8px;
  padding: 12px;
  height: auto;
  border: 1px solid #e8e8e8;
  transition: all 0.3s;
}

:deep(.ant-input:hover),
:deep(.ant-input-password:hover) {
  border-color: #00c3ff;
}

:deep(.ant-input:focus),
:deep(.ant-input-password:focus),
:deep(.ant-input-affix-wrapper:focus),
:deep(.ant-input-affix-wrapper-focused) {
  border-color: #0086e6;
  box-shadow: 0 0 0 2px rgba(0, 134, 230, 0.2);
}

.register-form-footer {
  text-align: center;
  margin-top: 20px;
}

.register-form-footer a {
  color: #0086e6;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s;
}

.register-form-footer a:hover {
  color: #00c3ff;
  text-decoration: underline;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
