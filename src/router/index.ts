import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { message } from 'ant-design-vue'
import { UserType } from '@/types/user'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/auth',
      component: () => import('@/layouts/AuthLayout.vue'),
      children: [
        {
          path: 'login',
          name: 'Login',
          component: () => import('@/views/Login.vue'),
          meta: { requiresAuth: false, title: '登录' },
        },
        {
          path: 'register',
          name: 'Register',
          component: () => import('@/views/Register.vue'),
          meta: { requiresAuth: false, title: '注册' },
        },
      ],
    },
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/Dashboard.vue'),
          meta: { title: '价格概览' },
        },
        {
          path: 'vegetables',
          name: 'Vegetables',
          component: () => import('@/views/VegetablesView.vue'),
          meta: { title: '蔬菜列表' },
        },
        {
          path: 'vegetables/:id',
          name: 'VegetableDetail',
          component: () => import('@/views/VegetableDetail.vue'),
          meta: { title: '蔬菜详情' },
        },
        {
          path: 'predictions',
          name: 'PricePrediction',
          component: () => import('@/views/PricePrediction.vue'),
          meta: { title: '价格预测' },
        },
        {
          path: 'profile',
          name: 'profile',
          component: ()=>import('@/views/Profile.vue')
        }
      ],
    },
    {
      path: '/admin',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        {
          path: 'dashboard',
          name: 'AdminDashboard',
          component: () => import('@/views/Dashboard.vue'),
          meta: { title: '管理员仪表盘', requiresAdmin: true },
        },
        {
          path: 'users',
          name: 'UserManagement',
          component: () => import('@/views/UserManagement.vue'),
          meta: { title: '用户管理', requiresAdmin: true },
        },
        {
          path: 'price-records',
          name: 'PriceRecords',
          component: () => import('@/views/admin/PriceRecords.vue'),
          meta: { title: '价格记录管理', requiresAdmin: true },
        },
        {
          path: 'model-training',
          name: 'ModelTraining',
          component: () => import('@/views/admin/ModelTraining.vue'),
          meta: { title: '模型训练管理', requiresAdmin: true },
        },
        {
          path: 'settings',
          name: 'SystemSettings',
          component: () => import('@/views/SystemSettings.vue'),
          meta: { title: '系统设置', requiresAdmin: true },
        },
        {
          path: 'create-admin',
          name: 'AdminUserCreate',
          component: () => import('@/views/AdminUserCreate.vue'),
          meta: { title: '创建管理员', requiresAdmin: true },
        },
        {
          path: 'crawler',
          name: 'CrawlerManagement',
          component: () => import('@/views/CrawlerManagement.vue'),
          meta: { title: '爬虫管理', requiresAdmin: true },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFound.vue'),
      meta: { title: '页面未找到' },
    },
  ],
})

// 导航守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  const isAuthenticated = userStore.isLoggedIn
  const requiresAuth = to.meta.requiresAuth !== false // 默认需要认证
  const requiresAdmin = to.meta.requiresAdmin === true

  // 对于不需要认证的路由，直接通过
  if (!requiresAuth) {
    // 已登录用户尝试访问登录/注册页，重定向到首页
    if ((to.path === '/auth/login' || to.path === '/auth/register') && isAuthenticated) {
      return next({ path: '/dashboard' })
    }
    return next()
  }

  // 以下是需要认证的路由

  // 如果未登录，重定向到登录页面并保存重定向信息
  if (!isAuthenticated) {
    message.warning('请先登录')
    return next({
      name: 'Login',
      query: { redirect: to.fullPath },
      params: { showRedirectMessage: 'true' },
    })
  }

  // 如果已登录但没有用户信息，尝试获取用户信息
  if (!userStore.userInfo) {
    try {
      await userStore.getUserInfo()
    } catch (error) {
      console.error('获取用户信息失败', error)
      message.error('登录信息已过期，请重新登录')
      // 如果获取用户信息失败，可能是token过期，登出用户
      userStore.logout(true)
      return next({
        name: 'Login',
        query: { redirect: to.fullPath },
      })
    }
  }

  // 需要管理员权限但不是管理员
  if (requiresAdmin && userStore.userInfo?.user_type !== UserType.ADMIN) {
    message.error('无权访问管理员页面')
    return next({ path: '/dashboard' })
  }

  // 其他情况正常通过
  next()
})

export default router
