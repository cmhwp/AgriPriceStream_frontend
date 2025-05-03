import { ref, reactive } from 'vue'
import { message } from 'ant-design-vue'
import type {
  Notification,
  PriceNotificationCreate,
  NotificationWithVegetable,
  WebSocketSubscribeMessage,
  WebSocketUnsubscribeMessage,
  WebSocketNotificationMessage,
} from '@/types/notifications'
import * as notificationsApi from '@/api/notifications'
import { useUserStore } from '@/stores/user'

// 模拟数据，实际应用中应该从API获取
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: '系统通知',
    message: '欢迎使用农产品价格追踪系统',
    type: 'system',
    is_read: true,
    created_at: '2023-05-20T10:00:00',
  },
  {
    id: '2',
    title: '价格预警',
    message: '西红柿价格上涨了10%',
    type: 'price_alert',
    is_read: false,
    created_at: '2023-05-21T09:30:00',
  },
  {
    id: '3',
    title: '数据更新',
    message: '系统已更新最新的价格数据',
    type: 'system',
    is_read: false,
    created_at: '2023-05-22T08:15:00',
  },
]

// WebSocket连接URL
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000/notifications/ws'

export function useNotificationService() {
  const notifications = ref<Notification[]>([])
  const priceSubscriptions = ref<NotificationWithVegetable[]>([])
  const loadingNotifications = ref<boolean>(false)
  const loadingSubscriptions = ref<boolean>(false)
  const unreadCount = ref<number>(0)

  // WebSocket连接
  let socket: WebSocket | null = null
  let reconnectAttempts = 0
  const maxReconnectAttempts = 5
  const reconnectDelay = 3000

  // 获取系统通知列表
  const fetchNotifications = async () => {
    loadingNotifications.value = true
    try {
      // 模拟API请求 - 实际项目中替换为真实API
      await new Promise((resolve) => setTimeout(resolve, 500))
      notifications.value = [...mockNotifications]

      // 更新未读通知数量
      updateUnreadCount()
    } catch (error) {
      console.error('获取通知失败:', error)
      message.error('获取通知列表失败')
    } finally {
      loadingNotifications.value = false
    }
  }

  // 获取价格订阅通知
  const fetchPriceSubscriptions = async () => {
    loadingSubscriptions.value = true
    try {
      const response = await notificationsApi.getUserNotifications()
      if (response.code === 0 && response.data) {
        priceSubscriptions.value = response.data
      }
    } catch (error) {
      console.error('获取价格订阅通知失败:', error)
      message.error('获取价格订阅通知失败')
    } finally {
      loadingSubscriptions.value = false
    }
  }

  // 订阅价格通知
  const subscribeToPriceNotification = async (notification: PriceNotificationCreate) => {
    try {
      const response = await notificationsApi.subscribeToNotification(notification)
      if (response.code === 0 && response.data) {
        message.success('订阅成功')
        // 刷新订阅列表
        await fetchPriceSubscriptions()

        // WebSocket订阅
        if (socket && socket.readyState === WebSocket.OPEN) {
          const subscribeMsg: WebSocketSubscribeMessage = {
            action: 'subscribe',
            vegetable_id: notification.vegetable_id,
          }
          socket.send(JSON.stringify(subscribeMsg))
        }

        return true
      }
      return false
    } catch (error) {
      console.error('订阅价格通知失败:', error)
      message.error('订阅价格通知失败')
      return false
    }
  }

  // 取消价格通知订阅
  const unsubscribeFromPriceNotification = async (id: number, vegetableId: number) => {
    try {
      const response = await notificationsApi.unsubscribeFromNotification(id)
      if (response.code === 0) {
        message.success('取消订阅成功')
        // 刷新订阅列表
        await fetchPriceSubscriptions()

        // WebSocket取消订阅
        if (socket && socket.readyState === WebSocket.OPEN) {
          const unsubscribeMsg: WebSocketUnsubscribeMessage = {
            action: 'unsubscribe',
            vegetable_id: vegetableId,
          }
          socket.send(JSON.stringify(unsubscribeMsg))
        }

        return true
      }
      return false
    } catch (error) {
      console.error('取消订阅失败:', error)
      message.error('取消订阅失败')
      return false
    }
  }

  // 更新未读通知数量
  const updateUnreadCount = () => {
    unreadCount.value = notifications.value.filter((n) => !n.is_read).length
  }

  // 标记通知为已读
  const markAsRead = async (id: string) => {
    try {
      // 模拟API请求
      await new Promise((resolve) => setTimeout(resolve, 300))

      const notification = notifications.value.find((n) => n.id === id)
      if (notification) {
        notification.is_read = true
        updateUnreadCount()
        message.success('已标记为已读')
        return true
      }
      return false
    } catch (error) {
      console.error('标记通知失败:', error)
      message.error('标记通知失败')
      return false
    }
  }

  // 标记所有通知为已读
  const markAllAsRead = async () => {
    try {
      // 模拟API请求
      await new Promise((resolve) => setTimeout(resolve, 300))

      notifications.value.forEach((n) => {
        n.is_read = true
      })

      updateUnreadCount()
      message.success('已将所有通知标记为已读')
      return true
    } catch (error) {
      console.error('标记所有通知失败:', error)
      message.error('标记所有通知失败')
      return false
    }
  }

  // 删除通知
  const deleteNotification = async (id: string) => {
    try {
      // 模拟API请求
      await new Promise((resolve) => setTimeout(resolve, 300))

      const index = notifications.value.findIndex((n) => n.id === id)
      if (index !== -1) {
        notifications.value.splice(index, 1)
        updateUnreadCount()
        message.success('通知已删除')
        return true
      }
      return false
    } catch (error) {
      console.error('删除通知失败:', error)
      message.error('删除通知失败')
      return false
    }
  }

  // 初始化WebSocket连接
  const initWebSocket = () => {
    const userStore = useUserStore()
    if (!userStore.isLoggedIn) {
      console.log('用户未登录，不创建WebSocket连接')
      return
    }

    try {
      socket = new WebSocket(`${WS_URL}?token=${userStore.token}`)

      socket.onopen = () => {
        console.log('WebSocket连接已建立')
        reconnectAttempts = 0

        // 重新订阅已有的蔬菜价格通知
        priceSubscriptions.value.forEach((sub) => {
          const subscribeMsg: WebSocketSubscribeMessage = {
            action: 'subscribe',
            vegetable_id: sub.vegetable_id,
          }
          socket?.send(JSON.stringify(subscribeMsg))
        })
      }

      socket.onmessage = (event) => {
        try {
          const data: WebSocketNotificationMessage = JSON.parse(event.data)

          // 处理不同类型的WebSocket消息
          if (data.event === 'price_alert') {
            // 创建一个新的系统通知
            const newNotification: Notification = {
              id: Date.now().toString(),
              title: '价格提醒',
              message: data.message,
              type: 'price_alert',
              is_read: false,
              created_at: new Date().toISOString(),
            }

            notifications.value.unshift(newNotification)
            updateUnreadCount()

            // 可以显示一个消息提示
            message.info(data.message)
          }

          // 其他事件类型处理...
        } catch (e) {
          console.error('处理WebSocket消息失败:', e)
        }
      }

      socket.onclose = (event) => {
        console.log('WebSocket连接已关闭:', event.code, event.reason)
        socket = null

        // 尝试重新连接
        if (reconnectAttempts < maxReconnectAttempts) {
          setTimeout(() => {
            reconnectAttempts++
            console.log(`尝试重新连接WebSocket (${reconnectAttempts}/${maxReconnectAttempts})`)
            initWebSocket()
          }, reconnectDelay)
        }
      }

      socket.onerror = (error) => {
        console.error('WebSocket错误:', error)
      }
    } catch (e) {
      console.error('创建WebSocket连接失败:', e)
    }
  }

  // 关闭WebSocket连接
  const closeWebSocket = () => {
    if (socket) {
      socket.close()
      socket = null
    }
  }

  // 初始化
  const initialize = () => {
    fetchNotifications()
    fetchPriceSubscriptions()
    initWebSocket()

    // 设置定时获取未读通知数量
    const timer = setInterval(() => {
      // 实际应用中这里应该调用API获取最新通知
      updateUnreadCount()
    }, 60000) // 每分钟更新一次

    // 返回清理函数
    return () => {
      clearInterval(timer)
      closeWebSocket()
    }
  }

  // 检查价格通知阈值
  const checkPriceNotifications = async () => {
    try {
      const response = await notificationsApi.checkPriceNotifications()
      if (response.code === 0 && response.data) {
        if (response.data.length > 0) {
          message.success(`检测到${response.data.length}条价格提醒`)
        } else {
          message.info('未检测到任何价格提醒')
        }
        return response.data
      }
      return []
    } catch (error) {
      console.error('检查价格通知失败:', error)
      message.error('检查价格通知失败')
      return []
    }
  }

  return {
    notifications,
    priceSubscriptions,
    loadingNotifications,
    loadingSubscriptions,
    unreadCount,
    fetchNotifications,
    fetchPriceSubscriptions,
    subscribeToPriceNotification,
    unsubscribeFromPriceNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    checkPriceNotifications,
    initialize,
  }
}
