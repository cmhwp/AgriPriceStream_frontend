<template>
  <a-layout class="layout">
    <a-layout-header class="header">
      <div class="logo">
        <div class="logo-text">智农价格通</div>
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="light"
        mode="horizontal"
        :style="{ lineHeight: '64px' }"
        @select="handleMenuSelect"
      >
        <a-menu-item key="dashboard">
          <dashboard-outlined />
          <span>数据总览</span>
        </a-menu-item>
        <a-menu-item key="vegetables">
          <shopping-outlined />
          <span>农产品列表</span>
        </a-menu-item>
        <a-menu-item key="predictions">
          <fund-outlined />
          <span>价格预测</span>
        </a-menu-item>
        <!-- 管理员专用菜单项 -->
        <template v-if="isAdmin">
          <a-menu-item key="users">
            <team-outlined />
            <span>用户管理</span>
          </a-menu-item>
          <a-menu-item key="crawler">
            <bug-outlined />
            <span>爬虫管理</span>
          </a-menu-item>
          <a-menu-item key="price-records">
            <file-text-outlined />
            <span>价格记录管理</span>
          </a-menu-item>
          <a-menu-item key="model-training">
            <thunderbolt-outlined />
            <span>模型训练管理</span>
          </a-menu-item>
          <a-menu-item key="model-evaluations">
            <line-chart-outlined />
            <span>模型评估记录</span>
          </a-menu-item>
        </template>
      </a-menu>

      <!-- 用户菜单，放在header而不是menu内部 -->
      <div class="user-menu">
        <a-popover placement="bottomRight" trigger="click">
          <template #content>
            <a-menu style="border: none; width: 160px">
              <a-menu-item key="user-profile" @click="handleMenuSelect({ key: 'profile' })">
                <template #icon><user-outlined /></template>
                个人设置
              </a-menu-item>
              <a-divider style="margin: 4px 0" />
              <a-menu-item key="user-logout" @click="handleLogout">
                <template #icon><logout-outlined /></template>
                退出登录
              </a-menu-item>
            </a-menu>
          </template>
          <div style="display: flex; align-items: center; cursor: pointer; color: #001529">
            <a-avatar :size="32" style="background-color: #1890ff">
              {{ userName.charAt(0).toUpperCase() }}
            </a-avatar>
            <span style="margin-left: 8px">{{ userName }}</span>
            <span v-if="isAdmin" style="margin-left: 4px">
              <a-tag color="red">管理员</a-tag>
            </span>
          </div>
        </a-popover>
      </div>
    </a-layout-header>

    <a-layout-content class="main-content">
      <a-breadcrumb style="margin: 16px 0">
        <a-breadcrumb-item>
          <router-link to="/dashboard">首页</router-link>
        </a-breadcrumb-item>

        <a-breadcrumb-item v-if="route.path !== '/dashboard'">
          <span
            v-if="route.path.includes('/vegetable/') || route.path.includes('/edit-vegetable/')"
          >
            <router-link to="/vegetables">农产品列表</router-link>
          </span>
          <span v-else>{{ currentPageTitle }}</span>
        </a-breadcrumb-item>

        <a-breadcrumb-item
          v-if="route.path.includes('/vegetable/') || route.path.includes('/edit-vegetable/')"
        >
          {{ route.path.includes('/edit-vegetable/') ? '编辑农产品' : '农产品详情' }}
        </a-breadcrumb-item>
      </a-breadcrumb>
      <div class="content-wrapper">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </a-layout-content>

    <a-layout-footer class="footer">
      智农价格通 ©2023 创新型农产品价格监测与预测平台
    </a-layout-footer>
  </a-layout>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  DashboardOutlined,
  ShoppingOutlined,
  LineChartOutlined,
  FundOutlined,
  UserOutlined,
  LogoutOutlined,
  TeamOutlined,
  BugOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons-vue'
import { useUserStore } from '@/stores/user'
import { UserType } from '@/types/user'

const router = useRouter()
const route = useRoute()
const selectedKeys = ref<string[]>(['dashboard'])
const userStore = useUserStore()
const userName = computed(() => userStore.userInfo?.username || '用户')

// 用户角色判断
const isAdmin = computed(() => userStore.userInfo?.user_type === UserType.ADMIN)

// 计算当前页面标题
const currentPageTitle = computed(() => {
  // 从路由元数据中获取标题
  if (route.meta.title) {
    return route.meta.title as string
  }

  // 后备方案：根据路径判断标题
  const path = route.path

  if (path === '/dashboard') {
    return '数据总览'
  } else if (path.includes('/vegetables')) {
    return '农产品列表'
  } else if (path.includes('/admin/price-records')) {
    return '价格记录管理'
  } else if (path.includes('/predictions')) {
    return '价格预测'
  } else if (path.includes('/models')) {
    return '模型训练'
  } else if (path.includes('/users')) {
    return '用户管理'
  } else if (path.includes('predict-model')) {
    return '模型预测管理'
  } else if (path.includes('model-training')) {
    return '模型训练管理'
  } else if (path.includes('model-evaluations')) {
    return '模型评估记录'
  } else if (path.includes('/profile')) {
    return '个人资料'
  }
  return '数据总览'
})

// 处理菜单选择
const handleMenuSelect = ({ key }: { key: string }) => {
  selectedKeys.value = [key]

  switch (key) {
    case 'dashboard':
      router.push('/dashboard')
      break
    case 'vegetables':
      router.push('/vegetables')
      break
    case 'predictions':
      router.push('/predictions')
      break
    case 'price-records':
      router.push('/admin/price-records')
      break
    case 'predict-model':
      router.push('/admin/predict-model')
      break
    case 'model-training':
      router.push('/admin/model-training')
      break
    case 'model-evaluations':
      router.push('/admin/model-evaluations')
      break
    case 'users':
      router.push('/admin/users')
      break
    case 'crawler':
      router.push('/admin/crawler')
      break
    case 'profile':
      router.push('/profile')
      break
  }
}

// 处理退出登录
const handleLogout = async () => {
  await userStore.logout()
  message.success('退出成功')
  router.push('/auth/login')
}

// 设置初始选中菜单项
const setInitialSelectedKey = () => {
  const path = route.path

  // 根据当前路径设置选中的菜单项
  if (path === '/dashboard') {
    selectedKeys.value = ['dashboard']
  } else if (path.includes('/vegetables')) {
    selectedKeys.value = ['vegetables']
  } else if (path.includes('/predictions')) {
    selectedKeys.value = ['predictions']
  } else if (path.includes('/users')) {
    selectedKeys.value = ['users']
  } else if (path.includes('/price-records')) {
    selectedKeys.value = ['price-records']
  } else if (path.includes('predict-model')) {
    selectedKeys.value = ['predict-model']
  } else if (path.includes('model-training')) {
    selectedKeys.value = ['model-training']
  } else if (path.includes('model-evaluations')) {
    selectedKeys.value = ['model-evaluations']
  } else if (path.includes('/profile')) {
    selectedKeys.value = ['profile']
  }
}

// 检查用户权限是否足以访问当前路由
const checkPermission = () => {
  const path = route.path
  // 管理员专属路径
  const adminPaths = [
    '/reports',
    '/models',
    '/users',
    '/data-import',
    '/data-export',
    '/data-correction',
    '/system',
  ]

  // 如果是管理员专属路径且用户不是管理员，重定向到dashboard
  if (!isAdmin.value && adminPaths.some((adminPath) => path.includes(adminPath))) {
    message.error('您没有权限访问该页面')
    router.push('/dashboard')
  }
}

// 监听路由变化，更新选中的菜单项
watch(
  () => route.path,
  () => {
    setInitialSelectedKey()
    checkPermission()
  },
)

// 组件挂载时初始化
onMounted(() => {
  setInitialSelectedKey()
  checkPermission()
})
</script>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.header {
  width: 100%;
  background-image: -moz-linear-gradient(0deg, rgb(163, 240, 255), rgb(204, 235, 255));
  background-image: -webkit-linear-gradient(0deg, rgb(163, 240, 255), rgb(204, 235, 255));
  background-image: linear-gradient(0deg, rgb(163, 240, 255), rgb(204, 235, 255));
  display: flex;
  align-items: center;
  padding: 0 24px;
  justify-content: space-between;
  box-shadow: 0 2px 10px rgba(0, 21, 41, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header :deep(.ant-menu) {
  flex: 1;
}

.logo {
  float: left;
  margin-right: 40px;
  display: flex;
  align-items: center;
  position: relative;
}

.logo::after {
  content: '';
  position: absolute;
  right: -20px;
  height: 24px;
  width: 1px;
  background: rgba(0, 21, 41, 0.1);
}

.logo-text {
  font-weight: 700;
  font-size: 22px;
  background: linear-gradient(to right, #0086e6, #00c3ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 10px rgba(0, 134, 230, 0.2);
  letter-spacing: 0.5px;
}

.user-menu {
  position: relative;
  margin-left: 24px;
  display: flex;
  align-items: center;
}

.main-content {
  padding: 0 50px;
  flex: 1;
}

.content-wrapper {
  padding: 24px;
  background: rgba(255, 255, 255, 0.8);
  min-height: 360px;
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 21, 41, 0.08);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  transition: all 0.3s ease;
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.footer {
  text-align: center;
  background-image: -moz-linear-gradient(0deg, rgb(163, 240, 255), rgb(204, 235, 255));
  background-image: -webkit-linear-gradient(0deg, rgb(163, 240, 255), rgb(204, 235, 255));
  background-image: linear-gradient(0deg, rgb(163, 240, 255), rgb(204, 235, 255));
  color: #001529;
  padding: 24px 50px;
}

/* 添加过渡动画样式 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
