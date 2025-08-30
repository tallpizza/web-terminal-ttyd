<template>
  <div class="sessions-view">
    <div class="header">
      <h1>Terminal Sessions</h1>
      <button @click="createNewSession" class="btn-create">
        + New Session
      </button>
    </div>

    <div v-if="sessions.length === 0" class="empty-state">
      <p>No active sessions</p>
      <button @click="createNewSession" class="btn-primary">
        Create your first session
      </button>
    </div>

    <div v-else class="sessions-grid">
      <div 
        v-for="session in sessions" 
        :key="session.id"
        class="session-card"
        @click="openSession(session.id)"
      >
        <div class="session-header">
          <h3>{{ session.name }}</h3>
          <span class="session-status" :class="session.status">
            {{ session.status }}
          </span>
        </div>
        
        <div class="session-info">
          <p>Port: {{ session.port }}</p>
          <p>Created: {{ formatDate(session.createdAt) }}</p>
          <p>Last Active: {{ formatDate(session.lastActivity) }}</p>
        </div>
        
        <div class="session-actions">
          <button @click.stop="renameSession(session)" class="btn-icon">
            ✏️
          </button>
          <button @click.stop="deleteSession(session.id)" class="btn-icon btn-danger">
            🗑️
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '../stores/sessions'

const router = useRouter()
const sessionsStore = useSessionStore()

const sessions = computed(() => sessionsStore.sessions)

onMounted(() => {
  sessionsStore.fetchSessions()
})

async function createNewSession() {
  try {
    const session = await sessionsStore.createSession()
    router.push(`/session/${session.id}`)
  } catch (error) {
    console.error('Failed to create session:', error)
  }
}

function openSession(id: string) {
  router.push(`/session/${id}`)
}

async function renameSession(session: any) {
  const newName = prompt('Enter new session name:', session.name)
  if (newName && newName !== session.name) {
    await sessionsStore.renameSession(session.id, newName)
  }
}

async function deleteSession(id: string) {
  if (confirm('Are you sure you want to delete this session?')) {
    await sessionsStore.closeSession(id)
  }
}

function formatDate(date: string | Date) {
  if (!date) return 'Never'
  return new Date(date).toLocaleString()
}
</script>

<style scoped>
.sessions-view {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h1 {
  color: #333;
}

.btn-create {
  padding: 0.75rem 1.5rem;
  background: #42b883;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
}

.btn-create:hover {
  background: #35a372;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-state p {
  font-size: 1.25rem;
  color: #666;
  margin-bottom: 2rem;
}

.sessions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.session-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.session-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.session-header h3 {
  color: #333;
  margin: 0;
}

.session-status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.session-status.active {
  background: #e8f5e9;
  color: #2e7d32;
}

.session-status.inactive {
  background: #fce4ec;
  color: #c62828;
}

.session-info {
  margin-bottom: 1rem;
}

.session-info p {
  margin: 0.25rem 0;
  color: #666;
  font-size: 0.875rem;
}

.session-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.btn-icon {
  padding: 0.5rem;
  background: #f0f0f0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-icon:hover {
  background: #e0e0e0;
}

.btn-danger:hover {
  background: #ffebee;
}

.btn-primary {
  padding: 0.75rem 2rem;
  background: #42b883;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
}

.btn-primary:hover {
  background: #35a372;
}

@media (max-width: 768px) {
  .sessions-grid {
    grid-template-columns: 1fr;
  }
  
  .header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .btn-create {
    width: 100%;
  }
}
</style>