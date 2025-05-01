<template>
  <div class="profile-container">
    <a-layout>
      <a-layout-header class="header">
        <div class="logo">农产品价格追踪系统</div>
        <div class="user-info">
          <a-dropdown>
            <a class="user-dropdown" @click.prevent>
              {{ userStore.userInfo?.username }}
              <down-outlined />
            </a>
            <template #overlay>
              <a-menu>
                <a-menu-item key="dashboard">
                  <router-link to="/dashboard">返回首页</router-link>
                </a-menu-item>
                <a-menu-item key="logout" @click="handleLogout"> 退出登录 </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>
      <a-layout-content style="padding: 24px; min-height: calc(100vh - 64px)">
        <a-card title="个人信息" class="profile-card">
          <a-tabs default-active-key="info">
            <a-tab-pane key="info" tab="基本信息">
              <a-descriptions :column="1" bordered>
                <a-descriptions-item label="用户名">
                  {{ userStore.userInfo?.username }}
                </a-descriptions-item>
                <a-descriptions-item label="用户类型">
                  {{ userStore.userInfo?.user_type === 'admin' ? '管理员' : '普通用户' }}
                </a-descriptions-item>
                <a-descriptions-item label="注册时间">
                  {{ formatDate(userStore.userInfo?.created_at) }}
                </a-descriptions-item>
              </a-descriptions>
            </a-tab-pane>
            <a-tab-pane key="password" tab="修改密码">
              <a-form
                :model="passwordForm"
                :rules="passwordRules"
                @finish="handlePasswordChange"
                layout="vertical"
              >
                <a-form-item name="current_password" label="当前密码">
                  <a-input-password
                    v-model:value="passwordForm.current_password"
                    placeholder="请输入当前密码"
                  />
                </a-form-item>
                <a-form-item name="new_password" label="新密码">
                  <a-input-password
                    v-model:value="passwordForm.new_password"
                    placeholder="请输入新密码"
                  />
                </a-form-item>
                <a-form-item name="confirm_password" label="确认密码">
                  <a-input-password
                    v-model:value="passwordForm.confirm_password"
                    placeholder="请再次输入新密码"
                  />
                </a-form-item>
                <a-form-item>
                  <a-button type="primary" html-type="submit" :loading="loading">
                    保存修改
                  </a-button>
                </a-form-item>
              </a-form>
            </a-tab-pane>
          </a-tabs>
        </a-card>
      </a-layout-content>
    </a-layout>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { DownOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import type { PasswordChange } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)

// 格式化日期
const formatDate = (dateString?: string) => {
  if (!dateString) return '未知'
  const date = new Date(dateString)
  return date.toLocaleString()
}

// 密码表单
const passwordForm = reactive<PasswordChange>({
  current_password: '',
  new_password: '',
  confirm_password: '',
})

// 验证两次输入的密码是否一致
const validateConfirmPassword = async (_rule: any, value: string) => {
  if (value !== passwordForm.new_password) {
    throw new Error('两次输入的密码不一致')
  }
}

// 表单验证规则
const passwordRules = {
  current_password: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  new_password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' },
  ],
  confirm_password: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

// 修改密码
const handlePasswordChange = async () => {
  loading.value = true
  try {
    const success = await userStore.updatePassword(passwordForm)
    if (success) {
      // 清空表单
      passwordForm.current_password = ''
      passwordForm.new_password = ''
      passwordForm.confirm_password = ''
    }
  } catch (error) {
    console.error('修改密码失败:', error)
  } finally {
    loading.value = false
  }
}

// 退出登录
const handleLogout = async () => {
  await userStore.logout()
  message.success('退出成功')
  router.push('/auth/login')
}
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #001529;
  padding: 0 20px;
}

.logo {
  color: white;
  font-size: 18px;
  font-weight: bold;
}

.user-info {
  color: white;
}

.user-dropdown {
  color: white;
  cursor: pointer;
}

.profile-card {
  max-width: 800px;
  margin: 0 auto;
}
</style>
