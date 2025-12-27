<script setup lang="ts">
import HomeCalendar from '@/components/sections/HomeCalendar.vue'
</script>

<template>
  <div class="home-view">
    <div class="home-content">
      <HomeCalendar />
    </div>
  </div>
</template>

<style scoped>
.home-view {
  width: 100%;
  min-height: 100vh;
}

.home-content {
  padding: 16px;
  padding-bottom: 100px; /* 하단 네비게이션 공간 */
}

@media (max-width: 768px) {
  .home-content {
    padding: 12px;
    padding-bottom: 100px;
  }
}
</style>

