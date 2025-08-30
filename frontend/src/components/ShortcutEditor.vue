<template>
  <div v-if="visible" class="shortcut-editor-overlay" @click="close">
    <div class="shortcut-editor" @click.stop>
      <div class="editor-header">
        <h2>Keyboard Shortcuts</h2>
        <button class="close-btn" @click="close">✕</button>
      </div>

      <div class="editor-body">
        <!-- Tabs for Groups -->
        <div class="group-tabs">
          <button
            v-for="group in groups"
            :key="group.id"
            :class="['group-tab', { active: activeGroupId === group.id }]"
            @click="selectGroup(group.id)"
          >
            <span v-if="group.icon">{{ group.icon }}</span>
            <span>{{ group.name }}</span>
            <input
              type="checkbox"
              :checked="group.enabled"
              @click.stop
              @change="toggleGroup(group.id)"
            />
          </button>
          <button class="group-tab add-group" @click="showAddGroup = true">
            + Add Group
          </button>
        </div>

        <!-- Shortcuts List -->
        <div class="shortcuts-list">
          <div
            v-for="shortcut in currentGroupShortcuts"
            :key="shortcut.id"
            class="shortcut-item"
            draggable="true"
            @dragstart="startDrag(shortcut)"
            @dragover.prevent
            @drop="handleDrop(shortcut)"
          >
            <div class="shortcut-preview">
              <span v-if="shortcut.icon" class="shortcut-icon">{{ shortcut.icon }}</span>
              <span class="shortcut-label">{{ shortcut.label }}</span>
              <span class="shortcut-keys">{{ formatKeys(shortcut.keys) }}</span>
            </div>
            <div class="shortcut-actions">
              <button @click="editShortcut(shortcut)" class="action-btn">✏️</button>
              <button @click="duplicateShortcut(shortcut)" class="action-btn">📋</button>
              <button @click="deleteShortcut(shortcut.id)" class="action-btn delete">🗑️</button>
            </div>
          </div>

          <!-- Add Shortcut Button -->
          <button class="add-shortcut-btn" @click="showAddShortcut = true">
            + Add Shortcut
          </button>
        </div>

        <!-- Preset Groups -->
        <div class="preset-section">
          <h3>Import Preset Groups</h3>
          <div class="preset-list">
            <button @click="loadPreset('navigation')" class="preset-btn">
              🧭 Navigation Keys
            </button>
            <button @click="loadPreset('vim')" class="preset-btn">
              📝 Vim Commands
            </button>
            <button @click="loadPreset('git')" class="preset-btn">
              🔀 Git Commands
            </button>
            <button @click="loadPreset('docker')" class="preset-btn">
              🐳 Docker Commands
            </button>
            <button @click="loadPreset('function')" class="preset-btn">
              🔧 Function Keys
            </button>
          </div>
        </div>

        <!-- Import/Export -->
        <div class="import-export">
          <button @click="exportShortcuts" class="action-btn">
            📤 Export Configuration
          </button>
          <button @click="showImport = true" class="action-btn">
            📥 Import Configuration
          </button>
          <button @click="resetToDefaults" class="action-btn danger">
            🔄 Reset to Defaults
          </button>
        </div>
      </div>

      <!-- Add/Edit Shortcut Modal -->
      <div v-if="showAddShortcut || editingShortcut" class="modal-overlay" @click="cancelEdit">
        <div class="modal-content" @click.stop>
          <h3>{{ editingShortcut ? 'Edit' : 'Add' }} Shortcut</h3>
          
          <div class="form-group">
            <label>Label (max 10 chars)</label>
            <input
              v-model="shortcutForm.label"
              maxlength="10"
              placeholder="e.g., Copy"
            />
          </div>

          <div class="form-group">
            <label>Key Combination</label>
            <div class="key-recorder" @click="startRecording">
              <span v-if="recording">Press keys...</span>
              <span v-else>{{ formatKeys(shortcutForm.keys) || 'Click to record' }}</span>
            </div>
          </div>

          <div class="form-group">
            <label>Icon (optional)</label>
            <div class="icon-picker">
              <button
                v-for="icon in availableIcons"
                :key="icon"
                :class="['icon-option', { selected: shortcutForm.icon === icon }]"
                @click="shortcutForm.icon = icon"
              >
                {{ icon }}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label>Color</label>
            <div class="color-picker">
              <button
                v-for="color in availableColors"
                :key="color"
                :class="['color-option', { selected: shortcutForm.color === color }]"
                :style="{ backgroundColor: color }"
                @click="shortcutForm.color = color"
              />
            </div>
          </div>

          <div class="form-group">
            <label>Size</label>
            <select v-model="shortcutForm.size">
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          <div class="form-actions">
            <button @click="testShortcut" class="test-btn">Test</button>
            <button @click="saveShortcut" class="save-btn">Save</button>
            <button @click="cancelEdit" class="cancel-btn">Cancel</button>
          </div>
        </div>
      </div>

      <!-- Import Modal -->
      <div v-if="showImport" class="modal-overlay" @click="showImport = false">
        <div class="modal-content" @click.stop>
          <h3>Import Configuration</h3>
          <textarea
            v-model="importData"
            placeholder="Paste JSON configuration here..."
            rows="10"
          />
          <div class="form-actions">
            <button @click="doImport" class="save-btn">Import</button>
            <button @click="showImport = false" class="cancel-btn">Cancel</button>
          </div>
        </div>
      </div>

      <!-- Add Group Modal -->
      <div v-if="showAddGroup" class="modal-overlay" @click="showAddGroup = false">
        <div class="modal-content" @click.stop>
          <h3>Add Group</h3>
          <div class="form-group">
            <label>Group Name</label>
            <input v-model="groupForm.name" placeholder="e.g., Custom Commands" />
          </div>
          <div class="form-group">
            <label>Icon (optional)</label>
            <input v-model="groupForm.icon" placeholder="e.g., 🚀" maxlength="2" />
          </div>
          <div class="form-actions">
            <button @click="createGroup" class="save-btn">Create</button>
            <button @click="showAddGroup = false" class="cancel-btn">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useShortcutsStore } from '../stores/shortcuts'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const shortcutsStore = useShortcutsStore()

const activeGroupId = ref('basic')
const showAddShortcut = ref(false)
const showImport = ref(false)
const showAddGroup = ref(false)
const editingShortcut = ref<any>(null)
const recording = ref(false)
const importData = ref('')
const draggedShortcut = ref<any>(null)

const shortcutForm = ref({
  label: '',
  keys: [] as string[],
  icon: '',
  color: '',
  size: 'medium' as 'small' | 'medium' | 'large'
})

const groupForm = ref({
  name: '',
  icon: ''
})

const availableIcons = [
  '📋', '📌', '✂️', '↩️', '↪️', '💾', '🔍', '🔄', '⚡', '🚀',
  '🎯', '🔧', '⚙️', '📊', '📈', '🔒', '🔓', '🌟', '❤️', '✨'
]

const availableColors = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
  '#ff9ff3', '#54a0ff', '#48dbfb', '#a29bfe', '#fd79a8'
]

const groups = computed(() => Array.from(shortcutsStore.groups.values()))

const currentGroupShortcuts = computed(() => {
  const group = shortcutsStore.groups.get(activeGroupId.value)
  if (!group) return []
  
  return group.shortcuts
    .map(id => shortcutsStore.shortcuts.get(id))
    .filter(Boolean)
})

function selectGroup(groupId: string) {
  activeGroupId.value = groupId
}

function toggleGroup(groupId: string) {
  shortcutsStore.toggleGroup(groupId)
}

function formatKeys(keys: string[]) {
  if (!keys || keys.length === 0) return ''
  
  const keyNames = keys.map(key => {
    switch(key) {
      case 'Control': return 'Ctrl'
      case 'Meta': return 'Cmd'
      case 'Alt': return 'Alt'
      case 'Shift': return 'Shift'
      default: return key.replace('Key', '').replace('Digit', '')
    }
  })
  
  return keyNames.join('+')
}

function startRecording() {
  recording.value = true
  shortcutForm.value.keys = []
  
  const recordedKeys = new Set<string>()
  
  const handleKeyDown = (e: KeyboardEvent) => {
    e.preventDefault()
    recordedKeys.add(e.code)
    shortcutForm.value.keys = Array.from(recordedKeys)
  }
  
  const handleKeyUp = () => {
    if (recordedKeys.size > 0) {
      recording.value = false
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }
  
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('keyup', handleKeyUp)
}

function editShortcut(shortcut: any) {
  editingShortcut.value = shortcut
  shortcutForm.value = {
    label: shortcut.label,
    keys: [...shortcut.keys],
    icon: shortcut.icon || '',
    color: shortcut.color || '',
    size: shortcut.size || 'medium'
  }
  showAddShortcut.value = true
}

function duplicateShortcut(shortcut: any) {
  shortcutsStore.addShortcut({
    ...shortcut,
    label: shortcut.label + ' 2',
    group: activeGroupId.value
  })
}

function deleteShortcut(id: string) {
  if (confirm('Delete this shortcut?')) {
    shortcutsStore.deleteShortcut(id)
  }
}

function testShortcut() {
  alert(`Testing: ${formatKeys(shortcutForm.value.keys)}`)
}

function saveShortcut() {
  if (editingShortcut.value) {
    shortcutsStore.updateShortcut(editingShortcut.value.id, {
      ...shortcutForm.value,
      code: formatKeys(shortcutForm.value.keys),
      enabled: true
    })
  } else {
    shortcutsStore.addShortcut({
      ...shortcutForm.value,
      code: formatKeys(shortcutForm.value.keys),
      group: activeGroupId.value,
      enabled: true
    })
  }
  cancelEdit()
}

function cancelEdit() {
  showAddShortcut.value = false
  editingShortcut.value = null
  shortcutForm.value = {
    label: '',
    keys: [],
    icon: '',
    color: '',
    size: 'medium'
  }
}

function createGroup() {
  const groupId = shortcutsStore.createGroup(groupForm.value.name, groupForm.value.icon)
  activeGroupId.value = groupId
  showAddGroup.value = false
  groupForm.value = { name: '', icon: '' }
}

function loadPreset(preset: string) {
  // Preset loading logic would be implemented here
  console.log('Loading preset:', preset)
}

function exportShortcuts() {
  const data = shortcutsStore.exportShortcuts()
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'keyboard-shortcuts.json'
  a.click()
  URL.revokeObjectURL(url)
}

function doImport() {
  if (shortcutsStore.importShortcuts(importData.value)) {
    showImport.value = false
    importData.value = ''
  } else {
    alert('Invalid configuration format')
  }
}

function resetToDefaults() {
  if (confirm('Reset all shortcuts to defaults? This cannot be undone.')) {
    shortcutsStore.resetToDefaults()
  }
}

function startDrag(shortcut: any) {
  draggedShortcut.value = shortcut
}

function handleDrop(targetShortcut: any) {
  // Reorder logic would be implemented here
  console.log('Dropped', draggedShortcut.value, 'on', targetShortcut)
  draggedShortcut.value = null
}

function close() {
  emit('close')
}
</script>

<style scoped>
.shortcut-editor-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.shortcut-editor {
  background: #2a2a2a;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  color: white;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #444;
}

.editor-header h2 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
}

.editor-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.group-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.group-tab {
  padding: 8px 16px;
  background: #3a3a3a;
  border: 1px solid #555;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}

.group-tab.active {
  background: #4a4a4a;
  border-color: #66a6ff;
}

.group-tab input[type="checkbox"] {
  margin-left: 5px;
}

.add-group {
  background: #444;
  border-style: dashed;
}

.shortcuts-list {
  margin-bottom: 20px;
}

.shortcut-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #3a3a3a;
  border-radius: 4px;
  margin-bottom: 10px;
  cursor: move;
}

.shortcut-preview {
  display: flex;
  align-items: center;
  gap: 10px;
}

.shortcut-icon {
  font-size: 20px;
}

.shortcut-label {
  font-weight: bold;
}

.shortcut-keys {
  color: #aaa;
  font-size: 12px;
}

.shortcut-actions {
  display: flex;
  gap: 5px;
}

.action-btn {
  padding: 5px 10px;
  background: #4a4a4a;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  font-size: 14px;
}

.action-btn:hover {
  background: #5a5a5a;
}

.action-btn.delete:hover {
  background: #ff6b6b;
}

.add-shortcut-btn {
  width: 100%;
  padding: 10px;
  background: #444;
  border: 1px dashed #666;
  border-radius: 4px;
  color: white;
  cursor: pointer;
}

.preset-section {
  margin-bottom: 20px;
}

.preset-section h3 {
  margin-bottom: 10px;
}

.preset-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.preset-btn {
  padding: 8px 16px;
  background: #3a3a3a;
  border: 1px solid #555;
  border-radius: 4px;
  color: white;
  cursor: pointer;
}

.import-export {
  display: flex;
  gap: 10px;
  padding-top: 20px;
  border-top: 1px solid #444;
}

.danger {
  background: #ff6b6b !important;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.modal-content {
  background: #2a2a2a;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  color: white;
}

.modal-content h3 {
  margin-top: 0;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #aaa;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px;
  background: #3a3a3a;
  border: 1px solid #555;
  border-radius: 4px;
  color: white;
}

.key-recorder {
  padding: 15px;
  background: #3a3a3a;
  border: 1px solid #555;
  border-radius: 4px;
  text-align: center;
  cursor: pointer;
}

.icon-picker,
.color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.icon-option {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3a3a3a;
  border: 1px solid #555;
  border-radius: 4px;
  cursor: pointer;
  font-size: 20px;
}

.icon-option.selected {
  border-color: #66a6ff;
}

.color-option {
  width: 30px;
  height: 30px;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
}

.color-option.selected {
  border-color: white;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.test-btn,
.save-btn,
.cancel-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.test-btn {
  background: #45b7d1;
  color: white;
}

.save-btn {
  background: #4ecdc4;
  color: white;
}

.cancel-btn {
  background: #555;
  color: white;
}
</style>