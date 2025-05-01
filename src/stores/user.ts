import { defineStore } from 'pinia'
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import * as authApi from '@/api/auth'
import type { UserInfo as UserInfoType } from '@/types'

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfoType | null>(null)
  const isLoggedIn = ref<boolean>(!!token.value)

  // 获取用户信息
  const getUserInfo = async () => {
    try {
      const response = await authApi.getUserInfo()
      if (response.code === 200 && response.data) {
        userInfo.value = response.data
        return response.data
      }
      return null
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return null
    }
  }

  // 登录
  const login = async (credentials: { username: string; password: string }) => {
    try {
      const response = await authApi.login(credentials.username, credentials.password)

      if (response.code === 200 && response.data) {
        const tokenData = response.data
        token.value = tokenData.access_token
        localStorage.setItem('token', tokenData.access_token)
        isLoggedIn.value = true

        // 登录后获取用户信息
        await getUserInfo()
        message.success('登录成功')
        return true
      }
      return false
    } catch (error) {
      console.error('登录失败:', error)
      return false
    }
  }

  // 登出
  const logout = async (skipApi = false) => {
    if (!skipApi) {
      try {
        // 调用登出API
        await authApi.logout()
      } catch (error) {
        console.error('登出请求失败:', error)
      }
    }

    // 清除状态
    token.value = ''
    userInfo.value = null
    isLoggedIn.value = false
    localStorage.removeItem('token')
  }

  // 更新用户信息
  const updateUserInfo = async (updates: Partial<UserInfoType>) => {
    try {
      // 假设当前用户可以更新自己的信息
      if (userInfo.value) {
        const response = await authApi.updateUser(userInfo.value.id, updates)
        if (response.code === 200 && response.data) {
          userInfo.value = response.data
          message.success('个人信息更新成功')
          return true
        }
      }
      return false
    } catch (error) {
      console.error('更新用户信息失败:', error)
      return false
    }
  }

  // 更新密码
  const updatePassword = async (data: {
    current_password: string
    new_password: string
    confirm_password: string
  }) => {
    try {
      const response = await authApi.changePassword(data)
      if (response.code === 200) {
        message.success('密码更新成功')
        return true
      }
      return false
    } catch (error) {
      console.error('更新密码失败:', error)
      return false
    }
  }

  // 注册用户
  const register = async (userData: { username: string; password: string }) => {
    try {
      const response = await authApi.register({
        username: userData.username,
        password: userData.password,
      })

      if (response.code === 200) {
        message.success('注册成功，请登录')
        return true
      }
      return false
    } catch (error) {
      console.error('注册失败:', error)
      return false
    }
  }

  return {
    // 状态
    token,
    userInfo,
    isLoggedIn,

    // 方法
    login,
    logout,
    getUserInfo,
    updateUserInfo,
    updatePassword,
    register,
  }
})
