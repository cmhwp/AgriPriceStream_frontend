<template>
  <a-layout style="min-height: 100vh">
    <a-layout-sider v-model:collapsed="collapsed" collapsible :trigger="null" width="240">
      <div
        class="logo"
        style="
          height: 32px;
          margin: 16px;
          color: white;
          font-size: 18px;
          font-weight: bold;
          text-align: center;
        "
      >
        农产品价格系统
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="inline"
        @select="handleMenuSelect"
      >
        <!-- 共用菜单项 -->
        <a-menu-item key="dashboard">
          <dashboard-outlined />
          <span>价格概览</span>
        </a-menu-item>
        <a-menu-item key="vegetables">
          <shopping-outlined />
          <span>农产品列表</span>
        </a-menu-item>
        <a-menu-item key="prices">
          <line-chart-outlined />
          <span>价格趋势</span>
        </a-menu-item>

        <!-- 基本用户菜单项 -->
        <a-menu-item key="predictions">
          <fund-outlined />
          <span>价格预测</span>
        </a-menu-item>
        <a-menu-item key="alerts">
          <alert-outlined />
          <span>价格预警</span>
        </a-menu-item>

        <!-- 管理员专用菜单项 -->
        <template v-if="isAdmin">
          <a-menu-item key="reports">
            <file-text-outlined />
            <span>报表中心</span>
          </a-menu-item>
          <a-menu-item key="models">
            <experiment-outlined />
            <span>模型训练</span>
          </a-menu-item>
          <a-menu-item key="users">
            <team-outlined />
            <span>用户管理</span>
          </a-menu-item>
          <a-menu-item key="crawler">
            <bug-outlined />
            <span>爬虫管理</span>
          </a-menu-item>
          <a-sub-menu key="data-tools">
            <template #title>
              <span>
                <tool-outlined />
                <span>数据工具</span>
              </span>
            </template>
            <a-menu-item key="data-import">数据导入</a-menu-item>
            <a-menu-item key="data-export">数据导出</a-menu-item>
            <a-menu-item key="data-correction">数据校正</a-menu-item>
          </a-sub-menu>
          <a-menu-item key="system">
            <setting-outlined />
            <span>系统设置</span>
          </a-menu-item>
        </template>
      </a-menu>
    </a-layout-sider>

    <a-layout>
      <a-layout-header
        style="
          background: #fff;
          padding: 0 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        "
      >
        <div style="display: flex; align-items: center">
          <menu-unfold-outlined
            v-if="collapsed"
            class="trigger"
            style="font-size: 18px; cursor: pointer; margin-right: 16px"
            @click="collapsed = !collapsed"
          />
          <menu-fold-outlined
            v-else
            class="trigger"
            style="font-size: 18px; cursor: pointer; margin-right: 16px"
            @click="collapsed = !collapsed"
          />
          <span style="font-size: 18px; font-weight: bold">{{ currentPageTitle }}</span>
        </div>
        <div style="display: flex; align-items: center">
          <a-badge :count="unreadCount" :dot="unreadCount > 0">
            <a-button shape="circle" @click="showNotifications = true">
              <template #icon>
                <bell-outlined />
              </template>
            </a-button>
          </a-badge>

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
            <div style="margin-left: 16px; display: flex; align-items: center; cursor: pointer">
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

      <a-layout-content style="margin: 16px">
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
        <div style="padding: 24px; background: #fff; min-height: 360px">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </a-layout-content>

      <a-layout-footer style="text-align: center">
        农产品价格追踪系统 ©2023 创新型农产品价格监测与预测平台
      </a-layout-footer>
    </a-layout>

    <!-- 通知抽屉组件 -->
    <notification-drawer
      v-model:open="showNotifications"
      :loading="loading"
      :notifications="notifications"
      @mark-read="handleMarkAsRead"
      @mark-all-read="handleMarkAllAsRead"
      @delete="handleDeleteNotification"
    />
  </a-layout>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  DashboardOutlined,
  ShoppingOutlined,
  LineChartOutlined,
  FundOutlined,
  AlertOutlined,
  FileTextOutlined,
  ToolOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  BellOutlined,
  TeamOutlined,
  ExperimentOutlined,
  SettingOutlined,
  BugOutlined,
} from '@ant-design/icons-vue'
import { useUserStore } from '@/stores/user'
import { useNotificationService } from '@/services/notification'
import type { Notification } from '@/services/notification'
import { UserType } from '@/types/user'
import NotificationDrawer from '@/components/NotificationDrawer.vue'

const router = useRouter()
const route = useRoute()
const collapsed = ref<boolean>(false)
const selectedKeys = ref<string[]>(['dashboard'])
const userStore = useUserStore()
const userName = computed(() => userStore.userInfo?.username || '用户')

// 用户角色判断
const isAdmin = computed(() => userStore.userInfo?.user_type === UserType.ADMIN)

// 通知相关
const showNotifications = ref<boolean>(false)
const notificationService = useNotificationService()
const notifications = ref<Notification[]>([])
const unreadCount = ref<number>(0)
const loading = ref<boolean>(false)

// 计算当前页面标题
const currentPageTitle = computed(() => {
  // 从路由元数据中获取标题
  if (route.meta.title) {
    return route.meta.title as string
  }

  // 后备方案：根据路径判断标题
  const path = route.path

  if (path === '/dashboard') {
    return '价格概览'
  } else if (path.includes('/vegetables')) {
    return '农产品列表'
  } else if (path.includes('/prices')) {
    return '价格趋势'
  } else if (path.includes('/predictions')) {
    return '价格预测'
  } else if (path.includes('/alerts')) {
    return '价格预警'
  } else if (path.includes('/reports')) {
    return '报表中心'
  } else if (path.includes('/models')) {
    return '模型训练'
  } else if (path.includes('/users')) {
    return '用户管理'
  } else if (path.includes('/data-import')) {
    return '数据导入'
  } else if (path.includes('/data-export')) {
    return '数据导出'
  } else if (path.includes('/data-correction')) {
    return '数据校正'
  } else if (path.includes('/system')) {
    return '系统设置'
  } else if (path.includes('/profile')) {
    return '个人资料'
  }

  return '价格概览'
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
    case 'prices':
      router.push('/prices')
      break
    case 'predictions':
      router.push('/predictions')
      break
    case 'alerts':
      router.push('/alerts')
      break
    case 'reports':
      router.push('/reports')
      break
    case 'models':
      router.push('/models')
      break
    case 'users':
      router.push('/admin/users')
      break
    case 'crawler':
      router.push('/admin/crawler')
      break
    case 'data-import':
      router.push('/data-import')
      break
    case 'data-export':
      router.push('/data-export')
      break
    case 'data-correction':
      router.push('/data-correction')
      break
    case 'system':
      router.push('/admin/settings')
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

// 处理通知相关事件
const handleMarkAsRead = async (id: string) => {
  await notificationService.markAsRead(id)
  updateLocalNotificationData()
}

const handleMarkAllAsRead = async () => {
  await notificationService.markAllAsRead()
  updateLocalNotificationData()
}

const handleDeleteNotification = async (id: string) => {
  await notificationService.deleteNotification(id)
  updateLocalNotificationData()
}

// 更新组件中的本地通知数据
const updateLocalNotificationData = () => {
  notifications.value = [...notificationService.notifications.value]
  unreadCount.value = notificationService.unreadCount.value
  loading.value = notificationService.loadingNotifications.value
}

// 设置初始选中菜单项
const setInitialSelectedKey = () => {
  const path = route.path

  // 根据当前路径设置选中的菜单项
  if (path === '/dashboard') {
    selectedKeys.value = ['dashboard']
  } else if (path.includes('/vegetables')) {
    selectedKeys.value = ['vegetables']
  } else if (path.includes('/prices')) {
    selectedKeys.value = ['prices']
  } else if (path.includes('/predictions')) {
    selectedKeys.value = ['predictions']
  } else if (path.includes('/alerts')) {
    selectedKeys.value = ['alerts']
  } else if (path.includes('/reports')) {
    selectedKeys.value = ['reports']
  } else if (path.includes('/models')) {
    selectedKeys.value = ['models']
  } else if (path.includes('/users')) {
    selectedKeys.value = ['users']
  } else if (path.includes('/data-import')) {
    selectedKeys.value = ['data-import']
  } else if (path.includes('/data-export')) {
    selectedKeys.value = ['data-export']
  } else if (path.includes('/data-correction')) {
    selectedKeys.value = ['data-correction']
  } else if (path.includes('/system')) {
    selectedKeys.value = ['system']
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

// 监听通知数据变化
watch(
  () => notificationService.notifications.value,
  () => {
    updateLocalNotificationData()
  },
  { deep: true },
)

watch(
  () => notificationService.unreadCount.value,
  () => {
    unreadCount.value = notificationService.unreadCount.value
  },
)

watch(
  () => notificationService.loadingNotifications.value,
  () => {
    loading.value = notificationService.loadingNotifications.value
  },
)

// 组件挂载时初始化
onMounted(() => {
  // 初始化通知服务，返回的是清理函数
  const cleanupNotifications = notificationService.initialize()
  updateLocalNotificationData()
  setInitialSelectedKey()
  checkPermission()

  // 组件卸载时清理
  onUnmounted(() => {
    cleanupNotifications()
  })
})
</script>

<style scoped>
.logo {
  margin: 16px;
  color: white;
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.trigger {
  font-size: 18px;
  cursor: pointer;
  transition: color 0.3s;
}

.trigger:hover {
  color: #1890ff;
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
