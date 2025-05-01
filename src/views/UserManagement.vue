<template>
  <div class="user-management-container">
    <a-page-header title="用户管理" sub-title="管理系统用户">
      <template #extra>
        <a-space>
          <a-button type="primary" @click="showAddUserModal = true">
            <template #icon><user-add-outlined /></template>
            添加用户
          </a-button>
          <a-button v-if="isSuperAdmin" type="default" @click="goToCreateAdmin">
            <template #icon><crown-outlined /></template>
            创建管理员
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-card :bordered="false">
      <div class="table-page-search-wrapper">
        <a-form layout="inline">
          <a-row :gutter="48">
            <a-col :md="8" :sm="24">
              <a-form-item label="用户名">
                <a-input v-model:value="queryParams.username" placeholder="请输入" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <a-form-item label="用户类型">
                <a-select v-model:value="queryParams.user_type" placeholder="请选择" allow-clear>
                  <a-select-option :value="UserType.ADMIN">管理员</a-select-option>
                  <a-select-option :value="UserType.USER">普通用户</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :md="8" :sm="24">
              <span class="table-page-search-submitButtons">
                <a-button type="primary" @click="loadUsers">
                  <template #icon><search-outlined /></template>
                  查询
                </a-button>
                <a-button style="margin-left: 8px" @click="resetQuery">
                  <template #icon><reload-outlined /></template>
                  重置
                </a-button>
              </span>
            </a-col>
          </a-row>
        </a-form>
      </div>

      <a-table
        :columns="columns"
        :data-source="users"
        :loading="loading"
        rowKey="id"
        :pagination="pagination"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <!-- 用户类型 -->
          <template v-if="column.dataIndex === 'user_type'">
            <a-tag :color="record.user_type === UserType.ADMIN ? 'red' : 'blue'">
              {{ record.user_type === UserType.ADMIN ? '管理员' : '普通用户' }}
            </a-tag>
          </template>

          <!-- 创建时间 -->
          <template v-if="column.dataIndex === 'created_at'">
            {{ formatDate(record.created_at) }}
          </template>

          <!-- 操作 -->
          <template v-if="column.dataIndex === 'action'">
            <a-space>
              <a @click="editUser(record)">编辑</a>
              <a-divider type="vertical" />
              <a-dropdown>
                <a class="ant-dropdown-link"> 更多 <down-outlined /> </a>
                <template #overlay>
                  <a-menu>
                    <a-menu-item>
                      <a @click="resetPassword(record)">重置密码</a>
                    </a-menu-item>
                    <a-menu-item v-if="record.user_type !== UserType.ADMIN">
                      <a @click="upgradeToAdmin(record)">升级为管理员</a>
                    </a-menu-item>
                    <a-menu-item v-else>
                      <a @click="downgradeToUser(record)">降为普通用户</a>
                    </a-menu-item>
                    <a-menu-item>
                      <a-popconfirm
                        title="确定要删除此用户吗?"
                        ok-text="确定"
                        cancel-text="取消"
                        @confirm="deleteUser(record)"
                      >
                        <a style="color: #ff4d4f">删除</a>
                      </a-popconfirm>
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 添加/编辑用户弹窗 -->
    <a-modal
      :visible="showAddUserModal"
      :title="currentUser ? '编辑用户' : '添加用户'"
      @cancel="handleCancel"
      @ok="handleSubmit"
      :confirmLoading="submitLoading"
    >
      <a-form
        :model="userForm"
        :rules="rules"
        ref="userFormRef"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item label="用户名" name="username">
          <a-input v-model:value="userForm.username" placeholder="请输入用户名" />
        </a-form-item>
        <a-form-item v-if="!currentUser" label="密码" name="password">
          <a-input-password v-model:value="userForm.password" placeholder="请输入密码" />
        </a-form-item>
        <a-form-item label="用户类型" name="user_type">
          <a-select v-model:value="userForm.user_type" placeholder="请选择">
            <a-select-option :value="UserType.ADMIN">管理员</a-select-option>
            <a-select-option :value="UserType.USER">普通用户</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import {
  SearchOutlined,
  ReloadOutlined,
  UserAddOutlined,
  DownOutlined,
  CrownOutlined,
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import { UserType } from '@/types/user'
import type {
  UserInfo,
  UserCreateParams,
  UserUpdateParams,
  UserAdminUpdateParams,
} from '@/types/user'
import { getAllUsers, register, updateUserAdmin, getUserById } from '@/api/user'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const submitLoading = ref(false)
const users = ref<UserInfo[]>([])
const showAddUserModal = ref(false)
const currentUser = ref<UserInfo | null>(null)
const userFormRef = ref<FormInstance>()

// 查询参数
const queryParams = reactive({
  username: '',
  user_type: undefined,
})

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showTotal: (total: number) => `共 ${total} 条数据`,
  showSizeChanger: true,
  pageSizeOptions: ['10', '20', '50', '100'],
})

// 表单数据
const userForm = reactive<UserCreateParams & UserUpdateParams & { user_type?: string }>({
  username: '',
  password: '',
  user_type: UserType.USER,
})

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在3-20个字符之间', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' },
  ],
  user_type: [{ required: true, message: '请选择用户类型', trigger: 'change' }],
}

// 表格列定义
const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 60,
  },
  {
    title: '用户名',
    dataIndex: 'username',
    key: 'username',
  },
  {
    title: '用户类型',
    dataIndex: 'user_type',
    key: 'user_type',
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
  },
  {
    title: '操作',
    dataIndex: 'action',
    key: 'action',
    width: 180,
  },
]

// 格式化日期
const formatDate = (dateString: string) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
}

// 加载用户列表
const loadUsers = async () => {
  loading.value = true
  try {
    const res = await getAllUsers({
      skip: (pagination.current - 1) * pagination.pageSize,
      limit: pagination.pageSize,
    })
    if (res.code === 0 || res.code === 200) {
      users.value = res.data || []
      pagination.total = res.data?.length || 0 // 应该从API获取total
    } else {
      message.error(res.message || '获取用户列表失败')
    }
  } catch (error) {
    console.error('获取用户列表失败', error)
    message.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 表格变化处理
const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  loadUsers()
}

// 重置查询条件
const resetQuery = () => {
  queryParams.username = ''
  queryParams.user_type = undefined
  pagination.current = 1
  loadUsers()
}

// 编辑用户
const editUser = async (record: UserInfo) => {
  currentUser.value = record

  // 加载用户详情
  try {
    const res = await getUserById(record.id)
    if (res.code === 0 || (res.code === 200 && res.data)) {
      // 确保数据存在并且是 UserInfo 类型
      const userData = res.data as UserInfo
      userForm.username = userData.username
      userForm.user_type = userData.user_type
      showAddUserModal.value = true
    } else {
      message.error(res.message || '获取用户详情失败')
    }
  } catch (error) {
    console.error('获取用户详情失败', error)
    message.error('获取用户详情失败')
  }
}

// 重置密码
const resetPassword = (record: UserInfo) => {
  message.info('该功能尚未实现')
}

// 升级为管理员
const upgradeToAdmin = async (record: UserInfo) => {
  try {
    const res = await updateUserAdmin(record.id, { user_type: UserType.ADMIN })
    if (res.code === 0 || res.code === 200) {
      message.success('已将用户升级为管理员')
      loadUsers()
    } else {
      message.error(res.message || '升级用户失败')
    }
  } catch (error) {
    console.error('升级用户失败', error)
    message.error('升级用户失败')
  }
}

// 降为普通用户
const downgradeToUser = async (record: UserInfo) => {
  try {
    const res = await updateUserAdmin(record.id, { user_type: UserType.USER })
    if (res.code === 0 || res.code === 200) {
      message.success('已将用户降为普通用户')
      loadUsers()
    } else {
      message.error(res.message || '降级用户失败')
    }
  } catch (error) {
    console.error('降级用户失败', error)
    message.error('降级用户失败')
  }
}

// 删除用户
const deleteUser = (record: UserInfo) => {
  message.info('该功能尚未实现')
}

// 取消添加/编辑
const handleCancel = () => {
  showAddUserModal.value = false
  currentUser.value = null
  userForm.username = ''
  userForm.password = ''
  userForm.user_type = UserType.USER
}

// 提交添加/编辑
const handleSubmit = async () => {
  try {
    await userFormRef.value?.validate()

    submitLoading.value = true

    if (currentUser.value) {
      // 编辑用户
      message.info('编辑用户功能尚未实现')
      // const res = await updateUserAdmin(currentUser.value.id, {
      //   user_type: userForm.user_type
      // });
      // if (res.code === 0 || res.code === 200) {
      //   message.success('用户编辑成功');
      //   showAddUserModal.value = false;
      //   loadUsers();
      // } else {
      //   message.error(res.message || '用户编辑失败');
      // }
    } else {
      // 添加用户
      const res = await register({
        username: userForm.username,
        password: userForm.password!,
      })

      if (res.code === 0 || res.code === 200) {
        // 如果是管理员，更新用户类型
        if (userForm.user_type === UserType.ADMIN) {
          // 这里需要获取新用户的ID，但API可能没有返回
          message.info('添加管理员功能尚未完全实现')
        }

        message.success('用户添加成功')
        showAddUserModal.value = false
        loadUsers()
      } else {
        message.error(res.message || '用户添加失败')
      }
    }
  } catch (error) {
    console.error('表单验证失败', error)
  } finally {
    submitLoading.value = false
  }
}

// 加载初始数据
onMounted(() => {
  loadUsers()
})

// 是否为超级管理员
const isSuperAdmin = computed(() => {
  return userStore.userInfo?.username === 'admin'
})

// 跳转到创建管理员页面
const goToCreateAdmin = () => {
  router.push('/admin/create-admin')
}
</script>

<style scoped>
.user-management-container {
  padding: 0 16px;
}

.table-page-search-wrapper {
  margin-bottom: 16px;
}

.table-page-search-submitButtons {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}
</style>
