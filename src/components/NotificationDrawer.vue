<template>
  <a-drawer
    title="我的通知"
    placement="right"
    :open="open"
    @close="$emit('update:open', false)"
    width="400"
  >
    <a-spin :spinning="loading">
      <a-list v-if="notifications.length > 0" item-layout="horizontal" :data-source="notifications">
        <template #header>
          <div style="display: flex; justify-content: space-between; align-items: center">
            <span>您有 {{ unreadCount }} 条未读通知</span>
            <a-button type="link" @click="handleMarkAllRead" :disabled="unreadCount === 0">全部标为已读</a-button>
          </div>
        </template>
        <template #renderItem="{ item }">
          <a-list-item>
            <a-list-item-meta :title="item.title" :description="item.message">
              <template #avatar>
                <a-badge :dot="!item.is_read" color="blue">
                  <notification-outlined v-if="item.type === 'system'" style="font-size: 20px" />
                  <alert-outlined v-else-if="item.type === 'price_alert'" style="font-size: 20px" />
                  <info-circle-outlined v-else style="font-size: 20px" />
                </a-badge>
              </template>
            </a-list-item-meta>
            <template #actions>
              <a @click="handleMarkRead(item.id)" v-if="!item.is_read">
                <check-outlined />
              </a>
              <a @click="handleDelete(item.id)">
                <delete-outlined />
              </a>
            </template>
            <div style="color: #999; font-size: 12px">{{ formatDate(item.created_at) }}</div>
          </a-list-item>
        </template>
      </a-list>
      <a-empty v-else description="暂无通知" />

      <div class="pagination-container" v-if="notifications.length > 0">
        <a-pagination
          v-model:current="currentPage"
          :total="totalNotifications"
          :pageSize="pageSize"
          size="small"
          @change="handlePageChange"
        />
      </div>
    </a-spin>
  </a-drawer>
</template>

<script lang="ts" setup>
import { computed, ref, watch, onMounted } from 'vue'
import dayjs from 'dayjs'
import {
  NotificationOutlined,
  AlertOutlined,
  InfoCircleOutlined,
  CheckOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { getUserNotificationList, markNotificationAsRead, deleteUserNotification } from '@/api/notifications'
import type { Notification } from '@/types/notifications'

const props = defineProps<{
  open: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'update:loading', value: boolean): void
  (e: 'notification-updated'): void
}>()

// 通知数据
const notifications = ref<Notification[]>([])
const unreadCount = ref(0)
const totalNotifications = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 获取通知数据
const fetchNotifications = async () => {
  try {
    emit('update:loading', true)
    const skip = (currentPage.value - 1) * pageSize.value
    const res = await getUserNotificationList(skip, pageSize.value)

    if (res.code === 0 && res.data) {
      notifications.value = res.data.notifications
      unreadCount.value = res.data.unread_count
      // 假设总数据量是当前页的数据量乘以页数加上未读数量（后端可以提供更准确的数据）
      totalNotifications.value = Math.max(res.data.notifications.length * currentPage.value, res.data.unread_count)
    }
  } catch (error) {
    console.error('获取通知失败', error)
    message.error('获取通知失败')
  } finally {
    emit('update:loading', false)
  }
}

// 标记通知为已读
const handleMarkRead = async (id: string) => {
  try {
    emit('update:loading', true)
    const res = await markNotificationAsRead({ notification_id: id })

    if (res.code === 0) {
      // 更新本地通知状态
      const notification = notifications.value.find(n => n.id === id)
      if (notification) {
        notification.is_read = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
      message.success('已标记为已读')
      emit('notification-updated')
    }
  } catch (error) {
    console.error('标记已读失败', error)
    message.error('操作失败')
  } finally {
    emit('update:loading', false)
  }
}

// 标记所有通知为已读
const handleMarkAllRead = async () => {
  try {
    if (unreadCount.value === 0) return

    emit('update:loading', true)
    const res = await markNotificationAsRead({ mark_all: true })

    if (res.code === 0) {
      // 更新本地通知状态
      notifications.value.forEach(n => {
        n.is_read = true
      })
      unreadCount.value = 0
      message.success('已全部标记为已读')
      emit('notification-updated')
    }
  } catch (error) {
    console.error('标记全部已读失败', error)
    message.error('操作失败')
  } finally {
    emit('update:loading', false)
  }
}

// 删除通知
const handleDelete = async (id: string) => {
  try {
    emit('update:loading', true)
    const res = await deleteUserNotification(id)

    if (res.code === 0) {
      // 从列表中移除
      const index = notifications.value.findIndex(n => n.id === id)
      if (index !== -1) {
        const isUnread = !notifications.value[index].is_read
        notifications.value.splice(index, 1)

        // 如果删除的是未读通知，减少未读计数
        if (isUnread) {
          unreadCount.value = Math.max(0, unreadCount.value - 1)
        }
      }

      message.success('删除成功')
      emit('notification-updated')

      // 如果当前页没有数据了，回到上一页
      if (notifications.value.length === 0 && currentPage.value > 1) {
        currentPage.value--
        fetchNotifications()
      }
    }
  } catch (error) {
    console.error('删除通知失败', error)
    message.error('删除失败')
  } finally {
    emit('update:loading', false)
  }
}

// 页面变化处理
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchNotifications()
}

// 格式化日期
const formatDate = (dateString: string) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm')
}

// 监听抽屉打开状态
watch(() => props.open, (newVal) => {
  if (newVal) {
    fetchNotifications()
  }
})

// 组件挂载时，如果drawer是打开状态，则加载数据
onMounted(() => {
  if (props.open) {
    fetchNotifications()
  }
})
</script>

<style scoped>
.pagination-container {
  margin-top: 16px;
  text-align: center;
}
</style>
