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
          <a-button type="primary" icon="bell" @click="refreshDashboard">刷新</a-button>
        </a-badge>
      </template>
    </a-page-header>

    <a-spin :spinning="loading" tip="加载中...">
      <div v-if="error" class="error-message">
        <a-alert message="获取仪表盘数据失败" type="error" show-icon />
        <a-button type="primary" @click="fetchDashboardData" class="retry-button"> 重试 </a-button>
      </div>

      <div v-else-if="dashboardData" class="dashboard-content" :key="refreshKey">
        <!-- 重要信息概览 -->
        <a-divider orientation="left"><strong>重要信息概览</strong></a-divider>

        <!-- 用户仪表盘部分 -->
        <a-row :gutter="[16, 16]">
          <!-- 最低价蔬菜卡片 - 突出显示 -->
          <a-col
            :xs="24"
            :sm="24"
            :md="isAdmin ? 6 : 8"
            :lg="isAdmin ? 6 : 8"
            :xl="isAdmin ? 6 : 8"
          >
            <a-card
              :bordered="false"
              title="今日最低价蔬菜"
              class="stat-card highlight-card"
              v-if="dashboardData.lowest_priced_vegetable?.product_name"
            >
              <div class="stat-vegetable">
                <p class="vegetable-name">
                  {{ dashboardData.lowest_priced_vegetable.product_name }}
                </p>
                <p class="vegetable-price">
                  {{ dashboardData.lowest_priced_vegetable.price?.toFixed(2) }} 元/kg
                </p>
                <a-tag color="green">性价比最高</a-tag>
                <div
                  class="vegetable-action"
                  v-if="dashboardData.lowest_priced_vegetable.vegetable_id"
                >
                  <a-button
                    type="link"
                    @click="
                      navigateToVegetableDetail(dashboardData.lowest_priced_vegetable.vegetable_id)
                    "
                  >
                    查看详情
                  </a-button>
                </div>
              </div>
            </a-card>
            <a-card :bordered="false" title="今日最低价蔬菜" class="stat-card" v-else>
              <p class="large-number">--</p>
              <p class="stat-description">暂无数据</p>
            </a-card>
          </a-col>

          <!-- 蔬菜数据总数 -->
          <a-col
            :xs="24"
            :sm="12"
            :md="isAdmin ? 6 : 8"
            :lg="isAdmin ? 6 : 8"
            :xl="isAdmin ? 6 : 8"
          >
            <a-card :bordered="false" title="蔬菜数据总数" class="stat-card">
              <p class="large-number">
                {{ dashboardData.vegetable_count_by_type?.[0]?.count || 0 }}
              </p>
              <p class="stat-description">2022-至今监控中的数据总量</p>
            </a-card>
          </a-col>

          <!-- 产地数量 -->
          <a-col
            :xs="24"
            :sm="12"
            :md="isAdmin ? 6 : 8"
            :lg="isAdmin ? 6 : 8"
            :xl="isAdmin ? 6 : 8"
          >
            <a-card :bordered="false" title="产地数量" class="stat-card">
              <p class="large-number">{{ dashboardData.provenances?.length || 0 }}</p>
              <p class="stat-description">蔬菜产地统计</p>
            </a-card>
          </a-col>

          <!-- 管理员总用户数卡片 - 只在管理员视图中显示 -->
          <a-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6" v-if="isAdmin && adminData">
            <a-card :bordered="false" title="总用户数" class="stat-card admin-card">
              <p class="large-number">{{ adminData.total_users || 0 }}</p>
              <p class="stat-description">系统注册用户数量</p>
            </a-card>
          </a-col>
        </a-row>

        <!-- 图表区域 -->
        <a-divider orientation="left"><strong>数据分析</strong></a-divider>

        <!-- 蔬菜分布和产地分布 -->
        <a-row :gutter="[16, 16]" class="chart-row">
          <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
            <a-card :bordered="false" title="7天价格分布" class="chart-card">
              <div ref="vegetableTypeChart" class="chart-container"></div>
            </a-card>
          </a-col>

          <!-- 产地分布 -->
          <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
            <a-card :bordered="false" title="产地分布" class="chart-card">
              <div ref="provenanceChart" class="chart-container"></div>
            </a-card>
          </a-col>
        </a-row>

        <!-- 价格分析 -->
        <a-row :gutter="[16, 16]" class="chart-row" v-if="dashboardData.price_analytics">
          <a-col :span="24">
            <a-card :bordered="false" title="价格分析" class="analysis-card">
              <div class="price-analytics">
                <a-tabs default-active-key="basic">
                  <a-tab-pane key="basic" tab="基础指标">
                    <a-descriptions
                      bordered
                      :column="{ xxl: 5, xl: 3, lg: 3, md: 3, sm: 2, xs: 1 }"
                    >
                      <a-descriptions-item label="日期">
                        {{ formatDate(dashboardData.price_analytics.date) }}
                      </a-descriptions-item>
                      <a-descriptions-item label="分析产品数">
                        {{ dashboardData.price_analytics.total_products }}
                      </a-descriptions-item>
                      <a-descriptions-item label="平均价格">
                        {{ dashboardData.price_analytics.average_price.toFixed(2) }} 元/kg
                      </a-descriptions-item>
                      <a-descriptions-item label="最高价格">
                        {{ dashboardData.price_analytics.highest_price.toFixed(2) }} 元/kg
                      </a-descriptions-item>
                      <a-descriptions-item label="最低价格">
                        {{ dashboardData.price_analytics.lowest_price.toFixed(2) }} 元/kg
                      </a-descriptions-item>
                      <a-descriptions-item label="平均日内价差">
                        {{ dashboardData.price_analytics.avg_daily_spread.toFixed(2) }} 元
                      </a-descriptions-item>
                    </a-descriptions>
                  </a-tab-pane>

                  <a-tab-pane key="trends" tab="价格趋势">
                    <div class="trends-container">
                      <div class="trend-item">
                        <h4>日环比</h4>
                        <a-tag
                          :color="getPriceTrendColor(dashboardData.price_analytics.daily_trend)"
                          style="margin-right: 8px"
                        >
                          {{ getPriceTrendText(dashboardData.price_analytics.daily_trend) }}
                        </a-tag>
                        <span
                          :style="{
                            color: getPriceChangeColor(dashboardData.price_analytics.daily_change),
                          }"
                        >
                          {{ dashboardData.price_analytics.daily_change > 0 ? '+' : '' }}
                          {{ dashboardData.price_analytics.daily_change.toFixed(2) }}%
                        </span>
                      </div>

                      <div class="trend-item">
                        <h4>周同比</h4>
                        <a-tag
                          :color="getPriceTrendColor(dashboardData.price_analytics.weekly_trend)"
                          style="margin-right: 8px"
                        >
                          {{ getPriceTrendText(dashboardData.price_analytics.weekly_trend) }}
                        </a-tag>
                        <span
                          :style="{
                            color: getPriceChangeColor(dashboardData.price_analytics.weekly_change),
                          }"
                        >
                          {{ dashboardData.price_analytics.weekly_change > 0 ? '+' : '' }}
                          {{ dashboardData.price_analytics.weekly_change.toFixed(2) }}%
                        </span>
                      </div>
                    </div>
                  </a-tab-pane>

                  <a-tab-pane
                    key="volatility"
                    tab="价格波动"
                    v-if="dashboardData.price_analytics.price_volatility?.length"
                  >
                    <a-table
                      :dataSource="dashboardData.price_analytics.price_volatility"
                      :columns="volatilityColumns"
                      :pagination="false"
                      size="middle"
                    />
                  </a-tab-pane>
                </a-tabs>
              </div>
            </a-card>
          </a-col>
        </a-row>

        <!-- 最近价格更新 -->
        <a-row :gutter="[16, 16]" class="chart-row">
          <a-col :span="24">
            <a-card :bordered="false" title="最近价格更新" class="data-card">
              <a-table
                :dataSource="dashboardData.recent_price_updates || []"
                :columns="priceUpdateColumns"
                :pagination="{ pageSize: 5 }"
                rowKey="vegetable_id"
                size="middle"
              />
            </a-card>
          </a-col>
        </a-row>
      </div>
    </a-spin>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import * as echarts from 'echarts'
import 'echarts-wordcloud'
import { useUserStore } from '@/stores/user'
import { getDashboardByUserType, isAdminDashboard } from '@/api/dashboard'
import type { UserDashboard, AdminDashboard } from '@/types/dashboard'
import { UserType } from '@/types/user'
import { ShoppingOutlined } from '@ant-design/icons-vue'
import { useRouter } from 'vue-router'

// 路由
const router = useRouter()

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

// 价格波动表格列定义
const volatilityColumns = [
  {
    title: '产品',
    dataIndex: 'product',
    key: 'product',
  },
  {
    title: '价格波动范围',
    dataIndex: 'spread',
    key: 'spread',
    customRender: ({ text }: { text: number }) => `${text.toFixed(2)} 元`,
  },
]

// 产地溢价表格列定义
const originColumns = [
  {
    title: '产地',
    dataIndex: 'origin',
    key: 'origin',
  },
  {
    title: '平均价格',
    dataIndex: 'avg_price',
    key: 'avg_price',
    customRender: ({ text }: { text: number }) => `${text.toFixed(2)} 元/kg`,
  },
  {
    title: '数据点数',
    dataIndex: 'data_points',
    key: 'data_points',
  },
]

// 价格异常表格列定义
const anomalyColumns = [
  {
    title: '产品',
    dataIndex: 'product',
    key: 'product',
  },
  {
    title: '预期价格',
    dataIndex: 'expected_price',
    key: 'expected_price',
    customRender: ({ text }: { text: number }) => `${text.toFixed(2)} 元/kg`,
  },
  {
    title: '实际价格',
    dataIndex: 'actual_price',
    key: 'actual_price',
    customRender: ({ text }: { text: number }) => `${text.toFixed(2)} 元/kg`,
  },
  {
    title: '偏差比例',
    dataIndex: 'deviation_percent',
    key: 'deviation_percent',
    customRender: ({ text }: { text: number }) => `${text.toFixed(2)}%`,
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

// 手动刷新仪表盘
const refreshDashboard = () => {
  message.info('正在刷新数据...')
  fetchDashboardData()
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

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString()
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

    // 将数据转换为词云所需的格式
    let data = []

    // 检查是否已经是新格式 (有text字段)
    if (dashboardData.value.provenances.length > 0 && 'text' in dashboardData.value.provenances[0]) {
      data = dashboardData.value.provenances.map((item) => ({
        name: item.text,
        value: item.value,
        // 使用weight作为字体大小的基础
        textSize: item.weight
      }))
    } else {
      // 向后兼容：将旧格式转换为新格式
      // 找出最大计数以计算相对权重
      const provenanceData = dashboardData.value.provenances || []
      const maxCount = Math.max(...provenanceData.map((p: any) => p.count || 0), 1)

      data = provenanceData.map((item: any) => {
        const weight = Math.floor((item.count / maxCount) * 100)
        return {
          name: item.provenance, // 旧的字段名
          value: item.count,
          textSize: weight
        }
      })
    }

    const option = {
      tooltip: {
        show: true,
        formatter: (params: any) => {
          return `${params.name}: ${params.value} 个蔬菜`
        }
      },
      series: [{
        type: 'wordCloud',
        shape: 'circle',
        // 词云大小设置
        left: 'center',
        right: 'center',
        top: 'center',
        bottom: 'center',
        width: '90%',
        height: '90%',
        // 词云样式设置
        textStyle: {
          fontFamily: 'sans-serif',
          fontWeight: 'bold',
          color: function() {
            // 随机生成柔和的颜色
            return 'rgb(' +
              Math.round(155 + Math.random() * 100) + ',' +
              Math.round(155 + Math.random() * 100) + ',' +
              Math.round(155 + Math.random() * 100) + ')'
          }
        },
        emphasis: {
          focus: 'self',
          textStyle: {
            shadowBlur: 10,
            shadowColor: '#333'
          }
        },
        // 词云大小范围设置
        sizeRange: [14, 50],
        // 词之间的间距
        textPadding: 0,
        // 布局算法迭代次数，改善碰撞检测
        layoutAnimation: true,
        // 使用螺旋状排列
        drawOutOfBound: false,
        gridSize: 8,
        // 数据
        data: data
      }]
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

// 导航到蔬菜详情页面
const navigateToVegetableDetail = (vegetableId: number) => {
  router.push(`/vegetables/${vegetableId}`)
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
  background-color: #f0f2f5;
  min-height: 100vh;
}

.dashboard-header {
  margin-bottom: 24px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.dashboard-content {
  background: #f0f2f5;
}

.chart-row {
  margin-top: 16px;
}

/* 基础卡片样式 */
.stat-card {
  text-align: center;
  transition: all 0.3s;
  height: 100%;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.stat-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

/* 高亮卡片样式 */
.highlight-card {
  border-left: 3px solid #52c41a;
}

.chart-card,
.data-card,
.analysis-card {
  height: 100%;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.chart-card:hover,
.data-card:hover,
.analysis-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.admin-card {
  border-left: 3px solid #1890ff;
}

.admin-data-card {
  height: 100%;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.admin-data-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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
  margin-top: 8px;
}

.trends-container {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  padding: 16px;
}

.trend-item {
  min-width: 200px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  padding: 16px;
  border-radius: 4px;
  background-color: #fff;
}

.trend-item h4 {
  margin-top: 0;
  margin-bottom: 12px;
  color: rgba(0, 0, 0, 0.85);
}

.error-message {
  padding: 24px;
  text-align: center;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.retry-button {
  margin-top: 16px;
}

.timeline-time {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

.stat-vegetable {
  text-align: center;
  padding: 0 10px;
}

.vegetable-name {
  font-size: 18px;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vegetable-price {
  font-size: 24px;
  font-weight: bold;
  color: #52c41a;
  margin-bottom: 8px;
}

.vegetable-action {
  margin-top: 12px;
}

/* 分隔线样式 */
.ant-divider {
  margin: 24px 0 16px;
}
</style>
