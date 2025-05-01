<template>
  <div class="not-found">
    <a-result status="404" title="404" sub-title="抱歉，您访问的页面不存在">
      <template #extra>
        <a-button type="primary" @click="backHome"> 返回首页 </a-button>
      </template>
    </a-result>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const backHome = () => {
  if (userStore.isLoggedIn) {
    router.push('/dashboard')
  } else {
    router.push('/auth/login')
  }
}
</script>

<style scoped>
.not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
</style>
