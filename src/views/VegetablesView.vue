<template>
  <div class="vegetables-container">
    <a-card class="search-card" title="蔬菜数据查询" :bordered="false">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="蔬菜名称">
          <a-input v-model:value="searchForm.name" placeholder="请输入蔬菜名称" />
        </a-form-item>
        <a-form-item label="价格范围">
          <a-space>
            <a-input-number
              v-model:value="searchForm.min_price"
              placeholder="最低价"
              style="width: 120px"
              :min="0"
              :precision="2"
              addon-after="元"
              allow-clear
            />
            <span>-</span>
            <a-input-number
              v-model:value="searchForm.max_price"
              placeholder="最高价"
              style="width: 120px"
              :min="0"
              :precision="2"
              addon-after="元"
              allow-clear
            />
          </a-space>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">
            <template #icon><search-outlined /></template>
            查询
          </a-button>
          <a-button style="margin-left: 8px" @click="resetSearch">
            <template #icon><redo-outlined /></template>
            重置
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <a-card class="data-card" :bordered="false">
      <template #title>
        <div class="card-title-with-actions">
          <span>蔬菜列表</span>
          <div class="actions">
            <a-button v-if="isAdmin" type="primary" @click="handleAddVegetable">
              <template #icon><plus-outlined /></template>
              添加蔬菜
            </a-button>
          </div>
        </div>
      </template>

      <!-- 显示当前过滤条件 -->
      <div class="active-filters" v-if="hasActiveFilters">
        <span>当前过滤条件: </span>
        <a-tag v-if="searchForm.name" closable @close="clearNameFilter">
          名称: {{ searchForm.name }}
        </a-tag>
        <a-tag v-if="searchForm.min_price !== undefined" closable @close="clearMinPriceFilter">
          最低价: {{ searchForm.min_price }} 元
        </a-tag>
        <a-tag v-if="searchForm.max_price !== undefined" closable @close="clearMaxPriceFilter">
          最高价: {{ searchForm.max_price }} 元
        </a-tag>
        <a-button type="link" size="small" @click="resetSearch"> 清除所有过滤条件 </a-button>
      </div>

      <a-table
        :dataSource="vegetables"
        :columns="columns"
        :pagination="pagination"
        :loading="loading"
        rowKey="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <!-- 种类信息 -->
          <template v-if="column.dataIndex === 'kind'">
            <a-tag v-if="record.kind === '1'" color="green">蔬菜</a-tag>
            <span v-else>{{ record.kind || '-' }}</span>
          </template>

          <!-- 计价单位 -->
          <template v-if="column.dataIndex === 'weight'">
            <span v-if="record.weight === 0">元/公斤</span>
            <span v-else-if="record.weight">{{ record.weight }} kg</span>
            <span v-else>-</span>
          </template>

          <!-- 价格信息 -->
          <template v-if="column.dataIndex === 'price'">
            <div>
              <div>均价: {{ record.average_price?.toFixed(2) || '-' }} 元/kg</div>
              <div>最高: {{ record.top_price?.toFixed(2) || '-' }} 元/kg</div>
              <div>最低: {{ record.minimum_price?.toFixed(2) || '-' }} 元/kg</div>
            </div>
          </template>

          <!-- 价格更新日期 -->
          <template v-if="column.dataIndex === 'price_date'">
            {{ record.price_date ? formatDate(record.price_date) : '-' }}
          </template>

          <!-- 操作按钮 -->
          <template v-if="column.dataIndex === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleViewVegetable(record)">
                <template #icon><eye-outlined /></template>
                查看
              </a-button>
              <a-button
                v-if="isAdmin"
                type="link"
                size="small"
                @click="handleEditVegetable(record)"
              >
                <template #icon><edit-outlined /></template>
                编辑
              </a-button>
              <a-popconfirm
                v-if="isAdmin"
                title="确定要删除该蔬菜吗?"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDeleteVegetable(record)"
              >
                <a-button type="link" danger size="small">
                  <template #icon><delete-outlined /></template>
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import {
  SearchOutlined,
  RedoOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue'
import { useUserStore } from '@/stores/user'
import {
  getVegetables,
  getVegetableKinds,
  deleteVegetable,
  getVegetablesByPriceRange,
} from '@/api/vegetable'
import type { VegetableResponse } from '@/types/vegetable'
import { getVegetableOptions } from '@/api/vegetable'
// 路由
const router = useRouter()

// 用户状态
const userStore = useUserStore()
const isAdmin = computed(() => userStore.userInfo?.user_type === 'admin')

// 数据状态
const vegetables = ref<VegetableResponse[]>([])
const loading = ref(false)
const kinds = ref<string[]>([])
const kindsLoading = ref(false)
const usesPriceFilter = ref(false)
const vegetableOptions = ref<{ label: string; value: number }[]>([])
// 搜索表单
const searchForm = reactive({
  name: '',
  min_price: undefined,
  max_price: undefined,
})

// 分页
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showTotal: (total: number) => `共 ${total} 条数据`,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50', '100'],
})

// 表格列
const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    width: 80,
  },
  {
    title: '蔬菜名称',
    dataIndex: 'product_name',
    width: 150,
  },
  {
    title: '产地',
    dataIndex: 'provenance_name',
    width: 150,
  },
  {
    title: '种类',
    dataIndex: 'kind',
    width: 120,
  },
  {
    title: '规格',
    dataIndex: 'standard',
    width: 120,
  },
  {
    title: '价格信息',
    dataIndex: 'price',
    width: 180,
  },
  {
    title: '计价单位',
    dataIndex: 'weight',
    width: 120,
  },
  {
    title: '价格更新日期',
    dataIndex: 'price_date',
    width: 150,
  },
  {
    title: '操作',
    dataIndex: 'action',
    width: 200,
    fixed: 'right',
  },
]

// 格式化日期
const formatDate = (dateString: string) => {
  return dayjs(dateString).format('YYYY-MM-DD')
}

// 获取蔬菜数据
const fetchData = async () => {
  loading.value = true
  try {
    let res

    // 使用价格过滤还是普通查询
    if (searchForm.min_price !== undefined || searchForm.max_price !== undefined) {
      usesPriceFilter.value = true
      res = await getVegetablesByPriceRange({
        min_price: searchForm.min_price,
        max_price: searchForm.max_price,
        name: searchForm.name || undefined,
        page: pagination.current,
        page_size: pagination.pageSize,
      })
    } else {
      usesPriceFilter.value = false
      res = await getVegetables({
        page: pagination.current,
        page_size: pagination.pageSize,
        name: searchForm.name || undefined,
      })
    }
    console.log(res)
    if (res.code === 0 || res.code === 200) {
      vegetables.value = res.data.items
      pagination.total = res.data.total
      pagination.current = res.data.page
    } else {
      message.error(res.msg || '获取蔬菜数据失败')
    }
  } catch (error) {
    console.error('获取蔬菜数据失败:', error)
    message.error('获取蔬菜数据失败')
  } finally {
    loading.value = false
  }
}

// 表格分页、排序、过滤器变化
const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchData()
}

// 处理搜索
const handleSearch = () => {
  pagination.current = 1 // 重置到第一页
  fetchData()
}

// 计算是否有激活的过滤条件
const hasActiveFilters = computed(() => {
  return (
    searchForm.name !== '' ||
    searchForm.min_price !== undefined ||
    searchForm.max_price !== undefined
  )
})

// 清除单个过滤条件
const clearNameFilter = () => {
  searchForm.name = ''
  handleSearch()
}

const clearMinPriceFilter = () => {
  searchForm.min_price = undefined
  handleSearch()
}

const clearMaxPriceFilter = () => {
  searchForm.max_price = undefined
  handleSearch()
}

// 重置搜索条件
const resetSearch = () => {
  searchForm.name = ''
  searchForm.min_price = undefined
  searchForm.max_price = undefined
  pagination.current = 1
  fetchData()
}

// 监听价格范围变化
watch(
  () => [searchForm.min_price, searchForm.max_price],
  () => {
    if (
      searchForm.min_price !== undefined &&
      searchForm.max_price !== undefined &&
      searchForm.min_price > searchForm.max_price
    ) {
      // 如果最低价大于最高价，自动交换
      const temp = searchForm.min_price
      searchForm.min_price = searchForm.max_price
      searchForm.max_price = temp
    }
  },
)

// 查看蔬菜详情
const handleViewVegetable = (record: VegetableResponse) => {
  router.push(`/vegetables/${record.id}`)
}

// 编辑蔬菜
const handleEditVegetable = (record: VegetableResponse) => {
  router.push(`/admin/vegetables/edit/${record.id}`)
}

// 添加蔬菜
const handleAddVegetable = () => {
  router.push('/vegetables/create')
}

// 删除蔬菜
const handleDeleteVegetable = async (record: VegetableResponse) => {
  try {
    const res = await deleteVegetable(record.id)
    if (res.code === 0 || res.code === 200) {
      message.success('蔬菜删除成功')
      fetchData() // 刷新数据
    } else {
      message.error(res.msg || '删除蔬菜失败')
    }
  } catch (error) {
    console.error(`删除蔬菜失败 (ID: ${record.id}):`, error)
    message.error('删除蔬菜失败')
  }
}

// 组件挂载时加载数据
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.vegetables-container {
  padding: 0 16px;
}

.search-card {
  margin-bottom: 16px;
}

.data-card {
  margin-bottom: 16px;
}

.active-filters {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.card-title-with-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.actions {
  display: flex;
  gap: 8px;
}
</style>
