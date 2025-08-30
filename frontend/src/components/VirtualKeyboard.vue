<template>
  <div v-if="visible" class="virtual-keyboard">
    <div class="keyboard-container">
      <!-- Function Keys Row -->
      <div class="keyboard-row function-row">
        <KeyboardButton
          v-for="key in functionKeys"
          :key="key.code"
          :label="key.label"
          :code="key.code"
          :size="'small'"
          @keypress="handleKeyPress"
        />
      </div>

      <!-- Number Row -->
      <div class="keyboard-row number-row">
        <KeyboardButton
          v-for="key in numberKeys"
          :key="key.code"
          :label="key.label"
          :code="key.code"
          :shifted="key.shifted"
          @keypress="handleKeyPress"
        />
      </div>

      <!-- QWERTY Rows -->
      <div class="keyboard-row qwerty-row-1">
        <KeyboardButton
          v-for="key in qwertyRow1"
          :key="key.code"
          :label="key.label"
          :code="key.code"
          :shifted="key.shifted"
          @keypress="handleKeyPress"
        />
      </div>

      <div class="keyboard-row qwerty-row-2">
        <KeyboardButton
          v-for="key in qwertyRow2"
          :key="key.code"
          :label="key.label"
          :code="key.code"
          :shifted="key.shifted"
          @keypress="handleKeyPress"
        />
      </div>

      <div class="keyboard-row qwerty-row-3">
        <KeyboardButton
          v-for="key in qwertyRow3"
          :key="key.code"
          :label="key.label"
          :code="key.code"
          :shifted="key.shifted"
          @keypress="handleKeyPress"
        />
      </div>

      <!-- Terminal Special Keys Row -->
      <div class="keyboard-row terminal-row">
        <KeyboardButton
          v-for="key in terminalKeys"
          :key="key.code + (key.modifier || '')"
          :label="key.label"
          :code="key.code"
          :size="'small'"
          :modifier="key.modifier"
          @keypress="handleTerminalKey"
        />
      </div>

      <!-- Arrow Keys Row -->
      <div class="keyboard-row arrow-row">
        <KeyboardButton
          label="Home"
          code="Home"
          :size="'small'"
          @keypress="handleKeyPress"
        />
        <KeyboardButton
          label="PgUp"
          code="PageUp"
          :size="'small'"
          @keypress="handleKeyPress"
        />
        <KeyboardButton
          label="PgDn"
          code="PageDown"
          :size="'small'"
          @keypress="handleKeyPress"
        />
        <KeyboardButton
          label="End"
          code="End"
          :size="'small'"
          @keypress="handleKeyPress"
        />
        <div class="arrow-cluster">
          <KeyboardButton
            label="↑"
            code="ArrowUp"
            :size="'small'"
            @keypress="handleKeyPress"
          />
          <div class="arrow-bottom">
            <KeyboardButton
              label="←"
              code="ArrowLeft"
              :size="'small'"
              @keypress="handleKeyPress"
            />
            <KeyboardButton
              label="↓"
              code="ArrowDown"
              :size="'small'"
              @keypress="handleKeyPress"
            />
            <KeyboardButton
              label="→"
              code="ArrowRight"
              :size="'small'"
              @keypress="handleKeyPress"
            />
          </div>
        </div>
      </div>

      <!-- Bottom Row with Modifiers -->
      <div class="keyboard-row bottom-row">
        <KeyboardButton
          label="Ctrl"
          code="Control"
          :size="'medium'"
          :active="modifiers.ctrl"
          @keypress="toggleModifier('ctrl')"
        />
        <KeyboardButton
          label="Alt"
          code="Alt"
          :size="'small'"
          :active="modifiers.alt"
          @keypress="toggleModifier('alt')"
        />
        <KeyboardButton
          label="Space"
          code="Space"
          :size="'space'"
          @keypress="handleKeyPress"
        />
        <KeyboardButton
          label="Meta"
          code="Meta"
          :size="'small'"
          :active="modifiers.meta"
          @keypress="toggleModifier('meta')"
        />
        <KeyboardButton
          label="⇧"
          code="Shift"
          :size="'medium'"
          :active="modifiers.shift"
          @keypress="toggleModifier('shift')"
        />
      </div>

      <!-- Custom Shortcuts Row -->
      <div v-if="shortcuts.length > 0" class="keyboard-row shortcuts-row">
        <KeyboardButton
          v-for="shortcut in shortcuts"
          :key="shortcut.id"
          :label="shortcut.label"
          :code="shortcut.code"
          :color="shortcut.color"
          :icon="shortcut.icon"
          :size="shortcut.size || 'medium'"
          @keypress="executeShortcut(shortcut)"
        />
      </div>
    </div>

    <!-- Keyboard Controls -->
    <div class="keyboard-controls">
      <button @click="toggleKeyboard" class="control-btn" title="Toggle Keyboard">
        <span>⌨️</span>
      </button>
      <button @click="openShortcutEditor" class="control-btn" title="Edit Shortcuts">
        <span>⚙️</span>
      </button>
      <button @click="showMacroRecorder = !showMacroRecorder" class="control-btn" title="Macro Recorder">
        <span>⏺️</span>
      </button>
    </div>
    
    <!-- Macro Recorder -->
    <div v-if="showMacroRecorder" class="macro-recorder-container">
      <MacroRecorder
        @play="playMacroKeys"
        @save="saveMacro"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import KeyboardButton from './KeyboardButton.vue'
import MacroRecorder from './MacroRecorder.vue'
import { useShortcutsStore } from '../stores/shortcuts'

const emit = defineEmits<{
  keypress: [event: KeyboardEvent]
  shortcut: [shortcut: any]
}>()

const shortcutsStore = useShortcutsStore()
const shortcuts = computed(() => shortcutsStore.activeShortcuts)

const visible = ref(true)
const showMacroRecorder = ref(false)
const modifiers = ref({
  shift: false,
  ctrl: false,
  alt: false,
  meta: false
})

// Keyboard Layout Data
const functionKeys = [
  { label: 'Esc', code: 'Escape' },
  { label: 'F1', code: 'F1' },
  { label: 'F2', code: 'F2' },
  { label: 'F3', code: 'F3' },
  { label: 'F4', code: 'F4' },
  { label: 'F5', code: 'F5' },
  { label: 'F6', code: 'F6' },
  { label: 'F7', code: 'F7' },
  { label: 'F8', code: 'F8' },
  { label: 'F9', code: 'F9' },
  { label: 'F10', code: 'F10' },
  { label: 'F11', code: 'F11' },
  { label: 'F12', code: 'F12' }
]

const numberKeys = [
  { label: '`', code: 'Backquote', shifted: '~' },
  { label: '1', code: 'Digit1', shifted: '!' },
  { label: '2', code: 'Digit2', shifted: '@' },
  { label: '3', code: 'Digit3', shifted: '#' },
  { label: '4', code: 'Digit4', shifted: '$' },
  { label: '5', code: 'Digit5', shifted: '%' },
  { label: '6', code: 'Digit6', shifted: '^' },
  { label: '7', code: 'Digit7', shifted: '&' },
  { label: '8', code: 'Digit8', shifted: '*' },
  { label: '9', code: 'Digit9', shifted: '(' },
  { label: '0', code: 'Digit0', shifted: ')' },
  { label: '-', code: 'Minus', shifted: '_' },
  { label: '=', code: 'Equal', shifted: '+' },
  { label: '←', code: 'Backspace' }
]

const qwertyRow1 = [
  { label: 'Tab', code: 'Tab' },
  { label: 'Q', code: 'KeyQ' },
  { label: 'W', code: 'KeyW' },
  { label: 'E', code: 'KeyE' },
  { label: 'R', code: 'KeyR' },
  { label: 'T', code: 'KeyT' },
  { label: 'Y', code: 'KeyY' },
  { label: 'U', code: 'KeyU' },
  { label: 'I', code: 'KeyI' },
  { label: 'O', code: 'KeyO' },
  { label: 'P', code: 'KeyP' },
  { label: '[', code: 'BracketLeft', shifted: '{' },
  { label: ']', code: 'BracketRight', shifted: '}' },
  { label: '\\', code: 'Backslash', shifted: '|' }
]

const qwertyRow2 = [
  { label: 'Caps', code: 'CapsLock' },
  { label: 'A', code: 'KeyA' },
  { label: 'S', code: 'KeyS' },
  { label: 'D', code: 'KeyD' },
  { label: 'F', code: 'KeyF' },
  { label: 'G', code: 'KeyG' },
  { label: 'H', code: 'KeyH' },
  { label: 'J', code: 'KeyJ' },
  { label: 'K', code: 'KeyK' },
  { label: 'L', code: 'KeyL' },
  { label: ';', code: 'Semicolon', shifted: ':' },
  { label: "'", code: 'Quote', shifted: '"' },
  { label: '↵', code: 'Enter' }
]

const qwertyRow3 = [
  { label: 'Shift', code: 'ShiftLeft' },
  { label: 'Z', code: 'KeyZ' },
  { label: 'X', code: 'KeyX' },
  { label: 'C', code: 'KeyC' },
  { label: 'V', code: 'KeyV' },
  { label: 'B', code: 'KeyB' },
  { label: 'N', code: 'KeyN' },
  { label: 'M', code: 'KeyM' },
  { label: ',', code: 'Comma', shifted: '<' },
  { label: '.', code: 'Period', shifted: '>' },
  { label: '/', code: 'Slash', shifted: '?' },
  { label: 'Del', code: 'Delete' },
  { label: 'Shift', code: 'ShiftRight' }
]

// Terminal-specific keys missing from iPhone
const terminalKeys = [
  { label: '|', code: 'Pipe' },
  { label: '&', code: 'Ampersand' }, 
  { label: '>', code: 'Greater' },
  { label: '<', code: 'Less' },
  { label: '`', code: 'Backquote' },
  { label: '~', code: 'Tilde' },
  { label: '^C', code: 'KeyC', modifier: 'ctrl' },
  { label: '^Z', code: 'KeyZ', modifier: 'ctrl' },
  { label: '^D', code: 'KeyD', modifier: 'ctrl' }
]

function handleKeyPress(event: { code: string; key?: string }) {
  const keyEvent = new KeyboardEvent('keydown', {
    code: event.code,
    key: event.key || event.code,
    shiftKey: modifiers.value.shift,
    ctrlKey: modifiers.value.ctrl,
    altKey: modifiers.value.alt,
    metaKey: modifiers.value.meta,
    bubbles: true
  })
  
  emit('keypress', keyEvent)
  
  // Reset modifiers after key press (except shift for continuous typing)
  if (event.code !== 'Shift' && event.code !== 'ShiftLeft' && event.code !== 'ShiftRight') {
    if (modifiers.value.ctrl) modifiers.value.ctrl = false
    if (modifiers.value.alt) modifiers.value.alt = false
    if (modifiers.value.meta) modifiers.value.meta = false
  }
}

function handleTerminalKey(event: { code: string; key?: string; modifier?: string }) {
  if (event.modifier) {
    // Handle preset modifier combinations like ^C, ^Z, ^D
    const keyEvent = new KeyboardEvent('keydown', {
      code: event.code,
      key: event.key || event.code,
      ctrlKey: event.modifier === 'ctrl',
      altKey: event.modifier === 'alt',
      metaKey: event.modifier === 'meta',
      shiftKey: event.modifier === 'shift',
      bubbles: true
    })
    emit('keypress', keyEvent)
  } else {
    // Handle special characters
    let key = ''
    switch (event.code) {
      case 'Pipe': key = '|'; break
      case 'Ampersand': key = '&'; break
      case 'Greater': key = '>'; break
      case 'Less': key = '<'; break
      case 'Backquote': key = '`'; break
      case 'Tilde': key = '~'; break
      default: key = event.key || event.code
    }
    
    const keyEvent = new KeyboardEvent('keydown', {
      code: event.code,
      key: key,
      shiftKey: modifiers.value.shift,
      ctrlKey: modifiers.value.ctrl,
      altKey: modifiers.value.alt,
      metaKey: modifiers.value.meta,
      bubbles: true
    })
    emit('keypress', keyEvent)
  }
}

function toggleModifier(modifier: keyof typeof modifiers.value) {
  modifiers.value[modifier] = !modifiers.value[modifier]
}

function executeShortcut(shortcut: any) {
  emit('shortcut', shortcut)
}

function toggleKeyboard() {
  visible.value = !visible.value
}

function openShortcutEditor() {
  // Will be implemented with ShortcutEditor component
  console.log('Opening shortcut editor...')
}

function playMacroKeys(keys: any[]) {
  keys.forEach((key, index) => {
    setTimeout(() => {
      const event = new KeyboardEvent('keydown', {
        key: key.key,
        code: key.code,
        ctrlKey: key.modifiers?.ctrl || false,
        altKey: key.modifiers?.alt || false,
        shiftKey: key.modifiers?.shift || false,
        metaKey: key.modifiers?.meta || false,
        bubbles: true
      })
      emit('keypress', event)
    }, index * 50) // Small delay between keys
  })
}

function saveMacro(macro: any) {
  console.log('Macro saved:', macro)
  // Could add to shortcuts store as a special type
}

// Provide haptic feedback on mobile
function triggerHaptic() {
  if ('vibrate' in navigator) {
    navigator.vibrate(10)
  }
}

defineExpose({
  visible,
  toggleKeyboard
})
</script>

<style scoped>
.virtual-keyboard {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #1e1e1e;
  border-top: 2px solid #333;
  z-index: 1000;
  user-select: none;
}

.keyboard-container {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.keyboard-row {
  display: flex;
  gap: 3px;
  justify-content: center;
}

.function-row {
  margin-bottom: 10px;
}

.terminal-row {
  margin-bottom: 5px;
  padding-bottom: 5px;
  border-bottom: 1px solid #333;
}

.arrow-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 5px;
}

.arrow-cluster {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  margin-left: auto;
}

.arrow-bottom {
  display: flex;
  gap: 2px;
}

.shortcuts-row {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #444;
}

.keyboard-controls {
  position: absolute;
  top: -40px;
  right: 10px;
  display: flex;
  gap: 10px;
}

.control-btn {
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background: #2a2a2a;
  border: 1px solid #444;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;
}

.control-btn:hover {
  background: #3a3a3a;
}

.control-btn:active {
  background: #1a1a1a;
}

.macro-recorder-container {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 10px;
  width: 400px;
  max-width: 90vw;
  z-index: 1001;
}

@media (max-width: 768px) {
  .macro-recorder-container {
    width: 100%;
    left: 0;
    right: 0;
  }
  
  .virtual-keyboard {
    max-height: 50vh; /* Limit keyboard height on mobile */
    overflow-y: auto;
  }
  
  .keyboard-container {
    padding: 8px 4px; /* Better padding for mobile */
    gap: 4px; /* Tighter spacing */
  }
  
  .keyboard-row {
    gap: 2px; /* Tighter key spacing on mobile */
  }
  
  .function-row {
    margin-bottom: 6px; /* Less margin on mobile */
  }
  
  /* Hide function keys on mobile to save space */
  .function-row {
    display: none;
  }
  
  .shortcuts-row {
    margin-top: 6px;
    padding-top: 6px;
  }
  
  .keyboard-row {
    gap: 2px;
  }
  
  .function-row {
    display: none;
  }
}

@media (orientation: landscape) and (max-height: 500px) {
  .virtual-keyboard {
    max-height: 50vh;
    overflow-y: auto;
  }
}
</style>