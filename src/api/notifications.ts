import request from '@/utils/request'
import type {
  ApiResponse,
  PriceNotificationCreate,
  PriceNotificationResponse,
  NotificationWithVegetable,
  Notification,
  MarkReadRequest
} from '@/types/notifications'

/**
 * 获取当前用户的价格通知订阅
 * @returns Promise 包含用户所有通知订阅的响应
 */
export const getUserNotifications = (): Promise<ApiResponse<NotificationWithVegetable[]>> => {
  return request.get('/notifications/')
}

/**
 * 订阅蔬菜价格通知
 * @param notification 通知订阅参数
 * @returns Promise 包含创建结果的响应
 */
export const subscribeToNotification = (
  notification: PriceNotificationCreate,
): Promise<ApiResponse<PriceNotificationResponse>> => {
  return request.post('/notifications/subscribe', notification)
}

/**
 * 取消订阅蔬菜价格通知
 * @param notificationId 通知订阅ID
 * @returns Promise 包含取消结果的响应
 */
export const unsubscribeFromNotification = (notificationId: number): Promise<ApiResponse<any>> => {
  return request.delete(`/notifications/${notificationId}`)
}

/**
 * 手动检查满足阈值条件的价格通知
 * @returns Promise 包含满足条件的通知的响应
 */
export const checkPriceNotifications = (): Promise<ApiResponse<NotificationWithVegetable[]>> => {
  return request.get('/notifications/check')
}

/**
 * 获取用户通知列表
 * @param skip 跳过数量
 * @param limit 限制数量
 * @returns Promise 包含用户通知的响应
 */
export const getUserNotificationList = (
  skip: number = 0,
  limit: number = 50
): Promise<ApiResponse<{ notifications: Notification[]; unread_count: number }>> => {
  return request.get(`/notifications/user?skip=${skip}&limit=${limit}`)
}

/**
 * 标记通知为已读
 * @param data 请求数据
 * @returns Promise 包含操作结果的响应
 */
export const markNotificationAsRead = (data: MarkReadRequest): Promise<ApiResponse<any>> => {
  return request.post('/notifications/user/read', data)
}

/**
 * 删除用户通知
 * @param notificationId 通知ID
 * @returns Promise 包含操作结果的响应
 */
export const deleteUserNotification = (notificationId: string): Promise<ApiResponse<any>> => {
  return request.delete(`/notifications/user/${notificationId}`)
}

/**
 * 触发价格通知检查（仅管理员）
 * @returns Promise 包含操作结果的响应
 */
export const triggerPriceCheck = (): Promise<ApiResponse<any>> => {
  return request.post('/notifications/trigger-check')
}
