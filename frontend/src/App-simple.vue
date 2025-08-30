<template>
  <div id="app">
    <h1>Web Terminal</h1>
    <div>
      <h2>Sessions</h2>
      <button @click="createSession">Create New Session</button>
      <div v-if="loading">Loading...</div>
      <div v-else>
        <p v-if="sessions.length === 0">No sessions yet</p>
        <ul v-else>
          <li v-for="session in sessions" :key="session.id">
            {{ session.name }} - Port: {{ session.port }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const sessions = ref([])
const loading = ref(false)

async function fetchSessions() {
  loading.value = true
  try {
    const response = await fetch('/api/sessions')
    sessions.value = await response.json()
  } catch (error) {
    console.error('Error fetching sessions:', error)
  } finally {
    loading.value = false
  }
}

async function createSession() {
  loading.value = true
  try {
    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `Session ${sessions.value.length + 1}`
      })
    })
    const newSession = await response.json()
    sessions.value.push(newSession)
  } catch (error) {
    console.error('Error creating session:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSessions()
})
</script>

<style scoped>
#app {
  font-family: Arial, sans-serif;
  padding: 20px;
}

button {
  padding: 10px 20px;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #35a372;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  padding: 10px;
  margin: 5px 0;
  background-color: #f0f0f0;
  border-radius: 4px;
}
</style>