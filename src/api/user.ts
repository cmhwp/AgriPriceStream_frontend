import request from '@/utils/request'
import type {
  UserInfo,
  UserCreateParams,
  UserUpdateParams,
  UserAdminUpdateParams,
  TokenResponse,
  ChangePasswordParams,
} from '@/types/user'

// API 响应类型
interface ApiResponse<T = any> {
  code: number
  message: string
  data?: T
}

// 注册新用户
export const register = (data: UserCreateParams): Promise<ApiResponse> => {
  return request.post('/users/register', data)
}

// 用户登录
export const login = (username: string, password: string): Promise<ApiResponse<TokenResponse>> => {
  const formData = new FormData()
  formData.append('username', username)
  formData.append('password', password)

  return request.post('/users/token', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

// 获取当前用户信息
export const getUserInfo = (): Promise<ApiResponse<UserInfo>> => {
  return request.get('/users/me')
}

// 更新当前用户信息
export const updateUser = (
  userId: number,
  data: UserUpdateParams,
): Promise<ApiResponse<UserInfo>> => {
  return request.put('/users/me', data)
}

// 更新用户密码
export const changePassword = (data: ChangePasswordParams): Promise<ApiResponse> => {
  return request.post('/users/change-password', data)
}

// 登出
export const logout = (): Promise<ApiResponse> => {
  return request.post('/users/logout')
}

// 管理员：获取所有用户
export const getAllUsers = (params?: {
  skip?: number
  limit?: number
}): Promise<ApiResponse<UserInfo[]>> => {
  return request.get('/users', { params })
}

// 管理员：获取特定用户
export const getUserById = (userId: number): Promise<ApiResponse<UserInfo>> => {
  return request.get(`/users/${userId}`)
}

// 管理员：更新用户权限
export const updateUserAdmin = (
  userId: number,
  data: UserAdminUpdateParams,
): Promise<ApiResponse<UserInfo>> => {
  return request.put(`/users/${userId}/admin`, data)
}
