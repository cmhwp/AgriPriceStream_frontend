<template>
  <div class="auth-layout">
    <router-view />
  </div>
</template>

<script lang="ts" setup>
// Auth layout simply passes through to the child route
</script>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f0f2f5;
  background-image: url('@/assets/login_background.svg');
  background-repeat: no-repeat;
  background-position: 50%;
  background-size: 100%;
}
</style>
