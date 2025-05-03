<template>
  <div class="model-evaluations-container">
    <a-page-header title="模型评估管理" sub-title="查看模型评估记录和预测精度">
      <!-- 过滤条件 -->
      <div class="filter-container">
        <a-form layout="inline" :model="filterForm">

          <a-form-item label="蔬菜名称">
            <a-input
              v-model:value="filterForm.product_name"
              placeholder="搜索蔬菜名称"
              style="width: 180px"
              allow-clear
            />
          </a-form-item>

          <a-form-item label="最小准确率">
            <a-input-number
              v-model:value="filterForm.min_accuracy"
              placeholder="最小准确率"
              style="width: 120px"
              :min="0"
              :max="1"
              :step="0.05"
            />
          </a-form-item>

          <a-form-item label="最大误差">
            <a-input-number
              v-model:value="filterForm.max_error"
              placeholder="最大误差"
              style="width: 120px"
              :min="0"
              :step="0.5"
            />
          </a-form-item>

          <a-form-item>
            <a-button type="primary" @click="handleSearch">
              <template #icon><search-outlined /></template>
              查询
            </a-button>
            <a-button style="margin-left: 8px" @click="resetFilters">
              <template #icon><reload-outlined /></template>
              重置
            </a-button>
          </a-form-item>
        </a-form>
      </div>

      <!-- 表格 -->
      <a-table
        :dataSource="evaluations"
        :columns="columns"
        :pagination="tablePagination"
        :loading="loading"
        rowKey="id"
        @change="handleTableChange"
      >
        <!-- 算法列 -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'algorithm'">
            <a-tag :color="getAlgorithmColor(record.algorithm)">
              {{ getAlgorithmName(record.algorithm) }}
            </a-tag>
          </template>

          <!-- 准确率列 -->
          <template v-if="column.dataIndex === 'prediction_accuracy'">
            <a-progress
              :percent="record.prediction_accuracy * 100"
              :format="(percent: number) => percent.toFixed(2) + '%'"
              size="small"
              :status="getAccuracyStatus(record.prediction_accuracy)"
            />
          </template>

          <!-- 误差列 -->
          <template v-if="column.dataIndex === 'mean_absolute_error'">
            {{ record.mean_absolute_error.toFixed(4) }}
          </template>

          <!-- R方列 -->
          <template v-if="column.dataIndex === 'r_squared'">
            {{ record.r_squared.toFixed(4) }}
          </template>

          <!-- 操作列 -->
          <template v-if="column.dataIndex === 'action'">
            <a-button type="link" size="small" @click="viewDetails(record.id)">详情</a-button>
          </template>
        </template>
      </a-table>

      <!-- 结果统计 -->
      <div class="summary-container" v-if="evaluations.length > 0">
        <a-divider>统计信息</a-divider>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-statistic title="评估记录总数" :value="total" />
          </a-col>
          <a-col :span="8">
            <a-statistic
              title="平均准确率"
              :value="getAverageAccuracy()"
              :precision="2"
              suffix="%"
              :valueStyle="{ color: getAverageAccuracyColor() }"
            />
          </a-col>
          <a-col :span="8">
            <a-statistic
              title="平均误差"
              :value="getAverageError()"
              :precision="4"
              :valueStyle="{ color: '#cf1322' }"
            />
          </a-col>
        </a-row>
      </div>
    </a-page-header>

    <!-- 详情抽屉 -->
    <a-drawer title="评估详情" :visible="drawerVisible" @close="closeDrawer" width="500">
      <a-descriptions bordered v-if="currentEvaluation" :column="1">
        <a-descriptions-item label="ID">{{ currentEvaluation.id }}</a-descriptions-item>
        <a-descriptions-item label="蔬菜产品">{{
          currentEvaluation.product_name || '未知'
        }}</a-descriptions-item>
        <a-descriptions-item label="算法">
          <a-tag :color="getAlgorithmColor(currentEvaluation.algorithm)">
            {{ getAlgorithmName(currentEvaluation.algorithm) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="预测准确率">
          <a-progress
            :percent="currentEvaluation.prediction_accuracy * 100"
            :format="(percent: number) => percent.toFixed(2) + '%'"
            :status="getAccuracyStatus(currentEvaluation.prediction_accuracy)"
          />
        </a-descriptions-item>
        <a-descriptions-item label="平均绝对误差">{{
          currentEvaluation.mean_absolute_error.toFixed(4)
        }}</a-descriptions-item>
        <a-descriptions-item label="均方误差">{{
          currentEvaluation.mean_squared_error.toFixed(4)
        }}</a-descriptions-item>
        <a-descriptions-item label="决定系数(R²)">{{
          currentEvaluation.r_squared.toFixed(4)
        }}</a-descriptions-item>
        <a-descriptions-item label="评估时间">{{
          formatDateTime(currentEvaluation.evaluation_date)
        }}</a-descriptions-item>
        <a-descriptions-item label="训练状态">
          <a-tag :color="getStatusColor(currentEvaluation.training_status)">
            {{ getStatusText(currentEvaluation.training_status) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="训练时间">{{
          formatDateTime(currentEvaluation.training_date)
        }}</a-descriptions-item>
      </a-descriptions>

      <div class="drawer-footer" v-if="currentEvaluation">
        <a-button type="primary" @click="navigateToTraining(currentEvaluation.model_id)">
          查看关联训练
        </a-button>
      </div>
    </a-drawer>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import { useRouter } from 'vue-router'
import type { TablePaginationConfig } from 'ant-design-vue'
import { getModelEvaluations, getModelEvaluationDetail } from '@/api/prediction'
import type { ModelEvaluation, ModelEvaluationFilter } from '@/types/prediction'

const router = useRouter()
const loading = ref(false)
const evaluations = ref<ModelEvaluation[]>([])
const drawerVisible = ref(false)
const currentEvaluation = ref<ModelEvaluation | null>(null)
const total = ref(0)

// 过滤条件表单
const filterForm = reactive<ModelEvaluationFilter>({
  algorithm: undefined,
  product_name: undefined,
  min_accuracy: undefined,
  max_error: undefined,
  page: 1,
  limit: 10,
})

// 表格分页设置
const tablePagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条记录`,
})

// 表格列定义
const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    width: 80,
  },
  {
    title: '算法',
    dataIndex: 'algorithm',
    width: 120,
  },
  {
    title: '产品',
    dataIndex: 'product_name',
    ellipsis: true,
  },
  {
    title: '准确率',
    dataIndex: 'prediction_accuracy',
    width: 200,
    sorter: true,
  },
  {
    title: '平均误差',
    dataIndex: 'mean_absolute_error',
    width: 120,
    sorter: true,
  },
  {
    title: 'R²',
    dataIndex: 'r_squared',
    width: 100,
    sorter: true,
  },
  {
    title: '评估时间',
    dataIndex: 'evaluation_date',
    width: 180,
    customRender: ({ text }: { text: string }) => formatDateTime(text),
  },
  {
    title: '操作',
    dataIndex: 'action',
    width: 100,
    fixed: 'right',
  },
]

// 获取评估列表
const fetchEvaluations = async () => {
  loading.value = true
  try {
    const response = await getModelEvaluations({
      ...filterForm,
      page: tablePagination.current,
    })

    if (response.code === 0 && response.data) {
      evaluations.value = response.data.items
      total.value = response.data.total
      tablePagination.total = response.data.total
    } else {
      message.error(response.msg || '获取模型评估列表失败')
    }
  } catch (error) {
    console.error('获取模型评估列表失败:', error)
    message.error('获取模型评估列表失败')
  } finally {
    loading.value = false
  }
}

// 查看评估详情
const viewDetails = async (evaluationId: number) => {
  loading.value = true
  try {
    const response = await getModelEvaluationDetail(evaluationId)

    if (response.code === 0 && response.data) {
      currentEvaluation.value = response.data
      drawerVisible.value = true
    } else {
      message.error(response.msg || '获取评估详情失败')
    }
  } catch (error) {
    console.error('获取评估详情失败:', error)
    message.error('获取评估详情失败')
  } finally {
    loading.value = false
  }
}

// 关闭详情抽屉
const closeDrawer = () => {
  drawerVisible.value = false
  currentEvaluation.value = null
}

// 导航到训练详情
const navigateToTraining = (trainingId: number) => {
  router.push(`/admin/trainings/${trainingId}`)
}

// 处理查询
const handleSearch = () => {
  tablePagination.current = 1 // 重置到第一页
  fetchEvaluations()
}

// 重置过滤条件
const resetFilters = () => {
  filterForm.algorithm = undefined
  filterForm.product_name = undefined
  filterForm.min_accuracy = undefined
  filterForm.max_error = undefined
  tablePagination.current = 1
  fetchEvaluations()
}

// 处理表格变化事件（排序、分页）
const handleTableChange = (pagination: TablePaginationConfig) => {
  tablePagination.current = pagination.current
  tablePagination.pageSize = pagination.pageSize
  fetchEvaluations()
}

// 计算当前页面评估记录的平均准确率
const getAverageAccuracy = () => {
  if (evaluations.value.length === 0) return 0
  const sum = evaluations.value.reduce((acc, item) => acc + item.prediction_accuracy, 0)
  return (sum / evaluations.value.length) * 100 // 转换为百分比
}

// 计算当前页面评估记录的平均误差
const getAverageError = () => {
  if (evaluations.value.length === 0) return 0
  const sum = evaluations.value.reduce((acc, item) => acc + item.mean_absolute_error, 0)
  return sum / evaluations.value.length
}

// 获取平均准确率的颜色
const getAverageAccuracyColor = () => {
  const accuracy = getAverageAccuracy()
  if (accuracy >= 80) return '#52c41a' // 绿色
  if (accuracy >= 60) return '#faad14' // 黄色
  return '#f5222d' // 红色
}

// 辅助函数
const getAlgorithmColor = (algorithm: string): string => {
  const colors: Record<string, string> = {
    LSTM: 'blue',
    ARIMA: 'green',
    LinearRegression: 'orange',
    Prophet: 'purple',
  }
  return colors[algorithm] || 'default'
}

const getAlgorithmName = (algorithm: string): string => {
  const names: Record<string, string> = {
    LSTM: 'LSTM神经网络',
    ARIMA: 'ARIMA时序',
    LinearRegression: '线性回归',
    Prophet: 'Prophet',
  }
  return names[algorithm] || algorithm
}

const getAccuracyStatus = (accuracy: number): 'success' | 'exception' | 'normal' => {
  if (accuracy >= 0.8) return 'success'
  if (accuracy >= 0.6) return 'normal'
  return 'exception'
}

const getStatusColor = (status?: string): string => {
  if (!status) return 'default'

  const colors: Record<string, string> = {
    running: 'blue',
    pending: 'orange',
    completed: 'green',
    failed: 'red',
  }
  return colors[status] || 'default'
}

const getStatusText = (status?: string): string => {
  if (!status) return '未知'

  const texts: Record<string, string> = {
    running: '训练中',
    pending: '等待中',
    completed: '已完成',
    failed: '失败',
  }
  return texts[status] || status
}

const formatDateTime = (dateTimeStr?: string): string => {
  if (!dateTimeStr) return '-'
  const date = new Date(dateTimeStr)
  return date.toLocaleString()
}

onMounted(() => {
  fetchEvaluations()
})
</script>

<style scoped>
.model-evaluations-container {
  padding: 20px;
}

.filter-container {
  margin-bottom: 16px;
  padding: 16px;
  background-color: #fafafa;
  border-radius: 4px;
}

.summary-container {
  margin-top: 20px;
  padding: 16px;
}

.drawer-footer {
  position: absolute;
  bottom: 0;
  width: 100%;
  border-top: 1px solid #e8e8e8;
  padding: 10px 16px;
  text-align: right;
  left: 0;
  background: #fff;
}
</style>
