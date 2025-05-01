<template>
  <div class="dashboard-container">
    <a-page-header
      class="dashboard-header"
      :title="`${dashboardData?.username || '用户'}的仪表盘`"
      :sub-title="isAdmin ? '管理员视图' : '用户视图'"
    >
      <template #extra>
        <a-badge
          :count="dashboardData?.notifications_count || 0"
          :dot="(dashboardData?.notifications_count || 0) > 0"
        >
          <a-button type="primary" shape="circle" icon="bell" />
        </a-badge>
      </template>
    </a-page-header>

    <a-spin :spinning="loading" tip="加载中...">
      <div v-if="error" class="error-message">
        <a-alert message="获取仪表盘数据失败" type="error" show-icon />
        <a-button type="primary" @click="fetchDashboardData" class="retry-button"> 重试 </a-button>
      </div>

      <div v-else-if="dashboardData" class="dashboard-content" :key="refreshKey">
        <!-- 用户仪表盘部分 -->
        <a-row :gutter="16">
          <!-- 统计卡片 -->
          <a-col :span="8">
            <a-card :bordered="false" title="订阅的蔬菜" class="stat-card">
              <p class="large-number">{{ dashboardData.subscribed_vegetables?.length || 0 }}</p>
              <p class="stat-description">订阅蔬菜总数</p>
            </a-card>
          </a-col>

          <a-col :span="8">
            <a-card :bordered="false" title="蔬菜数据总数" class="stat-card">
              <p class="large-number">
                {{ dashboardData.vegetable_count_by_type?.[0]?.count || 0 }}
              </p>
              <p class="stat-description">2022-至今监控中的数据总量</p>
            </a-card>
          </a-col>

          <a-col :span="8">
            <a-card :bordered="false" title="产地数量" class="stat-card">
              <p class="large-number">{{ dashboardData.provenances?.length || 0 }}</p>
              <p class="stat-description">蔬菜产地统计</p>
            </a-card>
          </a-col>
        </a-row>

        <!-- 蔬菜分布 -->
        <a-row :gutter="16" class="chart-row">
          <a-col :span="12">
            <a-card :bordered="false" title="7天价格分布">
              <div ref="vegetableTypeChart" class="chart-container"></div>
            </a-card>
          </a-col>

          <!-- 产地分布 -->
          <a-col :span="12">
            <a-card :bordered="false" title="产地分布">
              <div ref="provenanceChart" class="chart-container"></div>
            </a-card>
          </a-col>
        </a-row>

        <!-- 最近价格更新 -->
        <a-row :gutter="16" class="chart-row">
          <a-col :span="24">
            <a-card :bordered="false" title="最近价格更新">
              <a-table
                :dataSource="dashboardData.recent_price_updates || []"
                :columns="priceUpdateColumns"
                :pagination="{ pageSize: 5 }"
                rowKey="vegetable_id"
              />
            </a-card>
          </a-col>
        </a-row>

        <!-- 价格分析 -->
        <a-row :gutter="16" class="chart-row" v-if="dashboardData.price_analytics">
          <a-col :span="24">
            <a-card :bordered="false" title="价格分析">
              <div class="price-analytics">
                <a-descriptions bordered>
                  <a-descriptions-item label="平均价格">
                    {{ dashboardData.price_analytics.average_price.toFixed(2) }} 元/kg
                  </a-descriptions-item>
                  <a-descriptions-item label="最高价格">
                    {{ dashboardData.price_analytics.highest_price.toFixed(2) }} 元/kg
                  </a-descriptions-item>
                  <a-descriptions-item label="最低价格">
                    {{ dashboardData.price_analytics.lowest_price.toFixed(2) }} 元/kg
                  </a-descriptions-item>
                  <a-descriptions-item label="价格趋势">
                    <a-tag :color="getPriceTrendColor(dashboardData.price_analytics.price_trend)">
                      {{ getPriceTrendText(dashboardData.price_analytics.price_trend) }}
                    </a-tag>
                  </a-descriptions-item>
                  <a-descriptions-item label="价格变化百分比">
                    <span
                      :style="{
                        color: getPriceChangeColor(
                          dashboardData.price_analytics.price_change_percentage,
                        ),
                      }"
                    >
                      {{ dashboardData.price_analytics.price_change_percentage > 0 ? '+' : '' }}
                      {{ dashboardData.price_analytics.price_change_percentage.toFixed(2) }}%
                    </span>
                  </a-descriptions-item>
                </a-descriptions>
              </div>
            </a-card>
          </a-col>
        </a-row>

        <!-- 管理员仪表盘部分 -->
        <template v-if="isAdmin && adminData">
          <a-divider>管理员统计</a-divider>

          <a-row :gutter="16">
            <a-col :span="8">
              <a-card :bordered="false" title="总用户数" class="stat-card">
                <p class="large-number">{{ adminData.total_users || 0 }}</p>
              </a-card>
            </a-col>

            <a-col :span="8">
              <a-card :bordered="false" title="总蔬菜数据记录" class="stat-card">
                <p class="large-number">{{ adminData.total_vegetables || 0 }}</p>
              </a-card>
            </a-col>

            <a-col :span="8">
              <a-card :bordered="false" title="总价格记录" class="stat-card">
                <p class="large-number">{{ adminData.total_price_records || 0 }}</p>
              </a-card>
            </a-col>
          </a-row>

          <!-- 爬虫活动 -->
          <a-row
            :gutter="16"
            class="chart-row"
            v-if="adminData.recent_crawler_activities && adminData.recent_crawler_activities.length"
          >
            <a-col :span="24">
              <a-card :bordered="false" title="最近爬虫活动">
                <a-timeline>
                  <a-timeline-item
                    v-for="(activity, index) in adminData.recent_crawler_activities || []"
                    :key="index"
                    :color="getActivityColor(activity.activity_type || '')"
                  >
                    <p>{{ activity.description || '未知活动' }}</p>
                    <p class="timeline-time">{{ formatDateTime(activity.timestamp || '') }}</p>
                  </a-timeline-item>
                </a-timeline>
              </a-card>
            </a-col>
          </a-row>

          <!-- 模型训练状态 -->
          <a-row :gutter="16" class="chart-row" v-if="adminData && adminData.model_training_status">
            <a-col :span="12">
              <a-card :bordered="false" title="模型训练状态">
                <a-list itemLayout="horizontal" :dataSource="adminData.model_training_status || []">
                  <template #renderItem="{ item }">
                    <a-list-item>
                      <a-list-item-meta
                        :title="item.model_name"
                        :description="`精度: ${item.accuracy || '-'} | 状态: ${item.status || '-'}`"
                      >
                        <template #avatar>
                          <a-avatar
                            icon="robot"
                            :style="{ backgroundColor: getModelStatusColor(item.status || '') }"
                          />
                        </template>
                      </a-list-item-meta>
                      <div>
                        <a-tag color="blue">{{ formatDateTime(item.last_updated || '') }}</a-tag>
                      </div>
                    </a-list-item>
                  </template>
                </a-list>
              </a-card>
            </a-col>

            <!-- 数据更新频率 -->
            <a-col :span="12">
              <a-card :bordered="false" title="数据更新频率">
                <div ref="updateFrequencyChart" class="chart-container"></div>
              </a-card>
            </a-col>
          </a-row>
        </template>
      </div>
    </a-spin>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import * as echarts from 'echarts'
import { useUserStore } from '@/stores/user'
import { getDashboardByUserType, isAdminDashboard } from '@/api/dashboard'
import type { UserDashboard, AdminDashboard } from '@/types/dashboard'
import { UserType } from '@/types/user'

// 状态
const userStore = useUserStore()
const loading = ref(true)
const error = ref(false)
const dashboardData = ref<UserDashboard | AdminDashboard | null>(null)
const vegetableTypeChart = ref<HTMLElement | null>(null)
const provenanceChart = ref<HTMLElement | null>(null)
const updateFrequencyChart = ref<HTMLElement | null>(null)
const refreshKey = ref(0) // 用于强制刷新视图

// 计算属性
const isAdmin = computed(() => {
  return userStore.userInfo?.user_type === UserType.ADMIN
})

const adminData = computed(() => {
  if (isAdmin.value && dashboardData.value && isAdminDashboard(dashboardData.value)) {
    return dashboardData.value
  }
  return null
})

// 表格列定义
const priceUpdateColumns = [
  {
    title: '蔬菜',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '价格',
    dataIndex: 'price',
    key: 'price',
    customRender: ({ text }: { text: number }) => `${text.toFixed(2)} 元/kg`,
  },
  {
    title: '更新时间',
    dataIndex: 'timestamp',
    key: 'timestamp',
    customRender: ({ text }: { text: string }) => formatDateTime(text),
  },
  {
    title: '蔬菜ID',
    dataIndex: 'vegetable_id',
    key: 'vegetable_id',
  },
]

// 获取仪表盘数据
const fetchDashboardData = async () => {
  loading.value = true
  error.value = false

  try {
    const userType = userStore.userInfo?.user_type || 'user'
    const data = await getDashboardByUserType(userType)
    console.log('获取到的仪表盘数据:', data)

    if (data) {
      dashboardData.value = data
      refreshKey.value++ // 强制刷新视图

      // 延迟初始化图表，确保DOM已经完全渲染
      setTimeout(() => {
        try {
          console.log('开始初始化图表...')
          initVegetableTypeChart()
          initProvenanceChart()

          if (isAdmin.value && adminData.value) {
            initUpdateFrequencyChart()
          }
        } catch (err) {
          console.error('图表初始化失败:', err)
        }
      }, 300)
    } else {
      error.value = true
      message.error('获取仪表盘数据失败')
    }
  } catch (err) {
    console.error('获取仪表盘数据出错:', err)
    error.value = true
    message.error('获取仪表盘数据出错')
  } finally {
    loading.value = false
  }
}

// 辅助函数
const getPriceTrendColor = (trend: string) => {
  switch (trend) {
    case 'up':
      return 'red'
    case 'down':
      return 'green'
    default:
      return 'blue'
  }
}

const getPriceTrendText = (trend: string) => {
  switch (trend) {
    case 'up':
      return '上涨'
    case 'down':
      return '下跌'
    default:
      return '稳定'
  }
}

const getPriceChangeColor = (change: number) => {
  if (change > 0) return '#f5222d'
  if (change < 0) return '#52c41a'
  return '#faad14'
}

const getActivityColor = (type: string) => {
  switch (type) {
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

const getModelStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return '#52c41a'
    case 'training':
      return '#faad14'
    case 'failed':
      return '#f5222d'
    default:
      return '#1890ff'
  }
}

const formatDateTime = (dateTimeStr: string) => {
  if (!dateTimeStr) return '-'
  const date = new Date(dateTimeStr)
  return (
    date.toLocaleDateString() +
    ' ' +
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  )
}

// 初始化蔬菜类型图表
const initVegetableTypeChart = () => {
  if (!vegetableTypeChart.value || !dashboardData.value) {
    console.error('蔬菜图表DOM或数据不存在')
    return
  }

  const chartDOM = vegetableTypeChart.value
  console.log('蔬菜图表DOM:', chartDOM)

  // 确保DOM已渲染完成
  if (chartDOM.offsetHeight === 0) {
    console.warn('图表容器高度为0，可能尚未完成渲染')
    setTimeout(() => initVegetableTypeChart(), 100)
    return
  }

  try {
    const chartInstance = echarts.init(chartDOM)
    console.log('7天蔬菜数据:', dashboardData.value.weekly_vegetables)

    // 使用weekly_vegetables数据显示7天价格分布
    const weeklyData = dashboardData.value.weekly_vegetables || []

    // 按价格排序，方便查看
    weeklyData.sort((a, b) => b.average_price - a.average_price)

    const vegetableNames = weeklyData.map((item) => item.product_name)
    const vegetablePrices = weeklyData.map((item) => item.average_price)

    const option = {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          return `${params.name}<br/>平均价格: ${params.value.toFixed(2)} 元/kg<br/>`
        },
      },
      legend: {
        type: 'scroll',
        orient: 'vertical',
        right: 10,
        top: 20,
        bottom: 20,
        data: vegetableNames,
      },
      series: [
        {
          name: '7天价格分布',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['40%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 4,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '18',
              fontWeight: 'bold',
              formatter: '{b}\n{c} 元/kg',
            },
          },
          labelLine: {
            show: false,
          },
          data: vegetableNames.map((name, index) => ({
            name,
            value: vegetablePrices[index],
          })),
        },
      ],
    }

    chartInstance.setOption(option)

    // 窗口大小变化时重新调整大小
    window.addEventListener('resize', () => {
      chartInstance.resize()
    })
  } catch (error) {
    console.error('初始化蔬菜图表出错:', error)
  }
}

// 初始化产地分布图表
const initProvenanceChart = () => {
  if (!provenanceChart.value || !dashboardData.value) {
    console.error('产地图表DOM或数据不存在')
    return
  }

  const chartDOM = provenanceChart.value
  console.log('产地图表DOM:', chartDOM)

  // 确保DOM已渲染完成
  if (chartDOM.offsetHeight === 0) {
    console.warn('产地图表容器高度为0，可能尚未完成渲染')
    setTimeout(() => initProvenanceChart(), 100)
    return
  }

  try {
    const chartInstance = echarts.init(chartDOM)
    console.log('产地数据:', dashboardData.value.provenances)

    // 只取前7个产地，避免图表过于拥挤
    const data = dashboardData.value.provenances.slice(0, 7).map((item) => ({
      name: item.provenance,
      value: item.count,
    }))

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
      },
      yAxis: {
        type: 'category',
        data: data.map((item) => item.name),
      },
      series: [
        {
          name: '蔬菜数量',
          type: 'bar',
          data: data.map((item) => item.value),
        },
      ],
    }

    chartInstance.setOption(option)

    window.addEventListener('resize', () => {
      chartInstance.resize()
    })
  } catch (error) {
    console.error('初始化产地图表出错:', error)
  }
}

const initUpdateFrequencyChart = () => {
  if (!updateFrequencyChart.value || !adminData.value) return

  const chartInstance = echarts.init(updateFrequencyChart.value)

  // 安全地访问数据更新频率对象
  const frequencyData = adminData.value.data_update_frequency || {}
  const data = Object.entries(frequencyData).map(([source, info]: [string, any]) => ({
    name: source,
    value: info?.frequency || 0,
  }))

  const option = {
    tooltip: {
      trigger: 'item',
    },
    radar: {
      indicator: data.map((item) => ({
        name: item.name,
        max: Math.max(...data.map((d) => d.value)) * 1.2 || 10,
      })),
    },
    series: [
      {
        name: '数据更新频率',
        type: 'radar',
        data: [
          {
            value: data.map((item) => item.value),
            name: '每日更新次数',
          },
        ],
      },
    ],
  }

  chartInstance.setOption(option)

  window.addEventListener('resize', () => {
    chartInstance.resize()
  })
}
// 生命周期钩子
onMounted(() => {
  console.log('组件挂载，开始获取数据')
  fetchDashboardData()
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.dashboard-header {
  margin-bottom: 24px;
  background: #fff;
  border-radius: 2px;
}

.dashboard-content {
  background: #f0f2f5;
}

.chart-row {
  margin-top: 20px;
}

.stat-card {
  text-align: center;
}

.large-number {
  font-size: 36px;
  font-weight: bold;
  margin: 0;
  color: #1890ff;
}

.stat-description {
  margin-top: 8px;
  color: rgba(0, 0, 0, 0.45);
}

.chart-container {
  height: 300px;
  width: 100%;
}

.price-analytics {
  margin-top: 16px;
}

.error-message {
  padding: 24px;
  text-align: center;
}

.retry-button {
  margin-top: 16px;
}

.timeline-time {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}
</style>
