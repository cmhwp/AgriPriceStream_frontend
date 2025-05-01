<template>
  <div class="admin-user-create">
    <a-page-header title="创建管理员" sub-title="仅超级管理员可用">
      <template #extra>
        <a-button @click="goBack">
          <template #icon><arrow-left-outlined /></template>
          返回
        </a-button>
      </template>
    </a-page-header>

    <a-card :bordered="false">
      <a-form
        :model="formState"
        :rules="rules"
        ref="formRef"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 14 }"
      >
        <a-form-item label="用户名" name="username">
          <a-input v-model:value="formState.username" placeholder="请输入用户名" />
        </a-form-item>

        <a-form-item label="密码" name="password">
          <a-input-password v-model:value="formState.password" placeholder="请输入密码" />
        </a-form-item>

        <a-form-item label="确认密码" name="confirmPassword">
          <a-input-password
            v-model:value="formState.confirmPassword"
            placeholder="请再次输入密码"
          />
        </a-form-item>

        <a-form-item label="账号状态" name="is_active">
          <a-switch v-model:checked="formState.is_active" />
        </a-form-item>

        <a-form-item :wrapper-col="{ offset: 6, span: 14 }">
          <a-button type="primary" @click="submitForm" :loading="submitting">创建管理员</a-button>
          <a-button style="margin-left: 10px" @click="resetForm">重置</a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import { ArrowLeftOutlined } from '@ant-design/icons-vue'
import { createAdminUser } from '@/api/admin'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const submitting = ref(false)
const formRef = ref<FormInstance>()

// 表单状态
const formState = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  is_active: true,
  user_type: 'admin',
})

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应在3-20个字符之间', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string) => {
        if (value === formState.password) {
          return Promise.resolve()
        }
        return Promise.reject('两次输入的密码不一致')
      },
      trigger: 'blur',
    },
  ],
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 提交表单
const submitForm = async () => {
  try {
    await formRef.value?.validate()

    submitting.value = true

    // 提交数据
    const adminData = {
      username: formState.username,
      password: formState.password,
      is_active: formState.is_active,
      user_type: formState.user_type,
    }

    const res = await createAdminUser(adminData)

    if (res.code === 0 || res.code === 200) {
      message.success(res.message || '管理员创建成功')
      resetForm()
      // 创建成功后返回用户列表
      router.push('/users')
    } else {
      message.error(res.message || '管理员创建失败')
    }
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields()
}

// 检查是否为超级管理员
onMounted(() => {
  // 检查当前用户是否为超级管理员
  if (userStore.userInfo?.username !== 'admin') {
    message.error('只有超级管理员可以创建管理员账号')
    router.push('/dashboard')
  }
})
</script>

<style scoped>
.admin-user-create {
  padding: 0 16px;
}
</style>
