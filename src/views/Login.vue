<template>
  <div class="login-container">
    <div class="system-title">
      <h1>农产品价格追踪系统</h1>
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
      <p>© {{ new Date().getFullYear() }} 农产品价格追踪系统 - 保留所有权利</p>
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
  background-color: #f0f2f5;
  background-image: linear-gradient(120deg, #e0f7fa 0%, #f9fbe7 100%);
}

.system-title {
  text-align: center;
  margin-bottom: 24px;
}

.system-title h1 {
  color: #1890ff;
  font-size: 28px;
  margin-bottom: 8px;
}

.system-title p {
  color: #666;
  font-size: 16px;
}

.login-card {
  width: 400px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  margin-bottom: 24px;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.forgot-password {
  color: #1890ff;
  text-decoration: none;
}

.login-form-footer {
  text-align: center;
  margin-top: 16px;
}

.login-form-footer a {
  color: #1890ff;
  text-decoration: none;
}

.login-footer {
  margin-top: 24px;
  color: #888;
  font-size: 14px;
}
</style>
