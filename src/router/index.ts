import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { message } from 'ant-design-vue'

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
          meta: { requiresAuth: false },
        },
        {
          path: 'register',
          name: 'Register',
          component: () => import('@/views/Register.vue'),
          meta: { requiresAuth: false },
        },
      ],
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('@/views/Dashboard.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/dashboard',
      name: 'AdminDashboard',
      component: () => import('@/views/admin/Dashboard.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('@/views/Profile.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFound.vue'),
    },
  ],
})

// 导航守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  const isAuthenticated = userStore.isLoggedIn
  const requiresAuth = to.meta.requiresAuth as boolean
  const requiresAdmin = to.meta.requiresAdmin as boolean

  // 对于不需要认证的路由，直接通过
  if (!requiresAuth) {
    // 已登录用户尝试访问登录/注册页，重定向到首页
    if ((to.path === '/auth/login' || to.path === '/auth/register') && isAuthenticated) {
      return next({ name: 'Dashboard' })
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
  if (requiresAdmin && userStore.userInfo?.user_type !== 'admin') {
    message.error('无权访问管理员页面')
    return next({ name: 'Dashboard' })
  }

  // 其他情况正常通过
  next()
})

export default router
