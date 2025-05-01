import request from '@/utils/request'
import type { UserDashboard, AdminDashboard, DashboardResponse } from '@/types/dashboard'

/**
 * 获取用户仪表盘数据
 * @returns Promise 包含仪表盘数据的响应
 */
export const getUserDashboard = (): Promise<DashboardResponse> => {
  return request.get('/dashboard')
}

/**
 * 基于用户类型获取仪表盘数据
 * 如果是管理员，返回包含额外数据的管理员仪表盘
 *
 * @param userType 用户类型
 * @returns Promise 包含仪表盘数据的响应
 */
export const getDashboardByUserType = async (
  userType: string,
): Promise<UserDashboard | AdminDashboard | null> => {
  try {
    const response = await getUserDashboard()

    if (response.code === 200 && response.data) {
      console.log(`获取${userType}用户的仪表盘数据成功`)
      return response.data
    }
    return null
  } catch (error) {
    console.error(`获取${userType}用户的仪表盘数据失败:`, error)
    return null
  }
}

/**
 * 检查对象是否为管理员仪表盘
 * @param dashboard 仪表盘数据
 * @returns 是否为管理员仪表盘
 */
export const isAdminDashboard = (
  dashboard: UserDashboard | AdminDashboard,
): dashboard is AdminDashboard => {
  return 'total_users' in dashboard
}
