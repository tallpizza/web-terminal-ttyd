<template>
  <div class="settings-container">
    <div class="settings-header">
      <h2>Settings</h2>
      <button @click="$emit('close')" class="close-btn">✕</button>
    </div>

    <div class="settings-body">
      <!-- Settings Categories -->
      <div class="settings-sidebar">
        <button
          v-for="category in categories"
          :key="category.id"
          :class="['category-btn', { active: activeCategory === category.id }]"
          @click="activeCategory = category.id"
        >
          <span class="category-icon">{{ category.icon }}</span>
          <span class="category-name">{{ category.name }}</span>
        </button>
      </div>

      <!-- Settings Content -->
      <div class="settings-content">
        <!-- Appearance Settings -->
        <div v-if="activeCategory === 'appearance'" class="settings-panel">
          <h3>Appearance</h3>
          
          <div class="setting-group">
            <label>Theme</label>
            <select v-model="settings.appearance.theme">
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="auto">Auto (System)</option>
            </select>
          </div>

          <div class="setting-group">
            <label>Terminal Theme</label>
            <select v-model="settings.appearance.terminalTheme">
              <option value="default">Default</option>
              <option value="monokai">Monokai</option>
              <option value="solarized-dark">Solarized Dark</option>
              <option value="solarized-light">Solarized Light</option>
              <option value="dracula">Dracula</option>
              <option value="nord">Nord</option>
              <option value="gruvbox">Gruvbox</option>
              <option value="material">Material</option>
              <option value="one-dark">One Dark</option>
              <option value="tokyo-night">Tokyo Night</option>
            </select>
          </div>

          <div class="setting-group">
            <label>Font Family</label>
            <select v-model="settings.appearance.fontFamily">
              <option value="monospace">System Monospace</option>
              <option value="'Fira Code', monospace">Fira Code</option>
              <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
              <option value="'Cascadia Code', monospace">Cascadia Code</option>
              <option value="'Source Code Pro', monospace">Source Code Pro</option>
              <option value="'SF Mono', monospace">SF Mono</option>
              <option value="'Consolas', monospace">Consolas</option>
              <option value="'Monaco', monospace">Monaco</option>
            </select>
          </div>

          <div class="setting-group">
            <label>Font Size</label>
            <div class="range-input">
              <input
                type="range"
                v-model.number="settings.appearance.fontSize"
                min="10"
                max="24"
                step="1"
              />
              <span>{{ settings.appearance.fontSize }}px</span>
            </div>
          </div>

          <div class="setting-group">
            <label>
              <input
                type="checkbox"
                v-model="settings.appearance.ligatures"
              />
              Enable Font Ligatures
            </label>
          </div>

          <div class="setting-group">
            <label>Opacity</label>
            <div class="range-input">
              <input
                type="range"
                v-model.number="settings.appearance.opacity"
                min="50"
                max="100"
                step="5"
              />
              <span>{{ settings.appearance.opacity }}%</span>
            </div>
          </div>
        </div>

        <!-- Keyboard Settings -->
        <div v-if="activeCategory === 'keyboard'" class="settings-panel">
          <h3>Keyboard</h3>
          
          <div class="setting-group">
            <label>Keyboard Layout</label>
            <select v-model="settings.keyboard.layout">
              <option value="qwerty">QWERTY</option>
              <option value="dvorak">Dvorak</option>
              <option value="colemak">Colemak</option>
              <option value="azerty">AZERTY</option>
              <option value="qwertz">QWERTZ</option>
            </select>
          </div>

          <div class="setting-group">
            <label>
              <input
                type="checkbox"
                v-model="settings.keyboard.autoShow"
              />
              Auto-show keyboard on mobile
            </label>
          </div>

          <div class="setting-group">
            <label>
              <input
                type="checkbox"
                v-model="settings.keyboard.hapticFeedback"
              />
              Haptic feedback
            </label>
          </div>

          <div class="setting-group">
            <label>Haptic Duration</label>
            <div class="range-input">
              <input
                type="range"
                v-model.number="settings.keyboard.hapticDuration"
                min="5"
                max="50"
                step="5"
              />
              <span>{{ settings.keyboard.hapticDuration }}ms</span>
            </div>
          </div>

          <div class="setting-group">
            <label>
              <input
                type="checkbox"
                v-model="settings.keyboard.soundFeedback"
              />
              Sound feedback
            </label>
          </div>

          <div class="setting-group">
            <label>Key Repeat Delay</label>
            <div class="range-input">
              <input
                type="range"
                v-model.number="settings.keyboard.repeatDelay"
                min="100"
                max="1000"
                step="100"
              />
              <span>{{ settings.keyboard.repeatDelay }}ms</span>
            </div>
          </div>

          <div class="setting-group">
            <label>Key Repeat Rate</label>
            <div class="range-input">
              <input
                type="range"
                v-model.number="settings.keyboard.repeatRate"
                min="10"
                max="100"
                step="10"
              />
              <span>{{ settings.keyboard.repeatRate }}/s</span>
            </div>
          </div>
        </div>

        <!-- Terminal Settings -->
        <div v-if="activeCategory === 'terminal'" class="settings-panel">
          <h3>Terminal</h3>
          
          <div class="setting-group">
            <label>Scrollback Lines</label>
            <input
              type="number"
              v-model.number="settings.terminal.scrollback"
              min="100"
              max="10000"
              step="100"
            />
          </div>

          <div class="setting-group">
            <label>Cursor Style</label>
            <select v-model="settings.terminal.cursorStyle">
              <option value="block">Block</option>
              <option value="underline">Underline</option>
              <option value="bar">Bar</option>
            </select>
          </div>

          <div class="setting-group">
            <label>
              <input
                type="checkbox"
                v-model="settings.terminal.cursorBlink"
              />
              Cursor blink
            </label>
          </div>

          <div class="setting-group">
            <label>Bell Style</label>
            <select v-model="settings.terminal.bellStyle">
              <option value="none">None</option>
              <option value="visual">Visual</option>
              <option value="sound">Sound</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div class="setting-group">
            <label>
              <input
                type="checkbox"
                v-model="settings.terminal.copyOnSelect"
              />
              Copy on select
            </label>
          </div>

          <div class="setting-group">
            <label>
              <input
                type="checkbox"
                v-model="settings.terminal.rightClickPaste"
              />
              Right-click paste
            </label>
          </div>

          <div class="setting-group">
            <label>Default Shell</label>
            <select v-model="settings.terminal.shell">
              <option value="bash">Bash</option>
              <option value="zsh">Zsh</option>
              <option value="fish">Fish</option>
              <option value="sh">Sh</option>
            </select>
          </div>
        </div>

        <!-- Session Settings -->
        <div v-if="activeCategory === 'sessions'" class="settings-panel">
          <h3>Sessions</h3>
          
          <div class="setting-group">
            <label>
              <input
                type="checkbox"
                v-model="settings.sessions.autoSave"
              />
              Auto-save sessions
            </label>
          </div>

          <div class="setting-group">
            <label>Auto-save Interval</label>
            <div class="range-input">
              <input
                type="range"
                v-model.number="settings.sessions.autoSaveInterval"
                min="10"
                max="300"
                step="10"
              />
              <span>{{ settings.sessions.autoSaveInterval }}s</span>
            </div>
          </div>

          <div class="setting-group">
            <label>
              <input
                type="checkbox"
                v-model="settings.sessions.restoreOnStartup"
              />
              Restore sessions on startup
            </label>
          </div>

          <div class="setting-group">
            <label>Max Sessions</label>
            <input
              type="number"
              v-model.number="settings.sessions.maxSessions"
              min="1"
              max="50"
            />
          </div>

          <div class="setting-group">
            <label>
              <input
                type="checkbox"
                v-model="settings.sessions.confirmClose"
              />
              Confirm before closing session
            </label>
          </div>

          <div class="setting-group">
            <label>Session Timeout</label>
            <div class="range-input">
              <input
                type="range"
                v-model.number="settings.sessions.timeout"
                min="0"
                max="3600"
                step="60"
              />
              <span>{{ settings.sessions.timeout === 0 ? 'Never' : `${settings.sessions.timeout}s` }}</span>
            </div>
          </div>

          <div class="setting-group">
            <label>Default Session Name</label>
            <input
              type="text"
              v-model="settings.sessions.defaultName"
              placeholder="Terminal"
            />
          </div>
        </div>

        <!-- Advanced Settings -->
        <div v-if="activeCategory === 'advanced'" class="settings-panel">
          <h3>Advanced</h3>
          
          <div class="setting-group">
            <label>
              <input
                type="checkbox"
                v-model="settings.advanced.debug"
              />
              Enable debug mode
            </label>
          </div>

          <div class="setting-group">
            <label>
              <input
                type="checkbox"
                v-model="settings.advanced.telemetry"
              />
              Send anonymous usage statistics
            </label>
          </div>

          <div class="setting-group">
            <label>WebSocket Reconnect Attempts</label>
            <input
              type="number"
              v-model.number="settings.advanced.wsReconnectAttempts"
              min="0"
              max="10"
            />
          </div>

          <div class="setting-group">
            <label>WebSocket Reconnect Delay</label>
            <div class="range-input">
              <input
                type="range"
                v-model.number="settings.advanced.wsReconnectDelay"
                min="1000"
                max="10000"
                step="500"
              />
              <span>{{ settings.advanced.wsReconnectDelay }}ms</span>
            </div>
          </div>

          <div class="setting-group">
            <button @click="clearAllData" class="danger-btn">
              🗑️ Clear All Data
            </button>
          </div>

          <div class="setting-group">
            <button @click="exportLogs" class="action-btn">
              📋 Export Logs
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Settings Footer -->
    <div class="settings-footer">
      <button @click="exportSettings" class="action-btn">
        📤 Export Settings
      </button>
      <button @click="importSettings" class="action-btn">
        📥 Import Settings
      </button>
      <button @click="resetToDefaults" class="danger-btn">
        🔄 Reset to Defaults
      </button>
      <button @click="saveSettings" class="save-btn">
        💾 Save
      </button>
    </div>

    <!-- Import Modal -->
    <input
      ref="importInput"
      type="file"
      accept=".json"
      style="display: none"
      @change="handleImportFile"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useSettingsStore } from '../stores/settings'

const emit = defineEmits<{
  close: []
}>()

const settingsStore = useSettingsStore()
const settings = ref(settingsStore.getSettings())
const activeCategory = ref('appearance')
const importInput = ref<HTMLInputElement>()

const categories = [
  { id: 'appearance', name: 'Appearance', icon: '🎨' },
  { id: 'keyboard', name: 'Keyboard', icon: '⌨️' },
  { id: 'terminal', name: 'Terminal', icon: '💻' },
  { id: 'sessions', name: 'Sessions', icon: '📁' },
  { id: 'advanced', name: 'Advanced', icon: '⚙️' }
]

// Watch for changes and auto-save
watch(settings, (newSettings) => {
  settingsStore.updateSettings(newSettings)
}, { deep: true })

function saveSettings() {
  settingsStore.saveSettings()
  emit('close')
}

function exportSettings() {
  const data = JSON.stringify(settings.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'web-terminal-settings.json'
  a.click()
  URL.revokeObjectURL(url)
}

function importSettings() {
  importInput.value?.click()
}

function handleImportFile(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        settings.value = imported
        settingsStore.updateSettings(imported)
        settingsStore.saveSettings()
      } catch (error) {
        console.error('Failed to import settings:', error)
        alert('Invalid settings file')
      }
    }
    reader.readAsText(file)
  }
}

function resetToDefaults() {
  if (confirm('Reset all settings to defaults? This cannot be undone.')) {
    settingsStore.resetToDefaults()
    settings.value = settingsStore.getSettings()
  }
}

function clearAllData() {
  if (confirm('Clear all data including settings, shortcuts, and sessions? This cannot be undone.')) {
    localStorage.clear()
    sessionStorage.clear()
    
    // Clear IndexedDB if we implement it
    if ('indexedDB' in window) {
      indexedDB.databases().then(databases => {
        databases.forEach(db => {
          if (db.name) indexedDB.deleteDatabase(db.name)
        })
      })
    }
    
    alert('All data cleared. Refreshing...')
    window.location.reload()
  }
}

function exportLogs() {
  // Collect console logs and export
  const logs = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    settings: settings.value,
    errors: [] // Would collect from error handler
  }
  
  const data = JSON.stringify(logs, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `web-terminal-logs-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  settings.value = settingsStore.getSettings()
})
</script>

<style scoped>
.settings-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 900px;
  height: 80vh;
  background: #2a2a2a;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  z-index: 2000;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #444;
}

.settings-header h2 {
  margin: 0;
  color: white;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
}

.settings-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.settings-sidebar {
  width: 200px;
  border-right: 1px solid #444;
  padding: 10px;
  overflow-y: auto;
}

.category-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: #aaa;
  cursor: pointer;
  text-align: left;
  margin-bottom: 5px;
}

.category-btn:hover {
  background: #3a3a3a;
}

.category-btn.active {
  background: #4a4a4a;
  color: white;
}

.category-icon {
  font-size: 20px;
}

.settings-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.settings-panel h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: white;
}

.setting-group {
  margin-bottom: 20px;
}

.setting-group label {
  display: block;
  margin-bottom: 8px;
  color: #ccc;
  font-size: 14px;
}

.setting-group input[type="text"],
.setting-group input[type="number"],
.setting-group select {
  width: 100%;
  padding: 8px;
  background: #3a3a3a;
  border: 1px solid #555;
  border-radius: 4px;
  color: white;
}

.setting-group input[type="checkbox"] {
  margin-right: 8px;
}

.range-input {
  display: flex;
  align-items: center;
  gap: 15px;
}

.range-input input[type="range"] {
  flex: 1;
}

.range-input span {
  min-width: 60px;
  text-align: right;
  color: #aaa;
}

.settings-footer {
  display: flex;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #444;
  justify-content: flex-end;
}

.action-btn,
.danger-btn,
.save-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: white;
}

.action-btn {
  background: #3a3a3a;
}

.action-btn:hover {
  background: #4a4a4a;
}

.danger-btn {
  background: #e74c3c;
}

.danger-btn:hover {
  background: #c0392b;
}

.save-btn {
  background: #2ecc71;
}

.save-btn:hover {
  background: #27ae60;
}

@media (max-width: 768px) {
  .settings-container {
    width: 100%;
    height: 100%;
    max-width: none;
    border-radius: 0;
  }
  
  .settings-sidebar {
    width: 150px;
  }
  
  .category-name {
    font-size: 12px;
  }
}
</style>