<template>
  <div class="macro-recorder">
    <div class="recorder-header">
      <h3>Macro Recorder</h3>
      <button
        :class="['record-btn', { recording: isRecording }]"
        @click="toggleRecording"
      >
        {{ isRecording ? '⏹️ Stop' : '⏺️ Record' }}
      </button>
    </div>

    <div v-if="isRecording" class="recording-indicator">
      <span class="pulse"></span>
      Recording... ({{ recordedKeys.length }} keys)
    </div>

    <div v-if="recordedKeys.length > 0 && !isRecording" class="recorded-sequence">
      <h4>Recorded Sequence:</h4>
      <div class="key-sequence">
        <span v-for="(key, index) in recordedKeys" :key="index" class="recorded-key">
          {{ formatKey(key) }}
          <span v-if="index < recordedKeys.length - 1" class="separator">→</span>
        </span>
      </div>
    </div>

    <div v-if="recordedKeys.length > 0 && !isRecording" class="macro-actions">
      <input
        v-model="macroName"
        placeholder="Macro name..."
        maxlength="20"
        class="macro-name-input"
      />
      <button @click="saveMacro" :disabled="!macroName" class="save-btn">
        💾 Save Macro
      </button>
      <button @click="testMacro" class="test-btn">
        ▶️ Test
      </button>
      <button @click="clearRecording" class="clear-btn">
        🗑️ Clear
      </button>
    </div>

    <div v-if="savedMacros.length > 0" class="saved-macros">
      <h4>Saved Macros:</h4>
      <div
        v-for="macro in savedMacros"
        :key="macro.id"
        class="macro-item"
      >
        <span class="macro-name">{{ macro.name }}</span>
        <span class="macro-length">({{ macro.keys.length }} keys)</span>
        <div class="macro-controls">
          <button @click="playMacro(macro)" class="play-btn">▶️</button>
          <button @click="editMacro(macro)" class="edit-btn">✏️</button>
          <button @click="deleteMacro(macro.id)" class="delete-btn">🗑️</button>
        </div>
      </div>
    </div>

    <div class="macro-settings">
      <label>
        <input
          type="checkbox"
          v-model="settings.includeDelays"
        />
        Include timing delays
      </label>
      <label>
        <input
          type="number"
          v-model.number="settings.playbackSpeed"
          min="0.5"
          max="5"
          step="0.5"
        />
        Playback speed ({{ settings.playbackSpeed }}x)
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface RecordedKey {
  key: string
  code: string
  timestamp: number
  modifiers: {
    ctrl: boolean
    alt: boolean
    shift: boolean
    meta: boolean
  }
}

interface Macro {
  id: string
  name: string
  keys: RecordedKey[]
  createdAt: Date
}

const emit = defineEmits<{
  play: [keys: RecordedKey[]]
  save: [macro: Macro]
}>()

const isRecording = ref(false)
const recordedKeys = ref<RecordedKey[]>([])
const macroName = ref('')
const savedMacros = ref<Macro[]>([])
const settings = ref({
  includeDelays: true,
  playbackSpeed: 1
})

let recordStartTime = 0
let keydownHandler: ((e: KeyboardEvent) => void) | null = null

function toggleRecording() {
  if (isRecording.value) {
    stopRecording()
  } else {
    startRecording()
  }
}

function startRecording() {
  isRecording.value = true
  recordedKeys.value = []
  recordStartTime = Date.now()
  
  keydownHandler = (e: KeyboardEvent) => {
    // Skip modifier-only keys
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
      return
    }
    
    e.preventDefault()
    
    const recordedKey: RecordedKey = {
      key: e.key,
      code: e.code,
      timestamp: Date.now() - recordStartTime,
      modifiers: {
        ctrl: e.ctrlKey,
        alt: e.altKey,
        shift: e.shiftKey,
        meta: e.metaKey
      }
    }
    
    recordedKeys.value.push(recordedKey)
    
    // Stop recording on Escape
    if (e.key === 'Escape') {
      stopRecording()
    }
  }
  
  document.addEventListener('keydown', keydownHandler)
}

function stopRecording() {
  isRecording.value = false
  
  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler)
    keydownHandler = null
  }
  
  // Remove escape key if it was used to stop recording
  if (recordedKeys.value.length > 0) {
    const lastKey = recordedKeys.value[recordedKeys.value.length - 1]
    if (lastKey.key === 'Escape') {
      recordedKeys.value.pop()
    }
  }
}

function formatKey(key: RecordedKey): string {
  const parts = []
  
  if (key.modifiers.ctrl) parts.push('Ctrl')
  if (key.modifiers.alt) parts.push('Alt')
  if (key.modifiers.shift) parts.push('Shift')
  if (key.modifiers.meta) parts.push('Cmd')
  
  // Format the main key
  let mainKey = key.key
  if (mainKey === ' ') mainKey = 'Space'
  if (mainKey === 'Enter') mainKey = '↵'
  if (mainKey === 'Backspace') mainKey = '←'
  if (mainKey === 'Tab') mainKey = 'Tab'
  if (mainKey === 'Escape') mainKey = 'Esc'
  
  parts.push(mainKey)
  
  return parts.join('+')
}

function saveMacro() {
  if (!macroName.value || recordedKeys.value.length === 0) return
  
  const macro: Macro = {
    id: generateId(),
    name: macroName.value,
    keys: [...recordedKeys.value],
    createdAt: new Date()
  }
  
  savedMacros.value.push(macro)
  saveMacrosToStorage()
  
  emit('save', macro)
  
  // Reset
  macroName.value = ''
  recordedKeys.value = []
}

function playMacro(macro: Macro) {
  const keys = [...macro.keys]
  
  if (!settings.value.includeDelays) {
    // Play all keys immediately
    emit('play', keys)
  } else {
    // Play with delays
    playWithDelays(keys)
  }
}

async function playWithDelays(keys: RecordedKey[]) {
  const speed = settings.value.playbackSpeed
  
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const nextKey = keys[i + 1]
    
    // Emit the key
    emit('play', [key])
    
    // Wait for the delay if there's a next key
    if (nextKey && settings.value.includeDelays) {
      const delay = (nextKey.timestamp - key.timestamp) / speed
      await new Promise(resolve => setTimeout(resolve, Math.min(delay, 1000)))
    } else {
      // Default small delay between keys
      await new Promise(resolve => setTimeout(resolve, 50 / speed))
    }
  }
}

function testMacro() {
  if (recordedKeys.value.length > 0) {
    playWithDelays(recordedKeys.value)
  }
}

function editMacro(macro: Macro) {
  // Load macro for editing
  recordedKeys.value = [...macro.keys]
  macroName.value = macro.name
  
  // Remove the old macro
  const index = savedMacros.value.findIndex(m => m.id === macro.id)
  if (index > -1) {
    savedMacros.value.splice(index, 1)
  }
}

function deleteMacro(id: string) {
  const index = savedMacros.value.findIndex(m => m.id === id)
  if (index > -1) {
    savedMacros.value.splice(index, 1)
    saveMacrosToStorage()
  }
}

function clearRecording() {
  recordedKeys.value = []
  macroName.value = ''
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

function saveMacrosToStorage() {
  try {
    localStorage.setItem('keyboard-macros', JSON.stringify(savedMacros.value))
  } catch (error) {
    console.error('Failed to save macros:', error)
  }
}

function loadMacrosFromStorage() {
  try {
    const stored = localStorage.getItem('keyboard-macros')
    if (stored) {
      savedMacros.value = JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load macros:', error)
  }
}

onMounted(() => {
  loadMacrosFromStorage()
})

onUnmounted(() => {
  if (isRecording.value) {
    stopRecording()
  }
})

defineExpose({
  startRecording,
  stopRecording,
  playMacro
})
</script>

<style scoped>
.macro-recorder {
  background: #2a2a2a;
  border-radius: 8px;
  padding: 20px;
  color: white;
}

.recorder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.recorder-header h3 {
  margin: 0;
}

.record-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: #e74c3c;
  color: white;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.record-btn.recording {
  background: #2ecc71;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.recording-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: rgba(231, 76, 60, 0.2);
  border: 1px solid #e74c3c;
  border-radius: 4px;
  margin-bottom: 15px;
}

.pulse {
  width: 10px;
  height: 10px;
  background: #e74c3c;
  border-radius: 50%;
  animation: pulse 1s infinite;
}

.recorded-sequence {
  margin-bottom: 20px;
}

.recorded-sequence h4 {
  margin: 10px 0;
  color: #aaa;
}

.key-sequence {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 10px;
  background: #3a3a3a;
  border-radius: 4px;
}

.recorded-key {
  padding: 4px 8px;
  background: #4a4a4a;
  border: 1px solid #555;
  border-radius: 3px;
  font-size: 12px;
}

.separator {
  margin: 0 5px;
  color: #666;
}

.macro-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.macro-name-input {
  flex: 1;
  padding: 8px;
  background: #3a3a3a;
  border: 1px solid #555;
  border-radius: 4px;
  color: white;
}

.save-btn,
.test-btn,
.clear-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
}

.save-btn {
  background: #2ecc71;
}

.save-btn:disabled {
  background: #555;
  cursor: not-allowed;
}

.test-btn {
  background: #3498db;
}

.clear-btn {
  background: #e74c3c;
}

.saved-macros {
  margin-bottom: 20px;
}

.saved-macros h4 {
  margin: 10px 0;
  color: #aaa;
}

.macro-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  background: #3a3a3a;
  border-radius: 4px;
  margin-bottom: 10px;
}

.macro-name {
  font-weight: bold;
}

.macro-length {
  color: #888;
  font-size: 12px;
  margin-left: 10px;
}

.macro-controls {
  display: flex;
  gap: 5px;
}

.play-btn,
.edit-btn,
.delete-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 3px;
  background: #4a4a4a;
  color: white;
  cursor: pointer;
  font-size: 14px;
}

.play-btn:hover {
  background: #2ecc71;
}

.edit-btn:hover {
  background: #3498db;
}

.delete-btn:hover {
  background: #e74c3c;
}

.macro-settings {
  padding: 15px;
  background: #3a3a3a;
  border-radius: 4px;
}

.macro-settings label {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  color: #aaa;
}

.macro-settings input[type="checkbox"] {
  width: 18px;
  height: 18px;
}

.macro-settings input[type="number"] {
  width: 60px;
  padding: 4px;
  background: #2a2a2a;
  border: 1px solid #555;
  border-radius: 3px;
  color: white;
}
</style>