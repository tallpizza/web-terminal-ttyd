<template>
  <div class="session-tabs">
    <!-- Mobile dropdown view -->
    <div v-if="isMobile && sessions.length > 2" class="mobile-tabs">
      <div class="mobile-current-tab" @click="showDropdown = !showDropdown">
        <span class="tab-name">{{ currentSession?.name || 'No Session' }}</span>
        <span class="dropdown-arrow">{{ showDropdown ? '▲' : '▼' }}</span>
      </div>
      
      <div v-if="showDropdown" class="mobile-dropdown">
        <div 
          v-for="session in sessions" 
          :key="session.id"
          :class="['dropdown-item', { active: session.id === activeSessionId }]"
          @click="selectSession(session.id)"
        >
          <span class="session-name">{{ session.name }}</span>
          <button 
            class="close-btn" 
            @click.stop="closeSession(session.id)"
          >
            ×
          </button>
        </div>
      </div>
      
      <button 
        class="mobile-add-btn" 
        @click="createNewSession"
        title="New Session"
      >
        +
      </button>
    </div>
    
    <!-- Desktop tab view -->
    <div v-else class="tabs-container" ref="tabsContainer">
      <div 
        v-for="session in sessions" 
        :key="session.id"
        :class="['tab', { active: session.id === activeSessionId }]"
        @click="switchSession(session.id)"
      >
        <span class="tab-name" @dblclick="startRename(session)">
          {{ session.name }}
        </span>
        <button 
          class="close-btn" 
          @click.stop="closeSession(session.id)"
          :title="'Close ' + session.name"
        >
          ×
        </button>
      </div>
      
      <button 
        class="tab add-tab" 
        @click="createNewSession"
        title="New Session (Ctrl+Shift+T)"
      >
        +
      </button>
    </div>
    
    <!-- Rename Dialog -->
    <div v-if="renamingSession" class="rename-dialog">
      <input 
        v-model="newName"
        @keyup.enter="confirmRename"
        @keyup.esc="cancelRename"
        ref="renameInput"
        placeholder="Session name"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore, type Session } from '../stores/sessions'
import { useTouchGestures } from '../composables/useTouchGestures'

const store = useSessionStore()
const router = useRouter()

const sessions = computed(() => store.sessions)
const activeSessionId = computed(() => store.activeSessionId)
const currentSession = computed(() => sessions.value.find(s => s.id === activeSessionId.value))

const renamingSession = ref<Session | null>(null)
const newName = ref('')
const renameInput = ref<HTMLInputElement>()
const showDropdown = ref(false)

const isMobile = computed(() => {
  return window.innerWidth < 768 || 'ontouchstart' in window || navigator.maxTouchPoints > 0
})

async function createNewSession() {
  try {
    const newSession = await store.createSession()
    if (newSession && newSession.id) {
      router.push(`/session/${newSession.id}`)
    }
  } catch (error) {
    console.error('Failed to create session:', error)
  }
}

function switchSession(id: string) {
  store.switchSession(id)
  router.push(`/session/${id}`)
}

function selectSession(id: string) {
  store.switchSession(id)
  router.push(`/session/${id}`)
  showDropdown.value = false
}

async function closeSession(id: string) {
  if (confirm('Close this session?')) {
    await store.closeSession(id)
  }
}

async function startRename(session: Session) {
  renamingSession.value = session
  newName.value = session.name
  await nextTick()
  renameInput.value?.select()
}

async function confirmRename() {
  if (renamingSession.value && newName.value.trim()) {
    await store.renameSession(renamingSession.value.id, newName.value.trim())
    cancelRename()
  }
}

function cancelRename() {
  renamingSession.value = null
  newName.value = ''
}

// Keyboard shortcuts
function handleKeydown(e: KeyboardEvent) {
  // Ctrl+Shift+T: New tab
  if (e.ctrlKey && e.shiftKey && e.key === 'T') {
    e.preventDefault()
    createNewSession()
  }
  
  // Ctrl+Tab: Next tab
  if (e.ctrlKey && e.key === 'Tab' && !e.shiftKey) {
    e.preventDefault()
    const currentIndex = sessions.value.findIndex(s => s.id === activeSessionId.value)
    const nextIndex = (currentIndex + 1) % sessions.value.length
    if (sessions.value[nextIndex]) {
      switchSession(sessions.value[nextIndex].id)
    }
  }
  
  // Ctrl+Shift+Tab: Previous tab
  if (e.ctrlKey && e.shiftKey && e.key === 'Tab') {
    e.preventDefault()
    const currentIndex = sessions.value.findIndex(s => s.id === activeSessionId.value)
    const prevIndex = currentIndex === 0 ? sessions.value.length - 1 : currentIndex - 1
    if (sessions.value[prevIndex]) {
      switchSession(sessions.value[prevIndex].id)
    }
  }
  
  // Ctrl+W: Close tab
  if (e.ctrlKey && e.key === 'w') {
    e.preventDefault()
    if (activeSessionId.value) {
      closeSession(activeSessionId.value)
    }
  }
}

// Touch gesture support for mobile
const tabsContainer = ref<HTMLElement>()

const touchGestures = useTouchGestures({
  onSwipeLeft: () => {
    // Next tab
    const currentIndex = sessions.value.findIndex(s => s.id === activeSessionId.value)
    const nextIndex = (currentIndex + 1) % sessions.value.length
    if (sessions.value[nextIndex]) {
      switchSession(sessions.value[nextIndex].id)
    }
  },
  onSwipeRight: () => {
    // Previous tab
    const currentIndex = sessions.value.findIndex(s => s.id === activeSessionId.value)
    const prevIndex = currentIndex === 0 ? sessions.value.length - 1 : currentIndex - 1
    if (sessions.value[prevIndex]) {
      switchSession(sessions.value[prevIndex].id)
    }
  },
  swipeThreshold: 50
})

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  
  // Setup touch gestures on tabs container
  if (tabsContainer.value) {
    touchGestures.setup(tabsContainer.value)
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  touchGestures.cleanup()
})
</script>

<style scoped>
.session-tabs {
  background: #1e1e1e;
  border-bottom: 1px solid #333;
  user-select: none;
}

.tabs-container {
  display: flex;
  align-items: center;
  height: 40px;
  padding: 0 10px;
  overflow-x: auto;
  scrollbar-width: thin;
}

.tabs-container::-webkit-scrollbar {
  height: 3px;
}

.tabs-container::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 3px;
}

.tab {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  margin-right: 2px;
  background: #2d2d2d;
  border: 1px solid #444;
  border-radius: 4px 4px 0 0;
  color: #ccc;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100px;
  max-width: 200px;
}

.tab:hover {
  background: #3d3d3d;
  color: #fff;
}

.tab.active {
  background: #007acc;
  border-color: #007acc;
  color: #fff;
}

.tab-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.close-btn {
  margin-left: 8px;
  padding: 2px 6px;
  background: transparent;
  border: none;
  color: inherit;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.close-btn:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.add-tab {
  min-width: 32px;
  max-width: 32px;
  justify-content: center;
  font-size: 20px;
  font-weight: 300;
}

.rename-dialog {
  position: absolute;
  top: 45px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background: #2d2d2d;
  border: 1px solid #555;
  border-radius: 4px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.rename-dialog input {
  background: #1e1e1e;
  border: 1px solid #444;
  color: #fff;
  padding: 6px 10px;
  border-radius: 3px;
  font-size: 13px;
  min-width: 200px;
}

.rename-dialog input:focus {
  outline: none;
  border-color: #007acc;
}

/* Mobile dropdown styles */
.mobile-tabs {
  display: flex;
  align-items: center;
  height: 36px; /* Reduced from 40px */
  padding: 0 8px; /* Reduced padding */
  background: #1e1e1e;
  border-bottom: 1px solid #333;
  position: relative;
}

.mobile-current-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px; /* Reduced from 36px */
  padding: 0 10px; /* Reduced padding */
  background: #007acc;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  min-height: 36px; /* Still touch-friendly but smaller */
}

.dropdown-arrow {
  font-size: 12px;
  margin-left: 8px;
}

.mobile-dropdown {
  position: absolute;
  top: 100%;
  left: 10px;
  right: 60px;
  background: #2d2d2d;
  border: 1px solid #444;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
}

.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  color: #ccc;
  cursor: pointer;
  min-height: 44px; /* Touch-friendly size */
  border-bottom: 1px solid #444;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background: #3d3d3d;
  color: #fff;
}

.dropdown-item.active {
  background: #007acc;
  color: #fff;
}

.session-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-add-btn {
  width: 36px; /* Reduced from 44px */
  height: 32px; /* Reduced from 44px */
  margin-left: 6px; /* Reduced margin */
  background: #2d2d2d;
  border: 1px solid #444;
  border-radius: 4px;
  color: #ccc;
  font-size: 20px; /* Slightly smaller */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.mobile-add-btn:hover {
  background: #3d3d3d;
  color: #fff;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .tab {
    min-width: 80px;
    max-width: 150px;
  }
  
  .close-btn {
    padding: 4px 8px;
    font-size: 20px;
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>