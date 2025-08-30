import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

// Use current hostname with the same port as the frontend (backend serves both)
const API_BASE = import.meta.env.VITE_API_URL || ''

export interface Session {
  id: string
  name: string
  port: number
  pid: number
  url: string
  shell?: string
  workingDir?: string
  createdAt: string
  lastActivity: string
  status: string
}

export const useSessionStore = defineStore('sessions', () => {
  const sessions = ref<Session[]>([])
  const activeSessionId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const activeSession = computed(() => {
    if (!activeSessionId.value) return null
    return sessions.value.find(s => s.id === activeSessionId.value) || null
  })

  const sessionCount = computed(() => sessions.value.length)

  async function fetchSessions() {
    loading.value = true
    error.value = null
    try {
      const response = await axios.get(`${API_BASE}/api/sessions`)
      sessions.value = response.data
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching sessions:', err)
    } finally {
      loading.value = false
    }
  }

  async function createSession(config: { name?: string; workingDir?: string; shell?: string } = {}) {
    loading.value = true
    error.value = null
    try {
      const response = await axios.post(`${API_BASE}/api/sessions`, {
        name: config.name || `Session ${sessionCount.value + 1}`,
        workingDir: config.workingDir,
        shell: config.shell
      })
      const newSession = response.data
      sessions.value.push(newSession)
      activeSessionId.value = newSession.id
      return newSession
    } catch (err: any) {
      error.value = err.message
      console.error('Error creating session:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function closeSession(id: string) {
    loading.value = true
    error.value = null
    try {
      await axios.delete(`${API_BASE}/api/sessions/${id}`)
      sessions.value = sessions.value.filter(s => s.id !== id)
      
      // Switch to another session if closing the active one
      if (activeSessionId.value === id) {
        activeSessionId.value = sessions.value[0]?.id || null
      }
    } catch (err: any) {
      error.value = err.message
      console.error('Error closing session:', err)
    } finally {
      loading.value = false
    }
  }

  async function renameSession(id: string, name: string) {
    // Optimistic update
    const session = sessions.value.find(s => s.id === id)
    const oldName = session?.name
    if (session) {
      session.name = name
    }
    
    try {
      await axios.put(`${API_BASE}/api/sessions/${id}/rename`, { name })
    } catch (err: any) {
      // Revert on error
      if (session && oldName) {
        session.name = oldName
      }
      error.value = err.message
      console.error('Error renaming session:', err)
      throw err
    }
  }

  function switchSession(id: string) {
    const session = sessions.value.find(s => s.id === id)
    if (session) {
      activeSessionId.value = id
    }
  }

  function getSessionUrl(id: string): string {
    const session = sessions.value.find(s => s.id === id)
    if (!session) return ''
    
    // Use the terminal proxy page instead of direct GoTTY connection
    return `/terminal/${id}?session=${id}`
  }

  async function setActiveSession(id: string) {
    activeSessionId.value = id
    saveStateToLocalStorage()
  }

  async function reloadSession(id: string) {
    const session = sessions.value.find(s => s.id === id)
    if (session) {
      // Trigger reload by updating lastActivity
      session.lastActivity = new Date().toISOString()
    }
  }

  async function reconnectSession(id: string) {
    const session = sessions.value.find(s => s.id === id)
    if (session) {
      session.status = 'connecting'
      // Simulate reconnection
      setTimeout(() => {
        session.status = 'connected'
      }, 1500)
    }
  }

  async function sendKeyToSession(id: string, event: any) {
    console.log('Sending key to session:', id, event)
    
    const session = sessions.value.find(s => s.id === id)
    if (!session) return
    
    try {
      // Send keyboard input via HTTP POST to backend
      const response = await axios.post(`${API_BASE}/api/sessions/${id}/input`, {
        key: event.key,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
        shiftKey: event.shiftKey
      })
      
      console.log('Key sent successfully:', response.data)
      
      // Update session activity
      session.lastActivity = new Date().toISOString()
    } catch (error: any) {
      console.error('Error sending key:', error)
      // Don't update the error state for individual key presses
      // to avoid disrupting the user experience
    }
  }

  // LocalStorage persistence
  function saveStateToLocalStorage() {
    const state = {
      activeSessionId: activeSessionId.value,
      sessions: sessions.value.map(s => ({
        id: s.id,
        name: s.name,
        port: s.port
      }))
    }
    localStorage.setItem('terminal-sessions', JSON.stringify(state))
  }

  function loadStateFromLocalStorage() {
    const stored = localStorage.getItem('terminal-sessions')
    if (stored) {
      try {
        const state = JSON.parse(stored)
        activeSessionId.value = state.activeSessionId
        // Sessions will be fetched from backend, but we can use stored IDs for restoration
        return state
      } catch (e) {
        console.error('Error loading state from localStorage:', e)
      }
    }
    return null
  }

  // Auto-save on changes
  let saveTimeout: number | null = null
  function debouncedSave() {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      saveStateToLocalStorage()
    }, 1000)
  }

  // Watch for changes and auto-save
  sessions.value = new Proxy(sessions.value, {
    set(target, property, value) {
      target[property as any] = value
      debouncedSave()
      return true
    }
  })

  // Load state on initialization
  const storedState = loadStateFromLocalStorage()
  if (storedState && storedState.activeSessionId) {
    activeSessionId.value = storedState.activeSessionId
  }

  return {
    // State
    sessions,
    activeSessionId,
    loading,
    error,
    
    // Computed
    activeSession,
    sessionCount,
    
    // Actions
    fetchSessions,
    createSession,
    closeSession,
    renameSession,
    switchSession,
    getSessionUrl,
    setActiveSession,
    reloadSession,
    reconnectSession,
    sendKeyToSession,
    saveStateToLocalStorage,
    loadStateFromLocalStorage
  }
})