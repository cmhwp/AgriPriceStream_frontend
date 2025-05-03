export enum UserType {
  ADMIN = "admin",
  USER = "user"
}

export interface UserInfo {
  id: number
  username: string
  user_type: string
  created_at: string
  is_active: boolean
}

export interface UserCreateParams {
  username: string
  password: string
}

export interface UserUpdateParams {
  username?: string
  password?: string
}

export interface UserAdminUpdateParams {
  user_type?: string
  is_active?: boolean
}

export interface LoginParams {
  username: string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface ChangePasswordParams {
  current_password: string
  new_password: string
  confirm_password: string
}

// 分页响应接口
export interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

// 用户分页数据
export type PaginatedUsers = PaginatedData<UserInfo>
