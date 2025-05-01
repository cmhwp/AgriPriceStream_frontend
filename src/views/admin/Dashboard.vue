<template>
  <div class="admin-dashboard">
    <h1>管理员仪表板</h1>
    <p>欢迎使用管理员系统</p>

    <div class="admin-stats">
      <a-row :gutter="16">
        <a-col :span="8">
          <a-card title="用户统计">
            <a-statistic title="注册用户数" :value="15" />
          </a-card>
        </a-col>
        <a-col :span="8">
          <a-card title="产品统计">
            <a-statistic title="农产品数量" :value="48" />
          </a-card>
        </a-col>
        <a-col :span="8">
          <a-card title="价格统计">
            <a-statistic title="价格记录数" :value="1256" />
          </a-card>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script lang="ts" setup>
// 基本的管理员仪表板组件
</script>

<style scoped>
.admin-dashboard {
  padding: 24px;
}

.admin-stats {
  margin-top: 24px;
}
</style>
