<template>
  <div class="settings-view">
    <h1>Settings</h1>
    <Settings />
  </div>
</template>

<script setup lang="ts">
import Settings from '../components/Settings.vue'
</script>

<style scoped>
.settings-view {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  color: #333;
  margin-bottom: 2rem;
}
</style>