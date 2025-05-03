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
              <a-descriptions-item label="种类">
                <template v-if="vegetable.kind === '1'">
                  <a-tag color="green">蔬菜</a-tag>
                </template>
                <template v-else>
                  {{ vegetable.kind || '-' }}
                </template>
              </a-descriptions-item>
              <a-descriptions-item label="规格">{{
                vegetable.standard || '-'
              }}</a-descriptions-item>
              <a-descriptions-item label="计价单位">
                <template v-if="vegetable.weight === 0">元/公斤</template>
                <template v-else>{{ vegetable.weight ? `${vegetable.weight} kg` : '-' }}</template>
              </a-descriptions-item>
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
      </a-row>

      <a-empty v-else-if="!loading" description="未找到蔬菜数据" />
    </a-spin>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
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

// 格式化日期
const formatDate = (dateString: string) => {
  return dayjs(dateString).format('YYYY-MM-DD')
}

// 获取蔬菜详情
const fetchData = async () => {
  if (!vegetableId.value) return

  loading.value = true
  try {
    const res = await getVegetableById(vegetableId.value)
    if (res.code === 0 || res.code === 200) {
      vegetable.value = res.data
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

// 页面导航
const goBack = () => {
  router.go(-1)
}

// 编辑蔬菜
const handleEdit = () => {
  if (vegetable.value) {
    router.push(`/admin/vegetables/edit/${vegetable.value.id}`)
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
</script>

<style scoped>
.vegetable-detail-container {
  padding: 0 16px;
}

.basic-info-card,
.price-info-card {
  margin-bottom: 16px;
}
</style>
