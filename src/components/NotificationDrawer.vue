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
            <a-button type="link" @click="$emit('mark-all-read')">全部标为已读</a-button>
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
              <a @click="$emit('mark-read', item.id)">
                <check-outlined />
              </a>
              <a @click="$emit('delete', item.id)">
                <delete-outlined />
              </a>
            </template>
            <div style="color: #999; font-size: 12px">{{ formatDate(item.created_at) }}</div>
          </a-list-item>
        </template>
      </a-list>
      <a-empty v-else description="暂无通知" />
    </a-spin>
  </a-drawer>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import dayjs from 'dayjs'
import {
  NotificationOutlined,
  AlertOutlined,
  InfoCircleOutlined,
  CheckOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

const props = defineProps<{
  open: boolean
  loading: boolean
  notifications: Notification[]
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'mark-read', id: string): void
  (e: 'mark-all-read'): void
  (e: 'delete', id: string): void
}>()

// 计算未读通知数量
const unreadCount = computed(() => props.notifications.filter((n) => !n.is_read).length)

// 格式化日期
const formatDate = (dateString: string) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm')
}
</script>
