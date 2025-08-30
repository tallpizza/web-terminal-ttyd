<template>
  <div class="session-view">
    <SessionTabs />
    <TerminalFrame 
      v-if="currentSession" 
      :session="currentSession"
      ref="terminalFrame"
    />
    <SimpleKeyboard 
      @key-press="handleKeyPress"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useSessionStore } from '../stores/sessions'
import SessionTabs from '../components/SessionTabs.vue'
import TerminalFrame from '../components/TerminalFrame.vue'
import SimpleKeyboard from '../components/SimpleKeyboard.vue'

const route = useRoute()
const sessionsStore = useSessionStore()
const terminalFrame = ref<any>(null)

const currentSession = computed(() => {
  const id = route.params.id as string
  return sessionsStore.sessions.find(s => s.id === id)
})

onMounted(async () => {
  // First fetch all sessions from backend
  await sessionsStore.fetchSessions()
  
  const id = route.params.id as string
  if (id) {
    await sessionsStore.setActiveSession(id)
  }
})

function handleKeyPress(event: any) {
  // Send key press through the sessions store
  if (!currentSession.value) return
  
  // Use the store's WebSocket implementation
  sessionsStore.sendKeyToSession(currentSession.value.id, event)
}
</script>

<style scoped>
.session-view {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;
}
</style>