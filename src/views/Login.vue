<template>
  <div class="login-container">
    <div class="system-title">
      <h1>智农价格通</h1>
      <p>实时获取与分析蔬菜价格数据</p>
    </div>
    <a-card title="用户登录" class="login-card">
      <a-form
        :model="loginForm"
        :rules="rules"
        @finish="handleSubmit"
        @finishFailed="onFinishFailed"
        layout="vertical"
      >
        <a-form-item name="username" label="用户名">
          <a-input
            v-model:value="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            prefix-icon="user"
          >
            <template #prefix>
              <user-outlined />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item name="password" label="密码">
          <a-input-password
            v-model:value="loginForm.password"
            placeholder="请输入密码"
            size="large"
          >
            <template #prefix>
              <lock-outlined />
            </template>
          </a-input-password>
        </a-form-item>

        <a-form-item>
          <div class="login-options">
            <a-checkbox v-model:checked="loginForm.remember">记住我</a-checkbox>
            <a href="#" class="forgot-password">忘记密码？</a>
          </div>
        </a-form-item>

        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="loading" block size="large">
            登录
          </a-button>
        </a-form-item>

        <div class="login-form-footer">
          <router-link to="/auth/register">没有账号？前往注册</router-link>
        </div>
      </a-form>
    </a-card>

    <div class="login-footer">
      <p>© {{ new Date().getFullYear() }} 智农价格通 - 保留所有权利</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'
import { useUserStore } from '@/stores/user'
import type { LoginParams } from '@/types/user'
import { UserType } from '@/types/user'

interface LoginFormState extends LoginParams {
  remember: boolean
}

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const loading = ref(false)
const errorMsg = ref('')

const loginForm = reactive<LoginFormState>({
  username: '',
  password: '',
  remember: true,
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名至少3个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' },
  ],
}

// 检查是否有重定向信息
onMounted(() => {
  if (route.params.showRedirectMessage === 'true') {
    message.info('请先登录以访问该页面')
  }

  // 检查localStorage是否有记住的用户名
  const rememberedUsername = localStorage.getItem('rememberedUsername')
  if (rememberedUsername) {
    loginForm.username = rememberedUsername
  }
})

const handleSubmit = async () => {
  errorMsg.value = ''
  loading.value = true

  try {
    const success = await userStore.login({
      username: loginForm.username,
      password: loginForm.password,
    })

    if (success) {
      // 记住用户名
      if (loginForm.remember) {
        localStorage.setItem('rememberedUsername', loginForm.username)
      } else {
        localStorage.removeItem('rememberedUsername')
      }

      // 如果有重定向地址，跳转到之前尝试访问的页面
      const redirect = route.query.redirect as string
      if (redirect) {
        router.push(redirect)
      } else {
        // 根据用户角色跳转到不同页面
        const userType = userStore.userInfo?.user_type
        if (userType === UserType.ADMIN) {
          router.push('/admin/dashboard')
        } else {
          router.push('/dashboard')
        }
      }
    } else {
      errorMsg.value = '登录失败，请检查用户名和密码'
    }
  } catch (error: any) {
    console.error('登录失败:', error)
    // 检查是否有响应数据中的错误信息
    if (error.response?.data?.message) {
      errorMsg.value = error.response.data.message
    } else {
      errorMsg.value = '登录失败，请检查用户名和密码或网络连接'
    }

    message.error(errorMsg.value)
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
.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.login-container::before {
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

.system-title p {
  color: #555;
  font-size: 16px;
  max-width: 350px;
  margin: 0 auto;
}

.login-card {
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

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.forgot-password {
  color: #0086e6;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s;
}

.forgot-password:hover {
  color: #00c3ff;
  text-decoration: underline;
}

.login-form-footer {
  text-align: center;
  margin-top: 20px;
}

.login-form-footer a {
  color: #0086e6;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s;
}

.login-form-footer a:hover {
  color: #00c3ff;
  text-decoration: underline;
}

.login-footer {
  margin-top: 30px;
  color: #666;
  font-size: 14px;
  animation: fadeIn 1.2s ease-out;
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
