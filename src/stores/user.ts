import { defineStore } from 'pinia'
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import * as userApi from '@/api/user'
import type { UserInfo as UserInfoType, UserUpdateParams, ChangePasswordParams } from '@/types/user'

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfoType | null>(null)
  const isLoggedIn = ref<boolean>(!!token.value)

  // 获取用户信息
  const getUserInfo = async () => {
    try {
      const response = await userApi.getUserInfo()
      if (response.code === 200 && response.data) {
        userInfo.value = response.data as UserInfoType
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
      const response = await userApi.login(credentials.username, credentials.password)

      // 检查响应状态
      if (response.code === 200 && response.data && response.data.access_token) {
        const tokenData = response.data
        token.value = tokenData.access_token
        localStorage.setItem('token', tokenData.access_token)
        isLoggedIn.value = true

        // 登录后获取用户信息
        await getUserInfo()
        message.success('登录成功')
        return true
      } else {
        // 处理业务逻辑错误
        message.error(response.message || '登录失败，请检查用户名和密码')
        return false
      }
    } catch (error) {
      console.error('登录失败:', error)
      // 错误已被响应拦截器处理，这里不需要再显示
      return false
    }
  }

  // 登出
  const logout = async (skipApi = false) => {
    if (!skipApi) {
      try {
        // 调用登出API
        await userApi.logout()
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
  const updateUserInfo = async (updates: UserUpdateParams) => {
    try {
      // 确保用户已登录并有ID
      if (userInfo.value) {
        const response = await userApi.updateUser(userInfo.value.id, updates)
        if (response.code === 200 && response.data) {
          userInfo.value = response.data as UserInfoType
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
  const updatePassword = async (data: ChangePasswordParams) => {
    try {
      const response = await userApi.changePassword(data)
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
      const response = await userApi.register({
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
