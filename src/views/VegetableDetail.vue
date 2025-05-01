<template>
  <div class="vegetable-detail-container">
    <a-page-header
      :title="vegetable ? `${vegetable.product_name} 详情` : '蔬菜详情'"
      @back="goBack"
    >
      <template #extra>
        <a-space>
          <a-button v-if="isAdmin" type="primary" @click="handleEdit">
            <template #icon><edit-outlined /></template>
            编辑
          </a-button>
          <a-button @click="refreshData">
            <template #icon><reload-outlined /></template>
            刷新
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-spin :spinning="loading">
      <a-row :gutter="16" v-if="vegetable">
        <a-col :span="24">
          <a-card class="basic-info-card" :bordered="false">
            <a-descriptions title="基本信息" bordered>
              <a-descriptions-item label="ID">{{ vegetable.id }}</a-descriptions-item>
              <a-descriptions-item label="名称">{{ vegetable.product_name }}</a-descriptions-item>
              <a-descriptions-item label="产地">{{
                vegetable.provenance_name || '-'
              }}</a-descriptions-item>
              <a-descriptions-item label="种类">{{ vegetable.kind || '-' }}</a-descriptions-item>
              <a-descriptions-item label="规格">{{
                vegetable.standard || '-'
              }}</a-descriptions-item>
              <a-descriptions-item label="重量">{{
                vegetable.weight ? `${vegetable.weight} kg` : '-'
              }}</a-descriptions-item>
              <a-descriptions-item label="描述">{{
                vegetable.description || '-'
              }}</a-descriptions-item>
              <a-descriptions-item label="数据来源">{{
                vegetable.source_type || '-'
              }}</a-descriptions-item>
              <a-descriptions-item label="最近价格更新">
                {{ vegetable.price_date ? formatDate(vegetable.price_date) : '-' }}
              </a-descriptions-item>
            </a-descriptions>
          </a-card>
        </a-col>

        <a-col :span="24" style="margin-top: 16px">
          <a-card class="price-info-card" :bordered="false" title="价格信息">
            <a-row :gutter="16">
              <a-col :span="8">
                <a-statistic
                  title="均价"
                  :value="vegetable.average_price || 0"
                  :precision="2"
                  suffix="元/kg"
                  :value-style="{ color: '#3f8600' }"
                >
                  <template #prefix>
                    <dollar-outlined />
                  </template>
                </a-statistic>
              </a-col>
              <a-col :span="8">
                <a-statistic
                  title="最高价"
                  :value="vegetable.top_price || 0"
                  :precision="2"
                  suffix="元/kg"
                  :value-style="{ color: '#cf1322' }"
                >
                  <template #prefix>
                    <arrow-up-outlined />
                  </template>
                </a-statistic>
              </a-col>
              <a-col :span="8">
                <a-statistic
                  title="最低价"
                  :value="vegetable.minimum_price || 0"
                  :precision="2"
                  suffix="元/kg"
                  :value-style="{ color: '#1890ff' }"
                >
                  <template #prefix>
                    <arrow-down-outlined />
                  </template>
                </a-statistic>
              </a-col>
            </a-row>
          </a-card>
        </a-col>

        <a-col :span="24" style="margin-top: 16px">
          <a-card class="price-records-card" :bordered="false" title="价格记录历史">
            <div ref="priceChartRef" class="price-chart"></div>
            <a-table
              :dataSource="vegetable.price_records || []"
              :columns="priceColumns"
              :pagination="{
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
                showTotal: (total: number) => `共 ${total} 条记录`,
              }"
              rowKey="id"
              style="margin-top: 16px"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'record_date'">
                  {{ formatDate(record.record_date) }}
                </template>
                <template v-if="column.dataIndex === 'created_at'">
                  {{ formatDateTime(record.created_at) }}
                </template>
              </template>
            </a-table>
          </a-card>
        </a-col>
      </a-row>

      <a-empty v-else-if="!loading" description="未找到蔬菜数据" />
    </a-spin>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import * as echarts from 'echarts'
import {
  ReloadOutlined,
  EditOutlined,
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons-vue'
import { useUserStore } from '@/stores/user'
import { getVegetableById } from '@/api/vegetable'
import type { VegetableDetail } from '@/types/vegetable'

// 路由
const route = useRoute()
const router = useRouter()
const vegetableId = computed(() => Number(route.params.id))

// 用户状态
const userStore = useUserStore()
const isAdmin = computed(() => userStore.userInfo?.user_type === 'admin')

// 数据状态
const vegetable = ref<VegetableDetail | null>(null)
const loading = ref(false)
const priceChartRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

// 价格记录表格列
const priceColumns = [
  {
    title: 'ID',
    dataIndex: 'id',
    width: 80,
  },
  {
    title: '价格(元/kg)',
    dataIndex: 'price',
    width: 120,
    sorter: (a: any, b: any) => a.price - b.price,
  },
  {
    title: '记录日期',
    dataIndex: 'record_date',
    width: 150,
    sorter: (a: any, b: any) =>
      new Date(a.record_date).getTime() - new Date(b.record_date).getTime(),
  },
  {
    title: '数据来源',
    dataIndex: 'source_type',
    width: 120,
  },
  {
    title: '规格',
    dataIndex: 'standard',
    width: 120,
  },
  {
    title: '品种',
    dataIndex: 'kind',
    width: 120,
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    width: 180,
  },
]

// 格式化日期
const formatDate = (dateString: string) => {
  return dayjs(dateString).format('YYYY-MM-DD')
}

// 格式化日期时间
const formatDateTime = (dateString: string) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
}

// 获取蔬菜详情
const fetchData = async () => {
  if (!vegetableId.value) return

  loading.value = true
  try {
    const res = await getVegetableById(vegetableId.value)
    if (res.code === 0 || res.code === 200) {
      vegetable.value = res.data
      nextTick(() => {
        initPriceChart()
      })
    } else {
      message.error(res.msg || '获取蔬菜详情失败')
    }
  } catch (error) {
    console.error('获取蔬菜详情失败:', error)
    message.error('获取蔬菜详情失败')
  } finally {
    loading.value = false
  }
}

// 初始化价格图表
const initPriceChart = () => {
  if (!priceChartRef.value || !vegetable.value?.price_records?.length) return

  // 如果已经有图表实例，先销毁
  if (chartInstance) {
    chartInstance.dispose()
  }

  // 创建图表实例
  chartInstance = echarts.init(priceChartRef.value)

  // 准备数据
  const priceRecords = [...vegetable.value.price_records]
  priceRecords.sort((a, b) => new Date(a.record_date).getTime() - new Date(b.record_date).getTime())

  const dates = priceRecords.map((record) => formatDate(record.record_date))
  const prices = priceRecords.map((record) => record.price)

  // 图表配置
  const option = {
    title: {
      text: '价格趋势',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
      formatter: function (params: any) {
        const data = params[0]
        return `${data.name}<br/>${data.seriesName}: ${data.value.toFixed(2)} 元/kg`
      },
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        rotate: 45,
        formatter: function (value: any) {
          return value.substring(5) // 只显示月-日
        },
      },
    },
    yAxis: {
      type: 'value',
      name: '价格 (元/kg)',
      axisLabel: {
        formatter: '{value} 元',
      },
    },
    series: [
      {
        name: '价格',
        type: 'line',
        data: prices,
        markPoint: {
          data: [
            { type: 'max', name: '最高价' },
            { type: 'min', name: '最低价' },
          ],
        },
        markLine: {
          data: [{ type: 'average', name: '平均价' }],
        },
      },
    ],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      containLabel: true,
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100,
      },
      {
        start: 0,
        end: 100,
      },
    ],
  }

  // 设置图表配置和数据
  chartInstance.setOption(option)

  // 监听窗口大小变化，调整图表大小
  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
}

// 页面导航
const goBack = () => {
  router.go(-1)
}

// 编辑蔬菜
const handleEdit = () => {
  if (vegetable.value) {
    router.push(`/vegetables/edit/${vegetable.value.id}`)
  }
}

// 刷新数据
const refreshData = () => {
  fetchData()
}

// 组件挂载时加载数据
onMounted(() => {
  fetchData()
})

// 监听路由参数变化
watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      fetchData()
    }
  },
)

// 组件卸载时清理
onMounted(() => {
  return () => {
    if (chartInstance) {
      chartInstance.dispose()
      chartInstance = null
    }
    // 移除窗口大小变化的监听器
    window.removeEventListener('resize', () => {
      chartInstance?.resize()
    })
  }
})
</script>

<style scoped>
.vegetable-detail-container {
  padding: 0 16px;
}

.basic-info-card,
.price-info-card,
.price-records-card {
  margin-bottom: 16px;
}

.price-chart {
  width: 100%;
  height: 400px;
}
</style>
