<template>
  <div class="not-found">
    <h1>404</h1>
    <p>Page not found</p>
    <router-link to="/" class="btn-home">
      Go to Home
    </router-link>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  text-align: center;
}

.not-found h1 {
  font-size: 6rem;
  color: #e0e0e0;
  margin: 0;
}

.not-found p {
  font-size: 1.5rem;
  color: #666;
  margin: 1rem 0 2rem;
}

.btn-home {
  padding: 0.75rem 2rem;
  background: #42b883;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  transition: background 0.3s;
}

.btn-home:hover {
  background: #35a372;
}
</style>