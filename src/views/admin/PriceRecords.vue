<template>
  <div class="price-records-container">
    <a-page-header title="价格记录管理" sub-title="查看和管理蔬菜价格数据">
      <template #extra>
        <a-space>
          <a-input-search
            v-model:value="searchValue"
            placeholder="搜索蔬菜名称"
            style="width: 200px"
            @search="onSearch"
          />
          <a-button v-if="isAdmin" type="primary" @click="showAddModal">
            <template #icon><plus-outlined /></template>
            添加价格记录
          </a-button>
          <a-button @click="refreshData">
            <template #icon><reload-outlined /></template>
            刷新
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-card :bordered="false">
      <a-table
        :columns="columns"
        :data-source="priceRecords"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        rowKey="id"
      >
        <template #bodyCell="{ column, record }">
          <!-- 价格格式化 -->
          <template v-if="column.dataIndex === 'price'">
            <a-statistic
              :value="record.price"
              :precision="2"
              suffix="元/kg"
              :value-style="{ color: getColorByPrice(record.price) }"
            />
          </template>

          <!-- 价格变化展示 -->
          <template v-if="column.dataIndex === 'priceChange'">
            <a-tag
              :color="record.priceChange > 0 ? 'red' : record.priceChange < 0 ? 'green' : 'blue'"
            >
              {{ record.priceChange > 0 ? '+' : '' }}{{ record.priceChange.toFixed(2) }}
              {{ record.priceChange !== 0 ? '%' : '' }}
            </a-tag>
          </template>

          <!-- 时间格式化 -->
          <template v-if="column.dataIndex === 'price_date'">
            {{ formatDate(record.price_date) }}
          </template>

          <!-- 是否校正 -->
          <template v-if="column.dataIndex === 'is_corrected'">
            <a-tag :color="record.is_corrected ? 'orange' : 'green'">
              {{ record.is_corrected ? '已校正' : '原始数据' }}
            </a-tag>
          </template>

          <!-- 操作按钮 -->
          <template v-if="column.dataIndex === 'action'">
            <a-space>
              <a @click="viewDetails(record)">详情</a>
              <a-divider type="vertical" v-if="isAdmin" />
              <a @click="showEditModal(record)" v-if="isAdmin">编辑</a>
              <a-divider type="vertical" v-if="isAdmin" />
              <a-popconfirm
                title="确定要删除此价格记录吗?"
                @confirm="confirmDelete(record.id)"
                v-if="isAdmin"
              >
                <a style="color: #ff4d4f">删除</a>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 添加/编辑价格记录模态框 -->
    <a-modal
      :visible="modalVisible"
      :title="modalTitle"
      @cancel="closeModal"
      @ok="handleSubmit"
      :confirmLoading="submitLoading"
    >
      <a-form
        :model="formState"
        :rules="rules"
        ref="formRef"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item label="蔬菜" name="vegetable_id">
          <a-select
            v-model:value="formState.vegetable_id"
            :options="vegetableOptions"
            placeholder="请选择蔬菜"
            show-search
            :filter-option="filterOption"
          />
        </a-form-item>

        <a-form-item label="价格" name="price">
          <a-input-number
            v-model:value="formState.price"
            :min="0"
            :max="100"
            :precision="2"
            style="width: 100%"
            addon-after="元/kg"
          />
        </a-form-item>

        <a-form-item label="最高价" name="top_price">
          <a-input-number
            v-model:value="formState.top_price"
            :min="0"
            :max="100"
            :precision="2"
            style="width: 100%"
            addon-after="元/kg"
          />
        </a-form-item>

        <a-form-item label="最低价" name="minimum_price">
          <a-input-number
            v-model:value="formState.minimum_price"
            :min="0"
            :max="100"
            :precision="2"
            style="width: 100%"
            addon-after="元/kg"
          />
        </a-form-item>

        <a-form-item label="平均价" name="average_price">
          <a-input-number
            v-model:value="formState.average_price"
            :min="0"
            :max="100"
            :precision="2"
            style="width: 100%"
            addon-after="元/kg"
          />
        </a-form-item>

        <a-form-item label="价格日期" name="price_date">
          <a-date-picker
            v-model:value="formState.price_date"
            style="width: 100%"
            :disabledDate="disabledDate"
            show-time
            format="YYYY-MM-DD HH:mm:ss"
          />
        </a-form-item>

        <a-form-item label="产地" name="provenance_name">
          <a-input v-model:value="formState.provenance_name" placeholder="请输入产地名称" />
        </a-form-item>

        <a-form-item label="是否校正" name="is_corrected">
          <a-switch v-model:checked="formState.is_corrected" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 价格详情模态框 -->
    <a-modal
      :visible="detailVisible"
      title="价格记录详情"
      @cancel="closeDetailModal"
      :footer="null"
      width="800px"
    >
      <a-descriptions bordered>
        <a-descriptions-item label="蔬菜ID" span="3">
          {{ currentRecord?.vegetable_id }}
        </a-descriptions-item>
        <a-descriptions-item label="蔬菜名称" span="3">
          {{
            currentRecord?.vegetable?.product_name || getVegetableName(currentRecord?.vegetable_id)
          }}
        </a-descriptions-item>
        <a-descriptions-item label="价格"> {{ currentRecord?.price }} 元/kg </a-descriptions-item>
        <a-descriptions-item label="最高价">
          {{ currentRecord?.top_price }} 元/kg
        </a-descriptions-item>
        <a-descriptions-item label="最低价">
          {{ currentRecord?.minimum_price }} 元/kg
        </a-descriptions-item>
        <a-descriptions-item label="平均价">
          {{ currentRecord?.average_price }} 元/kg
        </a-descriptions-item>
        <a-descriptions-item label="价格变化">
          <a-tag
            :color="
              currentRecord?.price_change && currentRecord.price_change > 0
                ? 'red'
                : currentRecord?.price_change && currentRecord.price_change < 0
                  ? 'green'
                  : 'blue'
            "
          >
            {{ currentRecord?.price_change && currentRecord.price_change > 0 ? '+' : ''
            }}{{ currentRecord?.price_change?.toFixed(2)
            }}{{ currentRecord?.price_change ? '%' : '' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="价格日期" span="2">
          {{ formatDate(currentRecord?.price_date) }}
        </a-descriptions-item>
        <a-descriptions-item label="产地" span="3">
          {{
            currentRecord?.provenance_name || currentRecord?.vegetable?.provenance_name || '未知'
          }}
        </a-descriptions-item>
        <a-descriptions-item label="数据是否校正">
          <a-tag :color="currentRecord?.is_corrected ? 'orange' : 'green'">
            {{ currentRecord?.is_corrected ? '已校正' : '原始数据' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="记录ID">
          {{ currentRecord?.id }}
        </a-descriptions-item>
        <a-descriptions-item label="时间戳">
          {{ formatDate(currentRecord?.timestamp) }}
        </a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons-vue'
import dayjs, { Dayjs } from 'dayjs'
import { useUserStore } from '@/stores/user'
import { UserType } from '@/types/user'
import {
  getPriceRecords,
  getPriceRecord,
  createPriceRecord,
  updatePriceRecord,
  deletePriceRecord,
} from '@/api/price'
import { getVegetableNameById } from '@/api/vegetable'
import type { PriceRecordResponse, PriceRecordCreate, PriceRecordUpdate } from '@/types/price'
// 表单状态接口，使用Dayjs作为日期类型
interface PriceRecordForm {
  vegetable_id: number
  price: number
  top_price?: number
  minimum_price?: number
  average_price?: number
  price_date: Dayjs | null
  provenance_name: string
  is_corrected: boolean
}

// 状态
const loading = ref(false)
const submitLoading = ref(false)
const priceRecords = ref<PriceRecordResponse[]>([])
const userStore = useUserStore()
const modalVisible = ref(false)
const detailVisible = ref(false)
const currentRecord = ref<PriceRecordResponse | null>(null)
const formRef = ref<FormInstance>()
const searchValue = ref('')

// 计算属性
const isAdmin = computed(() => {
  return userStore.userInfo?.user_type === UserType.ADMIN
})

const modalTitle = computed(() => {
  return currentRecord.value ? '编辑价格记录' : '添加价格记录'
})

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showTotal: (total: number) => `共 ${total} 条记录`,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50', '100'],
})

// 表单状态
const formState = reactive<PriceRecordForm>({
  vegetable_id: 0,
  price: 0,
  top_price: undefined,
  minimum_price: undefined,
  average_price: undefined,
  price_date: null,
  provenance_name: '',
  is_corrected: false,
})

// 表单验证规则
const rules = {
  vegetable_id: [{ required: true, message: '请选择蔬菜', trigger: 'change' }],
  price: [
    { required: true, message: '请输入价格', trigger: 'change' },
    { type: 'number', min: 0, message: '价格不能小于0', trigger: 'change' },
  ],
  price_date: [{ required: true, message: '请选择价格日期', trigger: 'change' }],
}

// 表格列定义
const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    width: 80,
  },
  {
    title: '蔬菜ID',
    dataIndex: 'vegetable_id',
    width: 100,
  },
  {
    title: '蔬菜名称',
    dataIndex: 'product_name',
    ellipsis: true,
  },
  {
    title: '价格',
    dataIndex: 'price',
    sorter: true,
    width: 120,
  },
  {
    title: '价格变化',
    dataIndex: 'priceChange',
    width: 120,
  },
  {
    title: '价格日期',
    dataIndex: 'price_date',
    sorter: true,
    width: 180,
  },
  {
    title: '产地',
    dataIndex: 'provenance_name',
    ellipsis: true,
  },
  {
    title: '数据来源',
    dataIndex: 'is_corrected',
    width: 120,
    filters: [
      { text: '原始数据', value: false },
      { text: '已校正', value: true },
    ],
  },
  {
    title: '操作',
    dataIndex: 'action',
    width: 150,
    fixed: 'right',
  },
]

// 蔬菜列表，实际项目中应该从API获取
const vegetableOptions = ref([
  { label: '白菜', value: 1 },
  { label: '土豆', value: 2 },
  { label: '西红柿', value: 3 },
  { label: '黄瓜', value: 4 },
  { label: '茄子', value: 5 },
])

// Select过滤函数
const filterOption = (input: string, option: any) => {
  return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
}

// 日期禁用函数，不能选择未来日期
const disabledDate = (current: Dayjs) => {
  return current && current > dayjs().endOf('day')
}

// 格式化日期
const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
}

// 根据价格获取颜色
const getColorByPrice = (price: number) => {
  if (price > 20) return '#cf1322' // 高价 - 红色
  if (price > 10) return '#fa8c16' // 中高价 - 橙色
  if (price > 5) return '#096dd9' // 中价 - 蓝色
  return '#389e0d' // 低价 - 绿色
}

// 获取蔬菜名称
const getVegetableName = (vegetableId?: number) => {
  if (!vegetableId) return '-'
  const option = vegetableOptions.value.find((opt) => opt.value === vegetableId)
  return option ? option.label : `未知蔬菜(ID:${vegetableId})`
}

// 加载价格记录
const loadPriceRecords = async () => {
  loading.value = true
  try {
    const res = await getPriceRecords(undefined, pagination.current, pagination.pageSize)
    console.log('价格记录', res)
    if (res.code === 0 || res.code === 200) {
      // 使用API返回的数据
      const records = await Promise.all(
        res.data.items.map(async (item: PriceRecordResponse) => {
          // 如果记录中有vegetable且有product_name，直接使用，否则从API获取
          const productName =
            item.vegetable?.product_name || (await getVegetableNameById(item.vegetable_id))
          return {
            ...item,
            product_name: productName,
            // 使用API返回的价格变化，无需再计算
            priceChange: item.price_change,
          }
        }),
      )

      priceRecords.value = records
      pagination.total = res.data.total || records.length
      pagination.current = res.data.page
    } else {
      message.error(res.msg || '获取价格记录失败')
    }
  } catch (error) {
    console.error('获取价格记录失败:', error)
    message.error('获取价格记录失败')
  } finally {
    loading.value = false
  }
}

// 刷新数据
const refreshData = () => {
  pagination.current = 1
  loadPriceRecords()
}

// 搜索处理
const onSearch = (value: string) => {
  searchValue.value = value
  pagination.current = 1
  loadPriceRecords()
}

// 表格变化处理
const handleTableChange = (pag: any, filters: any, sorter: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize

  // 处理排序和筛选
  // 这里需要根据实际API支持情况进行调整

  loadPriceRecords()
}

// 显示添加模态框
const showAddModal = () => {
  currentRecord.value = null
  resetForm()
  modalVisible.value = true
}

// 显示编辑模态框
const showEditModal = async (record: PriceRecordResponse) => {
  try {
    const res = await getPriceRecord(record.id)
    if (res.code === 0 || res.code === 200) {
      currentRecord.value = res.data

      // 设置表单初始值
      formState.vegetable_id = record.vegetable_id
      formState.price = record.price
      formState.top_price = record.top_price
      formState.minimum_price = record.minimum_price
      formState.average_price = record.average_price
      formState.price_date = record.price_date ? dayjs(record.price_date) : null
      formState.provenance_name = record.provenance_name || ''
      formState.is_corrected = record.is_corrected

      modalVisible.value = true
    } else {
      message.error(res.message || '获取价格记录详情失败')
    }
  } catch (error) {
    console.error('获取价格记录详情失败:', error)
    message.error('获取价格记录详情失败')
  }
}

// 查看详情
const viewDetails = (record: PriceRecordResponse) => {
  currentRecord.value = record
  detailVisible.value = true
}

// 关闭详情模态框
const closeDetailModal = () => {
  detailVisible.value = false
  currentRecord.value = null
}

// 关闭添加/编辑模态框
const closeModal = () => {
  modalVisible.value = false
  resetForm()
}

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields()
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value?.validate()

    submitLoading.value = true

    // 准备提交数据
    const submitData = {
      vegetable_id: formState.vegetable_id,
      price: formState.price,
      top_price: formState.top_price,
      minimum_price: formState.minimum_price,
      average_price: formState.average_price,
      price_date: formState.price_date ? formState.price_date.format('YYYY-MM-DDTHH:mm:ss') : '',
      provenance_name: formState.provenance_name,
      is_corrected: formState.is_corrected,
    }

    let res
    if (currentRecord.value) {
      // 更新
      const updateData: PriceRecordUpdate = {
        price: submitData.price,
        top_price: submitData.top_price,
        minimum_price: submitData.minimum_price,
        average_price: submitData.average_price,
        is_corrected: submitData.is_corrected,
      }

      res = await updatePriceRecord(currentRecord.value.id, updateData)
    } else {
      // 创建
      res = await createPriceRecord(submitData as PriceRecordCreate)
    }

    if (res.code === 0 || res.code === 200) {
      message.success(currentRecord.value ? '更新成功' : '添加成功')
      modalVisible.value = false
      loadPriceRecords()
    } else {
      message.error(res.message || (currentRecord.value ? '更新失败' : '添加失败'))
    }
  } catch (error) {
    console.error('表单验证失败:', error)
    message.error('请检查表单填写是否正确')
  } finally {
    submitLoading.value = false
  }
}

// 确认删除
const confirmDelete = async (id: number) => {
  try {
    const res = await deletePriceRecord(id)
    if (res.code === 0 || res.code === 200) {
      message.success('删除成功')
      loadPriceRecords()
    } else {
      message.error(res.message || '删除失败')
    }
  } catch (error) {
    console.error('删除价格记录失败:', error)
    message.error('删除价格记录失败')
  }
}

// 初始化
onMounted(() => {
  loadPriceRecords()
})
</script>

<style scoped>
.price-records-container {
  padding: 0 16px;
}

.ant-statistic {
  font-size: 14px;
}

.ant-table-cell {
  font-size: 14px;
}
</style>
