// Basic notification interface for UI display
export interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
  reference_id?: number
}

// Price notification subscription types
export interface PriceNotificationBase {
  vegetable_id: number
  threshold: number
}

// Adding additional properties for frontend usage if needed
export interface PriceNotificationCreate extends PriceNotificationBase {
  // Frontend property for UI validation
  send_email?: boolean
  // This extends the base with the same properties but is separated
  // to maintain API schema compatibility and allow for future extensions
}

export interface PriceNotificationResponse extends PriceNotificationBase {
  id: number
  user_id: number
  created_at: string
}

export interface NotificationWithVegetable extends PriceNotificationResponse {
  vegetable_name: string
  current_price?: number
  price_change?: number
  last_triggered?: string
}

// API response structure
export interface ApiResponse<T = any> {
  code: number
  message: string
  data?: T
}

// WebSocket message types
export interface WebSocketSubscribeMessage {
  action: 'subscribe'
  vegetable_id: number
}

export interface WebSocketUnsubscribeMessage {
  action: 'unsubscribe'
  vegetable_id: number
}

export interface WebSocketNotificationMessage {
  event: string
  vegetable_id?: number
  message: string
  data?: any
}

// 标记已读请求
export interface MarkReadRequest {
  notification_id?: string
  mark_all?: boolean
}

// 通知列表响应
export interface NotificationListResponse {
  notifications: Notification[]
  unread_count: number
}

// 通知类型枚举
export enum NotificationType {
  SYSTEM = 'system',
  PRICE_ALERT = 'price_alert',
  INFO = 'info'
}
