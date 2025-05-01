<template>
  <div class="price-overview-panel">
    <a-card :loading="loading" :bordered="false" title="价格概览">
      <template #extra>
        <a-button type="link" @click="refreshData"> <reload-outlined />刷新 </a-button>
      </template>

      <!-- 价格概览统计 -->
      <a-row :gutter="16" style="margin-bottom: 20px">
        <a-col :span="12">
          <a-statistic
            v-if="overview?.highest_price_item"
            title="最高价格"
            :value="overview.highest_price_item.current_price"
            :precision="2"
            suffix="元/kg"
          >
            <template #title>
              <div>
                最高价格
                <a-tag color="blue">{{ overview.highest_price_item.product_name }}</a-tag>
              </div>
            </template>
          </a-statistic>
        </a-col>
        <a-col :span="12">
          <a-statistic
            v-if="overview?.lowest_price_item"
            title="最低价格"
            :value="overview.lowest_price_item.current_price"
            :precision="2"
            suffix="元/kg"
          >
            <template #title>
              <div>
                最低价格
                <a-tag color="green">{{ overview.lowest_price_item.product_name }}</a-tag>
              </div>
            </template>
          </a-statistic>
        </a-col>
      </a-row>

      <a-row :gutter="16">
        <a-col :span="12">
          <a-statistic
            v-if="overview?.highest_increase_item"
            title="涨幅最大"
            :value="overview.highest_increase_item.price_change_percentage"
            :precision="2"
            suffix="%"
            :value-style="{ color: '#cf1322' }"
          >
            <template #prefix>
              <arrow-up-outlined />
            </template>
            <template #title>
              <div>
                涨幅最大
                <a-tag color="red">{{ overview.highest_increase_item.product_name }}</a-tag>
              </div>
            </template>
          </a-statistic>
        </a-col>
        <a-col :span="12">
          <a-statistic
            v-if="overview?.highest_decrease_item"
            title="跌幅最大"
            :value="Math.abs(overview.highest_decrease_item.price_change_percentage)"
            :precision="2"
            suffix="%"
            :value-style="{ color: '#3f8600' }"
          >
            <template #prefix>
              <arrow-down-outlined />
            </template>
            <template #title>
              <div>
                跌幅最大
                <a-tag color="green">{{ overview.highest_decrease_item.product_name }}</a-tag>
              </div>
            </template>
          </a-statistic>
        </a-col>
      </a-row>

      <!-- 价格列表 -->
      <a-divider />

      <a-table
        :dataSource="tableData"
        :columns="columns"
        :pagination="{ pageSize: 5 }"
        size="small"
        :rowKey="(record) => record.product_name"
      >
        <template #bodyCell="{ column, record }">
          <!-- 价格涨跌 -->
          <template v-if="column.dataIndex === 'price_change'">
            <span :style="{ color: record.price_change >= 0 ? '#cf1322' : '#3f8600' }">
              {{ record.price_change >= 0 ? '+' : '' }}{{ record.price_change.toFixed(2) }}
              <a-tag :color="record.price_change >= 0 ? 'red' : 'green'">
                {{ record.price_change >= 0 ? '+' : ''
                }}{{ record.price_change_percentage.toFixed(2) }}%
              </a-tag>
            </span>
          </template>

          <!-- 更新时间 -->
          <template v-if="column.dataIndex === 'last_updated'">
            {{ formatDate(record.last_updated) }}
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { ReloadOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons-vue'
import { getPriceOverview } from '@/api/real_time'
import type { PriceOverview, PriceOverviewItem } from '@/types'

// 表格列定义
const columns = [
  {
    title: '产品名称',
    dataIndex: 'product_name',
    key: 'product_name',
  },
  {
    title: '产地',
    dataIndex: 'provenance_name',
    key: 'provenance_name',
  },
  {
    title: '当前价格(元/kg)',
    dataIndex: 'current_price',
    key: 'current_price',
    sorter: (a: PriceOverviewItem, b: PriceOverviewItem) => a.current_price - b.current_price,
  },
  {
    title: '价格变动',
    dataIndex: 'price_change',
    key: 'price_change',
    sorter: (a: PriceOverviewItem, b: PriceOverviewItem) => a.price_change - b.price_change,
  },
  {
    title: '更新时间',
    dataIndex: 'last_updated',
    key: 'last_updated',
  },
]

// 状态
const loading = ref(false)
const overview = ref<PriceOverview | null>(null)

// 表格数据
const tableData = computed(() => overview.value?.items || [])

// 格式化日期
const formatDate = (dateString: string) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm')
}

// 获取价格概览数据
const fetchData = async () => {
  loading.value = true
  try {
    const response = await getPriceOverview()
    if (response.code === 0 || response.code === 200) {
      overview.value = response.data
    } else {
      message.error(response.msg || '获取价格概览失败')
    }
  } catch (error) {
    console.error('获取价格概览失败:', error)
    message.error('获取价格概览失败')
  } finally {
    loading.value = false
  }
}

// 刷新数据
const refreshData = () => {
  fetchData()
}

// 组件挂载时获取数据
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.price-overview-panel {
  margin-bottom: 24px;
}
</style>
