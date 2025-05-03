<template>
  <div class="create-vegetable-container">
    <a-page-header title="添加蔬菜" @back="goBack" />

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
              <a-select-option value="1">蔬菜</a-select-option>
              <a-select-option
                v-for="item in kinds.filter((k) => k !== '1')"
                :key="item"
                :value="item"
              >
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

          <a-form-item label="计价单位" name="weight">
            <a-radio-group v-model:value="formState.weight">
              <a-radio :value="0">元/公斤</a-radio>
              <a-radio :value="null">自定义</a-radio>
            </a-radio-group>
            <a-input-number
              v-if="formState.weight !== 0"
              v-model:value="formState.weight"
              :min="0.01"
              :precision="2"
              style="width: 200px; margin-left: 10px"
              placeholder="请输入重量(kg)"
              addon-after="kg"
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
              <a-button type="primary" @click="onSubmit" :loading="submitting">保存</a-button>
              <a-button @click="goBack">取消</a-button>
            </a-space>
          </a-form-item>
        </a-form>
      </a-spin>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import { createVegetable, getVegetableKinds, getVegetableProvenances } from '@/api/vegetable'
import type { VegetableCreate } from '@/types/vegetable'

// 路由
const router = useRouter()

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
const formState = reactive<VegetableCreate>({
  product_name: '',
  description: '',
  provenance_name: '',
  kind: '1',
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
  provenance_name: [{ required: true, message: '请选择产地', trigger: 'change' }],
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

// 提交表单
const onSubmit = async () => {
  try {
    // 表单验证
    await formRef.value?.validate()

    submitting.value = true

    // 创建蔬菜
    const res = await createVegetable(formState)

    if (res.code === 0 || res.code === 200) {
      message.success('添加蔬菜成功')
      // 跳转到蔬菜列表页
      router.push('/vegetables')
    } else {
      message.error(res.msg || '添加蔬菜失败')
    }
  } catch (error) {
    console.error('表单提交失败:', error)
    // 表单验证错误不用提示，会自动显示
  } finally {
    submitting.value = false
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 组件挂载时加载数据
onMounted(() => {
  fetchVegetableKinds()
  fetchVegetableProvenances()
})
</script>

<style scoped>
.create-vegetable-container {
  padding: 24px;
}
</style>
