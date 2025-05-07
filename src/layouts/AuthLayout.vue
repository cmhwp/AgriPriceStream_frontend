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
  background-image: -moz-linear-gradient(0deg, rgb(163, 240, 255), rgb(204, 235, 255));
  background-image: -webkit-linear-gradient(0deg, rgb(163, 240, 255), rgb(204, 235, 255));
  background-image: linear-gradient(0deg, rgb(163, 240, 255), rgb(204, 235, 255));
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
}
</style>
