import { ref } from 'vue'
import { message } from 'ant-design-vue'

export interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

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

export function useNotificationService() {
  const notifications = ref<Notification[]>([])
  const loadingNotifications = ref<boolean>(false)
  const unreadCount = ref<number>(0)

  // 获取通知列表
  const fetchNotifications = async () => {
    loadingNotifications.value = true
    try {
      // 模拟API请求
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

  // 初始化
  const initialize = () => {
    fetchNotifications()

    // 设置定时获取未读通知数量
    const timer = setInterval(() => {
      // 实际应用中这里应该调用API获取最新通知
      updateUnreadCount()
    }, 60000) // 每分钟更新一次

    // 返回清理函数
    return () => {
      clearInterval(timer)
    }
  }

  return {
    notifications,
    loadingNotifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    initialize,
  }
}
