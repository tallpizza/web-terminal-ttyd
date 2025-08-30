import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface AppSettings {
  appearance: {
    theme: 'dark' | 'light' | 'auto'
    terminalTheme: string
    fontFamily: string
    fontSize: number
    ligatures: boolean
    opacity: number
  }
  keyboard: {
    layout: string
    autoShow: boolean
    hapticFeedback: boolean
    hapticDuration: number
    soundFeedback: boolean
    repeatDelay: number
    repeatRate: number
  }
  terminal: {
    scrollback: number
    cursorStyle: 'block' | 'underline' | 'bar'
    cursorBlink: boolean
    bellStyle: 'none' | 'visual' | 'sound' | 'both'
    copyOnSelect: boolean
    rightClickPaste: boolean
    shell: string
  }
  sessions: {
    autoSave: boolean
    autoSaveInterval: number
    restoreOnStartup: boolean
    maxSessions: number
    confirmClose: boolean
    timeout: number
    defaultName: string
  }
  advanced: {
    debug: boolean
    telemetry: boolean
    wsReconnectAttempts: number
    wsReconnectDelay: number
  }
}

const defaultSettings: AppSettings = {
  appearance: {
    theme: 'dark',
    terminalTheme: 'default',
    fontFamily: 'monospace',
    fontSize: 14,
    ligatures: true,
    opacity: 100
  },
  keyboard: {
    layout: 'qwerty',
    autoShow: true,
    hapticFeedback: true,
    hapticDuration: 10,
    soundFeedback: false,
    repeatDelay: 500,
    repeatRate: 30
  },
  terminal: {
    scrollback: 1000,
    cursorStyle: 'block',
    cursorBlink: true,
    bellStyle: 'visual',
    copyOnSelect: false,
    rightClickPaste: true,
    shell: 'bash'
  },
  sessions: {
    autoSave: true,
    autoSaveInterval: 30,
    restoreOnStartup: true,
    maxSessions: 10,
    confirmClose: true,
    timeout: 0,
    defaultName: 'Terminal'
  },
  advanced: {
    debug: false,
    telemetry: false,
    wsReconnectAttempts: 5,
    wsReconnectDelay: 2000
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<AppSettings>(loadSettings())
  const isDirty = ref(false)
  let autoSaveTimer: ReturnType<typeof setTimeout> | null = null

  // Load settings from localStorage
  function loadSettings(): AppSettings {
    try {
      const stored = localStorage.getItem('web-terminal-settings')
      if (stored) {
        const parsed = JSON.parse(stored)
        // Merge with defaults to ensure all fields exist
        return deepMerge(defaultSettings, parsed)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
    return { ...defaultSettings }
  }

  // Save settings to localStorage
  function saveSettings() {
    try {
      localStorage.setItem('web-terminal-settings', JSON.stringify(settings.value))
      isDirty.value = false
      console.log('Settings saved')
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  // Update settings
  function updateSettings(newSettings: Partial<AppSettings>) {
    settings.value = deepMerge(settings.value, newSettings)
    isDirty.value = true
    
    // Reset auto-save timer
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
    }
    
    // Auto-save after delay
    if (settings.value.sessions.autoSave) {
      autoSaveTimer = setTimeout(() => {
        saveSettings()
      }, settings.value.sessions.autoSaveInterval * 1000)
    }
  }

  // Get current settings
  function getSettings(): AppSettings {
    return { ...settings.value }
  }

  // Get specific setting
  function getSetting<K extends keyof AppSettings>(category: K): AppSettings[K]
  function getSetting<K extends keyof AppSettings, P extends keyof AppSettings[K]>(
    category: K,
    property: P
  ): AppSettings[K][P]
  function getSetting(category: any, property?: any): any {
    if (property) {
      return (settings.value as any)[category][property]
    }
    return (settings.value as any)[category]
  }

  // Set specific setting
  function setSetting<K extends keyof AppSettings>(
    category: K,
    value: AppSettings[K]
  ): void
  function setSetting<K extends keyof AppSettings, P extends keyof AppSettings[K]>(
    category: K,
    property: P,
    value: AppSettings[K][P]
  ): void
  function setSetting(category: any, propertyOrValue: any, value?: any) {
    if (value !== undefined) {
      (settings.value as any)[category][propertyOrValue] = value
    } else {
      (settings.value as any)[category] = propertyOrValue
    }
    isDirty.value = true
  }

  // Reset to defaults
  function resetToDefaults() {
    settings.value = { ...defaultSettings }
    saveSettings()
  }

  // Apply theme
  function applyTheme() {
    const theme = settings.value.appearance.theme
    const root = document.documentElement
    
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
    } else {
      root.setAttribute('data-theme', theme)
    }
    
    // Apply font settings
    root.style.setProperty('--terminal-font-family', settings.value.appearance.fontFamily)
    root.style.setProperty('--terminal-font-size', `${settings.value.appearance.fontSize}px`)
    root.style.setProperty('--terminal-opacity', `${settings.value.appearance.opacity / 100}`)
  }

  // Export settings
  function exportSettings(): string {
    return JSON.stringify(settings.value, null, 2)
  }

  // Import settings
  function importSettings(jsonString: string): boolean {
    try {
      const imported = JSON.parse(jsonString)
      settings.value = deepMerge(defaultSettings, imported)
      saveSettings()
      applyTheme()
      return true
    } catch (error) {
      console.error('Failed to import settings:', error)
      return false
    }
  }

  // Initialize IndexedDB for larger data storage
  async function initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('WebTerminalDB', 1)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Create stores
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'id' })
        }
        
        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', { keyPath: 'id', autoIncrement: true })
          historyStore.createIndex('sessionId', 'sessionId', { unique: false })
          historyStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
        
        if (!db.objectStoreNames.contains('shortcuts')) {
          db.createObjectStore('shortcuts', { keyPath: 'id' })
        }
      }
    })
  }

  // Deep merge utility
  function deepMerge(target: any, source: any): any {
    const result = { ...target }
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key] || {}, source[key])
      } else {
        result[key] = source[key]
      }
    }
    
    return result
  }

  // Watch for theme changes
  watch(() => settings.value.appearance.theme, applyTheme)
  watch(() => settings.value.appearance.fontFamily, applyTheme)
  watch(() => settings.value.appearance.fontSize, applyTheme)
  watch(() => settings.value.appearance.opacity, applyTheme)

  // Initialize
  applyTheme()
  initIndexedDB().catch(console.error)

  return {
    settings,
    isDirty,
    getSettings,
    getSetting,
    setSetting,
    updateSettings,
    saveSettings,
    resetToDefaults,
    applyTheme,
    exportSettings,
    importSettings,
    initIndexedDB
  }
})