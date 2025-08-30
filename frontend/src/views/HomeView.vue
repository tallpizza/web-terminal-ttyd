<template>
  <div class="home-view">
    <div class="hero">
      <h1>Web Terminal</h1>
      <p>Access your terminal from anywhere, on any device</p>
      
      <div class="actions">
        <button @click="createNewSession" class="btn-primary">
          Create New Session
        </button>
        <router-link to="/sessions" class="btn-secondary">
          View Sessions
        </router-link>
      </div>
    </div>

    <div class="features">
      <div class="feature">
        <h3>Multiple Sessions</h3>
        <p>Create and manage multiple terminal sessions simultaneously</p>
      </div>
      <div class="feature">
        <h3>Virtual Keyboard</h3>
        <p>Customizable virtual keyboard with shortcuts for mobile devices</p>
      </div>
      <div class="feature">
        <h3>Touch Gestures</h3>
        <p>Intuitive touch gestures for navigation and control</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useSessionStore } from '../stores/sessions'

const router = useRouter()
const sessionsStore = useSessionStore()

async function createNewSession() {
  try {
    const session = await sessionsStore.createSession()
    router.push(`/session/${session.id}`)
  } catch (error) {
    console.error('Failed to create session:', error)
  }
}
</script>

<style scoped>
.home-view {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.hero {
  text-align: center;
  margin-bottom: 4rem;
}

.hero h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #333;
}

.hero p {
  font-size: 1.25rem;
  color: #666;
  margin-bottom: 2rem;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-size: 1.125rem;
  text-decoration: none;
  transition: all 0.3s;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background: #42b883;
  color: white;
}

.btn-primary:hover {
  background: #35a372;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature {
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.feature h3 {
  color: #333;
  margin-bottom: 0.5rem;
}

.feature p {
  color: #666;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .hero h1 {
    font-size: 2rem;
  }
  
  .actions {
    flex-direction: column;
  }
  
  .btn-primary,
  .btn-secondary {
    width: 100%;
  }
}
</style>