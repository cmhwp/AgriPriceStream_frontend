<template>
  <div class="price-history-container">
    <a-page-header title="价格历史趋势" sub-title="分析蔬菜价格历史走势">
      <template #extra>
        <a-button @click="refreshData">
          <template #icon><reload-outlined /></template>
          刷新
        </a-button>
      </template>
    </a-page-header>

    <a-card :bordered="false" class="search-card">
      <a-form layout="inline">
        <a-form-item label="蔬菜">
          <a-select
            v-model:value="selectedVegetable"
            placeholder="请选择蔬菜"
            style="width: 200px"
            :options="vegetableOptions"
            show-search
            :filter-option="filterOption"
            @change="handleVegetableChange"
          />
        </a-form-item>
        <a-form-item label="时间范围">
          <a-select
            v-model:value="timeRange"
            placeholder="选择时间范围"
            style="width: 150px"
            @change="handleTimeRangeChange"
          >
            <a-select-option value="7">7天</a-select-option>
            <a-select-option value="30">30天</a-select-option>
            <a-select-option value="90">90天</a-select-option>
            <a-select-option value="180">半年</a-select-option>
            <a-select-option value="365">一年</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="getHistoryData">
            <template #icon><search-outlined /></template>
            查询
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <a-spin :spinning="loading" tip="加载中...">
      <div v-if="selectedVegetable" class="chart-container">
        <!-- 价格概况 -->
        <a-row :gutter="16">
          <a-col :span="6">
            <a-card :bordered="false">
              <a-statistic
                title="当前价格"
                :value="currentPrice"
                :precision="2"
                suffix="元/kg"
                :value-style="{ color: '#1890ff' }"
              />
            </a-card>
          </a-col>
          <a-col :span="6">
            <a-card :bordered="false">
              <a-statistic
                title="最高价格"
                :value="priceRange.high"
                :precision="2"
                suffix="元/kg"
                :value-style="{ color: '#cf1322' }"
              />
            </a-card>
          </a-col>
          <a-col :span="6">
            <a-card :bordered="false">
              <a-statistic
                title="最低价格"
                :value="priceRange.low"
                :precision="2"
                suffix="元/kg"
                :value-style="{ color: '#3f8600' }"
              />
            </a-card>
          </a-col>
          <a-col :span="6">
            <a-card :bordered="false">
              <a-statistic
                title="价格变化"
                :value="priceChange.value"
                :precision="2"
                :prefix="priceChange.prefix"
                suffix="%"
                :value-style="{ color: priceChange.color }"
              />
            </a-card>
          </a-col>
        </a-row>

        <!-- 价格走势图 -->
        <a-card :bordered="false" title="价格走势" style="margin-top: 16px">
          <div ref="priceChart" class="chart"></div>
        </a-card>

        <!-- 价格对比 -->
        <a-card :bordered="false" title="价格对比" style="margin-top: 16px">
          <a-table
            :columns="historyColumns"
            :data-source="historyData"
            :pagination="{ pageSize: 10 }"
            rowKey="date"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'price'">
                <span>{{ record.price.toFixed(2) }} 元/kg</span>
              </template>
              <template v-if="column.dataIndex === 'top_price'">
                <span v-if="record.top_price">{{ record.top_price.toFixed(2) }} 元/kg</span>
                <span v-else>-</span>
              </template>
              <template v-if="column.dataIndex === 'minimum_price'">
                <span v-if="record.minimum_price">{{ record.minimum_price.toFixed(2) }} 元/kg</span>
                <span v-else>-</span>
              </template>
            </template>
          </a-table>
        </a-card>

        <!-- 价格季节性分析 -->
        <a-card :bordered="false" title="价格季节性分析" style="margin-top: 16px">
          <div ref="seasonalityChart" class="chart"></div>
        </a-card>
      </div>

      <a-empty v-else description="请选择蔬菜查看价格历史" />
    </a-spin>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import { message } from 'ant-design-vue'
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons-vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import {
  getPriceHistory,
  getChartData,
  getRealTimePrice,
  analyzePriceSeasonality,
} from '@/api/price'
import type { HistoricalPrice, ChartData, VegetablePriceHistory } from '@/types/price'

// 状态
const loading = ref(false)
const selectedVegetable = ref<number>()
const timeRange = ref<string>('30')
const priceChart = ref<HTMLDivElement | null>(null)
const seasonalityChart = ref<HTMLDivElement | null>(null)
const priceChartInstance = ref<echarts.ECharts | null>(null)
const seasonalityChartInstance = ref<echarts.ECharts | null>(null)
const historyData = ref<HistoricalPrice[]>([])
const chartData = ref<ChartData | null>(null)
const currentPrice = ref<number>(0)

// 蔬菜列表，实际项目中应该从API获取
const vegetableOptions = ref([
  { label: '白菜', value: 1 },
  { label: '土豆', value: 2 },
  { label: '西红柿', value: 3 },
  { label: '黄瓜', value: 4 },
  { label: '茄子', value: 5 },
])

// 表格列定义
const historyColumns = [
  {
    title: '日期',
    dataIndex: 'date',
    key: 'date',
    sorter: (a: HistoricalPrice, b: HistoricalPrice) =>
      new Date(a.date).getTime() - new Date(b.date).getTime(),
  },
  {
    title: '价格',
    dataIndex: 'price',
    key: 'price',
    sorter: (a: HistoricalPrice, b: HistoricalPrice) => a.price - b.price,
  },
  {
    title: '最高价',
    dataIndex: 'top_price',
    key: 'top_price',
    sorter: (a: HistoricalPrice, b: HistoricalPrice) => {
      if (a.top_price === undefined && b.top_price === undefined) return 0
      if (a.top_price === undefined) return -1
      if (b.top_price === undefined) return 1
      return a.top_price - b.top_price
    },
  },
  {
    title: '最低价',
    dataIndex: 'minimum_price',
    key: 'minimum_price',
    sorter: (a: HistoricalPrice, b: HistoricalPrice) => {
      if (a.minimum_price === undefined && b.minimum_price === undefined) return 0
      if (a.minimum_price === undefined) return -1
      if (b.minimum_price === undefined) return 1
      return a.minimum_price - b.minimum_price
    },
  },
]

// 计算属性
const priceRange = reactive({
  high: 0,
  low: 0,
})

const priceChange = reactive({
  value: 0,
  prefix: '',
  color: '#000000',
})

// 获取价格历史数据
const getHistoryData = async () => {
  if (!selectedVegetable.value) {
    message.warning('请先选择蔬菜')
    return
  }

  loading.value = true
  try {
    // 获取历史价格数据
    const res = await getPriceHistory(selectedVegetable.value, parseInt(timeRange.value))

    if (res.code === 0 || res.code === 200) {
      const data = res.data as VegetablePriceHistory
      historyData.value = data.history
      chartData.value = data.chart_data

      // 计算价格范围
      calculatePriceRange()

      // 初始化图表
      initPriceChart()

      // 获取实时价格
      getRealTimePriceData()

      // 获取季节性分析
      getSeasonalityData()
    } else {
      message.error(res.message || '获取价格历史数据失败')
    }
  } catch (error) {
    console.error('获取价格历史数据失败:', error)
    message.error('获取价格历史数据失败')
  } finally {
    loading.value = false
  }
}

// 获取实时价格数据
const getRealTimePriceData = async () => {
  try {
    const res = await getRealTimePrice(selectedVegetable.value!)

    if (res.code === 0 || res.code === 200) {
      currentPrice.value = res.data.current_price

      // 设置价格变化
      if (res.data.trend) {
        priceChange.value = Math.abs(res.data.trend.percentage)
        priceChange.prefix =
          res.data.trend.trend === 'up' ? '↑' : res.data.trend.trend === 'down' ? '↓' : ''
        priceChange.color =
          res.data.trend.trend === 'up'
            ? '#cf1322'
            : res.data.trend.trend === 'down'
              ? '#3f8600'
              : '#1890ff'
      }
    }
  } catch (error) {
    console.error('获取实时价格数据失败:', error)
  }
}

// 获取季节性分析数据
const getSeasonalityData = async () => {
  try {
    const res = await analyzePriceSeasonality(selectedVegetable.value!)

    if (res.code === 0 || res.code === 200) {
      initSeasonalityChart(res.data)
    }
  } catch (error) {
    console.error('获取季节性分析数据失败:', error)
  }
}

// 计算价格范围
const calculatePriceRange = () => {
  if (historyData.value.length === 0) {
    priceRange.high = 0
    priceRange.low = 0
    return
  }

  let high = historyData.value[0].price
  let low = historyData.value[0].price

  for (const record of historyData.value) {
    if (record.price > high) {
      high = record.price
    }
    if (record.price < low) {
      low = record.price
    }

    // 考虑top_price和minimum_price
    if (record.top_price !== undefined && record.top_price > high) {
      high = record.top_price
    }
    if (record.minimum_price !== undefined && record.minimum_price < low) {
      low = record.minimum_price
    }
  }

  priceRange.high = high
  priceRange.low = low
}

// 初始化价格图表
const initPriceChart = () => {
  if (!priceChart.value || !chartData.value) return

  if (priceChartInstance.value) {
    priceChartInstance.value.dispose()
  }

  priceChartInstance.value = echarts.init(priceChart.value)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985',
        },
      },
    },
    legend: {
      data: ['价格', '最高价', '最低价'],
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: chartData.value.labels,
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value} 元/kg',
      },
    },
    series: [
      {
        name: '价格',
        type: 'line',
        data: chartData.value.prices,
        smooth: true,
        lineStyle: {
          width: 3,
        },
        itemStyle: {
          color: '#1890ff',
        },
        emphasis: {
          focus: 'series',
        },
      },
    ],
  }

  // 添加最高价和最低价
  if (chartData.value.top_prices) {
    option.series.push({
      name: '最高价',
      type: 'line',
      data: chartData.value.top_prices,
      smooth: true,
      lineStyle: {
        width: 2,
        type: 'dashed',
      } as any,
      itemStyle: {
        color: '#cf1322',
      },
      emphasis: {
        focus: 'series',
      },
    })
  }

  if (chartData.value.minimum_prices) {
    option.series.push({
      name: '最低价',
      type: 'line',
      data: chartData.value.minimum_prices,
      smooth: true,
      lineStyle: {
        width: 2,
        type: 'dashed',
      } as any,
      itemStyle: {
        color: '#3f8600',
      },
      emphasis: {
        focus: 'series',
      },
    })
  }

  priceChartInstance.value.setOption(option)

  // 添加窗口大小改变事件
  window.addEventListener('resize', () => {
    priceChartInstance.value?.resize()
  })
}

// 初始化季节性分析图表
const initSeasonalityChart = (data: any) => {
  if (!seasonalityChart.value) return

  if (seasonalityChartInstance.value) {
    seasonalityChartInstance.value.dispose()
  }

  seasonalityChartInstance.value = echarts.init(seasonalityChart.value)

  // 这里假设后端返回的数据格式，实际项目中需要根据API返回格式调整
  const months = [
    '一月',
    '二月',
    '三月',
    '四月',
    '五月',
    '六月',
    '七月',
    '八月',
    '九月',
    '十月',
    '十一月',
    '十二月',
  ]

  // 生成模拟数据，实际项目中应使用API返回的数据
  const mockData = months.map(() => Math.random() * 20 + 5)
  const monthlyAvg = mockData

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c} 元/kg',
    },
    xAxis: {
      type: 'category',
      data: months,
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value} 元/kg',
      },
    },
    series: [
      {
        name: '月均价格',
        type: 'bar',
        data: monthlyAvg,
        markLine: {
          data: [{ type: 'average', name: '年平均' }],
        },
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' },
          ]),
        },
      },
    ],
  }

  seasonalityChartInstance.value.setOption(option)

  // 添加窗口大小改变事件
  window.addEventListener('resize', () => {
    seasonalityChartInstance.value?.resize()
  })
}

// 处理蔬菜选择变化
const handleVegetableChange = () => {
  getHistoryData()
}

// 处理时间范围变化
const handleTimeRangeChange = () => {
  if (selectedVegetable.value) {
    getHistoryData()
  }
}

// 刷新数据
const refreshData = () => {
  if (selectedVegetable.value) {
    getHistoryData()
  } else {
    message.info('请先选择蔬菜')
  }
}

// Select过滤函数
const filterOption = (input: string, option: any) => {
  return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
}

// 在组件卸载时清理图表实例
onMounted(() => {
  // 如果URL中有蔬菜ID参数，自动选择对应的蔬菜
  const urlParams = new URLSearchParams(window.location.search)
  const vegId = urlParams.get('vegetable_id')

  if (vegId && !isNaN(Number(vegId))) {
    selectedVegetable.value = Number(vegId)
    getHistoryData()
  }
})

// 清理图表实例
const cleanup = () => {
  if (priceChartInstance.value) {
    priceChartInstance.value.dispose()
    priceChartInstance.value = null
  }

  if (seasonalityChartInstance.value) {
    seasonalityChartInstance.value.dispose()
    seasonalityChartInstance.value = null
  }
}

// 监听组件卸载
onUnmounted(() => {
  cleanup()
})
</script>

<style scoped>
.price-history-container {
  padding: 0 16px;
}

.search-card {
  margin-bottom: 16px;
}

.chart {
  height: 400px;
  width: 100%;
}
</style>
