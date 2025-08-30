<template>
  <v-footer app height="32" class="status-bar">
    <v-container fluid class="pa-0">
      <v-row no-gutters align="center" justify="space-between">
        <v-col cols="auto">
          <div class="status-section">
            <v-chip
              :color="connectionStatus.color"
              size="small"
              variant="flat"
              prepend-icon="mdi-circle"
            >
              {{ connectionStatus.text }}
            </v-chip>
          </div>
        </v-col>
        
        <v-col cols="auto">
          <div class="status-section">
            <span class="status-item">
              <v-icon size="small">mdi-console</v-icon>
              {{ activeSessionsCount }} {{ activeSessionsCount === 1 ? 'Session' : 'Sessions' }}
            </span>
            <v-divider vertical class="mx-2" />
            <span class="status-item">
              <v-icon size="small">mdi-server</v-icon>
              Port: {{ currentPort }}
            </span>
            <v-divider vertical class="mx-2" />
            <span class="status-item">
              <v-icon size="small">mdi-clock-outline</v-icon>
              {{ currentTime }}
            </span>
          </div>
        </v-col>
        
        <v-col cols="auto">
          <div class="status-section">
            <v-btn
              icon
              size="x-small"
              variant="text"
              @click="reconnect"
              :disabled="isConnected"
            >
              <v-icon>mdi-refresh</v-icon>
              <v-tooltip activator="parent" location="top">Reconnect</v-tooltip>
            </v-btn>
            <v-btn
              icon
              size="x-small"
              variant="text"
              @click="showNetworkInfo"
            >
              <v-icon>mdi-information-outline</v-icon>
              <v-tooltip activator="parent" location="top">Network Info</v-tooltip>
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <!-- Network Info Dialog -->
    <v-dialog v-model="networkDialog" max-width="400">
      <v-card>
        <v-card-title>Network Information</v-card-title>
        <v-card-text>
          <v-list density="compact">
            <v-list-item>
              <v-list-item-title>Connection Type</v-list-item-title>
              <v-list-item-subtitle>{{ networkInfo.type }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>Latency</v-list-item-title>
              <v-list-item-subtitle>{{ networkInfo.latency }}ms</v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>WebSocket URL</v-list-item-title>
              <v-list-item-subtitle>{{ networkInfo.wsUrl }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>Backend Status</v-list-item-title>
              <v-list-item-subtitle>{{ networkInfo.backendStatus }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="networkDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-footer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSessionStore } from '@stores/sessions'

const sessionStore = useSessionStore()

const currentTime = ref(new Date().toLocaleTimeString())
const networkDialog = ref(false)
const latency = ref(0)
const backendOnline = ref(false)

const activeSessionsCount = computed(() => sessionStore.sessions.length)
const currentPort = computed(() => sessionStore.activeSession?.port || 'N/A')

const isConnected = computed(() => {
  return sessionStore.activeSession?.status === 'connected'
})

const connectionStatus = computed(() => {
  if (!sessionStore.activeSession) {
    return { text: 'No Session', color: 'grey' }
  }
  
  switch (sessionStore.activeSession.status) {
    case 'connected':
      return { text: 'Connected', color: 'success' }
    case 'connecting':
      return { text: 'Connecting...', color: 'warning' }
    case 'disconnected':
      return { text: 'Disconnected', color: 'error' }
    case 'error':
      return { text: 'Error', color: 'error' }
    default:
      return { text: 'Unknown', color: 'grey' }
  }
})

const networkInfo = computed(() => ({
  type: navigator.onLine ? 'Online' : 'Offline',
  latency: `${latency.value}`,
  wsUrl: sessionStore.activeSession ? 
    `ws://localhost:${sessionStore.activeSession.port}/ws` : 
    'No active session',
  backendStatus: backendOnline.value ? 'Online' : 'Offline'
}))

let timeInterval: number | null = null
let pingInterval: number | null = null

onMounted(() => {
  // Update time every second
  timeInterval = setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString()
  }, 1000)
  
  // Check backend status every 5 seconds
  pingInterval = setInterval(async () => {
    await checkBackendStatus()
  }, 5000)
  
  // Initial check
  checkBackendStatus()
})

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval)
  if (pingInterval) clearInterval(pingInterval)
})

async function checkBackendStatus() {
  const startTime = Date.now()
  try {
    const response = await fetch('/api/health')
    if (response.ok) {
      backendOnline.value = true
      latency.value = Date.now() - startTime
    } else {
      backendOnline.value = false
    }
  } catch (error) {
    backendOnline.value = false
    latency.value = 0
  }
}

function reconnect() {
  if (sessionStore.activeSession) {
    sessionStore.reconnectSession(sessionStore.activeSession.id)
  }
}

function showNetworkInfo() {
  networkDialog.value = true
}
</script>

<style scoped>
.status-bar {
  background: var(--v-theme-surface);
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  font-size: 0.875rem;
}

.status-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--v-theme-on-surface);
  opacity: 0.8;
}

.v-theme--dark .status-bar {
  border-top-color: rgba(255, 255, 255, 0.12);
}
</style>