<template>
  <div class="system-settings-container">
    <a-page-header title="系统设置" sub-title="配置系统参数">
      <template #extra>
        <a-button type="primary" @click="saveAllSettings">
          <template #icon><save-outlined /></template>
          保存所有设置
        </a-button>
      </template>
    </a-page-header>

    <a-spin :spinning="loading">
      <a-tabs default-active-key="1">
        <!-- 基本设置 -->
        <a-tab-pane key="1" tab="基本设置">
          <a-card :bordered="false">
            <a-form :model="basicSettings" :label-col="{ span: 6 }" :wrapper-col="{ span: 14 }">
              <a-form-item label="系统名称">
                <a-input v-model:value="basicSettings.systemName" placeholder="请输入系统名称" />
              </a-form-item>
              <a-form-item label="系统Logo" help="推荐尺寸: 200px x 50px">
                <a-upload
                  name="logo"
                  list-type="picture-card"
                  :show-upload-list="false"
                  action="/api/upload"
                  :before-upload="beforeUpload"
                  @change="handleLogoChange"
                >
                  <img v-if="basicSettings.logoUrl" :src="basicSettings.logoUrl" alt="logo" />
                  <div v-else>
                    <plus-outlined />
                    <div style="margin-top: 8px">上传</div>
                  </div>
                </a-upload>
              </a-form-item>
              <a-form-item label="网站描述">
                <a-textarea
                  v-model:value="basicSettings.siteDescription"
                  placeholder="请输入网站描述"
                  :rows="4"
                />
              </a-form-item>
              <a-form-item label="系统通知">
                <a-switch v-model:checked="basicSettings.enableNotification" />
              </a-form-item>
              <a-form-item v-if="basicSettings.enableNotification" label="通知频率">
                <a-radio-group v-model:value="basicSettings.notificationFrequency">
                  <a-radio value="immediate">实时通知</a-radio>
                  <a-radio value="daily">每日汇总</a-radio>
                  <a-radio value="weekly">每周汇总</a-radio>
                </a-radio-group>
              </a-form-item>
            </a-form>
          </a-card>
        </a-tab-pane>

        <!-- 数据采集设置 -->
        <a-tab-pane key="2" tab="数据采集设置">
          <a-card :bordered="false">
            <a-form :model="crawlerSettings" :label-col="{ span: 6 }" :wrapper-col="{ span: 14 }">
              <a-form-item label="启用自动数据采集">
                <a-switch v-model:checked="crawlerSettings.enableAutoCrawler" />
              </a-form-item>

              <template v-if="crawlerSettings.enableAutoCrawler">
                <a-form-item label="采集频率">
                  <a-select v-model:value="crawlerSettings.crawlerFrequency">
                    <a-select-option value="hourly">每小时</a-select-option>
                    <a-select-option value="daily">每天</a-select-option>
                    <a-select-option value="weekly">每周</a-select-option>
                  </a-select>
                </a-form-item>

                <a-form-item label="采集时间">
                  <a-time-picker v-model:value="crawlerSettings.crawlerTime" format="HH:mm" />
                </a-form-item>

                <a-form-item label="数据源">
                  <a-checkbox-group v-model:value="crawlerSettings.dataSources">
                    <a-checkbox value="official">官方市场</a-checkbox>
                    <a-checkbox value="third_party">第三方数据</a-checkbox>
                    <a-checkbox value="community">社区贡献</a-checkbox>
                  </a-checkbox-group>
                </a-form-item>

                <a-form-item label="错误通知">
                  <a-switch v-model:checked="crawlerSettings.notifyOnError" />
                  <span style="margin-left: 8px">采集失败时通知管理员</span>
                </a-form-item>
              </template>
            </a-form>
          </a-card>
        </a-tab-pane>

        <!-- 安全设置 -->
        <a-tab-pane key="3" tab="安全设置">
          <a-card :bordered="false">
            <a-form :model="securitySettings" :label-col="{ span: 6 }" :wrapper-col="{ span: 14 }">
              <a-form-item label="密码复杂度">
                <a-select v-model:value="securitySettings.passwordStrength">
                  <a-select-option value="low">低（仅字母数字，至少6位）</a-select-option>
                  <a-select-option value="medium">中（字母+数字，至少8位）</a-select-option>
                  <a-select-option value="high">高（字母+数字+特殊字符，至少10位）</a-select-option>
                </a-select>
              </a-form-item>

              <a-form-item label="登录尝试限制">
                <a-input-number v-model:value="securitySettings.loginAttempts" :min="3" :max="10" />
                <span style="margin-left: 8px">次尝试后锁定账户</span>
              </a-form-item>

              <a-form-item label="会话超时">
                <a-input-number
                  v-model:value="securitySettings.sessionTimeout"
                  :min="5"
                  :max="1440"
                />
                <span style="margin-left: 8px">分钟</span>
              </a-form-item>

              <a-form-item label="API访问限制">
                <a-input-number
                  v-model:value="securitySettings.apiRateLimit"
                  :min="10"
                  :max="1000"
                />
                <span style="margin-left: 8px">请求/分钟</span>
              </a-form-item>
            </a-form>
          </a-card>
        </a-tab-pane>
      </a-tabs>
    </a-spin>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import dayjs, { Dayjs } from 'dayjs'
import { SaveOutlined, PlusOutlined } from '@ant-design/icons-vue'

// 页面状态
const loading = ref(false)

// 基本设置
interface BasicSettings {
  systemName: string
  logoUrl: string
  siteDescription: string
  enableNotification: boolean
  notificationFrequency: 'immediate' | 'daily' | 'weekly'
}

const basicSettings = reactive<BasicSettings>({
  systemName: '农产品价格追踪系统',
  logoUrl: '',
  siteDescription: '实时跟踪和分析农产品价格变化的专业系统',
  enableNotification: true,
  notificationFrequency: 'immediate',
})

// 数据采集设置
interface CrawlerSettings {
  enableAutoCrawler: boolean
  crawlerFrequency: 'hourly' | 'daily' | 'weekly'
  crawlerTime: Dayjs | null
  dataSources: string[]
  notifyOnError: boolean
}

const crawlerSettings = reactive<CrawlerSettings>({
  enableAutoCrawler: true,
  crawlerFrequency: 'daily',
  crawlerTime: dayjs('2023-01-01 08:00:00'),
  dataSources: ['official', 'third_party'],
  notifyOnError: true,
})

// 安全设置
interface SecuritySettings {
  passwordStrength: 'low' | 'medium' | 'high'
  loginAttempts: number
  sessionTimeout: number
  apiRateLimit: number
}

const securitySettings = reactive<SecuritySettings>({
  passwordStrength: 'medium',
  loginAttempts: 5,
  sessionTimeout: 30, // 分钟
  apiRateLimit: 100, // 请求/分钟
})

// 加载系统设置
const loadSettings = () => {
  loading.value = true
  setTimeout(() => {
    // 模拟API调用
    loading.value = false
    message.success('设置已加载')
  }, 1000)
}

// 保存所有设置
const saveAllSettings = () => {
  loading.value = true
  setTimeout(() => {
    // 模拟API调用
    loading.value = false
    message.success('设置已保存')
  }, 1000)
}

// Logo上传前检查
const beforeUpload = (file: File) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
  if (!isJpgOrPng) {
    message.error('只能上传JPG或PNG格式的图片!')
  }
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    message.error('图片大小不能超过2MB!')
  }
  return isJpgOrPng && isLt2M
}

// Logo上传变化处理
const handleLogoChange = (info: any) => {
  if (info.file.status === 'uploading') {
    return
  }
  if (info.file.status === 'done') {
    // 获取上传后的图片URL
    basicSettings.logoUrl = info.file.response.url
  }
}

// 初始化加载
onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.system-settings-container {
  padding: 0 16px;
}

.ant-card {
  margin-bottom: 24px;
}
</style>
