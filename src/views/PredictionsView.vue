<template>
  <div class="prediction-container">
    <a-page-header title="蔬菜价格预测" sub-title="了解未来价格趋势，做出明智决策">
      <template #extra>
        <a-button type="primary" @click="refreshPredictions" :loading="loading">
          <template #icon><reload-outlined /></template>
          刷新
        </a-button>
      </template>
    </a-page-header>

    <!-- 蔬菜选择区域 -->
    <a-card :bordered="false" class="search-card">
      <a-form layout="inline">
        <a-form-item label="蔬菜">
          <a-select
            v-model:value="selectedVegetable"
            placeholder="请选择蔬菜"
            style="width: 250px"
            :options="vegetableOptions"
            show-search
            :filter-option="filterOption"
            @change="handleVegetableChange"
            :loading="vegetablesLoading"
          />
        </a-form-item>
        <a-form-item label="预测天数">
          <a-input-number
            v-model:value="predictionDays"
            :min="1"
            :max="30"
            style="width: 100px"
            @change="handleDaysChange"
          />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="fetchPrediction" :loading="loading">
            <template #icon><line-chart-outlined /></template>
            预测价格
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <div v-if="loading" class="loading-container">
      <a-spin tip="正在预测价格...">
        <div class="loading-content">
          <p>正在分析历史数据并训练模型，这可能需要一点时间...</p>
        </div>
      </a-spin>
    </div>

    <div v-else-if="predictionResult && predictionResult.predictions && predictionResult.predictions.length > 0" class="prediction-content">

      <!-- 预测结果展示 -->
      <a-row :gutter="16" style="margin-top: 16px">
        <!-- 当前价格卡片 -->
        <a-col :span="8">
          <a-card :bordered="false">
            <a-statistic
              title="当前价格"
              :value="predictionResult.current_price"
              :precision="2"
              :value-style="{ color: '#1890ff' }"
              suffix="元/kg"
            >
              <template #prefix>
                <dollar-outlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>

        <!-- 平均预测价格卡片 -->
        <a-col :span="8">
          <a-card :bordered="false">
            <a-statistic
              title="平均预测价格"
              :value="getAveragePredictedPrice()"
              :precision="2"
              :value-style="getPriceTrendStyle(predictionResult.current_price, getAveragePredictedPrice())"
              suffix="元/kg"
            >
              <template #prefix>
                <stock-outlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>

        <!-- 预测算法卡片 -->
        <a-col :span="8">
          <a-card :bordered="false">
            <a-statistic
              title="使用算法"
              :value="predictionResult.algorithm || 'LSTM'"
              :value-style="{ color: '#52c41a' }"
            >
              <template #prefix>
                <code-outlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
      </a-row>

      <!-- 价格趋势图表 -->
      <a-card :bordered="false" title="价格趋势预测" style="margin-top: 16px">
        <a-alert
          v-if="getPriceTrend() === 'rise'"
          message="价格上涨趋势"
          description="预测价格整体呈上涨趋势，建议尽早购买或寻找替代蔬菜。"
          type="warning"
          show-icon
          style="margin-bottom: 16px"
        />
        <a-alert
          v-else-if="getPriceTrend() === 'fall'"
          message="价格下降趋势"
          description="预测价格整体呈下降趋势，可以等待价格进一步下降再购买。"
          type="success"
          show-icon
          style="margin-bottom: 16px"
        />
        <a-alert
          v-else
          message="价格稳定"
          description="预测价格总体保持稳定，可以根据自己的需求随时购买。"
          type="info"
          show-icon
          style="margin-bottom: 16px"
        />

        <!-- 价格趋势图 -->
        <div ref="chartRef" style="height: 400px;"></div>
      </a-card>

      <!-- 最佳购买日建议 -->
      <a-card
        :bordered="false"
        title="最佳购买时机"
        style="margin-top: 16px"
        v-if="bestPurchaseDay && bestPurchaseDay.best_purchase_date"
      >
        <a-descriptions :column="2" bordered>
          <a-descriptions-item label="建议购买日期">
            {{ formatDate(bestPurchaseDay.best_purchase_date) }}
          </a-descriptions-item>
          <a-descriptions-item label="预测价格">
            {{ bestPurchaseDay.predicted_price.toFixed(2) }} 元/kg
          </a-descriptions-item>
          <a-descriptions-item label="预计节省">
            <span v-if="bestPurchaseDay.savings">
              {{ bestPurchaseDay.savings.toFixed(2) }} 元/kg
              ({{ bestPurchaseDay.savings_percent?.toFixed(2) }}%)
            </span>
            <span v-else>-</span>
          </a-descriptions-item>
          <a-descriptions-item label="建议">
            <a-tag color="green" v-if="bestPurchaseDay.savings && bestPurchaseDay.savings > 0">
              推荐在建议日期购买
            </a-tag>
            <a-tag color="blue" v-else>
              价格稳定，可随时购买
            </a-tag>
          </a-descriptions-item>
        </a-descriptions>
      </a-card>

      <!-- 详细预测数据表格 -->
      <a-card :bordered="false" title="详细预测数据" style="margin-top: 16px">
        <a-table
          :columns="columns"
          :data-source="predictionTableData"
          :pagination="false"
          rowKey="date"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'price'">
              {{ record.price.toFixed(2) }} 元/kg
            </template>
            <template v-if="column.dataIndex === 'trend'">
              <a-tag :color="getPriceChangeColor(record.change)">
                {{ formatPriceChange(record.change) }}
              </a-tag>
            </template>
          </template>
        </a-table>
      </a-card>
    </div>

    <a-empty v-else description="请选择蔬菜进行价格预测" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import {
  ReloadOutlined,
  LineChartOutlined,
  DollarOutlined,
  StockOutlined,
  CodeOutlined
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import * as echarts from 'echarts'
import { getVegetableOptions } from '@/api/vegetable'
import { getVegetablePrediction, getBestPurchaseDay } from '@/api/prediction'
import type { PredictionResult, BestPurchaseDay } from '@/types/prediction'

// 状态定义
const loading = ref(false)
const vegetablesLoading = ref(false)
const selectedVegetable = ref<number>()
const predictionDays = ref(7)
const vegetableOptions = ref<{ label: string; value: number }[]>([])
const predictionResult = ref<PredictionResult | null>(null)
const bestPurchaseDay = ref<BestPurchaseDay | null>(null)
const chartRef = ref<HTMLDivElement | null>(null)
const chart = ref<echarts.ECharts | null>(null)

// 表格列定义
const columns = [
  {
    title: '日期',
    dataIndex: 'date',
    key: 'date',
  },
  {
    title: '价格预测',
    dataIndex: 'price',
    key: 'price',
    sorter: (a: any, b: any) => a.price - b.price,
  },
  {
    title: '价格变化',
    dataIndex: 'trend',
    key: 'trend',
  },
]

// 计算表格数据
const predictionTableData = computed(() => {
  if (!predictionResult.value || !predictionResult.value.predictions) return []

  const currentPrice = predictionResult.value.current_price
  const data = predictionResult.value.predictions.map((pred, index) => {
    // 计算价格变化
    let prevPrice = index === 0 ? currentPrice : predictionResult.value!.predictions[index - 1].price
    let change = ((pred.price - prevPrice) / prevPrice) * 100

    return {
      date: formatDate(pred.date),
      price: pred.price,
      change: change,
    }
  })

  return data
})

// 检索蔬菜选项
const fetchVegetableOptions = async () => {
  vegetablesLoading.value = true
  try {
    const res = await getVegetableOptions()
    if (res.code === 0 && res.data) {
      vegetableOptions.value = res.data.map((v: any) => ({
        label: v.name,
        value: v.id
      }))
    }
  } catch (error) {
    console.error('获取蔬菜选项失败:', error)
    message.error('获取蔬菜选项失败')
  } finally {
    vegetablesLoading.value = false
  }
}

// 获取价格预测
const fetchPrediction = async () => {
  if (!selectedVegetable.value) {
    message.warning('请先选择蔬菜')
    return
  }

  loading.value = true
  try {
    const res = await getVegetablePrediction(selectedVegetable.value, predictionDays.value)
    if (res.code === 0 && res.data) {
      predictionResult.value = res.data

      // 获取最佳购买日
      fetchBestPurchaseDay()

      // 渲染图表
      setTimeout(() => {
        renderPredictionChart()
      }, 100)
    } else {
      message.error(res.msg || '获取预测数据失败')
    }
  } catch (error) {
    console.error('预测价格失败:', error)
    message.error('预测价格失败')
  } finally {
    loading.value = false
  }
}

// 获取最佳购买日
const fetchBestPurchaseDay = async () => {
  if (!selectedVegetable.value) return

  try {
    const res = await getBestPurchaseDay(selectedVegetable.value)
    if (res.code === 0 && res.data) {
      bestPurchaseDay.value = res.data
    }
  } catch (error) {
    console.error('获取最佳购买日失败:', error)
  }
}

// 渲染价格趋势图
const renderPredictionChart = () => {
  if (!chartRef.value || !predictionResult.value || !predictionResult.value.predictions) return

  if (chart.value) {
    chart.value.dispose()
  }

  chart.value = echarts.init(chartRef.value)

  const dates = predictionResult.value.predictions.map(p => formatDate(p.date))
  const prices = predictionResult.value.predictions.map(p => p.price)

  // 添加今天的数据点
  const today = dayjs().format('MM-DD')
  const allDates = [today, ...dates]
  const allPrices = [predictionResult.value.current_price, ...prices]

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: function(params: any) {
        const date = params[0].axisValue
        const price = params[0].data
        return `${date}: ${price.toFixed(2)} 元/kg`
      }
    },
    xAxis: {
      type: 'category',
      data: allDates,
      axisLabel: {
        formatter: '{value}'
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value} 元/kg'
      }
    },
    series: [
      {
        name: '价格预测',
        type: 'line',
        data: allPrices,
        smooth: true,
        lineStyle: {
          width: 3
        },
        markPoint: {
          data: [
            { type: 'max', name: '最高价' },
            { type: 'min', name: '最低价' }
          ]
        },
        markLine: {
          data: [
            { type: 'average', name: '平均价' }
          ]
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: 'rgba(58, 71, 212, 0.5)'
            },
            {
              offset: 1,
              color: 'rgba(58, 71, 212, 0.1)'
            }
          ])
        }
      }
    ]
  }

  chart.value.setOption(option)

  // 监听窗口大小变化，调整图表大小
  window.addEventListener('resize', () => {
    chart.value?.resize()
  })
}

// 计算平均预测价格
const getAveragePredictedPrice = () => {
  if (!predictionResult.value || !predictionResult.value.predictions || predictionResult.value.predictions.length === 0) {
    return 0
  }

  const sum = predictionResult.value.predictions.reduce((acc, curr) => acc + curr.price, 0)
  return sum / predictionResult.value.predictions.length
}

// 根据价格变化获取样式
const getPriceTrendStyle = (currentPrice: number, predictedPrice: number) => {
  if (!currentPrice || !predictedPrice) return { color: '#1890ff' }

  if (predictedPrice > currentPrice) {
    return { color: '#cf1322' }  // 上涨为红色
  } else if (predictedPrice < currentPrice) {
    return { color: '#3f8600' }  // 下跌为绿色
  } else {
    return { color: '#1890ff' }  // 不变为蓝色
  }
}

// 获取价格变化颜色
const getPriceChangeColor = (change: number) => {
  if (change > 0) return 'red'
  if (change < 0) return 'green'
  return 'blue'
}

// 格式化价格变化
const formatPriceChange = (change: number) => {
  const sign = change > 0 ? '+' : ''
  return `${sign}${change.toFixed(2)}%`
}

// 获取价格趋势
const getPriceTrend = () => {
  if (!predictionResult.value || !predictionResult.value.predictions || predictionResult.value.predictions.length < 2) {
    return 'stable'
  }

  const prices = predictionResult.value.predictions.map(p => p.price)
  const firstPrice = prices[0]
  const lastPrice = prices[prices.length - 1]

  // 计算总体趋势
  if (lastPrice > firstPrice * 1.05) {
    return 'rise'  // 上涨超过5%
  } else if (lastPrice < firstPrice * 0.95) {
    return 'fall'  // 下跌超过5%
  } else {
    return 'stable'  // 总体稳定
  }
}

// 日期格式化
const formatDate = (dateStr: string) => {
  return dayjs(dateStr).format('MM-DD')
}

// 搜索过滤选项
const filterOption = (input: string, option: any) => {
  return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
}

// 处理蔬菜变化
const handleVegetableChange = () => {
  fetchPrediction()
}

// 处理天数变化
const handleDaysChange = () => {
  if (selectedVegetable.value) {
    fetchPrediction()
  }
}

// 刷新预测
const refreshPredictions = () => {
  if (selectedVegetable.value) {
    fetchPrediction()
  } else {
    message.warning('请先选择蔬菜')
  }
}

// 生命周期钩子
onMounted(() => {
  fetchVegetableOptions()

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})

// 处理resize事件的函数
const handleResize = () => {
  if (chart.value) {
    chart.value.resize()
  }
}

// 组件卸载时清理图表
watch(() => chart.value, (curr, prev) => {
  if (prev) {
    window.removeEventListener('resize', handleResize)
  }
})
</script>

<style scoped>
.prediction-container {
  padding: 24px;
}

.loading-container {
  margin-top: 100px;
  text-align: center;
}

.loading-content {
  margin-top: 16px;
  padding: 30px 50px;
}

.search-card {
  margin-bottom: 16px;
}

.prediction-content {
  margin-top: 16px;
}
</style>
