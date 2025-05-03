<template>
  <div class="profile-container">
    <a-page-header title="个人设置" sub-title="查看和修改您的个人信息">
      <template #extra>
        <a-button @click="router.push('/dashboard')">
          <template #icon><arrow-left-outlined /></template>
          返回首页
        </a-button>
            </template>
    </a-page-header>

        <a-card title="个人信息" class="profile-card">
          <a-tabs default-active-key="info">
            <a-tab-pane key="info" tab="基本信息">
              <a-descriptions :column="1" bordered>
                <a-descriptions-item label="用户名">
                  {{ userStore.userInfo?.username }}
                </a-descriptions-item>
                <a-descriptions-item label="用户类型">
              <a-tag :color="userStore.userInfo?.user_type === 'admin' ? 'blue' : 'green'">
                  {{ userStore.userInfo?.user_type === 'admin' ? '管理员' : '普通用户' }}
              </a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="注册时间">
                  {{ formatDate(userStore.userInfo?.created_at) }}
                </a-descriptions-item>
            <a-descriptions-item label="账户状态">
              <a-badge status="success" text="正常" />
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
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ArrowLeftOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import type { ChangePasswordParams } from '@/types/user'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)

// 组件挂载时获取用户信息
onMounted(async () => {
  if (!userStore.userInfo) {
    await userStore.getUserInfo()
  }
})

// 格式化日期
const formatDate = (dateString?: string) => {
  if (!dateString) return '未知'
  const date = new Date(dateString)
  return date.toLocaleString()
}

// 密码表单
const passwordForm = reactive<ChangePasswordParams>({
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
      message.success('密码修改成功')
    }
  } catch (error) {
    console.error('修改密码失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.profile-container {
  padding: 0 16px;
}

.profile-card {
  max-width: 800px;
  margin: 16px auto;
}
</style>
