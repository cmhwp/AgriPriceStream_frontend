<template>
  <div class="crawler-management">
    <a-page-header title="数据爬虫管理" sub-title="管理数据爬取任务">
      <template #extra>
        <a-button type="primary" @click="runCrawlerNow" :loading="runningCrawler">
          <template #icon><thunderbolt-outlined /></template>
          立即运行爬虫
        </a-button>
      </template>
    </a-page-header>

    <a-row :gutter="16">
      <a-col :span="24">
        <a-card title="爬虫状态" :bordered="false">
          <a-descriptions bordered>
            <a-descriptions-item label="上次爬取时间">
              {{ lastRunTime || '暂无记录' }}
            </a-descriptions-item>
            <a-descriptions-item label="运行状态">
              <a-tag :color="crawlerStatus === 'running' ? 'processing' : 'success'">
                {{ crawlerStatus === 'running' ? '运行中' : '空闲' }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="今日爬取数据量">
              {{ dailyDataCount || 0 }} 条
            </a-descriptions-item>
          </a-descriptions>

          <div class="recent-activities">
            <a-divider>最近活动</a-divider>
            <a-timeline>
              <a-timeline-item
                v-for="(activity, index) in recentActivities"
                :key="index"
                :color="getActivityColor(activity.status)"
              >
                <p>
                  <strong>{{ activity.title }}</strong>
                </p>
                <p>{{ activity.description }}</p>
                <p v-if="activity.records_count !== undefined">
                  数据量: {{ activity.records_count }} 条
                  <span v-if="activity.duration !== undefined">
                    | 耗时: {{ formatDuration(activity.duration) }}</span
                  >
                </p>
                <p>
                  <small>{{ activity.time }}</small>
                </p>
              </a-timeline-item>
            </a-timeline>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="16" style="margin-top: 20px">
      <a-col :span="24">
        <a-card title="历史数据爬取" :bordered="false">
          <a-form :model="historicalForm" :label-col="{ span: 4 }" :wrapper-col="{ span: 18 }">
            <a-form-item label="开始日期" required>
              <a-date-picker
                v-model:value="historicalForm.startDate"
                style="width: 100%"
                :disabledDate="disabledDate"
              />
            </a-form-item>
            <a-form-item label="结束日期">
              <a-date-picker
                v-model:value="historicalForm.endDate"
                style="width: 100%"
                :disabledDate="disabledEndDate"
              />
            </a-form-item>
            <a-form-item :wrapper-col="{ offset: 4, span: 18 }">
              <a-button type="primary" @click="crawlHistorical" :loading="crawlingHistorical">
                开始爬取历史数据
              </a-button>
              <span style="margin-left: 8px; color: #999"> 注意：日期范围不能超过一年 </span>
            </a-form-item>
          </a-form>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import { ThunderboltOutlined } from '@ant-design/icons-vue'
import dayjs, { Dayjs } from 'dayjs'
import {
  runCrawlerOnce,
  crawlHistoricalData,
  getRecentCrawlerActivities,
  getCrawlerStatus,
} from '@/api/admin'
import type { CrawlerActivityResponse, CrawlerStatusResponse } from '@/types/dashboard'

// 状态
const runningCrawler = ref(false)
const crawlingHistorical = ref(false)
const lastRunTime = ref('')
const crawlerStatus = ref('idle')
const dailyDataCount = ref(0)

// 历史数据表单
const historicalForm = reactive({
  startDate: null as Dayjs | null,
  endDate: null as Dayjs | null,
})

// 最近活动
interface Activity {
  id?: number
  title: string
  description: string
  time: string
  status: 'success' | 'error' | 'warning' | 'processing'
  records_count?: number
  duration?: number
}

const recentActivities = ref<Activity[]>([])

// 禁用日期选择器
const disabledDate = (current: Dayjs) => {
  // 不能选择未来日期和一年前的日期
  return current && (current > dayjs().endOf('day') || current < dayjs().subtract(1, 'year'))
}

// 禁用结束日期选择器
const disabledEndDate = (current: Dayjs) => {
  // 不能选择未来日期和开始日期之前的日期，以及开始日期一年后的日期
  if (!current) return false
  const startDate = historicalForm.startDate
  return (
    current > dayjs().endOf('day') ||
    (startDate && current < startDate) ||
    (startDate && current > startDate.add(1, 'year'))
  )
}

// 获取活动状态颜色
const getActivityColor = (status: string) => {
  switch (status) {
    case 'success':
      return 'green'
    case 'error':
      return 'red'
    case 'warning':
      return 'orange'
    default:
      return 'blue'
  }
}

// 格式化持续时间（秒 -> 可读格式）
const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}秒`
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}分${remainingSeconds > 0 ? remainingSeconds + '秒' : ''}`
  } else {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}小时${minutes > 0 ? minutes + '分' : ''}`
  }
}

// 立即运行爬虫
const runCrawlerNow = async () => {
  runningCrawler.value = true

  try {
    // 调用启动爬虫API
    const res = await runCrawlerOnce()
    if (res.code === 0 || res.code === 200) {
      message.success(res.message || '爬虫任务已启动')
      crawlerStatus.value = 'running'

      // 开始轮询爬虫状态
      startPollingCrawlerStatus()
    } else {
      message.error(res.message || '爬虫任务启动失败')
      runningCrawler.value = false
    }
  } catch (error) {
    console.error('运行爬虫失败:', error)
    message.error('运行爬虫失败')
    runningCrawler.value = false
  }
}

// 爬取历史数据
const crawlHistorical = async () => {
  if (!historicalForm.startDate) {
    message.error('请选择开始日期')
    return
  }

  // 验证日期范围
  const today = dayjs()
  if (historicalForm.startDate.isAfter(today)) {
    message.error('开始日期不能是未来日期')
    return
  }

  if (historicalForm.endDate && historicalForm.endDate.isAfter(today)) {
    message.error('结束日期不能是未来日期')
    return
  }

  crawlingHistorical.value = true
  try {
    const startDate = historicalForm.startDate.format('YYYY-MM-DD')
    const endDate = historicalForm.endDate ? historicalForm.endDate.format('YYYY-MM-DD') : undefined
    const dateRange = `${startDate} 至 ${endDate || '今天'}`

    const res = await crawlHistoricalData(startDate, endDate)
    if (res.code === 0 || res.code === 200) {
      message.success(res.message || '历史数据爬取任务已启动')
      crawlerStatus.value = 'running'
      runningCrawler.value = true

      // 开始轮询爬虫状态
      startPollingCrawlerStatus()
    } else {
      message.error(res.message || '历史数据爬取任务启动失败')
    }
  } catch (error) {
    console.error('爬取历史数据失败:', error)
    message.error('爬取历史数据失败')
  } finally {
    crawlingHistorical.value = false
  }
}

// 加载爬虫状态
const loadCrawlerStatus = async () => {
  try {
    // 获取爬虫状态
    const statusRes = await getCrawlerStatus()
    if (statusRes.code === 0 || statusRes.code === 200) {
      const statusData = statusRes.data as CrawlerStatusResponse

      // 更新状态
      crawlerStatus.value = statusData.status
      lastRunTime.value = statusData.last_run_time || ''
      dailyDataCount.value = statusData.daily_data_count

      // 如果爬虫正在运行，开始轮询
      if (statusData.status === 'running') {
        runningCrawler.value = true
        startPollingCrawlerStatus()
      }
    } else {
      message.error(statusRes.message || '获取爬虫状态失败')
      // 使用默认数据
      setDefaultActivities()
    }
  } catch (error) {
    console.error('获取爬虫状态失败:', error)
    message.error('获取爬虫状态失败')
    // 使用默认数据
    setDefaultActivities()
  }
}

// 获取最近爬虫活动
const refreshRecentActivities = async () => {
  try {
    const activitiesRes = await getRecentCrawlerActivities()
    if (activitiesRes.code === 0 || activitiesRes.code === 200) {
      recentActivities.value = activitiesRes.data || []
    } else {
      // 使用默认数据
      setDefaultActivities()
    }
  } catch (error) {
    console.error('获取最近活动失败:', error)
    // 使用默认数据
    setDefaultActivities()
  }
}

// 开始轮询爬虫状态
let statusPollingInterval: number | null = null

const startPollingCrawlerStatus = () => {
  // 清除已有的轮询
  if (statusPollingInterval) {
    clearInterval(statusPollingInterval)
  }

  statusPollingInterval = window.setInterval(async () => {
    try {
      // 获取爬虫状态
      const statusRes = await getCrawlerStatus()
      if (statusRes.code === 0 || statusRes.code === 200) {
        const statusData = statusRes.data as CrawlerStatusResponse

        // 更新状态
        crawlerStatus.value = statusData.status
        lastRunTime.value = statusData.last_run_time || ''
        dailyDataCount.value = statusData.daily_data_count

        // 如果爬虫已完成，停止轮询
        if (statusData.status === 'idle') {
          stopPollingCrawlerStatus()
          runningCrawler.value = false

          // 刷新活动列表
          refreshRecentActivities()

          message.success('爬虫任务已完成')
        }
      }
    } catch (error) {
      console.error('获取爬虫状态失败:', error)
      stopPollingCrawlerStatus()
      runningCrawler.value = false
    }
  }, 2000) // 每2秒轮询一次
}

// 停止轮询
const stopPollingCrawlerStatus = () => {
  if (statusPollingInterval) {
    clearInterval(statusPollingInterval)
    statusPollingInterval = null
  }
}

// 组件卸载时清理轮询
onUnmounted(() => {
  stopPollingCrawlerStatus()
})

// 设置默认活动数据
const setDefaultActivities = () => {
  lastRunTime.value = '2023-10-25 08:00:00'
  dailyDataCount.value = 87

  recentActivities.value = [
    {
      title: '每日常规爬取',
      description: '成功获取了32条新数据',
      time: '2023-10-25 08:00:00',
      status: 'success',
      records_count: 32,
    },
    {
      title: '价格异常检测',
      description: '发现5条价格异常数据，已标记',
      time: '2023-10-25 08:01:15',
      status: 'warning',
      records_count: 5,
    },
  ]
}

onMounted(async () => {
  // 获取初始数据
  loadCrawlerStatus()
  refreshRecentActivities()
})
</script>

<style scoped>
.crawler-management {
  padding: 0 16px;
}

.recent-activities {
  margin-top: 24px;
}
</style>
