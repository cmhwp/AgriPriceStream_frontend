import request from '@/utils/request'
import type {
  UserCreate,
  UserInfo,
  UserUpdate,
  Token,
  PasswordChange,
  ResponseModel,
} from '@/types'

/**
 * 用户登录
 * @param username 用户名
 * @param password 密码
 * @returns Token信息
 */
export const login = (username: string, password: string): Promise<ResponseModel<Token>> => {
  // 使用FormData格式发送请求，符合OAuth2标准
  const formData = new FormData()
  formData.append('username', username)
  formData.append('password', password)

  return request.post('/auth/login', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

/**
 * 用户登出
 * @returns 操作结果
 */
export const logout = (): Promise<ResponseModel<null>> => {
  return request.post('/auth/logout')
}

/**
 * 用户注册
 * @param userData 用户注册信息
 * @returns 注册成功的用户信息
 */
export const register = (userData: UserCreate): Promise<ResponseModel<UserInfo>> => {
  return request.post('/auth/register', userData)
}

/**
 * 获取当前登录用户信息
 * @returns 用户信息
 */
export const getUserInfo = (): Promise<ResponseModel<UserInfo>> => {
  return request.get('/auth/user-info')
}

/**
 * 修改密码
 * @param passwordData 密码修改信息
 * @returns 操作结果
 */
export const changePassword = (passwordData: PasswordChange): Promise<ResponseModel<null>> => {
  return request.post('/auth/change-password', passwordData)
}

// 以下是管理员接口

/**
 * 管理员创建用户
 * @param userData 用户创建信息
 * @returns 创建成功的用户信息
 */
export const adminCreateUser = (userData: UserCreate): Promise<ResponseModel<UserInfo>> => {
  return request.post('/auth/admin/create-user', userData)
}

/**
 * 管理员获取所有用户列表
 * @param skip 跳过条数
 * @param limit 获取条数
 * @returns 用户列表
 */
export const getAllUsers = (skip = 0, limit = 100): Promise<ResponseModel<UserInfo[]>> => {
  return request.get(`/auth/admin/users?skip=${skip}&limit=${limit}`)
}

/**
 * 管理员获取单个用户详情
 * @param userId 用户ID
 * @returns 用户详情
 */
export const getUserDetail = (userId: number): Promise<ResponseModel<UserInfo>> => {
  return request.get(`/auth/admin/users/${userId}`)
}

/**
 * 管理员更新用户信息
 * @param userId 用户ID
 * @param userData 更新数据
 * @returns 更新后的用户信息
 */
export const updateUser = (
  userId: number,
  userData: UserUpdate,
): Promise<ResponseModel<UserInfo>> => {
  return request.put(`/auth/admin/users/${userId}`, userData)
}

/**
 * 管理员删除用户
 * @param userId 用户ID
 * @returns 操作结果
 */
export const deleteUser = (userId: number): Promise<ResponseModel<null>> => {
  return request.delete(`/auth/admin/users/${userId}`)
}
