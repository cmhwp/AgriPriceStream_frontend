<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'
import confetti from 'canvas-confetti'

// 添加鼠标点击特效
const handleClick = (e: MouseEvent) => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: {
      x: e.clientX / window.innerWidth,
      y: e.clientY / window.innerHeight,
    },
    colors: ['#b2a3ff', '#e8ffc7', '#ffd6e7', '#c7f0ff', '#ffe4c7'],
    disableForReducedMotion: true,
    // 添加更多配置使特效更生动
    ticks: 200,
    gravity: 0.8,
    scalar: 1.2,
    shapes: ['circle', 'square'],
    zIndex: 9999,
  })
}

onMounted(() => {
  document.addEventListener('click', handleClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClick)
})
</script>

<template>
  <BasicLayout>
    <RouterView />
  </BasicLayout>
</template>

<style>
html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
}

body {
  background-image: -moz-linear-gradient(0deg, rgb(163, 240, 255), rgb(204, 235, 255));
  background-image: -webkit-linear-gradient(0deg, rgb(163, 240, 255), rgb(204, 235, 255));
  background-image: linear-gradient(0deg, rgb(163, 240, 255), rgb(204, 235, 255));
  background-repeat: no-repeat;
  background-attachment: fixed;
  background-size: cover;
}
</style>
