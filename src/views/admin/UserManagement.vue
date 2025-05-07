<template>
  <div class="user-management-container">
    <a-page-header title="用户管理" sub-title="管理系统用户">
      <template #extra>
        <a-space>
          <a-button type="primary" @click="showAddUserModal = true">
            <template #icon><user-add-outlined /></template>
            添加用户
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-card :bordered="false">
      <div class="table-page-search-wrapper">
        <a-form layout="horizontal">
          <div class="search-row">
            <div class="search-fields">
              <a-form-item label="用户名" class="search-item">
                <a-input
                  v-model:value="queryParams.username"
                  placeholder="请输入用户名"
                  allow-clear
                />
              </a-form-item>
              <a-form-item label="用户类型" class="search-item">
                <a-select
                  v-model:value="queryParams.user_type"
                  placeholder="请选择用户类型"
                  allow-clear
                >
                  <a-select-option :value="UserType.ADMIN">管理员</a-select-option>
                  <a-select-option :value="UserType.USER">普通用户</a-select-option>
                </a-select>
              </a-form-item>
              <a-form-item label="账号状态" class="search-item">
                <a-select
                  v-model:value="queryParams.is_active"
                  placeholder="请选择账号状态"
                  allow-clear
                >
                  <a-select-option :value="true">启用</a-select-option>
                  <a-select-option :value="false">禁用</a-select-option>
                </a-select>
              </a-form-item>
            </div>
            <div class="search-buttons">
              <a-button type="primary" @click="loadUsers">
                <template #icon><search-outlined /></template>
                查询
              </a-button>
              <a-button @click="resetQuery" class="reset-button">
                <template #icon><reload-outlined /></template>
                重置
              </a-button>
            </div>
          </div>
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

          <!-- 状态 -->
          <template v-if="column.dataIndex === 'is_active'">
            <a-tag :color="record.is_active ? 'success' : 'error'">
              {{ record.is_active ? '启用' : '禁用' }}
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
                    <a-menu-item v-if="record.is_active">
                      <a-popconfirm
                        title="确定要封禁此用户吗?"
                        ok-text="确定"
                        cancel-text="取消"
                        @confirm="banUser(record)"
                      >
                        <a style="color: #ff4d4f">封禁</a>
                      </a-popconfirm>
                    </a-menu-item>
                    <a-menu-item v-else>
                      <a-popconfirm
                        title="确定要解封此用户吗?"
                        ok-text="确定"
                        cancel-text="取消"
                        @confirm="unbanUser(record)"
                      >
                        <a style="color: #52c41a">解封</a>
                      </a-popconfirm>
                    </a-menu-item>
                    <a-menu-item>
                      <a-popconfirm
                        title="确定要删除此用户吗?"
                        description="删除后，该用户所有数据将被永久删除且无法恢复"
                        ok-text="确定"
                        cancel-text="取消"
                        @confirm="deleteUser(record)"
                        :okButtonProps="{ loading: deleteLoading }"
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
import { getAllUsers, register, getUserById, toggleUserStatus } from '@/api/user'
import { deleteUser as apiDeleteUser } from '@/api/admin'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const submitLoading = ref(false)
const deleteLoading = ref(false)
const users = ref<UserInfo[]>([])
const showAddUserModal = ref(false)
const currentUser = ref<UserInfo | null>(null)
const userFormRef = ref<FormInstance>()

// 查询参数
const queryParams = reactive({
  username: '',
  user_type: undefined,
  is_active: undefined,
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
const userForm = reactive<UserCreateParams & UserUpdateParams>({
  username: '',
  password: '',
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
}

// 表格列定义
const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 50,
  },
  {
    title: '用户名',
    dataIndex: 'username',
    key: 'username',
    width: 150,
  },
  {
    title: '用户类型',
    dataIndex: 'user_type',
    key: 'user_type',
    width: 100,
  },
  {
    title: '状态',
    dataIndex: 'is_active',
    key: 'is_active',
    width: 80,
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 180,
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
    // 组装请求参数
    const params = {
      page: pagination.current,
      size: pagination.pageSize,
      ...queryParams,
    }

    const res = await getAllUsers(params)
    console.log(res)
    if (res.code === 200 && res.data) {
      // 数据结构已改变，从items字段获取用户列表
      users.value = res.data.items || []
      // 更新分页信息
      pagination.total = res.data.total || 0
      pagination.current = res.data.page || 1
      pagination.pageSize = res.data.size || 10
    } else {
      message.error(res.message || '获取用户列表失败')
    }
  } catch (error) {
    console.error('加载用户列表失败:', error)
    message.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

// 处理表格变化事件（分页、排序、筛选）
const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  loadUsers()
}

// 重置查询参数
const resetQuery = () => {
  queryParams.username = ''
  queryParams.user_type = undefined
  queryParams.is_active = undefined
  pagination.current = 1 // 重置到第一页
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

// 删除用户
const deleteUser = async (record: UserInfo) => {
  deleteLoading.value = true
  try {
    const res = await apiDeleteUser(record.id)
    if (res.code === 0 || res.code === 200) {
      message.success('用户删除成功')
      loadUsers() // 重新加载用户列表
    } else {
      message.error(res.message || '删除用户失败')
    }
  } catch (error) {
    console.error('删除用户失败:', error)
    message.error('删除用户失败')
  } finally {
    deleteLoading.value = false
  }
}

// 取消添加/编辑
const handleCancel = () => {
  showAddUserModal.value = false
  currentUser.value = null
  userForm.username = ''
  userForm.password = ''
}

// 提交添加/编辑
const handleSubmit = async () => {
  try {
    await userFormRef.value?.validate()

    submitLoading.value = true

    if (currentUser.value) {
      // 编辑用户
      message.info('编辑用户功能尚未实现')
    } else {
      // 添加用户
      const res = await register({
        username: userForm.username,
        password: userForm.password!,
      })

      if (res.code === 0 || res.code === 200) {
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

// 封禁用户
const banUser = async (record: UserInfo) => {
  try {
    const res = await toggleUserStatus(record.id, false)
    if (res.code === 0 || res.code === 200) {
      message.success('用户已被封禁')
      loadUsers()
    } else {
      message.error(res.message || '封禁用户失败')
    }
  } catch (error) {
    console.error('封禁用户失败:', error)
    message.error('封禁用户失败')
  }
}

// 解封用户
const unbanUser = async (record: UserInfo) => {
  try {
    const res = await toggleUserStatus(record.id, true)
    if (res.code === 0 || res.code === 200) {
      message.success('用户已被解封')
      loadUsers()
    } else {
      message.error(res.message || '解封用户失败')
    }
  } catch (error) {
    console.error('解封用户失败:', error)
    message.error('解封用户失败')
  }
}
</script>

<style scoped>
.user-management-container {
  padding: 0 16px;
}

.table-page-search-wrapper {
  margin-bottom: 24px;
  background-color: #f8f8f8;
  padding: 24px;
  border-radius: 4px;
}

.search-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.search-fields {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 16px;
}

.search-item {
  margin-bottom: 0;
  min-width: 200px;
  flex: 1;
}

.search-buttons {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.reset-button {
  margin-left: 8px;
}

@media screen and (max-width: 768px) {
  .search-row {
    flex-direction: column;
    align-items: stretch;
  }

  .search-fields {
    flex-direction: column;
    width: 100%;
  }

  .search-item {
    width: 100%;
  }

  .search-buttons {
    margin-left: 0;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
