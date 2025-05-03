<template>
  <div class="model-training-container">
    <a-page-header title="模型训练管理" sub-title="训练蔬菜价格预测模型">
      <template #extra>
        <a-button @click="refreshData">
          <template #icon><reload-outlined /></template>
          刷新
        </a-button>
      </template>
    </a-page-header>

    <a-card :bordered="false" class="search-card" style="margin-top: 16px">
      <a-form layout="inline">
        <a-form-item label="蔬菜">
          <a-select
            v-model:value="selectedVegetable"
            placeholder="请选择蔬菜"
            style="width: 300px"
            :options="vegetableOptions"
            show-search
            :filter-option="filterOption"
            :virtual="false"
            :max-tag-count="10"
          />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="trainModel" :loading="trainingLoading">
            <template #icon><thunderbolt-outlined /></template>
            开始训练LSTM模型
          </a-button>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" danger @click="trainAllModels" :loading="allTrainingLoading">
            <template #icon><thunderbolt-outlined /></template>
            训练所有蔬菜
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 训练状态卡片 -->
    <a-row :gutter="16" style="margin-top: 16px">
      <a-col :span="8">
        <a-card :bordered="false">
          <a-statistic
            title="今日训练次数"
            :value="trainingStats.todayCount"
            :value-style="{ color: '#1890ff' }"
          >
            <template #prefix>
              <calendar-outlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card :bordered="false">
          <a-statistic
            title="训练中模型"
            :value="trainingStats.runningCount"
            :value-style="{ color: '#faad14' }"
          >
            <template #prefix>
              <loading-outlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card :bordered="false">
          <a-statistic
            title="总训练次数"
            :value="trainingStats.totalCount"
            :value-style="{ color: '#52c41a' }"
          >
            <template #prefix>
              <bar-chart-outlined />
            </template>
          </a-statistic>
        </a-card>
      </a-col>
    </a-row>

    <!-- 当前训练模型列表 -->
    <a-card :bordered="false" title="最近训练任务" style="margin-top: 16px">
      <a-table
        :columns="recentColumns"
        :data-source="recentTrainings"
        :loading="loading"
        :pagination="{ pageSize: 5 }"
        rowKey="id"
      >
        <template #bodyCell="{ column, record }">
          <!-- 状态标签 -->
          <template v-if="column.dataIndex === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>

          <!-- 开始时间格式化 -->
          <template v-if="column.dataIndex === 'start_time'">
            {{ formatDateTime(record.start_time) }}
          </template>

          <!-- 结束时间格式化 -->
          <template v-if="column.dataIndex === 'end_time'">
            {{ record.end_time ? formatDateTime(record.end_time) : '-' }}
          </template>

          <!-- 操作按钮 -->
          <template v-if="column.dataIndex === 'action'">
            <a-space>
              <a @click="viewDetails(record)">日志详情</a>
              <a v-if="record.status === 'pending'" @click="cancelTraining(record.id)">取消</a>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 训练参数配置 -->
    <a-card :bordered="false" title="LSTM训练参数配置" style="margin-top: 16px">
      <a-form :model="trainingParams" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="历史数据范围 (天)">
              <a-input-number v-model:value="trainingParams.history_days" :min="7" :max="365" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="预测天数">
              <a-input-number v-model:value="trainingParams.prediction_days" :min="1" :max="30" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="序列长度">
              <a-input-number v-model:value="trainingParams.sequence_length" :min="3" :max="60" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="价格数据平滑">
              <a-switch v-model:checked="trainingParams.smoothing" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="季节性因素">
              <a-switch v-model:checked="trainingParams.seasonality" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="自动优化参数">
              <a-switch v-model:checked="trainingParams.auto_optimize" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <!-- 训练日志详情模态框 -->
    <a-modal
      v-model:visible="logModalVisible"
      title="训练日志详情"
      @cancel="closeLogModal"
      :footer="null"
      width="800px"
    >
      <a-descriptions :column="1" bordered>
        <a-descriptions-item label="ID">{{ currentModel?.id }}</a-descriptions-item>
        <a-descriptions-item label="算法">{{ currentModel?.algorithm }}</a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="getStatusColor(currentModel?.status)">
            {{ getStatusText(currentModel?.status) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="开始时间">
          {{ currentModel?.start_time ? formatDateTime(currentModel.start_time) : '-' }}
        </a-descriptions-item>
        <a-descriptions-item label="结束时间">
          {{ currentModel?.end_time ? formatDateTime(currentModel.end_time) : '-' }}
        </a-descriptions-item>
      </a-descriptions>

      <div class="log-container">
        <h3>训练日志:</h3>
        <a-card class="log-card">
          <pre v-if="currentModel?.log">{{ currentModel.log }}</pre>
          <a-empty v-else description="暂无日志信息" />
        </a-card>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import {
  ReloadOutlined,
  ThunderboltOutlined,
  CalendarOutlined,
  LoadingOutlined,
  BarChartOutlined,
} from '@ant-design/icons-vue'
import { trainPredictionModel, trainAllVegetableModels, getTrainingHistory } from '@/api/prediction'
import { getVegetableOptions } from '@/api/vegetable'
import type { ModelTrainingResponse, TrainingConfig } from '@/types/prediction'
import type { VegetableResponse } from '@/types/vegetable'

// 状态
const loading = ref(false)
const trainingLoading = ref(false)
const allTrainingLoading = ref(false)
const logModalVisible = ref(false)
const selectedVegetable = ref<number>()
const recentTrainings = ref<ModelTrainingResponse[]>([])
const currentModel = ref<ModelTrainingResponse | null>(null)
const vegetableOptions = ref<{ label: string; value: number }[]>([])

// 训练状态过滤器
const statusFilter = ref<string | null>(null)
const algorithmFilter = ref<string | null>(null)

// 训练统计数据
const trainingStats = reactive({
  todayCount: 0,
  runningCount: 0,
  totalCount: 0,
})

// 训练参数
const trainingParams = reactive<TrainingConfig>({
  algorithm: 'lstm',
  history_days: 30,
  prediction_days: 7,
  smoothing: true,
  seasonality: true,
  auto_optimize: true,
  sequence_length: 7,
})

// 表格列定义
const recentColumns = [
  {
    title: 'ID',
    dataIndex: 'id',
    width: 80,
  },
  {
    title: '蔬菜',
    dataIndex: 'vegetable_id',
    width: 120,
    customRender: ({ record }: any) => {
      const veg = vegetableOptions.value.find((v) => v.value === record.vegetable_id)
      return veg ? veg.label : record.vegetable_id || '通用模型'
    },
  },
  {
    title: '算法',
    dataIndex: 'algorithm',
    width: 120,
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 100,
    filters: [
      { text: '等待中', value: 'pending' },
      { text: '训练中', value: 'running' },
      { text: '已完成', value: 'completed' },
      { text: '失败', value: 'failed' },
    ],
    onFilter: (value: string, record: ModelTrainingResponse) => record.status === value,
  },
  {
    title: '开始时间',
    dataIndex: 'start_time',
    width: 180,
  },
  {
    title: '结束时间',
    dataIndex: 'end_time',
    width: 180,
  },
  {
    title: '操作',
    dataIndex: 'action',
    width: 200,
  },
]

// 获取蔬菜列表
const fetchVegetables = async () => {
  try {
    const res = await getVegetableOptions()
    if ((res.code === 0 || res.code === 200) && res.data) {
      // 按名称排序
      const mappedOptions = res.data
        .map((item: any) => ({
          label: item.name,
          value: item.id,
        }))
        .sort((a: any, b: any) => a.label.localeCompare(b.label, 'zh-CN'))

      vegetableOptions.value = mappedOptions
    }
  } catch (error) {
    console.error('获取蔬菜选项失败:', error)
    message.error('获取蔬菜选项失败')
  }
}

// 获取训练历史数据
const fetchTrainingHistory = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (statusFilter.value) params.status = statusFilter.value
    if (algorithmFilter.value) params.algorithm = algorithmFilter.value
    if (selectedVegetable.value) params.vegetable_id = selectedVegetable.value

    const res = await getTrainingHistory(params)
    if (res.code === 0 && res.data) {
      recentTrainings.value = res.data

      // 计算训练统计数据
      calculateLocalStats()
    }
  } catch (error) {
    console.error('获取训练历史失败:', error)
    message.error('获取训练历史失败')
  } finally {
    loading.value = false
  }
}

// 本地计算训练统计数据
const calculateLocalStats = () => {
  if (!recentTrainings.value.length) return

  const today = dayjs().startOf('day')
  trainingStats.todayCount = recentTrainings.value.filter((item) =>
    dayjs(item.start_time).isAfter(today),
  ).length

  trainingStats.runningCount = recentTrainings.value.filter(
    (item) => item.status === 'running' || item.status === 'pending',
  ).length

  trainingStats.totalCount = recentTrainings.value.length
}

// 训练模型
const trainModel = async () => {
  if (!selectedVegetable.value) {
    message.warning('请先选择蔬菜')
    return
  }

  const config: TrainingConfig = {
    algorithm: 'lstm',
    history_days: trainingParams.history_days,
    prediction_days: trainingParams.prediction_days,
    smoothing: trainingParams.smoothing,
    seasonality: trainingParams.seasonality,
    sequence_length: trainingParams.sequence_length,
  }

  trainingLoading.value = true
  try {
    const res = await trainPredictionModel(selectedVegetable.value, config)

    if ((res.code === 0 || res.code === 200) && res.data) {
      message.success(res.msg || 'LSTM模型训练已启动')
      fetchTrainingHistory()
    } else {
      message.error(res.msg || '启动模型训练失败')
    }
  } catch (error) {
    console.error('启动模型训练失败:', error)
    message.error('启动模型训练失败')
  } finally {
    trainingLoading.value = false
  }
}

// 训练所有蔬菜模型
const trainAllModels = async () => {
  allTrainingLoading.value = true
  try {
    const config: TrainingConfig = {
      algorithm: 'lstm',
      history_days: trainingParams.history_days,
      prediction_days: trainingParams.prediction_days,
      smoothing: trainingParams.smoothing,
      seasonality: trainingParams.seasonality,
      sequence_length: trainingParams.sequence_length,
    }

    const res = await trainAllVegetableModels(config)

    if ((res.code === 0 || res.code === 200) && res.data) {
      message.success(res.msg || '所有蔬菜的LSTM模型训练已启动')
      // 延迟刷新以等待训练任务创建
      setTimeout(() => {
        fetchTrainingHistory()
      }, 3000)
    } else {
      message.error(res.msg || '启动训练失败')
    }
  } catch (error) {
    console.error('启动所有模型训练失败:', error)
    message.error('启动所有模型训练失败')
  } finally {
    allTrainingLoading.value = false
  }
}

// 查看模型详情
const viewDetails = (record: ModelTrainingResponse) => {
  currentModel.value = record
  logModalVisible.value = true
}

// 取消训练
const cancelTraining = (id: number) => {
  message.success('已取消训练任务')
  fetchTrainingHistory()
}

// 状态颜色映射
const getStatusColor = (status: string | undefined): string => {
  if (!status) return 'default'

  const statusMap: Record<string, string> = {
    pending: 'blue',
    running: 'processing',
    completed: 'success',
    failed: 'error',
  }

  return statusMap[status] || 'default'
}

// 状态文本映射
const getStatusText = (status: string | undefined): string => {
  if (!status) return '未知'

  const statusMap: Record<string, string> = {
    pending: '等待中',
    running: '训练中',
    completed: '已完成',
    failed: '失败',
  }

  return statusMap[status] || '未知'
}

// 格式化日期时间
const formatDateTime = (dateString: string | undefined): string => {
  if (!dateString) return '-'
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
}

// 过滤器 - 搜索蔬菜
const filterOption = (input: string, option: any) => {
  return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
}

// 刷新数据
const refreshData = () => {
  fetchTrainingHistory()
}

// 关闭日志模态框
const closeLogModal = () => {
  logModalVisible.value = false
  currentModel.value = null
}

// 组件挂载时加载数据
onMounted(() => {
  fetchVegetables()
  fetchTrainingHistory()
})
</script>

<style scoped>
.model-training-container {
  padding: 0 16px;
}

.training-mode-card,
.search-card {
  margin-bottom: 16px;
}

.log-container {
  margin-top: 20px;
}

.log-card {
  max-height: 400px;
  overflow-y: auto;
  background-color: #f5f5f5;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', Courier, monospace;
  padding: 10px;
  margin: 0;
}
</style>
