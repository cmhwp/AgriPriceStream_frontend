<template>
  <div class="edit-vegetable-container">
    <a-page-header :title="isEdit ? '编辑蔬菜' : '新增蔬菜'" @back="goBack" />

    <a-card :bordered="false">
      <a-spin :spinning="loading">
        <a-form
          :model="formState"
          :rules="rules"
          ref="formRef"
          :label-col="{ span: 4 }"
          :wrapper-col="{ span: 16 }"
        >
          <a-form-item label="名称" name="product_name">
            <a-input v-model:value="formState.product_name" placeholder="请输入蔬菜名称" />
          </a-form-item>

          <a-form-item label="产地" name="provenance_name">
            <a-select
              v-model:value="formState.provenance_name"
              placeholder="请选择产地"
              :loading="provenancesLoading"
              allow-clear
              show-search
            >
              <a-select-option v-for="item in provenances" :key="item" :value="item">
                {{ item }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="种类" name="kind">
            <a-select
              v-model:value="formState.kind"
              placeholder="请选择种类"
              :loading="kindsLoading"
              allow-clear
              show-search
            >
              <a-select-option v-for="item in kinds" :key="item" :value="item">
                {{ item }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="描述" name="description">
            <a-textarea
              v-model:value="formState.description"
              placeholder="请输入蔬菜描述"
              :rows="3"
            />
          </a-form-item>

          <a-form-item label="规格" name="standard">
            <a-input v-model:value="formState.standard" placeholder="请输入规格" />
          </a-form-item>

          <a-form-item label="重量(kg)" name="weight">
            <a-input-number
              v-model:value="formState.weight"
              :min="0"
              :precision="2"
              style="width: 200px"
              placeholder="请输入重量(kg)"
            />
          </a-form-item>

          <a-form-item label="价格信息" :wrapper-col="{ span: 16 }">
            <a-row :gutter="16">
              <a-col :span="8">
                <a-form-item
                  name="top_price"
                  label="最高价(元/kg)"
                  :label-col="{ span: 12 }"
                  :wrapper-col="{ span: 12 }"
                >
                  <a-input-number
                    v-model:value="formState.top_price"
                    :min="0"
                    :precision="2"
                    style="width: 100%"
                    placeholder="最高价"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item
                  name="minimum_price"
                  label="最低价(元/kg)"
                  :label-col="{ span: 12 }"
                  :wrapper-col="{ span: 12 }"
                >
                  <a-input-number
                    v-model:value="formState.minimum_price"
                    :min="0"
                    :precision="2"
                    style="width: 100%"
                    placeholder="最低价"
                  />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item
                  name="average_price"
                  label="均价(元/kg)"
                  :label-col="{ span: 12 }"
                  :wrapper-col="{ span: 12 }"
                >
                  <a-input-number
                    v-model:value="formState.average_price"
                    :min="0"
                    :precision="2"
                    style="width: 100%"
                    placeholder="均价"
                  />
                </a-form-item>
              </a-col>
            </a-row>
          </a-form-item>

          <a-form-item :wrapper-col="{ offset: 4, span: 16 }">
            <a-space>
              <a-button type="primary" @click="onSubmit" :loading="submitting"> 保存 </a-button>
              <a-button @click="goBack">取消</a-button>
            </a-space>
          </a-form-item>
        </a-form>
      </a-spin>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import {
  getVegetableById,
  createVegetable,
  updateVegetable,
  getVegetableKinds,
  getVegetableProvenances,
} from '@/api/vegetable'
import type { VegetableCreate, VegetableUpdate } from '@/types/vegetable'

// 路由
const route = useRoute()
const router = useRouter()
const vegetableId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})

// 是否为编辑模式
const isEdit = computed(() => !!vegetableId.value)

// 表单和加载状态
const formRef = ref<FormInstance>()
const loading = ref(false)
const submitting = ref(false)
const kindsLoading = ref(false)
const provenancesLoading = ref(false)

// 下拉选项数据
const kinds = ref<string[]>([])
const provenances = ref<string[]>([])

// 表单状态
const formState = reactive<VegetableCreate & VegetableUpdate>({
  product_name: '',
  description: '',
  provenance_name: '',
  kind: '',
  standard: '',
  weight: undefined,
  top_price: undefined,
  minimum_price: undefined,
  average_price: undefined,
})

// 表单验证规则
const rules = {
  product_name: [
    { required: true, message: '请输入蔬菜名称', trigger: 'blur' },
    { min: 1, max: 100, message: '名称长度应在1-100个字符之间', trigger: 'blur' },
  ],
  provenance_name: [
    { required: isEdit.value ? false : true, message: '请选择产地', trigger: 'change' },
  ],
  top_price: [{ type: 'number', message: '价格必须为数字', trigger: 'blur' }],
  minimum_price: [{ type: 'number', message: '价格必须为数字', trigger: 'blur' }],
  average_price: [{ type: 'number', message: '价格必须为数字', trigger: 'blur' }],
  weight: [{ type: 'number', message: '重量必须为数字', trigger: 'blur' }],
}

// 获取蔬菜种类
const fetchVegetableKinds = async () => {
  kindsLoading.value = true
  try {
    const res = await getVegetableKinds()
    if (res.code === 0 || res.code === 200) {
      kinds.value = res.data
    } else {
      message.error(res.msg || '获取蔬菜种类失败')
    }
  } catch (error) {
    console.error('获取蔬菜种类失败:', error)
    message.error('获取蔬菜种类失败')
  } finally {
    kindsLoading.value = false
  }
}

// 获取蔬菜产地
const fetchVegetableProvenances = async () => {
  provenancesLoading.value = true
  try {
    const res = await getVegetableProvenances()
    if (res.code === 0 || res.code === 200) {
      provenances.value = res.data
    } else {
      message.error(res.msg || '获取蔬菜产地失败')
    }
  } catch (error) {
    console.error('获取蔬菜产地失败:', error)
    message.error('获取蔬菜产地失败')
  } finally {
    provenancesLoading.value = false
  }
}

// 获取蔬菜详情(编辑模式)
const fetchVegetableDetail = async () => {
  if (!vegetableId.value) return

  loading.value = true
  try {
    const res = await getVegetableById(vegetableId.value)
    if (res.code === 0 || res.code === 200) {
      const data = res.data
      // 更新表单数据
      Object.keys(formState).forEach((key) => {
        if (key in data) {
          // @ts-ignore
          formState[key] = data[key]
        }
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

// 提交表单
const onSubmit = async () => {
  try {
    await formRef.value?.validate()

    submitting.value = true
    let res

    if (isEdit.value && vegetableId.value) {
      // 编辑模式
      res = await updateVegetable(vegetableId.value, formState as VegetableUpdate)
    } else {
      // 新增模式
      res = await createVegetable(formState as VegetableCreate)
    }

    if (res.code === 0 || res.code === 200) {
      message.success(isEdit.value ? '蔬菜更新成功' : '蔬菜创建成功')
      router.push('/vegetables')
    } else {
      message.error(res.msg || (isEdit.value ? '更新蔬菜失败' : '创建蔬菜失败'))
    }
  } catch (error) {
    console.error(isEdit.value ? '更新蔬菜失败:' : '创建蔬菜失败:', error)
    message.error(isEdit.value ? '更新蔬菜失败' : '创建蔬菜失败')
  } finally {
    submitting.value = false
  }
}

// 返回列表页
const goBack = () => {
  router.push('/vegetables')
}

// 组件初始化
onMounted(async () => {
  // 获取下拉选项数据
  await Promise.all([fetchVegetableKinds(), fetchVegetableProvenances()])

  // 如果是编辑模式，加载蔬菜详情
  if (isEdit.value) {
    fetchVegetableDetail()
  }
})
</script>

<style scoped>
.edit-vegetable-container {
  padding: 0 16px;
}
</style>
